import { findPath, walkable, type Cell, type Grid, type Mobility } from '../core/grid';
import { unitSpecs, type UnitKind } from '../core/catalog';
import { worlds } from '../levels/world-map';
import type { WorldId } from '../levels/missions';

const residentKinds: Record<WorldId, UnitKind[]> = {
  'meadow-isles': ['scout','hauler','scoop','dozer','arborbot','forklift','scout','hauler','warden','warden','dumptruck','snail'],
  'sunstone-range': ['trailbuggy','warden','hauler','snail','mender','mender','trailbuggy','scoop','dozer','arborbot','forklift','warden'],
  'open-sea': ['frog','freighter','fish','tug','patrolboat','freighter','tug','frog','forklift','patrolboat','freighter','arborbot'],
};

/** Small scenery patrols are fitted to each authored landscape, never to a mission simulation. */
export const residentHomes = worlds.flatMap(world => world.locations.map((location, i) => {
  const kind = residentKinds[world.id][i], mobility = unitSpecs[kind].mobility;
  const squares: Cell[][] = [];
  for (let y = 0; y < world.grid.height - 1; y++) for (let x = 0; x < world.grid.width - 1; x++) {
    const square = [{x,y}, {x:x+1,y}, {x:x+1,y:y+1}, {x,y:y+1}];
    if (square.every(cell => walkable(world.grid, cell, mobility) && world.locations.every(pin => Math.abs(cell.x - pin.cell.x) + Math.abs(cell.y - pin.cell.y) > 1))) squares.push(square);
  }
  squares.sort((a,b) => Math.abs(a[0].x-location.cell.x)+Math.abs(a[0].y-location.cell.y)-Math.abs(b[0].x-location.cell.x)-Math.abs(b[0].y-location.cell.y));
  if (!squares.length) throw new Error(`${world.name} needs a scenery route for ${kind}.`);
  return { world: world.id, mission: location.id, patrols: [{ kind, waypoints: squares[0] }] };
}));

export function patrolRoute(grid: Grid, waypoints: Cell[], mobility: Mobility = 'land'): Cell[] {
  const route = [{ ...waypoints[0] }];
  for (let i = 0; i < waypoints.length; i++) {
    const leg = findPath(grid, waypoints[i], waypoints[(i + 1) % waypoints.length], new Set(), mobility);
    if (!leg) throw new Error('A world resident needs a connected patrol on its own terrain.');
    route.push(...leg);
  }
  return route.slice(0, -1);
}
