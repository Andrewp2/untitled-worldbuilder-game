import Phaser from 'phaser';
import { constructionArea, key, neighbors, terrainAt, isWater, walkable, type Cell } from '../core/grid';
import { toCell, toWorld, surfacePoint, WATER_DROP } from '../core/projection';
import { BATTERY_CAPACITY, MOVE_ENERGY, blueprintNames, costTotal, describeCost, describeSupplies, recipes, load, defaultAction, supportsAction, isMobile, usesBattery, unitSpecs, type Blueprint, type UnitKind, type Supplies } from '../core/catalog';
import type { WorkAction, BlueprintStock, Goal } from '../core/simulation';
import { createMission, missions, type Mission } from '../levels/missions';
import { diamond, drawParts, drawRelay, drawTerrain, partsBadge, polygon } from './art';
import { TOY_BACKGROUND, drawStar, groundShadow, poseToy, preloadToyArt, toyActor, toyFlag, toyImage, waveFlag, type ToyActor, type ToyFlag } from './toy-art';
import { rewardPose } from './motion';
import { prepareToyModels, cargoModel, pruneCargoModels } from './toy-models';
import { facingPicture } from './facing';
import { GROUND_MARK_DEPTH, STATUS_DEPTH, worldDepth } from './grounding';
import { pickObject, pictureContains } from './picking';
import type { SoundCue } from '../audio/score';

export type Mode = 'move' | WorkAction | 'build' | 'dismantle';
export type ViewState = {
  mission: Pick<Mission, 'id' | 'name' | 'goal' | 'brief' | 'blueprints'> & { goals: Pick<Goal, 'id' | 'name' | 'cargo'>[] };
  complete: boolean;
  celebrating: boolean;
  bonus: { name: string; description: string; reached: boolean; unlocked: boolean };
  blueprints: BlueprintStock;
  selected: string | null;
  selectedRelay: { id: string; position: string } | null;
  units: { id: string; kind: UnitKind; name: string; description: string; status: string; position: string; destination: string; cargo: Supplies; carryingTree: boolean; capacity: number; stationary: boolean; battery: number; replacementCharge: number | null; order: string }[];
  visited: string[]; paused: boolean; moving: number; zoom: number; ready: boolean;
  mode: Mode; blueprint: Blueprint; context: string;
};
export type GameBridge = { state: (state: ViewState) => void; message: (text: string, error?: boolean) => void; sound: (cue: SoundCue) => void };

export class GameScene extends Phaser.Scene {
  private mission = missions[0];
  simulation = createMission(this.mission);
  private selected: string | null = this.simulation.units[0]?.id ?? null;
  private mode: Mode = 'move';
  private blueprint: Blueprint = 'relay';
  private objects: Phaser.GameObjects.GameObject[] = [];
  private terrainObjects: Phaser.GameObjects.GameObject[] = [];
  private workBeats = new Map<string, { cell: Cell; elapsed: number }>();
  private objectsSignature = '';
  private pileBadges = new Map<string, Phaser.GameObjects.Container>();
  private hover: Cell | null = null;
  private routes!: Phaser.GameObjects.Graphics;
  private water!: Phaser.GameObjects.Graphics;
  private markers!: Phaser.GameObjects.Graphics;
  private rovers = new Map<string, ToyActor>();
  private creatures = new Map<string, ToyActor>();
  private relayPictures = new Map<string, Phaser.GameObjects.Image>();
  private puffs: { cell: Cell; elapsed: number }[] = [];
  private pilePictures = new Map<string, Phaser.GameObjects.Container>();
  private flashes: { cell: Cell; until: number }[] = [];
  private paused = false;
  private ready = false;
  private accumulator = 0;
  private hudTimer = 0;
  private motionClock = 0;
  private flags: ToyFlag[] = [];
  private rewards: { picture: Phaser.GameObjects.Graphics; cell: Cell; elapsed: number }[] = [];
  private completionPending = false;
  private celebrationComplete = false;
  private bonusCelebrationComplete = false;
  private down: { x: number; y: number; scrollX: number; scrollY: number; dragged: boolean; button: number } | null = null;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private fitZoom = 1;
  private viewWidth = 0;
  private viewHeight = 0;
  private motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
  private get reducedMotion(): boolean { return this.motionPreference.matches; }

  constructor(private bridge: GameBridge) { super('island'); }

  preload(): void { preloadToyArt(this); }

