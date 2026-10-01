import type Phaser from 'phaser';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { unitKinds, enemyKinds, materials, load, type Supplies, type UnitKind } from '../core/catalog';
import { directions } from './facing';

// One model, camera and planted origin for every view. The camera elevation is
// 30 degrees: a ground-plane axis projects with exactly the grid's 1:2 slope.
export const MODEL_SIZE = 384;
export const MODEL_ORIGIN = { x: 192, y: 280 };
export const MODEL_TILE_WIDTH = 320;
export const modelKinds = [...unitKinds, ...enemyKinds, 'battery', 'tires', 'soil', 'rocks', 'tree', 'tree-small', 'red', 'blue', 'yellow', 'green'] as const;
export type ModelKind = typeof modelKinds[number];
const portraits = new Map<string, string>();
export const modelPortrait = (name: string): string | undefined => portraits.get(name);
export const isModelPicture = (name: string): boolean => modelKinds.includes(name.replace(/-(se|sw|nw|ne)$/, '') as ModelKind);
export const partColors = { red: 0xec5246, blue: 0x3d9cdf, yellow: 0xffd64a, green: 0x87c73f };

export function modelCamera(): THREE.OrthographicCamera {
  const span = MODEL_SIZE / (MODEL_TILE_WIDTH / Math.SQRT2);
  const targetY = (MODEL_ORIGIN.y - MODEL_SIZE / 2) / (MODEL_SIZE / span * Math.cos(Math.PI / 6));
  const camera = new THREE.OrthographicCamera(-span / 2, span / 2, span / 2, -span / 2, .1, 50);
  camera.position.set(6, Math.sqrt(24) + targetY, 6);
  camera.lookAt(0, targetY, 0);
  camera.updateMatrixWorld();
  return camera;
}

export function addModelCargo(model: THREE.Group, kind: UnitKind, supplies: Supplies, carryingTree = false): void {
  const [x, floor, width] = kind === 'hauler' ? [-.14, .44, .31] : kind === 'dumptruck' ? [-.15, .45, .30]
    : kind === 'forklift' ? [.40, .18, .25] : kind === 'freighter' ? [-.14, .25, .31]
    : kind === 'tug' ? [.17, .24, .24] : kind === 'warden' ? [-.12, .55, .18] : [-.17, .37, .24];
  let index = 0;
  const cargo = new THREE.Group(); cargo.name = 'cargo'; model.add(cargo);
  const slot = () => {
    const i = index++, columns = 2, row = Math.floor(i / columns) % 2, tier = Math.floor(i / 4);
    return [x + (row - .5) * width / 2, floor + .045 + tier * .085, (i % columns - .5) * width / 2] as [number, number, number];
  };
  for (const color of materials) for (let i = 0; i < supplies[color] && index < 12; i++) {
    const at = slot(); box(cargo, partColors[color], [.13, .075, .12], at, .013);
    cylinder(cargo, partColors[color], .026, .012, [at[0], at[1] + .043, at[2]]);
  }
  for (let i = 0; i < supplies.tires && index < 12; i++) {
    const at = slot(), tire = toyModel('tires'); tire.scale.setScalar(.30); tire.position.set(at[0], at[1] - .02, at[2]); cargo.add(tire);
  }
  for (const _charge of supplies.batteries.slice(0, Math.max(0, 12 - index))) {
    const at = slot(); const cell = new THREE.Group(); battery(cell, 0, 0, .32); cell.position.set(...at); cargo.add(cell);
  }
  if (supplies.soil) {
    const dirt = toyModel('soil'); dirt.scale.setScalar(.60); dirt.position.set(.5, .13, 0); cargo.add(dirt);
  }
  if (carryingTree) {
    const tree = toyModel('tree-small'); tree.scale.setScalar(.46); tree.position.set(.37, .28, 0); cargo.add(tree);
  }
}

