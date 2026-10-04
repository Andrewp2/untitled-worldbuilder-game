import { partKinds, type PartKind, type Supplies } from '../core/catalog';

export type WreckPiece = { picture: PartKind | 'battery' | 'soil'; empty: boolean };

/** A bounded sample of the actual salvage, including each material present. */
export function wreckPieces(supplies: Supplies): WreckPiece[] {
  const groups = partKinds.filter(part => supplies[part] > 0).map(part =>
    Array.from({ length: Math.min(3, supplies[part]) }, () => ({ picture: part, empty: false } as WreckPiece)));
  if (supplies.batteries.length) groups.push(supplies.batteries.slice(0, 3).map(charge => ({ picture: 'battery', empty: charge === 0 })));
  if (supplies.soil) groups.push([{ picture: 'soil', empty: false }]);
  return [0, 1, 2].flatMap(index => groups.flatMap(group => group[index] ? [group[index]] : [])).slice(0, 16);
}

/** Scatter above the death position, bounce once, then reveal the real pile. */
export function wreckPose(index: number, count: number, elapsed: number, reducedMotion: boolean) {
  const t = Math.max(0, Math.min(1, elapsed / (reducedMotion ? .25 : .85)));
  if (reducedMotion) return { x: 0, y: 0, lift: 0, rotation: 0, alpha: 0, travel: 1, done: t === 1 };
  const angle = index * Math.PI * 2 / Math.max(1, count) + .4;
  const radius = 19 + index % 3 * 4;
  const travel = 1 - Math.pow(1 - t, 3);
  const flight = Math.min(1, t / .72);
  const lift = t < .72 ? 14 * (1 - flight) + (29 + index % 3 * 7) * 4 * flight * (1 - flight)
    : 5 * Math.sin(Math.PI * (t - .72) / .28);
  return { x: Math.cos(angle) * radius * travel, y: Math.sin(angle) * radius * .5 * travel,
    lift, rotation: (index % 2 ? 1 : -1) * t * 2.6,
    alpha: Math.min(1, (1 - t) / .24), travel, done: t === 1 };
}
