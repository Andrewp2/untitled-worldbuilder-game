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
    id: 'rough-ridge', name: 'Rough Ridge', goal: 'Bring Trailbuggy to Lookout',
    brief: 'Scout cannot cross the rocky saddle. Collect Trailbuggy’s plan, then combine Scout’s recovered yellow piece and battery with the loose red and blue. The Crab cannot cross rough terrain. After reaching Lookout, build Scoop to make a low crossing for the original Snail; Warden can protect that route.',
    grid: authoredGrid([
      '~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~..~~~~~...~~~',
      '~~~T~~~..~~~~~~...~~',
      '~..T~~~..~~~~~~:..~~',
      '~~..~~~..~~~~~~#...~',
      '~........^^^~~~#...~',
      '~........^^^..#....~',
      '~..::....~~~.......~',
      '~..::....~~~.......~',
      '~.....#..~~~.......~',
      '~~....#..~~~..TT...~',
      '~~~......~~~..TT...~',
      '~........~~~.......~',
      '~~.......~~~......~~',
      '~~~~~....~~~....~~~~',
      '~~~~~~~~~~~~~~~~~~~~',
    ]),
    rovers: [unitDefinition('scout', 'scout', { x: 3, y: 6 }), unitDefinition('snail', 'snail', { x: 3, y: 10 })],
    piles: [{ cell: { x: 4, y: 6 }, supplies: supplies(1, 1) }, { cell: { x: 4, y: 9 }, supplies: recipeSupplies('scoop', 100) }, { cell: { x: 5, y: 9 }, supplies: recipeSupplies('warden', 100) }],
    goals: [{ id: 'lookout', name: 'Lookout', cell: { x: 17, y: 4 }, kinds: ['trailbuggy'] }],
    bonus: { kind: 'arrival', name: 'Snail rescue', description: 'Guide the original Snail to the far-bank star.', cell: { x: 17, y: 12 }, unitId: 'snail' },
    enemies: [enemyDefinition('crab', 'ridge-crab', { x: 15, y: 9 })],
    blueprints: { scoop: 1, warden: 1 }, seed: 3101,
    blueprintPickups: [{ blueprint: 'trailbuggy', cell: { x: 4, y: 7 } }],
  },
  {
    id: 'ancient-valley', name: 'Ancient Valley', goal: 'Clear the valley · reach Old lookout',
    brief: 'Mender uses its own charge to restore a nearby bot. Bot workshop provides power at camp; Sentry tower defends its neighboring tiles. Keep Mender near Warden while confronting Scorpion and Rex. Their defeated parts include charged batteries. After Lookout, combine Scorpion’s yellow pieces with Rex’s red/green pieces and live battery to build Arborbot. Bring a valley tree around the rough terrain to the lookout star.',
    grid: authoredGrid([
      '~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~.....~~~~~',
      '~~~~.....~~~......~~',
      '~~...TT..~~~^......~',
      '~....TT.#~~~^.^^^..~',
      '~.......#.....^^^..~',
      '~..::.........^^^..~',
      '~..::........^^^^..~',
      '~~~~......#..^^^^..~',
      '~~~~......#..^^^^..~',
      '~~~~..........^^^.~~',
      '~~.....~~~....^^^.~~',
      '~~~....~~~....^^^..~',
      '~~~~~..~~~........~~',
      '~~~~~~~~~~.......~~~',
      '~~~~~~~~~~~~~~~~~~~~',
    ]),
    rovers: [unitDefinition('warden', 'warden', { x: 3, y: 6 }), unitDefinition('mender', 'mender', { x: 2, y: 7 }), unitDefinition('workshop', 'workshop', { x: 3, y: 5 }), unitDefinition('trailbuggy', 'courier', { x: 4, y: 8 })],
    piles: [{ cell: { x: 4, y: 5 }, supplies: recipeSupplies('sentry', 100) }, { cell: { x: 4, y: 7 }, supplies: supplies(0, 0, 0, 2) }],
    goals: [{ id: 'old-lookout', name: 'Old lookout', clearEnemies: true, cell: { x: 17, y: 3 }, kinds: ['warden'] }],
    bonus: { kind: 'arrival', name: 'Valley gardener', description: 'Bring a living tree to the lookout star with Arborbot.', cell: { x: 17, y: 2 }, kinds: ['arborbot'], carryingTree: true },
    enemies: [enemyDefinition('scorpion', 'valley-scorpion', { x: 13, y: 7 }), enemyDefinition('trex', 'valley-rex', { x: 16, y: 12 })],
    blueprints: { sentry: 1 }, seed: 3105,
    blueprintPickups: [{ blueprint: 'arborbot', cell: { x: 16, y: 3 }, afterMain: true }],
  },
];
