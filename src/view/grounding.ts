import type { Cell } from '../core/grid';
import { isModelPicture, MODEL_ORIGIN } from './toy-models';

export const GROUND_SHADOW_DEPTH = -870;
export const GROUND_MARK_DEPTH = -800;
export const STATUS_DEPTH = 2000;
export type WorldObjectKind = 'parts' | 'prop' | 'flag' | 'relay' | 'rover' | 'enemy';

// These are the centers of the support footprints in the 384px pictures, not
// their lowest alpha pixel (338). Front wheels/feet extend in front of a center.
const footprints: Record<string, [number, number]> = {
  flag: [192, 322], relay: [192, 310],
  connector: [192, 310],
};
export function groundOrigin(name: string): Cell {
  if (isModelPicture(name)) return { x: MODEL_ORIGIN.x / 384, y: MODEL_ORIGIN.y / 384 };
  const family = name.replace(/-(se|sw|nw|ne)$/, '');
  const [x, y] = footprints[family];
  return { x: x / 384, y: y / 384 };
}

/** The footprint owns occlusion; a tiny tie-break never substitutes for position. */
export function worldDepth(position: Cell, kind: WorldObjectKind): number {
  const tie = { parts: 0, prop: 1, flag: 1, relay: 2, rover: 3, enemy: 3 };
  return position.y + tie[kind] / 10000;
}
