import { describe, expect, it } from 'vitest';
import { openingMissions } from '../src/levels/opening';
import { createMission, missions } from '../src/levels/missions';
import type { Simulation } from '../src/core/simulation';
import { build, clearEnemies, go, work } from './helpers/campaign-play';

const solutions: ((s: Simulation) => void)[] = [
  s => {
    expect(s.blueprints.scout).toBeUndefined(); go(s, 'duck', { x: 4, y: 3 });
    go(s, 'duck', { x: 4, y: 2 }); const scout = build(s, 'scout', { x: 4, y: 4 });
    go(s, scout, s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    expect(s.preview(scout, s.setup.bonus!.cell)).toBeNull(); go(s, 'duck', s.setup.bonus!.cell);
  },
  s => {
    expect(s.preview('scout', s.setup.goals![0].cell)).toBeNull();
    go(s, 'scout', { x: 3, y: 4 }); const trail = build(s, 'trailbuggy', { x: 4, y: 5 });
    go(s, trail, s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    expect(s.preview('scout', s.setup.bonus!.cell)).toBeNull();
    go(s, trail, { x: 12, y: 5 }); go(s, trail, { x: 12, y: 4 });
    const dozer = build(s, 'dozer', { x: 13, y: 6 });
    work(s, dozer, 'push', { x: 7, y: 8 }); work(s, dozer, 'push', { x: 6, y: 8 });
    go(s, dozer, { x: 11, y: 7 }); go(s, 'scout', s.setup.bonus!.cell);
  },
  s => {
    expect(s.preview('snail', s.setup.goals![0].cell)).toBeNull();
    work(s, 'scoop', 'dig', { x: 5, y: 7 }); work(s, 'scoop', 'fill', { x: 7, y: 5 });
    go(s, 'scoop', { x: 6, y: 6 }); go(s, 'snail', s.setup.goals![0].cell);
    expect(s.mainComplete).toBe(true); go(s, 'snail', { x: 10, y: 6 }); go(s, 'snail', { x: 8, y: 6 });
    expect(s.dismantle('snail').ok).toBe(true); const fish = build(s, 'fish', { x: 7, y: 6 });
    expect(s.preview(fish, s.setup.bonus!.cell)).toBeNull();
    work(s, 'scoop', 'dig', { x: 7, y: 5 }); go(s, fish, s.setup.bonus!.cell);
  },
  s => {
    go(s, 'scout', { x: 3, y: 4 }); const dozer = build(s, 'dozer', { x: 5, y: 4 });
    go(s, 'scout', { x: 2, y: 2 }); expect(s.preview(dozer, s.setup.goals![0].cell)).toBeNull();
    work(s, dozer, 'push', { x: 6, y: 4 }); work(s, dozer, 'push', { x: 7, y: 4 });
    go(s, dozer, s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    go(s, dozer, { x: 11, y: 5 }); go(s, dozer, { x: 10, y: 6 });
    expect(s.dismantle(dozer).ok).toBe(true); const scoop = build(s, 'scoop', { x: 10, y: 6 });
    expect(s.preview(scoop, s.setup.bonus!.cell)).toBeNull();
    work(s, scoop, 'dig', { x: 9, y: 6 }); work(s, scoop, 'fill', { x: 10, y: 8 });
    go(s, scoop, s.setup.bonus!.cell);
  },
  s => {
    go(s, 'duck', { x: 4, y: 4 }); go(s, 'duck', { x: 4, y: 5 });
    expect(s.buildPreview('trailbuggy', { x: 4, y: 5 }).ok).toBe(false);
    expect(s.dismantle('duck').ok).toBe(true); const trail = build(s, 'trailbuggy', { x: 4, y: 5 });
    go(s, trail, s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    go(s, trail, { x: 11, y: 3 }); go(s, trail, { x: 11, y: 5 });
    expect(s.dismantle(trail).ok).toBe(true);
    build(s, 'duck', s.setup.bonus!.cell); // Diagonal construction directly on an unreachable water goal.
  },
  s => {
    go(s, 'carrier', { x: 3, y: 5 }); work(s, 'carrier', 'pickup', { x: 3, y: 4 });
    expect(s.orderCargo('carrier', 'pickup', { x: 10, y: 4 }).ok).toBe(false);
    work(s, 'carrier', 'drop', { x: 11, y: 6 }); go(s, 'carrier', { x: 10, y: 9 });
    const lift = build(s, 'forklift', { x: 11, y: 5 }); go(s, lift, s.setup.goals![0].cell);
    expect(s.mainComplete).toBe(true); go(s, lift, { x: 12, y: 7 });
    work(s, lift, 'pickup', { x: 5, y: 9 }); work(s, lift, 'drop', { x: 13, y: 5 });
    go(s, lift, { x: 12, y: 5 }); expect(s.dismantle(lift).ok).toBe(true);
    const arbor = build(s, 'arborbot', { x: 13, y: 5 });
    expect(s.preview(arbor, s.setup.bonus!.cell)).toBeNull();
    work(s, arbor, 'uproot', { x: 13, y: 4 }); go(s, arbor, s.setup.bonus!.cell);
  },
  s => {
    expect(s.move('stranded', s.setup.goals![0].cell).ok).toBe(false);
    expect(s.piles.flatMap(p => p.supplies.batteries)).toEqual([]);
    go(s, 'carrier', { x: 13, y: 3 }); expect(s.dismantle('carrier').ok).toBe(true);
    expect(s.replaceBattery('stranded').ok).toBe(true); go(s, 'stranded', s.setup.goals![0].cell);
    expect(s.mainComplete).toBe(true); go(s, 'stranded', { x: 5, y: 3 }); go(s, 'stranded', { x: 4, y: 3 });
    const charge = s.unit('stranded').battery; expect(s.dismantle('stranded').ok).toBe(true);
    const guard = build(s, 'warden', { x: 4, y: 3 }); expect(s.unit(guard).battery).toBe(charge);
    clearEnemies(s, [guard]); go(s, guard, s.setup.bonus!.cell);
  },
];

describe('opening puzzles', () => {
  it.each(openingMissions.map((mission, i) => [mission.name, mission, i] as const))('%s has a public-command main and a different bonus solution', (_name, mission, i) => {
    const s = createMission(mission);
    expect(s.mainComplete).toBe(false); expect(s.bonusReached).toBe(false);
    expect(s.visibleBlueprints.every(p => !p.afterMain)).toBe(true);
    solutions[i](s);
    expect(s.mainComplete).toBe(true); expect(s.bonusReached).toBe(true);
    expect(Object.values(s.blueprints).every(n => n! >= 0)).toBe(true);
    expect(createMission(mission).blueprints).toEqual({});
    expect(missions[i].id).toBe(mission.id);
  });
});
