import { describe, expect, it } from 'vitest';
import { isMobile, unitKinds, unitSpecs, load, enemySpecs } from '../src/core/catalog';
import { walkable, findPath } from '../src/core/grid';
import { createMission, missions } from '../src/levels/missions';
import { rosterMissions } from '../src/levels/roster-missions';
import { residentHomes } from '../src/view/world-residents';
import type { Simulation } from '../src/core/simulation';

const until = (s: Simulation, done: () => boolean, seconds = 45) => {
  for (let i = 0; i < seconds * 60 && !done(); i++) s.step(1 / 60);
  expect(done(), JSON.stringify({ units: s.units.map(u => ({id:u.id,cell:u.cell,battery:u.battery,order:u.pending})), enemies:s.enemies.map(e=>({kind:e.kind,health:e.health,cell:e.cell})) })).toBe(true);
};
const settled = (s: Simulation, id: string) => until(s, () => !s.unit(id).pending && !s.unit(id).next && !s.unit(id).goal);

describe('handcrafted campaign missions', () => {
  it('authors one main objective and one bonus per mission, with finite supplies of every released blueprint', () => {
    const available = new Set(missions.flatMap(m => Object.keys(m.blueprints)));
    expect(unitKinds.every(kind => available.has(kind))).toBe(true);
    for (const mission of missions) {
      const s = createMission(mission);
      expect(mission.goals).toHaveLength(1);
      expect(Object.values(mission.blueprints).every(count => Number.isInteger(count) && count! > 0)).toBe(true);
      expect(s.bonusUnlocked).toBe(false);
      for (const goal of mission.goals) expect(mission.rovers.some(unit => (!goal.kinds || goal.kinds.includes(unit.kind)) && isMobile(unit.kind) && walkable(mission.grid, goal.cell, unitSpecs[unit.kind].mobility)), `${mission.name} → ${goal.name}`).toBe(true);
      expect(s.grid.tiles).not.toBe(mission.grid.tiles);
    }
  });
  it('solves the ridge first, then builds a land crossing and escorts the original Snail past the Crab', () => {
    const m = rosterMissions[0], s = createMission(m);
    expect(s.preview('snail', m.bonus.cell)).toBeNull();
    expect(findPath(s.grid, s.enemies[0].cell, {x:3,y:6}, new Set(), enemySpecs.crab.mobility)).toBeNull();
    expect(s.move('trailbuggy', m.goals[0].cell).ok).toBe(true); until(s, () => s.mainComplete);
    expect(s.bonusUnlocked).toBe(true); expect(s.bonusReached).toBe(false);
    const scoop = s.build('scoop', {x:4,y:10}), warden = s.build('warden', {x:6,y:8});
    if (!scoop.ok || !warden.ok) throw new Error('The crossing and escort kits must be usable.');
    for (const [dig, fill] of [[{x:5,y:13},{x:9,y:12}],[{x:6,y:13},{x:10,y:12}],[{x:7,y:13},{x:11,y:12}]]) {
      expect(s.orderTerrain(scoop.id!, 'dig', dig).ok).toBe(true); settled(s, scoop.id!);
      expect(s.orderTerrain(scoop.id!, 'fill', fill).ok).toBe(true); settled(s, scoop.id!);
    }
    expect(s.move(scoop.id!, {x:8,y:11}).ok).toBe(true); settled(s,scoop.id!);
    expect(s.preview('snail', m.bonus.cell)).not.toBeNull();
    expect(s.move(warden.id!, {x:14,y:12}).ok).toBe(true); until(s, () => !s.enemies.length);
    expect(s.move(warden.id!, {x:15,y:8}).ok).toBe(true); settled(s, warden.id!);
    expect(s.move('snail', m.bonus.cell).ok).toBe(true); until(s, () => s.bonusReached);
    expect(s.blueprints.scoop).toBe(0); expect(s.blueprints.warden).toBe(0);
    expect(createMission(m).blueprints.scoop).toBe(1); expect(m.blueprints.warden).toBe(1);
  });
  it('requires two tree relocations for the grove, then opens the boxed-in supply pocket for the bonus', () => {
    const m = rosterMissions[1], s = createMission(m);
    expect(s.preview('arborbot', m.goals[0].cell)).toBeNull();
    expect(s.orderObstacle('arborbot', 'uproot', {x:9,y:6}).ok).toBe(true); settled(s,'arborbot');
    expect(s.preview('arborbot', m.goals[0].cell)).toBeNull();
    expect(s.orderObstacle('arborbot', 'plant', {x:8,y:5}).ok).toBe(true); settled(s,'arborbot');
    expect(s.orderObstacle('arborbot', 'uproot', {x:12,y:6}).ok).toBe(true); settled(s,'arborbot');
    expect(s.orderObstacle('arborbot', 'plant', {x:13,y:5}).ok).toBe(true); settled(s,'arborbot');
    expect(s.move('arborbot',m.goals[0].cell).ok).toBe(true); until(s,()=>s.mainComplete);
    expect(s.orderCargo('forklift','pickup',{x:6,y:10}).ok).toBe(false);
    expect(s.move('bulk',{x:5,y:8}).ok).toBe(true); settled(s,'bulk');
    expect(s.move('dozer',{x:5,y:9}).ok).toBe(true); settled(s,'dozer');
    expect(s.orderObstacle('dozer','push',{x:6,y:9}).ok).toBe(true); settled(s,'dozer');
    expect(s.orderCargo('forklift','pickup',{x:6,y:10}).ok).toBe(true); settled(s,'forklift');
    expect(s.orderCargo('forklift','drop',m.bonus.cell).ok).toBe(true); until(s,()=>s.bonusReached);
  });
  it('guides Frog through shallow water, then unlocks the original Duck’s return journey', () => {
    const m = rosterMissions[2], s = createMission(m);
    expect(s.move('frog',m.goals[0].cell).ok).toBe(true); until(s,()=>s.mainComplete);
    expect(s.bonusReached).toBe(false);
    expect(s.move('duck',m.bonus.cell).ok).toBe(true); until(s,()=>s.bonusReached);
  });
  it('escorts Freighter to the harbor and completes the shore delivery with live water hazards', () => {
    const m = rosterMissions[3], s = createMission(m);
    expect(s.move('patrolboat',{x:13,y:4}).ok).toBe(true); s.step(4);
    expect(s.move('freighter',m.goals[0].cell).ok).toBe(true); until(s,()=>s.mainComplete);
    expect(s.orderCargo('freighter','pickup',{x:6,y:7}).ok).toBe(true); settled(s,'freighter');
    expect(s.orderCargo('freighter','drop',m.bonus.cell).ok).toBe(true); until(s,()=>s.bonusReached);
  });
  it('earns boats only from the maritime mission, and bot residents from their own mission', () => {
    expect(residentHomes.filter(h=>h.patrols.some(p=>unitSpecs[p.kind].family==='boat')).map(h=>h.mission)).toEqual(['harbor-run']);
    expect(residentHomes.some(h=>h.mission==='woodland-workshop' && h.patrols.some(p=>p.kind==='arborbot'))).toBe(true);
  });
  it('uses Mender through both valley encounters before the main goal, then delivers conserved salvage', () => {
    const m=rosterMissions[4], s=createMission(m);
    s.move('warden',{x:12,y:7}); s.move('mender',{x:12,y:6}); until(s,()=>!s.enemies.some(e=>e.kind==='scorpion'));
    s.move('warden',{x:13,y:12}); s.move('mender',{x:12,y:12}); until(s,()=>!s.enemies.length);
    until(s,()=>s.unit('warden').battery>=95);
    expect(s.move('warden',m.goals[0].cell).ok).toBe(true); until(s,()=>s.mainComplete);
    const sources=s.piles.filter(p=>p.supplies.yellow || p.supplies.green).map(p=>({...p.cell}));
    for(const cell of sources) while(s.pileAt(cell) && load(s.pileAt(cell)!.supplies)>0 && !s.bonusReached) {
      expect(s.orderCargo('courier','pickup',cell).ok).toBe(true); settled(s,'courier');
      if(s.replacementCharge('courier')!==null) s.replaceBattery('courier');
      expect(s.orderCargo('courier','drop',m.bonus.cell).ok).toBe(true); settled(s,'courier');
    }
    const courier=s.unit('courier'), spare=s.piles.filter(p=>p.supplies.batteries.some(c=>c>0)).sort((a,b)=>Math.abs(a.cell.x-courier.cell.x)+Math.abs(a.cell.y-courier.cell.y)-Math.abs(b.cell.x-courier.cell.x)-Math.abs(b.cell.y-courier.cell.y))[0];
    expect(spare).toBeDefined();
    expect(s.orderCargo('courier','pickup',spare.cell).ok).toBe(true); settled(s,'courier');
    expect(s.orderCargo('courier','drop',m.bonus.cell).ok).toBe(true); until(s,()=>s.bonusReached);
  });
});
