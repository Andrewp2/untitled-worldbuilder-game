import type { Simulation } from '../../src/core/simulation';
import { build, clearEnemies, defeat, go, refuel, work } from './campaign-play';

/** Open both routes with ordinary orders while the coastal battle keeps running. */
export function openThreeTides(s: Simulation): void {
  const guard = build(s, 'warden', { x: 21, y: 2 });
  // Clear shore first while patrols hold their starting channels.
  defeat(s, guard, 'final-gator'); go(s, guard, { x: 21, y: 4 });
  work(s, 'arborbot', 'uproot', { x: 10, y: 7 }); work(s, 'arborbot', 'plant', { x: 8, y: 6 });
  go(s, 'arborbot', { x: 6, y: 6 }); go(s, 'dozer', { x: 10, y: 9 });
  work(s, 'dozer', 'push', { x: 10, y: 8 }); work(s, 'dozer', 'push', { x: 10, y: 7 }); go(s, 'dozer', { x: 7, y: 9 });
  work(s, 'scoop', 'dig', { x: 10, y: 7 }); work(s, 'scoop', 'fill', { x: 13, y: 16 });
  work(s, 'scoop', 'dig', { x: 10, y: 8 }); work(s, 'scoop', 'fill', { x: 14, y: 16 }); go(s, 'scoop', { x: 9, y: 15 });
  go(s, 'patrol-a', { x: 10, y: 10 }); refuel(s, 'patrol-a');
  if(!s.units.some(u=>u.kind==='marina'&&u.cell.x===17&&u.cell.y===11)) build(s,'marina',{x:17,y:11});
  go(s, 'patrol-b', { x: 16, y: 11 }); refuel(s, 'patrol-b');
  clearEnemies(s, ['patrol-a', 'patrol-b']); go(s,'patrol-b',{x:16,y:13});
}
