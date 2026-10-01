import type { Grid, Terrain } from '../core/grid';
import { unitDefinition, partCounts } from '../core/catalog';
import { Simulation, type Pile } from '../core/simulation';

// Hand-authored terrain. . grass, ~ water, : sand, = boardwalk, T tree, # rock.
const rows = [
  '~~~~~~~~~~~~~~~~~~~~',
  '~~~~.....~~~....~~~~',
  '~~..TT....~~.....~~~',
  '~...TT....~~..#...~~',
  '~..:......~~..##..~~',
  '~..::.....==......~~',
  '~.........~~..T...~~',
  '~....##...~~..TT..~~',
  '~....##...~~......~~',
  '~.........~~...:..~~',
  '~..T......~~..::..~~',
  '~..TT.....==......~~',
  '~~........~~.....~~~',
  '~~~...TT..~~...~~~~~',
  '~~~~......~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~',
];
const legend: Record<string, Terrain> = { '.': 'grass', '~': 'water', ':': 'sand', '=': 'bridge', T: 'tree', '#': 'rock' };
if (rows.some(row => row.length !== 20)) throw new Error('Hollow Reach must be a rectangular map.');
export const hollowReach: Grid = { width: 20, height: rows.length, tiles: rows.map(row => [...row].map(c => legend[c])) };

export const unitDefinitions = [
  unitDefinition('scout', 'scout', { x: 3, y: 7 }),
  unitDefinition('hauler', 'hauler', { x: 3, y: 9 }),
];
export const startingPiles: Pile[] = [
  { cell: { x: 3, y: 8 }, supplies: { ...partCounts(1, 1), batteries: [] } },
  { cell: { x: 4, y: 9 }, supplies: { ...partCounts(0, 0, 0, 2), batteries: [] } },
];
// A spare and an empty battery make charge-preserving construction easy to explore.
startingPiles.push(
  { cell: { x: 7, y: 4 }, supplies: { red: 0, blue: 0, batteries: [100] , yellow: 0, green: 0, tires: 0} },
  { cell: { x: 2, y: 8 }, supplies: { red: 0, blue: 0, batteries: [0] , yellow: 0, green: 0, tires: 0} },
);
export const createHollowReach = () => new Simulation(hollowReach, unitDefinitions, { piles: startingPiles, goals: hollowGoals });
export const hollowGoals = [
  { id: 'shore', name: 'Shore', cell: { x: 15, y: 11 } },
];
