import type { UnitKind, EnemyKind } from '../core/catalog';

/** Each physical grid step takes off and lands; idle machines never hover. */
export function stepPose(kind: UnitKind | EnemyKind, moving: boolean, progress: number, reducedMotion: boolean) {
  if (!moving || reducedMotion) return { lift: 0, rock: 0, squash: 1, shadowScale: 1, shadowAlpha: 1 };
  const t = Math.max(0, Math.min(1, progress));
  const arc = Math.sin(Math.PI * t);
  const water = ['fish', 'shark', 'tug', 'freighter', 'patrolboat', 'water-crab'].includes(kind);
  const height = water ? 1.3 : kind === 'snail' ? .8 : kind === 'frog' ? 8 : kind === 'scoop' || kind === 'dumptruck' || kind === 'dozer' ? 2 : kind === 'scout' || kind === 'trailbuggy' ? 6 : kind === 'hauler' ? 3.5 : kind === 'warden' ? 2.8 : 5;
  const lift = arc * height;
  const rock = Math.sin(2 * Math.PI * t) * arc * (kind === 'hauler' ? .035 : kind === 'warden' ? .018 : .025);
  return { lift, rock, squash: 1 - Math.sin(2 * Math.PI * t) * .018, shadowScale: 1 - lift * .018, shadowAlpha: 1 - lift * .035 };
}

/** A single short reward beat, followed by the existing completion choices. */
export function rewardPose(elapsed: number, reducedMotion: boolean) {
  const duration = reducedMotion ? .35 : 1.25;
  const t = Math.max(0, Math.min(1, elapsed / duration));
  const rise = reducedMotion ? 0 : 76 * (1 - Math.pow(1 - t, 3));
  return { done: t === 1, rise, alpha: t < .65 ? 1 : (1 - t) / .35, scale: reducedMotion ? 1 : .8 + .2 * Math.min(1, t * 5) };
}
