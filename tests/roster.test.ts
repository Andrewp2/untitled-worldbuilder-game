import { describe, expect, it } from 'vitest';
import { enemyDefinition, enemyKinds, enemySpecs, emptySupplies, load, partCounts, recipeSupplies, TERRAIN_ENERGY, unitDefinition, unitKinds, unitSpecs, usesBattery, type EnemyKind, type UnitKind } from '../src/core/catalog';
import { findPath, key, walkable, type Cell, type Grid, type Terrain } from '../src/core/grid';
import { Simulation } from '../src/core/simulation';

const board = (terrain: Terrain = 'grass', width = 9, height = 5): Grid => ({ width, height, tiles: Array.from({ length: height }, () => Array(width).fill(terrain)) });
const state = (s: Simulation) => JSON.stringify({ grid: s.grid, units: s.units, piles: s.piles, trees: s.looseTrees });
const treeCount = (s: Simulation) => s.grid.tiles.flat().filter(t => t === 'tree').length + s.looseTrees.length + s.units.filter(u => u.carryingTree).length;

describe('released original roster coverage and construction', () => {
  it('covers all 20 released buildable roles and six hostile families, excluding cut models and the sequel', () => {
    expect(Object.values(unitSpecs).flatMap(spec => spec.reference ? [spec.reference] : []).sort()).toEqual([
      'Buggy', 'Dirtbuggy', 'Snail', 'Steamshovel', 'Bulldozer', 'Forklift', 'Treebot', 'Defender', 'Dumptruck', 'Gas Station', 'Robot Lab', 'Guard Tower', 'Repairbot', 'Frog', 'Duck', 'Fish', 'Tugboat', 'Freighter', 'Speedboat', 'Marina',
    ].sort());
    expect(Object.values(enemySpecs).flatMap(spec => spec.reference ? [spec.reference] : []).sort()).toEqual([
      'Crab', 'Water Crab', 'Scorpion', 'Alligator', 'Tyrannosaurus Rex', 'Shark',
    ].sort());
  });
  it.each(unitKinds)('builds and dismantles %s with every color and installed charge preserved', kind => {
    const water = ['fish', 'tug', 'freighter', 'patrolboat', 'marina'].includes(kind);
    const cell = { x: 3, y: 2 }, supplies = recipeSupplies(kind, 73);
    const s = new Simulation(board(water ? 'water' : 'grass'), [], { piles: [{ cell, supplies }] });
    const result = s.build(kind, cell);
    if (!result.ok) throw new Error(result.reason);
    const unit = s.unit(result.id!);
    expect(unit.kind).toBe(kind); expect(unit.battery).toBe(usesBattery(kind) ? 73 : 0);
    expect(unit.status).toBe('idle'); expect(s.piles).toHaveLength(0);
    expect(s.dismantle(unit.id).ok).toBe(true);
    expect(s.pileAt(cell)?.supplies).toEqual(supplies); expect(s.units).toHaveLength(0);
  });
  it('keeps buildings stationary, battery-free where appropriate, and unable to satisfy arrival flags', () => {
    for (const kind of ['pump', 'workshop', 'sentry', 'marina'] as const) {
      const cell = { x: 3, y: 2 }, s = new Simulation(board(kind === 'marina' ? 'water' : 'grass'), [], {
        piles: [{ cell, supplies: recipeSupplies(kind, 100) }], goals: [{ id: 'flag', name: 'Flag', cell }],
      });
      const result = s.build(kind, cell); if (!result.ok) throw new Error(result.reason);
      expect(s.move(result.id!, { x: 4, y: 2 }).ok).toBe(false);
      expect(s.preview(result.id!, { x: 4, y: 2 })).toBeNull(); expect(s.reached.size).toBe(0);
      if (kind !== 'sentry') {
        expect(s.replacementCharge(result.id!)).toBeNull(); expect(s.replaceBattery(result.id!).ok).toBe(false);
      }
    }
  });
});

