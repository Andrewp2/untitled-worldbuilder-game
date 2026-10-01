import { describe, expect, it } from 'vitest';
import { emptyCost, emptySupplies, load, materials, recipes, unitDefinition, partCounts, recipeSupplies, type Cost } from '../src/core/catalog';
import { key, type Cell, type Grid } from '../src/core/grid';
import { Simulation } from '../src/core/simulation';
import { hollowGoals, createHollowReach, startingPiles } from '../src/levels/hollow-reach';

const grid: Grid = { width: 7, height: 5, tiles: Array.from({ length: 5 }, () => Array(7).fill('grass')) };
const run = (s: Simulation, seconds = 20) => { for (let i = 0; i < seconds * 60; i++) s.step(1 / 60); };
const totals = (s: Simulation): Cost => {
  const result = emptyCost();
  const inventories = [...s.piles.map(p => p.supplies), ...s.units.map(u => u.cargo)];
  for (const supplies of inventories) {
    for (const m of materials) result[m] += supplies[m];
    result.battery += supplies.batteries.length;
  }
  for (const cost of [...s.units.map(u => recipes[u.kind]), ...s.relays.map(() => recipes.relay)]) {
    for (const m of materials) result[m] += cost[m];
    result.battery += cost.battery;
  }
  return result;
};
const snapshot = (s: Simulation) => JSON.stringify({ units: s.units, piles: s.piles, relays: s.relays });
const fixture = () => new Simulation(grid, [unitDefinition('hauler', 'h', { x: 1, y: 1 })], { piles: [
  { cell: { x: 2, y: 1 }, supplies: { red: 5, blue: 1, batteries: [] , yellow: 0, green: 0} },
] });

describe('local cargo actions', () => {
  it('limits pickup to capacity, preserves excess, and merges a complete drop', () => {
    const s = fixture(), before = totals(s);
    expect(s.transfer('h', 'pickup', { x: 2, y: 1 }).ok).toBe(true);
    expect(s.unit('h').cargo).toEqual({ red: 4, blue: 0, batteries: [] , yellow: 0, green: 0});
    expect(s.pileAt({ x: 2, y: 1 })?.supplies).toEqual({ red: 1, blue: 1, batteries: [] , yellow: 0, green: 0});
    expect(s.transfer('h', 'drop', { x: 2, y: 1 }).ok).toBe(true);
    expect(load(s.unit('h').cargo)).toBe(0);
    expect(s.pileAt({ x: 2, y: 1 })?.supplies).toEqual({ red: 5, blue: 1, batteries: [] , yellow: 0, green: 0});
    expect(totals(s)).toEqual(before);
  });
  it('rejects distant, diagonal, moving, full, empty, and obstructed actions without mutations', () => {
    const s = fixture();
    for (const target of [{ x: 3, y: 1 }, { x: 2, y: 2 }, { x: -1, y: 1 }]) {
      const before = snapshot(s);
      expect(s.transfer('h', 'pickup', target).ok).toBe(false); expect(snapshot(s)).toBe(before);
    }
    expect(s.transfer('h', 'drop', { x: 2, y: 1 }).ok).toBe(false);
    s.move('h', { x: 1, y: 3 }); s.step(.1);
    const moving = snapshot(s);
    expect(s.transfer('h', 'pickup', { x: 2, y: 1 }).ok).toBe(false); expect(snapshot(s)).toBe(moving);
    s.stop('h'); run(s); s.move('h', { x: 1, y: 1 }); run(s);
    s.transfer('h', 'pickup', { x: 2, y: 1 });
    const full = snapshot(s);
    expect(s.transfer('h', 'pickup', { x: 2, y: 1 }).ok).toBe(false); expect(snapshot(s)).toBe(full);
    s.units.push({ ...s.unit('h'), id: 'blocker', cell: { x: 2, y: 1 }, cargo: emptySupplies() });
    expect(s.transfer('h', 'drop', { x: 2, y: 1 }).ok).toBe(false);
  });
});

