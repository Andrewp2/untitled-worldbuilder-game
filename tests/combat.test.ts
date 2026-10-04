import { describe, expect, it } from 'vitest';
import { attackEnergy, recipeSupplies, unitDefinition } from '../src/core/catalog';
import { key, walkable, type Grid } from '../src/core/grid';
import { Simulation, type EnemyDefinition } from '../src/core/simulation';
import { createBrambleCrossing, crossingGoals } from '../src/levels/bramble-crossing';
import { createMission, missions } from '../src/levels/missions';

const WARDEN_HIT_COST = attackEnergy('warden');
const grid: Grid = { width: 9, height: 9, tiles: Array.from({ length: 9 }, () => Array(9).fill('grass')) };
const creature = (overrides: Partial<EnemyDefinition> = {}): EnemyDefinition => ({
  id: 'enemy', kind: 'bristleback', name: 'Bristleback', start: { x: 4, y: 3 }, speed: 1.5, maxHealth: 20,
  damage: 4, attackInterval: .9, detectionRange: 4, loseRange: 6, patrolRadius: 2, ...overrides,
});
const run = (simulation: Simulation, seconds: number) => {
  for (let frame = 0; frame < seconds * 60; frame++) simulation.step(1 / 60);
};
const arena = (kind: 'warden' | 'hauler' = 'warden', enemy = creature()) => new Simulation(grid,
  [unitDefinition(kind, 'rover', { x: 3, y: 3 })], { enemies: [enemy], seed: 17 });

describe('automatic adjacent combat', () => {
  it('fights without an attack order, observes cooldowns, and spends charge per successful hit', () => {
    const simulation = arena(); simulation.step(.01);
    expect(simulation.unit('rover').goal).toBeNull();
    expect(simulation.unit('rover').battery).toBe(100 - WARDEN_HIT_COST - 4);
    expect(simulation.enemies[0].health).toBe(16);
    simulation.step(.65);
    expect(simulation.enemies[0].health).toBe(16);
    simulation.step(.1);
    expect(simulation.enemies[0].health).toBe(12);
    expect(simulation.unit('rover').battery).toBe(100 - 2 * WARDEN_HIT_COST - 4);
    expect(simulation.drainEvents().filter(event => event.kind === 'hit')).toHaveLength(3);
  });
  it('does not attack diagonally, at range, or with an empty battery', () => {
    const diagonal = new Simulation(grid, [unitDefinition('warden','w',{ x: 3, y: 2 })], { enemies: [creature({ speed: 0 })] });
    diagonal.step(.01);
    expect(diagonal.enemies[0].health).toBe(20); expect(diagonal.unit('w').battery).toBe(100);
    const unpowered = arena('warden', creature({ damage: 0 }));
    unpowered.unit('rover').battery = 0; run(unpowered, 2);
    expect(unpowered.enemies[0].health).toBe(20);
    unpowered.unit('rover').battery = 2 * WARDEN_HIT_COST; run(unpowered, 3);
    expect(unpowered.enemies[0].health).toBe(12); expect(unpowered.unit('rover').battery).toBe(0);
    expect(unpowered.units).toHaveLength(1); expect(unpowered.unit('rover').status).toBe('depleted');
  });
  it('keeps transports unarmed and lets an armored Warden win the introductory encounter', () => {
    const transport = arena('hauler'); run(transport, 1);
    expect(transport.enemies[0].health).toBe(20); expect(transport.unit('rover').battery).toBeLessThan(100);
    const defender = arena(); run(defender, 4);
    expect(defender.enemies).toHaveLength(0);
    expect(defender.unit('rover').battery).toBe(100 - 5 * WARDEN_HIT_COST - 4 * 4);
  });
  it('resolves simultaneous lethal hits for both sides rather than favoring update order', () => {
    const simulation = arena('warden', creature({ maxHealth: 4 })); simulation.unit('rover').battery = WARDEN_HIT_COST + 4;
    simulation.step(.01);
    expect(simulation.units).toHaveLength(0); expect(simulation.enemies).toHaveLength(0);
    expect(simulation.drainEvents().filter(event => event.kind === 'destroyed')).toHaveLength(2);
    expect(simulation.pileAt({ x: 3, y: 3 })?.supplies).toEqual(recipeSupplies('warden', 0));
  });
  it('keeps combat outcomes consistent across different caller frame sizes', () => {
    const fine = arena(), coarse = arena(); run(fine, 2);
    for (let frame = 0; frame < 20; frame++) coarse.step(.1);
    expect(coarse.enemies[0].health).toBe(fine.enemies[0].health);
    expect(coarse.unit('rover').battery).toBe(fine.unit('rover').battery);
  });
});

