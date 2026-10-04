import type { UnitDefinition } from '../core/catalog';
import type { Grid } from '../core/grid';
import { Simulation, type BonusObjective, type BlueprintStock, type BlueprintPickup, type EnemyDefinition, type Pile, type Goal } from '../core/simulation';
import { brambleCrossing, crossingRovers, crossingPiles, crossingGoals, crossingEnemies } from './bramble-crossing';
import { rosterMissions } from './roster-missions';
import { meadowAdditions } from './meadow-isles';
import { sunstoneAdditions } from './sunstone-range';
import { seaMissions } from './open-sea';
import { openingMissions } from './opening';

export type Mission = { challenge?: string; id: string; name: string; goal: string; brief: string; grid: Grid; rovers: UnitDefinition[]; piles: Pile[]; goals: Goal[]; bonus: BonusObjective; enemies: EnemyDefinition[]; blueprints: BlueprintStock; blueprintPickups?: BlueprintPickup[]; seed: number };
const originalMissions: Mission[] = [
  { id: 'bramble-crossing', name: 'Bramble Crossing', goal: 'Clear the crossing · reach East', brief: 'Collect the blue Warden plan beside camp, then build beside the Warden kit. Move it near the Bristleback to fight automatically, then move a rover onto the East flag. Battery charge powers movement and absorbs damage; wrecks leave an empty installed battery. After East, find Arborbot’s plan. Scout’s yellow/green kit plus the camp red/green pieces can build the tree mover. Bring an eastern tree to the garden star.',
    grid: brambleCrossing, rovers: crossingRovers, piles: crossingPiles, goals: crossingGoals,
    bonus: { kind: 'arrival', name: 'Bramble garden', description: 'Bring an eastern tree to the garden with Arborbot.', cell: { x: 17, y: 10 }, kinds: ['arborbot'], carryingTree: true },
    enemies: crossingEnemies, blueprints: {}, seed: 20260929,
    blueprintPickups: [{ blueprint: 'warden', cell: { x: 3, y: 6 } }, { blueprint: 'arborbot', cell: { x: 16, y: 9 }, afterMain: true }] },
  ...rosterMissions,
];
export type WorldId = 'meadow-isles' | 'sunstone-range' | 'open-sea';
export type CampaignMission = Mission & { world: WorldId; challenge: string };
const original = (id: string): Mission => originalMissions.find(m => m.id === id)!;
const introductoryChallenges: Record<string, string> = {
  'bramble-crossing': 'Build a combat specialist from a finite kit and protect a narrow crossing before advancing.',
  'rough-ridge': 'Use a rough-terrain specialist first, then engineer a different route to escort the original Snail.',
  'ancient-valley': 'Pair combat with mobile repair against different predators and conserve their salvage for a reserve.',
};
const meadow = [...openingMissions, meadowAdditions[0], original('bramble-crossing'), ...meadowAdditions.slice(1)];
const sunstone = [original('rough-ridge'), ...sunstoneAdditions.slice(0, 4), original('ancient-valley'), ...sunstoneAdditions.slice(4)];
export const missions: CampaignMission[] = ([['meadow-isles', meadow], ['sunstone-range', sunstone], ['open-sea', seaMissions]] as const)
  .flatMap(([world, levels]) => levels.map(m => ({ ...m, world, challenge: m.challenge ?? introductoryChallenges[m.id] })));
export const createMission = (mission: Mission) => new Simulation(mission.grid, mission.rovers, { piles: mission.piles, goals: mission.goals, bonus: mission.bonus, blueprints: mission.blueprints, blueprintPickups: mission.blueprintPickups, enemies: mission.enemies, seed: mission.seed });
