import type { Grid, Terrain } from '../core/grid';

const rows = [
  '~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~.....~~~~~~~~',
  '~~~~~.......:...~~~~',
  '~~~..TT......:...~~~',
  '~~...TT..~~~......~~',
  '~.......:~~~..#....~',
  '~........===..##...~',
  '~..:.....~~~.......~',
  '~~.::....~~~..TT...~',
  '~~~......~~~~.TT...~',
  '~~~...#..~~~...:...~',
  '~~~~.....===.......~',
  '~~~~~.....~~......~~',
  '~~~~~~.....~~.....~~',
  '~~~~~~~...~~~~...~~~',
  '~~~~~~~~~~~~~~~~~~~~',
];
const legend: Record<string, Terrain> = { '.': 'grass', '~': 'water', ':': 'sand', '=': 'bridge', T: 'tree', '#': 'rock' };
if (rows.some(row => row.length !== 20)) throw new Error('World map must be rectangular.');
export const worldMap: Grid = { width: 20, height: rows.length, tiles: rows.map(row => [...row].map(tile => legend[tile])) };
export const worldLocations = [
  { id: 'hollow-reach', cell: { x: 4, y: 5 } },
  { id: 'bramble-crossing', cell: { x: 16, y: 11 } },
  { id: 'siltwater-reach', cell: { x: 7, y: 12 } },
  { id: 'rough-ridge', cell: { x: 7, y: 2 } },
  { id: 'woodland-workshop', cell: { x: 4, y: 8 } },
  { id: 'tidepool-trail', cell: { x: 12, y: 3 } },
  { id: 'harbor-run', cell: { x: 17, y: 7 } },
  { id: 'ancient-valley', cell: { x: 14, y: 13 } },
];
