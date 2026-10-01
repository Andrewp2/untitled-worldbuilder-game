import { describe, expect, it } from 'vitest';
import { toWorld } from '../src/core/projection';
import { pickObject, pictureContains } from '../src/view/picking';

// Small source alpha masks model a body and a narrow upright station. The
// world transform includes the planted origin, current size and animated pose.
function picture(anchor: { x: number; y: number }, opaque: (x: number, y: number) => number) {
  const pose = { scale: 1, angle: 0, lift: 0 };
  const image = {
    visible: true, alpha: 1, texture: { key: 'body' }, frame: { name: 'se' },
    getLocalPoint(x: number, y: number) {
      const dx = x - anchor.x, dy = y - anchor.y + pose.lift;
      return { x: 48 + (dx * Math.cos(pose.angle) + dy * Math.sin(pose.angle)) / pose.scale,
        y: 70 + (-dx * Math.sin(pose.angle) + dy * Math.cos(pose.angle)) / pose.scale };
    },
    scene: { textures: { getPixelAlpha(x: number, y: number, key: string, frame: string | number) {
      if (x < 0 || y < 0 || x >= 96 || y >= 96) return null;
      // Switching heading must sample the displayed frame, not an earlier one.
      return key === 'body' && frame === 'se' ? opaque(x, y) : 0;
    } } },
  };
  return { image, pose, contains: (point: { x: number; y: number }) => pictureContains(point, image) };
}

const haulerCell = { x: 13, y: 1 }, stationCell = { x: 14, y: 2 };
const stationAnchor = toWorld(stationCell);
const body = picture(toWorld(haulerCell), (x, y) => x >= 26 && x <= 70 && y >= 40 && y <= 75 ? 255 : 0);
const station = picture(stationAnchor, (x, y) => x >= 40 && x <= 55 && y >= 26 && y <= 74 ? 255 : 0);
const hauler = { id: 'hauler', kind: 'rover' as const, cell: haulerCell, contains: body.contains };
const charger = { id: 'station', kind: 'rover' as const, cell: stationCell, contains: station.contains };

describe('selecting visible map objects', () => {
  it('selects the hauler through the transparent top of a foreground charging station', () => {
    const point = { x: stationAnchor.x, y: stationAnchor.y - 52 };
    expect(pickObject(point, [hauler, charger])?.id).toBe('hauler');
    expect(pickObject(point, [charger, hauler])?.id).toBe('hauler');
  });
  it('selects the foreground station where its visible pixels cover the hauler', () => {
    const point = { x: stationAnchor.x, y: stationAnchor.y - 42 };
    expect(pickObject(point, [hauler, charger])?.id).toBe('station');
    expect(pickObject(point, [charger, hauler])?.id).toBe('station');
  });
  it('does not turn transparent padding or empty ground into a selectable object', () => {
    for (const point of [{ x: stationAnchor.x + 33, y: stationAnchor.y - 30 }, { x: stationAnchor.x, y: stationAnchor.y + 30 }]) {
      expect(pickObject(point, [hauler, charger])).toBeUndefined();
    }
  });
  it('samples the current picture after scale, rotation and hopping transforms', () => {
    const source = picture({ x: 100, y: 200 }, (x, y) => x === 50 && y === 60 ? 255 : 0);
    source.pose.scale = .5; source.pose.angle = Math.PI / 2; source.pose.lift = 6;
    expect(source.contains({ x: 105, y: 195 })).toBe(true);
    expect(source.contains({ x: 101, y: 195 })).toBe(false);
    source.image.frame.name = 'nw';
    expect(source.contains({ x: 105, y: 195 })).toBe(false);
  });
  it('ignores nearly transparent edges and hidden pictures', () => {
    for (const alpha of [0, 8, 9, 255]) {
      const source = picture({ x: 0, y: 0 }, () => alpha);
      expect(source.contains({ x: 0, y: 0 })).toBe(alpha > 8);
      source.image.visible = false;
      expect(source.contains({ x: 0, y: 0 })).toBe(false);
      source.image.visible = true; source.image.alpha = 0;
      expect(source.contains({ x: 0, y: 0 })).toBe(false);
    }
  });
});
