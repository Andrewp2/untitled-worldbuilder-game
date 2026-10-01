import Phaser from 'phaser';
import { toWorld, TILE_WIDTH, TILE_HEIGHT, WATER_DROP } from '../core/projection';
import { terrainAt, isWater, type Grid } from '../core/grid';
import { BATTERY_CAPACITY, emptySupplies, materials, type Supplies } from '../core/catalog';
import { groundShadow, toyImage } from './toy-art';
import { worldDepth } from './grounding';

type Graphics = Phaser.GameObjects.Graphics;
export function polygon(g: Graphics, points: number[][], color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.fillPoints(points.map(([x, y]) => new Phaser.Math.Vector2(x, y)), true);
}
export function diamond(g: Graphics, x: number, y: number, width = TILE_WIDTH, height = TILE_HEIGHT): void {
  g.beginPath(); g.moveTo(x, y - height / 2); g.lineTo(x + width / 2, y);
  g.lineTo(x, y + height / 2); g.lineTo(x - width / 2, y); g.closePath();
}

function terrainTextures(scene: Phaser.Scene): void {
  if (scene.textures.exists('toy-ground-grass-0')) return;
  const colors = { grass: ['#a7ce58', '#a5cc56', '#a8cf59', '#a6cd57'], sand: ['#f0d493', '#efd392', '#f1d594', '#f0d392'], water: ['#48b7d3', '#49b8d4', '#48b7d3', '#49b8d4'], 'deep-water': ['#328dab', '#348fab', '#328daa', '#338eaa'], rough: ['#b8ad99', '#b7ac98', '#b9ae9a', '#b8ad99'], swamp: ['#7f9f6c', '#81a16e', '#80a06d', '#7f9f6c'] };
  for (const [name, variations] of Object.entries(colors)) variations.forEach((color, variation) => {
    const texture = scene.textures.createCanvas('toy-ground-' + name + '-' + variation, 160, 80)!;
    const c = texture.context;
    c.beginPath(); c.moveTo(80, 0); c.lineTo(160, 40); c.lineTo(80, 80); c.lineTo(0, 40); c.closePath();
    c.fillStyle = color; c.fill();
    if (name === 'rough') {
      // Low faceted stones signal an impassable rocky surface at overview scale.
      for (const [x, y] of [[60, 24], [99, 36], [63, 53]]) {
        c.fillStyle = '#918b7c'; c.beginPath(); c.moveTo(x - 8, y); c.lineTo(x, y - 4); c.lineTo(x + 8, y); c.lineTo(x, y + 4); c.closePath(); c.fill();
        c.fillStyle = '#d0c6b2'; c.beginPath(); c.moveTo(x - 8, y); c.lineTo(x, y - 5); c.lineTo(x + 5, y - 1); c.lineTo(x, y + 1); c.closePath(); c.fill();
      }
    }
    texture.refresh();
  });
}

export function drawTerrain(scene: Phaser.Scene, grid: Grid): Phaser.GameObjects.GameObject[] {
  terrainTextures(scene);
  // Paint each whole tile back to front. Separating all cliffs from all tops
  // let a rear cliff cover the next land/bridge tile in front of it.
  const ground = scene.add.container().setDepth(-1000);
  // Water is the lower foundation. Drawing it among the raised tiles covers
  // their vertical faces because the grid projection describes the top plane.
  const waterGround = scene.add.container().setDepth(-1001);
  const objects: Phaser.GameObjects.GameObject[] = [ground, waterGround];
  for (let sum = 0; sum < grid.width + grid.height - 1; sum++) for (let x = 0; x < grid.width; x++) {
    const y = sum - x;
    if (y < 0 || y >= grid.height) continue;
    const terrain = grid.tiles[y][x], p = toWorld({ x, y });
    const water = isWater(terrain), bridge = terrain === 'bridge';
    if (bridge) {
      // A bridge replaces the walkable surface, not the river beneath it.
      waterGround.add(scene.add.image(p.x, p.y + WATER_DROP, 'toy-ground-water-' + (x % 2 + y % 2 * 2)).setDisplaySize(80.25, 40.125));
      const shade = scene.add.graphics(); waterGround.add(shade);
      shade.fillStyle(0x215a77, .13); diamond(shade, p.x, p.y + WATER_DROP, 74, 37); shade.fillPath();
    }
    const layer = water ? waterGround : ground;
    const coasts = scene.add.graphics();
    layer.add(coasts);
    const top = p.y + (water ? WATER_DROP : 0);
    const height = water ? 6 : bridge ? 4 : WATER_DROP;
    const exposed = (dx: number, dy: number) => {
      const next = terrainAt(grid, { x: x + dx, y: y + dy });
      return !next || (!water && (isWater(next) || (!bridge && next === 'bridge')));
    };
    if (bridge) {
      // Posts reach the lower water plane. Only the exposed front edges need
      // supports; internal edges of a wider deck remain continuous.
      for (const [dx, dy, offset] of [[0, 1, -28], [1, 0, 28]]) if (exposed(dx, dy)) {
        const foot = p.x + offset, postTop = p.y + 6 + height, postBottom = p.y + 6 + WATER_DROP;
        polygon(coasts, [[foot-3,postTop],[foot,postTop+1.5],[foot,postBottom+1.5],[foot-3,postBottom]], 0x9e652b);
        polygon(coasts, [[foot,postTop+1.5],[foot+3,postTop],[foot+3,postBottom],[foot,postBottom+1.5]], 0x80501f);
      }
    }
    if (exposed(0, 1)) {
      polygon(coasts, [[p.x-40,top],[p.x,top+20],[p.x,top+20+height],[p.x-40,top+height]], water ? 0x0588c6 : bridge ? 0xa66323 : 0xc5a477);
      if (!water && !bridge) polygon(coasts, [[p.x-40,top],[p.x,top+20],[p.x,top+24],[p.x-40,top+4]], terrain === 'sand' ? 0xd0b273 : 0x7aa243);
    }
    if (exposed(1, 0)) {
      polygon(coasts, [[p.x,top+20],[p.x+40,top],[p.x+40,top+height],[p.x,top+20+height]], water ? 0x036da9 : bridge ? 0x80501f : 0xad8d60);
      if (!water && !bridge) polygon(coasts, [[p.x,top+20],[p.x+40,top],[p.x+40,top+4],[p.x,top+24]], terrain === 'sand' ? 0xb49a64 : 0x5e8833);
    }
    if (bridge) {
      coasts.fillStyle(0xdf9f48); diamond(coasts, p.x, top); coasts.fillPath();
      coasts.lineStyle(2, 0x9e652b);
      for (let t = -15; t <= 15; t += 10) coasts.lineBetween(p.x+t+20,top+t/2-10,p.x+t-20,top+t/2+10);
      coasts.lineStyle(2, 0xffd18b); coasts.lineBetween(p.x-34,top-2,p.x-2,top-18);
      coasts.lineBetween(p.x+2,top+18,p.x+34,top+2);
    } else {
      const name = water || terrain === 'sand' || terrain === 'rough' || terrain === 'swamp' ? terrain : 'grass';
      layer.add(scene.add.image(p.x, top, 'toy-ground-' + name + '-' + (x % 2 + y % 2 * 2)).setDisplaySize(80.25, 40.125));
    }
    if (!water) {
      const edges = scene.add.graphics();
      ground.add(edges);
      edges.lineStyle(.65, bridge ? 0x7e532b : 0x5b802e, .14); diamond(edges, p.x, top); edges.strokePath();
      edges.lineStyle(.7, 0xf0fa88, .12); edges.lineBetween(p.x-38, top-1, p.x, top-20);
    }
    if (terrain === 'tree' || terrain === 'rock') {
      const prop = scene.add.container(p.x, p.y).setDepth(worldDepth(p, 'prop'));
      objects.push(prop, groundShadow(scene, terrain === 'tree' ? 37 : 64, terrain === 'tree' ? 14 : 24).setPosition(p.x, p.y));
      const name = terrain === 'rock' ? 'rocks' : (x + y) % 2 ? 'tree-small' : 'tree';
      prop.add(toyImage(scene, name, 96));
    }
  }
  return objects;
}

