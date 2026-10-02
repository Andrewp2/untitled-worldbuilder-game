import { describe, expect, it } from 'vitest';
import { attackEnergy, enemyDefinition, recipeSupplies, unitDefinition } from '../src/core/catalog';
import type { Grid } from '../src/core/grid';
import { Simulation } from '../src/core/simulation';

const board = (water = false): Grid => ({ width: 14, height: 6, tiles: Array.from({ length: 6 }, () => Array(14).fill(water ? 'water' : 'grass')) });
const enemy = (water = false) => ({ ...enemyDefinition(water ? 'water-crab' : 'crab', 'enemy', { x: 6, y: 2 }), speed: 0, maxHealth: 100, detectionRange: 3, loseRange: 4 });

describe('enemy preference for units that can fight back', () => {
  it.each(['warden', 'sentry', 'patrolboat'] as const)('prefers a powered %s over a closer unarmed carrier', kind => {
    const water = kind === 'patrolboat';
    const s = new Simulation(board(water), [
      unitDefinition(water ? 'tug' : 'hauler', 'carrier', { x: 5, y: 2 }),
      unitDefinition(kind, 'fighter', { x: 8, y: 2 }),
    ], { enemies: [enemy(water)] });
    s.step(.01);
    expect(s.enemies[0].target).toBe('fighter');
    expect(s.unit('carrier').battery).toBe(100);
  });

  it.each(['warden', 'sentry', 'patrolboat'] as const)('does not prioritize an unpowered %s until its battery is replaced', kind => {
    const water = kind === 'patrolboat';
    const s = new Simulation(board(water), [
      unitDefinition(water ? 'tug' : 'hauler', 'carrier', { x: 5, y: 2 }),
      unitDefinition(kind, 'fighter', { x: 8, y: 2 }, attackEnergy(kind) - 1),
    ], { enemies: [enemy(water)], piles: [{ cell: { x: 9, y: 2 }, supplies: recipeSupplies(kind, 100) }] });
    s.step(.01); expect(s.enemies[0].target).toBe('carrier');
    expect(s.replaceBattery('fighter').ok).toBe(true);
    s.step(.01); expect(s.enemies[0].target).toBe('fighter');
  });

  it('lets a newly built tower draw attacks off a carrier without restarting attack or notice timers', () => {
    const s = new Simulation(board(), [unitDefinition('hauler', 'carrier', { x: 5, y: 2 })], {
      enemies: [enemy()], piles: [{ cell: { x: 6, y: 3 }, supplies: recipeSupplies('sentry', 100) }],
    });
    s.step(.01); expect(s.unit('carrier').battery).toBe(96); s.drainEvents();
    const tower = s.build('sentry', { x: 6, y: 3 }); expect(tower.ok).toBe(true);
    if (!tower.ok) throw new Error(tower.reason);
    s.step(.01);
    expect(s.enemies[0]).toMatchObject({ target: tower.id, alertRemaining: 0 });
    expect(s.drainEvents().some(event => event.kind === 'hit' && event.attackerId === 'enemy')).toBe(false);
    s.step(.9);
    expect(s.drainEvents().filter(event => event.kind === 'hit' && event.attackerId === 'enemy'))
      .toMatchObject([{ targetId: tower.id }]);
    expect(s.unit('carrier').battery).toBe(96);
  });

  it('keeps a chase among equally threatening fighters but turns to one that gets into fighting range', () => {
    const s = new Simulation(board(), [
      unitDefinition('warden', 'first', { x: 3, y: 2 }),
      unitDefinition('warden', 'second', { x: 10, y: 2 }),
    ], { enemies: [enemy()] });
    s.step(.01); expect(s.enemies[0].target).toBe('first');
    expect(s.move('second', { x: 8, y: 2 }).ok).toBe(true); s.step(1.2);
    expect(s.unit('second').cell).toEqual({ x: 8, y: 2 });
    expect(s.enemies[0].target).toBe('first');
    expect(s.move('second', { x: 7, y: 2 }).ok).toBe(true); s.step(.6);
    expect(s.enemies[0].target).toBe('second');
    expect(s.drainEvents().some(event => event.kind === 'hit' && event.attackerId === 'enemy' && event.targetId === 'second')).toBe(true);
  });

  it('ignores fighters outside detection range and falls back to a carrier after its fighter disappears', () => {
    const s = new Simulation(board(), [
      unitDefinition('hauler', 'carrier', { x: 5, y: 2 }),
      unitDefinition('warden', 'fighter', { x: 10, y: 2 }),
    ], { enemies: [enemy()] });
    s.step(.01); expect(s.enemies[0].target).toBe('carrier');
    expect(s.move('fighter', { x: 8, y: 2 }).ok).toBe(true); s.step(1.2);
    expect(s.enemies[0].target).toBe('fighter');
    expect(s.dismantle('fighter').ok).toBe(true); s.step(.01);
    expect(s.enemies[0].target).toBe('carrier');
  });

  it('selects the same combatant regardless of roster order', () => {
    const units = [
      unitDefinition('hauler', 'carrier', { x: 5, y: 2 }),
      unitDefinition('warden', 'near', { x: 6, y: 3 }),
      unitDefinition('sentry', 'far', { x: 8, y: 2 }),
    ];
    for (const definitions of [units, [...units].reverse()]) {
      const s = new Simulation(board(), definitions, { enemies: [enemy()] });
      s.step(.01);
      expect(s.enemies[0].target).toBe('near');
      expect(s.unit('carrier').battery).toBe(100);
      expect(s.unit('near').battery).toBe(100 - attackEnergy('warden') - 4);
    }
  });
});