describe('wandering and pursuit', () => {
  it('wanders reproducibly inside its home area when no rover is in range', () => {
    const make = () => new Simulation(grid, [], { enemies: [creature({ start: { x: 4, y: 4 } })], seed: 17 });
    const a = make(), b = make(), visited = new Set<string>();
    for (let frame = 0; frame < 600; frame++) {
      a.step(1 / 60); b.step(1 / 60);
      const enemy = a.enemies[0]; visited.add(key(enemy.cell));
      expect(enemy.target).toBeNull(); expect(enemy.status).toBe('wandering');
      expect(Math.abs(enemy.cell.x-4)+Math.abs(enemy.cell.y-4)).toBeLessThanOrEqual(2);
      expect(a.position(enemy)).toEqual(b.position(b.enemies[0]));
    }
    expect(visited.size).toBeGreaterThan(1);
  });
  it('detects an approaching rover, chases it, and disengages after it escapes', () => {
    const simulation = new Simulation(grid, [unitDefinition('scout','scout',{ x: 0, y: 6 })], {
      enemies: [creature({ start: { x: 6, y: 3 }, speed: 1, detectionRange: 3, loseRange: 4, patrolRadius: 0 })], seed: 5,
    });
    run(simulation, 1); expect(simulation.enemies[0].target).toBeNull();
    simulation.move('scout',{ x: 3, y: 3 }); run(simulation, 3);
    expect(simulation.enemies[0].target).toBe('scout');
    expect(simulation.enemies[0].status).not.toBe('wandering');
    simulation.move('scout',{ x: 0, y: 8 }); run(simulation, 5);
    expect(simulation.enemies[0].target).toBeNull();
    expect(simulation.enemies[0].status).toBe('wandering');
  });
  it('never overlaps occupied or reserved tiles while pursuing a moving rover', () => {
    const simulation = new Simulation(grid, [unitDefinition('scout','scout',{ x: 1, y: 3 })], {
      enemies: [creature({ start: { x: 5, y: 3 }, damage: 0 })], seed: 7,
    });
    simulation.move('scout',{ x: 7, y: 6 });
    for (let frame = 0; frame < 600; frame++) {
      simulation.step(1 / 60);
      const unit = simulation.unit('scout'), enemy = simulation.enemies[0];
      const unitTiles = [unit.cell, ...(unit.next ? [unit.next] : [])].map(key);
      for (const cell of [enemy.cell, ...(enemy.next ? [enemy.next] : [])]) {
        expect(walkable(grid, cell)).toBe(true); expect(unitTiles).not.toContain(key(cell));
      }
    }
  });
});

