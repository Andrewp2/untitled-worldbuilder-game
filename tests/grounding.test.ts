import { describe, expect, it } from 'vitest';
import { worldDepth, type WorldObjectKind } from '../src/view/grounding';
import { pickObject } from '../src/view/picking';
import { toWorld } from '../src/core/projection';

describe('world occlusion follows the ground footprint', () => {
  it('sorts a foreground object in front across kinds, including small movement steps', () => {
    const kinds: WorldObjectKind[] = ['parts', 'prop', 'flag', 'relay', 'rover', 'enemy'];
    for (const y of [0, 80, 180.1, 320]) for (const behind of kinds) for (const front of kinds) {
      expect(worldDepth({ x: -200, y: y + .01 }, front)).toBeGreaterThan(worldDepth({ x: 200, y }, behind));
    }
  });
  it('picks the foreground object while a rover moves past a relay', () => {
    const relay = { id: 'relay', kind: 'relay' as const, cell: { x: 4, y: 4 } };
    const center = toWorld(relay.cell);
    // A fractional cell describes the rover's interpolated movement position.
    for (const offset of [-.002, .002]) {
      const rover = { id: 'rover', kind: 'rover' as const, cell: { x: 4 + offset, y: 4 } };
      expect(pickObject({ x: center.x, y: center.y - 20 }, [relay, rover])?.id).toBe(offset > 0 ? 'rover' : 'relay');
    }
  });
});
