export type Cell = { x: number; y: number };
export type Terrain = 'grass' | 'sand' | 'water' | 'deep-water' | 'whirlpool' | 'rough' | 'swamp' | 'bridge' | 'tree' | 'rock';
export type Mobility = 'land' | 'rough' | 'amphibious' | 'water' | 'land-water' | 'shallow';
export type Grid = { width: number; height: number; tiles: Terrain[][]; whirlpools?: Record<string, Cell> };
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
export const isWater = (terrain: Terrain | undefined): boolean => terrain === 'water' || terrain === 'deep-water' || terrain === 'whirlpool';
export function walkable(grid: Grid, p: Cell, mobility: Mobility = 'land'): boolean {
  const t = terrainAt(grid, p);
  if (mobility === 'shallow') return t === 'water' || t === 'whirlpool';
  if (mobility === 'water') return isWater(t);
  if (isWater(t)) return mobility === 'land-water' || mobility === 'amphibious' && (t === 'water' || t === 'whirlpool');
  if (t === 'rough') return mobility === 'rough';
  return t === 'grass' || t === 'sand' || t === 'swamp' || t === 'bridge';
}

/** A jump occurs on entry only; standing at an exit never triggers another jump. */
export function movementDestination(grid: Grid, entry: Cell): Cell {
  return terrainAt(grid, entry) === 'whirlpool' ? grid.whirlpools?.[key(entry)] ?? entry : entry;
}
export function canEnter(grid: Grid, entry: Cell, blocked: Set<string>, mobility: Mobility): boolean {
  const exit = movementDestination(grid, entry);
  return walkable(grid, entry, mobility) && walkable(grid, exit, mobility)
    && !blocked.has(key(entry)) && !blocked.has(key(exit));
}
export function validateWhirlpools(grid: Grid): void {
  for (const [entryKey, exit] of Object.entries(grid.whirlpools ?? {})) {
    const [x, y] = entryKey.split(',').map(Number);
    const entry = { x, y };
    if (key(entry) !== entryKey || terrainAt(grid, entry) !== 'whirlpool'
      || terrainAt(grid, exit) !== 'whirlpool' || sameCell(entry, exit)) throw new Error('Invalid whirlpool link.');
  }
  grid.tiles.forEach((row, y) => row.forEach((tile, x) => {
    if (tile === 'whirlpool' && !grid.whirlpools?.[key({ x, y })]) throw new Error('Whirlpool needs an exit.');
  }));
}

/** BFS over physical steps and automatic jumps. Routes contain entry tiles;
 * the simulation performs the jump before consuming the next physical step. */
export function findPath(grid: Grid, start: Cell, goal: Cell, blocked = new Set<string>(), mobility: Mobility = 'land'): Cell[] | null {
  const destination = goal;
  if (!walkable(grid, start, mobility) || !walkable(grid, goal, mobility) || blocked.has(key(goal))) return null;
  if (sameCell(start, destination)) return [];
  const queue: Cell[] = [{ ...start }];
  const parent = new Map<string, { from: Cell; step: Cell } | null>([[key(start), null]]);
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    for (const step of neighbors(current)) {
      if (!canEnter(grid, step, blocked, mobility)) continue;
      const next = movementDestination(grid, step), id = key(next);
      if (parent.has(id)) continue;
      parent.set(id, { from: current, step });
      if (sameCell(next, destination)) {
        const route: Cell[] = [];
        let cursor = next;
        while (!sameCell(cursor, start)) {
          const edge = parent.get(key(cursor))!;
          route.push(edge.step); cursor = edge.from;
        }
        return route.reverse();
      }
      queue.push(next);
    }
  }
  return null;
}
