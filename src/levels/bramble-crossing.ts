import type { Grid, Terrain } from '../core/grid';
import { unitDefinition, partCounts, recipeSupplies } from '../core/catalog';
import { Simulation, type EnemyDefinition, type Pile } from '../core/simulation';

// A safe western camp, two lanes through the narrows, and a guarded eastern shore.
const rows = [
  '~~~~~~~~~~~~~~~~~~~~',
  '~~~......~~~....~~~~',
  '~~.TT....~~~.....~~~',
  '~..TT....~~~.......~',
  '~..::....~~~..##...~',
  '~........~~~..##...~',
  '~........===.......~',
  '~........===...T...~',
  '~....#...~~~...T...~',
  '~....#...~~~.......~',
  '~........~~~..::...~',
  '~..TT....~~~..::...~',
  '~~.......~~~......~~',
  '~~~......~~~.....~~~',
  '~~~~.....~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~',
];
const legend: Record<string, Terrain> = { '.': 'grass', '~': 'water', ':': 'sand', '=': 'bridge', T: 'tree', '#': 'rock' };
if (rows.some(row => row.length !== 20)) throw new Error('Bramble Crossing must be a rectangular map.');
export const brambleCrossing: Grid = { width: 20, height: rows.length, tiles: rows.map(row => [...row].map(character => legend[character])) };
export const crossingRovers = [unitDefinition('scout', 'scout', { x: 2, y: 7 }), unitDefinition('hauler', 'hauler', { x: 3, y: 9 })];
export const crossingPiles: Pile[] = [
  { cell: { x: 3, y: 8 }, supplies: { ...partCounts(1, 1), batteries: [] } },
  { cell: { x: 4, y: 9 }, supplies: { ...partCounts(0, 0, 0, 2), batteries: [] } },
  { cell: { x: 4, y: 5 }, supplies: recipeSupplies('warden', 100) },
];
export const crossingGoals = [{ id: 'east', name: 'East', clearEnemies: true, cell: { x: 17, y: 8 } }];
export const crossingEnemies: EnemyDefinition[] = [{
  id: 'bristleback', kind: 'bristleback', name: 'Bristleback', start: { x: 13, y: 6 }, speed: 1.75,
  maxHealth: 20, damage: 4, attackInterval: .9, detectionRange: 4, loseRange: 6, patrolRadius: 2,
}];
export const createBrambleCrossing = () => new Simulation(brambleCrossing, crossingRovers, { piles: crossingPiles, goals: crossingGoals, enemies: crossingEnemies, seed: 20260929 });
