import { adjacent, canEnter, movementDestination, validateWhirlpools, constructionArea, findPath, key, neighbors, sameCell, terrainAt, walkable, type Cell, type Grid, type Terrain } from './grid';
import { attackEnergy, BATTERY_CAPACITY, MOVE_ENERGY, TRANSFER_ENERGY, TERRAIN_ENERGY, cloneSupplies, costTotal, emptyCost, emptySupplies, load, partKinds, recipes, recipeSupplies, supportsCargo, supportsAction, isMobile, usesBattery, unitSpecs, enemySpecs, unitDefinition, type Blueprint, type Cost, type Supplies, type PartCounts, type UnitDefinition, type UnitKind, type EnemyKind } from './catalog';

export type CargoAction = 'pickup' | 'drop';
export type TerrainAction = 'dig' | 'fill';
export type ObstacleAction = 'push' | 'uproot' | 'plant';
export type WorkAction = CargoAction | TerrainAction | ObstacleAction;
export type WorkOrder = { action: WorkAction; target: Cell };
export type Unit = UnitDefinition & {
  cell: Cell; next: Cell | null; progress: number; route: Cell[]; goal: Cell | null;
  facing: Cell; status: 'idle' | 'moving' | 'waiting' | 'depleted';
  cargo: Supplies; pending: WorkOrder | null;
  carryingTree: boolean; integrity: number; attackCooldown: number; supportCooldown: number;
};
export const ENEMY_NOTICE_SECONDS = .45;
export type EnemyDefinition = { id: string; kind: EnemyKind; name: string; start: Cell; speed: number; maxHealth: number; damage: number; attackInterval: number; detectionRange: number; loseRange: number; patrolRadius: number; patrol?: readonly Cell[] };
export type Enemy = EnemyDefinition & { cell: Cell; next: Cell | null; progress: number; facing: Cell; health: number; target: string | null; status: 'wandering' | 'alerting' | 'chasing' | 'attacking'; decisionTimer: number; attackCooldown: number; alertRemaining: number; patrolIndex: number };
export type OrderResult = { ok: true } | { ok: false; reason: 'terrain' | 'occupied' | 'unreachable' | 'energy' };
export type ActionResult = { ok: true; id?: string; queued?: boolean } | { ok: false; reason: string };
export type Pile = { cell: Cell; supplies: Supplies };
export type Relay = { id: string; cell: Cell };
export type CargoRequirements = PartCounts & { chargedBatteries: number };
export type Goal = { id: string; name: string; cell: Cell; kinds?: readonly UnitKind[]; unitId?: string; clearEnemies?: boolean; cargo?: CargoRequirements };
export type ArrivalObjective = { kind: 'arrival'; name: string; description: string; cell: Cell; unitId?: string; kinds?: readonly UnitKind[]; carryingTree?: boolean; minimumCharge?: number; clearEnemies?: boolean };
export type BonusObjective = ArrivalObjective;
export type BlueprintPickup = { cell: Cell; blueprint: Blueprint; afterMain?: boolean };
export type BlueprintStock = Partial<Record<Blueprint, number>>;
export type BuildPreview = { ok: boolean; problem: 'blueprints' | 'terrain' | 'occupied' | 'tree' | 'parts' | null; reason: string; available: Supplies; missing: Cost; batteryCharge: number | null };
export type RoutePower = { required: number; affordableSteps: number; lastReachable: Cell; canFinish: boolean };
export type SimulationEvent = { unitId: string; text: string; error: boolean } &
  ({ kind: 'whirlpool'; cell: Cell; destination: Cell } | { kind: 'cargo'; action: CargoAction } | { kind: 'terrain'; action: TerrainAction; cell: Cell } |
    { kind: 'obstacle'; action: ObstacleAction; cell: Cell; destination?: Cell } |
    { kind: 'recharge'; targetId: string; cell: Cell; charge: number } | { kind: 'battery-empty' } |
    { kind: 'goal-reached'; goalId: string; complete: boolean } |
    { kind: 'bonus-reached'; cell: Cell } |
    { kind: 'blueprint-found'; blueprint: Blueprint; cell: Cell } |
    { kind: 'enemy-alert'; targetId: string; cell: Cell } |
    { kind: 'hit'; attackerId: string; targetId: string; cell: Cell; damage: number } |
    { kind: 'destroyed'; faction: 'friendly' | 'enemy'; cell: Cell; position: Cell; salvage: Supplies });
type Approach = { goal: Cell; route: Cell[] };

