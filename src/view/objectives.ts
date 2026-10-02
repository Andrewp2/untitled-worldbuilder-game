import { describeCost, unitSpecs, type Cost, type UnitKind } from '../core/catalog';
import type { BonusObjective, Goal } from '../core/simulation';
import type { Mission } from '../levels/missions';

export type ObjectiveDisplay = {
  marker: 'flag' | 'star'; complete: boolean; label: string;
  models: readonly UnitKind[]; original: boolean; carryingTree: boolean;
  minimumCharge?: number; cargo?: Cost; clearEnemies: boolean;
};

/** Describe the authored target, even if its original creature has been lost. */
function display(goal: Goal | BonusObjective, mission: Pick<Mission, 'rovers'>, bonus: boolean, complete: boolean): ObjectiveDisplay {
  const original = goal.unitId ? mission.rovers.find(unit => unit.id === goal.unitId) : undefined;
  const models = original ? [original.kind] : goal.kinds ?? [];
  const subject = models.map(kind => unitSpecs[kind].name).join(' or ') || 'a mobile creature';
  const tree = 'carryingTree' in goal && !!goal.carryingTree;
  const minimumCharge = 'minimumCharge' in goal ? goal.minimumCharge : undefined;
  const cargo = 'cargo' in goal && goal.cargo ? { ...goal.cargo, battery: goal.cargo.chargedBatteries } : undefined;
  const requirements = [
    `${goal.unitId ? 'Original ' : ''}${subject}`,
    ...(tree ? ['carrying a tree'] : []),
    ...(cargo ? [`carrying ${describeCost(cargo)}${cargo.battery ? '; cargo batteries must have charge' : ''}`] : []),
    ...(minimumCharge ? [`at least ${minimumCharge} battery charge`] : []),
    ...(goal.clearEnemies ? ['clear all enemies'] : []),
  ];
  return { marker: bonus ? 'star' : 'flag', complete, label: `${goal.name}${complete ? ' — reached' : ''}: ${requirements.join(' · ')}`,
    models, original: !!goal.unitId, carryingTree: tree, minimumCharge, cargo, clearEnemies: !!goal.clearEnemies };
}

export function objectiveDisplays(mission: Pick<Mission, 'rovers' | 'goals' | 'bonus'>, reached: readonly string[], bonusUnlocked: boolean, bonusReached: boolean): ObjectiveDisplay[] {
  return bonusUnlocked
    ? [display(mission.bonus, mission, true, bonusReached)]
    : mission.goals.map(goal => display(goal, mission, false, reached.includes(goal.id)));
}