function material(color: number, roughness = .38): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: .04 });
}
function piece(group: THREE.Group, geometry: THREE.BufferGeometry, color: number, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material(color));
  mesh.position.set(x, y, z); group.add(mesh); return mesh;
}
function box(group: THREE.Group, color: number, size: [number, number, number], at: [number, number, number], radius = .035): THREE.Mesh {
  return piece(group, new RoundedBoxGeometry(...size, 3, Math.min(radius, ...size.map(v => v / 3))), color, ...at);
}
function ball(group: THREE.Group, color: number, radius: number, at: [number, number, number]): THREE.Mesh {
  return piece(group, new THREE.SphereGeometry(radius, 20, 12), color, ...at);
}
function cylinder(group: THREE.Group, color: number, radius: number, length: number, at: [number, number, number], axis: 'x' | 'y' | 'z' = 'y'): THREE.Mesh {
  const mesh = piece(group, new THREE.CylinderGeometry(radius, radius, length, 24), color, ...at);
  if (axis === 'x') mesh.rotation.z = Math.PI / 2;
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  return mesh;
}
function wheels(group: THREE.Group, accent: number, spacing = .3, radius = .155): void {
  for (const x of [-spacing, spacing]) for (const z of [-.3, .3]) {
    cylinder(group, 0x242e37, radius, .145, [x, radius, z], 'z');
    cylinder(group, accent, radius * .55, .151, [x, radius, z], 'z');
    cylinder(group, 0x153a43, radius * .21, .158, [x, radius, z], 'z');
  }
  box(group, 0x263c46, [.7, .09, .42], [0, .19, 0]);
}
/** Jointed walking supports distinguish bots from the wheeled cars. */
function walkingLegs(group: THREE.Group, accent: number): void {
  for (const x of [-.23, .23]) for (const sign of [-1, 1]) {
    ball(group, accent, .065, [x, .25, sign * .23]);
    const shin = box(group, 0x274c5b, [.085, .22, .085], [x, .16, sign * .29]);
    shin.rotation.x = sign * .23;
    ball(group, accent, .05, [x, .10, sign * .31]);
    box(group, accent, [.19, .07, .17], [x + .025, .035, sign * .32]);
  }
}
function eyes(group: THREE.Group, x: number, y: number): void {
  box(group, 0xeaf4e7, [.065, .155, .43], [x, y, 0], .02);
  for (const z of [-.12, .12]) {
    ball(group, 0xffffff, .069, [x + .025, y + .005, z]);
    ball(group, 0x243337, .038, [x + .076, y + .002, z]);
    ball(group, 0xffffff, .013, [x + .102, y + .021, z - .006]);
  }
}
function battery(group: THREE.Group, x: number, y: number, scale = 1): void {
  cylinder(group, 0x2278c6, .073 * scale, .42 * scale, [x, y, 0], 'z');
  for (const sign of [-1, 1]) {
    cylinder(group, 0xb5cbd0, .076 * scale, .024 * scale, [x, y, sign * .18 * scale], 'z');
    cylinder(group, 0x183a55, .078 * scale, .05 * scale, [x, y, sign * .215 * scale], 'z');
  }
  cylinder(group, 0x96afb9, .032 * scale, .03 * scale, [x, y, .25 * scale], 'z');
}