describe('wreckage and the second handcrafted mission', () => {
  it('leaves Bristleback bricks and its battery available for a carrier to collect', () => {
    const simulation = arena(); run(simulation, 4);
    const cell = { x: 4, y: 3 };
    expect(simulation.pileAt(cell)?.supplies).toMatchObject({ red: 2, batteries: [100] });
    const recovery = new Simulation(grid, [unitDefinition('hauler', 'h', { x: 3, y: 3 })], { piles: simulation.piles });
    expect(recovery.transfer('h', 'pickup', cell).ok).toBe(true);
    expect(recovery.unit('h').cargo).toMatchObject({ red: 2, batteries: [100] });
    expect(recovery.pileAt(cell)).toBeUndefined();
  });
  it('starts a moving enemy’s breakup at its visible position and leaves salvage at the nearer tile', () => {
    const simulation = arena('warden', creature({ start: { x: 5, y: 3 }, maxHealth: 4, damage: 0, speed: 0 }));
    Object.assign(simulation.enemies[0], { next: { x: 4, y: 3 }, progress: .97 });
    simulation.step(.01);
    const event = simulation.drainEvents().find(event => event.kind === 'destroyed');
    expect(event).toMatchObject({ cell: { x: 4, y: 3 }, position: { x: 4.03, y: 3 } });
    expect(simulation.pileAt({ x: 4, y: 3 })?.supplies.red).toBe(2);
  });
  it('returns a destroyed moving rover’s recipe and cargo once, with an empty installed battery', () => {
    const simulation = arena('hauler', creature({ damage: 100 })), unit = simulation.unit('rover');
    unit.battery = 36; unit.cargo = { red: 2, blue: 1, batteries: [37] , yellow: 0, green: 0, tires: 0};
    expect(simulation.orderCargo(unit.id,'drop',{ x: 7, y: 6 }).ok).toBe(true);
    run(simulation, 1);
    expect(simulation.units).toHaveLength(0);
    expect(simulation.pileAt({ x: 3, y: 3 })?.supplies).toEqual({ red: 4, blue: 2, batteries: [0,37], yellow: 0, green: 0, tires: 4 });
    const event = simulation.drainEvents().find(event => event.kind === 'destroyed');
    expect(event).toMatchObject({ faction: 'friendly', salvage: simulation.pileAt({ x: 3, y: 3 })!.supplies });
    expect(simulation.pileAt({ x: 7, y: 6 })).toBeUndefined();
    run(simulation, 2); expect(simulation.piles).toHaveLength(1);
    const rebuilt = simulation.build('hauler',{ x: 3, y: 3 }); expect(rebuilt.ok).toBe(true);
    if (!rebuilt.ok) return;
    const restored = simulation.unit(rebuilt.id!);
    expect(restored.battery).toBe(37);
    expect(simulation.pileAt({ x: 3, y: 3 })?.supplies.batteries).toEqual([0]);
  });
  it('rebuilds a wreck as powerless and recovers it with a delivered battery', () => {
    const defeated = arena('hauler', creature({ damage: 100 })); defeated.step(.01);
    expect(defeated.units).toHaveLength(0);
    const safe = new Simulation(grid, [unitDefinition('scout','courier',{ x: 3, y: 1 })], { piles: defeated.piles });
    safe.unit('courier').cargo.batteries = [73];
    const rebuilt = safe.build('hauler',{ x: 3, y: 3 }); expect(rebuilt.ok).toBe(true);
    if (!rebuilt.ok) return;
    expect(safe.unit(rebuilt.id!).battery).toBe(0);
    expect(safe.move(rebuilt.id!,{ x: 4, y: 3 })).toEqual({ ok: false, reason: 'energy' });
    run(safe, 2); expect(safe.units).toHaveLength(2);
    expect(safe.transfer('courier','drop',{ x: 3, y: 2 }).ok).toBe(true);
    expect(safe.replaceBattery(rebuilt.id!).ok).toBe(true);
    expect(safe.unit(rebuilt.id!).battery).toBe(73);
    expect(safe.pileAt({ x: 3, y: 3 })?.supplies.batteries).toEqual([0]);
    expect(safe.move(rebuilt.id!,{ x: 4, y: 3 }).ok).toBe(true); run(safe, 1);
    expect(safe.unit(rebuilt.id!).cell).toEqual({ x: 4, y: 3 });
    expect(safe.unit(rebuilt.id!).battery).toBe(72);
  });
  it('destroys an exhausted rover only when an enemy lands a damaging hit', () => {
    const exhausted = arena('hauler', creature({ damage: 0 })); exhausted.unit('rover').battery = 0;
    run(exhausted, 1); expect(exhausted.units).toHaveLength(1);
    exhausted.enemies[0].damage = 1; run(exhausted, 1);
    expect(exhausted.units).toHaveLength(0);
    expect(exhausted.pileAt({ x: 3, y: 3 })?.supplies.batteries).toEqual([0]);
  });
  it('keeps the starting camp safe while the player prepares and gives each mission fresh state', () => {
    const simulation = createBrambleCrossing(); run(simulation, 30);
    expect(simulation.units.every(unit => unit.battery === 100)).toBe(true);
    expect(simulation.enemies[0].target).toBeNull();
    const fresh = createBrambleCrossing(); expect(fresh.reached.size).toBe(0);
    expect(fresh.enemies[0].cell).toEqual({ x: 13, y: 6 });
    expect(createMission(missions[0]).enemies).toHaveLength(0);
    expect(createMission(missions[1]).piles).not.toBe(simulation.piles);
  });
  it('supports building a defender, clearing the crossing, and reaching the East flag', () => {
    const simulation = createBrambleCrossing();
    const built = simulation.build('warden',{ x: 4, y: 4 }); expect(built.ok).toBe(true);
    if (!built.ok) return;
    expect(simulation.move(built.id!,{ x: 10, y: 7 }).ok).toBe(true); run(simulation, 15);
    expect(simulation.enemies).toHaveLength(0);
    expect(simulation.unit(built.id!).battery).toBeGreaterThan(0);
    const goal = crossingGoals[0]; expect(simulation.move(built.id!,goal.cell).ok).toBe(true);
    run(simulation, 10);
    expect(simulation.reached.has(goal.id)).toBe(true);
    expect(simulation.relays).toHaveLength(0);
    expect(simulation.units.every(unit => unit.battery > 0)).toBe(true);
  });
});


it('does not refund a blueprint after a built unit is destroyed, while leaving its empty battery and parts', () => {
  const s=new Simulation(grid,[],{blueprints:{hauler:1},piles:[{cell:{x:3,y:3},supplies:recipeSupplies('hauler',3)}],enemies:[creature({damage:4})]});
  const built=s.build('hauler',{x:3,y:3}); if(!built.ok) throw new Error(built.reason);
  s.step(.01); expect(s.units).toHaveLength(0); expect(s.blueprints.hauler).toBe(0);
  expect(s.pileAt({x:3,y:3})?.supplies).toEqual(recipeSupplies('hauler',0));
  expect(s.build('hauler',{x:3,y:3}).ok).toBe(false);
});
it('requires the guarded main objective to be cleared, including a unit already waiting on its flag', () => {
  const s=new Simulation(grid,[unitDefinition('warden','w',{x:3,y:3})],{goals:[{id:'main',name:'Main',cell:{x:3,y:3},clearEnemies:true}],enemies:[creature()]});
  expect(s.mainComplete).toBe(false); expect(s.bonusUnlocked).toBe(false);
  run(s,4); expect(s.enemies).toHaveLength(0); expect(s.mainComplete).toBe(true);
  expect(s.drainEvents().filter(e=>e.kind==='goal-reached')).toHaveLength(1);
});
