import { describe, expect, it } from 'vitest';
import { unitDefinition, recipeSupplies } from '../src/core/catalog';
import type { Grid } from '../src/core/grid';
import { Simulation } from '../src/core/simulation';
import { createHollowReach, hollowGoals } from '../src/levels/hollow-reach';

const grid: Grid = { width: 5, height: 3, tiles: Array.from({ length: 3 }, () => Array(5).fill('grass')) };
const goals = [{ id: 'near', name: 'Near', cell: { x: 1, y: 1 } }, { id: 'far', name: 'Far', cell: { x: 3, y: 1 } }];

describe('rover arrival goals', () => {
  it('records actual arrival, including on the last charge, without requiring a structure', () => {
    const s = new Simulation(grid, [unitDefinition('scout','s',{ x: 0, y: 1 },1)], { goals });
    s.move('s',goals[0].cell); s.step(.1);
    expect(s.reached.size).toBe(0); expect(s.unit('s').battery).toBe(0);
    s.step(1);
    expect(s.reached.has('near')).toBe(true); expect(s.units).toHaveLength(1);
    expect(s.unit('s').status).toBe('depleted'); expect(s.relays).toHaveLength(0);
  });
  it('records intermediate flags in a large step and keeps them after the rover leaves', () => {
    const s = new Simulation(grid, [unitDefinition('scout','s',{ x: 0, y: 1 })], { goals });
    s.move('s',{ x: 4, y: 1 }); s.step(5);
    expect([...s.reached]).toEqual(['near','far']);
    expect(s.unit('s').cell).toEqual({ x: 4, y: 1 });
    const events = s.drainEvents().filter(event => event.kind === 'goal-reached');
    expect(events).toHaveLength(2);
    expect(events.filter(event => event.complete)).toHaveLength(1);
    s.move('s',{ x: 0, y: 1 }); s.step(5);
    expect(s.reached.size).toBe(2); expect(s.drainEvents()).toHaveLength(0);
  });
  it('does not count an adjacent rover or a relay built on a flag', () => {
    const s = new Simulation(grid, [unitDefinition('hauler','h',{ x: 0, y: 1 })], {
      goals: [goals[0]], piles: [{ cell: { x: 1, y: 0 }, supplies: recipeSupplies('relay') }],
    });
    expect(s.build('relay',goals[0].cell).ok).toBe(true); s.step(1);
    expect(s.reached.size).toBe(0); expect(s.drainEvents()).toHaveLength(0);
  });
  it('does not complete goals for hostile creatures', () => {
    const s = new Simulation(grid, [], { goals: [goals[0]], enemies: [{
      id: 'foe', kind: 'bristleback', name: 'Foe', start: goals[0].cell, speed: 1, maxHealth: 20, damage: 4,
      attackInterval: 1, detectionRange: 4, loseRange: 6, patrolRadius: 0,
    }] });
    s.step(2); expect(s.reached.size).toBe(0);
  });
  it('completes Hollow Reach through movement alone and resets objective history', () => {
    const s = createHollowReach();
    for (const goal of hollowGoals) {
      expect(s.move('hauler',goal.cell).ok).toBe(true); s.step(40);
      expect(s.reached.has(goal.id)).toBe(true);
    }
    expect(s.relays).toHaveLength(0); expect(s.piles).toEqual(createHollowReach().piles);
    expect(createHollowReach().reached.size).toBe(0);
  });
});
