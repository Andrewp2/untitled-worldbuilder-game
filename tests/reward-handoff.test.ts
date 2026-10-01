import { afterEach, describe, expect, it, vi } from 'vitest';

// Rendering is irrelevant to the progress handoff; use the real simulation
// and bridge while keeping the test independent of WebGL and a browser clock.
vi.mock('phaser', () => ({ default: { Scene: class { cameras = { main: { zoom: 1 } }; } } }));
vi.mock('../src/view/toy-art', async importOriginal => ({
  ...await importOriginal<typeof import('../src/view/toy-art')>(), poseToy: () => 0, drawStar: () => {},
}));
import { GameScene } from '../src/view/GameScene';
import { missions } from '../src/levels/missions';

afterEach(() => vi.unstubAllGlobals());

function handoffScene(reducedMotion = false) {
  vi.stubGlobal('matchMedia', () => ({ matches: reducedMotion }));
  const state = vi.fn(), scene = new GameScene({ state, sound: vi.fn(), message: vi.fn() });
  const rendering = scene as unknown as { syncObjects(): void; drawOverlays(time: number): void };
  vi.spyOn(rendering, 'syncObjects').mockImplementation(() => {});
  vi.spyOn(rendering, 'drawOverlays').mockImplementation(() => {});
  const cargo = { setPosition: () => cargo, setRotation: () => cargo };
  Object.assign(scene, {
    add: { graphics: () => {
      const picture = { setDepth: () => picture, lineStyle: () => picture, lineBetween: () => picture, setPosition: () => picture, setAlpha: () => picture, setScale: () => picture, destroy: () => {} };
      return picture;
    } },
    ready: true,
    keys: Object.fromEntries(['W', 'A', 'S', 'D', 'UP', 'DOWN', 'LEFT', 'RIGHT'].map(key => [key, { isDown: false }])),
    rovers: new Map(scene.simulation.units.map(unit => [unit.id, { body: { rotation: 0 }, root: { bringToTop: () => {}, moveTo: () => {} } }])),
    cargoGraphics: new Map(scene.simulation.units.map(unit => [unit.id, cargo])),
  });
  return { scene, state };
}

describe('reward-to-campaign handoff', () => {
  it('publishes a real completion in its first frame, before the normal HUD interval', () => {
    const { scene, state } = handoffScene();
    for (const goal of missions[0].goals) {
      expect(scene.simulation.move('hauler', goal.cell).ok).toBe(true); scene.simulation.step(40);
    }
    scene.update(1, 1);
    expect(state).toHaveBeenCalledOnce();
    expect(state.mock.calls[0][0]).toMatchObject({ complete: true, visited: ['shore'] });
  });
  it('publishes a travelling delivery’s earned bonus before the HUD interval', () => {
    const { scene, state } = handoffScene();
    scene.simulation.move('hauler', missions[0].goals[0].cell); scene.simulation.step(40); scene.simulation.drainEvents();
    scene.simulation.unit('hauler').cargo = { red: 0, blue: 0, batteries: [100] , yellow: 0, green: 0};
    expect(scene.simulation.orderCargo('hauler', 'drop', missions[0].bonus.cell).ok).toBe(true);
    scene.simulation.step(40); scene.update(1, 1);
    expect(state).toHaveBeenCalledOnce();
    expect(state.mock.calls[0][0].bonus).toMatchObject({ reached: true });
  });
  it.each([false, true])('celebrates the bonus after the main reward, then holds the mission for its popup (reduced motion: %s)', reducedMotion => {
    const { scene, state } = handoffScene(reducedMotion);
    const latest = () => state.mock.calls.at(-1)![0];
    scene.simulation.move('hauler', missions[0].goals[0].cell); scene.simulation.step(40); scene.update(1, 1);
    for (let i = 0; i < 14; i++) scene.update(i * 100, 100);
    expect(latest().celebrating).toBe(false);
    scene.resumeExploration();
    scene.simulation.unit('hauler').cargo.batteries = [100];
    scene.simulation.orderCargo('hauler', 'drop', missions[0].bonus.cell); scene.simulation.step(40);
    // A synchronous selection/HUD update must not open the popup before the
    // newly earned bonus has started its own reward animation.
    scene.select('hauler'); expect(latest()).toMatchObject({ bonus: { reached: true }, celebrating: true });
    scene.simulation.move('scout', { x: 3, y: 6 }); scene.update(2, 1);
    const scout = scene.simulation.unit('scout'), stoppedAt = { ...scout.cell }, charge = scout.battery;
    expect(latest()).toMatchObject({ celebrating: true, moving: 0 });
    for (let i = 0; i < 14; i++) scene.update(i * 100, 100);
    expect(latest()).toMatchObject({ celebrating: false, moving: 0, bonus: { reached: true } });
    expect(scout.cell).toEqual(stoppedAt); expect(scout.battery).toBe(charge);
  });
});
