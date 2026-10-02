import { describe, expect, it } from 'vitest';
import { Box3, Mesh, Vector3 } from 'three';
import { MODEL_ORIGIN, MODEL_SIZE, modelCamera, toyModel, toyReactionModel, addModelCargo } from '../src/view/toy-models';
import { groundOrigin } from '../src/view/grounding';
import { toWorld } from '../src/core/projection';
import { unitKinds, enemyKinds, emptySupplies } from '../src/core/catalog';

const camera = modelCamera();
const project = (p: Vector3) => {
  const v = p.clone().project(camera);
  return { x: (v.x + 1) * MODEL_SIZE / 2, y: (1 - v.y) * MODEL_SIZE / 2 };
};
describe('model support plane matches the game grid', () => {
  it('keeps reacting creatures planted and their head silhouettes inside every heading', () => {
    for (const reaction of ['look-left', 'look-right', 'tucked'] as const) {
      const model = toyReactionModel(reaction);
      for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        model.rotation.y = angle; model.updateMatrixWorld(true);
        const bounds = new Box3().setFromObject(model);
        expect(bounds.min.y).toBeGreaterThanOrEqual(-.006); expect(bounds.min.y).toBeLessThan(.01);
        model.traverse(mesh => {
          if (!(mesh instanceof Mesh)) return;
          const vertices = mesh.geometry.getAttribute('position');
          for (let i = 0; i < vertices.count; i++) {
            const p = project(new Vector3().fromBufferAttribute(vertices, i).applyMatrix4(mesh.matrixWorld));
            expect(p.x).toBeGreaterThan(0); expect(p.x).toBeLessThan(MODEL_SIZE);
            expect(p.y).toBeGreaterThan(0); expect(p.y).toBeLessThan(MODEL_SIZE);
          }
        });
      }
    }
  });
  it('renders every carried tire when mixed cargo fits the visible hold', () => {
    const model = toyModel('forklift');
    addModelCargo(model, 'forklift', { ...emptySupplies(), red: 4, tires: 6 });
    const cargo = model.getObjectByName('cargo')!;
    // Each tire is a complete little model; each brick contributes a body and stud.
    expect(cargo.children.filter(child => child.type === 'Group')).toHaveLength(6);
    expect(cargo.children.filter(child => child.type === 'Mesh')).toHaveLength(8);
  });
  it('keeps the full roster planted and unclipped in all four headings; boats occupy one tile', () => {
    for (const kind of [...unitKinds, ...enemyKinds]) {
      const model = toyModel(kind);
      for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        model.rotation.y = angle; model.updateMatrixWorld(true);
        const bounds = new Box3().setFromObject(model);
        expect(bounds.min.y, kind).toBeGreaterThanOrEqual(-.006);
        expect(bounds.min.y, kind).toBeLessThan(.01);
        if (['tug', 'freighter', 'patrolboat'].includes(kind)) {
          expect(Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x), Math.abs(bounds.min.z), Math.abs(bounds.max.z)), kind).toBeLessThanOrEqual(.5);
        }
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        model.traverse(mesh => {
          if (!(mesh instanceof Mesh)) return;
          const vertices = mesh.geometry.getAttribute('position');
          for (let i = 0; i < vertices.count; i++) {
            const p = project(new Vector3().fromBufferAttribute(vertices, i).applyMatrix4(mesh.matrixWorld));
            minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
          }
        });
        expect(minX, kind).toBeGreaterThan(0); expect(minY, kind).toBeGreaterThan(0);
        expect(maxX, kind).toBeLessThan(MODEL_SIZE); expect(maxY, kind).toBeLessThan(MODEL_SIZE);
      }
      model.traverse(mesh => { if (mesh instanceof Mesh) { mesh.geometry.dispose(); } });
    }
  });
  it('keeps loaded models inside the atlas in every heading', () => {
    for (const kind of ['hauler','dumptruck','forklift','freighter','tug','scoop','arborbot'] as const) {
      const model=toyModel(kind);
      addModelCargo(model,kind,{...emptySupplies(),red:kind==='scoop'||kind==='arborbot'?0:4,blue:kind==='scoop'||kind==='arborbot'?0:4,
        tires:kind==='scoop'||kind==='arborbot'?0:4,batteries:kind==='scoop'||kind==='arborbot'?[]:[100,50],soil:kind==='scoop'?1:0},kind==='arborbot');
      for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]) {
        model.rotation.y=angle; model.updateMatrixWorld(true);
        const silhouette={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};
        model.traverse(mesh=>{
          if(!(mesh instanceof Mesh))return;
          const vertices=mesh.geometry.getAttribute('position');
          for(let i=0;i<vertices.count;i++) {
            const pixel=project(new Vector3().fromBufferAttribute(vertices,i).applyMatrix4(mesh.matrixWorld));
            silhouette.left=Math.min(silhouette.left,pixel.x); silhouette.right=Math.max(silhouette.right,pixel.x);
            silhouette.top=Math.min(silhouette.top,pixel.y); silhouette.bottom=Math.max(silhouette.bottom,pixel.y);
          }
        });
        expect(silhouette.left,kind).toBeGreaterThan(0); expect(silhouette.right,kind).toBeLessThan(MODEL_SIZE);
        expect(silhouette.top,kind).toBeGreaterThan(0); expect(silhouette.bottom,kind).toBeLessThan(MODEL_SIZE);
      }
    }
  });
  it('projects the origin and all four ground headings onto the tile axes', () => {
    const center = project(new Vector3());
    expect(center.x).toBeCloseTo(MODEL_ORIGIN.x); expect(center.y).toBeCloseTo(MODEL_ORIGIN.y);
    for (const axis of [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }]) {
      const p = project(new Vector3(axis.x, 0, axis.y)), tile = toWorld(axis);
      expect((p.x - center.x) / 4).toBeCloseTo(tile.x);
      expect((p.y - center.y) / 4).toBeCloseTo(tile.y);
    }
  });
  it('keeps every rover wheel plane at zero and uses one planted origin in every heading', () => {
    for (const kind of ['scout', 'hauler', 'warden', 'scoop'] as const) {
      const model = toyModel(kind);
      for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
        model.rotation.y = angle;
        const bounds = new Box3().setFromObject(model);
        expect(bounds.min.y).toBeCloseTo(0, 5);
      }
      for (const heading of ['se', 'sw', 'nw', 'ne']) {
        expect(groundOrigin(`${kind}-${heading}`)).toEqual({ x: MODEL_ORIGIN.x / MODEL_SIZE, y: MODEL_ORIGIN.y / MODEL_SIZE });
      }
    }
  });
  it('fits the complete rock support hull inside its blocked tile, with no lifted bottoms', () => {
    const model = toyModel('rocks'), bounds = new Box3().setFromObject(model);
    expect(bounds.min.x).toBeGreaterThanOrEqual(-.5); expect(bounds.max.x).toBeLessThanOrEqual(.5);
    expect(bounds.min.z).toBeGreaterThanOrEqual(-.5); expect(bounds.max.z).toBeLessThanOrEqual(.5);
    for (const stone of model.children) expect(new Box3().setFromObject(stone).min.y).toBeCloseTo(0);
  });
  it('plants batteries and every enemy heading without clipping the atlas', () => {
    for (const kind of ['battery', 'tires', 'bristleback'] as const) {
      const model = toyModel(kind);
      for (const [index, heading] of ['se', 'sw', 'ne', 'nw'].entries()) {
        model.rotation.y = index * Math.PI / 2;
        expect(new Box3().setFromObject(model).min.y).toBeCloseTo(0, 5);
        expect(groundOrigin(kind === 'battery' || kind === 'tires' ? kind : `${kind}-${heading}`))
          .toEqual({ x: MODEL_ORIGIN.x / MODEL_SIZE, y: MODEL_ORIGIN.y / MODEL_SIZE });
        const silhouette = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
        model.traverse(mesh => {
          if (!(mesh instanceof Mesh)) return;
          const vertices = mesh.geometry.getAttribute('position');
          for (let i = 0; i < vertices.count; i++) {
            const pixel = project(new Vector3().fromBufferAttribute(vertices, i).applyMatrix4(mesh.matrixWorld));
            silhouette.left = Math.min(silhouette.left, pixel.x); silhouette.right = Math.max(silhouette.right, pixel.x);
            silhouette.top = Math.min(silhouette.top, pixel.y); silhouette.bottom = Math.max(silhouette.bottom, pixel.y);
          }
        });
        expect(silhouette.left).toBeGreaterThan(0); expect(silhouette.right).toBeLessThan(MODEL_SIZE);
        expect(silhouette.top).toBeGreaterThan(0); expect(silhouette.bottom).toBeLessThan(MODEL_SIZE);
      }
    }
  });
  it('plants both tree sizes at the shared origin without clipping their canopies', () => {
    for (const kind of ['tree', 'tree-small'] as const) {
      const model = toyModel(kind), bounds = new Box3().setFromObject(model);
      expect(bounds.min.y).toBeCloseTo(0);
      expect(groundOrigin(kind)).toEqual({ x: MODEL_ORIGIN.x / MODEL_SIZE, y: MODEL_ORIGIN.y / MODEL_SIZE });
      // Project the actual silhouette; AABB corners combine canopy width with
      // the topmost height into points that aren't part of the tree.
      model.traverse(mesh => {
        if (!(mesh instanceof Mesh)) return;
        const vertices = mesh.geometry.getAttribute('position');
        for (let i = 0; i < vertices.count; i++) {
          const pixel = project(new Vector3().fromBufferAttribute(vertices, i).applyMatrix4(mesh.matrixWorld));
          expect(pixel.x).toBeGreaterThan(0); expect(pixel.x).toBeLessThan(MODEL_SIZE);
          expect(pixel.y).toBeGreaterThan(0); expect(pixel.y).toBeLessThan(MODEL_SIZE);
        }
      });
    }
  });
});
