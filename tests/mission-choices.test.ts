import { describe, expect, it } from 'vitest';
import { createMission, missions } from '../src/levels/missions';
import { build, go, refuel, work } from './helpers/campaign-play';
import { openThreeTides } from './helpers/three-tides-play';

const play = (id: string) => createMission(missions.find(m => m.id === id)!);

describe('alternative mission plans', () => {
  it('takes the Switchback coast without moving its shortcut rock, then powers and opens the Scout enclosure', () => {
    const s = play('switchback-stations');
    const goal = s.setup.goals![0].cell, home = s.setup.bonus!.cell;
    expect(s.preview('carrier', goal)!.length).toBeGreaterThan(s.unit('carrier').battery);
    build(s, 'pump', { x: 6, y: 6 });
    go(s, 'carrier', { x: 6, y: 5 });
    refuel(s, 'carrier'); refuel(s, 'gate-dozer');
    expect(s.blueprints.pump).toBe(0);
    go(s, 'carrier', goal);
    expect(s.mainComplete).toBe(true);
    expect(s.grid.tiles[6][8]).toBe('rock');
    expect(s.bonusReached).toBe(false);
    go(s, 'carrier', { x: 14, y: 5 });
    build(s, 'pump', { x: 13, y: 10 }); refuel(s, 'reserve-scout');
    expect(s.preview('reserve-scout', home)).toBeNull();
    go(s, 'gate-dozer', { x: 10, y: 10 });
    expect(s.orderObstacle('gate-dozer', 'push', { x: 11, y: 10 }).ok).toBe(false);
    go(s, 'reserve-scout', { x: 12, y: 11 });
    work(s, 'gate-dozer', 'push', { x: 11, y: 10 });
    go(s, 'gate-dozer', { x: 12, y: 8 });
    go(s, 'reserve-scout', home);
    expect(s.bonusReached).toBe(true);
    expect(s.blueprints.pump).toBe(0);
    expect(s.unit('reserve-scout').battery).toBeGreaterThan(0);
  });

  it('opens Stone Gate by shore construction and saves the rock gate, then recycles into a gardener', () => {
    const s = play('stone-gate');
    go(s, 'scout', { x: 3, y: 5 }); go(s, 'scout', { x: 2, y: 2 });
    const scoop = build(s, 'scoop', { x: 5, y: 4 });
    expect(s.buildPreview('dozer', { x: 4, y: 4 }).ok).toBe(false);
    work(s, scoop, 'dig', { x: 4, y: 6 }); work(s, scoop, 'fill', { x: 6, y: 7 });
    work(s, scoop, 'dig', { x: 3, y: 6 }); work(s, scoop, 'fill', { x: 7, y: 7 });
    go(s, scoop, s.setup.goals![0].cell); expect(s.mainComplete).toBe(true);
    expect(s.grid.tiles[4][6]).toBe('rock'); expect(s.bonusReached).toBe(false);
    go(s, scoop, { x: 11, y: 5 });
    work(s, scoop, 'dig', { x: 9, y: 6 }); work(s, scoop, 'fill', { x: 10, y: 8 });
    go(s, scoop, { x: 10, y: 6 }); expect(s.dismantle(scoop).ok).toBe(true);
    const arbor = build(s, 'arborbot', { x: 10, y: 6 });
    go(s, arbor, s.setup.bonus!.cell); expect(s.bonusReached).toBe(false);
    work(s, arbor, 'uproot', { x: 6, y: 6 }); go(s, arbor, s.setup.bonus!.cell);
    expect(s.bonusReached).toBe(true); expect(s.unit(arbor).battery).toBeGreaterThan(0);
  });

  it('lets Scout draw the Forked Watch patrol away while Hauler uses the other bridge', () => {
    const s = play('forked-watch');
    go(s, 'bait', { x: 10, y: 9 }); s.step(1); go(s, 'bait', { x: 7, y: 10 });
    const notices = s.drainEvents(); expect(notices.some(e => e.kind === 'enemy-alert' && e.targetId === 'bait'), JSON.stringify(notices)).toBe(true);
    go(s, 'bait', { x: 4, y: 10 });
    go(s, 'carrier', { x: 7, y: 6 }); go(s, 'carrier', { x: 14, y: 4 });
    go(s, 'carrier', s.setup.goals![0].cell);
    expect(s.mainComplete).toBe(true); expect(s.enemies).toHaveLength(2);
    expect(s.units.some(u => u.kind === 'sentry')).toBe(false);
    go(s, 'carrier', { x: 14, y: 11 });
    const duck = build(s, 'duck', { x: 8, y: 5 }); go(s, duck, s.setup.bonus!.cell);
    expect(s.bonusReached).toBe(true);
  });

  it('finishes Three Tides with the original Forklift through the causeway and retains the living-tree bonus', () => {
    const s = play('three-tides'); openThreeTides(s);
    const gator = { ...s.piles.find(p => p.supplies.green === 4)!.cell };
    const crab = { ...s.piles.find(p => p.supplies.blue >= 3 && p.supplies.batteries.some(b => b > 0))!.cell };
    work(s, 'ship', 'pickup', crab); work(s, 'ship', 'drop', { x: 18, y: 9 });
    work(s, 'camp-carrier', 'pickup', { x: 9, y: 8 });
    go(s, 'camp-carrier', { x: 19, y: 16 });
    work(s, 'camp-carrier', 'pickup', gator); work(s, 'camp-carrier', 'pickup', { x: 18, y: 9 });
    go(s, 'camp-carrier', s.setup.goals![0].cell);
    expect(s.mainComplete).toBe(true); expect(s.units.some(u => u.kind === 'dumptruck')).toBe(false);
    expect(s.blueprints.dumptruck).toBe(1); expect(s.unit('camp-carrier').cargo.green).toBe(6);
    work(s, 'arborbot', 'uproot', { x: 8, y: 6 }); go(s, 'arborbot', s.setup.bonus!.cell);
    expect(s.bonusReached).toBe(true);
  });
});