export class Simulation {
  readonly grid: Grid;
  readonly units: Unit[];
  readonly piles: Pile[];
  readonly relays: Relay[] = [];
  readonly enemies: Enemy[];
  /** An uprooted tree survives dismantling or a wreck without blocking its parts. */
  readonly looseTrees: Cell[] = [];
  readonly reached = new Set<string>();
  bonusReached = false;
  readonly blueprints: BlueprintStock;
  readonly blueprintPickups: BlueprintPickup[];
  get visibleBlueprints(): BlueprintPickup[] { return this.blueprintPickups.filter(plan => !plan.afterMain || this.mainComplete); }
  get mainComplete(): boolean { return !!this.setup.goals?.length && this.setup.goals.every(goal => this.reached.has(goal.id)); }
  get bonusUnlocked(): boolean { return this.mainComplete; }
  private events: SimulationEvent[] = [];
  private nextId = 1;
  private randomState: number;
  private underObstacles = new Map<string, Terrain>();
  constructor(grid: Grid, definitions: UnitDefinition[], readonly setup: { piles?: Pile[]; goals?: Goal[]; bonus?: BonusObjective; blueprints?: BlueprintStock; blueprintPickups?: BlueprintPickup[]; enemies?: EnemyDefinition[]; seed?: number } = {}) {
    // Terrain belongs to this run. Digging must never rewrite the authored level.
    validateWhirlpools(grid);
    this.grid = { ...grid, tiles: grid.tiles.map(row => [...row]), whirlpools: grid.whirlpools && Object.fromEntries(Object.entries(grid.whirlpools).map(([id, exit]) => [id, { ...exit }])) };
    this.blueprints = { ...(setup.blueprints ?? Object.fromEntries(Object.keys(recipes).map(kind => [kind, 1]))) };
    this.blueprintPickups = (setup.blueprintPickups ?? []).map(plan => ({ ...plan, cell: { ...plan.cell } }));
    grid.tiles.forEach((row, y) => row.forEach((tile, x) => {
      if (tile === 'tree' || tile === 'rock') this.underObstacles.set(key({ x, y }), 'grass');
    }));
    this.randomState = (setup.seed ?? 12345) >>> 0 || 1;
    this.piles = (setup.piles ?? []).map(p => ({ cell: { ...p.cell }, supplies: cloneSupplies(p.supplies) }));
    const occupied = new Set<string>();
    this.units = definitions.map(def => {
      if (!walkable(grid, def.start, unitSpecs[def.kind].mobility) || occupied.has(key(def.start))) throw new Error(`Invalid start for ${def.id}`);
      occupied.add(key(def.start));
      return this.createUnit(def);
    });
    this.enemies = (setup.enemies ?? []).map(def => {
      if (!walkable(grid, def.start, enemySpecs[def.kind].mobility) || occupied.has(key(def.start))) throw new Error(`Invalid start for ${def.id}`);
      occupied.add(key(def.start));
      if (def.patrol && (def.patrol.length < 2 || def.patrol.some(cell => !walkable(grid, cell, enemySpecs[def.kind].mobility)))) throw new Error(`Invalid patrol for ${def.id}`);
      return { ...def, patrol: def.patrol?.map(cell => ({ ...cell })), start: { ...def.start }, cell: { ...def.start }, next: null, progress: 0, facing: { x: -1, y: 0 }, health: def.maxHealth, target: null, status: 'wandering', decisionTimer: 0, attackCooldown: 0, alertRemaining: 0, patrolIndex: 0 };
    });
    for (const unit of this.units) this.recordGoals(unit);
  }
  private createUnit(def: UnitDefinition): Unit {
    if (!Number.isInteger(def.battery) || def.battery < 0 || def.battery > BATTERY_CAPACITY) throw new Error('Invalid battery charge.');
    return { ...def, cell: { ...def.start }, next: null, progress: 0, route: [], goal: null, facing: { x: 1, y: 0 }, status: def.battery || !usesBattery(def.kind) ? 'idle' : 'depleted', cargo: emptySupplies(), carryingTree: false, integrity: 100, pending: null, attackCooldown: 0, supportCooldown: 0 };
  }
  private recordGoals(unit: Unit): void {
    if (!isMobile(unit.kind)) return;
    for (const plan of this.visibleBlueprints) if (sameCell(unit.cell, plan.cell)) {
      this.blueprints[plan.blueprint] = (this.blueprints[plan.blueprint] ?? 0) + 1;
      this.blueprintPickups.splice(this.blueprintPickups.indexOf(plan), 1);
      this.events.push({ kind: 'blueprint-found', unitId: unit.id, blueprint: plan.blueprint, cell: { ...plan.cell }, text: `${unitSpecs[unit.kind].name} found a blueprint.`, error: false });
    }
    for (const goal of this.setup.goals ?? []) {
      if (!sameCell(unit.cell, goal.cell) || goal.kinds && !goal.kinds.includes(unit.kind) || goal.unitId && goal.unitId !== unit.id || goal.clearEnemies && this.enemies.length) continue;
      if (goal.cargo && (!partKinds.every(color => unit.cargo[color] >= goal.cargo![color])
        || unit.cargo.batteries.filter(charge => charge > 0).length < goal.cargo.chargedBatteries)) continue;
      this.reachGoal(goal, unit.id);
    }
    const bonus = this.setup.bonus;
    if (this.bonusUnlocked && !this.bonusReached && bonus?.kind === 'arrival' && sameCell(unit.cell, bonus.cell)
      && (!bonus.unitId || unit.id === bonus.unitId) && (!bonus.kinds || bonus.kinds.includes(unit.kind))
      && (!bonus.carryingTree || unit.carryingTree) && unit.battery >= (bonus.minimumCharge ?? 0)
      && (!bonus.clearEnemies || !this.enemies.length)) this.awardBonus(bonus.cell);
  }
  private reachGoal(goal: Goal, unitId: string): void {
    if (this.reached.has(goal.id)) return;
    this.reached.add(goal.id);
    this.events.push({ kind: 'goal-reached', unitId, goalId: goal.id,
      complete: this.mainComplete, text: `${goal.name} reached.`, error: false });
  }
  private awardBonus(cell: Cell): void {
    this.bonusReached = true;
    this.events.push({ kind: 'bonus-reached', cell: { ...cell }, unitId: '', text: `${this.setup.bonus!.name}: bonus star earned!`, error: false });
  }
  unit(id: string): Unit {
    const unit = this.units.find(u => u.id === id);
    if (!unit) throw new Error(`Unknown unit: ${id}`);
    return unit;
  }
  drainEvents(): SimulationEvent[] { return this.events.splice(0); }
  blockedFor(id: string): Set<string> {
    const blocked = new Set(this.relays.map(r => key(r.cell)));
    for (const u of [...this.units, ...this.enemies]) if (u.id !== id) {
      blocked.add(key(u.cell));
      if (u.next) { blocked.add(key(u.next)); blocked.add(key(movementDestination(this.grid, u.next))); }
    }
    return blocked;
  }
  pileAt(cell: Cell): Pile | undefined { return this.piles.find(p => sameCell(p.cell, cell)); }
  relayAt(cell: Cell): Relay | undefined { return this.relays.find(r => sameCell(r.cell, cell)); }
  private addSupplies(cell: Cell, supplies: Supplies): void {
    let pile = this.pileAt(cell);
    if (!pile) { pile = { cell: { ...cell }, supplies: emptySupplies() }; this.piles.push(pile); }
    for (const m of partKinds) pile.supplies[m] += supplies[m];
    pile.supplies.batteries.push(...supplies.batteries);
    if (supplies.soil) pile.supplies.soil = (pile.supplies.soil ?? 0) + supplies.soil;
  }
  private prunePiles(): void {
    for (let i = this.piles.length - 1; i >= 0; i--) if (load(this.piles[i].supplies) === 0) this.piles.splice(i, 1);
  }
  private targetProblem(id: string, action: CargoAction, target: Cell): string | null {
    const u = this.unit(id);
    if (!supportsCargo(u.kind)) return `${u.name} cannot carry parts. Choose a cargo vehicle.`;
    const terrain = terrainAt(this.grid, target);
    // A carrier can transfer across a shoreline; its approach must remain on its own terrain.
    if (!terrain || terrain === 'tree' || terrain === 'rock' || this.blockedFor(id).has(key(target))) return 'That tile is blocked. Choose a clear tile.';
    if (action === 'pickup') {
      if (load(u.cargo) >= u.capacity) return 'Cargo is full. Drop it off before picking up more.';
      if (!this.pileAt(target)) return 'No parts here. Choose a pile.';
    } else if (load(u.cargo) === 0) return 'Cargo empty. Pick up some parts first.';
    if (u.battery < TRANSFER_ENERGY) return `This needs ${TRANSFER_ENERGY} charge. Drop a charged battery nearby, then choose Replace battery.`;
    return null;
  }
  cargoProblem(id: string, action: CargoAction, target: Cell): string | null {
    const u = this.unit(id);
    if (u.next || u.goal) return 'The rover must finish moving before transferring cargo.';
    if (!adjacent(u.cell, target)) return 'Cargo transfers require a directly adjacent tile.';
    return this.targetProblem(id, action, target);
  }
  /** Atomic local transfer. Travelling orders call this again on arrival. */
  transfer(id: string, action: CargoAction, target: Cell): ActionResult {
    const reason = this.cargoProblem(id, action, target);
    if (reason) return { ok: false, reason };
    const u = this.unit(id);
    if (action === 'drop') { this.addSupplies(target, u.cargo); u.cargo = emptySupplies(); }
    else {
      const pile = this.pileAt(target)!;
      for (const m of partKinds) {
        const quantity = Math.min(pile.supplies[m], u.capacity - load(u.cargo));
        u.cargo[m] += quantity; pile.supplies[m] -= quantity;
      }
      u.cargo.batteries.push(...pile.supplies.batteries.splice(0, u.capacity - load(u.cargo)));
      const soil = Math.min(pile.supplies.soil ?? 0, u.capacity - load(u.cargo));
      if (soil) { u.cargo.soil = (u.cargo.soil ?? 0) + soil; pile.supplies.soil! -= soil; }
      this.prunePiles();
    }
    u.battery -= TRANSFER_ENERGY;
    u.status = u.battery ? 'idle' : 'depleted';
    return { ok: true };
  }
  private approach(id: string, target: Cell, eligible: (cell: Cell) => boolean = () => true): Approach | null {
    const u = this.unit(id), from = u.next ? movementDestination(this.grid, u.next) : u.cell, blocked = this.blockedFor(id);
    let best: Approach | null = null;
    for (const goal of neighbors(target)) {
      if (!eligible(goal)) continue;
      const route = findPath(this.grid, from, goal, blocked, unitSpecs[u.kind].mobility);
      if (route && (!best || route.length < best.route.length)) best = { goal, route };
    }
    return best;
  }
  cargoOrderPreview(id: string, action: CargoAction, target: Cell): { ok: true; approach: Approach } | { ok: false; reason: string } {
    const reason = this.targetProblem(id, action, target);
    if (reason) return { ok: false, reason };
    const approach = this.approach(id, target);
    if (!approach) return { ok: false, reason: 'Cannot reach a tile beside that spot. Choose another target.' };
    return { ok: true, approach };
  }
  orderCargo(id: string, action: CargoAction, target: Cell): ActionResult {
    const preview = this.cargoOrderPreview(id, action, target);
    if (!preview.ok) return preview;
    return this.queueWork(id, action, target, preview.approach);
  }
  private terrainTargetProblem(id: string, action: TerrainAction, target: Cell): string | null {
    const u = this.unit(id), terrain = terrainAt(this.grid, target);
    if (u.kind !== 'scoop') return 'Choose Scoop to shape the land.';
    if (action === 'dig' ? terrain !== 'grass' && terrain !== 'sand' : terrain !== 'water') return action === 'dig' ? 'Dig open grass or sand.' : 'Fill a water tile.';
    if (this.inUse(target) || this.pileAt(target) || this.looseTrees.some(cell => sameCell(cell, target))) return 'That tile is in use. Choose a clear tile.';
    if (this.setup.goals?.some(goal => sameCell(goal.cell, target)) || this.setup.bonus && sameCell(this.setup.bonus.cell, target)) return 'Keep the flag and bonus sites intact.';
    if (action === 'dig' && load(u.cargo)) return 'Bucket full. Fill a water tile first.';
    if (action === 'fill' && !u.cargo.soil) return 'Bucket empty. Dig up some land first.';
    if (u.battery < TERRAIN_ENERGY) return `This needs ${TERRAIN_ENERGY} charge. Replace Scoop’s battery nearby.`;
    return null;
  }
  terrainProblem(id: string, action: TerrainAction, target: Cell): string | null {
    const u = this.unit(id);
    if (u.next || u.goal) return 'Scoop must finish moving before working.';
    if (!adjacent(u.cell, target)) return 'Scoop works on a directly adjacent tile.';
    return this.terrainTargetProblem(id, action, target);
  }
  shapeTerrain(id: string, action: TerrainAction, target: Cell): ActionResult {
    const reason = this.terrainProblem(id, action, target);
    if (reason) return { ok: false, reason };
    const u = this.unit(id);
    u.facing = { x: target.x - u.cell.x, y: target.y - u.cell.y };
    this.grid.tiles[target.y][target.x] = action === 'dig' ? 'water' : 'grass';
    u.cargo = action === 'dig' ? { ...emptySupplies(), soil: 1 } : emptySupplies();
    u.battery -= TERRAIN_ENERGY; u.status = u.battery ? 'idle' : 'depleted';
    this.events.push({ kind: 'terrain', action, cell: { ...target }, unitId: id, text: action === 'dig' ? 'Dirt collected.' : 'Land filled.', error: false });
    return { ok: true };
  }
  terrainOrderPreview(id: string, action: TerrainAction, target: Cell): { ok: true; approach: Approach } | { ok: false; reason: string } {
    const reason = this.terrainTargetProblem(id, action, target);
    if (reason) return { ok: false, reason };
    const approach = this.approach(id, target);
    return approach ? { ok: true, approach } : { ok: false, reason: 'Cannot reach a tile beside that spot.' };
  }
  orderTerrain(id: string, action: TerrainAction, target: Cell): ActionResult {
    const preview = this.terrainOrderPreview(id, action, target);
    if (!preview.ok) return preview;
    return this.queueWork(id, action, target, preview.approach);
  }
  private queueWork(id: string, action: WorkAction, target: Cell, approach: Approach): ActionResult {
    const u = this.unit(id);
    // All previews run first: an invalid click cannot replace a valid outstanding order.
    u.pending = { action, target: { ...target } }; u.route = approach.route; u.goal = { ...approach.goal };
    if (!u.next && !u.route.length) {
      u.goal = null; u.pending = null;
      return this.performWork(id, action, target);
    }
    u.status = 'moving';
    return { ok: true, queued: true };
  }
  private performWork(id: string, action: WorkAction, target: Cell): ActionResult {
    if (action === 'pickup' || action === 'drop') return this.transfer(id, action, target);
    if (action === 'dig' || action === 'fill') return this.shapeTerrain(id, action, target);
    return this.moveObstacle(id, action, target);
  }
  private protectedSite(cell: Cell): boolean {
    return !!this.setup.goals?.some(goal => sameCell(goal.cell, cell)) || !!this.setup.bonus && sameCell(this.setup.bonus.cell, cell);
  }
  private inUse(cell: Cell): boolean {
    return this.blockedFor('').has(key(cell)) || this.units.some(unit => unit.route.some(point => sameCell(point, cell)));
  }
  private clearGround(cell: Cell, allowPile = false): boolean {
    const terrain = terrainAt(this.grid, cell);
    return (terrain === 'grass' || terrain === 'sand' || terrain === 'swamp') && !this.inUse(cell) && !this.protectedSite(cell)
      && (allowPile || !this.pileAt(cell)) && !this.looseTrees.some(tree => sameCell(tree, cell));
  }
  private pushDestination(from: Cell, target: Cell): Cell {
    return { x: target.x * 2 - from.x, y: target.y * 2 - from.y };
  }
  private canPushFrom(from: Cell, target: Cell): boolean {
    // Loose supplies merge at the destination. A boulder still needs an empty
    // tile so it cannot bury parts. Planning and arrival use the same rule.
    return this.clearGround(this.pushDestination(from, target), terrainAt(this.grid, target) !== 'rock');
  }
  private obstacleTargetProblem(id: string, action: ObstacleAction, target: Cell): string | null {
    const u = this.unit(id), terrain = terrainAt(this.grid, target);
    if (!supportsAction(u.kind, action)) return `${u.name} cannot ${action}. Choose the appropriate worker.`;
    if (u.battery < TERRAIN_ENERGY) return `This needs ${TERRAIN_ENERGY} charge.`;
    if (!terrain || this.inUse(target) || this.protectedSite(target)) return 'That tile is in use. Choose another tile.';
    if (action === 'push') {
      if (terrain !== 'rock' && !this.pileAt(target)) return 'Choose a boulder or a loose pile to push.';
      if (terrain === 'tree') return 'Use Arborbot to move trees.';
    } else if (action === 'uproot') {
      if (u.carryingTree) return 'Already carrying a tree. Plant it first.';
      if (terrain !== 'tree' && !this.looseTrees.some(cell => sameCell(cell, target))) return 'Choose a tree.';
    } else {
      if (!u.carryingTree) return 'Uproot a tree first.';
      if (!this.clearGround(target)) return 'Plant on clear grass, sand or swamp.';
    }
    return null;
  }
  obstacleProblem(id: string, action: ObstacleAction, target: Cell): string | null {
    const u = this.unit(id);
    if (u.next || u.goal) return 'Finish moving before working.';
    if (!adjacent(u.cell, target)) return 'Work on a directly adjacent tile.';
    const problem = this.obstacleTargetProblem(id, action, target);
    if (problem) return problem;
    if (action === 'push' && !this.canPushFrom(u.cell, target)) return 'The tile beyond it must be clear ground.';
    return null;
  }
  moveObstacle(id: string, action: ObstacleAction, target: Cell): ActionResult {
    const reason = this.obstacleProblem(id, action, target);
    if (reason) return { ok: false, reason };
    const u = this.unit(id);
    let destination: Cell | undefined;
    if (action === 'push') {
      destination = this.pushDestination(u.cell, target);
      if (terrainAt(this.grid, target) === 'rock') {
        this.grid.tiles[target.y][target.x] = this.underObstacles.get(key(target)) ?? 'grass';
        this.underObstacles.delete(key(target));
        this.underObstacles.set(key(destination), terrainAt(this.grid, destination)!);
        this.grid.tiles[destination.y][destination.x] = 'rock';
      }
      const pile = this.pileAt(target);
      if (pile) { const supplies = cloneSupplies(pile.supplies); this.piles.splice(this.piles.indexOf(pile), 1); this.addSupplies(destination, supplies); }
    } else if (action === 'uproot') {
      const looseIndex = this.looseTrees.findIndex(cell => sameCell(cell, target));
      if (looseIndex >= 0) this.looseTrees.splice(looseIndex, 1);
      else {
        this.grid.tiles[target.y][target.x] = this.underObstacles.get(key(target)) ?? 'grass';
        this.underObstacles.delete(key(target));
      }
      u.carryingTree = true;
    } else {
      this.underObstacles.set(key(target), terrainAt(this.grid, target)!);
      this.grid.tiles[target.y][target.x] = 'tree'; u.carryingTree = false;
    }
    u.facing = { x: target.x - u.cell.x, y: target.y - u.cell.y };
    u.battery -= TERRAIN_ENERGY; u.status = u.battery ? 'idle' : 'depleted';
    this.events.push({ kind: 'obstacle', action, cell: { ...target }, destination, unitId: id, text: action === 'push' ? 'Path cleared.' : action === 'uproot' ? 'Tree lifted.' : 'Tree planted.', error: false });
    return { ok: true };
  }
  obstacleOrderPreview(id: string, action: ObstacleAction, target: Cell): { ok: true; approach: Approach } | { ok: false; reason: string } {
    const reason = this.obstacleTargetProblem(id, action, target);
    if (reason) return { ok: false, reason };
    const approach = this.approach(id, target, action === 'push' ? cell => this.canPushFrom(cell, target) : undefined);
    return approach ? { ok: true, approach } : { ok: false, reason: 'Cannot reach a working position beside that spot.' };
  }
  orderObstacle(id: string, action: ObstacleAction, target: Cell): ActionResult {
    const preview = this.obstacleOrderPreview(id, action, target);
    return preview.ok ? this.queueWork(id, action, target, preview.approach) : preview;
  }
  private nearbyPiles(cell: Cell): Pile[] {
    return constructionArea(cell).map(p => this.pileAt(p)).filter((p): p is Pile => !!p);
  }
  private bestBattery(cell: Cell) {
    return this.nearbyPiles(cell).flatMap(pile => pile.supplies.batteries.map((charge, index) => ({ pile, charge, index })))
      .sort((a, b) => b.charge - a.charge)[0];
  }
  replacementCharge(id: string): number | null {
    const u = this.unit(id), battery = this.bestBattery(u.cell);
    if (!usesBattery(u.kind)) return null;
    return battery && battery.charge > u.battery ? battery.charge : null;
  }
  replaceBattery(id: string): ActionResult {
    const u = this.unit(id);
    if (!usesBattery(u.kind)) return { ok: false, reason: `${u.name} does not use a battery.` };
    if (u.next || u.goal || u.pending) return { ok: false, reason: 'Stop the rover before replacing its battery.' };
    const battery = this.bestBattery(u.cell);
    if (!battery || battery.charge <= u.battery) return { ok: false, reason: 'Drop a battery with more charge within this rover’s 3×3 area.' };
    battery.pile.supplies.batteries.splice(battery.index, 1);
    this.prunePiles();
    this.addSupplies(u.cell, { ...emptySupplies(), batteries: [u.battery] });
    u.battery = battery.charge; u.status = 'idle';
    return { ok: true };
  }
  buildPreview(blueprint: Blueprint, cell: Cell): BuildPreview {
    const available = emptySupplies(), missing = emptyCost();
    for (const pile of this.nearbyPiles(cell)) {
      for (const m of partKinds) available[m] += pile.supplies[m];
      available.batteries.push(...pile.supplies.batteries);
    }
    for (const m of partKinds) missing[m] = Math.max(0, recipes[blueprint][m] - available[m]);
    missing.battery = Math.max(0, recipes[blueprint].battery - available.batteries.length);
    const batteryCharge = recipes[blueprint].battery && available.batteries.length ? Math.max(...available.batteries) : null;
    const t = terrainAt(this.grid, cell);
    const problem: BuildPreview['problem'] = !this.blueprints[blueprint] ? 'blueprints'
      : (blueprint === 'relay' ? t !== 'grass' && t !== 'sand' : !walkable(this.grid, cell, unitSpecs[blueprint].mobility)) || t === 'whirlpool' ? 'terrain'
      : this.blockedFor('').has(key(cell)) ? 'occupied'
      : this.looseTrees.some(tree => sameCell(tree, cell)) ? 'tree'
      : costTotal(missing) ? 'parts' : null;
    const reason = problem === null ? '' : ({ blueprints: 'No blueprints left for this model.', terrain: t === 'whirlpool' ? 'Keep whirlpools clear for travellers.' : 'Choose a clear tile that this model can use.', occupied: 'That tile is in use. Choose an empty site.', tree: 'Move the loose tree before building here.', parts: 'Drop the missing parts within this site’s 3×3 area.' })[problem];
    return { ok: !problem, problem, reason, available, missing, batteryCharge };
  }
  build(blueprint: Blueprint, cell: Cell): ActionResult {
    const preview = this.buildPreview(blueprint, cell);
    if (!preview.ok) return { ok: false, reason: preview.reason };
    this.blueprints[blueprint]! -= 1;
    const battery = recipes[blueprint].battery ? this.bestBattery(cell)! : null;
    if (battery) battery.pile.supplies.batteries.splice(battery.index, 1);
    const remaining = { ...recipes[blueprint] };
    for (const pile of this.nearbyPiles(cell)) for (const m of partKinds) {
      const take = Math.min(remaining[m], pile.supplies[m]);
      pile.supplies[m] -= take; remaining[m] -= take;
    }
    this.prunePiles();
    let id: string;
    do { id = `${blueprint}-${this.nextId++}`; } while (this.units.some(u => u.id === id) || this.relays.some(r => r.id === id));
    if (blueprint === 'relay') {
      this.relays.push({ id, cell: { ...cell } });
    } else {
      const unit = this.createUnit(unitDefinition(blueprint, id, cell, battery?.charge ?? 0));
      this.units.push(unit); this.recordGoals(unit);
    }
    return { ok: true, id };
  }
  dismantle(id: string): ActionResult {
    const index = this.units.findIndex(u => u.id === id);
    if (index >= 0) {
      const u = this.units[index];
      if (u.next || u.goal || u.pending) return { ok: false, reason: 'Stop the rover before taking it apart.' };
      this.addSupplies(u.cell, recipeSupplies(u.kind, u.battery));
      this.addSupplies(u.cell, u.cargo);
      if (u.carryingTree) this.looseTrees.push({ ...u.cell });
      this.units.splice(index, 1);
      return { ok: true };
    }
    const relayIndex = this.relays.findIndex(r => r.id === id);
    if (relayIndex < 0) return { ok: false, reason: 'Choose a rover or relay to take apart.' };
    this.addSupplies(this.relays[relayIndex].cell, recipeSupplies('relay'));
    this.relays.splice(relayIndex, 1);
    return { ok: true };
  }
  preview(id: string, goal: Cell): Cell[] | null {
    const u = this.unit(id);
    return isMobile(u.kind) ? findPath(this.grid, u.next ? movementDestination(this.grid, u.next) : u.cell, movementDestination(this.grid, goal), this.blockedFor(id), unitSpecs[u.kind].mobility) : null;
  }
  private movementCost(cell: Cell): number { return terrainAt(this.grid, cell) === 'swamp' ? MOVE_ENERGY * 3 : MOVE_ENERGY; }
  /** Current-charge estimate only: future combat and support can change it.
   * The active edge has already been paid; routes start after that edge. */
  routePower(id: string, route: readonly Cell[], action?: WorkAction): RoutePower {
    const u = this.unit(id);
    let required = 0, affordableSteps = 0;
    let lastReachable = u.next ? movementDestination(this.grid, u.next) : u.cell;
    for (const entry of route) {
      required += this.movementCost(entry);
      if (required <= u.battery) { affordableSteps++; lastReachable = movementDestination(this.grid, entry); }
    }
    if (action) required += action === 'pickup' || action === 'drop' ? TRANSFER_ENERGY : TERRAIN_ENERGY;
    return { required, affordableSteps, lastReachable: { ...lastReachable }, canFinish: required <= u.battery };
  }
  move(id: string, goal: Cell): OrderResult {
    const u = this.unit(id);
    if (!isMobile(u.kind) || !walkable(this.grid, goal, unitSpecs[u.kind].mobility)) return { ok: false, reason: 'terrain' };
    if (this.blockedFor(id).has(key(goal))) return { ok: false, reason: 'occupied' };
    const route = this.preview(id, goal);
    if (!route) return { ok: false, reason: 'unreachable' };
    if (route.length && u.battery < this.movementCost(route[0])) return { ok: false, reason: 'energy' };
    u.pending = null; u.route = route; u.goal = { ...movementDestination(this.grid, goal) };
    u.status = u.next || route.length ? 'moving' : u.battery ? 'idle' : 'depleted';
    return { ok: true };
  }
  stop(id: string): void {
    const u = this.unit(id);
    u.pending = null; u.route = [];
    // The active edge was paid for before departure, so even its last charge gets it to the center.
    u.goal = u.next ? { ...movementDestination(this.grid, u.next) } : null;
    u.status = u.next ? 'moving' : u.battery || !usesBattery(u.kind) ? 'idle' : 'depleted';
  }
  position(u: Pick<Unit, 'cell' | 'next' | 'progress'>): Cell {
    if (!u.next) return { ...u.cell };
    return { x: u.cell.x + (u.next.x - u.cell.x) * u.progress, y: u.cell.y + (u.next.y - u.cell.y) * u.progress };
  }
  step(seconds: number): void {
    if (!Number.isFinite(seconds) || seconds < 0) throw new Error('Simulation step must be finite and nonnegative.');
    // Small combat slices keep detection, movement, and attack cadence independent of frame size.
    let remaining = seconds;
    while (remaining > 1e-9) {
      const dt = this.enemies.length || this.units.some(unit => unitSpecs[unit.kind].recharge) ? Math.min(remaining, 1 / 60) : remaining;
      this.stepUnits(dt); this.stepEnemies(dt); this.stepCombat(dt); this.stepSupport(dt);
      remaining -= dt;
    }
  }
  private stepUnits(seconds: number): void {
    for (const u of this.units) {
      let budget = seconds * u.speed * (u.carryingTree ? .65 : 1);
      while (budget > 0) {
        if (!u.next) {
          if (u.pending && adjacent(u.cell, u.pending.target) && (u.pending.action !== 'push' || !u.goal || sameCell(u.cell, u.goal))) {
            const order = u.pending;
            u.pending = null; u.goal = null; u.route = [];
            const cargo = order.action === 'pickup' || order.action === 'drop';
            const terrain = order.action === 'dig' || order.action === 'fill';
            const result = this.performWork(u.id, order.action, order.target);
            u.status = u.battery ? 'idle' : 'depleted';
            if (cargo) this.events.push({ kind: 'cargo', action: order.action as CargoAction, unitId: u.id, error: !result.ok, text: result.ok
              ? `${u.name}: ${order.action === 'pickup' ? 'pickup' : 'drop-off'} complete.` : `${u.name}: ${result.reason} Cargo unchanged.` });
            else if (!result.ok) this.events.push(terrain
              ? { kind: 'terrain', action: order.action as TerrainAction, cell: { ...order.target }, unitId: u.id, error: true, text: `${u.name}: ${result.reason}` }
              : { kind: 'obstacle', action: order.action as ObstacleAction, cell: { ...order.target }, unitId: u.id, error: true, text: `${u.name}: ${result.reason}` });
            break;
          }
          if (!u.goal || sameCell(u.cell, u.goal)) {
            u.goal = null; u.route = []; u.status = u.battery ? 'idle' : 'depleted'; break;
          }
          const blocked = this.blockedFor(u.id);
          if (!u.route.length || !canEnter(this.grid, u.route[0], blocked, unitSpecs[u.kind].mobility)) {
            if (u.pending) {
              const target = u.pending.target;
              const approach = this.approach(u.id, target, u.pending.action === 'push' ? cell => this.canPushFrom(cell, target) : undefined);
              u.route = approach?.route ?? [];
              if (approach) u.goal = approach.goal;
            } else u.route = findPath(this.grid, u.cell, u.goal, blocked, unitSpecs[u.kind].mobility) ?? [];
          }
          if (!u.route.length) { u.status = 'waiting'; break; }
          const cost = this.movementCost(u.route[0]);
          if (u.battery < cost) {
            u.goal = null; u.route = []; u.pending = null; u.status = 'depleted';
            this.events.push({ kind: 'battery-empty', unitId: u.id, error: true, text: `${u.name}: not enough charge for the next tile. Replace its battery nearby. Cargo unchanged.` });
            break;
          }
          u.next = u.route.shift()!;
          u.battery -= cost;
          u.facing = { x: u.next.x - u.cell.x, y: u.next.y - u.cell.y };
          u.progress = 0; u.status = 'moving';
        }
        const advance = Math.min(budget, 1 - u.progress);
        u.progress += advance; budget -= advance;
        if (u.progress >= 1 - 1e-9) {
          u.cell = u.next; u.next = null; u.progress = 0;
          this.enterWhirlpool(u);
          this.recordGoals(u);
          if (!u.pending && u.goal && sameCell(u.cell, u.goal)) { u.goal = null; u.route = []; u.status = u.battery ? 'idle' : 'depleted'; }
        }
      }
    }
  }

