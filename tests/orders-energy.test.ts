import { describe, expect, it } from 'vitest';
import { adjacent, constructionArea, key, type Cell, type Grid } from '../src/core/grid';
import { BATTERY_CAPACITY, MOVE_ENERGY, TRANSFER_ENERGY, emptySupplies, recipeSupplies, unitDefinition, type Supplies } from '../src/core/catalog';
import { Simulation } from '../src/core/simulation';
import { createHollowReach, hollowGoals } from '../src/levels/hollow-reach';

const grid: Grid = { width: 10, height: 5, tiles: Array.from({length:5}, () => Array(10).fill('grass')) };
const stock = (red = 0, blue = 0, batteries: number[] = []): Supplies => ({ red, blue, batteries , yellow: 0, green: 0});
const run = (s: Simulation, seconds = 15) => { for (let i = 0; i < seconds * 60; i++) s.step(1/60); };
const state = (s: Simulation) => JSON.stringify({ units: s.units, piles: s.piles, relays: s.relays });
const charged = () => new Simulation(grid, [unitDefinition('hauler','h',{x:0,y:2})]);
const chargeTotal = (s: Simulation) => s.units.reduce((n,u) => n + u.battery + u.cargo.batteries.reduce((a,b)=>a+b,0),0)
  + s.piles.reduce((n,p)=>n+p.supplies.batteries.reduce((a,b)=>a+b,0),0);

describe('travel then transfer orders', () => {
  it('drives beside a distant drop target, unloads there, and leaves other orders running', () => {
    const s = new Simulation(grid, [unitDefinition('hauler','h',{x:0,y:2}), unitDefinition('scout','s',{x:0,y:0})]);
    s.unit('h').cargo = stock(3,1);
    expect(s.orderCargo('h','drop',{x:7,y:2})).toEqual({ok:true,queued:true});
    s.move('s',{x:9,y:0});
    expect(s.piles).toHaveLength(0); run(s);
    expect(adjacent(s.unit('h').cell,{x:7,y:2})).toBe(true);
    expect(s.pileAt({x:7,y:2})?.supplies).toEqual(stock(3,1));
    expect(s.unit('h').cargo).toEqual(emptySupplies());
    expect(s.unit('h').pending).toBeNull();
    expect(s.unit('h').battery).toBe(BATTERY_CAPACITY - 6*MOVE_ENERGY - TRANSFER_ENERGY);
    expect(s.unit('s').cell).toEqual({x:9,y:0});
    expect(s.drainEvents()).toEqual([expect.objectContaining({ kind:'cargo', action:'drop', unitId:'h', error:false })]);
    expect(s.drainEvents()).toEqual([]);
  });
  it('travels to a pickup and preserves the exact charge of a battery carried as cargo', () => {
    const s = new Simulation(grid, [unitDefinition('hauler','h',{x:0,y:2})], {piles:[{cell:{x:7,y:2},supplies:stock(1,0,[37])}]});
    expect(s.orderCargo('h','pickup',{x:7,y:2}).ok).toBe(true); run(s);
    expect(s.drainEvents()).toEqual([expect.objectContaining({ kind:'cargo', action:'pickup', error:false })]);
    expect(s.unit('h').cargo).toEqual(stock(1,0,[37]));
    expect(s.piles).toHaveLength(0);
    expect(s.orderCargo('h','drop',{x:2,y:4}).ok).toBe(true); run(s);
    expect(s.pileAt({x:2,y:4})?.supplies).toEqual(stock(1,0,[37]));
  });
  it('preserves a valid order after an invalid target, and cancels it on Stop or a new move', () => {
    for (const cancel of ['stop','move'] as const) {
      const s = charged(); s.unit('h').cargo = stock(1);
      s.orderCargo('h','drop',{x:7,y:2}); s.step(.1);
      const before = state(s), position = s.position(s.unit('h'));
      expect(s.orderCargo('h','drop',{x:-1,y:2}).ok).toBe(false);
      expect(state(s)).toBe(before);
      if (cancel === 'stop') s.stop('h'); else s.move('h',{x:0,y:0});
      expect(s.position(s.unit('h'))).toEqual(position); run(s);
      expect(s.unit('h').pending).toBeNull(); expect(s.unit('h').cargo.red).toBe(1);
      expect(s.piles).toHaveLength(0);
    }
  });
  it('rechecks the target on arrival and keeps cargo if another rover occupied it', () => {
    const s = new Simulation(grid,[unitDefinition('hauler','h',{x:0,y:2}),unitDefinition('scout','s',{x:7,y:1})]);
    s.unit('h').cargo = stock(2); s.orderCargo('h','drop',{x:7,y:2});
    s.move('s',{x:7,y:2}); run(s);
    expect(s.unit('h').cargo.red).toBe(2); expect(s.piles).toHaveLength(0);
    expect(s.unit('h').pending).toBeNull(); expect(s.drainEvents().some(e => e.error)).toBe(true);
    expect(s.unit('h').battery).toBe(BATTERY_CAPACITY - 6*MOVE_ENERGY);
  });
  it('chooses another approach if its first stopping tile becomes occupied', () => {
    const s = new Simulation(grid,[unitDefinition('hauler','h',{x:0,y:2}),unitDefinition('scout','s',{x:6,y:1})]);
    s.unit('h').cargo = stock(2); s.orderCargo('h','drop',{x:7,y:2});
    s.move('s',{x:6,y:2}); run(s);
    expect(adjacent(s.unit('h').cell,{x:7,y:2})).toBe(true);
    expect(key(s.unit('h').cell)).not.toBe(key(s.unit('s').cell));
    expect(s.pileAt({x:7,y:2})?.supplies.red).toBe(2);
  });
});

