import { describe, expect, it } from 'vitest';
import { findPath, key, sameCell, walkable, type Grid } from '../src/core/grid';
import { toCell, toWorld } from '../src/core/projection';
import { Simulation } from '../src/core/simulation';
import { hollowGoals, hollowReach, unitDefinitions } from '../src/levels/hollow-reach';
import { unitDefinition, type UnitDefinition } from '../src/core/catalog';

const gridFrom = (rows: string[]): Grid => ({ width: rows[0].length, height: rows.length, tiles: rows.map(row => [...row].map(c => c === '#' ? 'rock' : 'grass')) });
const def = (id: string, x: number, y: number): UnitDefinition => ({ ...unitDefinition('scout', id, { x, y }), speed: 2 });
const run = (sim: Simulation, seconds: number) => { for (let i = 0; i < seconds * 60; i++) sim.step(1 / 60); };

describe('isometric picking', () => {
  it('maps every authored tile center and interior points back to the same tile', () => {
    for (let y = 0; y < hollowReach.height; y++) for (let x = 0; x < hollowReach.width; x++) {
      const p = toWorld({ x, y });
      for (const [dx, dy] of [[0, 0], [-10, -3], [10, 3], [-8, 6]]) expect(sameCell(toCell({ x: p.x + dx, y: p.y + dy }), { x, y })).toBe(true);
    }
  });
});

describe('routing', () => {
  it('takes the shortest available detour and never cuts across blocked tiles', () => {
    const grid = gridFrom(['.....', '.###.', '.....']);
    const path = findPath(grid, { x: 0, y: 1 }, { x: 4, y: 1 })!;
    expect(path).toHaveLength(6);
    let previous = { x: 0, y: 1 };
    for (const cell of path) {
      expect(walkable(grid, cell)).toBe(true);
      expect(Math.abs(cell.x - previous.x) + Math.abs(cell.y - previous.y)).toBe(1);
      previous = cell;
    }
  });
  it('rejects unreachable, out-of-bounds, and occupied destinations', () => {
    const grid = gridFrom(['.#.', '.#.', '.#.']);
    expect(findPath(grid, { x: 0, y: 0 }, { x: 2, y: 0 })).toBeNull();
    expect(findPath(grid, { x: 0, y: 0 }, { x: -1, y: 0 })).toBeNull();
    expect(findPath(grid, { x: 0, y: 0 }, { x: 0, y: 2 }, new Set(['0,2']))).toBeNull();
  });
  it('connects both prototype starts to both beacons with legal routes', () => {
    for (const unit of unitDefinitions) for (const beacon of hollowGoals) {
      const route = findPath(hollowReach, unit.start, beacon.cell);
      expect(route, `${unit.id} to ${beacon.id}`).not.toBeNull();
      expect(route!.at(-1)).toEqual(beacon.cell);
      expect(route!.every(p => walkable(hollowReach, p))).toBe(true);
    }
  });
});

describe('independent movement orders', () => {
  it('advances both units concurrently until each reaches its destination', () => {
    const sim = new Simulation(gridFrom(['......', '......']), [def('a', 0, 0), def('b', 0, 1)]);
    sim.move('a', { x: 5, y: 0 }); sim.move('b', { x: 5, y: 1 });
    run(sim, 1);
    expect(sim.position(sim.unit('a')).x).toBeCloseTo(2);
    expect(sim.position(sim.unit('b')).x).toBeCloseTo(2);
    run(sim, 3);
    expect(sim.units.map(u => u.cell)).toEqual([{ x: 5, y: 0 }, { x: 5, y: 1 }]);
    expect(sim.units.every(u => u.status === 'idle')).toBe(true);
  });
  it('replaces a route mid-edge without jumping, and preserves it after invalid input', () => {
    const sim = new Simulation(gridFrom(['.....', '.....']), [def('a', 0, 0)]);
    sim.move('a', { x: 4, y: 0 }); sim.step(0.2);
    const before = sim.position(sim.unit('a'));
    expect(sim.move('a', { x: 0, y: 1 }).ok).toBe(true);
    expect(sim.position(sim.unit('a'))).toEqual(before);
    expect(sim.move('a', { x: -1, y: 0 }).ok).toBe(false);
    expect(sim.unit('a').goal).toEqual({ x: 0, y: 1 });
    run(sim, 3);
    expect(sim.unit('a').cell).toEqual({ x: 0, y: 1 });
  });
  it('stops at the end of the active edge, with no teleportation', () => {
    const sim = new Simulation(gridFrom(['.....']), [def('a', 0, 0)]);
    sim.move('a', { x: 4, y: 0 }); sim.step(0.2);
    sim.stop('a'); expect(sim.position(sim.unit('a')).x).toBeCloseTo(0.4);
    run(sim, 3); expect(sim.unit('a').cell).toEqual({ x: 1, y: 0 }); expect(sim.unit('a').status).toBe('idle');
  });
  it('never shares an occupied or reserved tile while two routes cross', () => {
    const sim = new Simulation(gridFrom(['.....', '.....', '.....', '.....', '.....']), [def('a', 0, 2), def('b', 2, 0)]);
    sim.move('a', { x: 4, y: 2 }); sim.move('b', { x: 2, y: 4 });
    for (let frame = 0; frame < 600; frame++) {
      sim.step(1 / 60);
      const a = sim.unit('a'), b = sim.unit('b');
      const occupiedA = [key(a.cell), ...(a.next ? [key(a.next)] : [])];
      const occupiedB = [key(b.cell), ...(b.next ? [key(b.next)] : [])];
      expect(occupiedA.some(p => occupiedB.includes(p)), `frame ${frame}`).toBe(false);
    }
    expect(sameCell(sim.unit('a').cell, { x: 4, y: 2 })).toBe(true);
    expect(sameCell(sim.unit('b').cell, { x: 2, y: 4 })).toBe(true);
  });
  it('waits for a newly blocked route and resumes when the blocker leaves', () => {
    const sim = new Simulation(gridFrom(['.....', '##.##']), [def('a', 0, 0), def('b', 2, 1)]);
    sim.move('a', { x: 4, y: 0 }); sim.move('b', { x: 2, y: 0 });
    run(sim, 2);
    expect(sim.unit('a').status).toBe('waiting');
    sim.move('b', { x: 2, y: 1 }); run(sim, 4);
    expect(sim.unit('a').cell).toEqual({ x: 4, y: 0 });
  });
});
