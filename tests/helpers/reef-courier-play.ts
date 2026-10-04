import { expect } from 'vitest';
import type { Simulation } from '../../src/core/simulation';
import { build, go, refuel, work } from './campaign-play';

export function upgradeReefCourier(s: Simulation, launch: 'camp' | 'lagoon'): string {
  expect(s.preview('castaway', s.setup.bonus!.cell)).toBeNull();
  expect(s.blueprints.freighter ?? 0).toBe(0);
  if (launch === 'lagoon') work(s, 'tug', 'pickup', { x: 5, y: 11 });
  go(s, 'tug', { x: 11, y: 3 });
  expect(s.drainEvents().some(event => event.kind === 'whirlpool')).toBe(true);
  expect(s.blueprints.freighter).toBe(1);
  expect(s.blueprints.dozer ?? 0).toBe(0);
  go(s, 'tug', s.setup.goals![0].cell);
  expect(s.mainComplete).toBe(false);
  if (launch === 'lagoon') work(s, 'tug', 'drop', { x: 13, y: 6 });
  const site = launch === 'camp' ? { x: 6, y: 11 } : { x: 12, y: 6 };
  go(s, 'tug', site);
  // The loose supplement cannot build a second ship while Tugboat still exists.
  expect(s.buildPreview('freighter', { x: site.x + 1, y: site.y }).missing.battery).toBe(1);
  const charge = s.unit('tug').battery;
  expect(s.dismantle('tug').ok).toBe(true);
  const ship = build(s, 'freighter', site);
  expect(s.unit(ship).battery).toBe(charge);
  go(s, ship, s.setup.goals![0].cell);
  expect(s.mainComplete).toBe(true);
  expect(s.bonusReached).toBe(false);
  return ship;
}

export function rescueReefCastaway(s: Simulation, ship: string): void {
  go(s, ship, { x: 11, y: 4 });
  expect(s.blueprints.dozer).toBe(1);
  go(s, ship, { x: 7, y: 10 }); refuel(s, ship);
  work(s, ship, 'pickup', { x: 5, y: 13 });
  expect(s.unit(ship).cargo).toMatchObject({ yellow: 2, tires: 4 });
  work(s, ship, 'drop', { x: 13, y: 6 });
  go(s, ship, { x: 12, y: 6 });
  const charge = s.unit(ship).battery;
  expect(s.dismantle(ship).ok).toBe(true);
  const dozer = build(s, 'dozer', { x: 13, y: 5 });
  expect(s.unit(dozer).battery).toBe(charge);
  work(s, dozer, 'push', { x: 14, y: 5 });
  // One push only moves the blockage into the next tile of the narrow exit.
  expect(s.preview('castaway', s.setup.bonus!.cell)).toBeNull();
  go(s, dozer, { x: 14, y: 5 });
  work(s, dozer, 'push', { x: 15, y: 5 });
  // Clear the working vehicle too, rather than letting the rescue clip through it.
  expect(s.preview('castaway', s.setup.bonus!.cell)).toBeNull();
  go(s, dozer, { x: 15, y: 4 });
  go(s, 'castaway', s.setup.bonus!.cell);
  expect(s.bonusReached).toBe(true);
  expect(s.unit('castaway').battery).toBeGreaterThan(0);
  expect(s.blueprints.freighter).toBe(0);
  expect(s.blueprints.dozer).toBe(0);
}
