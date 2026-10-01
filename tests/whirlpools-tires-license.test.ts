import { describe, expect, it } from 'vitest';
import { Campaign, PROGRESS_KEY } from '../src/core/campaign';
import { emptySupplies, enemyDefinition, partKinds, recipeSupplies, unitDefinition } from '../src/core/catalog';
import { findPath, walkable } from '../src/core/grid';
import { Simulation } from '../src/core/simulation';
import { board, pile } from '../src/levels/authored';

const pools = () => board(['wwwwwwww', 'w~@..@~w', 'wwwwwwww'], 'grass', {
  '2,1': { x: 5, y: 1 }, '5,1': { x: 2, y: 1 },
});
const settle = (s: Simulation) => { for (let i = 0; i < 80; i++) s.step(.05); };

describe('linked shallow-water whirlpools', () => {
  it('finds a disconnected route, transfers cargo, and spends charge only on physical steps', () => {
    const s = new Simulation(pools(), [unitDefinition('tug', 't', { x: 1, y: 1 })], {
      goals: [{ id: 'port', name: 'Port', cell: { x: 6, y: 1 } }],
      blueprintPickups: [{ blueprint: 'fish', cell: { x: 5, y: 1 } }], blueprints: {},
    });
    s.unit('t').cargo = { ...emptySupplies(), tires: 2, batteries: [37] };
    expect(findPath(s.grid, { x: 1, y: 1 }, { x: 6, y: 1 }, new Set(), 'water')).toEqual([{ x: 2, y: 1 }, { x: 6, y: 1 }]);
    expect(s.move('t', { x: 6, y: 1 }).ok).toBe(true); settle(s);
    expect(s.unit('t').cell).toEqual({ x: 6, y: 1 });
    expect(s.unit('t').battery).toBe(98);
    expect(s.unit('t').cargo).toEqual({ ...emptySupplies(), tires: 2, batteries: [37] });
    expect(s.blueprints.fish).toBe(1); expect(s.mainComplete).toBe(true);
    expect(s.drainEvents().filter(e => e.kind === 'whirlpool')).toHaveLength(1);
  });

  it.each(['duck', 'frog', 'fish', 'tug'] as const)('lets %s use a pool, without bouncing back until it leaves and re-enters', kind => {
    const s = new Simulation(pools(), [unitDefinition(kind, 'u', { x: 1, y: 1 })]);
    expect(walkable(s.grid, { x: 2, y: 1 }, 'land')).toBe(false);
    expect(s.move('u', { x: 2, y: 1 }).ok).toBe(true); settle(s);
    expect(s.unit('u').cell).toEqual({ x: 5, y: 1 }); expect(s.unit('u').battery).toBe(99);
    settle(s); expect(s.unit('u').battery).toBe(99);
    expect(s.move('u', { x: 6, y: 1 }).ok).toBe(true); settle(s);
    expect(s.move('u', { x: 5, y: 1 }).ok).toBe(true); settle(s);
    expect(s.unit('u').cell).toEqual({ x: 2, y: 1 }); expect(s.unit('u').battery).toBe(97);
  });

  it('reserves both ends while entering, rejects occupied exits, and honours stopping during entry', () => {
    const s = new Simulation(pools(), [unitDefinition('duck', 'a', { x: 1, y: 1 }), unitDefinition('duck', 'b', { x: 6, y: 1 })]);
    expect(s.move('a', { x: 2, y: 1 }).ok).toBe(true); s.step(.05);
    expect(s.move('b', { x: 5, y: 1 }).ok).toBe(false);
    s.stop('a'); settle(s); expect(s.unit('a').cell).toEqual({ x: 5, y: 1 }); expect(s.unit('a').goal).toBeNull();
    expect(s.move('b', { x: 5, y: 1 }).ok).toBe(false);
    expect(s.unit('b').battery).toBe(100);
  });

  it('uses automatic jumps for pursuing water enemies too', () => {
    const enemy = { ...enemyDefinition('water-crab', 'e', { x: 1, y: 1 }), detectionRange: 20, loseRange: 20 };
    const s = new Simulation(pools(), [unitDefinition('tug', 't', { x: 6, y: 1 })], { enemies: [enemy] });
    settle(s); expect(s.enemies[0].cell).toEqual({ x: 5, y: 1 });
    expect(s.drainEvents().some(e => e.kind === 'whirlpool' && e.unitId === 'e')).toBe(true);
  });

  it('finishes distant cargo orders across the jump and can redirect during entry', () => {
    const s = new Simulation(pools(), [unitDefinition('tug', 't', { x: 1, y: 1 })], {
      piles: [pile(6, 1, { ...emptySupplies(), tires: 4 })],
    });
    expect(s.orderCargo('t', 'pickup', { x: 6, y: 1 }).ok).toBe(true);
    settle(s); expect(s.unit('t').cargo.tires).toBe(4); expect(s.unit('t').battery).toBe(97);
    expect(s.unit('t').pending).toBeNull();
    s.move('t', { x: 6, y: 1 }); settle(s);
    s.move('t', { x: 5, y: 1 }); s.step(.05);
    expect(s.move('t', { x: 1, y: 1 }).ok).toBe(true); settle(s);
    expect(s.unit('t').cell).toEqual({ x: 1, y: 1 }); expect(s.unit('t').cargo.tires).toBe(4);
  });

  it('keeps jump outcomes independent of frame size and leaves zero-time steps inert', () => {
    const runs = [new Simulation(pools(), [unitDefinition('fish', 'f', { x: 1, y: 1 })]), new Simulation(pools(), [unitDefinition('fish', 'f', { x: 1, y: 1 })])];
    for (const s of runs) s.move('f', { x: 6, y: 1 });
    const before = JSON.stringify(runs[0].units); runs[0].step(0); expect(JSON.stringify(runs[0].units)).toBe(before);
    runs[0].step(2); for (let i = 0; i < 40; i++) runs[1].step(.05);
    expect(runs[0].units).toEqual(runs[1].units); expect(runs[0].drainEvents()).toEqual(runs[1].drainEvents());
  });

  it('rejects missing or invalid exits and prevents building over a pool', () => {
    const grid = pools(); delete grid.whirlpools!['2,1'];
    expect(() => new Simulation(grid, [])).toThrow(/exit/);
    grid.whirlpools!['2,1'] = { x: 4, y: 1 };
    expect(() => new Simulation(grid, [])).toThrow(/link/);
    const s = new Simulation(pools(), [], { piles: [pile(1, 1, recipeSupplies('tug', 100))] });
    expect(s.build('tug', { x: 2, y: 1 }).ok).toBe(false);
    expect(s.piles[0].supplies).toEqual(recipeSupplies('tug', 100));
  });
});