  create(): void {
    prepareToyModels(this);
    this.cameras.main.setBackgroundColor(TOY_BACKGROUND);
    this.drawWorld();
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (event.repeat || (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName))) return;
      if (this.completionPending && (event.code === 'Escape' || (event.code === 'Space' && !(event.target instanceof HTMLButtonElement)))) { event.preventDefault(); this.skipCelebration(); return; }
      if (/^Digit[1-9]$/.test(event.code)) {
        const unit = this.simulation.units[Number(event.code.slice(-1)) - 1];
        if (unit) this.select(unit.id);
      }
      if (event.code === 'Space' && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault();
        const rover = this.selectedRover();
        const action = rover && defaultAction(rover.kind, rover.cargo, rover.carryingTree);
        if (action) this.setMode(action);
      }
      if (event.code === 'Escape') { if (this.mode !== 'move') this.setMode('move'); else this.select(null); }
      if (event.code === 'KeyF') this.focusSelected();
      if (event.code === 'Home') { event.preventDefault(); this.overview(); }
    });
    this.input.mouse?.disableContextMenu();
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.down = { x: p.x, y: p.y, scrollX: this.cameras.main.scrollX, scrollY: this.cameras.main.scrollY, dragged: false, button: p.button };
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.down && p.isDown) {
        const dx = p.x - this.down.x, dy = p.y - this.down.y;
        if (Math.hypot(dx, dy) > 5) this.down.dragged = true;
        if (this.down.dragged) {
          this.cameras.main.setScroll(this.down.scrollX - dx / this.cameras.main.zoom, this.down.scrollY - dy / this.cameras.main.zoom);
          this.clampCamera();
          this.game.canvas.style.cursor = 'grabbing'; this.hover = null; return;
        }
      }
      this.hover = this.targetCell(this.cameras.main.getWorldPoint(p.x, p.y));
      this.game.canvas.style.cursor = this.hitObject(this.cameras.main.getWorldPoint(p.x, p.y)) ? 'pointer' : 'crosshair';
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      const down = this.down; this.down = null; this.game.canvas.style.cursor = 'crosshair';
      if (down && !down.dragged && down.button === 0) {
        if (this.completionPending) this.skipCelebration();
        else this.clickMap(this.cameras.main.getWorldPoint(p.x, p.y));
      }
    });
    this.input.on('pointerupoutside', () => { this.down = null; });
    this.input.on('gameout', () => { this.hover = null; });
    this.input.on('wheel', (p: Phaser.Input.Pointer, _objects: unknown[], _dx: number, dy: number) => this.zoomBy(dy > 0 ? 0.9 : 1.1, { x: p.x, y: p.y }));
    this.scale.on('resize', () => this.resizeView());
    this.ready = true;
    this.initialView();
    this.emitState();
  }

  private drawWorld(): void {
    this.children.removeAll(true);
    this.objects = []; this.objectsSignature = ''; this.rovers.clear(); this.creatures.clear(); this.pileBadges.clear(); this.flashes = []; this.puffs = []; this.pilePictures.clear(); this.flags = []; this.rewards = [];
    this.workBeats.clear();
    this.terrainObjects = drawTerrain(this, this.simulation.grid, 'bounded');
    this.water = this.add.graphics().setDepth(-1000.5);
    this.routes = this.add.graphics().setDepth(GROUND_MARK_DEPTH);
    this.markers = this.add.graphics().setDepth(STATUS_DEPTH);
    for (const pad of this.mission.goals) {
      const p = this.point(pad.cell), g = this.add.graphics({ x: p.x, y: p.y }).setDepth(-850);
      g.fillStyle(0xffec86, .32); diamond(g, 0, 0, 65, 32); g.fillPath();
      g.lineStyle(2, 0xffe061); diamond(g, 0, 0, 58, 29); g.strokePath();
      groundShadow(this, 20, 8).setPosition(p.x - 17, p.y);
      const flag = toyFlag(this, 66);
      flag.root.setPosition(p.x - 17, p.y).setDepth(worldDepth(p, 'flag'));
      this.flags.push(flag);
      this.add.text(p.x, p.y + 25, pad.name, {
        fontFamily: 'Nunito Sans Variable, sans-serif', fontSize: '16px', color: '#ffffff',
        backgroundColor: '#103c70', padding: { x: 7, y: 3 }, resolution: 2,
      }).setOrigin(.5, 0).setDepth(STATUS_DEPTH);
    }
    this.syncObjects();
  }
  private complete(): boolean { return this.simulation.mainComplete; }

  private selectedRover() { return this.simulation.units.find(u => u.id === this.selected); }
  private selectedRelay() { return this.simulation.relays.find(r => r.id === this.selected); }
  private point(cell: Cell): Cell { return surfacePoint(this.simulation.grid, cell); }
  private hitObject(p: Cell) {
    return pickObject(p, [
      ...this.simulation.units.map(u => ({ id: u.id, kind: 'rover' as const, cell: this.simulation.position(u), anchor: this.point(this.simulation.position(u)), contains: (point: Cell) => pictureContains(point, this.rovers.get(u.id)!.body) })),
      ...this.simulation.relays.map(r => ({ id: r.id, kind: 'relay' as const, cell: r.cell, contains: (point: Cell) => pictureContains(point, this.relayPictures.get(r.id)!) })),
      ...this.simulation.enemies.map(enemy => ({ id: enemy.id, kind: 'enemy' as const, cell: this.simulation.position(enemy), anchor: this.point(this.simulation.position(enemy)), contains: (point: Cell) => pictureContains(point, this.creatures.get(enemy.id)!.body) })),
    ]);
  }
  private targetCell(p: Cell): Cell {
    const object = this.hitObject(p);
    if (object?.kind === 'rover') return this.simulation.unit(object.id).cell;
    if (object?.kind === 'relay') return object.cell;
    if (object?.kind === 'enemy') return this.simulation.enemies.find(enemy => enemy.id === object.id)!.cell;
    const pile = this.simulation.piles.find(r => {
      const w = this.point(r.cell); return Math.hypot(p.x - w.x, p.y - (w.y - 10)) < 23;
    });
    const plan = this.simulation.visibleBlueprints.find(plan => { const at = this.point(plan.cell); return Math.hypot(p.x - at.x, (p.y - at.y) * 2) < 28; });
    if (plan) return plan.cell;
    const lower = toCell({ x: p.x, y: p.y - WATER_DROP });
    return pile?.cell ?? (isWater(terrainAt(this.simulation.grid, lower)) ? lower : toCell(p));
  }
  private clickMap(p: Cell): void {
    const object = this.hitObject(p);
    const cell = this.targetCell(p);
    if (this.mode === 'build') {
      const result = this.simulation.build(this.blueprint, cell);
      if (!result.ok) { this.bridge.message(result.reason, true); return; }
      const name = blueprintNames[this.blueprint];
      if (this.blueprint !== 'relay') this.selected = result.id!;
      this.mode = 'move';
      this.bridge.sound('build');
      this.bridge.message(`${name} built.${this.blueprint !== 'relay' && usesBattery(this.blueprint) && this.simulation.unit(result.id!).battery === 0 ? ' Empty battery—replace it before moving.' : ''}`);
      this.puff(cell); this.syncObjects(); this.emitState(); return;
    }
    if (this.mode === 'dismantle') {
      const id = object?.id ?? this.simulation.relayAt(cell)?.id;
      if (!id) { this.bridge.message('Choose a relay or stopped rover.', true); return; }
      this.takeApart(id); return;
    }
    if (this.mode === 'pickup' || this.mode === 'drop') {
      if (!this.selectedRover() || !this.selected) return;
      const action = this.mode;
      const result = this.simulation.orderCargo(this.selected, action, cell);
      if (!result.ok) { this.bridge.message(result.reason, true); return; }
      const rover = this.simulation.unit(this.selected);
      this.mode = 'move';
      this.bridge.sound(result.queued ? 'order' : action);
      this.bridge.message(result.queued
        ? `${rover.name} heading to ${action === 'pickup' ? 'pick up' : 'drop off'} at ${cell.x + 1}, ${cell.y + 1}.`
        : action === 'pickup'
        ? `${rover.name} loaded: ${describeSupplies(rover.cargo)}.`
        : `${rover.name} dropped off its cargo.`);
      this.syncObjects(); this.emitState(); return;
    }
    if (this.mode === 'dig' || this.mode === 'fill') {
      if (!this.selectedRover() || !this.selected) return;
      const action = this.mode, result = this.simulation.orderTerrain(this.selected, action, cell);
      if (!result.ok) { this.bridge.message(result.reason, true); return; }
      this.mode = 'move';
      if (result.queued) { this.bridge.sound('order'); this.bridge.message(`Scoop heading to ${action} at ${cell.x + 1}, ${cell.y + 1}.`); }
      this.syncObjects(); this.emitState(); return;
    }
    if (this.mode === 'push' || this.mode === 'uproot' || this.mode === 'plant') {
      if (!this.selectedRover() || !this.selected) return;
      const action = this.mode, result = this.simulation.orderObstacle(this.selected, action, cell);
      if (!result.ok) { this.bridge.message(result.reason, true); return; }
      this.mode = 'move';
      if (result.queued) { this.bridge.sound('order'); this.bridge.message(`${this.selectedRover()!.name} heading to ${action}.`); }
      this.syncObjects(); this.emitState(); return;
    }
    if (object?.kind === 'enemy') {
      const selected = this.selectedRover();
      this.bridge.message(selected && !selected.damage ? `${selected.name} is unarmed. Use ${this.mission.blueprints.patrolboat ? 'Patrol boat' : 'Warden'} beside the creature to fight.` : 'Move beside the creature to fight automatically.'); return;
    }
    if (object) { this.select(object.id); return; }
    const relay = this.simulation.relayAt(cell);
    if (relay) { this.select(relay.id); return; }
    if (!this.selectedRover() || !this.selected) { this.bridge.message('Select a rover first.', true); return; }
    const result = this.simulation.move(this.selected, cell);
    if (!result.ok) {
      const reasons = {
        energy: 'Battery empty. Drop a charged battery nearby, then choose Replace battery.',
        occupied: 'That tile is in use. Choose clear ground.',
        unreachable: 'No route there. Choose another destination.',
        terrain: isMobile(this.selectedRover()!.kind) ? 'This unit cannot enter that terrain. Check its information for terrain access.' : 'This structure stays where it was built.',
      };
      this.bridge.message(reasons[result.reason], true);
    } else this.bridge.sound('order');
    this.emitState();
  }
  setMode(mode: Mode, blueprint?: Blueprint): void {
    if (!this.ready) return;
    if (mode !== 'move' && mode !== 'build' && mode !== 'dismantle' && (!this.selectedRover() || !supportsAction(this.selectedRover()!.kind, mode))) return;
    this.mode = mode;
    if (blueprint) this.blueprint = blueprint;
    if (mode === 'build' && !this.simulation.blueprints[this.blueprint]) { this.mode = 'move'; return; }
    this.emitState();
  }
  replaceSelectedBattery(): void {
    const rover = this.selectedRover();
    if (!this.ready || !rover) return;
    const result = this.simulation.replaceBattery(rover.id);
    if (result.ok) this.bridge.sound('battery');
    this.bridge.message(result.ok ? `${rover.name}: battery replaced. Old battery returned to the ground.` : result.reason, !result.ok);
    this.syncObjects(); this.emitState();
  }
  dismantleSelected(): void { if (this.selected) this.takeApart(this.selected); }
  private takeApart(id: string): void {
    const cell = this.simulation.units.find(unit => unit.id === id)?.cell ?? this.simulation.relays.find(relay => relay.id === id)?.cell;
    const result = this.simulation.dismantle(id);
    if (!result.ok) { this.bridge.message(result.reason, true); return; }
    if (this.selected === id) this.selected = this.simulation.units[0]?.id ?? null;
    this.mode = 'move';
    if (cell) this.puff(cell);
    this.bridge.sound('dismantle');
    this.bridge.message('Taken apart. All parts and cargo returned to the ground.');
    this.syncObjects(); this.emitState();
  }
  private buildContext(cell: Cell): string {
    const p = this.simulation.buildPreview(this.blueprint, cell);
    const battery = p.batteryCharge === null ? '' : p.batteryCharge === 0 ? ' Battery empty—cannot move.' : ` Battery: ${p.batteryCharge}/${BATTERY_CAPACITY}.`;
    return `Nearby: ${describeSupplies(p.available)}. ${p.ok ? 'Ready to build.' + battery : costTotal(p.missing) ? `Missing: ${describeCost(p.missing)}.` : p.reason}`;
  }
  private context(): string {
    if (!this.hover) return this.mode === 'build' ? 'Point at a tile to check available parts.' : '';
    if (this.mode === 'build') return this.buildContext(this.hover);
    if ((this.mode === 'dig' || this.mode === 'fill') && this.selectedRover()) {
      const preview = this.simulation.terrainOrderPreview(this.selected!, this.mode, this.hover);
      return preview.ok ? this.mode === 'dig' ? 'Dig land · collect 1 dirt' : 'Fill water · use 1 dirt' : preview.reason;
    }
    if ((this.mode === 'push' || this.mode === 'uproot' || this.mode === 'plant') && this.selectedRover()) {
      const preview = this.simulation.obstacleOrderPreview(this.selected!, this.mode, this.hover);
      return preview.ok ? this.mode === 'push' ? 'Push one tile away · keep the tile beyond clear' : this.mode === 'uproot' ? 'Lift this tree' : 'Plant this tree' : preview.reason;
    }
    if (this.simulation.bonusUnlocked && key(this.hover) === key(this.mission.bonus.cell)) return `${this.mission.bonus.name} · ${this.simulation.bonusReached ? 'Bonus star earned' : this.mission.bonus.description}`;
    const plan = this.simulation.visibleBlueprints.find(plan => key(plan.cell) === key(this.hover!));
    if (plan) return `${blueprintNames[plan.blueprint]} blueprint · move a creature here to collect`;
    if (this.simulation.relayAt(this.hover)) return `Signal relay · take apart for ${describeCost(recipes.relay)}`;
    const enemy = this.simulation.enemies.find(enemy => key(enemy.cell) === key(this.hover!));
    if (enemy) return `${enemy.name} · ${enemy.health}/${enemy.maxHealth} health${enemy.kind === 'crab' ? ' · cannot cross rough ground' : ''}`;
    const terrain = terrainAt(this.simulation.grid, this.hover), selected = this.selectedRover();
    if (selected && (terrain === 'rough' || isWater(terrain))) return `${terrain === 'rough' ? 'Rough ground' : terrain === 'deep-water' ? 'Deep water' : 'Shallow water'} · ${selected.name} ${walkable(this.simulation.grid, this.hover, unitSpecs[selected.kind].mobility) ? 'can cross' : 'cannot cross'}`;
    return '';
  }
  private syncObjects(): void {
    const signature = JSON.stringify({ piles: this.simulation.piles, plans: this.simulation.visibleBlueprints, trees: this.simulation.looseTrees, relays: this.simulation.relays, units: this.simulation.units.map(u => [u.id, u.cargo, u.carryingTree]), enemies: this.simulation.enemies.map(enemy => enemy.id) });
    if (signature === this.objectsSignature) return;
    this.objectsSignature = signature;
    for (const object of this.objects) object.destroy();
    for (const [id, rover] of this.rovers) if (!this.simulation.units.some(unit => unit.id === id)) {
      rover.root.destroy(); this.rovers.delete(id);
    }
    for (const [id, creature] of this.creatures) if (!this.simulation.enemies.some(enemy => enemy.id === id)) {
      creature.root.destroy(); this.creatures.delete(id);
    }
    this.objects = []; this.pileBadges.clear(); this.pilePictures.clear(); this.relayPictures.clear();
    for (const pile of this.simulation.piles) {
      const p = this.point(pile.cell);
      this.objects.push(groundShadow(this, 52, 18).setPosition(p.x, p.y));
      const picture = drawParts(this, pile.supplies).setPosition(p.x, p.y).setDepth(worldDepth(p, 'parts'));
      this.pilePictures.set(key(pile.cell), picture); this.objects.push(picture);
      const badge = partsBadge(this, pile.supplies).setPosition(p.x, p.y - 33).setDepth(STATUS_DEPTH).setVisible(false);
      this.pileBadges.set(key(pile.cell), badge);
      this.objects.push(badge);
    }
    for (const plan of this.simulation.visibleBlueprints) {
      const p = this.point(plan.cell), paper = this.add.container(p.x, p.y).setDepth(worldDepth(p, 'parts'));
      const drawing = this.add.graphics();
      drawing.fillStyle(0x297ab3); diamond(drawing, 0, 0, 54, 27); drawing.fillPath();
      drawing.lineStyle(1.5, 0xe1f6ff); diamond(drawing, 0, 0, 50, 25); drawing.strokePath();
      drawing.lineStyle(.65, 0xe1f6ff, .55);
      for (const d of [-1, 1]) { drawing.lineBetween(-17, d * 4, 8, d * 9); drawing.lineBetween(17, d * 4, -8, d * 9); }
      paper.add(drawing);
      if (plan.blueprint !== 'relay') paper.add(toyImage(this, plan.blueprint + '-se', 38).setPosition(0, 4));
      this.objects.push(paper);
    }
    for (const cell of this.simulation.looseTrees) {
      const p = this.point(cell);
      this.objects.push(toyImage(this, 'tree-small', 55).setPosition(p.x, p.y).setDepth(worldDepth(p, 'parts')));
    }
    for (const relay of this.simulation.relays) {
      const p = this.point(relay.cell);
      this.objects.push(groundShadow(this, 46, 18).setPosition(p.x, p.y));
      const picture = drawRelay(this).setPosition(p.x, p.y).setDepth(worldDepth(p, 'relay'));
      this.relayPictures.set(relay.id, picture.getAt<Phaser.GameObjects.Image>(0));
      this.objects.push(picture);
    }
    for (const u of this.simulation.units) {
      if (!this.rovers.has(u.id)) this.rovers.set(u.id, toyActor(this, u.kind));
      this.rovers.get(u.id)!.picture = cargoModel(this, u.kind, u.cargo, u.carryingTree);
      this.rovers.get(u.id)!.body.setTexture('toy-' + this.rovers.get(u.id)!.picture + '-' + facingPicture(u.facing));
    }
    pruneCargoModels(this, new Set([...this.rovers.values()].map(actor => actor.picture!)));
    for (const enemy of this.simulation.enemies) if (!this.creatures.has(enemy.id)) this.creatures.set(enemy.id, toyActor(this, enemy.kind));
  }
  select(id: string | null): void {
    if (!this.ready) return;
    if (id) this.bridge.sound('select');
    this.selected = id; this.mode = 'move';
    this.emitState();
  }
  stopSelected(): void {
    if (!this.ready || !this.selectedRover() || !this.selected) return;
    this.simulation.stop(this.selected);
    this.bridge.message(`${this.simulation.unit(this.selected).name} stopping after this step.`);
    this.emitState();
  }
  togglePause(): void {
    if (!this.ready) return;
    this.setPaused(!this.paused);
  }
  setPaused(paused: boolean): void {
    if (!this.ready || this.paused === paused) return;
    this.paused = paused;
    this.emitState();
  }
  resumeExploration(): void { this.completionPending = false; }
  private skipCelebration(): void {
    for (const reward of this.rewards) reward.picture.destroy();
    this.rewards = []; this.celebrationComplete = true;
    this.bonusCelebrationComplete = this.simulation.bonusReached;
    this.emitState();
  }
  resetLevel(): void {
    this.loadMission(this.mission.id);
  }
  loadMission(id: string): void {
    const mission = missions.find(mission => mission.id === id);
    if (!mission) return;
    this.mission = mission; this.simulation = createMission(mission);
    this.selected = this.simulation.units.find(unit => unit.kind === 'hauler')?.id ?? this.simulation.units[0]?.id ?? null;
    this.mode = 'move'; this.blueprint = 'relay'; this.paused = false; this.accumulator = 0; this.hover = null; this.down = null;
    this.completionPending = false; this.celebrationComplete = false; this.bonusCelebrationComplete = false; this.motionClock = 0;
    if (!this.ready) return;
    this.drawWorld(); this.initialView(); this.bridge.message(`${mission.name}. ${mission.goal}.`); this.emitState();
  }
  focusSelected(): void {
    if (!this.ready || !this.selected) return;
    this.hover = null;
    const rover = this.selectedRover(), relay = this.selectedRelay();
    if (!rover && !relay) return;
    const p = this.point(rover ? this.simulation.position(rover) : relay!.cell);
    this.cameras.main.centerOn(p.x, p.y); this.clampCamera();
  }
  private calculateFit(): void {
    this.cameras.main.setSize(this.scale.width, this.scale.height);
    this.viewWidth = this.scale.width; this.viewHeight = this.scale.height;
    const size = this.simulation.grid.width + this.simulation.grid.height;
    this.fitZoom = Math.min(this.scale.width / (size * 40 + 120), this.scale.height / (size * 20 + 150), 1.1);
  }
  private initialView(): void {
    this.overview();
    if (this.scale.width < 700 && this.fitZoom < 0.55) {
      // Keep units large enough to select on narrow screens; Overview still fits the full board.
      this.cameras.main.setZoom(0.65).centerOn(-160, 260);
      this.emitState();
    }
  }
  overview(): void {
    if (!this.ready) return;
    this.hover = null;
    this.calculateFit();
    this.cameras.main.setZoom(this.fitZoom);
    const { width, height } = this.simulation.grid;
    this.cameras.main.centerOn((width - height) * 20, (width + height - 2) * 10); this.emitState();
  }
  private resizeView(): void {
    if (!this.ready) return;
    this.hover = null;
    const camera = this.cameras.main;
    const center = { x: camera.scrollX + this.viewWidth / 2, y: camera.scrollY + this.viewHeight / 2 };
    const old = this.fitZoom; this.calculateFit();
    camera.setZoom(Phaser.Math.Clamp(camera.zoom * this.fitZoom / old, this.fitZoom * 0.75, 2)).centerOn(center.x, center.y);
    this.clampCamera(); this.emitState();
  }
  zoomBy(factor: number, anchor?: Cell): void {
    if (!this.ready) return;
    this.hover = null;
    const camera = this.cameras.main;
    const point = anchor ?? { x: this.scale.width / 2, y: this.scale.height / 2 };
    const before = camera.getWorldPoint(point.x, point.y);
    camera.setZoom(Phaser.Math.Clamp(camera.zoom * factor, this.fitZoom * 0.75, 2));
    // preRender refreshes the camera transform before mapping the anchor again.
    camera.preRender();
    const after = camera.getWorldPoint(point.x, point.y);
    camera.scrollX += before.x - after.x; camera.scrollY += before.y - after.y;
    this.clampCamera(); this.emitState();
  }
  private clampCamera(): void {
    const c = this.cameras.main;
    // Bound the camera center, allowing a margin around the island at every zoom.
    const { width, height } = this.simulation.grid;
    c.scrollX = Phaser.Math.Clamp(c.scrollX, -height * 40 - 90 - c.width / 2, width * 40 + 90 - c.width / 2);
    c.scrollY = Phaser.Math.Clamp(c.scrollY, -100 - c.height / 2, (width + height) * 20 + 100 - c.height / 2);
  }
  private emitState(): void {
    const relay = this.selectedRelay();
    this.bridge.state({
      mission: { id: this.mission.id, name: this.mission.name, goal: this.mission.goal, brief: this.mission.brief, goals: this.mission.goals.map(({ id, name, cargo }) => ({ id, name, cargo })), blueprints: this.mission.blueprints },
      complete: this.complete(),
      celebrating: this.simulation.bonusReached ? !this.bonusCelebrationComplete : this.complete() && !this.celebrationComplete,
      bonus: { name: this.mission.bonus.name, description: this.mission.bonus.description, reached: this.simulation.bonusReached, unlocked: this.simulation.bonusUnlocked },
      blueprints: { ...this.simulation.blueprints },
      selectedRelay: relay ? { id: relay.id, position: `${relay.cell.x + 1}, ${relay.cell.y + 1}` } : null,
      ready: this.ready, selected: this.selected, paused: this.paused, zoom: Math.round(this.cameras.main.zoom * 100), visited: [...this.simulation.reached],
      moving: this.completionPending ? 0 : this.simulation.units.filter(u => u.next !== null).length,
      mode: this.mode, blueprint: this.blueprint, context: this.context(),
      units: this.simulation.units.map(u => ({ id: u.id, kind: u.kind, name: u.name, description: u.description, cargo: { ...u.cargo }, carryingTree: u.carryingTree, capacity: u.capacity, battery: u.battery, replacementCharge: this.simulation.replacementCharge(u.id), order: u.pending ? `${({ pickup: 'Pick up', drop: 'Drop off', dig: 'Dig', fill: 'Fill', push: 'Push', uproot: 'Uproot', plant: 'Plant' })[u.pending.action]} at ${u.pending.target.x + 1}, ${u.pending.target.y + 1}` : u.goal ? `Move to ${u.goal.x + 1}, ${u.goal.y + 1}` : 'None', stationary: !u.next && !u.goal && !u.pending, status: u.damage && u.battery && this.simulation.enemies.some(enemy => { const a = this.simulation.position(u), b = this.simulation.position(enemy); return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= 1.05; }) ? 'fighting' : u.status, position: `${u.cell.x + 1}, ${u.cell.y + 1}`, destination: u.goal ? `${u.goal.x + 1}, ${u.goal.y + 1}` : '' })),
    });
  }
  update(time: number, delta: number): void {
    if (!this.ready) return;
    const dt = Math.min(delta / 1000, 0.1);
    const c = this.cameras.main;
    const horizontal = Number(this.keys.D.isDown || this.keys.RIGHT.isDown) - Number(this.keys.A.isDown || this.keys.LEFT.isDown);
    const vertical = Number(this.keys.S.isDown || this.keys.DOWN.isDown) - Number(this.keys.W.isDown || this.keys.UP.isDown);
    if (horizontal || vertical) { c.scrollX += horizontal * dt * 520 / c.zoom; c.scrollY += vertical * dt * 520 / c.zoom; this.clampCamera(); this.hover = null; }
    if (!this.paused && !this.completionPending) {
      if (!this.reducedMotion) this.motionClock += dt;
      this.accumulator += dt;
      while (this.accumulator >= 1 / 60) { this.simulation.step(1 / 60); this.accumulator -= 1 / 60; }
    }
    const events = this.simulation.drainEvents();
    if (events.length) {
      this.syncObjects();
      for (const event of events) {
        if (event.kind === 'goal-reached') {
          const complete = event.complete;
          const goal = this.mission.goals.find(goal => goal.id === event.goalId)!;
          this.startReward(goal.cell);
          if (complete) this.completionPending = true;
          this.bridge.sound(complete ? 'complete' : 'signal');
          this.bridge.message(complete ? 'Mission complete. Bonus objective unlocked!' : event.text);
          continue;
        }
        if (event.kind === 'bonus-reached') {
          this.completionPending = true;
          this.startReward(event.cell); this.bridge.sound('complete'); this.bridge.message(event.text); continue;
        }
        if (event.kind === 'hit' || event.kind === 'destroyed') {
          if (event.kind === 'destroyed') this.puff(event.cell);
          else this.flashes.push({ cell: event.cell, until: time + 220 });
          this.flashes = this.flashes.slice(-16);
          this.bridge.sound(event.kind === 'hit' ? 'hit' : 'wreck');
          if (event.kind === 'hit') continue;
        }
        if (event.kind === 'blueprint-found') { this.bridge.sound('signal'); this.bridge.message(`${blueprintNames[event.blueprint]} blueprint found.`); continue; }
        if (event.kind === 'recharge') { this.workBeats.set(event.targetId, { cell: event.cell, elapsed: 0 }); continue; }
        if (event.kind === 'cargo' && !event.error) this.bridge.sound(event.action);
        if ((event.kind === 'terrain' || event.kind === 'obstacle') && !event.error) {
          this.workBeats.set(event.unitId, { cell: event.cell, elapsed: 0 });
          this.bridge.sound(event.action === 'dig' || event.action === 'uproot' ? 'pickup' : 'drop');
        }
        this.bridge.message(event.text, event.error);
      }
      if (events.some(event => (event.kind === 'terrain' || event.kind === 'obstacle') && !event.error)) {
        for (const object of this.terrainObjects) object.destroy();
        this.terrainObjects = drawTerrain(this, this.simulation.grid, 'bounded');
      }
    }
    if (this.selected && !this.selectedRover() && !this.selectedRelay()) { this.selected = this.simulation.units[0]?.id ?? null; this.mode = 'move'; }
    for (const u of this.simulation.units) {
      const p = this.point(this.simulation.position(u));
      const sprite = this.rovers.get(u.id)!;
      poseToy(sprite, p, u.facing, !!u.next, usesBattery(u.kind) ? u.battery : u.integrity, u.progress, this.reducedMotion);
      const beat = this.workBeats.get(u.id);
      const dip = beat && !this.reducedMotion ? Math.sin(Math.PI * beat.elapsed / .4) * 3 : 0;
      sprite.body.y += dip;
    }
    for (const [id, beat] of this.workBeats) {
      if (!this.paused && !this.completionPending) beat.elapsed += dt;
      if (beat.elapsed >= .4) this.workBeats.delete(id);
    }
    for (const enemy of this.simulation.enemies) {
      const p = this.point(this.simulation.position(enemy)), sprite = this.creatures.get(enemy.id)!;
      poseToy(sprite, p, enemy.facing, !!enemy.next, enemy.health, enemy.progress, this.reducedMotion);
    }
    for (const [index, flag] of this.flags.entries()) waveFlag(flag, this.motionClock + index, this.reducedMotion);
    this.updateRewards(!this.paused || this.completionPending ? dt : 0);
    if (!this.paused) for (const puff of this.puffs) puff.elapsed += dt;
    this.puffs = this.puffs.filter(puff => puff.elapsed < (this.reducedMotion ? .25 : .7));
    this.drawOverlays(time);
    this.hudTimer += delta;
    // Publish earned progress in the same frame as its reward. Leaving during
    // the star beat must not race the campaign's save behind the HUD throttle.
    const progressChanged = events.some(event => event.kind === 'goal-reached' || event.kind === 'bonus-reached');
    if (progressChanged || this.hudTimer >= 100) { this.hudTimer = 0; this.emitState(); }
  }

  private puff(cell: Cell): void {
    this.puffs.push({ cell: { ...cell }, elapsed: 0 });
    this.puffs = this.puffs.slice(-16);
  }

  private startReward(cell: Cell): void {
    const picture = this.add.graphics().setDepth(STATUS_DEPTH + 1);
    drawStar(picture, 0, 0, 21);
    picture.lineStyle(2, 0xfff2b8, .9); picture.lineBetween(-7, -7, -2, -12);
    this.rewards.push({ picture, cell: { ...cell }, elapsed: 0 });
  }
  private updateRewards(dt: number): void {
    for (let i = this.rewards.length - 1; i >= 0; i--) {
      const reward = this.rewards[i]; reward.elapsed += dt;
      const pose = rewardPose(reward.elapsed, this.reducedMotion), p = this.point(reward.cell);
      reward.picture.setPosition(p.x, p.y - 38 - pose.rise).setAlpha(pose.alpha).setScale(pose.scale);
      if (pose.done) { reward.picture.destroy(); this.rewards.splice(i, 1); }
    }
    if (this.completionPending && !this.rewards.length) {
      this.celebrationComplete = true;
      this.bonusCelebrationComplete = this.simulation.bonusReached;
    }
  }

  private drawOverlays(time: number): void {
    const phase = this.motionClock;
    const hovered = this.hover ? key(this.hover) : null;
    for (const [cell, badge] of this.pileBadges) badge.setVisible(cell === hovered);
    this.water.clear();
    for (let y = 0; y < this.simulation.grid.height; y++) for (let x = 0; x < this.simulation.grid.width; x++) {
      const terrain = this.simulation.grid.tiles[y][x];
      if ((!isWater(terrain) && terrain !== 'bridge') || (x * 7 + y * 3) % 13 !== 0) continue;
      const p = toWorld({ x, y }); const offset = Math.sin(phase + x + y) * 3;
      this.water.lineStyle(1, 0xc5faff, 0.18);
      this.water.lineBetween(p.x - 10 + offset, p.y + WATER_DROP, p.x + 5 + offset, p.y + WATER_DROP);
    }
    this.routes.clear(); this.markers.clear();
    if (this.simulation.bonusUnlocked) {
    const bonusPoint = this.point(this.mission.bonus.cell);
    this.routes.fillStyle(0xffd455, .2); diamond(this.routes, bonusPoint.x, bonusPoint.y, 62, 31); this.routes.fillPath();
    this.routes.lineStyle(2, this.simulation.bonusReached ? 0xc5f331 : 0xffdc59);
    diamond(this.routes, bonusPoint.x, bonusPoint.y, 62, 31); this.routes.strokePath();
    drawStar(this.routes, bonusPoint.x, bonusPoint.y, 12, this.simulation.bonusReached ? 0xc5f331 : 0xffdc59);
    }
    const selectedRelay = this.selectedRelay();
    if (selectedRelay) {
      const p = this.point(selectedRelay.cell);
      this.routes.lineStyle(3, 0xe7ceff); diamond(this.routes, p.x, p.y, 74, 37); this.routes.strokePath();
      polygon(this.markers, [[p.x - 6, p.y - 78], [p.x + 6, p.y - 78], [p.x, p.y - 69]], 0xe7ceff);
    }
    for (const u of this.simulation.units) {
      const selected = u.id === this.selected;
      const nodes = [this.simulation.position(u), ...(u.next ? [u.next] : []), ...u.route];
      if (u.goal) {
        this.routes.lineStyle(selected ? 3 : 2, u.color, selected ? 0.85 : 0.45);
        this.routes.beginPath();
        nodes.forEach((n, i) => { const p = this.point(n); if (i) this.routes.lineTo(p.x, p.y); else this.routes.moveTo(p.x, p.y); });
        this.routes.strokePath();
        for (const n of nodes.slice(1)) { const p = this.point(n); this.routes.fillStyle(u.color, selected ? 0.95 : 0.5); this.routes.fillCircle(p.x, p.y, 3); }
        const end = this.point(u.goal);
        this.routes.lineStyle(2, u.color); diamond(this.routes, end.x, end.y, 48, 24); this.routes.strokePath();
      }
      if (u.pending) {
        const p = this.point(u.pending.target);
        this.routes.lineStyle(2, u.color); diamond(this.routes, p.x, p.y, 62, 31); this.routes.strokePath();
        const direction = u.pending.action === 'drop' || u.pending.action === 'fill' ? 1 : -1;
        this.routes.lineBetween(p.x, p.y - 9 * direction, p.x, p.y + 6 * direction);
        this.routes.lineBetween(p.x, p.y + 6 * direction, p.x - 5, p.y + direction);
        this.routes.lineBetween(p.x, p.y + 6 * direction, p.x + 5, p.y + direction);
      }
      if (usesBattery(u.kind) && (selected || u.battery === 0 || (this.mission.enemies.length && (u.damage || u.battery < BATTERY_CAPACITY)))) {
        const p = this.point(this.simulation.position(u));
        this.markers.fillStyle(0x0b2e55); this.markers.fillRoundedRect(p.x - 20, p.y - 64, 40, 7, 2);
        this.markers.fillStyle(u.battery > 25 ? 0xc5f331 : 0xff8364);
        this.markers.fillRoundedRect(p.x - 19, p.y - 63, 38 * u.battery / BATTERY_CAPACITY, 5, 1);
        if (u.battery === 0) { this.markers.lineStyle(1, 0xff8364); this.markers.strokeRoundedRect(p.x - 20, p.y - 64, 40, 7, 2); }
      }
      if (selected) {
        const p = this.point(this.simulation.position(u));
        this.routes.lineStyle(4, 0x082f50, 0.9); this.routes.strokeEllipse(p.x, p.y + 3, 74, 34);
        this.routes.lineStyle(2.5, 0xffe064); this.routes.strokeEllipse(p.x, p.y + 1, 72, 32);
        const bob = this.reducedMotion ? 0 : Math.sin(phase * 3) * 2;
        const arrowY = p.y - 78 + bob;
        polygon(this.markers, [[p.x - 6, arrowY], [p.x + 6, arrowY], [p.x, arrowY + 8]], 0xffe064);
      }
    }
    for (const enemy of this.simulation.enemies) {
      const p = this.point(this.simulation.position(enemy));
      this.markers.fillStyle(0x392e49); this.markers.fillRoundedRect(p.x-20,p.y-61,40,7,2);
      this.markers.fillStyle(0xff947b); this.markers.fillRoundedRect(p.x-19,p.y-60,38*enemy.health/enemy.maxHealth,5,1);
      if (enemy.target) { this.markers.fillStyle(0xffe45b); this.markers.fillRoundedRect(p.x-2,p.y-78,4,8,1); this.markers.fillCircle(p.x,p.y-66,2); }
    }
    for (const beacon of this.mission.goals) {
      const p = this.point(beacon.cell); const visited = this.simulation.reached.has(beacon.id);
      this.routes.lineStyle(2, visited ? 0x9ef0ce : 0xffe9ad, 0.9);
      diamond(this.routes, p.x, p.y, 66, 33); this.routes.strokePath();
      if (visited) {
        this.routes.lineStyle(3, 0xe5ffd4);
        this.routes.beginPath(); this.routes.moveTo(p.x - 6, p.y); this.routes.lineTo(p.x - 1, p.y + 5); this.routes.lineTo(p.x + 8, p.y - 6); this.routes.strokePath();
      }
    }
    if (this.selectedRover() && this.selected && this.mode !== 'move' && this.mode !== 'build' && this.mode !== 'dismantle') {
      const u = this.simulation.unit(this.selected);
      for (const target of neighbors(u.cell)) {
        if (!terrainAt(this.simulation.grid, target)) continue;
        const valid = !(this.mode === 'dig' || this.mode === 'fill' ? this.simulation.terrainProblem(u.id, this.mode, target) : this.mode === 'pickup' || this.mode === 'drop' ? this.simulation.cargoProblem(u.id, this.mode, target) : this.simulation.obstacleProblem(u.id, this.mode, target));
        const p = this.point(target);
        this.routes.lineStyle(2, valid ? 0xbff8bb : 0xf0a899, .95);
        diamond(this.routes, p.x, p.y, 60, 30); this.routes.strokePath();
        if (!valid) { this.routes.lineBetween(p.x-5,p.y-3,p.x+5,p.y+3); this.routes.lineBetween(p.x-5,p.y+3,p.x+5,p.y-3); }
      }
    }
    if (this.mode === 'build' && this.hover) {
      for (const target of constructionArea(this.hover).slice(1)) {
        if (!terrainAt(this.simulation.grid, target)) continue;
        const p = this.point(target);
        this.routes.lineStyle(1.5, 0xe9edc0, .65); diamond(this.routes, p.x, p.y); this.routes.strokePath();
      }
    }
    if (this.hover && terrainAt(this.simulation.grid, this.hover)) {
      const p = this.point(this.hover);
      const legal = this.mode === 'build' ? this.simulation.buildPreview(this.blueprint, this.hover).ok
        : this.mode === 'dismantle' ? !!this.simulation.relayAt(this.hover) || this.simulation.units.some(u => key(u.cell) === key(this.hover!) && !u.next && !u.goal)
        : (this.mode === 'pickup' || this.mode === 'drop') && this.selected ? this.simulation.cargoOrderPreview(this.selected, this.mode, this.hover).ok
        : (this.mode === 'dig' || this.mode === 'fill') && this.selected ? this.simulation.terrainOrderPreview(this.selected, this.mode, this.hover).ok
        : (this.mode === 'push' || this.mode === 'uproot' || this.mode === 'plant') && this.selected ? this.simulation.obstacleOrderPreview(this.selected, this.mode, this.hover).ok
        : (this.selectedRover()?.battery ?? 0) >= MOVE_ENERGY && !!this.selected && !!this.simulation.preview(this.selected, this.hover);
      this.routes.fillStyle(legal ? 0xf8efd1 : 0xdf8373, 0.18); diamond(this.routes, p.x, p.y); this.routes.fillPath();
      this.routes.lineStyle(2, legal ? 0xf8efd1 : 0xf4a293, 0.9); diamond(this.routes, p.x, p.y); this.routes.strokePath();
      if (!legal) { this.routes.lineBetween(p.x - 6, p.y - 4, p.x + 6, p.y + 4); this.routes.lineBetween(p.x - 6, p.y + 4, p.x + 6, p.y - 4); }
    }
    for (const beat of this.workBeats.values()) {
      if (this.reducedMotion) continue;
      const p = this.point(beat.cell), progress = beat.elapsed / .4;
      this.markers.fillStyle(0xe5b471, 1 - progress);
      for (let i = 0; i < 3; i++) this.markers.fillCircle(p.x + (i - 1) * (8 + progress * 10), p.y - 4 - Math.sin(progress * Math.PI) * (12 + i * 3), 2.5 * (1 - progress));
    }
    for (const [cell, picture] of this.pilePictures) {
      const puff = this.puffs.find(puff => key(puff.cell) === cell);
      picture.setAlpha(puff ? Math.min(1, puff.elapsed / .35) : 1);
    }
    for (const puff of this.puffs) {
      const p = this.point(puff.cell), t = puff.elapsed / (this.reducedMotion ? .25 : .7);
      for (let i = 0; i < 7; i++) {
        const angle = i * Math.PI * 2 / 7;
        const spread = this.reducedMotion ? 13 : 8 + 21 * (1 - Math.pow(1 - t, 3));
        this.markers.fillStyle(i % 2 ? 0xe6e4d2 : 0xb7c6c6, (1 - t) * .85);
        this.markers.fillCircle(p.x + Math.cos(angle) * spread, p.y - 14 + Math.sin(angle) * spread * .6 - (this.reducedMotion ? 0 : t * 19), (this.reducedMotion ? 10 : 9 + t * 10));
      }
    }
    this.flashes = this.flashes.filter(flash => flash.until > time);
    for (const flash of this.flashes) {
      const p = this.point(flash.cell), duration = 220;
      const progress = this.reducedMotion ? .4 : 1 - (flash.until - time) / duration;
      const radius = 8 + progress * 18;
      this.markers.lineStyle(2, 0xffe7b0, 1-progress);
      this.markers.strokeCircle(p.x,p.y-12,radius);
      for (let ray = 0; ray < 4; ray++) {
        const angle = ray*Math.PI/2 + .4;
        this.markers.lineBetween(p.x+Math.cos(angle)*(radius-4),p.y-12+Math.sin(angle)*(radius-4),p.x+Math.cos(angle)*(radius+4),p.y-12+Math.sin(angle)*(radius+4));
      }
    }
  }
}
