import { describe, expect, it } from 'vitest';
import { missions } from '../src/levels/missions';
import { objectiveDisplays } from '../src/view/objectives';

const mission = (id: string) => missions.find(mission => mission.id === id)!;

describe('pictured mission requirements', () => {
  it('shows either valid tool without revealing the bonus before the main', () => {
    const level = mission('stone-gate');
    const visible = objectiveDisplays(level, [], false, false);
    expect(visible).toHaveLength(1);
    expect(visible[0]).toMatchObject({ marker: 'flag', models: ['dozer', 'scoop'], original: false, carryingTree: false });
    expect(visible[0].label).not.toContain(level.bonus.name);
    const bonus = objectiveDisplays(level, ['gate'], true, false);
    expect(bonus).toHaveLength(1);
    expect(bonus[0]).toMatchObject({ marker: 'star', models: ['arborbot'], carryingTree: true, complete: false });
  });

  it('identifies the authored rescue target rather than an arbitrary live creature', () => {
    const visible = objectiveDisplays(mission('flat-battery'), [], false, false)[0];
    expect(visible).toMatchObject({ models: ['scout'], original: true });
    expect(visible.label).toContain('Original Scout');
  });

  it('keeps convoy colors and charged cargo batteries distinct from installed power', () => {
    const visible = objectiveDisplays(mission('three-tides'), [], false, false)[0];
    expect(visible.models).toEqual(['dumptruck', 'forklift']);
    expect(visible.cargo).toMatchObject({ green: 6, battery: 1 });
    expect(visible.minimumCharge).toBeUndefined();
    expect(visible.label).toContain('cargo batteries must have charge');
  });

  it('pictures the original bonus creature and its minimum remaining charge', () => {
    const level = mission('gator-backwater');
    const target = objectiveDisplays(level, level.goals.map(goal => goal.id), true, false)[0];
    expect(target).toMatchObject({ marker: 'star', original: true, models: ['frog'], minimumCharge: 60 });
    expect(objectiveDisplays(level, [], true, true)[0].complete).toBe(true);
    // Starting a replay hides the bonus again despite previously earned awards.
    expect(objectiveDisplays(level, [], false, false)[0].marker).toBe('flag');
  });
});
