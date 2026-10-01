import Phaser from 'phaser';
import type { Cell } from '../core/grid';
import { enemyKinds, type UnitKind, type EnemyKind } from '../core/catalog';
import { groundOrigin, GROUND_SHADOW_DEPTH, worldDepth } from './grounding';
import { facingPicture } from './facing';
import { stepPose } from './motion';

export const TOY_BACKGROUND = '#063361';
export const artUrl = (name: string) => `/art/toy-world/${name}.png`;
type ToyKind = UnitKind | EnemyKind;
const objects = ['flag', 'soil', 'relay', 'connector'];

/** Both scenes use the same texture cache, including after a mission replay. */
export function preloadToyArt(scene: Phaser.Scene): void {
  for (const name of objects) {
    if (!scene.textures.exists(`toy-${name}`)) scene.load.image(`toy-${name}`, artUrl(name));
  }
}

export function toyImage(scene: Phaser.Scene, name: string, size: number): Phaser.GameObjects.Image {
  const origin = groundOrigin(name);
  return scene.add.image(0, 0, `toy-${name}`, '__BASE').setDisplaySize(size, size).setOrigin(origin.x, origin.y);
}

/** Contact stays on the terrain, below every upright object, with a soft edge. */
export function groundShadow(scene: Phaser.Scene, width: number, height: number): Phaser.GameObjects.Graphics {
  const shadow = scene.add.graphics().setDepth(GROUND_SHADOW_DEPTH);
  for (const [scale, opacity] of [[1, .035], [.85, .045], [.7, .055], [.55, .075]]) {
    shadow.fillStyle(0x173414, opacity);
    shadow.fillEllipse(0, 0, width * scale, height * scale);
  }
  return shadow;
}

export type ToyActor = {
  root: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Graphics;
  size: number;
  kind: ToyKind;
};
export function toyActor(scene: Phaser.Scene, kind: ToyKind, size = 96): ToyActor {
  const root = scene.add.container();
  const shadow = groundShadow(scene, size * .8, size * .32);
  const body = toyImage(scene, `${kind}-se`, size);
  root.add(body);
  root.once(Phaser.GameObjects.Events.DESTROY, () => shadow.destroy());
  return { root, body, shadow, size, kind };
}

/** Motion is presentation only: destinations, energy and collision remain in the simulation. */
export function poseToy(actor: ToyActor, position: Cell, facing: Cell, moving: boolean, charge: number, progress: number, reducedMotion: boolean): number {
  const { body, root, kind, size } = actor;
  const picture = `${kind}-${facingPicture(facing)}`;
  body.setTexture(`toy-${picture}`).setDisplaySize(size, size);
  const origin = groundOrigin(picture);
  body.setOrigin(origin.x, origin.y);
  root.setPosition(position.x, position.y).setDepth(worldDepth(position, enemyKinds.includes(kind as EnemyKind) ? 'enemy' : 'rover'));
  const pose = stepPose(kind, moving, progress, reducedMotion);
  actor.shadow.setPosition(position.x, position.y).setScale(pose.shadowScale).setAlpha(pose.shadowAlpha);
  body.setPosition(0, -pose.lift);
  body.setScale(size / 384, size / 384 * pose.squash);
  body.setRotation(pose.rock);
  if (charge === 0) body.setTint(0xa8b2bc); else body.clearTint();
  return pose.lift;
}

export function drawStar(graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, color = 0xffdc59): void {
  const points = Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? radius * .46 : radius;
    return new Phaser.Math.Vector2(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  });
  graphics.fillStyle(color); graphics.lineStyle(2, 0x123b65);
  graphics.fillPoints(points, true); graphics.strokePoints(points, true);
}

export type ToyFlag = { root: Phaser.GameObjects.Container; cloth: Phaser.GameObjects.Image };
/** Animate the cloth around its fastening point while the mast stays planted. */
export function toyFlag(scene: Phaser.Scene, size: number): ToyFlag {
  const texture = scene.textures.get('toy-flag');
  if (!texture.has('cloth')) {
    texture.add('cloth', 0, 208, 90, 130, 130);
    texture.add('mast', 0, 0, 0, 208, 225);
    texture.add('base', 0, 0, 225, 384, 159);
  }
  const root = scene.add.container();
  // Each frame owns its origin. Phaser 4 crops change rendered dimensions,
  // so a crop of the full image would shift the planted mast and base.
  root.add(scene.add.image(0, 0, 'toy-flag', 'mast').setOrigin(192 / 208, 322 / 225).setDisplaySize(208 * size / 384, 225 * size / 384));
  root.add(scene.add.image(0, 0, 'toy-flag', 'base').setOrigin(.5, 97 / 159).setDisplaySize(size, 159 * size / 384));
  const cloth = scene.add.image(16 * size / 384, -217 * size / 384, 'toy-flag', 'cloth')
    .setOrigin(0, 15 / 130).setDisplaySize(130 * size / 384, 130 * size / 384);
  root.add(cloth);
  return { root, cloth };
}
export function waveFlag(flag: ToyFlag, clock: number, reducedMotion: boolean): void {
  const scale = flag.cloth.scaleY;
  flag.cloth.setScale(scale * (reducedMotion ? 1 : 1 + Math.sin(clock * 3) * .045), scale);
  flag.cloth.setRotation(reducedMotion ? 0 : Math.sin(clock * 3 + .6) * .025);
}
