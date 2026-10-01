import { describe, expect, it } from 'vitest';
import { emptySupplies, unitDefinition, TERRAIN_ENERGY, recipeSupplies, load } from '../src/core/catalog';
import { adjacent, findPath, type Grid, type Cell } from '../src/core/grid';
import { Simulation } from '../src/core/simulation';
import { createMission, missions } from '../src/levels/missions';

const board = (): Grid => ({ width: 10, height: 5, tiles: Array.from({ length: 5 }, () => Array(10).fill('grass')) });
const run = (s: Simulation) => { for (let i = 0; i < 1200; i++) s.step(1 / 60); };
const snapshot = (s: Simulation) => JSON.stringify({ grid: s.grid, units: s.units, piles: s.piles });
const dirtTotal = (s: Simulation) => s.grid.tiles.flat().filter(tile => tile === 'grass' || tile === 'sand').length
  + s.units.reduce((n, unit) => n + (unit.cargo.soil ?? 0), 0) + s.piles.reduce((n, pile) => n + (pile.supplies.soil ?? 0), 0);
const mission = missions.find(m => m.id === 'siltwater-reach')!;

describe('Scoop terrain work', () => {
  it('conserves land plus dirt through repeated dig/fill cycles and keeps authored grids pristine', () => {
    const authored = board(), s = new Simulation(authored, [unitDefinition('scoop', 's', { x: 2, y: 2 })]);
    const initial = dirtTotal(s);
    for (let i = 0; i < 8; i++) {
      expect(s.shapeTerrain('s', 'dig', { x: 3, y: 2 }).ok).toBe(true);
      expect(s.grid.tiles[2][3]).toBe('water'); expect(load(s.unit('s').cargo)).toBe(1);
      expect(dirtTotal(s)).toBe(initial);
      expect(s.shapeTerrain('s', 'fill', { x: 3, y: 2 }).ok).toBe(true);
      expect(s.unit('s').cargo).toEqual(emptySupplies()); expect(dirtTotal(s)).toBe(initial);
    }
    expect(s.unit('s').battery).toBe(100 - 16 * TERRAIN_ENERGY);
    s.shapeTerrain('s', 'dig', { x: 2, y: 1 });
    expect(authored.tiles[1][2]).toBe('grass');
    expect(new Simulation(authored, []).grid.tiles[1][2]).toBe('grass');
  });
  it('rejects occupied, reserved, protected, out-of-bounds, and obstructed sites without spending charge or changing terrain', () => {
    const s = new Simulation(board(), [unitDefinition('scoop', 's', { x: 2, y: 2 }), unitDefinition('scout', 'r', { x: 0, y: 0 })], {
      goals: [{ id: 'flag', name: 'Flag', cell: { x: 2, y: 1 } }],
      piles: [{ cell: { x: 1, y: 2 }, supplies: { red: 1, blue: 0, batteries: [] , yellow: 0, green: 0} }],
      bonus: { kind: 'delivery', name: 'Bonus', description: '', cell: { x: 2, y: 3 }, red: 1, blue: 0, chargedBatteries: 0 , yellow: 0, green: 0},
    });
    const initial = snapshot(s);
    for (const target of [{ x: 2, y: 2 }, { x: 2, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 3 }, { x: -1, y: 2 }]) {
      expect(s.orderTerrain('s', 'dig', target).ok).toBe(false); expect(snapshot(s)).toBe(initial);
    }
    s.move('r', { x: 3, y: 2 });
    expect(s.orderTerrain('s', 'dig', { x: 3, y: 2 }).ok).toBe(false);
    s.stop('r');
    for (const tile of ['tree', 'rock', 'bridge', 'water'] as const) {
      s.grid.tiles[2][3] = tile;
      const before = snapshot(s);
      expect(s.shapeTerrain('s', 'dig', { x: 3, y: 2 }).ok).toBe(false); expect(snapshot(s)).toBe(before);
    }
  });
  it('drives beside a distant target, rechecks arrival, and keeps failed or cancelled work atomic', () => {
    const s = new Simulation(board(), [unitDefinition('scoop', 's', { x: 0, y: 2 }), unitDefinition('scout', 'r', { x: 7, y: 1 })]);
    expect(s.orderTerrain('s', 'dig', { x: 7, y: 2 })).toEqual({ ok: true, queued: true });
    s.move('r', { x: 7, y: 2 }); run(s);
    expect(s.unit('s').cargo).toEqual(emptySupplies()); expect(s.grid.tiles[2][7]).toBe('grass');
    expect(s.unit('s').battery).toBe(94); expect(s.unit('s').pending).toBeNull();
    expect(s.drainEvents().some(event => event.kind === 'terrain' && event.error)).toBe(true);
    s.move('r', { x: 9, y: 0 }); run(s);
    expect(s.orderTerrain('s', 'dig', { x: 7, y: 2 }).ok).toBe(true);
    expect(s.unit('s').cargo.soil).toBe(1); expect(s.grid.tiles[2][7]).toBe('water');
    expect(s.orderTerrain('s', 'fill', { x: 7, y: 2 }).ok).toBe(true);
    s.orderTerrain('s', 'dig', { x: 0, y: 4 }); s.step(.1);
    const previous = snapshot(s);
    expect(s.orderTerrain('s', 'fill', { x: -1, y: 4 }).ok).toBe(false); expect(snapshot(s)).toBe(previous);
    s.stop('s'); run(s);
    expect(s.grid.tiles[4][0]).toBe('grass'); expect(s.unit('s').cargo.soil ?? 0).toBe(0);
  });
  it('rechecks available energy after travel and lets a paid last step finish without digging', () => {
    const s = new Simulation(board(), [unitDefinition('scoop', 's', { x: 0, y: 2 }, 3)]);
    expect(s.orderTerrain('s', 'dig', { x: 4, y: 2 }).ok).toBe(true); run(s);
    expect(s.unit('s').cell).toEqual({ x: 3, y: 2 }); expect(s.unit('s').battery).toBe(0);
    expect(s.unit('s').cargo).toEqual(emptySupplies()); expect(s.grid.tiles[2][4]).toBe('grass');
    expect(s.unit('s').pending).toBeNull(); expect(s.drainEvents().some(e => e.error)).toBe(true);
  });
  it('rejects cargo orders atomically and returns its dirt and recipe when taken apart', () => {
    const s = new Simulation(board(), [unitDefinition('scoop', 's', { x: 2, y: 2 }), unitDefinition('hauler', 'h', { x: 2, y: 4 })]);
    const initial = dirtTotal(s);
    s.shapeTerrain('s', 'dig', { x: 3, y: 2 });
    for (const action of ['pickup', 'drop'] as const) {
      const before = snapshot(s);
      expect(s.cargoOrderPreview('s', action, { x: 2, y: 3 }).ok).toBe(false);
      expect(s.orderCargo('s', action, { x: 2, y: 3 }).ok).toBe(false);
      expect(s.transfer('s', action, { x: 2, y: 3 }).ok).toBe(false);
      expect(snapshot(s)).toBe(before);
    }
    s.unit('s').battery = 0; s.dismantle('s');
    expect(s.pileAt({ x: 2, y: 2 })?.supplies).toEqual({ ...recipeSupplies('scoop', 0), soil: 1 });
    const build = s.build('scoop', { x: 3, y: 3 }); expect(build.ok).toBe(true);
    if (!build.ok) throw new Error(build.reason);
    expect(s.unit(build.id!).battery).toBe(0);
    expect(s.move(build.id!, { x: 4, y: 3 }).ok).toBe(false);
    expect(s.orderCargo('h', 'pickup', { x: 2, y: 2 }).ok).toBe(true); run(s);
    expect(s.unit('h').cargo.soil).toBe(1);
    expect(dirtTotal(s)).toBe(initial);
  });
  it('keeps an existing terrain order when an unsupported cargo order is attempted', () => {
    const s = new Simulation(board(), [unitDefinition('scoop', 's', { x: 0, y: 2 })]);
    s.orderTerrain('s', 'dig', { x: 7, y: 2 }); s.step(.1);
    const before = snapshot(s);
    expect(s.orderCargo('s', 'pickup', { x: 2, y: 3 }).ok).toBe(false);
    expect(snapshot(s)).toBe(before); run(s);
    expect(s.unit('s').cargo.soil).toBe(1);
  });
  it('rejects a full bucket, filling without dirt, low charge, and non-Scoop workers without mutation', () => {
    const s = new Simulation(board(), [unitDefinition('scoop', 's', { x: 2, y: 2 }), unitDefinition('scout', 'r', { x: 5, y: 2 })]);
    s.grid.tiles[3][2] = 'water';
    expect(s.shapeTerrain('s', 'fill', { x: 2, y: 3 }).ok).toBe(false);
    s.shapeTerrain('s', 'dig', { x: 3, y: 2 });
    let before = snapshot(s);
    expect(s.shapeTerrain('s', 'dig', { x: 2, y: 1 }).ok).toBe(false); expect(snapshot(s)).toBe(before);
    s.unit('s').battery = 2; before = snapshot(s);
    expect(s.shapeTerrain('s', 'fill', { x: 3, y: 2 }).ok).toBe(false); expect(snapshot(s)).toBe(before);
    expect(s.orderTerrain('r', 'dig', { x: 6, y: 2 }).ok).toBe(false);
  });
});

