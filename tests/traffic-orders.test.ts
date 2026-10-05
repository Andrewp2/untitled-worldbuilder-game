import { describe, expect, it } from 'vitest';
import { enemyDefinition, unitDefinition } from '../src/core/catalog';
import { key, movementDestination } from '../src/core/grid';
import { Simulation } from '../src/core/simulation';
import { board, pile, stock } from '../src/levels/authored';

const corridor = () => board(['......', '~~.~~~']);
const exit = { x: 2, y: 1 }, destination = { x: 4, y: 0 };

function crossing(reverse = false, carrier = false): Simulation {
  const units = [unitDefinition(carrier ? 'hauler' : 'scout', 'follower', { x: 1, y: 0 }),
    unitDefinition('snail', 'clearing', { x: 2, y: 0 })];
  return new Simulation(corridor(), reverse ? units.reverse() : units,
    { piles: carrier ? [pile(5, 0, stock(1))] : [] });
}

/** Actual entry reservations, including both ends of a whirlpool, stay exclusive. */
function advance(s: Simulation, seconds: number): void {
  for (let frame = 0; frame < seconds * 60; frame++) {
    s.step(1 / 60);
    const occupied = new Set<string>();
    for (const actor of [...s.units, ...s.enemies]) {
      const cells = new Set([key(actor.cell), ...(actor.next
        ? [key(actor.next), key(movementDestination(s.grid, actor.next))] : [])]);
      for (const cell of cells) {
        expect(occupied.has(cell), `shared ${cell} at frame ${frame}`).toBe(false);
        occupied.add(cell);
      }
    }
  }
}

describe('orders through departing friendly traffic', () => {
  it.each([false, true])('accepts an immediate crossing order, waits safely, and pays only for movement (reverse roster: %s)', reverse => {
    const s = crossing(reverse);
    expect(s.move('clearing', exit).ok).toBe(true);
    expect(s.preview('follower', destination)?.at(-1)).toEqual(destination);
    expect(s.move('follower', destination).ok).toBe(true);
    advance(s, .2);
    expect(s.unit('follower')).toMatchObject({ status: 'waiting', battery: 100 });
    advance(s, 3);
    expect(s.unit('follower')).toMatchObject({ cell: destination, battery: 97, goal: null });
    expect(s.unit('clearing').cell).toEqual(exit);
  });

  it('allows targeting the tile a friend is leaving, including after its last paid step starts', () => {
    const s = crossing();
    s.unit('clearing').battery = 1;
    expect(s.move('clearing', exit).ok).toBe(true);
    advance(s, .1);
    expect(s.unit('clearing').battery).toBe(0);
    expect(s.move('follower', { x: 2, y: 0 }).ok).toBe(true);
    advance(s, 2);
    expect(s.unit('follower').cell).toEqual({ x: 2, y: 0 });
    expect(s.unit('clearing')).toMatchObject({ cell: exit, status: 'depleted' });
  });

  it('keeps the accepted order without spending charge if the friend stops, then resumes after it leaves', () => {
    const s = crossing();
    s.move('clearing', exit);
    expect(s.move('follower', destination).ok).toBe(true);
    s.stop('clearing');
    advance(s, 2);
    expect(s.unit('follower')).toMatchObject({ status: 'waiting', battery: 100, goal: destination });
    s.move('clearing', exit); advance(s, 3);
    expect(s.unit('follower')).toMatchObject({ cell: destination, battery: 97 });
  });

  it('still rejects a parked friend, a friend parking in the pass, and a hostile blocker', () => {
    const s = crossing();
    expect(s.move('follower', destination).ok).toBe(false);
    expect(s.move('clearing', { x: 3, y: 0 }).ok).toBe(true);
    expect(s.move('follower', destination).ok).toBe(false);
    s.unit('clearing').battery = 1;
    expect(s.move('clearing', { x: 5, y: 0 }).ok).toBe(true);
    expect(s.move('follower', destination).ok).toBe(false); // It will run out in the pass.
    const hostile = new Simulation(corridor(), [unitDefinition('scout', 'follower', { x: 1, y: 0 })],
      { enemies: [enemyDefinition('crab', 'blocker', { x: 2, y: 0 })] });
    expect(hostile.move('follower', destination).ok).toBe(false);
  });

  it('waits outside a whirlpool until the departing ship clears its exit', () => {
    const grid = board(['w@ww@w', '....w.']);
    grid.whirlpools = { '1,0': { x: 4, y: 0 }, '4,0': { x: 1, y: 0 } };
    const s = new Simulation(grid, [unitDefinition('freighter', 'follower', { x: 0, y: 0 }),
      unitDefinition('tug', 'clearing', { x: 4, y: 0 })]);
    expect(s.move('clearing', { x: 4, y: 1 }).ok).toBe(true);
    expect(s.move('follower', { x: 5, y: 0 }).ok).toBe(true);
    advance(s, .1);
    expect(s.unit('follower')).toMatchObject({ status: 'waiting', battery: 100, next: null });
    advance(s, 4);
    expect(s.unit('follower')).toMatchObject({ cell: { x: 5, y: 0 }, battery: 98 });
    expect(s.drainEvents().filter(event => event.kind === 'whirlpool')).toHaveLength(1);
  });

  it('queues cargo work across the clearing passage and transfers only after arriving', () => {
    const s = crossing(false, true), target = { x: 5, y: 0 };
    s.move('clearing', exit);
    expect(s.orderCargo('follower', 'pickup', target)).toMatchObject({ ok: true, queued: true });
    advance(s, .2);
    expect(s.unit('follower').cargo.red).toBe(0);
    expect(s.pileAt(target)?.supplies.red).toBe(1);
    advance(s, 4);
    expect(s.unit('follower')).toMatchObject({ cell: destination, cargo: { red: 1 }, battery: 95, pending: null });
    expect(s.pileAt(target)).toBeUndefined();
  });
});
