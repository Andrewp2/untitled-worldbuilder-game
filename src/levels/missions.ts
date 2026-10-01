import type { UnitDefinition } from '../core/catalog';
import type { Grid } from '../core/grid';
import { Simulation, type BonusObjective, type BlueprintStock, type EnemyDefinition, type Pile, type Goal } from '../core/simulation';
import { hollowReach, unitDefinitions, startingPiles, hollowGoals } from './hollow-reach';
import { brambleCrossing, crossingRovers, crossingPiles, crossingGoals, crossingEnemies } from './bramble-crossing';
import { siltwaterReach, siltwaterRovers, siltwaterPiles, siltwaterGoals } from './siltwater-reach';
import { rosterMissions } from './roster-missions';
import { meadowAdditions } from './meadow-isles';
import { sunstoneAdditions } from './sunstone-range';
import { seaMissions } from './open-sea';

export type Mission = { challenge?: string; id: string; name: string; goal: string; brief: string; grid: Grid; rovers: UnitDefinition[]; piles: Pile[]; goals: Goal[]; bonus: BonusObjective; enemies: EnemyDefinition[]; blueprints: BlueprintStock; seed: number };
const originalMissions: Mission[] = [
  { id: 'hollow-reach', name: 'Hollow Reach', goal: 'Reach the Shore flag', brief: 'Guide a rover across the island to Shore. After arrival, a bonus delivery opens at Ridge.',
    grid: hollowReach, rovers: unitDefinitions, piles: startingPiles, goals: hollowGoals,
    bonus: { kind: 'delivery', name: 'Ridge power', description: 'Deliver a charged battery to the Ridge star.', cell: { x: 15, y: 2 }, red: 0, blue: 0, chargedBatteries: 1 , yellow: 0, green: 0},
    enemies: [], blueprints: { relay: 1, hauler: 1, scout: 1 }, seed: 1 },
  { id: 'bramble-crossing', name: 'Bramble Crossing', goal: 'Clear the crossing · reach the East flag', brief: 'Build a Warden beside the camp’s Warden kit. Move it near the Bristleback to fight automatically, then move a rover onto the East flag. Battery charge powers movement and absorbs damage; wrecks leave an empty installed battery.',
    grid: brambleCrossing, rovers: crossingRovers, piles: crossingPiles, goals: crossingGoals,
    bonus: { kind: 'delivery', name: 'East supplies', description: 'Deliver 1 red, 1 blue and 2 green to the gold star on the eastern shore.', cell: { x: 17, y: 10 }, red: 1, blue: 1, chargedBatteries: 0, yellow: 0, green: 2},
    enemies: crossingEnemies, blueprints: { relay: 1, warden: 2, hauler: 1, scout: 1 }, seed: 20260929 },
  { id: 'siltwater-reach', name: 'Siltwater Reach', goal: 'Make a crossing · reach the Far bank', brief: 'Select Scoop. Choose Dig, then spare grass or sand to collect dirt. Choose Fill, then water to turn it into land. Scoop drives beside each target before working. Borrow two land tiles to make a crossing, then send a rover to the Far bank flag.',
    grid: siltwaterReach, rovers: siltwaterRovers, piles: siltwaterPiles, goals: siltwaterGoals,
    bonus: { kind: 'delivery', name: 'Far bank supplies', description: 'Deliver 2 red and 1 blue to the gold star on the far bank.', cell: { x: 12, y: 9 }, red: 2, blue: 1, chargedBatteries: 0 , yellow: 0, green: 0},
    enemies: [], blueprints: { scoop: 1, hauler: 1, scout: 1, relay: 1 }, seed: 20260930 },
  ...rosterMissions,
];
export type WorldId = 'meadow-isles' | 'sunstone-range' | 'open-sea';
export type CampaignMission = Mission & { world: WorldId; challenge: string };
const original = (id: string): Mission => originalMissions.find(m => m.id === id)!;
const introductoryChallenges: Record<string, string> = {
  'hollow-reach': 'Give independent rover orders, then conserve and deliver a charged battery after arrival.',
  'siltwater-reach': 'Borrow two land tiles to construct a missing crossing without cutting off the return cargo route.',
  'woodland-workshop': 'Replant two trees without sealing a corridor, then open a boxed-in loading pocket with Dozer.',
  'bramble-crossing': 'Build a combat specialist from a finite kit and protect a narrow crossing before advancing.',
  'rough-ridge': 'Use a rough-terrain specialist first, then engineer a different route to escort the original Snail.',
  'ancient-valley': 'Pair combat with mobile repair against different predators and conserve their salvage for a reserve.',
};
const meadow = [original('hollow-reach'), meadowAdditions[0], original('siltwater-reach'), meadowAdditions[1], original('woodland-workshop'),
  meadowAdditions[2], meadowAdditions[3], meadowAdditions[4], original('bramble-crossing'), ...meadowAdditions.slice(5)];
const sunstone = [original('rough-ridge'), ...sunstoneAdditions.slice(0, 4), original('ancient-valley'), ...sunstoneAdditions.slice(4)];
export const missions: CampaignMission[] = ([['meadow-isles', meadow], ['sunstone-range', sunstone], ['open-sea', seaMissions]] as const)
  .flatMap(([world, levels]) => levels.map(m => ({ ...m, world, challenge: m.challenge ?? introductoryChallenges[m.id] })));
export const createMission = (mission: Mission) => new Simulation(mission.grid, mission.rovers, { piles: mission.piles, goals: mission.goals, bonus: mission.bonus, blueprints: mission.blueprints, enemies: mission.enemies, seed: mission.seed });