function animalEyes(group: THREE.Group, x: number, y: number, spacing = .13): void {
  for (const sign of [-1, 1]) {
    ball(group, 0xf9f2d8, .06, [x, y, sign * spacing]);
    ball(group, 0x173b45, .032, [x + .045, y, sign * spacing]);
    ball(group, 0xffffff, .01, [x + .066, y + .016, sign * spacing]);
  }
}
function oval(group: THREE.Group, color: number, radius: number, at: [number, number, number], scale: [number, number, number]): void {
  ball(group, color, radius, at).scale.set(...scale);
}
function fins(group: THREE.Group, color: number, x: number, y: number, size = .16): void {
  const shape = new THREE.Shape(); shape.moveTo(-size / 2, 0); shape.lineTo(size / 2, 0); shape.lineTo(-size / 3, size); shape.closePath();
  piece(group, new THREE.ExtrudeGeometry(shape, { depth: .035, bevelEnabled: false }), color, x, y, -.0175);
}
/** New roster models share the established molded forms, daylight and tile camera. */
function rosterModel(kind: ModelKind): THREE.Group | null {
  const group = new THREE.Group();
  if (kind === 'trailbuggy' || kind === 'dozer' || kind === 'forklift' || kind === 'dumptruck' || kind === 'arborbot' || kind === 'mender') {
    const colors = { trailbuggy: 0xe99b38, dozer: 0xf4c347, forklift: 0xeca13d, dumptruck: 0xf18b37, arborbot: 0x83b853, mender: 0x66bec6 };
    const color = colors[kind];
    if (kind === 'arborbot' || kind === 'mender') walkingLegs(group, kind === 'mender' ? 0xf6e4a0 : 0x2a8893);
    else wheels(group, 0x2a8893, .26, kind === 'trailbuggy' ? .18 : .145);
    box(group, color, [.67, .17, .48], [0, .29, 0]);
    if (kind === 'trailbuggy') {
      box(group, color, [.25, .15, .43], [.23, .43, 0]); eyes(group, .365, .43); battery(group, -.24, .46);
      for (const z of [-.20, .20]) cylinder(group, 0x245665, .023, .24, [-.025, .50, z]);
      cylinder(group, 0x245665, .023, .44, [-.025, .62, 0], 'z');
    } else if (kind === 'dozer') {
      box(group, 0x277e89, [.28, .26, .35], [-.14, .47, 0]); box(group, color, [.34, .06, .40], [-.14, .63, 0]);
      eyes(group, .32, .38); battery(group, -.23, .39, .8);
      for (const z of [-.21, .21]) box(group, 0x37616a, [.30, .055, .06], [.27, .22, z]);
      box(group, color, [.09, .25, .68], [.46, .18, 0]);
      box(group, 0xf7e5a2, [.07, .04, .68], [.49, .075, 0]);
    } else if (kind === 'forklift') {
      box(group, 0x216275, [.13, .60, .43], [.21, .38, 0]);
      for (const z of [-.18, .18]) box(group, 0xd9e4d5, [.27, .045, .07], [.40, .15, z]);
      box(group, color, [.24, .21, .40], [-.18, .44, 0]); eyes(group, -.05, .49); battery(group, -.26, .39, .7);
    } else if (kind === 'dumptruck') {
      for (const z of [-.30, .30]) cylinder(group, 0x28343c, .145, .145, [0, .145, z], 'z');
      box(group, 0xf9b44d, [.25, .26, .43], [.24, .45, 0]); eyes(group, .38, .43);
      box(group, 0xc86127, [.45, .07, .49], [-.15, .40, 0]);
      for (const z of [-.235, .235]) box(group, color, [.48, .22, .065], [-.15, .53, z]);
      for (const x of [-.36, .055]) box(group, color, [.065, .22, .50], [x, .53, 0]);
    } else if (kind === 'arborbot') {
      box(group, 0x558e40, [.36, .30, .39], [-.12, .46, 0]); eyes(group, .18, .46); battery(group, -.25, .59, .75);
      for (const sign of [-1, 1]) {
        const arm = box(group, 0x438c93, [.35, .065, .065], [.24, .34, sign * .23]); arm.rotation.y = sign * .2;
        box(group, color, [.12, .16, .055], [.38, .36, sign * .18]);
      }
      cylinder(group, 0xf6dd67, .023, .21, [-.18, .72, -.12]); ball(group, 0xf6dd67, .045, [-.18, .85, -.12]);
    } else {
      box(group, 0xe5f0de, [.36, .25, .40], [0, .47, 0]); eyes(group, .33, .40); battery(group, -.25, .49);
      box(group, 0x2e9198, [.06, .22, .04], [.05, .54, .225]); box(group, 0x2e9198, [.19, .065, .04], [.05, .54, .225]);
      for (const z of [-.15, .15]) { cylinder(group, color, .018, .20, [-.13, .70, z]); ball(group, 0xffdb74, .04, [-.13, .82, z]); }
    }
  } else if (kind === 'snail') {
    oval(group, 0xa8cc72, .27, [.02, .095, 0], [1.55, .35, .70]);
    ball(group, 0xa8cc72, .13, [.29, .21, 0]); oval(group, 0xb188c6, .25, [-.10, .33, 0], [1, 1, .78]);
    for (const z of [-.20, .20]) {
      const spiral = piece(group, new THREE.TorusGeometry(.13, .025, 8, 28, Math.PI * 1.7), 0x785b9d, -.10, .33, z); spiral.rotation.z = .4;
      ball(group, 0x785b9d, .046, [-.10, .33, z]);
    }
    for (const z of [-.08, .08]) cylinder(group, 0xa8cc72, .02, .13, [.30, .36, z]); animalEyes(group, .31, .44, .08);
  } else if (kind === 'frog') {
    for (const sign of [-1, 1]) {
      oval(group, 0x78ad49, .13, [-.20, .13, sign * .19], [1.2, 1, 1]);
      box(group, 0x9ece5b, [.22, .07, .15], [-.16, .035, sign * .28]);
      box(group, 0x9ece5b, [.16, .07, .12], [.26, .035, sign * .19]);
    }
    oval(group, 0x80bb4e, .26, [0, .24, 0], [1.18, .80, .90]);
    oval(group, 0xdbe798, .17, [.16, .22, 0], [1, .72, 1]); animalEyes(group, .17, .44, .14);
  } else if (kind === 'duck') {
    for (const z of [-.13, .13]) box(group, 0xeaa044, [.22, .07, .14], [.03, .035, z]);
    oval(group, 0xf6dfa3, .25, [-.06, .27, 0], [1.18, .9, 1]);
    for (const sign of [-1, 1]) oval(group, 0xe9c576, .15, [-.09, .31, sign * .205], [1.1, .80, .30]);
    ball(group, 0xffe7b6, .16, [.18, .51, 0]); box(group, 0xf1a843, [.18, .075, .22], [.34, .48, 0]); animalEyes(group, .24, .55, .09);
    fins(group, 0xe9c576, -.31, .27, .11);
  } else if (kind === 'fish' || kind === 'shark') {
    const shark = kind === 'shark', color = shark ? 0x6c9faf : 0x62aace;
    oval(group, color, .25, [.02, .20, 0], [shark ? 1.65 : 1.2, .8, .7]);
    oval(group, shark ? 0xd8e5db : 0xb5d7ce, .19, [.06, .12, 0], [shark ? 1.65 : 1.2, .6, .75]);
    for (const sign of [-1, 1]) {
      const tail = box(group, color, [.08, .25, .09], [-.35, .22, sign * .09]); tail.rotation.x = sign * .5;
      const fin = box(group, color, [.20, .055, .18], [0, .16, sign * .22]); fin.rotation.y = sign * .45;
    }
    fins(group, color, -.04, .34, shark ? .20 : .12); animalEyes(group, shark ? .34 : .22, .26, .105);
    if (shark) for (const x of [.19, .25, .31]) box(group, 0xe8eee4, [.035, .04, .10], [x, .12, .12]);
    else cylinder(group, 0x3486b2, .025, .28, [0, .22, .15]);
  } else if (kind === 'crab' || kind === 'water-crab' || kind === 'scorpion') {
    const scorpion = kind === 'scorpion', color = scorpion ? 0xdca640 : kind === 'crab' ? 0xd76a48 : 0x5c9faa;
    for (const x of scorpion ? [-.24, -.08, .08, .24] : [-.18, 0, .18]) for (const sign of [-1, 1]) {
      const leg = box(group, color, [.085, .14, .25], [x, .12, sign * .28]); leg.rotation.x = sign * .5;
      box(group, 0x46584b, [.12, .06, .13], [x + .03, .03, sign * .37]);
    }
    oval(group, color, .27, [0, .23, 0], [1.12, .60, .95]);
    for (const sign of [-1, 1]) {
      box(group, color, [.20, .08, .09], [.26, .21, sign * .23]);
      oval(group, color, .12, [.36, .24, sign * .23], [1, .7, .8]);
      box(group, 0xf0d888, [.13, .065, .045], [.43, .25, sign * .29]);
    }
    animalEyes(group, .20, .38, .10);
    if (scorpion) {
      for (const [x, y] of [[-.27, .35], [-.35, .48], [-.31, .62], [-.20, .73], [-.06, .72]]) ball(group, color, .075, [x, y, 0]);
      const sting = piece(group, new THREE.ConeGeometry(.045, .14, 12), 0x435347, .04, .66, 0); sting.rotation.z = -.55;
    }
  } else if (kind === 'gator' || kind === 'trex') {
    const rex = kind === 'trex', color = rex ? 0x779e49 : 0x669c68;
    if (rex) {
      for (const sign of [-1, 1]) { oval(group, color, .13, [-.06, .22, sign * .14], [1, 1.6, .8]); box(group, 0x648940, [.26, .09, .16], [.025, .045, sign * .15]); }
      oval(group, color, .23, [-.06, .42, 0], [1, 1.3, .85]);
      box(group, color, [.36, .25, .29], [.18, .69, 0], .07);
      for (const sign of [-1, 1]) box(group, color, [.16, .055, .055], [.14, .42, sign * .20]);
      animalEyes(group, .25, .80, .13);
      for (const x of [.12, .22, .32]) box(group, 0xf5e6be, [.035, .05, .22], [x, .58, 0]);
      oval(group, color, .17, [-.29, .29, 0], [1.1, .58, .63]);
    } else {
      for (const x of [-.23, .23]) for (const sign of [-1, 1]) box(group, color, [.17, .10, .14], [x, .05, sign * .24]);
      oval(group, color, .28, [-.06, .20, 0], [1.22, .65, .78]);
      box(group, 0x81ae72, [.32, .14, .28], [.31, .20, 0], .04); animalEyes(group, .21, .34, .12);
      oval(group, color, .16, [-.35, .14, 0], [1.15, .55, .55]);
      for (const x of [-.25, -.10, .05]) fins(group, 0x517a50, x, .31, .08);
      for (const x of [.26, .36, .44]) box(group, 0xf5e6be, [.03, .035, .27], [x, .13, 0]);
    }
  } else if (kind === 'tug' || kind === 'freighter' || kind === 'patrolboat') {
    const color = kind === 'tug' ? 0xed9143 : kind === 'freighter' ? 0x579cca : 0xe9b53e;
    box(group, 0x28556a, [.86, .16, .45], [0, .08, 0], .075); box(group, color, [.84, .13, .47], [0, .18, 0], .055);
    box(group, 0xe4dcc0, [.74, .035, .40], [0, .255, 0]);
    const cabinX = kind === 'freighter' ? .22 : -.16;
    box(group, 0xf0e9d7, [.22, .22, .32], [cabinX, .37, 0]); box(group, color, [.28, .05, .36], [cabinX, .50, 0]);
    for (const z of [-.167, .167]) box(group, 0x296d84, [.14, .085, .015], [cabinX, .40, z]);
    eyes(group, .415, .23); battery(group, cabinX, .54, .55);
    for (const x of [-.30, .02, .30]) for (const sign of [-1, 1]) ball(group, 0x36454a, .055, [x, .18, sign * .24]);
    if (kind === 'patrolboat') { cylinder(group, 0x386475, .045, .23, [.24, .34, 0], 'x'); cylinder(group, 0x73c1d0, .05, .05, [.37, .34, 0], 'x'); }
    else for (const z of [-.21, .21]) box(group, color, [kind === 'tug' ? .25 : .42, .08, .035], [kind === 'tug' ? .17 : -.15, .29, z]);
  } else if (kind === 'pump' || kind === 'workshop' || kind === 'sentry' || kind === 'marina') {
    const color = kind === 'pump' ? 0xeeb05a : kind === 'workshop' ? 0x6b9bc8 : kind === 'sentry' ? 0x5b99c5 : 0x72afbd;
    box(group, kind === 'marina' ? 0xb49967 : 0xb7bfa0, [.70, .09, .63], [0, .045, 0]);
    if (kind === 'workshop') {
      for (const z of [-.23, .23]) box(group, color, [.55, .48, .10], [0, .33, z]);
      box(group, color, [.60, .09, .61], [0, .61, 0]); box(group, 0xdbe8d9, [.09, .25, .035], [.15, .40, .295]); box(group, 0xdbe8d9, [.24, .09, .035], [.15, .40, .295]);
      box(group, 0x365765, [.06, .30, .38], [-.25, .30, 0]); battery(group, -.16, .40, .7);
    } else if (kind === 'sentry') {
      for (const x of [-.20, .20]) for (const z of [-.20, .20]) cylinder(group, color, .065, .61, [x, .39, z]);
      box(group, color, [.56, .11, .54], [0, .72, 0]); box(group, 0x4482b4, [.30, .17, .29], [0, .85, 0]);
      cylinder(group, 0x325a6c, .055, .33, [.24, .86, 0], 'x'); eyes(group, .285, .60); battery(group, -.21, .29, .65);
    } else {
      box(group, color, [.28, .45, .30], [-.14, .32, 0]); box(group, 0x355d6e, [.035, .19, .22], [.025, .39, 0]);
      box(group, 0xd8eec0, [.03, .10, .13], [.048, .42, 0]);
      cylinder(group, 0x497b78, .022, .34, [.16, .32, -.20]);
      const cable = piece(group, new THREE.TorusGeometry(.14, .025, 8, 20, Math.PI), 0x497b78, .16, .28, 0); cable.rotation.x = Math.PI / 2;
      box(group, color, [.36, .07, .38], [-.14, .58, 0]);
      if (kind === 'marina') cylinder(group, 0xe5d297, .025, .45, [.25, .31, .21]);
    }
  } else return null;
  group.scale.setScalar(.93);
  return group;
}

