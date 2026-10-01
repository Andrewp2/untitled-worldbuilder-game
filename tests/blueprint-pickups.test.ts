import { expect, it } from 'vitest';
import { unitDefinition, recipeSupplies } from '../src/core/catalog';
import { Simulation } from '../src/core/simulation';
import { board, pile } from '../src/levels/authored';
import { go } from './helpers/campaign-play';

const grid=board(['......','......','......']);
const definitions=[unitDefinition('duck','duck',{x:0,y:1})];
it('collects ground plans on arrival, spends them once, and never refunds them through dismantling',()=>{
  const s=new Simulation(grid,definitions,{blueprints:{},blueprintPickups:[{blueprint:'scout',cell:{x:2,y:1}}],
    piles:[pile(3,2,recipeSupplies('scout',100))]});
  expect(s.build('scout',{x:3,y:1}).ok).toBe(false);
  go(s,'duck',{x:2,y:1}); expect(s.blueprints.scout).toBe(1); expect(s.visibleBlueprints).toHaveLength(0);
  expect(s.drainEvents().filter(e=>e.kind==='blueprint-found')).toHaveLength(1);
  const built=s.build('scout',{x:3,y:1}); expect(built.ok).toBe(true); if(!built.ok)throw new Error(built.reason);
  expect(s.dismantle(built.id!).ok).toBe(true); expect(s.blueprints.scout).toBe(0);
  expect(s.build('scout',{x:3,y:1}).ok).toBe(false);
  go(s,'duck',{x:1,y:1}); go(s,'duck',{x:2,y:1}); expect(s.blueprints.scout).toBe(0);
});
it('reveals bonus plans only after the main and collects them only when visited',()=>{
  const s=new Simulation(grid,definitions,{blueprints:{},goals:[{id:'main',name:'Main',cell:{x:5,y:1}}],
    blueprintPickups:[{blueprint:'fish',cell:{x:2,y:1},afterMain:true}]});
  go(s,'duck',{x:2,y:1}); expect(s.visibleBlueprints).toHaveLength(0); expect(s.blueprints.fish).toBeUndefined();
  go(s,'duck',{x:5,y:1}); expect(s.visibleBlueprints).toHaveLength(1); expect(s.blueprints.fish).toBeUndefined();
  go(s,'duck',{x:2,y:1}); expect(s.blueprints.fish).toBe(1);
});
it('leaves the authored plan stock and cells intact for another visit',()=>{
  const setup={blueprints:{},blueprintPickups:[{blueprint:'duck' as const,cell:{x:2,y:1}}]};
  const s=new Simulation(grid,definitions,setup); go(s,'duck',{x:2,y:1});
  const fresh=new Simulation(grid,definitions,setup);
  expect(fresh.visibleBlueprints).toEqual(setup.blueprintPickups); expect(fresh.blueprints.duck).toBeUndefined();
});
