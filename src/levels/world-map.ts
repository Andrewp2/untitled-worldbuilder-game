import { findPath, type Cell, type Grid, type Mobility } from '../core/grid';
import type { WorldId } from './missions';
import { board } from './authored';

export type WorldDefinition = {
  id: WorldId;
  name: string;
  grid: Grid;
  locations: { id: string; cell: Cell }[];
  trailMobility: Mobility;
  trails: Cell[][];
};
type Coordinate = [number, number];
const cell = ([x, y]: Coordinate): Cell => ({ x, y });

/** Pins and bends follow authored coasts and passes. Array order stays the campaign order. */
function landscape(id: WorldId, name: string, ground: 'grass' | 'sand', rows: string[], ids: string[],
  pins: Coordinate[], bends: Record<number, Coordinate[]>, trailMobility: Mobility = 'land'): WorldDefinition {
  const grid = board(rows, ground);
  const locations = ids.map((id, index) => ({ id, cell: cell(pins[index]) }));
  const trails = locations.slice(1).map((location, index) => {
    const stops = [locations[index].cell, ...(bends[index + 1] ?? []).map(cell), location.cell];
    const route = [stops[0]];
    for (let i = 1; i < stops.length; i++) {
      const leg = findPath(grid, stops[i - 1], stops[i], new Set(), trailMobility);
      if (!leg) throw new Error(`${name} needs a connected trail to ${location.id}.`);
      route.push(...leg);
    }
    return route;
  });
  return { id, name, grid, locations, trailMobility, trails };
}

