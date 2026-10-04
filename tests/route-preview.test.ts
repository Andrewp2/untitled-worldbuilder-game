import { describe, expect, it } from 'vitest';
import { emptySupplies, unitDefinition } from '../src/core/catalog';
import { adjacent } from '../src/core/grid';
import { Simulation } from '../src/core/simulation';
import { board, pile } from '../src/levels/authored';
import { createMission, missions } from '../src/levels/missions';
import { previewOrder, routeSegments } from '../src/view/route-preview';

describe('route previews and current charge', () => {
  it.each([0, 1, 3, 4, 6, 12])('predicts the actual stopping tile across swamp with %i charge', charge => {
    const s = new Simulation(board(['.s...']), [unitDefinition('hauler', 'h', { x: 0, y: 0 }, charge)]);
    const goal = { x: 4, y: 0 }, before = structuredClone(s.units);
    const plan = previewOrder(s, 'h', 'move', goal)!;
    expect(plan.power.required).toBe(6);
    expect(s.units).toEqual(before); expect(s.drainEvents()).toEqual([]);
    s.move('h', goal); s.step(10);
    expect(s.unit('h').cell).toEqual(plan.power.lastReachable);
    expect(s.unit('h').cell.x === goal.x).toBe(plan.power.canFinish);
    if (plan.power.canFinish) expect(s.unit('h').battery).toBe(charge - plan.power.required);
  });

  it('exposes Mudline’s expensive direct route and permits a dry waypoint without choosing it for the player', () => {
    const s = createMission(missions.find(m => m.id === 'mudline')!);
    const direct = previewOrder(s, 'driver', 'move', s.setup.goals![0].cell)!;
    const dry = previewOrder(s, 'driver', 'move', { x: 3, y: 3 })!;
    expect(direct.route.some(cell => s.grid.tiles[cell.y][cell.x] === 'swamp')).toBe(true);
    expect(direct.power.canFinish).toBe(false);
    expect(dry.power.canFinish).toBe(true);
    expect(s.move('driver', s.setup.goals![0].cell).ok).toBe(true);
    expect(s.unit('driver').route).toEqual(direct.route);
  });

  it('does not charge again for an in-flight step when redirecting, including the last charge', () => {
    const s = new Simulation(board(['.....']), [unitDefinition('scout', 's', { x: 0, y: 0 }, 3)]);
    s.move('s', { x: 4, y: 0 }); s.step(.1);
    const plan = previewOrder(s, 's', 'move', { x: 3, y: 0 })!;
    expect(s.unit('s').next).not.toBeNull(); expect(s.unit('s').battery).toBe(2);
    expect(plan.power).toMatchObject({ required: 2, canFinish: true });
    s.move('s', plan.goal); s.step(.8);
    expect(s.unit('s').battery).toBe(0); expect(s.unit('s').next).toEqual(plan.goal);
    const last = previewOrder(s, 's', 'move', plan.goal)!;
    s.move('s', last.goal); s.step(10);
    expect(s.unit('s').cell).toEqual({ x: 3, y: 0 }); expect(s.unit('s').battery).toBe(0);
    expect(last.power.canFinish).toBe(true);
  });

  it('includes transfer energy even when the carrier can reach its working position', () => {
    const s = new Simulation(board(['.....']), [unitDefinition('hauler', 'h', { x: 0, y: 0 }, 4)], {
      piles: [pile(4, 0, { ...emptySupplies(), red: 1 })],
    });
    const plan = previewOrder(s, 'h', 'pickup', { x: 4, y: 0 })!;
    expect(plan.power).toMatchObject({ required: 5, affordableSteps: 3, canFinish: false });
    expect(plan.goal).toEqual({ x: 3, y: 0 });
    expect(s.orderCargo('h', 'pickup', { x: 4, y: 0 }).ok).toBe(true); s.step(10);
    expect(s.unit('h').cell).toEqual(plan.power.lastReachable);
    expect(s.unit('h').cargo.red).toBe(0); expect(s.piles[0].supplies.red).toBe(1);
  });

  it('predicts a distant drop without removing carried parts or replacing a live order', () => {
    const s = new Simulation(board(['.......']), [unitDefinition('hauler', 'h', { x: 0, y: 0 }, 12)], {
      piles: [pile(1, 0, { ...emptySupplies(), blue: 1 })],
    });
    s.transfer('h', 'pickup', { x: 1, y: 0 }); s.move('h', { x: 2, y: 0 });
    const before = structuredClone(s.units), target = { x: 6, y: 0 };
    const plan = previewOrder(s, 'h', 'drop', target)!;
    expect(s.units).toEqual(before); expect(plan.power.canFinish).toBe(true);
    s.orderCargo('h', 'drop', target); s.step(10);
    expect(s.pileAt(target)?.supplies.blue).toBe(1);
    expect(s.unit('h').battery).toBe(before[0].battery - plan.power.required);
  });

  it.each([
    ['dozer', 'push', '....#'], ['scoop', 'dig', '.....'], ['arborbot', 'uproot', '....T'],
  ] as const)('includes the final %s work cost', (kind, action, terrain) => {
    const s = new Simulation(board([terrain + '.']), [unitDefinition(kind, 'u', { x: 0, y: 0 }, 5)]);
    const plan = previewOrder(s, 'u', action, { x: 4, y: 0 })!;
    expect(plan.power).toMatchObject({ required: 6, affordableSteps: 3, canFinish: false });
    expect(adjacent(plan.goal, { x: 4, y: 0 })).toBe(true);
  });

  it('returns no route for an incompatible tool, stationary structure, blocked target or disconnected land', () => {
    const s = new Simulation(board(['..~..']), [unitDefinition('scout', 's', { x: 0, y: 0 }), unitDefinition('pump', 'p', { x: 1, y: 0 })]);
    expect(previewOrder(s, 's', 'dig', { x: 4, y: 0 })).toBeNull();
    expect(previewOrder(s, 'p', 'move', { x: 0, y: 0 })).toBeNull();
    expect(previewOrder(s, 's', 'move', { x: 1, y: 0 })).toBeNull();
    expect(previewOrder(s, 's', 'move', { x: 4, y: 0 })).toBeNull();
  });

  it('includes fill and plant costs after collecting the required dirt or tree', () => {
    for (const [kind, collect, action, tiles] of [
      ['scoop', 'dig', 'fill', '.....~'], ['arborbot', 'uproot', 'plant', '.T....'],
    ] as const) {
      const s = new Simulation(board([tiles]), [unitDefinition(kind, 'u', { x: 2, y: 0 }, 7)]);
      const result = collect === 'dig' ? s.shapeTerrain('u', collect, { x: 1, y: 0 }) : s.moveObstacle('u', collect, { x: 1, y: 0 });
      expect(result.ok).toBe(true);
      const plan = previewOrder(s, 'u', action, { x: 5, y: 0 })!;
      expect(plan.power).toMatchObject({ required: 5, affordableSteps: 2, canFinish: false });
    }
  });

  it('charges for physical steps across a whirlpool and leaves a gap in the pictured trail', () => {
    const grid = board(['~@..@~'], 'grass', { '1,0': { x: 4, y: 0 }, '4,0': { x: 1, y: 0 } });
    const s = new Simulation(grid, [unitDefinition('tug', 't', { x: 0, y: 0 }, 2)]);
    const plan = previewOrder(s, 't', 'move', { x: 5, y: 0 })!;
    expect(plan.power).toMatchObject({ required: 2, canFinish: true });
    const segments = routeSegments(grid, s.unit('t').cell, null, plan.route);
    expect(segments.every(segment => adjacent(segment.from, segment.to))).toBe(true);
    expect(segments[1].from).toEqual({ x: 4, y: 0 });
    s.move('t', plan.goal); s.step(.1);
    const moving = previewOrder(s, 't', 'move', plan.goal)!;
    expect(moving.power.required).toBe(1);
    const movingSegments = routeSegments(grid, s.position(s.unit('t')), s.unit('t').next, moving.route);
    expect(movingSegments[0].step).toBe(-1); expect(movingSegments[1].from).toEqual({ x: 4, y: 0 });
    s.step(10); expect(s.unit('t').cell).toEqual(plan.goal); expect(s.unit('t').battery).toBe(0);
  });
});
