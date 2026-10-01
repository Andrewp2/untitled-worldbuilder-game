export type Cell = { x: number; y: number };
export type Terrain = 'grass' | 'sand' | 'water' | 'deep-water' | 'rough' | 'swamp' | 'bridge' | 'tree' | 'rock';
export type Mobility = 'land' | 'rough' | 'amphibious' | 'water' | 'land-water' | 'shallow';
export type Grid = { width: number; height: number; tiles: Terrain[][] };
export const key = (p: Cell) => `${p.x},${p.y}`;
export const sameCell = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
export const neighbors = (p: Cell): Cell[] => [
  { x: p.x + 1, y: p.y }, { x: p.x, y: p.y + 1 },
  { x: p.x - 1, y: p.y }, { x: p.x, y: p.y - 1 },
];
/** The blueprint's complete 3×3 area, with the site consumed first. */
export const constructionArea = (p: Cell): Cell[] => [p, ...neighbors(p),
  { x: p.x - 1, y: p.y - 1 }, { x: p.x + 1, y: p.y - 1 },
  { x: p.x + 1, y: p.y + 1 }, { x: p.x - 1, y: p.y + 1 },
];
export const adjacent = (a: Cell, b: Cell): boolean => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
export function terrainAt(grid: Grid, p: Cell): Terrain | undefined {
  if (!Number.isInteger(p.x) || !Number.isInteger(p.y)) return undefined;
  return grid.tiles[p.y]?.[p.x];
}
export const isWater = (terrain: Terrain | undefined): boolean => terrain === 'water' || terrain === 'deep-water';
export function walkable(grid: Grid, p: Cell, mobility: Mobility = 'land'): boolean {
  const t = terrainAt(grid, p);
  if (mobility === 'shallow') return t === 'water';
  if (mobility === 'water') return isWater(t);
  if (isWater(t)) return mobility === 'land-water' || mobility === 'amphibious' && t === 'water';
  if (t === 'rough') return mobility === 'rough';
  return t === 'grass' || t === 'sand' || t === 'swamp' || t === 'bridge';
}

/** Breadth-first search is sufficient for the small, uniformly weighted boards. */
export function findPath(grid: Grid, start: Cell, goal: Cell, blocked = new Set<string>(), mobility: Mobility = 'land'): Cell[] | null {
  if (!walkable(grid, start, mobility) || !walkable(grid, goal, mobility) || blocked.has(key(goal))) return null;
  if (sameCell(start, goal)) return [];
  const queue: Cell[] = [{ ...start }];
  const parent = new Map<string, Cell | null>([[key(start), null]]);
  const directions = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    for (const d of directions) {
      const next = { x: current.x + d.x, y: current.y + d.y };
      const id = key(next);
      if (parent.has(id) || blocked.has(id) || !walkable(grid, next, mobility)) continue;
      parent.set(id, current);
      if (sameCell(next, goal)) {
        const route: Cell[] = [];
        let cursor: Cell = next;
        while (!sameCell(cursor, start)) {
          route.push(cursor);
          cursor = parent.get(key(cursor))!;
        }
        return route.reverse();
      }
      queue.push(next);
    }
  }
  return null;
}
