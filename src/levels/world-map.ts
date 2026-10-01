import type { Cell, Grid } from '../core/grid';
import type { WorldId } from './missions';
import { board } from './authored';

export type WorldDefinition = { id: WorldId; name: string; grid: Grid; locations: { id: string; cell: Cell }[] };
const locations = (ids: string[], cells: [number, number][]) => ids.map((id, i) => ({ id, cell: { x: cells[i][0], y: cells[i][1] } }));
const winding: [number, number][] = [[4,3],[10,3],[19,3],[19,7],[10,7],[4,7],[4,11],[10,11],[19,11],[19,15],[10,15],[4,15]];

export const worlds: WorldDefinition[] = [
  {
    id: 'meadow-isles', name: 'Meadow Isles',
    grid: board([
      '~~~~~~~~~~~~~~~~~~~~~~~~', '~~....................~~', '~.......TT.............~', '~.......TT.............~',
      '~...........~~.........~', '~..TT.......~~...#.....~', '~..TT.......~~...##....~', '~...........~~.........~',
      '~.....::....==.........~', '~.....::....~~..TT.....~', '~...........~~..TT.....~', '~...........~~.........~',
      '~......#....~~......:..~', '~......#....~~......:..~', '~...........==.........~', '~......................~',
      '~~....................~~', '~~~~~~~~~~~~~~~~~~~~~~~~',
    ]),
    locations: locations(['hollow-reach','parts-and-paths','siltwater-reach','stone-gate','woodland-workshop','split-kit',
      'flat-battery','switchback-stations','bramble-crossing','forked-watch','orchard-convoy','meadow-siege'], winding),
  },
  {
    id: 'sunstone-range', name: 'Sunstone Range',
    grid: board([
      '~~~~~~~~~~~~~~~~~~~~~~~~', '~~....................~~', '~.......~~....###......~', '~.......~~....###......~',
      '~.......~~.............~', '~.......==...^^^^......~', '~.......~~...^^^^......~', '~.......~~.............~',
      '~.......~~.............~', '~..^^...~~........TT...~', '~..^^...~~........TT...~', '~.......~~.............~',
      '~.......==....#........~', '~.......~~....##.......~', '~..............sss.....~', '~..............sss.....~',
      '~~....................~~', '~~~~~~~~~~~~~~~~~~~~~~~~',
    ], 'sand'),
    locations: locations(['rough-ridge','ridge-post','mudline','boulder-courtyard','repair-column','ancient-valley',
      'forward-foundry','canyon-rescue','salvage-chain','two-fronts','power-bridge','sunstone-citadel'], winding),
  },
  {
    id: 'open-sea', name: 'Open Sea',
    grid: board([
      'wwwwwwwwwwwwwwwwwwwwwwww', 'w.......w......ww......w', 'w..TT...w......ww......w', 'w..TT...w......ww......w',
      'w.......=......ww..TT..w', 'w.......w......==..TT..w', 'w.......w......ww......w', 'w.......w......ww......w',
      'wwwww=wwwwwwwwwwwwww=www', 'wwwww=wwwwwwwwwwwwww=www', 'w.......w......ww......w', 'w.......w......ww......w',
      'w..#....=......ww......w', 'w..##...w......==......w', 'w.......w..TT..ww......w', 'w.......w..TT..ww......w',
      'w.......w......ww......w', 'wwwwwwwwwwwwwwwwwwwwwwww',
    ], 'sand'),
    locations: locations(['tidepool-trail','reef-courier','deepwater-maze','marina-relay','harbor-run','wreck-recovery',
      'canal-foundry','gator-backwater','island-handoffs','storm-line','last-reserves','three-tides'], [[5,3], ...winding.slice(1)]),
  },
];
