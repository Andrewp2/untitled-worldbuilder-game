import { partCounts, type Supplies } from '../core/catalog';
import type { Grid, Terrain } from '../core/grid';
import type { Pile, DeliveryRequirements } from '../core/simulation';
import type { Mission } from './missions';

export type AuthoredMission = Mission & { challenge: string };
const legend: Record<string, Terrain> = { '.': 'grass', ':': 'sand', '~': 'water', w: 'deep-water', '^': 'rough', s: 'swamp', T: 'tree', '#': 'rock', '=': 'bridge' };

/** Every board is written tile by tile. Helpers only parse authored content. */
export function board(rows: readonly string[], ground: 'grass' | 'sand' = 'grass'): Grid {
  const width = rows[0]?.length;
  if (!width || rows.some(row => row.length !== width || [...row].some(tile => !legend[tile]))) throw new Error('An authored board must be rectangular and use known terrain.');
  return { width, height: rows.length, tiles: rows.map(row => [...row].map(tile => tile === '.' ? ground : legend[tile])) };
}
export const stock = (red = 0, blue = 0, yellow = 0, green = 0, batteries: number[] = []): Supplies => ({ ...partCounts(red, blue, yellow, green), batteries });
export const pile = (x: number, y: number, supplies: Supplies): Pile => ({ cell: { x, y }, supplies });
export const shipment = (red = 0, blue = 0, yellow = 0, green = 0, chargedBatteries = 0): DeliveryRequirements => ({ ...partCounts(red, blue, yellow, green), chargedBatteries });
