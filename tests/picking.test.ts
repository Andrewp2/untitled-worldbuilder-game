import { describe, expect, it } from 'vitest';
import { toWorld } from '../src/core/projection';
import { pickObject } from '../src/view/picking';

const relay = { id: 'relay', kind: 'relay' as const, cell: { x: 1, y: 1 } };
const at = (x: number, y: number) => { const p = toWorld(relay.cell); return { x: p.x + x, y: p.y + y }; };

describe('selecting visible map objects', () => {
  it('selects the taller toy rover from its antenna and either side of its body', () => {
    const rover = { id: 'scout', kind: 'rover' as const, cell: relay.cell };
    for (const [x, y] of [[0, -55], [31, -20], [-31, -20], [0, 8]]) {
      expect(pickObject(at(x, y), [rover])?.id).toBe('scout');
    }
    for (const [x, y] of [[50, -20], [0, -75], [0, 35]]) {
      expect(pickObject(at(x, y), [rover])).toBeUndefined();
    }
  });
  it('picks the whole relay from antenna to base, including the previously missed top', () => {
    for (const [x, y] of [[0, -58], [-21, -50], [0, -26], [0, 0], [0, 17]]) {
      expect(pickObject(at(x, y), [relay])?.id).toBe('relay');
    }
    expect(pickObject(at(60, 0), [relay])).toBeUndefined();
  });
  it('lets the visible relay win when its mast overlaps a rover behind it', () => {
    const rover = { id: 'rover', kind: 'rover' as const, cell: { x: 0, y: 0 } };
    // This overlap is common when a rover delivers parts, then a relay is built beside it.
    expect(pickObject(at(0, -45), [rover, relay])?.id).toBe('relay');
    expect(pickObject(at(0, -45), [relay, rover])?.id).toBe('relay');
  });
  it('keeps the rover selectable when it is drawn in front of a relay', () => {
    const rover = { id: 'rover', kind: 'rover' as const, cell: { x: 2, y: 1 } };
    expect(pickObject(at(21, -7), [relay, rover])?.id).toBe('rover');
  });
});
