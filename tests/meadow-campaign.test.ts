import { describe, expect, it } from 'vitest';
import { meadowAdditions } from '../src/levels/meadow-isles';
import { createMission, missions } from '../src/levels/missions';
import type { Simulation } from '../src/core/simulation';
import { build, clearEnemies, deliver, go, refuel, until, work } from './helpers/campaign-play';

const solutions: Record<string, (s: Simulation) => void> = {
  'switchback-stations': s => {
    go(s, 'carrier', { x: 13, y: 1 }); build(s, 'pump', { x: 14, y: 2 });
    go(s, 'carrier', { x: 14, y: 1 }); refuel(s, 'carrier');
    go(s, 'carrier', { x: 13, y: 5 }); build(s, 'pump', { x: 14, y: 6 });
    go(s, 'carrier', { x: 14, y: 5 }); refuel(s, 'carrier');
    go(s, 'carrier', s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    work(s, 'carrier', 'pickup', { x: 2, y: 10 });
    go(s, 'carrier', { x: 14, y: 7 }); refuel(s, 'carrier');
    work(s, 'carrier', 'drop', { x: 15, y: 1 });
    expect(s.replaceBattery('reserve-scout').ok).toBe(true); go(s, 'reserve-scout', s.setup.bonus!.cell);

  },
  'forked-watch': s => {
    build(s, 'sentry', { x: 7, y: 5 }); build(s, 'sentry', { x: 13, y: 11 });
    until(s, () => !s.enemies.length); go(s, 'carrier', s.setup.goals![0].cell);
    expect(s.mainComplete).toBe(true);
    go(s, 'carrier', { x: 14, y: 11 });
    const tower = s.units.find(u => u.kind === 'sentry' && u.cell.x === 7)!;
    expect(s.dismantle(tower.id).ok).toBe(true); const duck = build(s, 'duck', { x: 8, y: 5 });
    go(s, duck, s.setup.bonus!.cell);

  },
  'orchard-convoy': s => {
    expect(s.preview('bulk', s.setup.goals![0].cell)).toBeNull();
    work(s, 'arborbot', 'uproot', { x: 9, y: 7 }); work(s, 'arborbot', 'plant', { x: 8, y: 6 });
    go(s, 'arborbot', { x: 7, y: 8 });
    for (const x of [10, 11, 12]) work(s, 'dozer', 'push', { x, y: 7 });
    go(s, 'dozer', { x: 16, y: 7 });
    work(s, 'bulk', 'pickup', { x: 5, y: 9 }); go(s, 'bulk', s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    work(s, 'arborbot', 'uproot', { x: 14, y: 9 }); go(s, 'arborbot', s.setup.bonus!.cell);

  },
  'meadow-siege': s => {
    expect(s.preview('snail', s.setup.goals![0].cell)).toBeNull();
    work(s, 'arborbot', 'uproot', { x: 8, y: 6 }); work(s, 'arborbot', 'plant', { x: 7, y: 5 });
    go(s, 'arborbot', { x: 6, y: 8 });
    for (const [source, x] of [[{ x: 7, y: 11 }, 9], [{ x: 7, y: 12 }, 10], [{ x: 6, y: 12 }, 11]] as const) {
      work(s, 'scoop', 'dig', source); work(s, 'scoop', 'fill', { x, y: 6 });
    }
    go(s, 'scoop', { x: 8, y: 8 }); clearEnemies(s, ['guard-a', 'guard-b']);
    go(s, 'guard-a', { x: 13, y: 3 }); go(s, 'guard-b', { x: 14, y: 9 });
    go(s, 'snail', s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    go(s, 'snail', { x: 16, y: 4 });
    deliver(s, 'carrier', { x: 6, y: 10 }, { x: 12, y: 10 });
    const frog = build(s, 'frog', { x: 11, y: 10 }); go(s, frog, s.setup.bonus!.cell);

  },
};

describe('authored Meadow Isles additions', () => {
  it.each(meadowAdditions.map(m => [m.id, missions.find(canonical => canonical.id === m.id)!] as const))('%s: solves main, then bonus using public commands and finite resources', (id, mission) => {
    const s = createMission(mission);
    expect(s.mainComplete).toBe(false); expect(s.bonusUnlocked).toBe(false); expect(s.bonusReached).toBe(false);
    expect(solutions[id], 'Every board requires its own demonstrated strategy.').toBeDefined();
    solutions[id](s);
    expect(s.mainComplete).toBe(true); expect(s.bonusReached).toBe(true);
    expect(s.units.every(u => u.battery >= 0 && u.battery <= 100)).toBe(true);
    expect(Object.values(s.blueprints).every(n => n! >= 0)).toBe(true);
    const fresh = createMission(mission);
    expect(fresh.mainComplete).toBe(false); expect(fresh.bonusReached).toBe(false); expect(fresh.grid.tiles).toEqual(mission.grid.tiles);
  });
});
