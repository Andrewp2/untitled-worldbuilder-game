import { expect } from 'vitest';
import type { Simulation } from '../../src/core/simulation';
import { build, go, refuel, work } from './campaign-play';

/** Two ordinary shipping plans: open the near pass, or land beyond it. */
export function supplyIsland(s: Simulation, landing: 'south' | 'north'): string {
  const quay = landing === 'south' ? { x: 13, y: 12 } : { x: 14, y: 7 };
  const site = landing === 'south' ? { x: 14, y: 12 } : { x: 15, y: 6 };
  work(s, 'ship', 'pickup', { x: 7, y: 12 });
  work(s, 'ship', 'drop', quay);
  if (landing === 'south') {
    const dozer = build(s, 'dozer', site);
    expect(s.preview(dozer, s.setup.goals![0].cell)).toBeNull();
    go(s, dozer, { x: 20, y: 10 });
    work(s, dozer, 'push', { x: 20, y: 9 });
    expect(s.preview(dozer, s.setup.goals![0].cell)).not.toBeNull();
    go(s, dozer, site); refuel(s, dozer);
    expect(s.dismantle(dozer).ok).toBe(true);
  }
  const carrier = build(s, 'dumptruck', site);
  go(s, 'ship', { x: 9, y: 13 }); refuel(s, 'ship');
  work(s, 'ship', 'pickup', { x: 7, y: 14 });
  expect(s.cargoOrderPreview('ship', 'drop', s.setup.goals![0].cell).ok).toBe(false);
  work(s, 'ship', 'drop', quay);
  work(s, carrier, 'pickup', quay);
  expect(s.unit(carrier).cargo.green).toBe(20);
  go(s, carrier, s.setup.goals![0].cell);
  expect(s.mainComplete).toBe(true);
  expect(s.bonusReached).toBe(false);
  return carrier;
}

/** Reuse the delivered vehicle and its battery for engineering, then gardening. */
export function connectIslandGarden(s: Simulation, carrier: string): void {
  go(s, carrier, { x: 19, y: 5 });
  expect(s.blueprints.scoop).toBe(1);
  expect(s.blueprints.arborbot ?? 0).toBe(0);
  go(s, carrier, { x: 15, y: 6 });
  expect(s.preview(carrier, s.setup.bonus!.cell)).toBeNull();
  const charge = s.unit(carrier).battery;
  expect(s.dismantle(carrier).ok).toBe(true);
  const scoop = build(s, 'scoop', { x: 15, y: 6 });
  expect(s.unit(scoop).battery).toBe(charge);
  work(s, scoop, 'dig', { x: 14, y: 7 });
  work(s, scoop, 'fill', { x: 13, y: 5 });
  expect(s.preview(scoop, s.setup.bonus!.cell)).toBeNull();
  work(s, scoop, 'dig', { x: 15, y: 7 });
  work(s, scoop, 'fill', { x: 12, y: 5 });
  go(s, scoop, { x: 11, y: 5 });
  expect(s.blueprints.arborbot).toBe(1);
  go(s, scoop, s.setup.bonus!.cell);
  expect(s.bonusReached).toBe(false);
  go(s, scoop, { x: 15, y: 6 });
  const remaining = s.unit(scoop).battery;
  expect(s.dismantle(scoop).ok).toBe(true);
  const arbor = build(s, 'arborbot', { x: 15, y: 6 });
  expect(s.unit(arbor).battery).toBe(remaining);
  work(s, arbor, 'uproot', { x: 18, y: 3 });
  go(s, arbor, s.setup.bonus!.cell);
  expect(s.bonusReached).toBe(true);
  expect(s.unit(arbor).battery).toBeGreaterThan(0);
  expect(s.piles.reduce((total, pile) => total + pile.supplies.green, 0)).toBe(17);
  expect(s.blueprints.dumptruck).toBe(0);
  expect(s.blueprints.scoop).toBe(0);
  expect(s.blueprints.arborbot).toBe(0);
}
