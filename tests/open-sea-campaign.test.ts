import { openThreeTides } from './helpers/three-tides-play';
import { describe, expect, it } from 'vitest';
import { seaMissions } from '../src/levels/open-sea';
import { createMission, missions } from '../src/levels/missions';
import { cloneSupplies, TERRAIN_ENERGY } from '../src/core/catalog';
import type { Simulation } from '../src/core/simulation';
import { build, clearEnemies, defeat, deliver, go, refuel, work, until } from './helpers/campaign-play';

const solutions: Record<string, (s: Simulation) => void> = {
  'tidepool-trail': s => {
    expect(s.preview('patrol',s.setup.bonus!.cell)).toBeNull();
    expect(s.move('frog', s.setup.goals![0].cell).ok).toBe(false);
    clearEnemies(s, ['patrol']); go(s, 'patrol', { x: 10, y: 2 });
    work(s, 'tug', 'pickup', { x: 8, y: 3 }); work(s, 'tug', 'drop', { x: 8, y: 7 });
    expect(s.replaceBattery('frog').ok).toBe(true); go(s, 'frog', s.setup.goals![0].cell);
    expect(s.mainComplete).toBe(true); go(s, 'duck', {x:6,y:11}); go(s, 'duck', {x:5,y:12});
    expect(s.dismantle('duck').ok).toBe(true); build(s,'fish',s.setup.bonus!.cell);
  },
  'reef-courier': s => {
    for (let i = 0; i < 2; i++) {
      go(s, 'tug', { x: 8, y: 6 }); refuel(s, 'tug');
      work(s, 'tug', 'pickup', { x: 6, y: 7 }); work(s, 'tug', 'drop', { x: 15, y: 6 });
    }
    const ship = build(s, 'freighter', { x: 14, y: 5 }); go(s, ship, s.setup.goals![0].cell);
    expect(s.mainComplete).toBe(true);
    go(s, ship, { x: 14, y: 3 });
    deliver(s, ship, { x: 6, y: 9 }, { x: 15, y: 10 });
    const snail = build(s, 'snail', { x: 15, y: 10 }); go(s, snail, s.setup.bonus!.cell);

  },
  'deepwater-maze': s => {
    expect(s.preview('fish', s.setup.goals![0].cell)).toBeNull();
    for (const [dig, fill] of [[{ x: 5, y: 7 }, { x: 8, y: 11 }], [{ x: 10, y: 7 }, { x: 9, y: 11 }], [{ x: 15, y: 7 }, { x: 10, y: 11 }]]) {
      work(s, 'scoop', 'dig', dig); work(s, 'scoop', 'fill', fill);
    }
    go(s, 'scoop', { x: 6, y: 10 }); go(s, 'fish', s.setup.goals![0].cell);
    expect(s.mainComplete).toBe(true);
    go(s, 'scoop', { x: 6, y: 9 }); go(s, 'scoop', { x: 6, y: 10 });
    expect(s.dismantle('scoop').ok).toBe(true); const duck = build(s, 'duck', { x: 6, y: 10 }); go(s, duck, s.setup.bonus!.cell);

  },
  'marina-relay': s => {
    expect(s.move('freighter', s.setup.goals![0].cell).ok).toBe(false);
    for (let i = 0; i < 2; i++) { work(s, 'tug', 'pickup', { x: 6, y: 6 }); work(s, 'tug', 'drop', { x: 15, y: 6 }); }
    go(s, 'tug', { x: 13, y: 5 }); build(s, 'marina', { x: 14, y: 6 }); refuel(s, 'freighter');
    go(s, 'freighter', s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    go(s, 'freighter', { x: 12, y: 2 });
    deliver(s, 'freighter', { x: 6, y: 9 }, { x: 10, y: 7 }); build(s, 'frog', s.setup.bonus!.cell);

  },
  'harbor-run': s => {
    const guard = build(s, 'warden', { x: 17, y: 2 }); clearEnemies(s, [guard, 'patrol']);
    work(s, 'freighter', 'pickup', { x: 6, y: 7 }); go(s, 'freighter', s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    go(s, 'freighter', { x: 7, y: 9 });
    const source = s.piles.find(p => p.supplies.blue >= 5)!; expect(source).toBeDefined();
    deliver(s, 'freighter', { ...source.cell }, { x: 6, y: 5 }); build(s, 'fish', s.setup.bonus!.cell);

  },
  'wreck-recovery': s => {
    defeat(s, 'patrol', 'wreck-crab'); const crab = s.piles.find(p => p.supplies.blue === 3)!;
    expect(crab).toBeDefined(); const source = { ...crab.cell };
    go(s, 'patrol', { x: 8, y: 8 }); refuel(s, 'patrol'); defeat(s, 'patrol', 'wreck-shark');
    go(s, 'patrol', { x: 8, y: 8 }); refuel(s, 'patrol');
    work(s, 'tug', 'pickup', source); work(s, 'tug', 'drop', { x: 16, y: 2 });
    expect(s.replaceBattery('wreck').ok).toBe(true); go(s, 'wreck', s.setup.goals![0].cell);
    expect(s.mainComplete).toBe(true);
    go(s, 'wreck', { x: 8, y: 6 }); go(s, 'patrol', { x: 11, y: 3 });
    expect(s.dismantle('patrol').ok).toBe(true); const duck = build(s, 'duck', { x: 12, y: 3 }); go(s, duck, s.setup.bonus!.cell);

  },
  'canal-foundry': s => {
    expect(s.preview('tug', { x: 13, y: 7 })).toBeNull();
    work(s, 'scoop', 'dig', { x: 6, y: 7 }); work(s, 'scoop', 'fill', { x: 3, y: 11 });
    work(s, 'scoop', 'dig', { x: 11, y: 7 }); work(s, 'scoop', 'fill', { x: 4, y: 11 });
    for (let i = 0; i < 2; i++) { work(s, 'tug', 'pickup', { x: 2, y: 5 }); work(s, 'tug', 'drop', { x: 12, y: 6 }); }
    const patrol = build(s, 'patrolboat', { x: 13, y: 7 }); clearEnemies(s, [patrol]);
    go(s, patrol, s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    go(s, patrol, { x: 17, y: 6 }); go(s, patrol, { x: 14, y: 6 });
    expect(s.dismantle(patrol).ok).toBe(true); const snail = build(s, 'snail', { x: 15, y: 5 }); go(s, snail, s.setup.bonus!.cell);

  },
  'gator-backwater': s => {
    const a = build(s, 'sentry', { x: 6, y: 9 }), b = build(s, 'sentry', { x: 6, y: 10 });
    go(s, 'tug', { x: 7, y: 6 }); go(s, 'bait', { x: 14, y: 10 }); s.step(2);
    go(s, 'bait', { x: 11, y: 10 }); s.step(1); go(s, 'bait', { x: 8, y: 10 }); s.step(1);
    go(s, 'bait', { x: 5, y: 11 });
    until(s, () => !s.enemies.some(e => e.id === 'gator-a'));
    go(s, 'bait', { x: 6, y: 11 }); expect(s.replaceBattery('bait').ok).toBe(true);
    go(s, 'bait', { x: 13, y: 12 }); s.step(1); go(s, 'bait', { x: 10, y: 12 }); s.step(1);
    go(s, 'bait', { x: 7, y: 12 }); s.step(1); go(s, 'bait', { x: 5, y: 11 });
    clearEnemies(s, [a, b]);
    work(s, 'scoop', 'dig', { x: 5, y: 6 }); work(s, 'scoop', 'fill', { x: 7, y: 14 });
    go(s, 'tug', { x: 8, y: 7 });
    go(s, 'fish', s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    go(s, 'bait', { x: 6, y: 11 }); expect(s.replaceBattery('bait').ok).toBe(true);
    go(s, 'bait', s.setup.bonus!.cell);

  },
  'island-handoffs': s => {
    work(s, 'ship', 'pickup', { x: 6, y: 5 }); work(s, 'ship', 'drop', { x: 15, y: 7 });
    const carrier = build(s, 'dumptruck', { x: 16, y: 7 });
    go(s, 'ship', { x: 13, y: 6 }); refuel(s, 'ship');
    work(s, 'ship', 'pickup', { x: 6, y: 8 });
    expect(s.cargoOrderPreview('ship', 'drop', s.setup.goals![0].cell).ok).toBe(false);
    work(s, 'ship', 'drop', { x: 15, y: 8 }); work(s, carrier, 'pickup', { x: 15, y: 8 });
    go(s, carrier, s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    go(s, carrier, { x: 20, y: 4 }); expect(s.dismantle(carrier).ok).toBe(true);
    const arbor = build(s, 'arborbot', { x: 20, y: 4 }); work(s, arbor, 'uproot', { x: 20, y: 11 }); go(s, arbor, s.setup.bonus!.cell);
  },
  'storm-line': s => {
    build(s, 'marina', { x: 6, y: 3 }); build(s, 'marina', { x: 6, y: 11 });
    refuel(s, 'north'); refuel(s, 'south');
    defeat(s, 'north', 'north-a'); defeat(s, 'north', 'north-b'); go(s, 'north', { x: 10, y: 1 });
    defeat(s, 'south', 'south-a'); go(s, 'south', { x: 7, y: 11 }); refuel(s, 'south');
    defeat(s, 'south', 'south-b'); go(s, 'south', s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    go(s, 'tug', { x: 7, y: 3 }); refuel(s, 'tug');
    go(s, 'tug', { x: 7, y: 11 }); refuel(s, 'tug'); go(s, 'tug', { x: 7, y: 10 });
    go(s, 'tug', { x: 7, y: 3 }); refuel(s, 'tug');
    const source = s.piles.find(p => p.supplies.blue === 3)!;
    work(s, 'tug', 'pickup', source.cell); work(s, 'tug', 'drop', { x: 11, y: 6 }); build(s, 'fish', s.setup.bonus!.cell);

  },
  'last-reserves': s => {
    work(s, 'tug', 'pickup', { x: 6, y: 7 }); work(s, 'tug', 'drop', { x: 9, y: 7 });
    expect(s.replaceBattery('patrol').ok).toBe(true); defeat(s, 'patrol', 'reserve-crab');
    expect(s.replaceBattery('patrol').ok).toBe(true); const reserve = { ...s.unit('patrol').cell };
    defeat(s, 'patrol', 'reserve-shark'); go(s, 'patrol', { x: 7, y: 3 });
    const shark = { ...s.piles.find(p => p.supplies.blue === 5)!.cell };
    work(s, 'tug', 'pickup', shark); work(s, 'tug', 'drop', { x: 9, y: 12 });
    work(s, 'tug', 'pickup', shark); work(s, 'tug', 'drop', { x: 0, y: 9 });
    expect(s.replaceBattery('freighter').ok).toBe(true); go(s, 'freighter', s.setup.goals![0].cell);
    expect(s.mainComplete).toBe(true);
    go(s, 'freighter', { x: 11, y: 2 }); work(s, 'freighter', 'pickup', { x: 6, y: 9 });
    go(s, 'freighter', { x: 6, y: 2 }); expect(s.dismantle('freighter').ok).toBe(true); build(s, 'frog', s.setup.bonus!.cell);

  },
  'three-tides': s => {
    openThreeTides(s);
    work(s, 'ship', 'pickup', { x: 9, y: 7 }); work(s, 'ship', 'drop', { x: 18, y: 8 });
    const carrier = build(s, 'dumptruck', { x: 19, y: 8 });
    go(s, 'ship', { x: 16, y: 11 }); refuel(s, 'ship'); work(s, 'ship', 'pickup', { x: 9, y: 8 });
    const crab = { ...s.piles.find(p => p.supplies.blue >= 3 && p.supplies.batteries.some(charge=>charge>0))!.cell }; work(s, 'ship', 'pickup', crab);
    work(s, 'ship', 'drop', { x: 18, y: 9 });
    const gator = { ...s.piles.find(p => p.supplies.green === 4)!.cell };
    for (const source of [{ x: 18, y: 9 }, gator]) work(s, carrier, 'pickup', source);
    go(s, carrier, s.setup.goals![0].cell);
    expect(s.mainComplete).toBe(true);
    work(s, 'arborbot', 'uproot', { x: 8, y: 6 }); go(s, 'arborbot', s.setup.bonus!.cell);

  },
};

describe('authored Open Sea campaign', () => {
  it('lets Three Tides Dozer combine the two coastal stockpiles', () => {
    const s = createMission(missions.find(mission => mission.id === 'three-tides')!);
    const target = { x: 9, y: 8 }, destination = { x: 9, y: 7 };
    const kit = cloneSupplies(s.pileAt(destination)!.supplies);
    go(s, 'dozer', { x: 9, y: 9 });
    const charge = s.unit('dozer').battery;
    work(s, 'dozer', 'push', target);
    expect(s.pileAt(target)).toBeUndefined();
    expect(s.pileAt(destination)?.supplies).toEqual({ ...kit, green: kit.green + 2 });
    expect(s.unit('dozer').cell).toEqual({ x: 9, y: 9 });
    expect(s.unit('dozer').battery).toBe(charge - TERRAIN_ENERGY);
  });
  it.each(seaMissions.map(m => [m.id, missions.find(canonical => canonical.id === m.id)!] as const))('%s: completes main before bonus using actual supplies and automatic combat', (id, mission) => {
    const s = createMission(mission); expect(s.mainComplete).toBe(false); expect(s.bonusUnlocked).toBe(false);
    solutions[id](s); expect(s.mainComplete).toBe(true); expect(s.bonusReached).toBe(true);
    expect(s.units.every(u => u.battery >= 0 && u.battery <= 100)).toBe(true);
    const fresh = createMission(mission); expect(fresh.grid.tiles).toEqual(mission.grid.tiles); expect(fresh.mainComplete).toBe(false);
  });
});