describe('physical tires', () => {
  it('requires tires atomically, then recovers installed tires and cargo after dismantling or destruction', () => {
    const grid = board(['......', '......', '......']);
    for (const wreck of [false, true]) {
      const kit = recipeSupplies('hauler', 80); kit.tires = 3;
      const s = new Simulation(grid, [], { blueprints: { hauler: 1 }, piles: [pile(1, 1, kit)], enemies: wreck ? [enemyDefinition('crab', 'c', { x: 3, y: 1 })] : [] });
      expect(s.buildPreview('hauler', { x: 2, y: 1 }).missing.tires).toBe(1);
      expect(s.build('hauler', { x: 2, y: 1 }).ok).toBe(false);
      expect(s.blueprints.hauler).toBe(1); expect(s.piles[0].supplies).toEqual(kit);
      s.piles[0].supplies.tires++; const built = s.build('hauler', { x: 2, y: 1 });
      if (!built.ok) throw new Error(built.reason);
      s.unit(built.id!).cargo = { ...emptySupplies(), tires: 2, batteries: [60] };
      if (wreck) {
        s.unit(built.id!).battery = 1;
        settle(s); expect(s.units).toHaveLength(0);
        expect(s.pileAt({ x: 2, y: 1 })!.supplies).toEqual({ ...recipeSupplies('hauler', 0), tires: 6, batteries: [0, 60] });
      } else {
        expect(s.dismantle(built.id!).ok).toBe(true);
        expect(s.pileAt({ x: 2, y: 1 })!.supplies).toEqual({ ...recipeSupplies('hauler', 80), tires: 6, batteries: [80, 60] });
      }
    }
  });

  it('counts each tire as cargo and conserves resources over split pickup/drop trips', () => {
    const s = new Simulation(board(['.....', '.....', '.....']), [unitDefinition('hauler', 'h', { x: 2, y: 1 })], {
      piles: [pile(1, 1, { ...emptySupplies(), red: 1, tires: 6, batteries: [31] })],
    });
    const total = () => partKinds.map(kind => s.piles.reduce((n, p) => n + p.supplies[kind], 0) + s.unit('h').cargo[kind]);
    const initial = total();
    expect(s.transfer('h', 'pickup', { x: 1, y: 1 }).ok).toBe(true);
    expect(s.unit('h').cargo.tires).toBe(3); expect(s.unit('h').cargo.red).toBe(1);
    for (let i = 0; i < 2; i++) {
      expect(s.transfer('h', 'drop', { x: 3, y: 1 }).ok).toBe(true);
      if (!i) expect(s.transfer('h', 'pickup', { x: 1, y: 1 }).ok).toBe(true);
      expect(total()).toEqual(initial);
    }
    expect(s.pileAt({ x: 1, y: 1 })).toBeUndefined();
    expect(s.pileAt({ x: 3, y: 1 })!.supplies.batteries).toEqual([31]);
  });
});

it('earns licenses from unique bonuses, preserves saved awards, and clears ranks on reset', () => {
  const ids = Array.from({ length: 36 }, (_, i) => `mission-${i}`);
  let saved: string | null = null;
  const storage = { getItem: (key: string) => key === PROGRESS_KEY ? saved : null, setItem: (_: string, value: string) => { saved = value; } };
  let campaign = new Campaign(ids, storage);
  for (let i = 0; i < 36; i++) {
    expect(campaign.start(ids[i])).toBe(true); expect(campaign.finish(ids[i])).toBe(true);
    expect(campaign.keepExploring()).toBe(true); expect(campaign.earnBonus(ids[i])).toBe(true); campaign.returnToMap();
    if ([11, 23, 35].includes(i)) expect(campaign.license.class).toBe(2 + Math.floor(i / 12));
  }
  campaign = new Campaign(ids, storage); expect(campaign.license.class).toBe(4);
  expect(campaign.license.nextStars).toBeNull(); expect(campaign.license.earnedStars).toBe(36);
  campaign.start(ids[0]); campaign.finish(ids[0]); campaign.keepExploring(); campaign.earnBonus(ids[0]);
  expect(campaign.license.earnedStars).toBe(36);
  campaign.reset(); expect(campaign.license.class).toBe(1); expect(campaign.license.earnedStars).toBe(0);
  expect(new Campaign(ids, storage).license.class).toBe(1);
});
