import { expect, it } from 'vitest';
import { recipeSupplies, unitDefinition, enemyDefinition } from '../src/core/catalog';
import { Simulation } from '../src/core/simulation';
import { board, pile, shipment, stock } from '../src/levels/authored';
import { go, work } from './helpers/campaign-play';

const grid = board(['.....', '.....', '.....']);
it('requires the actual colored shipment and a charged battery, rather than an empty carrier at the flag', () => {
  const goal = { id: 'delivery', name: 'Depot', cell: { x: 3, y: 1 }, delivery: shipment(2, 1, 0, 0, 1) };
  const s = new Simulation(grid, [unitDefinition('hauler', 'h', { x: 1, y: 1 })], {
    goals: [goal], piles: [pile(3, 0, stock(2, 1, 0, 0, [0])), pile(4, 2, stock(0, 0, 0, 0, [70]))],
  });
  go(s, 'h', goal.cell); expect(s.mainComplete).toBe(false);
  work(s, 'h', 'pickup', { x: 3, y: 0 }); work(s, 'h', 'drop', goal.cell);
  expect(s.mainComplete).toBe(false);
  work(s, 'h', 'pickup', { x: 4, y: 2 }); work(s, 'h', 'drop', goal.cell);
  expect(s.mainComplete).toBe(true);
  expect(s.drainEvents().filter(e => e.kind === 'goal-reached' && e.complete)).toHaveLength(1);
  s.step(10); expect(s.drainEvents().filter(e => e.kind === 'goal-reached')).toHaveLength(0);
});
it('cannot replace an original rescue target with a newly built unit of the same species', () => {
  const goal = { id: 'rescue', name: 'Home', cell: { x: 3, y: 1 }, unitId: 'original', kinds: ['scout' as const] };
  const s = new Simulation(grid, [unitDefinition('scout', 'original', { x: 0, y: 1 })], {
    goals: [goal], blueprints: { scout: 1 }, piles: [pile(3, 2, recipeSupplies('scout', 100))],
  });
  const replacement = s.build('scout', goal.cell); expect(replacement.ok).toBe(true); expect(s.mainComplete).toBe(false);
  if (!replacement.ok) throw new Error('Expected a build.');
  go(s, replacement.id!, { x: 4, y: 1 }); go(s, 'original', goal.cell);
  expect(s.mainComplete).toBe(true);
});
it('records a predeposited shipment only when the last hostile is actually defeated', () => {
  const s = new Simulation(grid, [unitDefinition('warden', 'guard', {x:1,y:1})], {
    goals: [{id:'safe-depot',name:'Safe depot',cell:{x:4,y:1},delivery:shipment(2),clearEnemies:true}],
    piles: [pile(4,1,stock(2))], enemies: [enemyDefinition('crab','crab',{x:2,y:1})],
  });
  expect(s.mainComplete).toBe(false); s.step(5);
  expect(s.enemies).toHaveLength(0); expect(s.mainComplete).toBe(true);
  expect(s.drainEvents().filter(e=>e.kind==='goal-reached')).toHaveLength(1);
});