describe('terrain-specific movement and goal arrival', () => {
  const cases: [UnitKind, Terrain, Terrain[]][] = [
    ['scout', 'grass', ['grass', 'sand', 'bridge', 'swamp']],
    ['trailbuggy', 'grass', ['grass', 'sand', 'bridge', 'swamp', 'rough']],
    ['mender', 'grass', ['grass', 'sand', 'bridge', 'swamp', 'rough']],
    ['frog', 'grass', ['grass', 'sand', 'bridge', 'swamp', 'water']],
    ['duck', 'grass', ['grass', 'sand', 'bridge', 'swamp', 'water']],
    ['fish', 'water', ['water', 'deep-water']],
    ['tug', 'water', ['water', 'deep-water']],
    ['freighter', 'water', ['water', 'deep-water']],
    ['patrolboat', 'water', ['water', 'deep-water']],
  ];
  it.each(cases)('%s enters only its allowed terrain, including actual arrival and charge use', (kind, start, allowed) => {
    for (const target of ['grass', 'sand', 'bridge', 'swamp', 'rough', 'water', 'deep-water', 'rock', 'tree'] as Terrain[]) {
      const grid = board(start, 2, 1); grid.tiles[0][1] = target;
      const s = new Simulation(grid, [unitDefinition(kind, 'u', { x: 0, y: 0 })]);
      const result = s.move('u', { x: 1, y: 0 });
      expect(result.ok, `${kind} → ${target}`).toBe(allowed.includes(target));
      s.step(3);
      expect(s.unit('u').cell).toEqual({ x: result.ok ? 1 : 0, y: 0 });
      expect(s.unit('u').battery).toBe(result.ok ? target === 'swamp' ? 97 : 99 : 100);
    }
  });
  it('rejects land starts for boats and deep-water starts for amphibians', () => {
    expect(() => new Simulation(board(), [unitDefinition('freighter', 'f', { x: 1, y: 1 })])).toThrow('Invalid start');
    expect(() => new Simulation(board('deep-water'), [unitDefinition('frog', 'f', { x: 1, y: 1 })])).toThrow('Invalid start');
  });
  it('uses the mobility profile for whole paths rather than merely accepting the destination', () => {
    const grid = board('grass', 5, 1); grid.tiles[0][2] = 'rough';
    expect(findPath(grid, { x: 0, y: 0 }, { x: 4, y: 0 })).toBeNull();
    expect(findPath(grid, { x: 0, y: 0 }, { x: 4, y: 0 }, new Set(), 'rough')).toHaveLength(4);
    const shallow = board('water', 5, 1); shallow.tiles[0][2] = 'deep-water';
    expect(findPath(shallow, { x: 0, y: 0 }, { x: 4, y: 0 }, new Set(), 'amphibious')).toBeNull();
    expect(findPath(shallow, { x: 0, y: 0 }, { x: 4, y: 0 }, new Set(), 'water')).toHaveLength(4);
  });
  it('pays the full swamp entry cost before moving, letting the final paid edge finish', () => {
    const grid = board('grass', 3, 1); grid.tiles[0][1] = 'swamp';
    const low = new Simulation(grid, [unitDefinition('duck', 'd', { x: 0, y: 0 }, 2)]);
    expect(low.move('d', { x: 1, y: 0 })).toEqual({ ok: false, reason: 'energy' });
    const enough = new Simulation(grid, [unitDefinition('duck', 'd', { x: 0, y: 0 }, 3)]);
    enough.move('d', { x: 2, y: 0 }); enough.step(3);
    expect(enough.unit('d').cell).toEqual({ x: 1, y: 0 }); expect(enough.unit('d').battery).toBe(0);
  });
  it('requires the authored creature where a flag has a specific arrival objective', () => {
    const goal = { id: 'home', name: 'Snail home', cell: { x: 4, y: 2 }, kinds: ['snail'] as const };
    const s = new Simulation(board(), [unitDefinition('scout', 's', { x: 2, y: 2 }), unitDefinition('snail', 'n', { x: 0, y: 2 })], { goals: [goal] });
    s.move('s', goal.cell); s.step(5); expect(s.reached.size).toBe(0);
    s.move('s', { x: 4, y: 3 }); s.step(2);
    s.move('n', goal.cell); s.step(10); expect(s.reached.has('home')).toBe(true);
  });
});

