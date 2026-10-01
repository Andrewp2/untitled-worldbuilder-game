import { describe, expect, it } from 'vitest';
import { sunstoneAdditions } from '../src/levels/sunstone-range';
import { createMission, missions } from '../src/levels/missions';
import type { Simulation } from '../src/core/simulation';
import { build, clearEnemies, defeat, deliver, go, refuel, settled, work } from './helpers/campaign-play';

const solutions: Record<string, (s: Simulation) => void> = {
  'ridge-post': s => {
    for (let i = 0; i < 2; i++) { work(s, 'courier', 'pickup', { x: 4, y: 5 }); work(s, 'courier', 'drop', { x: 13, y: 6 }); }
    const guard = build(s, 'warden', { x: 14, y: 6 }); go(s, 'courier', { x: 12, y: 7 });
    clearEnemies(s, [guard]); go(s, guard, s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    go(s, guard, { x: 17, y: 4 }); expect(s.dismantle(guard).ok).toBe(true);
    const salvage = s.piles.find(p => p.supplies.red === 3)!; expect(salvage).toBeDefined();
    deliver(s, 'courier', { ...salvage.cell }, { x: 16, y: 4 });
    const hauler = build(s, 'hauler', { x: 16, y: 3 }); go(s, hauler, s.setup.bonus!.cell);

  },
  mudline: s => {
    // The intentional direct-route failure establishes the energy decision.
    const direct = createMission(sunstoneAdditions.find(m => m.id === 'mudline')!);
    expect(direct.move('driver', direct.setup.goals![0].cell).ok).toBe(true); direct.step(30);
    expect(direct.mainComplete).toBe(false); expect(direct.unit('driver').battery).toBeLessThan(3);
    go(s, 'driver', { x: 3, y: 3 }); go(s, 'driver', { x: 15, y: 3 }); go(s, 'driver', s.setup.goals![0].cell);
    expect(s.mainComplete).toBe(true);
    refuel(s, 'driver'); go(s, 'driver', { x: 15, y: 7 });
    go(s, 'driver', { x: 15, y: 4 }); go(s, 'driver', { x: 4, y: 4 }); go(s, 'driver', { x: 4, y: 3 });
    expect(s.dismantle('driver').ok).toBe(true); const frog = build(s, 'frog', { x: 4, y: 3 }); go(s, frog, s.setup.bonus!.cell);

  },
  'boulder-courtyard': s => {
    expect(s.preview('prisoner', s.setup.goals![0].cell)).toBeNull(); go(s, 'prisoner', { x: 2, y: 3 });
    go(s, 'dozer', { x: 4, y: 3 }); work(s, 'dozer', 'push', { x: 4, y: 2 });
    go(s, 'dozer', { x: 4, y: 2 }); work(s, 'dozer', 'push', { x: 3, y: 2 }); work(s, 'dozer', 'push', { x: 2, y: 2 });
    go(s, 'dozer', { x: 5, y: 3 }); go(s, 'prisoner', s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    go(s, 'carrier', { x: 13, y: 9 }); go(s, 'carrier', { x: 5, y: 4 });
    expect(s.dismantle('carrier').ok).toBe(true); expect(s.dismantle('dozer').ok).toBe(true);
    const trail = build(s, 'trailbuggy', { x: 5, y: 4 }); go(s, trail, s.setup.bonus!.cell);

  },
  'repair-column': s => {
    refuel(s, 'guard'); clearEnemies(s, ['guard'], 120, ['mender']);
    s.stop('mender'); settled(s, 'mender');
    const power=s.piles.find(p=>p.supplies.batteries.some(charge=>charge>0))!;
    go(s,'mender', power.cell); expect(s.replaceBattery('mender').ok).toBe(true);
    go(s, 'guard', s.setup.goals![0].cell); expect(s.mainComplete).toBe(true); go(s, 'mender', s.setup.bonus!.cell);
  },
  'forward-foundry': s => {
    for (let i = 0; i < 2; i++) {
      go(s, 'courier', { x: 3, y: 6 }); refuel(s, 'courier');
      work(s, 'courier', 'pickup', { x: 4, y: 6 }); work(s, 'courier', 'drop', { x: 13, y: 5 });
    }
    build(s, 'workshop', { x: 13, y: 6 }); refuel(s, 'stranded-guard');
    go(s, 'courier', { x: 3, y: 6 }); refuel(s, 'courier');
    clearEnemies(s, ['stranded-guard']); go(s, 'stranded-guard', s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    go(s, 'courier', { x: 8, y: 11 }); go(s, 'courier', { x: 3, y: 6 }); refuel(s, 'courier');
    work(s, 'courier', 'pickup', { x: 4, y: 9 }); work(s, 'courier', 'drop', { x: 8, y: 10 });
    build(s, 'frog', s.setup.bonus!.cell);

  },
  'canyon-rescue': s => {
    clearEnemies(s, ['guardian'], 120, ['mender']);
    s.stop('mender'); settled(s, 'mender');
    go(s, 'guardian', { x: 15, y: 3 }); go(s, 'mender', { x: 15, y: 4 });
    const east = build(s, 'scoop', { x: 14, y: 10 });
    work(s, 'west-worker', 'dig', { x: 6, y: 10 }); work(s, 'west-worker', 'fill', { x: 8, y: 8 });
    work(s, 'west-worker', 'dig', { x: 6, y: 11 }); work(s, 'west-worker', 'fill', { x: 9, y: 8 });
    work(s, east, 'dig', { x: 13, y: 10 }); work(s, east, 'fill', { x: 11, y: 8 });
    work(s, east, 'dig', { x: 13, y: 11 }); work(s, east, 'fill', { x: 10, y: 8 });
    go(s, 'west-worker', { x: 7, y: 7 }); go(s, east, { x: 12, y: 7 });
    go(s, 'snail', s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    go(s, east, { x: 17, y: 12 }); go(s, east, { x: 13, y: 12 });
    expect(s.dismantle(east).ok).toBe(true); const trail = build(s, 'trailbuggy', { x: 13, y: 12 }); go(s, trail, s.setup.bonus!.cell);

  },
  'salvage-chain': s => {
    clearEnemies(s, ['guard'], 120, ['mender']); s.stop('mender'); settled(s, 'mender');
    go(s, 'guard', { x: 3, y: 5 }); go(s, 'mender', { x: 3, y: 6 });
    const salvage = s.piles.find(p => p.supplies.yellow === 4)!;
    expect(salvage).toBeDefined(); const source = { ...salvage.cell };
    deliver(s, 'carrier', { x: 5, y: 3 }, source);
    const site = [{ x: source.x + 1, y: source.y }, { x: source.x, y: source.y + 1 }, { x: source.x - 1, y: source.y }].find(cell => s.buildPreview('dozer', cell).ok)!;
    const dozer = build(s, 'dozer', site);
    work(s, dozer, 'push', { x: 10, y: 8 }); work(s, dozer, 'push', { x: 11, y: 8 });
    go(s, dozer, { x: 13, y: 7 }); go(s, 'snail', s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    go(s, 'snail', { x: 17, y: 10 });
    work(s, 'carrier', 'pickup', { x: 4, y: 10 }); work(s, 'carrier', 'drop', { x: 13, y: 8 });
    expect(s.dismantle(dozer).ok).toBe(true); const frog = build(s, 'frog', { x: 13, y: 8 }); go(s, frog, s.setup.bonus!.cell);

  },
  'two-fronts': s => {
    go(s, 'arborbot', { x: 3, y: 2 });
    go(s, 'mender', { x: 14, y: 5 }); refuel(s, 'east-guard'); go(s, 'mender', { x: 14, y: 4 });
    defeat(s, 'west-guard', 'west-crab'); clearEnemies(s, ['east-guard'], 120, ['mender']);
    refuel(s,'east-guard',90);
    go(s, 'east-guard', s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    work(s, 'arborbot', 'uproot', { x: 8, y: 9 }); work(s, 'arborbot', 'plant', { x: 7, y: 8 });
    work(s, 'arborbot', 'uproot', { x: 12, y: 9 }); work(s, 'arborbot', 'plant', { x: 13, y: 8 });
    go(s, 'arborbot', s.setup.bonus!.cell);
  },
  'power-bridge': s => {
    const carrier = build(s, 'forklift', { x: 5, y: 8 }); expect(s.dismantle('camp-workshop').ok).toBe(true);
    work(s, carrier, 'pickup', { x: 3, y: 6 }); work(s, carrier, 'pickup', { x: 4, y: 5 });
    work(s, carrier, 'pickup', { x: 4, y: 11 });
    work(s, carrier, 'drop', { x: 13, y: 6 }); build(s, 'workshop', { x: 14, y: 6 }); refuel(s, 'stranded-guard');
    work(s, carrier, 'pickup', { x: 13, y: 6 }); work(s, carrier, 'drop', { x: 14, y: 8 });
    expect(s.replaceBattery('stranded-dozer').ok).toBe(true); go(s, carrier, { x: 12, y: 9 });
    clearEnemies(s, ['stranded-guard']);
    go(s, 'stranded-dozer', { x: 13, y: 6 }); work(s, 'stranded-dozer', 'push', { x: 13, y: 5 });
    work(s, 'stranded-dozer', 'push', { x: 13, y: 4 }); go(s, 'stranded-dozer', { x: 15, y: 4 });
    go(s, 'stranded-guard', s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    go(s, 'stranded-guard', { x: 16, y: 4 });
    go(s, carrier, { x: 13, y: 8 }); expect(s.dismantle(carrier).ok).toBe(true);
    const trail = build(s, 'trailbuggy', { x: 13, y: 8 }); go(s, trail, s.setup.bonus!.cell);

  },
  'sunstone-citadel': s => {
    expect(s.preview('arborbot',s.setup.bonus!.cell)).toBeNull();
    work(s, 'arborbot', 'uproot', { x: 8, y: 12 }); work(s, 'arborbot', 'plant', { x: 7, y: 11 });
    go(s, 'arborbot', { x: 6, y: 8 });
    for (const [source, target] of [[{ x: 7, y: 13 }, { x: 9, y: 12 }], [{ x: 6, y: 13 }, { x: 10, y: 12 }], [{ x: 6, y: 14 }, { x: 11, y: 12 }]]) {
      work(s, 'scoop', 'dig', source); work(s, 'scoop', 'fill', target);
    }
    go(s, 'scoop', { x: 8, y: 13 });
    expect(s.dismantle('camp-workshop').ok).toBe(true);
    work(s, 'bulk', 'pickup', { x: 3, y: 4 }); work(s, 'bulk', 'drop', { x: 7, y: 10 });
    build(s, 'workshop', { x: 8, y: 11 }); go(s, 'bulk', { x: 6, y: 10 });
    go(s, 'guard-a', { x: 8, y: 12 }); go(s, 'guard-b', { x: 8, y: 10 });
    go(s, 'mender-a', { x: 7, y: 12 }); go(s, 'mender-b', { x: 7, y: 10 });
    // Lure each predator back to the supplied guard post; do not charge a whole pack alone.
    for (let t = 0; t < 2400 && s.enemies.length; t++) {
      if (t % 10 === 0) {
        const guard = s.unit('guard-a');
        if (!guard.next && !guard.goal) {
          if (s.enemies.some(e => Math.abs(e.cell.x - guard.cell.x) + Math.abs(e.cell.y - guard.cell.y) < 5)) s.move('guard-a', { x: 8, y: 12 });
          else if (guard.battery > 75) s.move('guard-a', { x: 13, y: 12 });
        }
      }
      s.step(.1);
    }
    s.stop('guard-a'); settled(s, 'guard-a'); go(s, 'guard-a', { x: 8, y: 12 });
    refuel(s, 'guard-a'); refuel(s, 'guard-b');
    go(s, 'guard-b', { x: 6, y: 9 }); go(s, 'mender-a', { x: 8, y: 10 }); refuel(s, 'mender-a');
    go(s, 'mender-a', { x: 7, y: 12 }); go(s, 'mender-b', { x: 8, y: 10 }); refuel(s, 'mender-b');
    go(s, 'mender-b', { x: 7, y: 10 }); go(s, 'guard-b', { x: 8, y: 10 }); refuel(s, 'guard-b');
    go(s, 'scoop', { x: 7, y: 14 }); go(s, 'bulk', { x: 4, y: 10 });
    clearEnemies(s, ['guard-a', 'guard-b'], 180, ['mender-a', 'mender-b'], true);
    for(const [id,cell] of [['guard-a',{x:16,y:5}],['guard-b',{x:16,y:4}],['mender-a',{x:15,y:3}],['mender-b',{x:16,y:3}]] as const) if(s.units.some(u=>u.id===id)) go(s,id,cell);
    work(s, 'bulk', 'pickup', { x: 4, y: 10 });
    const rexLoot = s.piles.filter(p => p.supplies.green >= 4).map(p => ({ ...p.cell }));
    expect(rexLoot).toHaveLength(2);
    for (const cell of rexLoot) work(s, 'bulk', 'pickup', cell);
    go(s, 'bulk', s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    work(s,'arborbot','uproot',{x:15,y:12}); go(s, 'arborbot', s.setup.bonus!.cell);
  },
};

describe('authored Sunstone Range additions', () => {
  it.each(sunstoneAdditions.map(m => [m.id, missions.find(canonical => canonical.id === m.id)!] as const))('%s: solves main and bonus without changing stocks or enemy rules', (id, mission) => {
    const s = createMission(mission); expect(s.mainComplete).toBe(false); expect(s.bonusUnlocked).toBe(false);
    expect(solutions[id]).toBeDefined(); solutions[id](s);
    expect(s.mainComplete).toBe(true); expect(s.bonusReached).toBe(true);
    expect(s.units.every(u => u.battery >= 0 && u.battery <= 100)).toBe(true);
    const fresh = createMission(mission); expect(fresh.mainComplete).toBe(false); expect(fresh.grid.tiles).toEqual(mission.grid.tiles);
  });
});