  private enterWhirlpool(actor: Unit | Enemy): void {
    const destination = movementDestination(this.grid, actor.cell);
    if (sameCell(destination, actor.cell)) return;
    const cell = { ...actor.cell };
    actor.cell = { ...destination };
    this.events.push({ kind: 'whirlpool', unitId: actor.id, cell, destination: { ...destination }, text: '', error: false });
  }

  private random(): number {
    let x = this.randomState;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.randomState = x >>> 0;
    return this.randomState / 4294967296;
  }
  private distance(a: Cell, b: Cell): number { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y); }
  private stepEnemies(seconds: number): void {
    for (const enemy of this.enemies) {
      const position = this.position(enemy);
      const target = this.units.map(unit => {
        const distance = this.distance(position, this.position(unit));
        // Fighters remain threats during their attack cooldown, but cannot
        // protect a courier after running out of charge for another hit.
        const armed = unit.damage > 0 && unit.battery >= attackEnergy(unit.kind);
        return { unit, distance, current: unit.id === enemy.target, priority: armed ? distance <= 1.05 ? 2 : 1 : 0 };
      }).filter(candidate => candidate.distance <= (candidate.current ? enemy.loseRange : enemy.detectionRange))
        // Fight adjacent combatants first, then pursue other armed units.
        // Keep the existing chase when priorities tie, including unarmed bait.
        .sort((a, b) => b.priority - a.priority || Number(b.current) - Number(a.current)
          || a.distance - b.distance || a.unit.id.localeCompare(b.unit.id))[0]?.unit;
      if (target && !enemy.target) {
        // Already adjacent opponents still trade their automatic first volley.
        // The notice beat gives warning before a distant predator begins a chase.
        enemy.alertRemaining = this.distance(position, this.position(target)) > 1.05 ? ENEMY_NOTICE_SECONDS : 0;
        this.events.push({ kind: 'enemy-alert', unitId: enemy.id, targetId: target.id, cell: { ...enemy.cell }, text: '', error: false });
      } else enemy.alertRemaining = target ? Math.max(0, enemy.alertRemaining - seconds) : 0;
      enemy.target = target?.id ?? null;
      enemy.status = target ? enemy.alertRemaining > 1e-9 ? 'alerting' : this.distance(position, this.position(target)) <= 1.05 ? 'attacking' : 'chasing' : 'wandering';
      enemy.decisionTimer -= seconds;
      if (!enemy.next) {
        const blocked = this.blockedFor(enemy.id);
        let next: Cell | undefined;
        if (target && enemy.status === 'alerting') {
          const toward = this.position(target);
          const dx = toward.x - position.x, dy = toward.y - position.y;
          enemy.facing = Math.abs(dx) >= Math.abs(dy) ? { x: Math.sign(dx) || 1, y: 0 } : { x: 0, y: Math.sign(dy) };
        } else if (target && enemy.status === 'chasing') {
          let best: Cell[] | null = null;
          for (const goal of neighbors(target.next ?? target.cell)) {
            const path = findPath(this.grid, enemy.cell, goal, blocked, enemySpecs[enemy.kind].mobility);
            if (path && (!best || path.length < best.length)) best = path;
          }
          next = best?.[0];
        } else if (!target && enemy.decisionTimer <= 0) {
          if (enemy.patrol) {
            // Resume the authored circuit after a chase. Blocked patrols wait;
            // they never turn into a teleport or walk through another actor.
            for (let i = 0; i < enemy.patrol.length && sameCell(enemy.cell, enemy.patrol[enemy.patrolIndex]); i++) enemy.patrolIndex = (enemy.patrolIndex + 1) % enemy.patrol.length;
            next = findPath(this.grid, enemy.cell, enemy.patrol[enemy.patrolIndex], blocked, enemySpecs[enemy.kind].mobility)?.[0];
          } else if (this.distance(enemy.cell, enemy.start) > enemy.patrolRadius) next = findPath(this.grid, enemy.cell, enemy.start, blocked, enemySpecs[enemy.kind].mobility)?.[0];
          else {
            const choices = neighbors(enemy.cell).filter(cell => canEnter(this.grid, cell, blocked, enemySpecs[enemy.kind].mobility) && this.distance(cell, enemy.start) <= enemy.patrolRadius);
            // Include staying still so wandering has pauses rather than constant pacing.
            next = choices[Math.floor(this.random() * (choices.length + 1))];
          }
          enemy.decisionTimer = enemy.patrol ? .15 : .7 + this.random() * .9;
        }
        if (next) { enemy.next = next; enemy.progress = 0; enemy.facing = { x: next.x - enemy.cell.x, y: next.y - enemy.cell.y }; }
      }
      if (enemy.next) {
        enemy.progress += seconds * enemy.speed;
        if (enemy.progress >= 1 - 1e-9) { enemy.cell = enemy.next; enemy.next = null; enemy.progress = 0; this.enterWhirlpool(enemy); }
      }
    }
  }
  private stepCombat(seconds: number): void {
    const hits: ({ attacker: Unit; target: Enemy; friendly: true } | { attacker: Enemy; target: Unit; friendly: false })[] = [];
    const destroyed = new Set<string>();
    for (const unit of this.units) {
      unit.attackCooldown = Math.max(0, unit.attackCooldown - seconds);
      if (!unit.damage || unit.battery < attackEnergy(unit.kind) || unit.attackCooldown > 1e-9) continue;
      const target = this.enemies.find(enemy => this.distance(this.position(unit), this.position(enemy)) <= 1.05);
      if (target) {
        unit.battery -= attackEnergy(unit.kind); unit.attackCooldown = unit.attackInterval;
        if (!unit.battery && !unit.next) unit.status = 'depleted';
        hits.push({ attacker: unit, target, friendly: true });
      }
    }
    for (const enemy of this.enemies) {
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - seconds);
      const target = this.units.find(unit => unit.id === enemy.target);
      if (target && enemy.alertRemaining <= 1e-9 && enemy.attackCooldown <= 1e-9 && this.distance(this.position(enemy), this.position(target)) <= 1.05) {
        enemy.attackCooldown = enemy.attackInterval; hits.push({ attacker: enemy, target, friendly: false });
      }
    }
    // Resolve a volley together, so array order cannot cancel a simultaneous counterattack.
    for (const hit of hits) {
      if (hit.friendly) hit.target.health = Math.max(0, hit.target.health - hit.attacker.damage);
      else {
        if (usesBattery(hit.target.kind)) hit.target.battery = Math.max(0, hit.target.battery - hit.attacker.damage);
        else hit.target.integrity = Math.max(0, hit.target.integrity - hit.attacker.damage);
        if (hit.attacker.damage > 0 && (usesBattery(hit.target.kind) ? hit.target.battery : hit.target.integrity) === 0) destroyed.add(hit.target.id);
      }
      this.events.push({ kind: 'hit', unitId: hit.friendly ? hit.attacker.id : hit.target.id, attackerId: hit.attacker.id, targetId: hit.target.id,
        cell: this.position(hit.target), damage: hit.attacker.damage, text: '', error: false });
    }
    for (let i = this.units.length - 1; i >= 0; i--) {
      const unit = this.units[i];
      if (!destroyed.has(unit.id)) continue;
      const cell = { ...(unit.next && unit.progress >= .5 ? unit.next : unit.cell) };
      const salvage = recipeSupplies(unit.kind, 0);
      for (const part of partKinds) salvage[part] += unit.cargo[part];
      salvage.batteries.push(...unit.cargo.batteries);
      if (unit.cargo.soil) salvage.soil = unit.cargo.soil;
      this.addSupplies(cell, salvage);
      if (unit.carryingTree) this.looseTrees.push({ ...cell });
      this.units.splice(i, 1);
      this.events.push({ kind: 'destroyed', unitId: unit.id, faction: 'friendly', cell, position: this.position(unit), salvage,
        text: `${unit.name} destroyed. Its parts${usesBattery(unit.kind) ? ' and an empty battery' : ''} remain.`, error: true });
    }
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.health > 0) continue;
      const cell = { ...(enemy.next && enemy.progress >= .5 ? enemy.next : enemy.cell) };
      const salvage = cloneSupplies(enemySpecs[enemy.kind].loot);
      if (load(salvage)) this.addSupplies(cell, salvage);
      this.enemies.splice(i, 1);
      this.events.push({ kind: 'destroyed', unitId: enemy.id, faction: 'enemy', cell, position: this.position(enemy), salvage, text: `${enemy.name} defeated.`, error: false });
    }
    for (const unit of this.units) this.recordGoals(unit);
  }
  private stepSupport(seconds: number): void {
    for (const source of this.units) {
      const family = unitSpecs[source.kind].recharge;
      if (!family) continue;
      source.supportCooldown = Math.max(0, source.supportCooldown - seconds);
      if (source.supportCooldown > 1e-9 || usesBattery(source.kind) && source.battery < 1) continue;
      const targets = this.units.filter(target => target.id !== source.id && unitSpecs[target.kind].family === family
        && target.battery < BATTERY_CAPACITY && this.distance(this.position(source), this.position(target)) <= 1.05)
        .sort((a, b) => a.battery - b.battery || a.id.localeCompare(b.id));
      if (!targets.length) continue;
      source.supportCooldown = 1;
      // A mobile Mender services one bot per pulse and pays from its own battery.
      // Buildings draw external power and can service all adjacent matching units.
      for (const target of source.kind === 'mender' ? targets.slice(0, 1) : targets) {
        const charge = Math.min(6, BATTERY_CAPACITY - target.battery);
        target.battery += charge;
        if (!target.next && !target.goal) target.status = 'idle';
        if (usesBattery(source.kind)) { source.battery -= 1; if (!source.battery && !source.next) source.status = 'depleted'; }
        this.events.push({ kind: 'recharge', unitId: source.id, targetId: target.id, cell: this.position(target), charge, text: '', error: false });
      }
    }
  }
}
