import type { Grid, Terrain } from '../core/grid';
import { unitDefinition, recipeSupplies, partCounts } from '../core/catalog';
import type { Pile } from '../core/simulation';

// A two-cell river with no existing crossing. Borrow land from the broad west
// bank, then extend a causeway one cell at a time from its walkable edge.
const rows = [
  '~~~~~~~~~~~~~~~~',
  '~.......~~.....~',
  '~.TT....~~.....~',
  '~.TT....~~..#..~',
  '~.......~~..#..~',
  '~.....::~~.....~',
  '~.......~~.....~',
  '~.....::~~.....~',
  '~.......~~.....~',
  '~.......~~.....~',
  '~.......~~.....~',
  '~~~~~~~~~~~~~~~~',
];
const legend: Record<string, Terrain> = { '.': 'grass', '~': 'water', ':': 'sand', T: 'tree', '#': 'rock' };
if (rows.some(row => row.length !== 16)) throw new Error('Siltwater Reach must be rectangular.');
export const siltwaterReach: Grid = { width: 16, height: rows.length, tiles: rows.map(row => [...row].map(tile => legend[tile])) };
export const siltwaterRovers = [unitDefinition('scoop', 'scoop', { x: 4, y: 6 }), unitDefinition('scout', 'scout', { x: 3, y: 6 })];
export const siltwaterPiles: Pile[] = [
  { cell: { x: 5, y: 8 }, supplies: recipeSupplies('scoop', 100) },
  { cell: { x: 4, y: 9 }, supplies: { ...partCounts(4, 2), batteries: [] } },
];
export const siltwaterGoals = [{ id: 'far-bank', name: 'Far bank', cell: { x: 13, y: 6 } }];
