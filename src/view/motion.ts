import type { UnitKind, EnemyKind } from '../core/catalog';

/** Each physical grid step takes off and lands; idle machines never hover. */
export function stepPose(kind: UnitKind | EnemyKind, moving: boolean, progress: number, reducedMotion: boolean, wet = false) {
  if (!moving || reducedMotion) return { lift: 0, rock: 0, squash: 1, shadowScale: 1, shadowAlpha: 1 };
  const t = Math.max(0, Math.min(1, progress));
  const arc = Math.sin(Math.PI * t);
  const water = ['fish', 'shark', 'tug', 'freighter', 'patrolboat', 'water-crab'].includes(kind) || kind === 'duck' && wet;
  const height = kind === 'duck' ? wet ? .35 : 1.8 : water ? .7 : kind === 'snail' ? .25 : kind === 'frog' ? 8 : kind === 'scoop' || kind === 'dumptruck' || kind === 'dozer' ? 2 : kind === 'scout' || kind === 'trailbuggy' ? 6 : kind === 'hauler' ? 3.5 : kind === 'warden' ? 2.8 : 1.5;
  const lift = arc * height;
  const rock = Math.sin((kind === 'duck' && !wet ? 4 : 2) * Math.PI * t) * arc * (kind === 'duck' ? wet ? .025 : .065 : kind === 'fish' || kind === 'shark' ? .055 : kind === 'hauler' ? .035 : kind === 'warden' ? .018 : .025);
  return { lift, rock, squash: 1 - Math.sin(2 * Math.PI * t) * (kind === 'snail' ? .045 : kind === 'frog' ? .08 : .018), shadowScale: 1 - lift * .018, shadowAlpha: 1 - lift * .035 };
}

export type PersonalityContext = { clock: number; phase?: number; threat?: boolean; work?: number; alert?: number };
/** Idle gestures stay planted. Work and threat reactions share the frozen scene clock. */
export function personalityPose(kind: UnitKind | EnemyKind, moving: boolean, reducedMotion: boolean, context: PersonalityContext) {
  const neutral = { reaction: '' as '' | 'look-left' | 'look-right' | 'tucked', rock: 0, dip: 0, scaleX: 1, scaleY: 1 };
  if (kind === 'snail' && context.threat) neutral.reaction = 'tucked';
  if (reducedMotion) return neutral;
  const phase = context.clock + (context.phase ?? 0);
  const beat = ((phase % 8) + 8) % 8;
  if (kind === 'duck' && !moving) {
    if (beat > 5 && beat < 5.75) neutral.reaction = 'look-left';
    else if (beat > 6.05 && beat < 6.8) neutral.reaction = 'look-right';
  }
  if (!moving && ['bristleback', 'crab', 'water-crab', 'scorpion', 'gator', 'trex', 'shark'].includes(kind) && !context.alert) {
    const sniff = beat > 5 && beat < 6 ? Math.sin((beat - 5) * Math.PI) : 0;
    neutral.dip = sniff * 1.8; neutral.rock = sniff * .022;
  }
  if (context.work !== undefined) {
    const strain = Math.sin(Math.PI * Math.max(0, Math.min(1, context.work)));
    neutral.dip += strain * (kind === 'scoop' ? 5 : 2);
    neutral.rock += strain * (kind === 'dozer' ? -.035 : .02);
    neutral.scaleY -= strain * .025;
  }
  if (context.alert) {
    const startle = Math.sin(Math.PI * Math.max(0, Math.min(1, context.alert)));
    neutral.scaleX -= startle * .04; neutral.scaleY += startle * .07;
  }
  return neutral;
}

/** A single short reward beat, followed by the existing completion choices. */
export function rewardPose(elapsed: number, reducedMotion: boolean) {
  const duration = reducedMotion ? .35 : 1.25;
  const t = Math.max(0, Math.min(1, elapsed / duration));
  const rise = reducedMotion ? 0 : 76 * (1 - Math.pow(1 - t, 3));
  return { done: t === 1, rise, alpha: t < .65 ? 1 : (1 - t) / .35, scale: reducedMotion ? 1 : .8 + .2 * Math.min(1, t * 5) };
}
