import type { Cell } from '../core/grid';
import { toWorld } from '../core/projection';
import { worldDepth } from './grounding';

type Pickable = { id: string; cell: Cell; kind: 'rover' | 'relay' | 'enemy'; anchor?: Cell };

/** Pick the visible object in front, using the same depth order as the renderer. */
export function pickObject(point: Cell, objects: Pickable[]): Pickable | undefined {
  return objects.filter(object => {
    const p = object.anchor ?? toWorld(object.cell), x = point.x - p.x, y = point.y - p.y;
    return object.kind === 'relay'
      ? Math.abs(x) <= 34 && y >= -72 && y <= 19
      : (x / (object.kind === 'enemy' ? 40 : 37)) ** 2 + ((y + 21) / 39) ** 2 < 1;
  }).sort((a, b) => {
    const depth = (o: Pickable) => worldDepth(o.anchor ?? toWorld(o.cell), o.kind);
    return depth(b) - depth(a);
  })[0];
}