export function toyModel(kind: ModelKind): THREE.Group {
  const roster = rosterModel(kind);
  if (roster) return roster;
  const group = new THREE.Group();
  if (kind === 'soil') {
    const group = new THREE.Group();
    for (const [x, y, z, radius] of [[0, .07, 0, .16], [-.17, .045, .03, .11], [.15, .045, .035, .11], [0, .035, -.15, .10]]) {
      const lump = ball(group, 0xb88e58, radius, [x, y, z]); lump.scale.y = .5;
    }
    group.position.y = .005;
    return group;
  }
  if (kind === 'tires') {
    const tire = piece(group, new THREE.TorusGeometry(.19, .065, 8, 20), 0x263541, 0, .065, 0);
    tire.rotation.x = Math.PI / 2;
    for (let i = 0; i < 16; i++) {
      const angle = i * Math.PI * 2 / 16;
      const tread = box(group, 0x344652, [.05, .09, .025], [Math.cos(angle) * .249, .065, Math.sin(angle) * .249], .008);
      tread.rotation.y = -angle;
    }
    return group;
  }
  if (kind === 'battery') {
    // The cap rings support the cell, matching the installed rover batteries.
    battery(group, 0, .078 * 1.8, 1.8);
    return group;
  }
  if (kind === 'bristleback') {
    const shell = 0xd83c39, joint = 0x247e87, foot = 0x28343e;
    // Six feet share the rover support plane. Bent legs leave a clear animal
    // silhouette, while the overlapping shell plates read as fitted toy parts.
    for (const x of [-.25, 0, .25]) for (const sign of [-1, 1]) {
      ball(group, joint, .065, [x, .245, sign * .225]);
      const upper = box(group, shell, [.10, .22, .11], [x, .21, sign * .32], .025);
      upper.rotation.x = sign * .60;
      ball(group, foot, .055, [x, .125, sign * .38]);
      box(group, foot, [.15, .09, .16], [x + .015, .045, sign * .40], .025);
    }
    const core = ball(group, 0x873733, .30, [0, .31, 0]);
    core.scale.set(1.20, .65, .76);
    for (const [x, width, height] of [[-.25, .23, .24], [-.02, .28, .30], [.22, .23, .26]]) {
      box(group, shell, [width, height, .49], [x, .34 + height / 2, 0], .085);
    }
    // Broad ivory teeth sweep back along the spine instead of resembling a gun.
    const spine = new THREE.Shape();
    spine.moveTo(-.10, 0); spine.lineTo(.08, 0);
    spine.lineTo(-.035, .19); spine.lineTo(-.105, .17); spine.closePath();
    for (const [x, y] of [[-.27, .56], [-.035, .62], [.20, .58]]) {
      piece(group, new THREE.ExtrudeGeometry(spine, { depth: .065, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .009, bevelThickness: .009 }), 0xf6e3b4, x, y, -.0325);
    }
    box(group, 0xe8483d, [.22, .25, .39], [.36, .39, 0], .07);
    cylinder(group, shell, .115, .18, [.49, .34, 0], 'x');
    cylinder(group, foot, .104, .03, [.59, .34, 0], 'x');
    for (const z of [-.044, .044]) ball(group, 0x111e28, .021, [.607, .347, z]);
    for (const sign of [-1, 1]) {
      ball(group, 0xf6e3b4, .061, [.413, .455, sign * .158]);
      ball(group, 0x192d32, .043, [.448, .452, sign * .184]);
      ball(group, 0xffffff, .012, [.472, .471, sign * .197]);
      const brow = box(group, 0xb82f2d, [.12, .04, .065], [.433, .502, sign * .17], .012);
      brow.rotation.x = sign * .3;
    }
    return group;
  }
  if (kind === 'tree' || kind === 'tree-small') {
    // A few broad, rounded forms share the rovers' camera and daylight. The
    // trunk/roots own the ground contact; foliage is a quiet molded canopy.
    piece(group, new THREE.CylinderGeometry(.08, .13, .58, 10), 0x95643f, 0, .29, 0);
    for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      const root = box(group, 0x95643f, [.27, .085, .10], [.085 * Math.cos(angle), .0425, .085 * Math.sin(angle)], .035);
      root.rotation.y = -angle;
    }
    const crowns: [number, number, number, number, number][] = [
      [-.23, .73, -.10, .28, 0x69a64a], [.20, .76, -.16, .29, 0x7db34e],
      [-.19, .81, .21, .28, 0x81b84f], [.22, .77, .19, .29, 0x70aa49],
      [0, 1.01, -.02, .30, 0x93c35b], [0, .78, .02, .34, 0x7bb14d],
    ];
    for (const [x, y, z, radius, color] of crowns) {
      const crown = ball(group, color, radius, [x, y, z]);
      crown.scale.set(1, .87, 1);
      (crown.material as THREE.MeshStandardMaterial).roughness = .72;
    }
    if (kind === 'tree-small') group.scale.setScalar(.8);
    return group;
  }
  if (kind in partColors) {
    const color = partColors[kind as keyof typeof partColors];
    // Smooth interlocking pieces: color owns inventory identity, not a mixed thumbnail.
    box(group, color, [.54, .16, .34], [0, .08, 0], .025);
    box(group, color, [.15, .065, .26], [-.15, .18, 0], .018);
    box(group, color, [.15, .065, .26], [.15, .18, 0], .018);
    return group;
  }
  if (kind === 'rocks') {
    const stones: [number, number, number, number, number][] = [
      [-.16, -.13, .25, .47, 0xa29d96], [.19, .16, .22, .37, 0xb5ada1],
      [.24, -.19, .13, .25, 0x8e918c], [-.24, .25, .12, .16, 0xbab4a8],
    ];
    for (const [x, z, radius, height, color] of stones) {
      const geometry = new THREE.IcosahedronGeometry(radius, 0);
      const vertices = geometry.getAttribute('position');
      for (let i = 0; i < vertices.count; i++) vertices.setY(i, Math.max(0, (vertices.getY(i) / radius + .5) * height / 1.35));
      geometry.computeVertexNormals();
      const mesh = piece(group, geometry, color, x, 0, z);
      mesh.rotation.y = x * 7; (mesh.material as THREE.MeshStandardMaterial).flatShading = true;
    }
    return group;
  }
  const accent = kind === 'hauler' || kind === 'scoop' ? 0x24b9c7 : kind === 'warden' ? 0xffd643 : 0xb6dc36;
  if (kind === 'warden') walkingLegs(group, accent);
  else wheels(group, accent, kind === 'scoop' ? .245 : .29, .155);
  if (kind === 'scout') {
    box(group, 0xa8d52e, [.71, .16, .49], [0, .30, 0]);
    box(group, 0xafd934, [.27, .13, .45], [.25, .40, 0]);
    eyes(group, .407, .405); battery(group, -.28, .44);
    for (const z of [-.205, .205]) cylinder(group, 0x277382, .018, .27, [-.01, .465, z]);
    cylinder(group, 0x277382, .018, .43, [-.01, .60, 0], 'z');
    cylinder(group, 0x244b4f, .009, .30, [-.31, .655, -.17]);
    ball(group, 0xffd74d, .031, [-.31, .82, -.17]);
    group.scale.setScalar(.91);
  } else if (kind === 'hauler') {
    box(group, 0xf3912e, [.75, .15, .50], [0, .285, 0]);
    box(group, 0xffa537, [.26, .17, .48], [.28, .385, 0]); eyes(group, .417, .39);
    box(group, 0xda6c21, [.48, .06, .50], [-.14, .405, 0]);
    for (const z of [-.24, .24]) box(group, 0xffa32e, [.51, .22, .07], [-.14, .52, z]);
    for (const x of [-.37, .09]) box(group, 0xffa32e, [.07, .22, .51], [x, .52, 0]);
  } else if (kind === 'warden') {
    box(group, 0x398de2, [.71, .30, .56], [0, .37, 0], .07);
    eyes(group, .387, .36); battery(group, -.28, .57);
    box(group, 0x2579c1, [.38, .14, .33], [.01, .595, 0]);
    cylinder(group, 0x195178, .065, .43, [.23, .615, 0], 'x');
    cylinder(group, 0x51bee0, .069, .065, [.46, .615, 0], 'x');
  } else if (kind === 'scoop') {
    box(group, 0xffd141, [.55, .16, .48], [-.04, .30, 0]);
    box(group, 0xf5c52d, [.26, .19, .38], [-.14, .47, 0]);
    eyes(group, .25, .40); battery(group, -.29, .46);
    for (const z of [-.20, .20]) {
      const arm = box(group, 0x25abb8, [.43, .055, .058], [.27, .29, z], .018);
      arm.rotation.z = -.37;
      ball(group, 0x1a7486, .045, [.09, .36, z]);
    }
    box(group, 0xf6bc26, [.25, .05, .46], [.50, .105, 0], .013);
    box(group, 0xffd446, [.055, .18, .46], [.365, .20, 0], .015);
    for (const z of [-.22, .22]) box(group, 0xffd446, [.26, .12, .035], [.49, .165, z], .008);
    box(group, 0xffdf67, [.038, .065, .48], [.64, .115, 0], .006);
  }
  return group;
}

