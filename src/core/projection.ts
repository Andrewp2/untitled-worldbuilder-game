import { isWater, terrainAt, type Cell, type Grid } from './grid';

export const TILE_WIDTH = 80;
export const TILE_HEIGHT = 40;
export const WATER_DROP = 10;
export function toWorld(p: Cell): Cell {
  return { x: (p.x - p.y) * TILE_WIDTH / 2, y: (p.x + p.y) * TILE_HEIGHT / 2 };
}
export function toCell(p: Cell): Cell {
  return { x: Math.round(p.x / TILE_WIDTH + p.y / TILE_HEIGHT), y: Math.round(p.y / TILE_HEIGHT - p.x / TILE_WIDTH) };
}
/** Match physical ground contact when an amphibian crosses a shoreline. */
export function surfacePoint(grid: Grid, cell: Cell): Cell {
  const x = Math.floor(cell.x), y = Math.floor(cell.y), tx = cell.x - x, ty = cell.y - y;
  const drop = (cx: number, cy: number) => isWater(terrainAt(grid, { x: cx, y: cy })) ? WATER_DROP : 0;
  const p = toWorld(cell);
  p.y += drop(x, y) * (1 - tx) * (1 - ty) + drop(x + 1, y) * tx * (1 - ty) + drop(x, y + 1) * (1 - tx) * ty + drop(x + 1, y + 1) * tx * ty;
  return p;
}
