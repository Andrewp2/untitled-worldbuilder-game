import { describe, expect, it } from 'vitest';
import { missions, createMission } from '../src/levels/missions';
import { worlds } from '../src/levels/world-map';
import { Campaign, PROGRESS_KEY } from '../src/core/campaign';
import { walkable } from '../src/core/grid';
import { build, clearEnemies, deliver, go, work } from './helpers/campaign-play';

const find = (id: string) => missions.find(m => m.id === id)!;
describe('complete 36-mission campaign', () => {
  it('has three exact groups of twelve, distinct authored boards and distinct challenge concepts', () => {
    expect(missions).toHaveLength(36); expect(worlds).toHaveLength(3);
    expect(new Set(missions.map(m => m.id)).size).toBe(36);
    expect(new Set(missions.map(m => JSON.stringify(m.grid.tiles))).size).toBe(36);
    expect(new Set(missions.map(m => m.challenge)).size).toBe(36);
    expect(missions.every(m => m.challenge && m.brief && m.goals.length === 1 && m.bonus)).toBe(true);
    for (const world of worlds) {
      expect(missions.filter(m => m.world === world.id).map(m => m.id)).toEqual(world.locations.map(pin => pin.id));
      expect(world.locations).toHaveLength(12);
      expect(world.locations.every(pin => walkable(world.grid, pin.cell))).toBe(true);
    }
  });
  it('gates every mission and both world boundaries on all earlier mains, persists awards, and resets the whole campaign', () => {
    const saved = new Map<string,string>(); const storage = {getItem:(key:string)=>saved.get(key)??null,setItem:(key:string,value:string)=>saved.set(key,value)};
    const ids = missions.map(m=>m.id), c = new Campaign(ids, storage);
    for (const [index, id] of ids.entries()) {
      expect(c.isUnlocked(id)).toBe(true);
      expect(ids.slice(index+1).every(later => !c.isUnlocked(later))).toBe(true);
      expect(c.start(id)).toBe(true); expect(c.earnBonus(id)).toBe(false);
      expect(c.finish(id)).toBe(true); expect(c.keepExploring()).toBe(true); expect(c.earnBonus(id)).toBe(true);
      c.returnToMap();
      expect(new Campaign(ids,storage).completed.size).toBe(index+1);
    }
    expect(c.completed.size).toBe(36); expect(c.bonuses.size).toBe(36);
    c.reset(); const fresh = new Campaign(ids,storage);
    expect(fresh.completed.size).toBe(0); expect(fresh.bonuses.size).toBe(0);
    expect(ids.filter(id=>fresh.isUnlocked(id))).toEqual([ids[0]]);
    expect(JSON.parse(saved.get(PROGRESS_KEY)!)).toEqual({completed:[],bonuses:[]});
  });
  it('preserves known old awards while inserted prerequisites still gate later worlds', () => {
    const storage = {getItem:()=>JSON.stringify({completed:['hollow-reach','bramble-crossing','rough-ridge','harbor-run'],bonuses:['hollow-reach','harbor-run']}),setItem:()=>{}};
    const c = new Campaign(missions.map(m=>m.id),storage);
    expect(c.completed.size).toBe(4); expect(c.bonuses.size).toBe(2);
    expect(c.isUnlocked('parts-and-paths')).toBe(true); expect(c.isUnlocked('rough-ridge')).toBe(false); expect(c.isUnlocked('harbor-run')).toBe(false);
  });
  it('completes Bramble main and bonus from its finite defender kit and camp supplies', () => {
    const m=find('bramble-crossing'), s=createMission(m); go(s,'scout',{x:3,y:6}); const guard=build(s,'warden',{x:5,y:5});
    clearEnemies(s,[guard]); go(s,guard,{x:15,y:9}); go(s,'scout',m.goals[0].cell); expect(s.mainComplete).toBe(true);
    go(s,'scout',{x:16,y:9}); go(s,'scout',{x:4,y:8}); expect(s.dismantle('scout').ok).toBe(true);
    const arbor=build(s,'arborbot',{x:4,y:8}); work(s,arbor,'uproot',{x:15,y:7}); go(s,arbor,m.bonus.cell);
    expect(s.bonusReached).toBe(true);
  });
});