type Studio = { renderer: THREE.WebGLRenderer; stage: THREE.Scene; camera: THREE.OrthographicCamera };
let studio: Studio | undefined;
function modelStudio(scene: Phaser.Scene): Studio {
  if (studio) return studio;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(MODEL_SIZE, MODEL_SIZE); renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .95;
  const stage = new THREE.Scene();
  stage.add(new THREE.HemisphereLight(0xffffff, 0xc3d8a3, .7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8); sun.position.set(-3, 6, 4); stage.add(sun);
  const fill = new THREE.DirectionalLight(0xd5ecff, .3); fill.position.set(4, 3, -2); stage.add(fill);
  studio = { renderer, stage, camera: modelCamera() };
  scene.game.events.once('destroy', () => { renderer.dispose(); renderer.forceContextLoss(); studio = undefined; });
  return studio;
}
function renderModel(scene: Phaser.Scene, model: THREE.Group, name: string, directional: boolean, portraitsNeeded: boolean): void {
  const { renderer, stage, camera } = modelStudio(scene); stage.add(model);
  for (const direction of directional ? directions : [''] as const) {
    model.rotation.y = ({ se: 0, sw: -Math.PI / 2, ne: Math.PI, nw: Math.PI / 2, '': 0 })[direction];
    renderer.render(stage, camera);
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = MODEL_SIZE;
    canvas.getContext('2d')!.drawImage(renderer.domElement, 0, 0);
    const frame = name + (direction ? '-' + direction : '');
    scene.textures.addCanvas('toy-' + frame, canvas);
    if (!portraitsNeeded) continue;
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, MODEL_SIZE, MODEL_SIZE).data;
    let left = MODEL_SIZE, top = MODEL_SIZE, right = 0, bottom = 0;
    for (let y = 0; y < MODEL_SIZE; y++) for (let x = 0; x < MODEL_SIZE; x++) if (pixels[(y * MODEL_SIZE + x) * 4 + 3] > 8) {
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    const portrait = document.createElement('canvas'); portrait.width = right - left + 17; portrait.height = bottom - top + 17;
    portrait.getContext('2d')!.drawImage(canvas, left, top, right - left + 1, bottom - top + 1, 8, 8, right - left + 1, bottom - top + 1);
    portraits.set(frame, portrait.toDataURL('image/png'));
    if (name in partColors || name === 'battery' || name === 'tires' || name === 'soil') scene.textures.addCanvas('toy-icon-' + frame, portrait);
  }
  stage.remove(model);
  model.traverse(child => { if (child instanceof THREE.Mesh) { child.geometry.dispose(); (child.material as THREE.Material).dispose(); } });
}

/** Cache all four loaded views together. Cargo shares the model's depth buffer. */
export function cargoModel(scene: Phaser.Scene, kind: UnitKind, supplies: Supplies, carryingTree: boolean): string {
  if (!load(supplies) && !carryingTree) return kind;
  const name = kind + '-load-' + [...materials.map(color => Math.min(supplies[color], 12)), Math.min(supplies.tires, 12), supplies.batteries.length, supplies.soil ?? 0, Number(carryingTree)].join('-');
  if (!scene.textures.exists('toy-' + name + '-se')) {
    const model = toyModel(kind); addModelCargo(model, kind, supplies, carryingTree);
    renderModel(scene, model, name, true, false);
    loadedModels.add(name);
  }
  return name;
}
const loadedModels = new Set<string>();
/** Keep only live cargo views, so repeated transport and replays cannot grow the atlas. */
export function pruneCargoModels(scene: Phaser.Scene, live: ReadonlySet<string>): void {
  for (const name of loadedModels) if (!live.has(name)) {
    for (const heading of directions) scene.textures.remove('toy-' + name + '-' + heading);
    loadedModels.delete(name);
  }
}

/** Empty roster portraits and world views share one planted atlas. */
export function prepareToyModels(scene: Phaser.Scene): void {
  if (scene.textures.exists('toy-scout-se')) return;
  for (const kind of modelKinds) renderModel(scene, toyModel(kind), kind, [...unitKinds, ...enemyKinds].includes(kind as UnitKind), true);
  scene.game.events.emit('toy-art-ready');
}
