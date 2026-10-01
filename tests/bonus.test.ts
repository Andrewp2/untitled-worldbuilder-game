import { describe, expect, it } from 'vitest';
import { unitDefinition, type Supplies } from '../src/core/catalog';
import { unitSpecs, supportsCargo } from '../src/core/catalog';
import { type Cell, type Grid, walkable, findPath } from '../src/core/grid';
import { Simulation, type DeliveryObjective } from '../src/core/simulation';
import { missions } from '../src/levels/missions';

const grid: Grid = { width: 5, height: 3, tiles: Array.from({ length: 3 }, () => Array(5).fill('grass')) };
const batteryBonus: DeliveryObjective = { kind: 'delivery', name: 'Power', description: 'Deliver a charged battery.', cell: { x: 3, y: 1 }, red: 0, blue: 0, chargedBatteries: 1 , yellow: 0, green: 0};
function delivery(supplies: Supplies, bonus = batteryBonus, target: Cell = bonus.cell) {
  const simulation = new Simulation(grid, [unitDefinition('hauler', 'h', { x: 1, y: 1 })], {
    bonus, goals: [{ id: 'main', name: 'Main', cell: { x: 1, y: 1 } }], piles: [{ cell: { x: 1, y: 0 }, supplies }],
  });
  simulation.drainEvents();
  expect(simulation.transfer('h', 'pickup', { x: 1, y: 0 }).ok).toBe(true);
  expect(simulation.move('h', { x: 2, y: 1 }).ok).toBe(true); simulation.step(2);
  expect(simulation.transfer('h', 'drop', target).ok).toBe(true);
  return simulation;
}

describe('authored delivery bonuses', () => {
  it.each([
    [{ red: 0, blue: 0, batteries: [0] , yellow: 0, green: 0}, batteryBonus.cell],
    [{ red: 0, blue: 0, batteries: [100] , yellow: 0, green: 0}, { x: 2, y: 2 }],
  ])('does not reward dead batteries or deliveries to other tiles', (supplies, target) => {
    const simulation = delivery(supplies, batteryBonus, target);
    expect(simulation.bonusReached).toBe(false); expect(simulation.drainEvents()).toHaveLength(0);
  });
  it('rewards a charged battery once and preserves its charge through delivery and retrieval', () => {
    const simulation = delivery({ red: 0, blue: 0, batteries: [0, 87] , yellow: 0, green: 0});
    expect(simulation.bonusReached).toBe(true);
    expect(simulation.pileAt(batteryBonus.cell)?.supplies.batteries).toEqual([0, 87]);
    expect(simulation.drainEvents().filter(event => event.kind === 'bonus-reached')).toHaveLength(1);
    expect(simulation.transfer('h', 'pickup', batteryBonus.cell).ok).toBe(true);
    expect(simulation.bonusReached).toBe(true); expect(simulation.unit('h').cargo.batteries).toEqual([0, 87]);
    simulation.transfer('h', 'drop', batteryBonus.cell);
    expect(simulation.drainEvents()).toHaveLength(0);
  });
  it('waits for all required materials across separate deliveries', () => {
    const bonus = { ...batteryBonus, red: 3, blue: 1, chargedBatteries: 0 , yellow: 0, green: 0};
    const simulation = delivery({ red: 3, blue: 0, batteries: [] , yellow: 0, green: 0}, bonus);
    expect(simulation.bonusReached).toBe(false);
    simulation.piles.push({ cell: { x: 2, y: 0 }, supplies: { red: 0, blue: 1, batteries: [] , yellow: 0, green: 0} });
    simulation.transfer('h', 'pickup', { x: 2, y: 0 });
    simulation.transfer('h', 'drop', bonus.cell);
    expect(simulation.bonusReached).toBe(true);
    expect(simulation.pileAt(bonus.cell)?.supplies).toEqual({ red: 3, blue: 1, batteries: [] , yellow: 0, green: 0});
    expect(simulation.drainEvents()).toHaveLength(1);
  });
  it('places optional pads away from flags, reachable by a mission carrier or an authored terrain worker', () => {
    for (const mission of missions) {
      expect(walkable(mission.grid, mission.bonus.cell)).toBe(true);
      if (mission.bonus.kind !== 'delivery') continue;
      const accessible = mission.rovers.filter(unit => supportsCargo(unit.kind)).some(unit =>
        [{x:mission.bonus.cell.x+1,y:mission.bonus.cell.y},{x:mission.bonus.cell.x-1,y:mission.bonus.cell.y},{x:mission.bonus.cell.x,y:mission.bonus.cell.y+1},{x:mission.bonus.cell.x,y:mission.bonus.cell.y-1}]
          .some(cell => findPath(mission.grid, unit.start, cell, new Set(), unitSpecs[unit.kind].mobility)));
      if (!accessible) expect(Object.keys(mission.blueprints).some(plan => ['scoop', 'arborbot', 'dozer', 'hauler'].includes(plan))).toBe(true);
      expect(mission.goals.some(goal => goal.cell.x === mission.bonus.cell.x && goal.cell.y === mission.bonus.cell.y)).toBe(false);
    }
  });
});


it('checks every authored bonus color and does not substitute an equal total of parts', () => {
  const bonus = { ...batteryBonus, red: 1, blue: 1, yellow: 1, green: 1, chargedBatteries: 0 };
  const s = delivery({ red: 2, blue: 1, yellow: 1, green: 0, batteries: [] }, bonus);
  expect(s.bonusReached).toBe(false);
  s.piles.push({ cell: { x: 2, y: 0 }, supplies: { red: 0, blue: 0, yellow: 0, green: 1, batteries: [] } });
  s.transfer('h', 'pickup', { x: 2, y: 0 }); s.transfer('h', 'drop', bonus.cell);
  expect(s.bonusReached).toBe(true);
});


it('keeps a pre-positioned delivery dormant until the main goal and a later delivery action', () => {
  const s=new Simulation(grid,[unitDefinition('hauler','h',{x:1,y:1})],{
    goals:[{id:'main',name:'Main',cell:{x:4,y:1}}], bonus:batteryBonus,
    piles:[{cell:{x:1,y:0},supplies:{red:0,blue:0,yellow:0,green:0,batteries:[87]}}],
  });
  s.transfer('h','pickup',{x:1,y:0}); s.move('h',{x:2,y:1}); s.step(2); s.transfer('h','drop',batteryBonus.cell);
  expect(s.bonusUnlocked).toBe(false); expect(s.bonusReached).toBe(false);
  s.move('h',{x:4,y:1}); s.step(2);
  expect(s.bonusUnlocked).toBe(true); expect(s.bonusReached).toBe(false);
  s.transfer('h','pickup',batteryBonus.cell); s.transfer('h','drop',batteryBonus.cell);
  expect(s.bonusReached).toBe(true);
});
it('does not let a substitute creature satisfy an original-unit rescue', () => {
  const s=new Simulation(grid,[unitDefinition('snail','original',{x:0,y:1}),unitDefinition('snail','copy',{x:4,y:1})],{
    goals:[{id:'main',name:'Main',cell:{x:4,y:1}}], bonus:{kind:'arrival',name:'Rescue',description:'',unitId:'original',cell:{x:3,y:1}},
  });
  s.move('copy',{x:3,y:1}); s.step(2); expect(s.bonusReached).toBe(false);
  s.move('copy',{x:4,y:0}); s.step(3); s.move('original',{x:3,y:1}); s.step(6);
  expect(s.bonusReached).toBe(true);
});