describe('spatial construction and recovery', () => {
  it('uses only ground materials within the site’s 3×3 area, with no builder requirement', () => {
    const s = new Simulation(grid, [], { piles: [
      { cell: { x: 4, y: 2 }, supplies: { ...partCounts(1), batteries: [] } },
      { cell: { x: 5, y: 2 }, supplies: { ...partCounts(0, 0, 0, 2), batteries: [] } },
      { cell: { x: 4, y: 3 }, supplies: { red: 0, blue: 1, batteries: [] , yellow: 0, green: 0} },
      { cell: { x: 5, y: 3 }, supplies: { red: 20, blue: 10, batteries: [] , yellow: 0, green: 0} },
    ] });
    const before = totals(s);
    expect(s.build('relay', { x: 4, y: 2 }).ok).toBe(true);
    expect(s.piles).toHaveLength(1);
    expect(s.piles[0].supplies).toEqual({ red: 20, blue: 10, batteries: [] , yellow: 0, green: 0});
    expect(totals(s)).toEqual(before);
    s.dismantle(s.relays[0].id);
    expect(s.pileAt({ x: 4, y: 2 })?.supplies).toEqual(recipeSupplies('relay'));
    expect(totals(s)).toEqual(before);
  });
  it('does not count distant or carried materials; failed builds consume nothing', () => {
    const s = fixture();
    s.transfer('h', 'pickup', { x: 2, y: 1 });
    const before = snapshot(s);
    expect(s.buildPreview('relay', { x: 3, y: 1 }).missing).toEqual({ ...partCounts(0, 0, 0, 2), battery: 0 });
    expect(s.build('relay', { x: 3, y: 1 }).ok).toBe(false);
    expect(s.build('relay', { x: 3, y: 2 }).ok).toBe(false);
    expect(s.build('relay', { x: 6, y: 4 }).ok).toBe(false);
    expect(snapshot(s)).toBe(before);
  });
  it('protects occupied/reserved sites, reroutes around new relays, and reopens dismantled sites', () => {
    const s = new Simulation(grid, [unitDefinition('scout', 's', { x: 0, y: 2 })], { piles: [
      { cell: { x: 2, y: 2 }, supplies: { ...partCounts(2, 2, 0, 4), batteries: [] } },
    ] });
    s.move('s', { x: 5, y: 2 }); s.step(.1);
    const before = snapshot(s);
    expect(s.build('relay', { x: 1, y: 2 }).ok).toBe(false); expect(snapshot(s)).toBe(before);
    expect(s.build('relay', { x: 2, y: 2 }).ok).toBe(true);
    const relay = s.relays[0];
    for (let i = 0; i < 500; i++) {
      s.step(1 / 60);
      expect(key(s.unit('s').cell)).not.toBe(key(relay.cell));
      if (s.unit('s').next) expect(key(s.unit('s').next!)).not.toBe(key(relay.cell));
    }
    expect(s.unit('s').cell).toEqual({ x: 5, y: 2 });
    s.dismantle(relay.id);
    expect(s.move('s', { x: 2, y: 2 }).ok).toBe(true);
  });
  it('recovers cargo and the full recipe from a rover, then creates a working replacement', () => {
    const s = fixture(), before = totals(s);
    s.transfer('h', 'pickup', { x: 2, y: 1 });
    expect(s.dismantle('h').ok).toBe(true);
    expect(s.units).toHaveLength(0);
    expect(s.pileAt({ x: 1, y: 1 })?.supplies.red).toBe(6);
    const result = s.build('hauler', { x: 1, y: 1 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(s.unit(result.id!).capacity).toBe(4);
    expect(s.move(result.id!, { x: 6, y: 4 }).ok).toBe(true); run(s);
    expect(s.unit(result.id!).cell).toEqual({ x: 6, y: 4 });
    expect(totals(s)).toEqual(before);
  });
  it('never dismantles a rover in motion', () => {
    const s = fixture(); s.move('h', { x: 4, y: 1 }); s.step(.2);
    const before = snapshot(s);
    expect(s.dismantle('h').ok).toBe(false); expect(snapshot(s)).toBe(before);
  });
});

it('preserves materials through hauling and relay salvage, with goals completed by rover arrival', () => {
  const s = createHollowReach(), before = totals(s);
  expect(s.transfer('hauler', 'pickup', startingPiles[0].cell).ok).toBe(true);
  expect(s.transfer('hauler', 'pickup', startingPiles[1].cell).ok).toBe(true);
  expect(s.unit('hauler').cargo).toEqual(recipeSupplies('relay'));
  for (const pad of hollowGoals) {
    const beside: Cell = { x: pad.cell.x - 1, y: pad.cell.y };
    expect(s.move('hauler', beside).ok).toBe(true); run(s, 35);
    expect(s.unit('hauler').cell).toEqual(beside);
    expect(s.transfer('hauler', 'drop', pad.cell).ok).toBe(true);
    const reached = [...s.reached];
    expect(s.build('relay', pad.cell).ok).toBe(true);
    expect([...s.reached]).toEqual(reached);
    expect(totals(s)).toEqual(before);
    expect(s.dismantle(s.relays[0].id).ok).toBe(true);
    expect(s.transfer('hauler', 'pickup', pad.cell).ok).toBe(true);
    expect(totals(s)).toEqual(before);
    expect(s.move('hauler', pad.cell).ok).toBe(true); run(s, 1);
    expect(s.reached.has(pad.id)).toBe(true);
  }
  expect(s.reached.size).toBe(1);
  const fresh = createHollowReach();
  expect(fresh.reached.size).toBe(0); expect(fresh.relays).toHaveLength(0);
  expect(fresh.piles).toEqual(startingPiles); expect(fresh.units.every(u => !load(u.cargo))).toBe(true);
});


it('requires the specified part colors rather than an equal total of other colors', () => {
  const s = new Simulation(grid, [], { piles: [{ cell: { x: 3, y: 2 }, supplies: { ...partCounts(0, 0, 1, 0), batteries: [64] } }] });
  s.piles[0].supplies.red = 1; // Same total as a Scout recipe, but red cannot substitute for green.
  const before = snapshot(s);
  expect(s.buildPreview('scout', { x: 3, y: 2 }).missing.green).toBe(1);
  expect(s.build('scout', { x: 3, y: 2 }).ok).toBe(false); expect(snapshot(s)).toBe(before);
  s.piles[0].supplies.green = 1;
  const built = s.build('scout', { x: 3, y: 2 }); if (!built.ok) throw Error(built.reason);
  expect(s.unit(built.id!).battery).toBe(64);
  expect(s.piles[0].supplies.red).toBe(1);
  s.dismantle(built.id!);
  expect(s.pileAt({ x: 3, y: 2 })?.supplies).toEqual({ ...partCounts(1, 0, 1, 1), batteries: [64] });
});


it('spends blueprints only on success, never refunds salvage, and leaves failed rebuild supplies intact', () => {
  const s=new Simulation(grid,[],{blueprints:{hauler:2},piles:[{cell:{x:1,y:1},supplies:recipeSupplies('hauler',77)}]});
  expect(s.build('hauler',{x:4,y:2}).ok).toBe(false); expect(s.blueprints.hauler).toBe(2);
  const first=s.build('hauler',{x:1,y:1}); if(!first.ok) throw new Error(first.reason);
  expect(s.blueprints.hauler).toBe(1); s.dismantle(first.id!); expect(s.blueprints.hauler).toBe(1);
  const second=s.build('hauler',{x:2,y:1}); if(!second.ok) throw new Error(second.reason);
  expect(s.unit(second.id!).battery).toBe(77); s.dismantle(second.id!);
  const parts=structuredClone(s.piles); expect(s.build('hauler',{x:1,y:1}).ok).toBe(false);
  expect(s.piles).toEqual(parts); expect(s.blueprints.hauler).toBe(0);
  expect(s.build('scout',{x:1,y:1}).ok).toBe(false);
});
