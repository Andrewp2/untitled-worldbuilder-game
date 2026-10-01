export const PROGRESS_KEY = 'untitled-worldbuilder-game.progress';
export const builderRanks = [
  { class: 1, stars: 0, model: 'scout' },
  { class: 2, stars: 12, model: 'frog' },
  { class: 3, stars: 24, model: 'dumptruck' },
  { class: 4, stars: 36, model: 'warden' },
] as const;
export type ProgressStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Mission completion persists; each visit to a mission starts a fresh run. */
export class Campaign {
  screen: 'world' | 'mission' | 'complete' | 'bonus-complete' = 'world';
  currentMission: string | null = null;
  private completedIds = new Set<string>();
  private bonusIds = new Set<string>();
  private knownIds: Set<string>;
  private completionAcknowledged = false;

  constructor(private readonly missionIds: readonly string[], private storage?: ProgressStorage) {
    this.knownIds = new Set(missionIds);
    this.refresh();
  }
  get completed(): ReadonlySet<string> { return this.completedIds; }
  get bonuses(): ReadonlySet<string> { return this.bonusIds; }
  get license() {
    const stars = this.bonusIds.size;
    const rank = [...builderRanks].reverse().find(rank => stars >= rank.stars)!;
    const next = builderRanks.find(candidate => candidate.stars > stars);
    return { ...rank, earnedStars: stars, nextStars: next?.stars ?? null };
  }
  isUnlocked(id: string): boolean {
    const index = this.missionIds.indexOf(id);
    return index >= 0 && this.missionIds.slice(0, index).every(previous => this.completedIds.has(previous));
  }
  private readSaved(): { completed: string[]; bonuses: string[] } | null {
    const empty = { completed: [], bonuses: [] };
    if (!this.storage) return null;
    let raw: string | null;
    try { raw = this.storage.getItem(PROGRESS_KEY); } catch { return null; }
    try {
      const saved: unknown = JSON.parse(raw ?? 'null');
      if (!saved || typeof saved !== 'object' || !('completed' in saved) || !Array.isArray(saved.completed)) return empty;
      const completed = saved.completed.filter((id): id is string => typeof id === 'string' && this.knownIds.has(id));
      const bonuses = 'bonuses' in saved && Array.isArray(saved.bonuses) ? saved.bonuses.filter((id): id is string => typeof id === 'string' && completed.includes(id)) : [];
      return { completed, bonuses };
    } catch { return empty; }
  }
  refresh(): void {
    const saved = this.readSaved();
    if (!saved) return;
    this.completedIds.clear(); this.bonusIds.clear();
    for (const id of saved.completed) this.completedIds.add(id);
    for (const id of saved.bonuses) this.bonusIds.add(id);
  }
  private save(): void {
    try { this.storage?.setItem(PROGRESS_KEY, JSON.stringify({ completed: [...this.completedIds], bonuses: [...this.bonusIds] })); }
    catch { this.storage = undefined; /* Keep this session's progress when persistence fails. */ }
  }
  start(id: string): boolean {
    this.refresh();
    if (!this.isUnlocked(id)) return false;
    this.currentMission = id; this.screen = 'mission'; this.completionAcknowledged = false;
    return true;
  }
  finish(id: string): boolean {
    if (this.screen !== 'mission' || this.currentMission !== id || this.completionAcknowledged) return false;
    // Read other tabs' current progress before adding this newly earned award.
    // A reset is authoritative; stale local awards must not be merged back in.
    this.refresh();
    if (!this.isUnlocked(id)) return false;
    this.completedIds.add(id); this.completionAcknowledged = true; this.screen = 'complete';
    this.save();
    return true;
  }
  earnBonus(id: string): boolean {
    this.refresh();
    if (this.screen !== 'mission' || this.currentMission !== id || !this.completionAcknowledged || !this.completedIds.has(id)) return false;
    this.screen = 'bonus-complete';
    if (!this.bonusIds.has(id)) { this.bonusIds.add(id); this.save(); }
    return true;
  }
  keepExploring(): boolean {
    if (this.screen !== 'complete') return false;
    this.screen = 'mission'; return true;
  }
  returnToMap(): void { this.screen = 'world'; this.currentMission = null; this.completionAcknowledged = false; }
  reset(): void {
    this.completedIds.clear(); this.bonusIds.clear();
    this.returnToMap(); this.save();
  }
}
