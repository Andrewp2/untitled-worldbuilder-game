import { describe, expect, it } from 'vitest';
import { stepPose, rewardPose, personalityPose } from '../src/view/motion';
import { patrolRoute, residentHomes } from '../src/view/world-residents';
import { unitSpecs, unitKinds, enemyKinds } from '../src/core/catalog';
import { walkable } from '../src/core/grid';
import { worlds } from '../src/levels/world-map';

describe('toy movement and reward timing', () => {
  it('gives creatures different land and water motion, with neutral takeoff and landing', () => {
    expect(stepPose('duck', true, .5, false, true).lift).toBeLessThan(stepPose('duck', true, .5, false).lift);
    expect(stepPose('snail', true, .5, false).lift).toBeLessThan(1);
    expect(stepPose('frog', true, .5, false).lift).toBeGreaterThan(stepPose('scout', true, .5, false).lift);
    for (const kind of ['duck', 'snail', 'frog', 'fish'] as const) for (const wet of [false, true]) for (const t of [0, 1]) {
      expect(stepPose(kind, true, t, false, wet).lift).toBeCloseTo(0);
      expect(stepPose(kind, true, t, false, wet).squash).toBeCloseTo(1);
    }
  });
  it('keeps threat feedback in reduced motion and quiets idle, work and notice gestures', () => {
    expect(personalityPose('snail', false, true, { clock: 5.5, threat: true }).reaction).toBe('tucked');
    expect(personalityPose('snail', false, false, { clock: 5.5 }).reaction).toBe('');
    expect(personalityPose('duck', false, false, { clock: 5.5 }).reaction).toBe('look-left');
    expect(personalityPose('duck', true, false, { clock: 5.5 }).reaction).toBe('');
    for (const kind of ['duck', 'scoop', 'dozer', 'bristleback'] as const) {
      expect(personalityPose(kind, false, true, { clock: 5.5, work: .5, alert: .5 }))
        .toEqual({ reaction: '', rock: 0, dip: 0, scaleX: 1, scaleY: 1 });
    }
    const work = personalityPose('scoop', false, false, { clock: 3, work: .5 });
    expect(work.dip).toBeGreaterThan(0);
    expect(personalityPose('scoop', false, false, { clock: 3, work: .5 })).toEqual(work);
  });
  it('lands at both ends of every step and stays planted when idle or motion is reduced', () => {
    for (const kind of [...unitKinds, ...enemyKinds]) {
      for (const progress of [0, 1]) expect(stepPose(kind, true, progress, false).lift).toBeCloseTo(0);
      for (const progress of [.1, .5, .9]) {
        expect(stepPose(kind, false, progress, false).lift).toBe(0);
        expect(stepPose(kind, true, progress, true)).toEqual(stepPose(kind, false, progress, false));
      }
    }
  });
  it('gives the heavy rover a lower hop while its shadow remains visible and bounded', () => {
    expect(stepPose('hauler', true, .5, false).lift).toBeLessThan(stepPose('scout', true, .5, false).lift);
    for (let i = 0; i <= 100; i++) {
      const pose = stepPose('scout', true, i / 100, false);
      expect(pose.lift).toBeGreaterThanOrEqual(0);
      expect(pose.shadowAlpha).toBeGreaterThan(.5); expect(pose.shadowScale).toBeGreaterThan(.75);
    }
  });
  it('shows a rising star before ending the reward beat; reduced motion keeps the same reward without travel', () => {
    expect(rewardPose(0, false).alpha).toBe(1);
    expect(rewardPose(.6, false).rise).toBeGreaterThan(0);
    expect(rewardPose(.6, false).done).toBe(false);
    expect(rewardPose(2, false)).toMatchObject({ done: true, alpha: 0 });
    expect(rewardPose(.2, true)).toMatchObject({ rise: 0, done: false });
    expect(rewardPose(.4, true)).toMatchObject({ rise: 0, done: true });
  });
  it('keeps every resident patrol on connected terrain it can use', () => {
    for (const home of residentHomes) {
      const worldMap = worlds.find(world => world.id === home.world)!.grid;
      for (const patrol of home.patrols) {
        const route = patrolRoute(worldMap, patrol.waypoints, unitSpecs[patrol.kind].mobility);
        expect(route.length).toBeGreaterThan(1);
        route.forEach((cell, i) => {
          expect(walkable(worldMap, cell, unitSpecs[patrol.kind].mobility)).toBe(true);
          const next = route[(i + 1) % route.length];
          expect(Math.abs(cell.x - next.x) + Math.abs(cell.y - next.y)).toBe(1);
        });
      }
    }
  });
});