export const worlds: WorldDefinition[] = [
  // A crescent coast around a lagoon, with a short bridge and a wooded southern reach.
  landscape('meadow-isles', 'Meadow Isles', 'grass', [
    '~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~.....~~~~~~~~~~~~~~~~',
    '~~~...........:::~~~~~~~~~',
    '~~..............:.~~~~~~~~',
    '~~............TT.~~~..~~~~',
    '~................==....~~~',
    '~...............#~......~~',
    '~....TT.~~~~~...~~....TT~~',
    '~....T.~~~~~~~~~~........~',
    '~......~~~~~~~~~.......::~',
    '~.......~~~~~~~~~......::~',
    '~~.......~~~~~~~~........~',
    '~~~....T..~~~~~~~.T.....~~',
    '~~~~~......~~~~~~.T.....~~',
    '~~~~~~.....~~~~~.......~~~',
    '~~~~~~~....~~~~~.......~~~',
    '~~~~~~~~...~~~........~~~~',
    '~~~~~~~~~..........#..~~~~',
    '~~~~~~~~~.......TT.#...~~~',
    '~~~~~~~~~~~............~~~',
    '~~~~~~~~~~~.#.......::~~~~',
    '~~~~~~~~~~~~.......:~~~~~~',
    '~~~~~~~~~~~~~~....~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~',
  ], [
    'hollow-reach','parts-and-paths','siltwater-reach','stone-gate',
    'woodland-workshop','split-kit','flat-battery','switchback-stations',
    'bramble-crossing','forked-watch','orchard-convoy','meadow-siege',
  ], [
    [2,10],[3,5],[6,2],[11,3],
    [15,2],[20,7],[23,13],[20,14],
    [20,20],[16,21],[9,17],[8,12],
  ], {
    1: [[2,7]],
    2: [[3,3]],
    3: [[8,2]],
    4: [[13,2]],
    5: [[16,5],[19,5]],
    6: [[22,6],[24,8]],
    7: [[22,12]],
    8: [[21,16],[22,18]],
    9: [[18,21]],
    10: [[12,19]],
    11: [[9,17]],
  }),
  // A winding valley between broken ridges, an oasis, and two river crossings.
  landscape('sunstone-range', 'Sunstone Range', 'sand', [
    '~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~....~~~~~~~~~~~~',
    '~~~~~~~.........~~~~~~~~~~',
    '~~~~~~..##........~~~~~~~~',
    '~~~~~...###.........~~~~~~',
    '~~~......#...........~~~~~',
    '~~...........###.......~~~',
    '~..............###......~~',
    '~................#......#~',
    '~~~~~....................~',
    '~~~~~........ss......##..~',
    '~~~~.........T~~sT...#...~',
    '~~.##..........~.s..##...~',
    '~~.............~~..#....~~',
    '~...#...........~......~~~',
    '~..#............=......~~~',
    '~.......#.......~......~~~',
    '~.......###.....~~......~~',
    '~~........##.....=~.....~~',
    '~~~........##.....~.~~~~~~',
    '~~~~~.............~~~~~~~~',
    '~~~~~~~~.........~~~~~~~~~',
    '~~~~~~~~~~~.....~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~',
  ], [
    'rough-ridge','ridge-post','mudline','boulder-courtyard',
    'repair-column','ancient-valley','forward-foundry','canyon-rescue',
    'salvage-chain','two-fronts','power-bridge','sunstone-citadel',
  ], [
    [2,17],[5,13],[3,7],[7,5],
    [11,2],[17,4],[12,9],[10,12],
    [14,17],[20,18],[23,12],[23,7],
  ], {
    1: [[5,16]],
    2: [[5,10]],
    3: [[3,6]],
    4: [[7,3]],
    5: [[14,3]],
    6: [[12,4],[12,6]],
    7: [[11,10]],
    8: [[13,13]],
    9: [[16,15],[18,16]],
    10: [[23,17]],
    11: [[23,9],[22,8]],
  }),
  // Uneven islands, sandy coves, and sea lanes; only the close lagoon crossing has a bridge.
  landscape('open-sea', 'Open Sea', 'grass', [
    'wwwwwwwwwwww~~wwwwwwwwwwww',
    'wwwwwwwwwww~::~~wwwwww~www',
    'wwwwww~~ww~:..::~wwww~:~ww',
    'wwwww~::~~:.....:~ww~:.:~w',
    'wwww~:#.:~~:.....:~~:...:~',
    'www~:....:~~:.TT..:~:...:~',
    'ww~:.....:~w~:...#:~~:.T:~',
    'w~:.TT..:~ww~:ss..:~~:.T:~',
    'w~:....:~wwww~s..:~w~:..:~',
    'w~:....:~wwwww~::~www~:.:~',
    'ww~:...:~wwwww~~::~ww~#.:~',
    'www~:.:~wwwww~::..:~~:..:~',
    'wwww~::~wwww~:....:~w~:.:~',
    'wwwww~~www~~~:#....:~w~:~w',
    'www~~www~~::~~::..TT:~w~ww',
    'ww~::~w~::..:~~~:....:~www',
    'w~:..:~~:....:~w~:....:~ww',
    '~:....#~~:.TT:~ww~:...:~ww',
    '~:.....:=:...:~www~:.:~www',
    'w~:....:~:.#:~wwwww~:~wwww',
    'w~:TT...:...:~wwwwww~wwwww',
    'ww~:...:~:::~wwwwwwwwwwwww',
    'www~:::::~~~wwwwwwwwwwwwww',
    'wwww~~~~~wwwwwwwwwwwwwwwww',
  ], [
    'tidepool-trail','reef-courier','deepwater-maze','marina-relay',
    'harbor-run','wreck-recovery','canal-foundry','gator-backwater',
    'island-handoffs','storm-line','last-reserves','three-tides',
  ], [
    [3,18],[8,22],[10,20],[9,15],
    [5,10],[7,5],[12,3],[17,7],
    [15,12],[20,16],[23,11],[22,4],
  ], {
    1: [[4,21]],
    2: [[9,22]],
    3: [[11,18]],
    4: [[7,14],[6,12]],
    5: [[3,9],[3,6]],
    6: [[9,4]],
    7: [[16,4]],
    8: [[17,10]],
    9: [[16,14],[18,16]],
    10: [[23,16],[24,13]],
    11: [[24,8],[24,5]],
  }, 'land-water'),
];
