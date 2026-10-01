import { describe, expect, it } from 'vitest';
import { surfacePoint, toWorld, WATER_DROP } from '../src/core/projection';
import { pickObject } from '../src/view/picking';
import type { Grid } from '../src/core/grid';

const grid: Grid = { width: 3, height: 2, tiles: [['grass', 'water', 'deep-water'], ['sand', 'water', 'bridge']] };
describe('physical water surface', () => {
  it('keeps land and bridges at the top plane, and both water depths at the lower plane', () => {
    for (let y = 0; y < 2; y++) for (let x = 0; x < 3; x++) {
      const p = toWorld({x,y}), surface = surfacePoint(grid,{x,y});
      expect(surface.x).toBe(p.x);
      expect(surface.y - p.y).toBe(grid.tiles[y][x] === 'water' || grid.tiles[y][x] === 'deep-water' ? WATER_DROP : 0);
    }
  });
  it('interpolates ground contact continuously across a shoreline in either direction', () => {
    for (const t of [0, .25, .5, .75, 1]) {
      const cell = { x:t, y:0 }, p = toWorld(cell);
      expect(surfacePoint(grid,cell).y - p.y).toBeCloseTo(t * WATER_DROP);
      const back = {x:1-t,y:0}, reversed = toWorld(back);
      expect(surfacePoint(grid,back).y - reversed.y).toBeCloseTo((1-t) * WATER_DROP);
    }
  });
  it('orders overlapping boat pictures by their rendered water-surface anchors', () => {
    const cell = { x:1,y:0 }, anchor = surfacePoint(grid,cell);
    expect(pickObject(anchor,[{id:'back',kind:'rover',cell,anchor:{x:anchor.x,y:anchor.y-5},contains: () => true},{id:'front',kind:'rover',cell,anchor,contains: () => true}])?.id).toBe('front');
  });
});