export function drawParts(scene: Phaser.Scene, supplies: Supplies, cargo = false): Phaser.GameObjects.Container {
  const result = scene.add.container();
  const names = [...materials.filter(color => supplies[color] > 0), ...(supplies.batteries.length ? ['battery'] : []), ...(supplies.soil ? ['soil'] : [])];
  names.forEach((name, i) => {
    const size = cargo ? 30 : 45;
    const columns = Math.min(3, names.length);
    const picture = toyImage(scene, name, size).setPosition((i % columns - (columns - 1) / 2) * (cargo ? 11 : 19), Math.floor(i / columns) * (cargo ? 4 : 10));
    result.add(picture);
    if (name === 'battery' && Math.max(...supplies.batteries) === 0) picture.setTint(0x8491a0);
    if (name === 'battery' && !cargo) {
      const charge = Math.max(...supplies.batteries), x = picture.x, g = scene.add.graphics();
      g.fillStyle(0x092c55); g.fillRoundedRect(x-12, 3, 24, 5, 2);
      g.fillStyle(charge ? 0xc3f331 : 0xfb7e68); g.fillRoundedRect(x-11, 4, Math.max(2, 22*charge/BATTERY_CAPACITY), 3, 1);
      result.add(g);
    }
  });
  return result;
}

export function drawRelay(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const root = scene.add.container();
  root.add(toyImage(scene, 'relay', 86));
  return root;
}

export function partsBadge(scene: Phaser.Scene, supplies: Supplies): Phaser.GameObjects.Container {
  const rows = [
    ...materials.filter(color => supplies[color] > 0).map(color => ({ supplies: { ...emptySupplies(), [color]: 1 }, count: supplies[color] })),
    ...(supplies.batteries.length ? [{ supplies: { ...emptySupplies(), batteries: [Math.max(...supplies.batteries)] }, count: supplies.batteries.length }] : []),
    ...(supplies.soil ? [{ supplies: { ...emptySupplies(), soil: 1 }, count: supplies.soil }] : []),
  ];
  const badge = scene.add.container(), width = rows.length * 42;
  const background = scene.add.graphics(); background.fillStyle(0x0c3264, .94); background.fillRoundedRect(-width/2,-22,width,26,5);
  badge.add(background);
  rows.forEach((row, index) => {
    const x = -width / 2 + index * 42;
    const color = materials.find(color => row.supplies[color] > 0);
    const modelIcon = color ?? (row.supplies.batteries.length ? 'battery' : undefined);
    const picture = modelIcon ? scene.add.image(x + 13, -9, 'toy-icon-' + modelIcon).setDisplaySize(22, 17)
      : drawParts(scene, row.supplies, true).setPosition(x + 13, 1).setScale(.8);
    if (modelIcon === 'battery' && row.supplies.batteries[0] === 0) (picture as Phaser.GameObjects.Image).setTint(0x8491a0);
    const count = scene.add.text(x + 25, -18, String(row.count), {
      fontFamily:'Nunito Sans Variable, sans-serif',fontSize:'17px',color:'#ffffff',resolution:2,
    });
    badge.add([picture, count]);
  });
  return badge;
}
