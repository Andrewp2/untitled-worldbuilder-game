import type { Cell } from '../core/grid';

export const directions = ['se', 'sw', 'nw', 'ne'] as const;
type Direction = typeof directions[number];

/** Grid motion projected onto the two isometric axes. */
export function facingDirection(facing: Cell): Direction {
  return facing.x > 0 ? 'se' : facing.y > 0 ? 'sw' : facing.x < 0 ? 'nw' : 'ne';
}

/** The exported atlas labels its two rear views in the opposite order. */
export function facingPicture(facing: Cell): Direction {
  const direction = facingDirection(facing);
  return direction === 'nw' ? 'ne' : direction === 'ne' ? 'nw' : direction;
}
