import type { Cell, Grid } from '../core/grid';
import type { WorldId } from '../levels/missions';
import { board } from '../levels/authored';

type Islet = { grid: Grid; at: Cell; scale: number };
type Backdrop = { sea: number; islets: Islet[] };
const islet = (rows: string[], x: number, y: number, scale: number, ground: 'grass' | 'sand' = 'grass'): Islet => ({
  grid: board(rows, ground), at: { x, y }, scale,
});

/** Scenery belongs to the surrounding sea, outside the playable mission landscape. */
export const worldBackdrops: Record<WorldId, Backdrop> = {
  'meadow-isles': {
    sea: 0x48b7d3,
    islets: [
      islet(['~~~~~~~','~~...~~','~..T..~','~.TT..~','~~...~~','~~~~~~~'], .86, .19, .60),
      islet(['~~~~~~','~~..~~','~.T..~','~....~','~~..~~','~~~~~~'], .08, .76, .55),
      islet(['~~~~~~','~~..~~','~.:#.~','~~..~~','~~~~~~'], .84, .87, .46),
    ],
  },
  'sunstone-range': {
    sea: 0x48b7d3,
    islets: [
      islet(['~~~~~~','~~..~~','~.##.~','~~#..~','~~~.~~','~~~~~~'], .10, .24, .60, 'sand'),
      islet(['~~~~~~~','~~...~~','~..##.~','~...#.~','~~..~~~','~~~~~~~'], .94, .37, .54, 'sand'),
      islet(['~~~~~~~','~~~..~~','~~....~','~..#..~','~~...~~','~~~~~~~'], .13, .86, .58, 'sand'),
    ],
  },
  'open-sea': {
    sea: 0x328dab,
    islets: [
      islet(['~~~~~~~','~~:::~~','~:..T:~','~~:..:~','~~~::~~','~~~~~~~'], .09, .23, .54),
      islet(['~~~~~~','~~::~~','~:T.:~','~:..:~','~~::~~','~~~~~~'], .91, .80, .59),
      islet(['~~~~~~~','~~~::~~','~~:..:~','~:..#:~','~~:::~~','~~~~~~~'], .12, .89, .44),
    ],
  },
};

export type BackdropViewport = { width: number; height: number; zoom: number; center: Cell };

export function backdropLayout(world: WorldId, viewport: BackdropViewport) {
  const { width, height, zoom, center } = viewport;
  if (![width, height, zoom].every(value => Number.isFinite(value) && value > 0)) {
    throw new RangeError('A world backdrop needs a visible viewport and positive zoom.');
  }
  const bounds = {
    x: center.x - width / zoom / 2 - 80,
    y: center.y - height / zoom / 2 - 80,
    width: width / zoom + 160,
    height: height / zoom + 160,
  };
  const islets = worldBackdrops[world].islets.map(islet => {
    const { grid, at, scale } = islet;
    const localCenter = { x: (grid.width - grid.height) * 20, y: (grid.width + grid.height - 2) * 10 };
    return {
      ...islet,
      x: center.x + (at.x - .5) * width / zoom - localCenter.x * scale,
      y: center.y + (at.y - .5) * height / zoom - localCenter.y * scale,
    };
  });
  const waves: Cell[] = [];
  for (let row = 0; row < Math.ceil(bounds.height / 200); row++) {
    for (let column = 0; column < Math.ceil(bounds.width / 300); column++) {
      if ((row * 7 + column * 3) % 5 > 1) continue;
      waves.push({ x: bounds.x + column * 300 + (row % 3) * 45, y: bounds.y + row * 200 + (column % 3) * 24 });
    }
  }
  return { bounds, islets, waves };
}