describe('3×3 construction and batteries', () => {
  it('accepts every tile in the full 3×3 footprint, including all four diagonals', () => {
    const center = {x:4,y:2};
    expect(constructionArea(center)).toHaveLength(9);
    for (const cell of constructionArea(center)) {
      const s = new Simulation(grid,[],{piles:[{cell,supplies:recipeSupplies('relay')}]});
      expect(s.buildPreview('relay',center).ok, key(cell)).toBe(true);
      expect(s.build('relay',center).ok, key(cell)).toBe(true);
      expect(s.piles).toHaveLength(0);
    }
    const distant = new Simulation(grid,[],{piles:[{cell:{x:6,y:2},supplies:recipeSupplies('relay')}]});
    const before = state(distant);
    expect(distant.build('relay',center).ok).toBe(false); expect(state(distant)).toBe(before);
  });
  it('requires a physical battery, accepts an empty one, and never grants it free charge', () => {
    const s = new Simulation(grid,[],{blueprints:{hauler:2},piles:[{cell:{x:1,y:1},supplies:stock(2,1)}]});
    const before = state(s);
    expect(s.build('hauler',{x:2,y:2}).ok).toBe(false); expect(state(s)).toBe(before);
    s.piles[0].supplies.batteries.push(0);
    expect(s.buildPreview('hauler',{x:2,y:2}).batteryCharge).toBe(0);
    const result = s.build('hauler',{x:2,y:2}); expect(result.ok).toBe(true); if (!result.ok) return;
    const id = result.id!;
    expect(s.unit(id).status).toBe('depleted');
    expect(s.move(id,{x:4,y:2})).toEqual({ok:false,reason:'energy'});
    s.unit(id).cargo = stock(1);
    expect(s.orderCargo(id,'drop',{x:3,y:2}).ok).toBe(false);
    expect(s.dismantle(id).ok).toBe(true);
    expect(s.pileAt({x:2,y:2})?.supplies.batteries).toEqual([0]);
    const rebuilt = s.build('hauler',{x:2,y:2}); if (!rebuilt.ok) throw Error(rebuilt.reason);
    expect(s.unit(rebuilt.id!).battery).toBe(0);
  });
  it('preserves remaining charge through repeated dismantle/build cycles', () => {
    const s = new Simulation(grid,[unitDefinition('hauler','h',{x:2,y:2},17)],{blueprints:{hauler:5}});
    let id='h';
    for(let i=0;i<5;i++) {
      expect(s.dismantle(id).ok).toBe(true);
      const result=s.build('hauler',{x:2,y:2}); if(!result.ok) throw Error(result.reason);
      id=result.id!; expect(s.unit(id).battery).toBe(17); expect(chargeTotal(s)).toBe(17);
    }
  });
  it('uses the best available battery and returns the old one when replacing it', () => {
    const s = new Simulation(grid,[],{piles:[
      {cell:{x:1,y:1},supplies:stock(2,1,[0])}, {cell:{x:3,y:3},supplies:stock(0,0,[45,90])},
    ]});
    const total = chargeTotal(s), result = s.build('hauler',{x:2,y:2}); if(!result.ok) throw Error(result.reason);
    expect(s.unit(result.id!).battery).toBe(90); expect(chargeTotal(s)).toBe(total);
    s.unit(result.id!).battery = 0;
    const afterDrain=chargeTotal(s);
    expect(s.replaceBattery(result.id!).ok).toBe(true);
    expect(s.unit(result.id!).battery).toBe(45);
    expect(s.pileAt({x:2,y:2})?.supplies.batteries).toEqual([0]);
    expect(chargeTotal(s)).toBe(afterDrain);
  });
  it('uses the last charge to finish an edge, then stops with its cargo intact', () => {
    const s = new Simulation(grid,[unitDefinition('hauler','h',{x:0,y:2},3)]);
    s.unit('h').cargo = stock(1); s.orderCargo('h','drop',{x:9,y:2}); run(s);
    const u=s.unit('h');
    expect(u.battery).toBe(0); expect(u.status).toBe('depleted'); expect(u.next).toBeNull();
    expect(u.cell).toEqual({x:3,y:2}); expect(u.pending).toBeNull(); expect(u.cargo.red).toBe(1);
    expect(s.piles).toHaveLength(0); expect(s.drainEvents().some(e=>e.error)).toBe(true);
  });
  it('does not spend energy while idle or while an order waits for a route', () => {
    const s = charged(); run(s); expect(s.unit('h').battery).toBe(BATTERY_CAPACITY);
    s.orderCargo('h','pickup',{x:1,y:2}); // no pile: rejected, still no drain
    run(s); expect(s.unit('h').battery).toBe(BATTERY_CAPACITY);
    const corridor: Grid = {width:5,height:2,tiles:[Array(5).fill('grass'),['rock','rock','grass','rock','rock']]};
    const waiting = new Simulation(corridor,[unitDefinition('hauler','h',{x:0,y:0}),unitDefinition('scout','s',{x:2,y:1})]);
    waiting.move('h',{x:4,y:0}); waiting.move('s',{x:2,y:0}); run(waiting,3);
    expect(waiting.unit('h').status).toBe('waiting');
    const charge = waiting.unit('h').battery; run(waiting,10);
    expect(waiting.unit('h').battery).toBe(charge);
  });
});

it('allows travelling cargo orders and optional relay salvage without replacing arrival goals', () => {
  const s = createHollowReach();
  s.orderCargo('hauler','pickup',{x:3,y:8}); s.orderCargo('hauler','pickup',{x:4,y:9});
  for(const pad of hollowGoals) {
    expect(s.orderCargo('hauler','drop',pad.cell).ok).toBe(true); run(s,30);
    expect(s.pileAt(pad.cell)?.supplies).toEqual(recipeSupplies('relay'));
    const reached = [...s.reached];
    const built=s.build('relay',pad.cell); if(!built.ok) throw Error(built.reason);
    expect([...s.reached]).toEqual(reached);
    s.dismantle(built.id!);
    expect(s.orderCargo('hauler','pickup',pad.cell).ok).toBe(true); run(s,1);
    expect(s.move('hauler',pad.cell).ok).toBe(true); run(s,1);
    expect(s.reached.has(pad.id)).toBe(true);
  }
  expect(s.reached.size).toBe(1); expect(s.unit('hauler').battery).toBeGreaterThan(0);
});
