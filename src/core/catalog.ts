import type { Cell, Mobility } from './grid';

export const materials = ['red', 'blue', 'yellow', 'green'] as const;
export type Material = typeof materials[number];
export const partKinds = [...materials, 'tires'] as const;
export type PartKind = typeof partKinds[number];
export type PartCounts = Record<PartKind, number>;
export type Supplies = PartCounts & { batteries: number[]; soil?: number };
export type Cost = PartCounts & { battery: number };
export const unitKinds = ['scout', 'hauler', 'warden', 'scoop', 'trailbuggy', 'snail', 'dozer', 'forklift', 'arborbot', 'dumptruck', 'mender', 'frog', 'duck', 'fish', 'tug', 'freighter', 'patrolboat', 'pump', 'workshop', 'sentry', 'marina'] as const;
export type UnitKind = typeof unitKinds[number];
export type Blueprint = UnitKind | 'relay';
export const enemyKinds = ['bristleback', 'crab', 'water-crab', 'scorpion', 'gator', 'trex', 'shark'] as const;
export type EnemyKind = typeof enemyKinds[number];
export type UnitAction = 'pickup' | 'drop' | 'dig' | 'fill' | 'push' | 'uproot' | 'plant';
export type UnitFamily = 'vehicle' | 'bot' | 'creature' | 'boat' | 'structure';
export type UnitSpec = {
  name: string; reference: string | null; description: string; color: number; speed: number; capacity: number;
  damage: number; mobility: Mobility; family: UnitFamily; actions: readonly UnitAction[];
  recharge?: 'vehicle' | 'bot' | 'boat';
};
export const BATTERY_CAPACITY = 100;
export const MOVE_ENERGY = 1;
export const TRANSFER_ENERGY = 2;
export const TERRAIN_ENERGY = 3;
export const ATTACK_ENERGY = 1;
/** Heavy defensive hits should consume enough power to make support matter. */
export const attackEnergy = (kind: UnitKind): number => kind === 'warden' ? 2 : ATTACK_ENERGY;
export type UnitDefinition = {
  id: string; kind: UnitKind; name: string; description: string;
  color: number; speed: number; capacity: number; start: Cell; battery: number;
  damage: number; attackInterval: number;
};
export const partCounts = (red = 0, blue = 0, yellow = 0, green = 0, tires = 0): PartCounts => ({ red, blue, yellow, green, tires });
export const emptySupplies = (): Supplies => ({ ...partCounts(), batteries: [] });
export const cloneSupplies = (s: Supplies): Supplies => ({ ...s, batteries: [...s.batteries] });
export const emptyCost = (): Cost => ({ ...partCounts(), battery: 0 });
export const load = (s: Supplies): number => partKinds.reduce((sum, color) => sum + s[color], 0) + s.batteries.length + (s.soil ?? 0);
export const costTotal = (s: Cost): number => partKinds.reduce((sum, color) => sum + s[color], 0) + s.battery;
export const describeCost = (s: Cost): string => [
  ...partKinds.filter(m => s[m] > 0).map(m => `${s[m]} ${m}`),
  ...(s.battery ? [`${s.battery} ${s.battery === 1 ? 'battery' : 'batteries'}`] : []),
].join(' · ') || 'None';
export const describeSupplies = (s: Supplies): string => [
  ...partKinds.filter(m => s[m] > 0).map(m => `${s[m]} ${m}`),
  ...(s.soil ? [`${s.soil} dirt`] : []),
  ...(s.batteries.length ? [s.batteries.length === 1
    ? s.batteries[0] === 0 ? '1 empty battery' : `1 battery (${s.batteries[0]}/${BATTERY_CAPACITY})`
    : `${s.batteries.length} batteries (${s.batteries.join(', ')} charge)`] : []),
].join(' · ') || 'Empty';
export const recipes: Record<Blueprint, Cost> = {
  scout: { ...partCounts(0, 0, 1, 1), tires: 4, battery: 1 },
  hauler: { ...partCounts(2, 1), tires: 4, battery: 1 },
  relay: { ...partCounts(1, 1, 0, 2), battery: 0 },
  warden: { ...partCounts(1, 2), battery: 1 },
  scoop: { ...partCounts(1, 1, 2), tires: 4, battery: 1 },
  trailbuggy: { ...partCounts(1, 1, 1), tires: 4, battery: 1 },
  snail: { ...partCounts(0, 0, 1), battery: 1 },
  dozer: { ...partCounts(1, 0, 2), tires: 4, battery: 1 },
  forklift: { ...partCounts(1, 1, 2), tires: 4, battery: 1 },
  arborbot: { ...partCounts(1, 0, 1, 3), battery: 1 },
  dumptruck: { ...partCounts(3, 1, 2), tires: 4, battery: 1 },
  mender: { ...partCounts(1, 2, 1, 1), battery: 1 },
  frog: { ...partCounts(0, 0, 0, 1), battery: 1 },
  duck: { ...partCounts(0, 0, 1), battery: 1 },
  fish: { ...partCounts(0, 1), battery: 1 },
  tug: { ...partCounts(1, 2), battery: 1 },
  freighter: { ...partCounts(2, 3), battery: 1 },
  patrolboat: { ...partCounts(2, 3, 1), battery: 1 },
  pump: { ...partCounts(3, 0, 2, 1), battery: 0 },
  workshop: { ...partCounts(2, 3, 0, 1), battery: 0 },
  sentry: { ...partCounts(2, 3, 1), battery: 1 },
  marina: { ...partCounts(2, 3, 1), battery: 0 },
};
// Released World Builder 1 roster: 20 buildables + six enemies. Reference
// identities guide the roles; designs, names, recipes and balance are ours.
// https://brickipedia.fandom.com/wiki/World_Builder
// Cut Bluebird/Cargo Copter and World Builder 2 additions are outside that roster.
export const unitSpecs: Record<UnitKind, UnitSpec> = {
  scout: { name: 'Scout', reference: 'Buggy', description: 'Fast land courier · carries 2 parts', color: 0xb8ea32, speed: 2.4, capacity: 2, damage: 0, mobility: 'land', family: 'vehicle', actions: ['pickup', 'drop'] },
  hauler: { name: 'Hauler', reference: null, description: 'Compact carrier · carries 4 parts', color: 0xffa029, speed: 1.65, capacity: 4, damage: 0, mobility: 'land', family: 'vehicle', actions: ['pickup', 'drop'] },
  warden: { name: 'Warden', reference: 'Defender', description: 'Fights adjacent creatures automatically · carries 1 part', color: 0x419ff5, speed: 1.9, capacity: 1, damage: 4, mobility: 'land', family: 'bot', actions: ['pickup', 'drop'] },
  scoop: { name: 'Scoop', reference: 'Steamshovel', description: 'Digs land and fills water · carries 1 load of dirt', color: 0xffd447, speed: 1.55, capacity: 1, damage: 0, mobility: 'land', family: 'vehicle', actions: ['dig', 'fill'] },
  trailbuggy: { name: 'Trailbuggy', reference: 'Dirtbuggy', description: 'Crosses rough ground · carries 3 parts', color: 0xf1ad38, speed: 2.35, capacity: 3, damage: 0, mobility: 'rough', family: 'vehicle', actions: ['pickup', 'drop'] },
  snail: { name: 'Snail', reference: 'Snail', description: 'Slow land explorer · carries its home', color: 0xb084da, speed: 1.4, capacity: 0, damage: 0, mobility: 'land', family: 'creature', actions: [] },
  dozer: { name: 'Dozer', reference: 'Bulldozer', description: 'Pushes boulders and combines loose piles', color: 0xf5bd35, speed: 1.5, capacity: 0, damage: 0, mobility: 'land', family: 'vehicle', actions: ['push'] },
  forklift: { name: 'Forklift', reference: 'Forklift', description: 'Lifts 10 parts at a time', color: 0xefa146, speed: 1.4, capacity: 10, damage: 0, mobility: 'land', family: 'vehicle', actions: ['pickup', 'drop'] },
  arborbot: { name: 'Arborbot', reference: 'Treebot', description: 'Uproots and replants trees · slower while carrying one', color: 0x80ba4c, speed: 2.1, capacity: 0, damage: 0, mobility: 'land', family: 'bot', actions: ['uproot', 'plant'] },
  dumptruck: { name: 'Bulk hauler', reference: 'Dumptruck', description: 'Slow, steady transport · carries 25 parts', color: 0xf18236, speed: 1.1, capacity: 25, damage: 0, mobility: 'land', family: 'vehicle', actions: ['pickup', 'drop'] },
  mender: { name: 'Mender', reference: 'Repairbot', description: 'Crosses rough ground · restores adjacent bots using its own charge', color: 0x54cbd0, speed: 2.25, capacity: 0, damage: 0, mobility: 'rough', family: 'bot', actions: [], recharge: 'bot' },
  frog: { name: 'Frog', reference: 'Frog', description: 'Hops over land and shallow water · deep water is out of reach', color: 0x7bc652, speed: 2.5, capacity: 0, damage: 0, mobility: 'amphibious', family: 'creature', actions: [] },
  duck: { name: 'Duck', reference: 'Duck', description: 'Waddles on land and paddles in shallow water', color: 0xffdb54, speed: 2.2, capacity: 0, damage: 0, mobility: 'amphibious', family: 'creature', actions: [] },
  fish: { name: 'Fish', reference: 'Fish', description: 'Swims through shallow and deep water', color: 0x599bde, speed: 2.65, capacity: 0, damage: 0, mobility: 'water', family: 'creature', actions: [] },
  tug: { name: 'Tugboat', reference: 'Tugboat', description: 'Water courier · carries 5 parts', color: 0xee9547, speed: 2.2, capacity: 5, damage: 0, mobility: 'water', family: 'boat', actions: ['pickup', 'drop'] },
  freighter: { name: 'Freighter', reference: 'Freighter', description: 'Heavy water transport · carries 25 parts', color: 0x4899cc, speed: 1.5, capacity: 25, damage: 0, mobility: 'water', family: 'boat', actions: ['pickup', 'drop'] },
  patrolboat: { name: 'Patrol boat', reference: 'Speedboat', description: 'Fast boat · attacks adjacent water creatures automatically', color: 0xffcb45, speed: 3, capacity: 0, damage: 5, mobility: 'water', family: 'boat', actions: [] },
  pump: { name: 'Charging station', reference: 'Gas Station', description: 'Stationary · recharges adjacent wheeled vehicles automatically', color: 0xf19c47, speed: 0, capacity: 0, damage: 0, mobility: 'land', family: 'structure', actions: [], recharge: 'vehicle' },
  workshop: { name: 'Bot workshop', reference: 'Robot Lab', description: 'Stationary · restores adjacent bots automatically', color: 0x5899d8, speed: 0, capacity: 0, damage: 0, mobility: 'land', family: 'structure', actions: [], recharge: 'bot' },
  sentry: { name: 'Sentry tower', reference: 'Guard Tower', description: 'Stationary · attacks adjacent creatures automatically', color: 0x4e9cdb, speed: 0, capacity: 0, damage: 6, mobility: 'land', family: 'structure', actions: [] },
  marina: { name: 'Marina', reference: 'Marina', description: 'Stationary · recharges adjacent boats in shallow water', color: 0x65b5d0, speed: 0, capacity: 0, damage: 0, mobility: 'shallow', family: 'structure', actions: [], recharge: 'boat' },
};
export const enemySpecs: Record<EnemyKind, { name: string; reference: string | null; mobility: Mobility; speed: number; health: number; damage: number; loot: Supplies }> = {
  bristleback: { name: 'Bristleback', reference: null, mobility: 'land', speed: 1.75, health: 20, damage: 4, loot: { ...partCounts(2), batteries: [100] } },
  crab: { name: 'Crab', reference: 'Crab', mobility: 'land', speed: 1.6, health: 16, damage: 4, loot: { ...partCounts(3), batteries: [100] } },
  'water-crab': { name: 'Reef crab', reference: 'Water Crab', mobility: 'water', speed: 1.2, health: 12, damage: 4, loot: { ...partCounts(0, 3), batteries: [100] } },
  scorpion: { name: 'Scorpion', reference: 'Scorpion', mobility: 'rough', speed: 2.5, health: 28, damage: 6, loot: { ...partCounts(0, 0, 4), batteries: [100] } },
  gator: { name: 'Gator', reference: 'Alligator', mobility: 'land-water', speed: 1.3, health: 32, damage: 6, loot: { ...partCounts(0, 0, 0, 4), batteries: [100] } },
  trex: { name: 'Rex', reference: 'Tyrannosaurus Rex', mobility: 'rough', speed: 1.1, health: 60, damage: 10, loot: { ...partCounts(2, 0, 0, 4), batteries: [100] } },
  shark: { name: 'Shark', reference: 'Shark', mobility: 'water', speed: 2.9, health: 40, damage: 8, loot: { ...partCounts(0, 5), batteries: [100] } },
};
export const blueprintNames = Object.fromEntries([...unitKinds.map(kind => [kind, unitSpecs[kind].name]), ['relay', 'Signal relay']]) as Record<Blueprint, string>;
export const supportsCargo = (kind: UnitKind): boolean => unitSpecs[kind].actions.includes('pickup');
export const isMobile = (kind: UnitKind): boolean => unitSpecs[kind].speed > 0;
export const usesBattery = (kind: UnitKind): boolean => recipes[kind].battery > 0;
export const supportsAction = (kind: UnitKind, action: UnitAction): boolean => unitSpecs[kind].actions.includes(action);
export function defaultAction(kind: UnitKind, cargo: Supplies, carryingTree = false): UnitAction | null {
  if (kind === 'scoop') return cargo.soil ? 'fill' : 'dig';
  if (kind === 'arborbot') return carryingTree ? 'plant' : 'uproot';
  if (kind === 'dozer') return 'push';
  return supportsCargo(kind) ? load(cargo) ? 'drop' : 'pickup' : null;
}
export function recipeSupplies(blueprint: Blueprint, charge = 0): Supplies {
  const supplies = emptySupplies();
  for (const color of partKinds) supplies[color] = recipes[blueprint][color];
  supplies.batteries = Array.from({ length: recipes[blueprint].battery }, () => charge);
  return supplies;
}
export function unitDefinition(kind: UnitKind, id: string, start: Cell, battery = usesBattery(kind) ? BATTERY_CAPACITY : 0): UnitDefinition {
  const spec = unitSpecs[kind];
  return {
    id, kind, start: { ...start }, name: blueprintNames[kind], battery,
    description: spec.description, capacity: spec.capacity, speed: spec.speed, color: spec.color,
    damage: spec.damage, attackInterval: .7,
  };
}
export function enemyDefinition(kind: EnemyKind, id: string, start: Cell) {
  const spec = enemySpecs[kind];
  return { id, kind, name: spec.name, start: { ...start }, speed: spec.speed, maxHealth: spec.health,
    damage: spec.damage, attackInterval: .9, detectionRange: 4, loseRange: 6, patrolRadius: 2 };
}
