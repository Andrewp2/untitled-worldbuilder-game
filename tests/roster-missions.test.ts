import { build, clearEnemies, go, work } from './helpers/campaign-play';
import { constructionArea } from '../src/core/grid';
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
    const available = new Set(missions.flatMap(m => [...Object.keys(m.blueprints), ...(m.blueprintPickups ?? []).map(p => p.blueprint)]));
    expect(unitKinds.every(kind => available.has(kind))).toBe(true);
    for (const mission of missions) {
      const s = createMission(mission);
      expect(mission.goals).toHaveLength(1);
      expect(Object.values(mission.blueprints).every(count => Number.isInteger(count) && count! > 0)).toBe(true);
      expect(s.bonusUnlocked).toBe(false);
      for (const goal of mission.goals) if (!goal.cargo) expect(unitKinds.some(kind => (!goal.kinds || goal.kinds.includes(kind)) && (mission.rovers.some(unit => unit.kind === kind) || mission.blueprints[kind] || mission.blueprintPickups?.some(p => p.blueprint === kind)) && isMobile(kind) && walkable(mission.grid, goal.cell, unitSpecs[kind].mobility)), `${mission.name} → ${goal.name}`).toBe(true);
      expect(s.grid.tiles).not.toBe(mission.grid.tiles);
    }
  });
  it('solves the ridge first, then builds a land crossing and escorts the original Snail past the Crab', () => {
    const m = rosterMissions[0], s = createMission(m);
    expect(s.preview('snail', m.bonus.cell)).toBeNull();
    expect(findPath(s.grid, s.enemies[0].cell, {x:3,y:6}, new Set(), enemySpecs.crab.mobility)).toBeNull();
    go(s, 'scout', {x:4,y:7}); go(s, 'scout', {x:4,y:6}); expect(s.dismantle('scout').ok).toBe(true);
    const trail = build(s, 'trailbuggy', {x:4,y:6});
    expect(s.move(trail, m.goals[0].cell).ok).toBe(true); until(s, () => s.mainComplete);
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
  it('earns boats from maritime missions and each resident role from its own mission', () => {
    const boats = residentHomes.filter(h=>h.patrols.some(p=>unitSpecs[p.kind].family==='boat'));
    expect(boats.length).toBeGreaterThan(0);
    expect(boats.every(home => home.world === 'open-sea' && missions.find(m=>m.id===home.mission)!.rovers.some(unit=>unitSpecs[unit.kind].family==='boat'))).toBe(true);
    expect(residentHomes.some(h=>h.mission==='woodland-workshop' && h.patrols.some(p=>p.kind==='trailbuggy'))).toBe(true);
  });
  it('uses Mender through both valley encounters, then builds Arborbot from their different salvage colors', () => {
    const m=rosterMissions[1], s=createMission(m);
    clearEnemies(s,['warden'],120,['mender']);
    expect(s.move('warden',m.goals[0].cell).ok).toBe(true); until(s,()=>s.mainComplete);
    go(s, 'warden', { x: 16, y: 3 });
    const yellow = s.piles.find(p => p.supplies.yellow === 4)!;
    const rex = s.piles.find(p => p.supplies.green >= 4 && p.supplies.red >= 2)!;
    work(s, 'courier', 'pickup', yellow.cell); work(s, 'courier', 'drop', rex.cell);
    const site = constructionArea(rex.cell).find(cell => s.buildPreview('arborbot', cell).ok)!;
    const arbor = build(s, 'arborbot', site); work(s, arbor, 'uproot', { x: 5, y: 3 }); go(s, arbor, m.bonus.cell);
    expect(s.bonusReached).toBe(true);

  });
});