describe('cargo roles and shore transfers', () => {
  it.each([['forklift', 10, 'grass'], ['dumptruck', 25, 'grass'], ['tug', 5, 'water'], ['freighter', 25, 'water']] as const)('%s carries its whole intended load without losing battery identities', (kind, capacity, terrain) => {
    const supplies = { ...partCounts(3, 3, 3, 3), batteries: [0, 17, 83], soil: 2 }, cell = { x: 3, y: 2 };
    const s = new Simulation(board(terrain), [unitDefinition(kind, 'u', { x: 2, y: 2 })], { piles: [{ cell, supplies }] });
    s.transfer('u', 'pickup', cell);
    expect(load(s.unit('u').cargo)).toBe(Math.min(capacity, load(supplies)));
    s.transfer('u', 'drop', cell);
    expect(s.pileAt(cell)?.supplies).toEqual(supplies); expect(s.unit('u').battery).toBe(96);
  });
  it('sails beside a distant shore pile and transfers it without entering land', () => {
    const grid = board('water'); const shore = { x: 7, y: 2 }; grid.tiles[2][7] = 'sand';
    const supplies = { ...partCounts(1, 1, 1, 1), batteries: [37] };
    const s = new Simulation(grid, [unitDefinition('tug', 't', { x: 0, y: 2 })], { piles: [{ cell: shore, supplies }] });
    expect(s.orderCargo('t', 'pickup', shore)).toEqual({ ok: true, queued: true });
    s.step(10); expect(s.unit('t').cargo).toEqual(supplies);
    expect(walkable(s.grid, s.unit('t').cell, 'water')).toBe(true);
    expect(s.orderCargo('t', 'drop', { x: 8, y: 2 }).ok).toBe(true); s.step(10);
    expect(s.pileAt({ x: 8, y: 2 })?.supplies).toEqual(supplies);
  });
  it.each(['snail', 'dozer', 'arborbot', 'mender', 'frog', 'duck', 'fish', 'patrolboat', 'pump', 'workshop', 'sentry', 'marina'] as const)('keeps unsupported cargo orders atomic for %s', kind => {
    const grid = board(['fish', 'patrolboat', 'marina'].includes(kind) ? 'water' : 'grass');
    const s = new Simulation(grid, [unitDefinition(kind, 'u', { x: 2, y: 2 })], { piles: [{ cell: { x: 3, y: 2 }, supplies: recipeSupplies('scout', 77) }] });
    const before = state(s);
    for (const action of ['pickup', 'drop'] as const) {
      expect(s.orderCargo('u', action, { x: 3, y: 2 }).ok).toBe(false); expect(state(s)).toBe(before);
    }
  });
});

