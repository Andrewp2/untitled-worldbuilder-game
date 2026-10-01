import { findPath, type Cell, type Mobility } from '../core/grid';
import { worldMap } from '../levels/world-map';

/** Residents are earned scenery; their routes never enter mission simulations. */
export const residentHomes = [
  { mission: 'hollow-reach', patrols: [
    { kind: 'scout' as const, waypoints: [{ x: 5, y: 7 }, { x: 7, y: 7 }, { x: 7, y: 6 }, { x: 5, y: 6 }] },
    { kind: 'hauler' as const, waypoints: [{ x: 6, y: 11 }, { x: 8, y: 11 }, { x: 8, y: 12 }, { x: 6, y: 12 }] },
  ] },
  { mission: 'bramble-crossing', patrols: [
    { kind: 'scout' as const, waypoints: [{ x: 16, y: 12 }, { x: 17, y: 12 }, { x: 17, y: 13 }, { x: 16, y: 13 }] },
    { kind: 'hauler' as const, waypoints: [{ x: 12, y: 3 }, { x: 14, y: 3 }, { x: 14, y: 2 }, { x: 12, y: 2 }] },
  ] },
  { mission: 'siltwater-reach', patrols: [
    { kind: 'scoop' as const, waypoints: [{ x: 7, y: 9 }, { x: 8, y: 9 }, { x: 8, y: 8 }, { x: 7, y: 8 }] },
    { kind: 'scout' as const, waypoints: [{ x: 8, y: 13 }, { x: 9, y: 13 }, { x: 9, y: 12 }, { x: 8, y: 12 }] },
  ] },
  { mission: 'rough-ridge', patrols: [
    { kind: 'trailbuggy' as const, waypoints: [{ x: 7, y: 2 }, { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 7, y: 3 }] },
    { kind: 'snail' as const, waypoints: [{ x: 6, y: 5 }, { x: 7, y: 5 }, { x: 7, y: 6 }, { x: 6, y: 6 }] },
  ] },
  { mission: 'woodland-workshop', patrols: [
    { kind: 'arborbot' as const, waypoints: [{ x: 3, y: 7 }, { x: 4, y: 7 }, { x: 4, y: 6 }, { x: 3, y: 6 }] },
    { kind: 'dumptruck' as const, waypoints: [{ x: 14, y: 10 }, { x: 15, y: 10 }, { x: 15, y: 11 }, { x: 14, y: 11 }] },
  ] },
  { mission: 'tidepool-trail', patrols: [
    { kind: 'frog' as const, waypoints: [{ x: 13, y: 5 }, { x: 13, y: 6 }, { x: 12, y: 6 }, { x: 12, y: 5 }] },
    { kind: 'duck' as const, waypoints: [{ x: 7, y: 10 }, { x: 8, y: 10 }, { x: 8, y: 11 }, { x: 7, y: 11 }] },
  ] },
  { mission: 'harbor-run', patrols: [
    { kind: 'tug' as const, waypoints: [{ x: 0, y: 3 }, { x: 0, y: 5 }, { x: 0, y: 6 }, { x: 0, y: 4 }] },
    { kind: 'freighter' as const, waypoints: [{ x: 19, y: 9 }, { x: 19, y: 10 }, { x: 19, y: 12 }, { x: 19, y: 11 }] },
  ] },
  { mission: 'ancient-valley', patrols: [
    { kind: 'mender' as const, waypoints: [{ x: 13, y: 12 }, { x: 14, y: 12 }, { x: 14, y: 13 }, { x: 13, y: 13 }] },
  ] },
];

export function patrolRoute(waypoints: Cell[], mobility: Mobility = 'land'): Cell[] {
  const route = [{ ...waypoints[0] }];
  for (let i = 0; i < waypoints.length; i++) {
    const leg = findPath(worldMap, waypoints[i], waypoints[(i + 1) % waypoints.length], new Set(), mobility);
    if (!leg) throw new Error('A world resident needs a connected patrol on its own terrain.');
    route.push(...leg);
  }
  return route.slice(0, -1);
}
