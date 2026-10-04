import { movementDestination, type Cell, type Grid } from '../core/grid';
import type { RoutePower, Simulation, WorkAction } from '../core/simulation';

export type OrderPreview = { route: Cell[]; goal: Cell; power: RoutePower; action?: WorkAction };

/** Use the same route/working position as the eventual click, without issuing it. */
export function previewOrder(simulation: Simulation, id: string, mode: 'move' | WorkAction, target: Cell): OrderPreview | null {
  if (mode === 'move') {
    const route = simulation.preview(id, target);
    return route && { route, goal: movementDestination(simulation.grid, target), power: simulation.routePower(id, route) };
  }
  const preview = mode === 'pickup' || mode === 'drop' ? simulation.cargoOrderPreview(id, mode, target)
    : mode === 'dig' || mode === 'fill' ? simulation.terrainOrderPreview(id, mode, target)
      : simulation.obstacleOrderPreview(id, mode, target);
  return preview.ok ? { ...preview.approach, power: simulation.routePower(id, preview.approach.route, mode), action: mode } : null;
}

/** Physical trail segments only. Never draw a walking line across a whirlpool jump.
 * Index -1 is the in-flight step, whose energy has already been spent. */
export function routeSegments(grid: Grid, position: Cell, next: Cell | null, route: readonly Cell[]) {
  let from = position;
  return [...(next ? [next] : []), ...route].map((entry, index) => {
    const segment = { from, to: entry, step: index - (next ? 1 : 0) };
    from = movementDestination(grid, entry);
    return segment;
  });
}