describe('Dozer obstacle work', () => {
  it.each([{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }])('merges adjacent piles when pushing in direction %j without walking or losing supplies', direction => {
    const target = { x: 4, y: 2 }, start = { x: target.x - direction.x, y: target.y - direction.y };
    const destination = { x: target.x + direction.x, y: target.y + direction.y };
    const source = { ...partCounts(4, 2, 1, 3), batteries: [0, 63], soil: 1 };
    const existing = { ...partCounts(1, 3, 2, 4), batteries: [18, 0], soil: 2 };
    const grid = board('water');
    for (const cell of [start, target, destination]) grid.tiles[cell.y][cell.x] = 'grass';
    const s = new Simulation(grid, [unitDefinition('dozer', 'd', start, TERRAIN_ENERGY)], {
      piles: [{ cell: target, supplies: source }, { cell: destination, supplies: existing }],
    });
    const before = state(s);
    expect(s.obstacleOrderPreview('d', 'push', target).ok).toBe(true); expect(state(s)).toBe(before);
    expect(s.orderObstacle('d', 'push', target)).toEqual({ ok: true });
    expect(s.piles).toHaveLength(1); expect(s.pileAt(target)).toBeUndefined();
    expect(s.pileAt(destination)?.supplies).toEqual({ ...partCounts(5, 5, 3, 7), batteries: [18, 0, 0, 63], soil: 3 });
    expect(s.unit('d').cell).toEqual(start); expect(s.unit('d').battery).toBe(0);
    expect(s.unit('d').cargo).toEqual(emptySupplies()); expect(s.unit('d').pending).toBeNull();
    expect(source).toEqual({ ...partCounts(4, 2, 1, 3), batteries: [0, 63], soil: 1 });
    expect(existing).toEqual({ ...partCounts(1, 3, 2, 4), batteries: [18, 0], soil: 2 });
  });
  it('drives beside a distant pile and merges it with a pile deposited after the order', () => {
    const target = { x: 6, y: 2 }, destination = { x: 7, y: 2 };
    const s = new Simulation(board(), [unitDefinition('dozer', 'd', { x: 0, y: 2 }), unitDefinition('hauler', 'h', { x: 7, y: 1 })], {
      piles: [{ cell: target, supplies: { ...partCounts(2, 1), batteries: [0, 63] } },
        { cell: { x: 8, y: 1 }, supplies: { ...partCounts(1, 0, 2), batteries: [18] } }],
    });
    expect(s.orderObstacle('d', 'push', target)).toEqual({ ok: true, queued: true });
    expect(s.transfer('h', 'pickup', { x: 8, y: 1 }).ok).toBe(true);
    expect(s.transfer('h', 'drop', destination).ok).toBe(true); s.step(20);
    expect(s.pileAt(target)).toBeUndefined();
    expect(s.pileAt(destination)?.supplies).toEqual({ ...partCounts(3, 1, 2), batteries: [18, 0, 63] });
    expect(s.unit('d').cell).toEqual({ x: 5, y: 2 }); expect(s.unit('d').battery).toBe(92);
    expect(s.unit('d').pending).toBeNull();
    expect(s.drainEvents().filter(event => event.kind === 'obstacle' && !event.error)).toHaveLength(1);
  });
  it('does not bury a pile under a pushed boulder', () => {
    const grid = board('grass', 3, 1); grid.tiles[0][1] = 'rock';
    const s = new Simulation(grid, [unitDefinition('dozer', 'd', { x: 0, y: 0 })], {
      piles: [{ cell: { x: 2, y: 0 }, supplies: recipeSupplies('scout', 63) }],
    });
    const before = state(s);
    expect(s.orderObstacle('d', 'push', { x: 1, y: 0 }).ok).toBe(false); expect(state(s)).toBe(before);
    expect(s.moveObstacle('d', 'push', { x: 1, y: 0 }).ok).toBe(false); expect(state(s)).toBe(before);
  });
  it('pushes boulders while preserving the ground beneath, and moves entire loose piles without changing charge', () => {
    const grid = board(); grid.tiles[2][2] = 'rock'; grid.tiles[2][3] = 'sand';
    const s = new Simulation(grid, [unitDefinition('dozer', 'd', { x: 1, y: 2 })]);
    expect(s.moveObstacle('d', 'push', { x: 2, y: 2 }).ok).toBe(true);
    s.move('d', { x: 2, y: 2 }); s.step(2); s.moveObstacle('d', 'push', { x: 3, y: 2 });
    expect(s.grid.tiles[2].slice(2, 5)).toEqual(['grass', 'sand', 'rock']);
    const supplies = { ...partCounts(4, 2, 1, 3), batteries: [0, 63] };
    const piles = new Simulation(board(), [unitDefinition('dozer', 'd', { x: 1, y: 2 })], { piles: [{ cell: { x: 2, y: 2 }, supplies }] });
    expect(piles.moveObstacle('d', 'push', { x: 2, y: 2 }).ok).toBe(true);
    expect(piles.pileAt({ x: 2, y: 2 })).toBeUndefined(); expect(piles.pileAt({ x: 3, y: 2 })?.supplies).toEqual(supplies);
    expect(piles.unit('d').battery).toBe(97); expect(piles.unit('d').cargo).toEqual(emptySupplies());
  });
  it('selects a legal working side and drives there before pushing a distant boulder', () => {
    const grid = board(); grid.tiles[2][6] = 'rock'; grid.tiles[2][7] = 'water';
    const s = new Simulation(grid, [unitDefinition('dozer', 'd', { x: 0, y: 2 })]);
    expect(s.orderObstacle('d', 'push', { x: 6, y: 2 }).ok).toBe(true); s.step(20);
    expect(s.grid.tiles[2][6]).toBe('grass'); expect(s.grid.tiles[2][7]).toBe('water');
    expect(s.grid.tiles.flat().filter(t => t === 'rock')).toHaveLength(1);
    expect(s.drainEvents().filter(e => e.kind === 'obstacle' && !e.error)).toHaveLength(1);
  });
  it('revalidates destination occupancy on arrival without pushing or charging for failed work', () => {
    const grid = board(); grid.tiles[2][6] = 'rock';
    const s = new Simulation(grid, [unitDefinition('dozer', 'd', { x: 0, y: 2 }), unitDefinition('scout', 's', { x: 7, y: 1 })]);
    s.orderObstacle('d', 'push', { x: 6, y: 2 }); s.move('s', { x: 7, y: 2 }); s.step(20);
    expect(s.grid.tiles[2][6]).toBe('rock'); expect(s.unit('d').battery).toBe(95);
    expect(s.unit('d').pending).toBeNull(); expect(s.drainEvents().some(e => e.kind === 'obstacle' && e.error)).toBe(true);
  });
  it('rejects blockers, protected flags, and inappropriate workers without replacing existing orders', () => {
    const grid = board(); grid.tiles[2][6] = 'rock'; grid.tiles[2][7] = 'tree';
    const s = new Simulation(grid, [unitDefinition('dozer', 'd', { x: 0, y: 2 })], { goals: [{ id: 'f', name: 'Flag', cell: { x: 6, y: 1 } }] });
    s.move('d', { x: 2, y: 2 }); const before = state(s);
    expect(s.orderObstacle('d', 'uproot', { x: 7, y: 2 }).ok).toBe(false); expect(state(s)).toBe(before);
    const trapped = board(); trapped.tiles[2][2] = 'rock';
    for (const p of [{ x: 3, y: 2 }, { x: 2, y: 1 }, { x: 2, y: 3 }]) trapped.tiles[p.y][p.x] = 'water';
    const blocked = new Simulation(trapped, [unitDefinition('dozer', 'd', { x: 1, y: 2 })]);
    const initial = state(blocked); expect(blocked.orderObstacle('d', 'push', { x: 2, y: 2 }).ok).toBe(false); expect(state(blocked)).toBe(initial);
  });
});

