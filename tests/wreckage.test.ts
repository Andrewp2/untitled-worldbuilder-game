import { describe, expect, it } from 'vitest';
import { emptySupplies, partKinds } from '../src/core/catalog';
import { wreckPieces, wreckPose } from '../src/view/wreckage';

describe('visible wreckage', () => {
  it('shows the actual salvage colors and battery state without changing supplies', () => {
    const supplies = { ...emptySupplies(), red: 2, blue: 1, batteries: [0, 63] };
    const before = structuredClone(supplies), pieces = wreckPieces(supplies);
    expect(pieces.filter(p => p.picture === 'red')).toHaveLength(2);
    expect(pieces.filter(p => p.picture === 'blue')).toHaveLength(1);
    expect(pieces.filter(p => p.picture === 'battery').map(p => p.empty)).toEqual([true, false]);
    expect(pieces).toHaveLength(5); expect(supplies).toEqual(before);
    expect(wreckPieces(emptySupplies())).toEqual([]);
  });
  it('bounds large wrecks while representing every salvaged material', () => {
    const supplies = { red: 90, blue: 90, yellow: 90, green: 90, tires: 90, soil: 90, batteries: [0, 40, 100, 100] };
    const pieces = wreckPieces(supplies);
    expect(pieces.length).toBeLessThanOrEqual(16);
    expect(new Set(pieces.map(p => p.picture))).toEqual(new Set([...partKinds, 'battery', 'soil']));
  });
  it('scatters, lands and fades within a second; a frozen clock preserves its pose', () => {
    const middle = wreckPose(0, 3, .3, false), end = wreckPose(0, 3, .85, false);
    expect(middle.lift).toBeGreaterThan(0); expect(middle.alpha).toBe(1); expect(middle.done).toBe(false);
    expect(middle).toEqual(wreckPose(0, 3, .3, false));
    expect(end.lift).toBeCloseTo(0); expect(end.alpha).toBe(0); expect(end.done).toBe(true);
    for (let i = 0; i < 16; i++) for (const t of [0, .1, .6, .85, 2]) {
      const pose = wreckPose(i, 16, t, false);
      expect(Math.abs(pose.x)).toBeLessThanOrEqual(27);
      expect(Math.abs(pose.y)).toBeLessThanOrEqual(13.5);
      expect(pose.alpha).toBeGreaterThanOrEqual(0); expect(pose.alpha).toBeLessThanOrEqual(1);
    }
  });
  it('suppresses flight and spinning with reduced motion and promptly finishes existing bursts', () => {
    expect(wreckPose(2, 5, .1, true)).toMatchObject({ x: 0, y: 0, lift: 0, rotation: 0, alpha: 0 });
    expect(wreckPose(2, 5, .25, true).done).toBe(true);
  });
});
