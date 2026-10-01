import { describe, expect, it } from 'vitest';
import { unitDefinition, unitSpecs } from '../src/core/catalog';
import { terrainAt, walkable } from '../src/core/grid';
import { Simulation } from '../src/core/simulation';
import { board } from '../src/levels/authored';
import { missions } from '../src/levels/missions';
import { go } from './helpers/campaign-play';

const grid = board(['......', '......', '......']);
describe('creature bonuses', () => {
  it('keeps a pre-positioned creature dormant until the main flag, then awards its star once', () => {
    const s = new Simulation(grid, [unitDefinition('scout', 'main', {x:0,y:0}), unitDefinition('duck', 'duck', {x:3,y:1})], {
      goals: [{id:'main',name:'Flag',cell:{x:5,y:0},unitId:'main'}],
      bonus: {kind:'arrival',name:'Nest',description:'',cell:{x:3,y:1},kinds:['duck']},
    });
    s.step(2); expect(s.bonusReached).toBe(false);
    go(s,'main',{x:5,y:0}); expect(s.bonusReached).toBe(true);
    expect(s.drainEvents().filter(e=>e.kind==='bonus-reached')).toHaveLength(1);
    go(s,'duck',{x:4,y:1}); go(s,'duck',{x:3,y:1});
    expect(s.drainEvents().filter(e=>e.kind==='bonus-reached')).toHaveLength(0);
  });
  it('does not let a substitute creature satisfy an original-unit rescue', () => {
    const s = new Simulation(grid, [unitDefinition('snail','original',{x:0,y:1}),unitDefinition('snail','copy',{x:5,y:1})], {
      goals:[{id:'main',name:'Main',cell:{x:5,y:1}}],
      bonus:{kind:'arrival',name:'Rescue',description:'',unitId:'original',cell:{x:3,y:1}},
    });
    go(s,'copy',{x:3,y:1}); expect(s.bonusReached).toBe(false);
    go(s,'copy',{x:5,y:0}); go(s,'original',{x:3,y:1}); expect(s.bonusReached).toBe(true);
  });
  it('requires the named species and enough remaining power', () => {
    const s = new Simulation(grid,[unitDefinition('duck','duck',{x:0,y:0}),unitDefinition('frog','frog',{x:0,y:2},50)],{
      goals:[{id:'main',name:'Main',cell:{x:0,y:0}}],
      bonus:{kind:'arrival',name:'Reserve',description:'',cell:{x:3,y:1},kinds:['frog'],minimumCharge:50},
    });
    go(s,'duck',{x:3,y:1}); expect(s.bonusReached).toBe(false); go(s,'duck',{x:5,y:0});
    go(s,'frog',{x:3,y:1}); expect(s.bonusReached).toBe(false);
  });
  it('requires a living tree to reach a garden star', () => {
    const map=board(['..T...', '......', '......']);
    const s=new Simulation(map,[unitDefinition('arborbot','a',{x:1,y:1})],{
      goals:[{id:'main',name:'Main',cell:{x:1,y:1}}],
      bonus:{kind:'arrival',name:'Garden',description:'',cell:{x:4,y:1},kinds:['arborbot'],carryingTree:true},
    });
    go(s,'a',{x:4,y:1}); expect(s.bonusReached).toBe(false);
    expect(s.orderObstacle('a','uproot',{x:2,y:0}).ok).toBe(true); s.step(5);
    go(s,'a',{x:4,y:1}); expect(s.bonusReached).toBe(true);
  });
  it('authors distinct creature targets for all 36 mains and bonuses', () => {
    for(const mission of missions){
      const bonus=mission.bonus;
      expect(bonus.kind).toBe('arrival');
      expect(terrainAt(mission.grid,bonus.cell),mission.name).not.toBeUndefined();
      expect(mission.goals.some(g=>g.cell.x===bonus.cell.x&&g.cell.y===bonus.cell.y)).toBe(false);
      const kinds=bonus.unitId?[mission.rovers.find(u=>u.id===bonus.unitId)!.kind]:[...bonus.kinds!];
      expect(kinds.some(kind=>walkable(mission.grid,bonus.cell,unitSpecs[kind].mobility)),mission.name).toBe(true);
    }
  });
});
