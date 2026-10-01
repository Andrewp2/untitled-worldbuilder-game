import { expect, it } from 'vitest';
import { recipeSupplies, unitDefinition, enemyDefinition } from '../src/core/catalog';
import { Simulation } from '../src/core/simulation';
import { board, pile, manifest, stock } from '../src/levels/authored';
import { go, work } from './helpers/campaign-play';

const grid=board(['.....','.....','.....']);
it('requires the loaded carrier at the flag; loose pieces and dead batteries do not count',()=>{
  const goal={id:'convoy',name:'Depot',cell:{x:3,y:1},kinds:['hauler' as const],cargo:manifest(2,1,0,0,1)};
  const s=new Simulation(grid,[unitDefinition('hauler','h',{x:1,y:1})],{
    goals:[goal],piles:[pile(3,0,stock(2,1,0,0,[0])),pile(4,2,stock(0,0,0,0,[70]))],
  });
  go(s,'h',goal.cell); expect(s.mainComplete).toBe(false);
  work(s,'h','pickup',{x:3,y:0}); work(s,'h','drop',goal.cell); expect(s.mainComplete).toBe(false);
  work(s,'h','pickup',goal.cell); go(s,'h',goal.cell); expect(s.mainComplete).toBe(false);
  work(s,'h','drop',{x:3,y:0}); work(s,'h','pickup',{x:4,y:2});
  // The hold now takes the required three colors, leaving the dead battery on the ground.
  work(s,'h','pickup',{x:3,y:0}); go(s,'h',goal.cell); expect(s.mainComplete).toBe(true);
  expect(s.unit('h').cargo.batteries).toEqual([70]);
  expect(s.drainEvents().filter(e=>e.kind==='goal-reached')).toHaveLength(1);
});
it('cannot replace an original rescue target with a newly built unit of the same species',()=>{
  const goal={id:'rescue',name:'Home',cell:{x:3,y:1},unitId:'original',kinds:['scout' as const]};
  const s=new Simulation(grid,[unitDefinition('scout','original',{x:0,y:1})],{
    goals:[goal],blueprints:{scout:1},piles:[pile(3,2,recipeSupplies('scout',100))],
  });
  const replacement=s.build('scout',goal.cell); expect(replacement.ok).toBe(true); expect(s.mainComplete).toBe(false);
  if(!replacement.ok)throw new Error('Expected a build.');
  go(s,replacement.id!,{x:4,y:1}); go(s,'original',goal.cell); expect(s.mainComplete).toBe(true);
});
it('allows a loaded arrival only after the last hostile is defeated',()=>{
  const s=new Simulation(grid,[unitDefinition('warden','guard',{x:1,y:1}),unitDefinition('hauler','h',{x:4,y:1})],{
    goals:[{id:'safe',name:'Depot',cell:{x:4,y:1},unitId:'h',cargo:manifest(2),clearEnemies:true}],
    piles:[pile(4,0,stock(2))],enemies:[enemyDefinition('crab','crab',{x:2,y:1})],
  });
  expect(s.transfer('h','pickup',{x:4,y:0}).ok).toBe(true); expect(s.mainComplete).toBe(false);
  s.step(5); expect(s.mainComplete).toBe(true);
});
