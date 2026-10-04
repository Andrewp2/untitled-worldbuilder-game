import { expect } from 'vitest';
import type { Simulation } from '../../src/core/simulation';
import { build, clearEnemies, go, refuel, work } from './campaign-play';

export function restoreRelayFreighter(s: Simulation, power: 'berth' | 'battery'): string {
  expect(s.move('freighter', s.setup.goals![0].cell).ok).toBe(false);
  work(s, 'tug', 'pickup', { x: 4, y: 4 });
  work(s, 'tug', 'drop', { x: 9, y: 8 });
  go(s, 'tug', { x: 11, y: 7 });
  expect(s.buildPreview('marina', { x: 10, y: 8 }).ok).toBe(false);
  expect(s.blueprints.patrolboat ?? 0).toBe(0);
  expect(s.dismantle('tug').ok).toBe(true);
  let marina: string;
  if (power === 'battery') {
    expect(s.replaceBattery('freighter').ok).toBe(true);
    go(s, 'freighter', s.setup.goals![0].cell);
    expect(s.mainComplete).toBe(true);
    expect(s.blueprints.marina).toBe(1);
    marina = build(s, 'marina', { x: 10, y: 8 });
  } else {
    marina = build(s, 'marina', { x: 10, y: 8 });
    refuel(s, 'freighter');
    go(s, 'freighter', s.setup.goals![0].cell);
  }
  expect(s.mainComplete).toBe(true);
  expect(s.bonusReached).toBe(false);
  expect(s.enemies).toHaveLength(1);
  return marina;
}

export function patrolRelayHarbor(s: Simulation, marina: string): void {
  go(s, 'freighter', { x: 9, y: 2 });
  expect(s.blueprints.patrolboat).toBe(1);
  go(s, 'freighter', { x: 10, y: 7 }); refuel(s, 'freighter');
  expect(s.dismantle('freighter').ok).toBe(true);
  // The charger still owns the only yellow piece, even with ship parts available.
  expect(s.buildPreview('patrolboat', { x: 11, y: 7 }).missing.yellow).toBe(1);
  expect(s.dismantle(marina).ok).toBe(true);
  const patrol = build(s, 'patrolboat', { x: 11, y: 7 });
  expect(s.unit(patrol).battery).toBe(100);
  expect(s.blueprints.marina).toBe(0);
  expect(s.blueprints.patrolboat).toBe(0);
  clearEnemies(s, [patrol]);
  go(s, patrol, s.setup.bonus!.cell);
  expect(s.bonusReached).toBe(true);
  expect(s.unit(patrol).battery).toBeGreaterThan(0);
  expect(s.units.some(u => u.kind === 'marina')).toBe(false);
}