describe('Arborbot tree conservation', () => {
  it('travels to uproot, slows while loaded, and restores a planted site’s underlying terrain', () => {
    const grid = board(); grid.tiles[2][6] = 'tree'; grid.tiles[3][5] = 'sand';
    const s = new Simulation(grid, [unitDefinition('arborbot', 'a', { x: 0, y: 2 })]);
    const count = treeCount(s); s.orderObstacle('a', 'uproot', { x: 6, y: 2 }); s.step(10);
    expect(s.unit('a').carryingTree).toBe(true); expect(treeCount(s)).toBe(count); expect(s.grid.tiles[2][6]).toBe('grass');
    const start = s.unit('a').cell; s.move('a', { x: start.x + 1, y: start.y }); s.step(.2);
    expect(s.unit('a').progress).toBeCloseTo(.2 * unitSpecs.arborbot.speed * .65);
    s.step(2); s.move('a', { x: 5, y: 2 }); s.step(2);
    expect(s.moveObstacle('a', 'plant', { x: 5, y: 3 }).ok).toBe(true); expect(treeCount(s)).toBe(count);
    expect(s.moveObstacle('a', 'uproot', { x: 5, y: 3 }).ok).toBe(true); expect(s.grid.tiles[3][5]).toBe('sand'); expect(treeCount(s)).toBe(count);
    expect(grid.tiles[2][6]).toBe('tree'); expect(grid.tiles[3][5]).toBe('sand');
  });
  it.each(['dismantle', 'wreck'] as const)('keeps a carried tree recoverable after %s without obstructing salvage', action => {
    const grid = board(); grid.tiles[2][2] = 'tree';
    const enemy = { ...enemyDefinition('crab', 'e', { x: 0, y: 2 }), damage: 100, speed: 0 };
    const s = new Simulation(grid, [unitDefinition('arborbot', 'a', { x: 1, y: 2 }), unitDefinition('arborbot', 'b', { x: 1, y: 3 })], { enemies: action === 'wreck' ? [enemy] : [] });
    s.moveObstacle('a', 'uproot', { x: 2, y: 2 });
    if (action === 'wreck') s.step(.01); else s.dismantle('a');
    expect(treeCount(s)).toBe(1); expect(s.looseTrees).toEqual([{ x: 1, y: 2 }]); expect(s.grid.tiles[2][1]).toBe('grass');
    expect(s.pileAt({ x: 1, y: 2 })?.supplies).toEqual(recipeSupplies('arborbot', action === 'wreck' ? 0 : 97));
    expect(s.moveObstacle('b', 'uproot', { x: 1, y: 2 }).ok).toBe(true); expect(treeCount(s)).toBe(1);
    expect(s.looseTrees).toHaveLength(0); expect(s.unit('b').carryingTree).toBe(true);
  });
  it('rejects planting on a route, pile or flag and lifting a second tree atomically', () => {
    const grid = board(); grid.tiles[2][3] = 'tree'; grid.tiles[1][2] = 'tree';
    const s = new Simulation(grid, [unitDefinition('arborbot', 'a', { x: 2, y: 2 })], { goals: [{ id: 'f', name: 'Flag', cell: { x: 1, y: 2 } }], piles: [{ cell: { x: 2, y: 3 }, supplies: recipeSupplies('scout', 31) }] });
    s.moveObstacle('a', 'uproot', { x: 3, y: 2 }); const before = state(s);
    for (const [action, cell] of [['uproot', { x: 2, y: 1 }], ['plant', { x: 1, y: 2 }], ['plant', { x: 2, y: 3 }]] as const) {
      expect(s.moveObstacle('a', action, cell).ok).toBe(false); expect(state(s)).toBe(before);
    }
  });
});

