import { describe, expect, it } from 'vitest';
import { Campaign, PROGRESS_KEY, type ProgressStorage } from '../src/core/campaign';
import { findPath, walkable } from '../src/core/grid';
import { missions, createMission } from '../src/levels/missions';
import { worlds } from '../src/levels/world-map';

const ids = missions.map(mission => mission.id);
function finishWithBonus(campaign: Campaign, id: string): boolean {
  const done = campaign.finish(id);
  if (done) { campaign.keepExploring(); campaign.earnBonus(id); }
  return done;
}
function memoryStorage(initial?: string): ProgressStorage {
  let value = initial ?? null;
  return { getItem: () => value, setItem: (_key, next) => { value = next; } };
}

describe('world map and mission completion', () => {
  it('resets all completions and stars, exits the current run, and stays empty on reload', () => {
    const storage = memoryStorage(), campaign = new Campaign(ids, storage);
    for (const id of ids) { campaign.start(id); finishWithBonus(campaign, id); }
    campaign.keepExploring(); campaign.reset();
    expect(campaign.completed.size).toBe(0); expect(campaign.bonuses.size).toBe(0);
    expect(campaign.screen).toBe('world'); expect(campaign.currentMission).toBeNull();
    expect(campaign.finish(ids.at(-1)!)).toBe(false); expect(campaign.earnBonus(ids.at(-1)!)).toBe(false);
    const reloaded = new Campaign(ids, storage);
    expect(reloaded.completed.size).toBe(0); expect(reloaded.bonuses.size).toBe(0);
    campaign.start(ids[0]); expect(finishWithBonus(campaign, ids[0])).toBe(true);
    expect(new Campaign(ids, storage).completed.size).toBe(1);
  });
  it('does not accept a later mission completion when another tab has reset its prerequisites', () => {
    const storage = memoryStorage(JSON.stringify({ completed: [ids[0]], bonuses: [ids[0]] }));
    const first = new Campaign(ids, storage), stale = new Campaign(ids, storage);
    stale.start(ids[1]); first.reset();
    expect(stale.finish(ids[1])).toBe(false);
    const reloaded = new Campaign(ids, storage);
    expect([...reloaded.completed]).toEqual([]); expect([...reloaded.bonuses]).toEqual([]);
    first.refresh(); expect([...first.completed]).toEqual([]);
  });
  it('refreshes a reset in other tabs and prevents stale exploration from awarding an orphan bonus', () => {
    const storage = memoryStorage(), first = new Campaign(ids, storage), second = new Campaign(ids, storage);
    second.start(ids[0]); second.finish(ids[0]); second.keepExploring();
    first.reset(); expect(second.earnBonus(ids[0])).toBe(false);
    expect(second.completed.size).toBe(0); expect(second.bonuses.size).toBe(0);
    expect(new Campaign(ids, storage).completed.size).toBe(0);
  });
  it('keeps resets and later awards functional in memory after a failed write', () => {
    const storage: ProgressStorage = { getItem: () => JSON.stringify({ completed: [ids[0]], bonuses: [ids[0]] }), setItem: () => { throw new Error('full'); } };
    const campaign = new Campaign(ids, storage); campaign.reset(); campaign.refresh();
    expect(campaign.completed.size).toBe(0); expect(campaign.bonuses.size).toBe(0);
    campaign.start(ids[0]); expect(campaign.finish(ids[0])).toBe(true); campaign.refresh();
    expect([...campaign.completed]).toEqual([ids[0]]);
  });
  it('saves earned bonus stars, retains them on replay, and does not invent them for completed missions', () => {
    const storage = memoryStorage(JSON.stringify({ completed: [ids[0]] }));
    const campaign = new Campaign(ids, storage);
    expect(campaign.bonuses.size).toBe(0);
    campaign.start(ids[0]); expect(campaign.earnBonus(ids[0])).toBe(false);
    finishWithBonus(campaign, ids[0]);
    expect(new Campaign(ids, storage).bonuses.has(ids[0])).toBe(true);
    campaign.returnToMap(); campaign.start(ids[0]); campaign.finish(ids[0]);
    expect(campaign.bonuses.has(ids[0])).toBe(true);
  });
  it('can earn the bonus after choosing Keep exploring, saving only the first award', () => {
    const storage = memoryStorage(), campaign = new Campaign(ids, storage);
    campaign.start(ids[0]); campaign.finish(ids[0]); campaign.keepExploring();
    expect(campaign.earnBonus(ids[1])).toBe(false);
    expect(campaign.earnBonus(ids[0])).toBe(true);
    expect(campaign.screen).toBe('bonus-complete');
    expect(campaign.keepExploring()).toBe(false);
    expect(campaign.earnBonus(ids[0])).toBe(false);
    expect(new Campaign(ids, storage).bonuses.has(ids[0])).toBe(true);
  });
  it.each([undefined, JSON.stringify({ completed: [ids[0]], bonuses: [ids[0]] })])('ends each bonus run once, including an already-starred replay (%s)', initial => {
    const storage = memoryStorage(initial), campaign = new Campaign(ids, storage);
    for (let run = 0; run < 2; run++) {
      campaign.start(ids[0]);
      expect(campaign.earnBonus(ids[0])).toBe(false);
      campaign.finish(ids[0]);
      expect(campaign.earnBonus(ids[0])).toBe(false);
      campaign.keepExploring();
      expect(campaign.earnBonus(ids[0])).toBe(true);
      expect(campaign.screen).toBe('bonus-complete');
      expect(campaign.earnBonus(ids[0])).toBe(false);
      expect(campaign.keepExploring()).toBe(false);
      expect(new Campaign(ids, storage).bonuses.size).toBe(1);
      campaign.returnToMap();
    }
  });
  it('merges another tab’s bonus and ignores bonus records for unfinished or unknown missions', () => {
    const storage = memoryStorage(JSON.stringify({ completed: [ids[0]], bonuses: [ids[0], ids[1], 'removed', 2] }));
    const first = new Campaign(ids, storage), second = new Campaign(ids, storage);
    expect([...first.bonuses]).toEqual([ids[0]]);
    first.start(ids[1]); finishWithBonus(first, ids[1]);
    second.start(ids[0]); second.finish(ids[0]);
    expect(new Campaign(ids, storage).bonuses.size).toBe(2);
  });
  it('has a reachable map location for every mission', () => {
    expect(worlds.flatMap(world => world.locations.map(location => location.id)).sort()).toEqual([...ids].sort());
    for (const world of worlds) {
      expect(world.locations).toHaveLength(12);
      expect(world.locations.every(location => walkable(world.grid, location.cell))).toBe(true);
      for (const location of world.locations.slice(1)) expect(findPath(world.grid, world.locations[0].cell, location.cell), `${world.name}: ${location.id}`).not.toBeNull();
    }
  });
  it('starts on the map and does not count leaving an unfinished mission', () => {
    const campaign = new Campaign(ids);
    expect(campaign.screen).toBe('world');
    expect(campaign.finish(ids[0])).toBe(false);
    campaign.start(ids[0]); campaign.returnToMap();
    expect(campaign.currentMission).toBeNull();
    expect(campaign.completed.size).toBe(0);
    expect(campaign.finish(ids[0])).toBe(false);
  });
  it('opens completion once per run, resumes exploration, and permits replay', () => {
    const campaign = new Campaign(ids);
    campaign.start(ids[0]);
    expect(campaign.finish(ids[1])).toBe(false);
    expect(campaign.finish(ids[0])).toBe(true);
    expect(campaign.screen).toBe('complete');
    expect(campaign.finish(ids[0])).toBe(false);
    expect(campaign.keepExploring()).toBe(true);
    expect(campaign.screen).toBe('mission');
    expect(campaign.finish(ids[0])).toBe(false);
    campaign.returnToMap(); campaign.start(ids[0]);
    expect(campaign.finish(ids[0])).toBe(true);
    expect(campaign.completed.size).toBe(1);
  });
  it('saves both completions and restores them on a later visit', () => {
    const storage = memoryStorage(), campaign = new Campaign(ids, storage);
    for (const id of ids) { campaign.start(id); campaign.finish(id); campaign.returnToMap(); }
    const reloaded = new Campaign(ids, storage);
    expect([...reloaded.completed].sort()).toEqual([...ids].sort());
    expect(reloaded.screen).toBe('world');
    expect(reloaded.currentMission).toBeNull();
  });
  it('merges progress saved by another tab before writing its completion', () => {
    const storage = memoryStorage(), first = new Campaign(ids, storage), second = new Campaign(ids, storage);
    first.start(ids[0]); first.finish(ids[0]);
    second.start(ids[1]); second.finish(ids[1]);
    expect(new Campaign(ids, storage).completed.size).toBe(2);
    first.refresh(); expect(first.completed.size).toBe(2);
  });
  it.each(['not JSON', 'null', '[]', '{"completed":true}'])('ignores invalid saved progress: %s', saved => {
    expect(new Campaign(ids, memoryStorage(saved)).completed.size).toBe(0);
  });
  it('ignores removed missions and invalid ids without changing the active run', () => {
    const campaign = new Campaign(ids, memoryStorage(JSON.stringify({ completed: [ids[0], 'removed', 3] })));
    expect([...campaign.completed]).toEqual([ids[0]]);
    campaign.start(ids[1]);
    expect(campaign.start('removed')).toBe(false);
    expect(campaign.currentMission).toBe(ids[1]);
  });
  it('still completes and replays when browser storage is unavailable', () => {
    const storage: ProgressStorage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('full'); } };
    const campaign = new Campaign(ids, storage);
    campaign.start(ids[0]); expect(campaign.finish(ids[0])).toBe(true);
    campaign.returnToMap(); expect(campaign.completed.has(ids[0])).toBe(true);
  });
  it('connects real flag arrivals to a saved completion without retaining partial runs', () => {
    const mission = missions[0], storage = memoryStorage(), campaign = new Campaign(ids, storage);
    campaign.start(mission.id);
    const simulation = createMission(mission);
    for (const goal of mission.goals) {
      expect(simulation.move('hauler', goal.cell).ok).toBe(true); simulation.step(40);
      const complete = mission.goals.every(goal => simulation.reached.has(goal.id));
      if (complete) campaign.finish(mission.id);
    }
    expect(campaign.screen).toBe('complete');
    expect(JSON.parse(storage.getItem(PROGRESS_KEY)!).completed).toEqual([mission.id]);
    campaign.returnToMap(); campaign.start(mission.id);
    expect(createMission(mission).reached.size).toBe(0);
    expect(campaign.completed.has(mission.id)).toBe(true);
  });
});