describe('Siltwater Reach', () => {
  it('requires a crossing, supports travel-and-work on both banks, and allows the flag and optional delivery to be completed', () => {
    const s = createMission(mission), authored = JSON.stringify(mission.grid);
    const work = (action: 'dig' | 'fill', target: Cell) => {
      expect(s.orderTerrain('scoop', action, target).ok).toBe(true); run(s);
      expect(adjacent(s.unit('scoop').cell, target)).toBe(true);
      expect(s.grid.tiles[target.y][target.x]).toBe(action === 'dig' ? 'water' : 'grass');
    };
    expect(findPath(s.grid, s.unit('scout').cell, mission.goals[0].cell)).toBeNull();
    work('dig', { x: 7, y: 5 }); work('fill', { x: 8, y: 6 });
    expect(findPath(s.grid, s.unit('scout').cell, mission.goals[0].cell)).toBeNull();
    work('dig', { x: 7, y: 7 }); work('fill', { x: 9, y: 6 });
    expect(s.unit('scoop').battery).toBeGreaterThan(60);
    expect(s.move('scoop', { x: 10, y: 5 }).ok).toBe(true); run(s);
    expect(s.move('scout', mission.goals[0].cell).ok).toBe(true); run(s);
    expect(s.reached.has('far-bank')).toBe(true);
    const built = s.build('hauler', { x: 5, y: 9 }); expect(built.ok).toBe(true);
    if (!built.ok) throw new Error(built.reason);
    expect(s.orderCargo(built.id!, 'pickup', { x: 4, y: 9 }).ok).toBe(true); run(s);
    expect(s.orderCargo(built.id!, 'drop', mission.bonus.cell).ok).toBe(true); run(s);
    expect(s.bonusReached, JSON.stringify(s.piles)).toBe(true);
    expect(JSON.stringify(mission.grid)).toBe(authored);
    expect(createMission(mission).grid.tiles[6][8]).toBe('water');
  });
});