describe('automatic support', () => {
  it('lets a stationary Sentry fight automatically, become depleted, then recover through a battery swap', () => {
    const s = new Simulation(board(), [unitDefinition('sentry', 's', { x: 2, y: 2 }, 1)], { enemies: [{ ...enemyDefinition('crab', 'c', { x: 3, y: 2 }), maxHealth: 6, damage: 0, speed: 0 }] });
    s.step(.01); expect(s.enemies).toHaveLength(0); expect(s.unit('s').status).toBe('depleted'); expect(s.unit('s').battery).toBe(0);
    expect(s.replaceBattery('s').ok).toBe(true); expect(s.unit('s').battery).toBe(100); expect(s.unit('s').status).toBe('idle');
    expect(s.pileAt({ x: 2, y: 2 })?.supplies.batteries).toEqual([0]);
  });
  it.each([['pump', 'scout', 'warden', 'grass'], ['workshop', 'warden', 'hauler', 'grass'], ['marina', 'freighter', 'fish', 'water']] as const)('%s refills only its supported family and revives an intact depleted unit', (kind, targetKind, otherKind, terrain) => {
    const s = new Simulation(board(terrain), [unitDefinition(kind, 'station', { x: 2, y: 2 }), unitDefinition(targetKind, 'target', { x: 3, y: 2 }, 0), unitDefinition(otherKind, 'other', { x: 2, y: 3 }, 0)]);
    s.step(.01); expect(s.unit('target').battery).toBe(6); expect(s.unit('target').status).toBe('idle'); expect(s.unit('other').battery).toBe(0);
    expect(s.unit('station').battery).toBe(0); expect(s.unit('station').status).toBe('idle');
    expect(s.move('target', { x: 4, y: 2 }).ok).toBe(true); s.step(2); expect(s.unit('target').cell).toEqual({ x: 4, y: 2 });
  });
  it('lets Mender spend its charge on one adjacent bot per pulse, stopping when empty', () => {
    const s = new Simulation(board(), [unitDefinition('mender', 'm', { x: 2, y: 2 }, 1), unitDefinition('warden', 'w', { x: 3, y: 2 }, 0), unitDefinition('arborbot', 'a', { x: 2, y: 3 }, 20), unitDefinition('hauler', 'h', { x: 1, y: 2 }, 0)]);
    s.step(3); expect(s.unit('w').battery).toBe(6); expect(s.unit('m').battery).toBe(0); expect(s.unit('m').status).toBe('depleted');
    expect(s.unit('a').battery).toBe(20); expect(s.unit('h').battery).toBe(0);
  });
  it('keeps support cadence independent of caller frame size, capped at full charge and restricted to adjacency', () => {
    const make = () => new Simulation(board(), [unitDefinition('workshop', 's', { x: 2, y: 2 }), unitDefinition('warden', 'w', { x: 3, y: 2 }, 80), unitDefinition('mender', 'diagonal', { x: 3, y: 3 }, 40)]);
    const fine = make(), coarse = make(); coarse.step(5); for (let frame = 0; frame < 300; frame++) fine.step(1 / 60);
    expect(coarse.units.map(u => u.battery)).toEqual(fine.units.map(u => u.battery)); expect(coarse.unit('w').battery).toBe(100);
    // The diagonal Mender can refill Warden itself, but cannot draw power from the workshop.
    expect(coarse.unit('diagonal').battery).toBeLessThanOrEqual(40);
    expect(coarse.drainEvents().filter(e => e.kind === 'recharge' && e.targetId === 'diagonal')).toHaveLength(0);
  });
  it('gives non-battery structures integrity without inventing battery salvage', () => {
    const s = new Simulation(board(), [unitDefinition('pump', 'p', { x: 2, y: 2 })], { enemies: [{ ...enemyDefinition('crab', 'c', { x: 3, y: 2 }), speed: 0, damage: 4 }] });
    s.step(.01); expect(s.unit('p').integrity).toBe(96); expect(s.unit('p').battery).toBe(0);
    s.enemies[0].damage = 100; s.step(1); expect(s.units).toHaveLength(0);
    expect(s.pileAt({ x: 2, y: 2 })?.supplies).toEqual(recipeSupplies('pump'));
  });
});