it('unlocks exactly the next mission on main completion; bonus and replay cannot skip the chain', () => {
  const storage=memoryStorage(), c=new Campaign(ids,storage);
  for (const [index,id] of ids.entries()) {
    expect(c.isUnlocked(id)).toBe(true);
    for (const later of ids.slice(index+1)) { expect(c.isUnlocked(later)).toBe(false); expect(c.start(later)).toBe(false); }
    expect(c.start(id)).toBe(true); expect(c.earnBonus(id)).toBe(false); expect(c.finish(id)).toBe(true);
    if(index>0) { c.returnToMap(); expect(c.start(ids[0])).toBe(true); c.finish(ids[0]); }
  }
  const restored=new Campaign(ids,storage); expect(ids.every(id=>restored.isUnlocked(id))).toBe(true);
  restored.reset(); expect(ids.filter(id=>restored.isUnlocked(id))).toEqual([ids[0]]);
});
it('retains known saved awards but still requires every earlier main objective', () => {
  const c=new Campaign(ids,memoryStorage(JSON.stringify({completed:[ids[0],ids[3]],bonuses:[ids[3]]})));
  expect(c.completed.has(ids[3])).toBe(true); expect(c.bonuses.has(ids[3])).toBe(true);
  expect(c.isUnlocked(ids[1])).toBe(true); expect(c.isUnlocked(ids[3])).toBe(false); expect(c.start(ids[3])).toBe(false);
});
