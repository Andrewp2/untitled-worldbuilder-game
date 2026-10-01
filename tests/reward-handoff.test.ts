import { afterEach, describe, expect, it, vi } from 'vitest';

// Rendering is irrelevant to the progress handoff; use the real simulation
// and bridge while keeping the test independent of WebGL and a browser clock.
vi.mock('phaser', () => ({ default: { Scene: class { cameras = { main: { zoom: 1 } }; } } }));
vi.mock('../src/view/toy-art', async importOriginal => ({
  ...await importOriginal<typeof import('../src/view/toy-art')>(), poseToy: () => 0, drawStar: () => {},
}));
import { GameScene } from '../src/view/GameScene';
import { missions, createMission } from '../src/levels/missions';
import { unitDefinition } from '../src/core/catalog';
import { board } from '../src/levels/authored';
const mission={...missions[0],grid:board(['.....','.....','.....']),rovers:[unitDefinition('scout','scout',{x:0,y:0}),unitDefinition('duck','duck',{x:0,y:2})],
 goals:[{id:'shore',name:'Shore',cell:{x:4,y:0},unitId:'scout'}],bonus:{kind:'arrival' as const,name:'Nest',description:'',cell:{x:3,y:2},unitId:'duck'},piles:[],blueprintPickups:[]};

afterEach(() => vi.unstubAllGlobals());

function handoffScene(reducedMotion = false) {
  vi.stubGlobal('matchMedia', () => ({ matches: reducedMotion }));
  const state = vi.fn(), scene = new GameScene({ state, sound: vi.fn(), message: vi.fn() });
  const rendering = scene as unknown as { syncObjects(): void; drawOverlays(time: number): void };
  vi.spyOn(rendering, 'syncObjects').mockImplementation(() => {});
  vi.spyOn(rendering, 'drawOverlays').mockImplementation(() => {});
  scene.simulation=createMission(mission);
  Object.assign(scene,{mission});
  Object.assign(scene, {
    add: { graphics: () => {
      const picture = { setDepth: () => picture, lineStyle: () => picture, lineBetween: () => picture, setPosition: () => picture, setAlpha: () => picture, setScale: () => picture, destroy: () => {} };
      return picture;
    } },
    ready: true,
    keys: Object.fromEntries(['W', 'A', 'S', 'D', 'UP', 'DOWN', 'LEFT', 'RIGHT'].map(key => [key, { isDown: false }])),
    rovers: new Map(scene.simulation.units.map(unit => [unit.id, { body: { rotation: 0 }, root: { bringToTop: () => {}, moveTo: () => {} } }])),
  });
  return { scene, state };
}

describe('reward-to-campaign handoff', () => {
  it('publishes a real completion in its first frame, before the normal HUD interval', () => {
    const { scene, state } = handoffScene();
    for (const goal of mission.goals) {
      expect(scene.simulation.move('scout', goal.cell).ok).toBe(true); scene.simulation.step(40);
    }
    scene.update(1, 1);
    expect(state).toHaveBeenCalledOnce();
    expect(state.mock.calls[0][0]).toMatchObject({ complete: true, visited: ['shore'] });
  });
  it('publishes a creature arrival’s earned bonus before the HUD interval', () => {
    const { scene, state } = handoffScene();
    scene.simulation.move('scout', mission.goals[0].cell); scene.simulation.step(40); scene.simulation.drainEvents();
    expect(scene.simulation.move('duck',mission.bonus.cell).ok).toBe(true);
    scene.simulation.step(40); scene.update(1, 1);
    expect(state).toHaveBeenCalledOnce();
    expect(state.mock.calls[0][0].bonus).toMatchObject({ reached: true });
  });
  it.each([false, true])('celebrates the bonus after the main reward, then holds the mission for its popup (reduced motion: %s)', reducedMotion => {
    const { scene, state } = handoffScene(reducedMotion);
    const latest = () => state.mock.calls.at(-1)![0];
    scene.simulation.move('scout', mission.goals[0].cell); scene.simulation.step(40); scene.update(1, 1);
    for (let i = 0; i < 14; i++) scene.update(i * 100, 100);
    expect(latest().celebrating).toBe(false);
    scene.resumeExploration();
    scene.simulation.move('duck',mission.bonus.cell); scene.simulation.step(40);
    // A synchronous selection/HUD update must not open the popup before the
    // newly earned bonus has started its own reward animation.
    scene.select('scout'); expect(latest()).toMatchObject({ bonus: { reached: true }, celebrating: true });
    scene.simulation.move('scout', { x: 1, y: 0 }); scene.update(2, 1);
    const scout = scene.simulation.unit('scout'), stoppedAt = { ...scout.cell }, charge = scout.battery;
    expect(latest()).toMatchObject({ celebrating: true, moving: 0 });
    for (let i = 0; i < 14; i++) scene.update(i * 100, 100);
    expect(latest()).toMatchObject({ celebrating: false, moving: 0, bonus: { reached: true } });
    expect(scout.cell).toEqual(stoppedAt); expect(scout.battery).toBe(charge);
  });
});