describe('all released hostile families', () => {
  it.each(enemyKinds)('%s obeys terrain while wandering and drops charged salvage once when defeated', kind => {
    const water = ['water-crab', 'shark'].includes(kind), grid = board(water ? 'deep-water' : 'grass');
    if (kind === 'scorpion' || kind === 'trex') grid.tiles[2][3] = 'rough';
    const enemy = { ...enemyDefinition(kind, 'e', { x: 3, y: 2 }), damage: 0 };
    const wander = new Simulation(grid, [], { enemies: [enemy], seed: 51 }), visited = new Set<string>();
    for (let frame = 0; frame < 600; frame++) {
      wander.step(1 / 60); const creature = wander.enemies[0]; visited.add(key(creature.cell));
      for (const cell of [creature.cell, ...(creature.next ? [creature.next] : [])]) expect(walkable(grid, cell, enemySpecs[kind].mobility)).toBe(true);
    }
    expect(visited.size).toBeGreaterThan(1);
    const fighter = unitDefinition(water ? 'patrolboat' : 'warden', 'f', { x: 2, y: 2 }); fighter.damage = 100;
    const s = new Simulation(grid, [fighter], { enemies: [enemy] }); s.step(.01);
    expect(s.enemies).toHaveLength(0); expect(s.pileAt({ x: 3, y: 2 })?.supplies).toEqual(enemySpecs[kind].loot);
    expect(load(enemySpecs[kind].loot)).toBeGreaterThan(1);
    expect(s.pileAt({ x: 3, y: 2 })?.supplies.batteries.every(charge => charge > 0)).toBe(true);
    const event = s.drainEvents().find(event => event.kind === 'destroyed');
    expect(event).toMatchObject({ faction: 'enemy', salvage: enemySpecs[kind].loot });
    if (event?.kind !== 'destroyed') throw new Error('Missing wreck event');
    expect(event.salvage).not.toBe(s.piles[0].supplies);
    expect(event.salvage.batteries).not.toBe(s.piles[0].supplies.batteries);
    expect(event.salvage.batteries).not.toBe(enemySpecs[kind].loot.batteries);
    const before = JSON.stringify(s.piles); s.step(3); expect(JSON.stringify(s.piles)).toBe(before);
  });
  it('lets a Gator cross a shoreline while a land Crab cannot', () => {
    const grid = board('water', 5, 1); grid.tiles[0][0] = 'grass'; grid.tiles[0][4] = 'grass';
    for (const kind of ['gator', 'crab'] as EnemyKind[]) {
      const s = new Simulation(grid, [unitDefinition('scout', 's', { x: 4, y: 0 })], { enemies: [{ ...enemyDefinition(kind, 'e', { x: 0, y: 0 }), detectionRange: 6, loseRange: 8, damage: 0 }] });
      s.step(5); expect(s.enemies[0].target).toBe('s');
      expect(s.enemies[0].cell.x).toBe(kind === 'gator' ? 3 : 0);
    }
  });
});
