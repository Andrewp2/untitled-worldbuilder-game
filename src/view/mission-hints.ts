import { missionHints } from '../levels/mission-hints';

/** Hint reveals belong to this visit and this objective, never saved awards. */
export class HintProgress {
  private objective = '';
  private hints: readonly string[] = [];
  private count = 0;

  reset(): void { this.objective = ''; this.hints = []; this.count = 0; }
  update(missionId: string, bonusUnlocked: boolean): void {
    const stage = bonusUnlocked ? 'bonus' : 'main';
    const objective = `${missionId}:${stage}`;
    if (objective === this.objective) return;
    this.objective = objective;
    this.hints = missionHints[missionId]?.[stage] ?? [];
    this.count = 0;
  }
  reveal(): void { this.count = Math.min(this.count + 1, this.hints.length); }
  get visible(): readonly string[] { return this.hints.slice(0, this.count); }
  get canReveal(): boolean { return this.count < this.hints.length; }
}
