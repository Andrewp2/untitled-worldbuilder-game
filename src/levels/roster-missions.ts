import { enemyDefinition, partCounts, recipeSupplies, unitDefinition } from '../core/catalog';
import type { Grid, Terrain } from '../core/grid';
import type { Mission } from './missions';

const legend: Record<string, Terrain> = { '.': 'grass', ':': 'sand', '~': 'water', w: 'deep-water', '^': 'rough', s: 'swamp', T: 'tree', '#': 'rock', '=': 'bridge' };
function authoredGrid(rows: string[]): Grid {
  if (rows.some(row => row.length !== 20 || [...row].some(tile => !legend[tile]))) throw new Error('A roster mission needs a rectangular, known terrain layout.');
  return { width: 20, height: rows.length, tiles: rows.map(row => [...row].map(tile => legend[tile])) };
}
const supplies = (red = 0, blue = 0, yellow = 0, green = 0, batteries: number[] = []) => ({ ...partCounts(red, blue, yellow, green), batteries });

export const rosterMissions: Mission[] = [
  {
    id: 'rough-ridge', name: 'Rough Ridge', goal: 'Bring Trailbuggy to the Lookout flag',
    brief: 'Only Trailbuggy crosses the gray ridge. The Crab cannot cross it. After reaching Lookout, build Scoop to make a low crossing for the original Snail; Warden can protect that route.',
    grid: authoredGrid([
      '~~~~~~~~~~~~~~~~~~~~', '~~.......~~~......~~', '~..TT....~~~.......~', '~..TT....~~~..::...~',
      '~........~~~..::...~', '~........^^^.......~', '~........^^^..#....~', '~..::....~~~.......~',
      '~..::....~~~.......~', '~.....#..~~~.......~', '~.....#..~~~..TT...~', '~........~~~..TT...~',
      '~........~~~.......~', '~~.......~~~......~~', '~~~......~~~.....~~~', '~~~~~~~~~~~~~~~~~~~~',
    ]),
    rovers: [unitDefinition('trailbuggy', 'trailbuggy', { x: 3, y: 6 }), unitDefinition('snail', 'snail', { x: 3, y: 10 })],
    piles: [{ cell: { x: 4, y: 6 }, supplies: supplies(0, 0, 0, 0, [100]) }, { cell: { x: 4, y: 9 }, supplies: recipeSupplies('scoop', 100) }, { cell: { x: 5, y: 9 }, supplies: recipeSupplies('warden', 100) }],
    goals: [{ id: 'lookout', name: 'Lookout', cell: { x: 17, y: 4 }, kinds: ['trailbuggy'] }],
    bonus: { kind: 'arrival', name: 'Snail rescue', description: 'Make a crossing and guide Snail to the far-bank star.', cell: { x: 17, y: 12 }, unitId: 'snail' },
    enemies: [enemyDefinition('crab', 'ridge-crab', { x: 15, y: 9 })],
    blueprints: { trailbuggy: 1, snail: 1, scoop: 1, warden: 1, hauler: 1, scout: 1 }, seed: 3101,
  },
  {
    id: 'woodland-workshop', name: 'Woodland Workshop', goal: 'Guide Arborbot to the Grove flag',
    brief: 'Arborbot lifts and replants one tree; Dozer pushes a boulder or pile away from itself. Keep the tile beyond a push clear. Forklift carries 10 parts, while Bulk hauler carries 25. Two trees block the only grove corridor, so make room to replant each one. After arrival, the bonus supplies are trapped behind a camp boulder; use Dozer to open a loading tile.',
    grid: authoredGrid([
      '~~~~~~~~~~~~~~~~~~~~', '~~.......~~~......~~', '~........~~~.......~', '~........~~~.......~',
      '~..::....~~~...T...~', '~..::....~~~...T...~', '~........T..T......~', '~........#~~.......~',
      '~........~~~.......~', '~.....#..~~~..::...~', '~....T.T.~~~..::...~', '~.....T..~~~.......~',
      '~........~~~.......~', '~~.......~~~......~~', '~~~......~~~.....~~~', '~~~~~~~~~~~~~~~~~~~~',
    ]),
    rovers: [unitDefinition('arborbot', 'arborbot', { x: 4, y: 6 }), unitDefinition('dozer', 'dozer', { x: 4, y: 7 }), unitDefinition('forklift', 'forklift', { x: 3, y: 9 }), unitDefinition('dumptruck', 'bulk', { x: 5, y: 9 }), unitDefinition('pump', 'charging-station', { x: 3, y: 8 })],
    piles: [{ cell: { x: 6, y: 10 }, supplies: supplies(3, 1, 0, 4) }, { cell: { x: 4, y: 5 }, supplies: recipeSupplies('arborbot', 100) }],
    goals: [{ id: 'grove', name: 'Grove', cell: { x: 17, y: 3 }, kinds: ['arborbot'] }],
    bonus: { kind: 'delivery', ...partCounts(3, 1, 0, 4), name: 'Grove supplies', description: 'Deliver 3 red, 1 blue and 4 green to the grove’s star.', cell: { x: 17, y: 5 }, chargedBatteries: 0 },
    enemies: [], blueprints: { arborbot: 1, dozer: 1, forklift: 1, dumptruck: 1, pump: 1, hauler: 1, scout: 1 }, seed: 3102,
  },
  {
    id: 'tidepool-trail', name: 'Tidepool Trail', goal: 'Guide Frog to the far-bank flag',
    brief: 'Frog and Duck can use land and pale shallow water. Fish can swim in shallow or dark deep water, but cannot enter land. Guide Frog to the eastern flag, then bring the original Duck back through the shallows for its bonus nest. Swamp ground uses more charge per step; keep an eye on the batteries.',
    grid: authoredGrid([
      'wwwwwwwwwwwwwwwwwwww', 'ww.......www......ww', 'w........www.......w', 'w...T....www.......w',
      'w...T....www..::...w', 'w........~~~..::...w', 'w..::....~~~.......w', 'w..::....~~~.......w',
      'w........~~~.......w', 'w........www.......w', 'w..sss...www.......w', 'w..sss...www...T...w',
      'w........www...T...w', 'ww.......www......ww', 'www......www.....www', 'wwwwwwwwwwwwwwwwwwww',
    ]),
    rovers: [unitDefinition('frog', 'frog', { x: 3, y: 7 }), unitDefinition('duck', 'duck', { x: 16, y: 9 }), unitDefinition('fish', 'fish', { x: 10, y: 11 })],
    piles: [{ cell: { x: 3, y: 9 }, supplies: recipeSupplies('hauler', 100) }, { cell: { x: 5, y: 11 }, supplies: supplies(0, 0, 0, 0, [53]) }],
    goals: [{ id: 'frog-bank', name: 'Frog bank', cell: { x: 17, y: 4 }, kinds: ['frog'] }],
    bonus: { kind: 'arrival', name: 'Duck nesting ground', description: 'Guide Duck across the shallows to the western nest.', cell: { x: 4, y: 12 }, unitId: 'duck' },
    enemies: [], blueprints: { frog: 1, duck: 1, fish: 1, hauler: 1, scout: 1 }, seed: 3103,
  },
  {
    id: 'harbor-run', name: 'Harbor Run', goal: 'Escort Freighter to the outer harbor',
    brief: 'Tugboat carries 5 parts, Freighter carries 25, and Patrol boat fights adjacent water creatures automatically. Marina recharges nearby boats. Protect Freighter on its eastern journey, then return for a shore delivery. Cargo boats sail beside a shoreline pile to transfer it. Reef crabs and sharks stay in water; Gator can leave the shore.',
    grid: authoredGrid([
      '~~~~~~~~~~~~~~~~~~~~', '~~.....~~~wwwwww~~~~', '~......~~~wwwwww...~', '~......~~~wwwwww...~',
      '~......~~~wwwwww...~', '~.....:~~~wwwwww...~', '~.....:~~~wwwwww...~', '~.....:~~~wwwwww...~',
      '~......~~~wwwwww...~', '~......~~~wwwwww...~', '~~.....~~~wwwwww...~', '~~~...~~~~wwwwww...~',
      '~~~~~~~~~~wwwwww...~', '~~~~~~~~~~wwwwww...~', '~~~~~~~~~~wwwwww~~~~', '~~~~~~~~~~~~~~~~~~~~',
    ]),
    rovers: [unitDefinition('tug', 'tug', { x: 8, y: 6 }), unitDefinition('freighter', 'freighter', { x: 10, y: 7 }), unitDefinition('patrolboat', 'patrolboat', { x: 9, y: 8 }), unitDefinition('marina', 'marina', { x: 7, y: 6 })],
    piles: [{ cell: { x: 6, y: 7 }, supplies: supplies(2, 4, 0, 6) }, { cell: { x: 6, y: 5 }, supplies: recipeSupplies('patrolboat', 100) }],
    goals: [{ id: 'freight-channel', name: 'Outer harbor', cell: { x: 14, y: 10 }, kinds: ['freighter'] }],
    bonus: { kind: 'delivery', ...partCounts(2, 4, 0, 6), name: 'Outer harbor supplies', description: 'Deliver 2 red, 4 blue and 6 green to the outer shore.', cell: { x: 16, y: 9 }, chargedBatteries: 0 },
    enemies: [enemyDefinition('water-crab', 'reef-crab', { x: 12, y: 3 }), enemyDefinition('shark', 'harbor-shark', { x: 12, y: 12 }), enemyDefinition('gator', 'harbor-gator', { x: 17, y: 6 })],
    blueprints: { tug: 1, freighter: 1, patrolboat: 1, marina: 1 }, seed: 3104,
  },
  {
    id: 'ancient-valley', name: 'Ancient Valley', goal: 'Clear the valley and reach the Lookout',
    brief: 'Mender uses its own charge to restore a nearby bot. Bot workshop provides power at camp; Sentry tower defends its neighboring tiles. Keep Mender near Warden while confronting Scorpion and Rex. Their defeated parts include charged batteries.',
    grid: authoredGrid([
      '~~~~~~~~~~~~~~~~~~~~', '~~................~~', '~..................~', '~....TT............~',
      '~....TT.......^^^..~', '~.............^^^..~', '~..::.........^^^..~', '~..::........^^^^..~',
      '~.........#..^^^^..~', '~.........#..^^^^..~', '~.............^^^..~', '~.............^^^..~',
      '~.............^^^..~', '~~................~~', '~~~..............~~~', '~~~~~~~~~~~~~~~~~~~~',
    ]),
    rovers: [unitDefinition('warden', 'warden', { x: 3, y: 6 }), unitDefinition('mender', 'mender', { x: 2, y: 7 }), unitDefinition('workshop', 'workshop', { x: 3, y: 5 }), unitDefinition('trailbuggy', 'courier', { x: 4, y: 8 })],
    piles: [{ cell: { x: 4, y: 5 }, supplies: recipeSupplies('sentry', 100) }, { cell: { x: 4, y: 7 }, supplies: supplies(0, 0, 0, 2) }],
    goals: [{ id: 'old-lookout', name: 'Old lookout', clearEnemies: true, cell: { x: 17, y: 3 }, kinds: ['warden'] }],
    bonus: { kind: 'delivery', ...partCounts(0, 0, 4, 6), name: 'Valley salvage', description: 'Recover and deliver 4 yellow, 6 green and a charged battery.', cell: { x: 17, y: 2 }, chargedBatteries: 1 },
    enemies: [enemyDefinition('scorpion', 'valley-scorpion', { x: 13, y: 7 }), enemyDefinition('trex', 'valley-rex', { x: 16, y: 12 })],
    blueprints: { warden: 1, mender: 1, workshop: 1, sentry: 1, trailbuggy: 1, hauler: 1, scout: 1 }, seed: 3105,
  },
];
