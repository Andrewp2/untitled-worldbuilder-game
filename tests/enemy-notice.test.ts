import { describe, expect, it } from 'vitest';
import { enemyDefinition, unitDefinition } from '../src/core/catalog';
import { Simulation, ENEMY_NOTICE_SECONDS } from '../src/core/simulation';
import { key, type Grid } from '../src/core/grid';

const grid: Grid = { width: 14, height: 6, tiles: Array.from({ length: 6 }, () => Array(14).fill('grass')) };
const enemy = () => ({ ...enemyDefinition('crab', 'crab', { x: 6, y: 2 }), detectionRange: 3, loseRange: 4 });

describe('enemy notice and authored patrols', () => {
  it('warns once and faces the detected unit before chasing', () => {
    const s = new Simulation(grid, [unitDefinition('scout', 'bait', { x: 3, y: 2 })], { enemies: [enemy()] });
    s.step(.01);
    expect(s.enemies[0]).toMatchObject({ target: 'bait', status: 'alerting', next: null, facing: { x: -1, y: 0 } });
    expect(s.drainEvents().filter(e => e.kind === 'enemy-alert')).toHaveLength(1);
    s.step(ENEMY_NOTICE_SECONDS - .02);
    expect(s.enemies[0].next).toBeNull(); expect(s.unit('bait').battery).toBe(100);
    s.step(.05); expect(s.enemies[0].next).not.toBeNull();
    expect(s.drainEvents().filter(e => e.kind === 'enemy-alert')).toHaveLength(0);
  });
  it('does not restart the notice timer when a second unit becomes the nearer target', () => {
    const s = new Simulation(grid, [unitDefinition('scout', 'bait', { x: 3, y: 2 }), unitDefinition('scout', 'second', { x: 4, y: 3 })], {
      enemies: [{ ...enemy(), speed: 0 }],
    });
    s.step(.01); expect(s.enemies[0].target).toBe('bait'); s.drainEvents();
    expect(s.move('bait', { x: 0, y: 2 }).ok).toBe(true); s.step(.12);
    expect(s.enemies[0].target).toBe('second');
    expect(s.enemies[0].alertRemaining).toBeLessThan(ENEMY_NOTICE_SECONDS - .1);
    expect(s.drainEvents().filter(e => e.kind === 'enemy-alert')).toHaveLength(0);
  });
  it('still resolves the automatic first volley for already adjacent combatants', () => {
    const s = new Simulation(grid, [unitDefinition('warden', 'guard', { x: 5, y: 2 })], { enemies: [enemy()] });
    s.step(.01);
    expect(s.unit('guard').battery).toBe(94);
    expect(s.enemies[0].health).toBe(12);
  });
  it('abandons the notice if its target escapes, and warns again on a fresh encounter', () => {
    const s = new Simulation(grid, [unitDefinition('scout', 'bait', { x: 3, y: 2 })], { enemies: [{ ...enemy(), speed: 0 }] });
    s.step(.01); s.drainEvents();
    s.move('bait', { x: 0, y: 2 }); s.step(2);
    expect(s.enemies[0].target).toBeNull(); expect(s.enemies[0].alertRemaining).toBe(0);
    s.move('bait', { x: 3, y: 2 }); s.step(2);
    expect(s.drainEvents().filter(e => e.kind === 'enemy-alert')).toHaveLength(1);
  });
  it('follows a repeatable circuit and safely waits for a blocked waypoint', () => {
    const patrol = [{ x: 6, y: 2 }, { x: 9, y: 2 }, { x: 9, y: 4 }, { x: 6, y: 4 }];
    const def = { ...enemy(), patrol };
    const a = new Simulation(grid, [], { enemies: [def], seed: 1 });
    const b = new Simulation(grid, [], { enemies: [def], seed: 99 });
    const visited = new Set<string>();
    for (let i = 0; i < 900; i++) { a.step(1 / 60); b.step(1 / 60); visited.add(key(a.enemies[0].cell)); }
    patrol.forEach(cell => expect(visited.has(key(cell))).toBe(true));
    expect(a.position(a.enemies[0])).toEqual(b.position(b.enemies[0]));
    expect(a.enemies[0].patrol).not.toBe(patrol);
    const blocked: Grid = { ...grid, tiles: grid.tiles.map(row => row.map(() => 'water')) };
    for (let x = 2; x <= 9; x++) blocked.tiles[2][x] = 'grass';
    const s = new Simulation(blocked, [unitDefinition('scout', 'bait', { x: 3, y: 2 })], {
      enemies: [{ ...def, detectionRange: 0, loseRange: 1, patrol: [{ x: 6, y: 2 }, { x: 3, y: 2 }] }],
    });
    s.step(8); expect(s.enemies[0].cell).toEqual({ x: 6, y: 2 });
    expect(s.enemies[0].next).toBeNull();
    expect(s.move('bait', { x: 2, y: 2 }).ok).toBe(true);
    for (let i = 0; i < 240; i++) s.step(1 / 60);
    expect(s.enemies[0].cell).not.toEqual(s.unit('bait').cell);
    expect(s.enemies[0].cell.x).toBeLessThan(6);
  });
  it('returns to its circuit after a moving bait escapes', () => {
    const s = new Simulation(grid, [unitDefinition('scout', 'bait', { x: 3, y: 2 })], {
      enemies: [{ ...enemy(), patrol: [{ x: 6, y: 2 }, { x: 9, y: 2 }] }],
    });
    s.step(.6); expect(s.enemies[0].target).toBe('bait');
    expect(s.move('bait', { x: 0, y: 5 }).ok).toBe(true);
    const returned = new Set<string>();
    for (let i = 0; i < 1800; i++) { s.step(1 / 60); if (!s.enemies[0].target) returned.add(key(s.enemies[0].cell)); }
    expect(s.enemies[0].target).toBeNull();
    expect(s.unit('bait').cell).toEqual({ x: 0, y: 5 });
    expect(returned.has('6,2'), JSON.stringify({ returned: [...returned], enemy: s.enemies[0], bait: s.units[0] })).toBe(true); expect(returned.has('9,2')).toBe(true);
  });
});
