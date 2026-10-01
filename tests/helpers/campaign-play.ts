import { expect } from 'vitest';
import { load, type Blueprint } from '../../src/core/catalog';
import { neighbors, sameCell, type Cell } from '../../src/core/grid';
import type { Simulation, WorkAction } from '../../src/core/simulation';

export function until(s: Simulation, done: () => boolean, seconds = 90): void {
  for (let i = 0; i < seconds * 30 && !done(); i++) s.step(1 / 30);
  expect(done(), JSON.stringify({ units: s.units.map(u => ({ id: u.id, cell: u.cell, charge: u.battery, pending: u.pending, goal: u.goal })), enemies: s.enemies.map(e => ({ id: e.id, cell: e.cell, health: e.health })) })).toBe(true);
}
export function settled(s: Simulation, id: string): void {
  until(s, () => { const u = s.unit(id); return !u.next && !u.goal && !u.pending; });
}
export function go(s: Simulation, id: string, cell: Cell): void {
  expect(s.move(id, cell), `${id} → ${cell.x},${cell.y}`).toEqual({ ok: true });
  settled(s, id);
  expect(s.unit(id).cell, `${id} must arrive, not stop with an empty battery`).toEqual(cell);
}
export function work(s: Simulation, id: string, action: WorkAction, cell: Cell): void {
  const result = action === 'pickup' || action === 'drop' ? s.orderCargo(id, action, cell)
    : action === 'dig' || action === 'fill' ? s.orderTerrain(id, action, cell) : s.orderObstacle(id, action, cell);
  expect(result.ok, `${id}: ${action} ${cell.x},${cell.y}: ${JSON.stringify(result)}; ${JSON.stringify(s.units.map(u => ({id: u.id, cell: u.cell, battery: u.battery})))}`).toBe(true);
  settled(s, id);
}
export function build(s: Simulation, kind: Blueprint, cell: Cell): string {
  const result = s.build(kind, cell);
  expect(result.ok, `${kind} at ${cell.x},${cell.y}: ${JSON.stringify(result)}`).toBe(true);
  return result.ok ? result.id! : '';
}
export function refuel(s: Simulation, id: string, charge = 100): void { until(s, () => s.unit(id).battery >= charge, 25); }
export function deliver(s: Simulation, id: string, source: Cell, target: Cell): void {
  for (let trips = 0; s.pileAt(source) && load(s.pileAt(source)!.supplies) > 0 && trips < 20; trips++) {
    work(s, id, 'pickup', source); work(s, id, 'drop', target);
  }
  expect(s.pileAt(source)).toBeUndefined();
}
/** Issue ordinary movement commands toward visible enemies; all combat remains automatic. */
export function clearEnemies(s: Simulation, guards: string[], seconds = 120, supports: string[] = [], together = false): void {
  const recovering = new Set<string>();
  for (let t = 0; t < seconds * 10 && s.enemies.length; t++) {
    const survivors = guards.filter(id => s.units.some(u => u.id === id));
    expect(survivors.length, JSON.stringify({t,units:s.units,enemies:s.enemies})).toBeGreaterThan(0);
    const leader = s.unit(survivors[0]);
    const enemies = together ? [...s.enemies].sort((a, b) => Math.abs(a.cell.x - leader.cell.x) + Math.abs(a.cell.y - leader.cell.y)
      - Math.abs(b.cell.x - leader.cell.x) - Math.abs(b.cell.y - leader.cell.y)).slice(0, 1) : s.enemies;
    if (t % 10 === 0) for (const id of survivors) {
      const unit = s.unit(id);
      const helperId = supports.length === guards.length ? supports[guards.indexOf(id)] : supports[0];
      const helper = s.units.find(u => u.id === helperId);
      if (helper && unit.battery < 60) recovering.add(id);
      if (unit.battery >= 90) recovering.delete(id);
      if (helper && (recovering.has(id) || Math.abs(helper.cell.x-unit.cell.x)+Math.abs(helper.cell.y-unit.cell.y) > 1)) {
        s.stop(id); continue;
      }
      // Hold a fighting position so the repair unit can catch up, rather than
      // spending power chasing the other side of an already adjacent enemy.
      if (s.enemies.some(enemy => Math.abs(enemy.cell.x-unit.cell.x)+Math.abs(enemy.cell.y-unit.cell.y) <= 1)) {
        s.stop(id); continue;
      }
      if (unit.next || unit.goal && unit.status !== 'waiting') continue;
      const approaches = enemies.flatMap(enemy => neighbors(enemy.next ?? enemy.cell))
        .map(cell => ({ cell, route: s.preview(id, cell) })).filter(candidate => candidate.route)
        .sort((a, b) => a.route!.length - b.route!.length);
      const best = approaches[0];
      if (best && !sameCell(unit.cell, best.cell)) s.move(id, best.cell);
    }
    if (t % 5 === 0) for (const [index, id] of supports.entries()) {
      const helper = s.units.find(u => u.id === id);
      if (!helper) continue;
      if (helper.next || helper.goal && helper.status !== 'waiting') continue;
      const assigned = guards.length === supports.length ? s.units.find(u => u.id === guards[index]) : undefined;
      const leader = assigned ?? survivors.map(id => s.unit(id)).sort((a,b)=>a.battery-b.battery)[0];
      const positions = neighbors(leader.cell).filter(cell => !leader.route.some(point => sameCell(point, cell)))
        .map(cell => ({ cell, route: s.preview(id, cell) }))
        .filter(candidate => candidate.route).sort((a, b) => a.route!.length - b.route!.length);
      if (positions[0] && !sameCell(helper.cell, positions[0].cell)) s.move(id, positions[0].cell);
    }
    s.step(.1);
  }
  expect(s.enemies.map(enemy => ({id: enemy.id, cell: enemy.cell, target: enemy.target, health: enemy.health}))).toEqual([]);
  for (const id of guards) if (s.units.some(u=>u.id===id)) { s.stop(id); settled(s, id); }
}

/** Focus movement on one visible threat while the rest of the world keeps running. */
export function defeat(s: Simulation, id: string, target: string, seconds = 90): void {
  for (let t = 0; t < seconds * 10 && s.enemies.some(e => e.id === target); t++) {
    const unit = s.unit(id), enemy = s.enemies.find(e => e.id === target)!;
    if (t % 10 === 0 && !unit.next && (!unit.goal || unit.status === 'waiting')) {
      const candidates = neighbors(enemy.next ?? enemy.cell).map(cell => ({ cell, route: s.preview(id, cell) }))
        .filter(candidate => candidate.route).sort((a, b) => a.route!.length - b.route!.length);
      if (candidates[0] && !sameCell(unit.cell, candidates[0].cell)) s.move(id, candidates[0].cell);
    }
    s.step(.1);
  }
  expect(s.enemies.some(e => e.id === target), `Defeat ${target}`).toBe(false); s.stop(id); settled(s, id);
}
