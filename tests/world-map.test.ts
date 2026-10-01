import { describe, expect, it } from 'vitest';
import { adjacent, key, walkable } from '../src/core/grid';
import { toWorld } from '../src/core/projection';
import { worlds } from '../src/levels/world-map';
import { residentHomes, patrolRoute } from '../src/view/world-residents';
import { unitSpecs } from '../src/core/catalog';
import { backdropLayout } from '../src/view/world-backdrop';

describe('authored world journeys', () => {
  it('joins successive mission pins on valid terrain, including the sea lanes', () => {
    for (const world of worlds) {
      expect(world.trails).toHaveLength(world.locations.length - 1);
      world.trails.forEach((trail, index) => {
        expect(trail[0]).toEqual(world.locations[index].cell);
        expect(trail.at(-1)).toEqual(world.locations[index + 1].cell);
        trail.forEach((cell, step) => {
          expect(walkable(world.grid, cell, world.trailMobility), `${world.name}: ${key(cell)}`).toBe(true);
          if (step) expect(adjacent(trail[step - 1], cell)).toBe(true);
        });
      });
    }
    const sea = worlds.find(world => world.id === 'open-sea')!;
    expect(sea.trails.some(trail => trail.some(cell => ['water', 'deep-water'].includes(sea.grid.tiles[cell.y][cell.x])))).toBe(true);
  });

  it.each([[700, 900], [885, 901], [1280, 720], [1920, 1080]])('keeps mission hit areas distinct and on screen at %i×%i', (width, height) => {
    for (const world of worlds) {
      const { grid } = world, span = grid.width + grid.height;
      const zoom = Math.min(width / (span * 40 + 160), height / (span * 20 + 100), 1.1);
      const center = { x: (grid.width - grid.height) * 20, y: (span - 2) * 10 };
      const pins = world.locations.map(location => {
        const p = toWorld(location.cell);
        return { id: location.id, x: width / 2 + (p.x - center.x) * zoom, y: height / 2 + (p.y - center.y) * zoom };
      });
      for (const [index, pin] of pins.entries()) {
        expect(pin.x - 21, pin.id).toBeGreaterThanOrEqual(0);
        expect(pin.x + 21, pin.id).toBeLessThanOrEqual(width);
        expect(pin.y - 54, pin.id).toBeGreaterThanOrEqual(0);
        expect(pin.y + 5, pin.id).toBeLessThanOrEqual(height);
        for (const other of pins.slice(index + 1)) {
          // The 42×48px buttons include the marker; allow its 4px idle bob too.
          expect(Math.abs(pin.x - other.x) >= 46 || Math.abs(pin.y - other.y) >= 56, `${world.name}: ${pin.id} / ${other.id}`).toBe(true);
        }
      }
    }
  });

  it('gives earned residents separate patrols that leave every mission marker clear', () => {
    for (const world of worlds) {
      const occupied = new Set<string>();
      for (const home of residentHomes.filter(home => home.world === world.id)) {
        for (const patrol of home.patrols) {
          const route = patrolRoute(world.grid, patrol.waypoints, unitSpecs[patrol.kind].mobility);
          for (const cell of route) {
            expect(occupied.has(key(cell)), `${world.name}: shared resident tile ${key(cell)}`).toBe(false);
            occupied.add(key(cell));
            expect(world.locations.every(pin => Math.abs(cell.x - pin.cell.x) + Math.abs(cell.y - pin.cell.y) > 1)).toBe(true);
          }
        }
      }
    }
  });

  it.each([[700, 900], [885, 901], [1280, 720], [1920, 1080]])('fills the view with ocean and keeps distant shores outside the map at %i×%i', (width, height) => {
    for (const world of worlds) {
      const span = world.grid.width + world.grid.height;
      const zoom = Math.min(width / (span * 40 + 160), height / (span * 20 + 100), 1.1);
      const center = { x: (world.grid.width - world.grid.height) * 20, y: (span - 2) * 10 };
      const { bounds, islets } = backdropLayout(world.id, { width, height, zoom, center });
      expect(bounds.x).toBeLessThan(center.x - width / zoom / 2);
      expect(bounds.y).toBeLessThan(center.y - height / zoom / 2);
      expect(bounds.x + bounds.width).toBeGreaterThan(center.x + width / zoom / 2);
      expect(bounds.y + bounds.height).toBeGreaterThan(center.y + height / zoom / 2);
      for (const islet of islets) {
        for (let y = 0; y < islet.grid.height; y++) for (let x = 0; x < islet.grid.width; x++) {
          if (['water', 'deep-water'].includes(islet.grid.tiles[y][x])) continue;
          const tile = toWorld({ x, y });
          for (const [dx, dy] of [[0,-20],[40,0],[0,20],[-40,0]]) {
            const px = islet.x + (tile.x + dx) * islet.scale, py = islet.y + (tile.y + dy) * islet.scale;
            const cell = { x: px / 80 + py / 40, y: py / 40 - px / 80 };
            expect(cell.x < -.5 || cell.y < -.5 || cell.x > world.grid.width - .5 || cell.y > world.grid.height - .5, `${world.name}: scenery covers the mission landscape`).toBe(true);
          }
        }
      }
    }
  });

  it('rejects empty or invalid viewports before creating the sea pattern', () => {
    const view = { width: 885, height: 901, zoom: .4, center: { x: 40, y: 480 } };
    for (const invalid of [{ width: 0 }, { height: 0 }, { zoom: 0 }, { zoom: Infinity }]) {
      expect(() => backdropLayout('meadow-isles', { ...view, ...invalid })).toThrow(RangeError);
    }
  });
});
