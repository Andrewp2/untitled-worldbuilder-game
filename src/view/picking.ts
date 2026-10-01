import type { Cell } from '../core/grid';
import { toWorld } from '../core/projection';
import { worldDepth } from './grounding';

type Pickable = { id: string; cell: Cell; kind: 'rover' | 'relay' | 'enemy'; anchor?: Cell; contains: (point: Cell) => boolean };

type Picture = {
  visible: boolean;
  alpha: number;
  getLocalPoint: (x: number, y: number) => Cell;
  texture: { key: string };
  frame: { name: string | number };
  scene: { textures: { getPixelAlpha: (x: number, y: number, key: string, frame: string | number) => number | null } };
};

/** Test the displayed frame after its parent, origin, scale and animation transforms. */
export function pictureContains(point: Cell, picture: Picture): boolean {
  if (!picture.visible || picture.alpha === 0) return false;
  const local = picture.getLocalPoint(point.x, point.y);
  const alpha = picture.scene.textures.getPixelAlpha(Math.floor(local.x), Math.floor(local.y), picture.texture.key, picture.frame.name);
  return alpha !== null && alpha > 8;
}

/** Pick the visible object in front, using the same depth order as the renderer. */
export function pickObject(point: Cell, objects: Pickable[]): Pickable | undefined {
  return objects.filter(object => object.contains(point)).sort((a, b) => {
    const depth = (o: Pickable) => worldDepth(o.anchor ?? toWorld(o.cell), o.kind);
    return depth(b) - depth(a);
  })[0];
}
