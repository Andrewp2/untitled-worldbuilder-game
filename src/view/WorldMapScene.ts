import Phaser from 'phaser';
import { findPath, type Cell } from '../core/grid';
import { toWorld, surfacePoint, WATER_DROP } from '../core/projection';
import { worlds } from '../levels/world-map';
import type { WorldId } from '../levels/missions';
import { drawTerrain } from './art';
import { unitSpecs } from '../core/catalog';
import { TOY_BACKGROUND, poseToy, preloadToyArt, toyActor, type ToyActor } from './toy-art';
import { patrolRoute, residentHomes } from './world-residents';
import { prepareToyModels } from './toy-models';

export type MapPoint = { id: string; x: number; y: number };

export class WorldMapScene extends Phaser.Scene {
  private water!: Phaser.GameObjects.Graphics;
  private trail!: Phaser.GameObjects.Graphics;
  private world = worlds[0];
  private terrain: Phaser.GameObjects.GameObject[] = [];
  private ready = false;
  private motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  private get reducedMotion(): boolean { return this.motionPreference.matches; }
  private clock = 0;
  private completed = new Set<string>();
  private populated = new Set<string>();
  private residents: { mission: string; actor: ToyActor; route: Cell[]; phase: number }[] = [];
  constructor(private onLocations: (points: MapPoint[]) => void) { super('world'); }
  preload(): void { preloadToyArt(this); }
  create(): void {
    prepareToyModels(this);
    this.cameras.main.setBackgroundColor(TOY_BACKGROUND);
    this.water = this.add.graphics().setDepth(-1000.5);
    this.trail = this.add.graphics().setDepth(-850);
    this.ready = true;
    this.renderWorld();
    this.scale.on('resize', this.fit, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.ready = false; this.terrain = []; this.populated.clear(); this.residents = []; this.scale.off('resize', this.fit, this); });
    this.events.on(Phaser.Scenes.Events.WAKE, this.fit, this);
    this.fit();
  }
  setWorld(id: WorldId): void {
    if (this.world.id === id) return;
    this.world = worlds.find(world => world.id === id)!;
    if (this.ready) { this.renderWorld(); this.fit(); }
  }
  private renderWorld(): void {
    for (const object of this.terrain) object.destroy();
    for (const resident of this.residents) resident.actor.root.destroy();
    this.residents = []; this.populated.clear(); this.water.clear();
    this.terrain = drawTerrain(this, this.world.grid);
    this.drawTrail(); this.syncResidents();
  }
  setProgress(completed: ReadonlySet<string>): void {
    this.completed = new Set(completed);
    if (this.ready) { this.syncResidents(); this.drawTrail(); }
  }
  private drawTrail(): void {
    this.trail.clear();
    const { grid, locations } = this.world;
    let unlocked = worlds.slice(0, worlds.indexOf(this.world)).every(world => world.locations.every(pin => this.completed.has(pin.id)));
    for (const [index, location] of locations.slice(1).entries()) {
      unlocked &&= this.completed.has(locations[index].id);
      for (const cell of findPath(grid, locations[index].cell, location.cell) ?? []) {
        const p = toWorld(cell);
        this.trail.fillStyle(unlocked ? 0xffe16a : 0x245b65, unlocked ? .9 : .35); this.trail.fillCircle(p.x, p.y, 3);
      }
    }
  }
  private syncResidents(): void {
    this.residents = this.residents.filter(resident => {
      if (this.completed.has(resident.mission)) return true;
      resident.actor.root.destroy(); return false;
    });
    for (const id of this.populated) if (!this.completed.has(id)) this.populated.delete(id);
    for (const home of residentHomes) {
      if (home.world !== this.world.id || !this.completed.has(home.mission) || this.populated.has(home.mission)) continue;
      this.populated.add(home.mission);
      for (const patrol of home.patrols) this.residents.push({ mission: home.mission, actor: toyActor(this, patrol.kind, patrol.kind === 'scout' ? 58 : 64), route: patrolRoute(this.world.grid, patrol.waypoints, unitSpecs[patrol.kind].mobility), phase: this.residents.length * 1.7 });
    }
  }
  fit(): void {
    if (!this.ready) return;
    const { grid, locations } = this.world;
    const width = (grid.width + grid.height) * 40, height = (grid.width + grid.height) * 20;
    const center = { x: (grid.width - grid.height) * 20, y: (grid.width + grid.height - 2) * 10 };
    const zoom = Math.min(this.scale.width / (width + 160), this.scale.height / (height + 100), 1.1);
    // Sleeping scenes can retain the previous host's camera size until the next frame.
    // Size it before centering so the native pins and the canvas use the same viewport.
    this.cameras.main.setSize(this.scale.width, this.scale.height).setZoom(zoom).centerOn(center.x, center.y);
    this.onLocations(locations.map(location => {
      const p = toWorld(location.cell);
      return { id: location.id, x: this.scale.width / 2 + (p.x - center.x) * zoom, y: this.scale.height / 2 + (p.y - center.y) * zoom };
    }));
  }
  update(_time: number, delta: number): void {
    if (!this.ready) return;
    if (!this.reducedMotion && !document.hidden) this.clock += Math.min(delta / 1000, .1);
    const phase = this.clock;
    for (const resident of this.residents) {
      const step = this.reducedMotion ? resident.phase : phase * .65 + resident.phase;
      const index = Math.floor(step) % resident.route.length, progress = this.reducedMotion ? 0 : step % 1;
      const from = resident.route[index], to = resident.route[(index + 1) % resident.route.length];
      const position = surfacePoint(this.world.grid, { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress });
      poseToy(resident.actor, position, { x: to.x - from.x, y: to.y - from.y }, !this.reducedMotion, 100, progress, this.reducedMotion);
    }
    this.water.clear();
    for (let y = 0; y < this.world.grid.height; y++) for (let x = 0; x < this.world.grid.width; x++) {
      const terrain = this.world.grid.tiles[y][x];
      if ((terrain !== 'water' && terrain !== 'deep-water' && terrain !== 'bridge') || (x * 7 + y * 3) % 13 !== 0) continue;
      const p = toWorld({ x, y }), offset = Math.sin(phase + x + y) * 3;
      this.water.lineStyle(1, 0xc5faff, .22);
      this.water.lineBetween(p.x - 10 + offset, p.y + WATER_DROP, p.x + 5 + offset, p.y + WATER_DROP);
    }
  }
}
