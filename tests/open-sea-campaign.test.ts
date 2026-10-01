import { describe, expect, it } from 'vitest';
import { seaMissions } from '../src/levels/open-sea';
import { createMission, missions } from '../src/levels/missions';
import type { Simulation } from '../src/core/simulation';
import { build, clearEnemies, defeat, deliver, go, refuel, work, until } from './helpers/campaign-play';

const solutions: Record<string, (s: Simulation) => void> = {
  'tidepool-trail': s => {
    expect(s.move('frog', s.setup.goals![0].cell).ok).toBe(false);
    clearEnemies(s, ['patrol']); go(s, 'patrol', { x: 10, y: 2 });
    work(s, 'tug', 'pickup', { x: 8, y: 3 }); work(s, 'tug', 'drop', { x: 8, y: 7 });
    expect(s.replaceBattery('frog').ok).toBe(true); go(s, 'frog', s.setup.goals![0].cell);
    expect(s.mainComplete).toBe(true); go(s, 'duck', s.setup.bonus!.cell);
  },
  'reef-courier': s => {
    for (let i = 0; i < 2; i++) {
      go(s, 'tug', { x: 8, y: 6 }); refuel(s, 'tug');
      work(s, 'tug', 'pickup', { x: 6, y: 7 }); work(s, 'tug', 'drop', { x: 15, y: 6 });
    }
    const ship = build(s, 'freighter', { x: 14, y: 5 }); go(s, ship, s.setup.goals![0].cell);
    expect(s.mainComplete).toBe(true); deliver(s, ship, { x: 6, y: 9 }, s.setup.bonus!.cell);
  },
  'deepwater-maze': s => {
    expect(s.preview('fish', s.setup.goals![0].cell)).toBeNull();
    for (const [dig, fill] of [[{ x: 5, y: 7 }, { x: 8, y: 11 }], [{ x: 10, y: 7 }, { x: 9, y: 11 }], [{ x: 15, y: 7 }, { x: 10, y: 11 }]]) {
      work(s, 'scoop', 'dig', dig); work(s, 'scoop', 'fill', fill);
    }
    go(s, 'scoop', { x: 6, y: 10 }); go(s, 'fish', s.setup.goals![0].cell);
    expect(s.mainComplete).toBe(true); deliver(s, 'tug', { x: 7, y: 12 }, s.setup.bonus!.cell);
  },
  'marina-relay': s => {
    expect(s.move('freighter', s.setup.goals![0].cell).ok).toBe(false);
    for (let i = 0; i < 2; i++) { work(s, 'tug', 'pickup', { x: 6, y: 6 }); work(s, 'tug', 'drop', { x: 15, y: 6 }); }
    go(s, 'tug', { x: 13, y: 5 }); build(s, 'marina', { x: 14, y: 6 }); refuel(s, 'freighter');
    go(s, 'freighter', s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    deliver(s, 'freighter', { x: 6, y: 9 }, s.setup.bonus!.cell);
  },
  'harbor-run': s => {
    const guard = build(s, 'warden', { x: 17, y: 2 }); clearEnemies(s, [guard, 'patrol']);
    deliver(s, 'freighter', { x: 6, y: 7 }, s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    const source = s.piles.find(p => p.supplies.blue >= 5)!; expect(source).toBeDefined();
    deliver(s, 'freighter', { ...source.cell }, s.setup.bonus!.cell);
  },
  'wreck-recovery': s => {
    defeat(s, 'patrol', 'wreck-crab'); const crab = s.piles.find(p => p.supplies.blue === 3)!;
    expect(crab).toBeDefined(); const source = { ...crab.cell };
    go(s, 'patrol', { x: 8, y: 8 }); refuel(s, 'patrol'); defeat(s, 'patrol', 'wreck-shark');
    go(s, 'patrol', { x: 8, y: 8 }); refuel(s, 'patrol');
    work(s, 'tug', 'pickup', source); work(s, 'tug', 'drop', { x: 16, y: 2 });
    expect(s.replaceBattery('wreck').ok).toBe(true); go(s, 'wreck', s.setup.goals![0].cell);
    expect(s.mainComplete).toBe(true); const shark = s.piles.find(p => p.supplies.blue === 5)!;
    deliver(s, 'wreck', { ...shark.cell }, s.setup.bonus!.cell);
  },
  'canal-foundry': s => {
    expect(s.preview('tug', { x: 13, y: 7 })).toBeNull();
    work(s, 'scoop', 'dig', { x: 6, y: 7 }); work(s, 'scoop', 'fill', { x: 3, y: 11 });
    work(s, 'scoop', 'dig', { x: 11, y: 7 }); work(s, 'scoop', 'fill', { x: 4, y: 11 });
    for (let i = 0; i < 2; i++) { work(s, 'tug', 'pickup', { x: 2, y: 5 }); work(s, 'tug', 'drop', { x: 12, y: 6 }); }
    const patrol = build(s, 'patrolboat', { x: 13, y: 7 }); clearEnemies(s, [patrol]);
    go(s, patrol, s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    go(s, patrol, { x: 14, y: 6 }); expect(s.dismantle(patrol).ok).toBe(true);
    build(s, 'marina', { x: 14, y: 7 }); go(s, 'tug', { x: 13, y: 7 }); refuel(s, 'tug');
    deliver(s, 'tug', { x: 2, y: 9 }, s.setup.bonus!.cell);
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
    const sources = s.piles.filter(p => p.supplies.green >= 4 || p.supplies.batteries.some(c => c > 0)).map(p => ({ ...p.cell }));
    for (const source of sources) deliver(s, 'tug', source, s.setup.bonus!.cell);
  },
  'island-handoffs': s => {
    work(s, 'ship', 'pickup', { x: 6, y: 5 }); work(s, 'ship', 'drop', { x: 15, y: 7 });
    const carrier = build(s, 'forklift', { x: 16, y: 7 });
    for (let i = 0; i < 2; i++) {
      go(s, 'ship', { x: 13, y: 6 }); refuel(s, 'ship');
      work(s, 'ship', 'pickup', { x: 6, y: 8 });
      // Check a loaded ship: an empty hold would reject even an ordinary shore target.
      expect(s.cargoOrderPreview('ship', 'drop', s.setup.goals![0].cell).ok).toBe(false);
      work(s, 'ship', 'drop', { x: 15, y: 8 });
    }
    for (let i = 0; i < 3; i++) {
      go(s, carrier, { x: 16, y: 7 }); refuel(s, carrier);
      work(s, carrier, 'pickup', { x: 15, y: 8 }); work(s, carrier, 'drop', s.setup.goals![0].cell);
    }
    expect(s.mainComplete).toBe(true); go(s, 'ship', { x: 13, y: 6 }); refuel(s, 'ship');
    work(s, 'ship', 'pickup', { x: 6, y: 10 }); work(s, 'ship', 'drop', { x: 15, y: 10 });
    go(s, carrier, { x: 16, y: 7 }); refuel(s, carrier); deliver(s, carrier, { x: 15, y: 10 }, s.setup.bonus!.cell);
  },
  'storm-line': s => {
    build(s, 'marina', { x: 6, y: 3 }); build(s, 'marina', { x: 6, y: 11 });
    refuel(s, 'north'); refuel(s, 'south');
    defeat(s, 'north', 'north-a'); defeat(s, 'north', 'north-b'); go(s, 'north', { x: 10, y: 1 });
    defeat(s, 'south', 'south-a'); go(s, 'south', { x: 7, y: 11 }); refuel(s, 'south');
    defeat(s, 'south', 'south-b'); go(s, 'south', s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    const sources = s.piles.filter(p => p.supplies.blue).map(p => ({ ...p.cell }));
    for (const source of sources) {
      for (let i = 0; s.pileAt(source) && i < 10; i++) {
        go(s, 'tug', { x: 7, y: 3 }); refuel(s, 'tug');
        go(s, 'tug', { x: 7, y: source.y < 7 ? 3 : 11 }); refuel(s, 'tug');
        work(s, 'tug', 'pickup', source); work(s, 'tug', 'drop', s.setup.bonus!.cell);
      }
    }
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
    work(s, 'freighter', 'pickup', { x: 6, y: 9 }); work(s, 'freighter', 'pickup', reserve);
    work(s, 'freighter', 'drop', s.setup.bonus!.cell);
  },
  'three-tides': s => {
    const guard = build(s, 'warden', { x: 21, y: 2 });
    // Clear shore first while patrols hold their starting channels.
    defeat(s, guard, 'final-gator'); go(s, guard, { x: 21, y: 4 });
    work(s, 'arborbot', 'uproot', { x: 10, y: 7 }); work(s, 'arborbot', 'plant', { x: 8, y: 6 });
    go(s, 'arborbot', { x: 6, y: 6 }); go(s, 'dozer', { x: 10, y: 9 });
    work(s, 'dozer', 'push', { x: 10, y: 8 }); work(s, 'dozer', 'push', { x: 10, y: 7 }); go(s, 'dozer', { x: 7, y: 9 });
    work(s, 'scoop', 'dig', { x: 10, y: 7 }); work(s, 'scoop', 'fill', { x: 13, y: 16 });
    work(s, 'scoop', 'dig', { x: 10, y: 8 }); work(s, 'scoop', 'fill', { x: 14, y: 16 }); go(s, 'scoop', { x: 9, y: 15 });
    go(s, 'patrol-a', { x: 10, y: 10 }); refuel(s, 'patrol-a');
    go(s, 'patrol-b', { x: 16, y: 11 }); refuel(s, 'patrol-b');
    clearEnemies(s, ['patrol-a', 'patrol-b']);
    work(s, 'ship', 'pickup', { x: 9, y: 7 }); work(s, 'ship', 'drop', { x: 18, y: 8 });
    const carrier = build(s, 'forklift', { x: 19, y: 8 });
    go(s, 'ship', { x: 16, y: 11 }); refuel(s, 'ship'); work(s, 'ship', 'pickup', { x: 9, y: 8 });
    const crab = { ...s.piles.find(p => p.supplies.blue === 3)!.cell }; work(s, 'ship', 'pickup', crab);
    work(s, 'ship', 'drop', { x: 18, y: 9 });
    const gator = { ...s.piles.find(p => p.supplies.green === 4)!.cell };
    for (const source of [{ x: 18, y: 9 }, gator]) {
      for (let i = 0; s.pileAt(source) && i < 10; i++) {
        go(s, carrier, { x: 19, y: 10 }); refuel(s, carrier);
        work(s, carrier, 'pickup', source); work(s, carrier, 'drop', s.setup.goals![0].cell);
      }
    }
    expect(s.mainComplete).toBe(true); go(s, 'arborbot', s.setup.bonus!.cell);
  },
};

describe('authored Open Sea campaign', () => {
  it.each(seaMissions.map(m => [m.id, missions.find(canonical => canonical.id === m.id)!] as const))('%s: completes main before bonus using actual supplies and automatic combat', (id, mission) => {
    const s = createMission(mission); expect(s.mainComplete).toBe(false); expect(s.bonusUnlocked).toBe(false);
    solutions[id](s); expect(s.mainComplete).toBe(true); expect(s.bonusReached).toBe(true);
    expect(s.units.every(u => u.battery >= 0 && u.battery <= 100)).toBe(true);
    const fresh = createMission(mission); expect(fresh.grid.tiles).toEqual(mission.grid.tiles); expect(fresh.mainComplete).toBe(false);
  });
});
