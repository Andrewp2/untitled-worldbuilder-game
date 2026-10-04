import { describe, expect, it } from 'vitest';
import { missions } from '../src/levels/missions';
import { missionHints } from '../src/levels/mission-hints';
import { HintProgress } from '../src/view/mission-hints';

describe('optional campaign hints', () => {
  it('gives every released mission separate main and bonus hints', () => {
    expect(Object.keys(missionHints).sort()).toEqual(missions.map(m => m.id).sort());
    for (const hints of Object.values(missionHints)) {
      for (const stage of [hints.main, hints.bonus]) {
        expect(stage).toHaveLength(2);
        expect(stage.every(text => text.trim().length > 0)).toBe(true);
        expect(new Set(stage).size).toBe(2);
      }
    }
  });
  it('reveals one nudge at a time without exposing the bonus solution', () => {
    const hints = new HintProgress(); hints.update('woodland-workshop', false);
    expect(hints.visible).toEqual([]); expect(hints.canReveal).toBe(true);
    hints.reveal(); expect(hints.visible).toEqual([missionHints['woodland-workshop'].main[0]]);
    hints.update('woodland-workshop', false); // Repeated HUD updates retain the reveal.
    hints.reveal(); hints.reveal();
    expect(hints.visible).toEqual(missionHints['woodland-workshop'].main);
    expect(hints.canReveal).toBe(false);
    for (const hidden of missionHints['woodland-workshop'].bonus) expect(hints.visible).not.toContain(hidden);
  });
  it('starts bonus hints concealed and discards main hints when that visit earns the main', () => {
    const hints = new HintProgress(); hints.update('reef-courier', false); hints.reveal();
    hints.update('reef-courier', true);
    expect(hints.visible).toEqual([]); expect(hints.canReveal).toBe(true);
    hints.reveal(); expect(hints.visible).toEqual([missionHints['reef-courier'].bonus[0]]);
  });
  it('starts fresh on level restart or switching missions, even after earning a bonus', () => {
    const hints = new HintProgress(); hints.update('hollow-reach', true); hints.reveal();
    hints.reset(); hints.update('hollow-reach', false);
    expect(hints.visible).toEqual([]);
    hints.reveal(); hints.update('parts-and-paths', false);
    expect(hints.visible).toEqual([]);
    hints.reveal(); expect(hints.visible).toEqual([missionHints['parts-and-paths'].main[0]]);
  });
});
