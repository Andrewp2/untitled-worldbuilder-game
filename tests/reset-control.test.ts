import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachResetControl } from '../src/view/reset-control';
import { Campaign, type ProgressStorage } from '../src/core/campaign';

function fixture(actions = { restartLevel: vi.fn(), resetProgress: vi.fn() }) {
  const doc = Object.assign(new EventTarget(), { hidden: false });
  vi.stubGlobal('document', doc); vi.stubGlobal('window', new EventTarget());
  const label = { textContent: '' }, hint = { id: 'reset-hint', hidden: false, textContent: 'Hold 3s' };
  const attrs = new Map<string, string>(), classes = new Set<string>();
  const button = Object.assign(new EventTarget(), {
    title: '',
    style: { setProperty: vi.fn() },
    classList: { toggle: (name: string, active: boolean) => active ? classes.add(name) : classes.delete(name) },
    querySelector: (selector: string) => selector === '.reset-label' ? label : hint,
    setAttribute: (name: string, value: string) => attrs.set(name, value),
    removeAttribute: (name: string) => attrs.delete(name),
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 160, bottom: 48 }),
  });
  const binding = attachResetControl(button as unknown as HTMLButtonElement, actions);
  const send = (target: EventTarget, name: string, fields = {}) => target.dispatchEvent(Object.assign(new Event(name, { cancelable: true }), fields));
  const down = () => send(button, 'pointerdown', { isPrimary: true, button: 0, pointerId: 1 });
  const up = () => send(doc, 'pointerup', { pointerId: 1 });
  return { actions, binding, button, label, hint, attrs, classes, send, down, up };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('contextual reset control', () => {
  it('requires a full world-map hold, with a label that names the entire reset', () => {
    const f = fixture();
    expect(f.label.textContent).toBe('Reset ALL progress');
    expect(f.attrs.get('aria-label')).toBe(f.label.textContent);
    expect(f.hint.hidden).toBe(false);
    f.send(f.button, 'click'); f.down(); vi.advanceTimersByTime(2999); f.up();
    expect(f.actions.resetProgress).not.toHaveBeenCalled();
    f.down(); vi.advanceTimersByTime(3000);
    expect(f.actions.resetProgress).toHaveBeenCalledTimes(1);
    expect(f.actions.restartLevel).not.toHaveBeenCalled();
    f.binding.dispose();
  });

  it('restarts only the active level on click and preserves saved campaign awards', () => {
    let saved = JSON.stringify({ completed: ['a', 'b'], bonuses: ['a'] });
    const write = vi.fn((_key: string, value: string) => { saved = value; });
    const storage: ProgressStorage = { getItem: () => saved, setItem: write };
    const campaign = new Campaign(['a', 'b'], storage); campaign.start('b');
    const f = fixture({
      restartLevel: vi.fn(() => { campaign.start(campaign.currentMission!); }),
      resetProgress: vi.fn(() => campaign.reset()),
    });
    f.binding.setScreen('mission');
    expect(f.label.textContent).toBe('Restart level');
    expect(f.attrs.get('aria-label')).toBe(f.label.textContent);
    expect(f.hint.hidden).toBe(true);
    expect(f.attrs.has('aria-describedby')).toBe(false);
    // Native button keyboard activation is also a click; hold listeners must be absent.
    expect(f.send(f.button, 'keydown', { key: 'Enter', repeat: false })).toBe(true);
    f.down(); vi.advanceTimersByTime(4000); f.up(); f.send(f.button, 'click');
    expect(f.actions.restartLevel).toHaveBeenCalledTimes(1);
    expect(f.actions.resetProgress).not.toHaveBeenCalled();
    expect(campaign.currentMission).toBe('b'); expect(campaign.screen).toBe('mission');
    expect([...new Campaign(['a', 'b'], storage).completed]).toEqual(['a', 'b']);
    expect([...new Campaign(['a', 'b'], storage).bonuses]).toEqual(['a']);
    expect(write).not.toHaveBeenCalled(); f.binding.dispose();
  });

  it.each(['pointer', 'keyboard'])('cancels a world-map %s hold when entering a level', input => {
    const f = fixture();
    if (input === 'pointer') f.down();
    else f.send(f.button, 'keydown', { key: ' ', repeat: false });
    vi.advanceTimersByTime(2900); f.binding.setScreen('mission'); vi.advanceTimersByTime(4000);
    expect(f.actions.resetProgress).not.toHaveBeenCalled();
    expect(f.classes.has('holding')).toBe(false);
    f.binding.setScreen('world'); f.down(); vi.advanceTimersByTime(100);
    expect(f.actions.resetProgress).not.toHaveBeenCalled();
    f.up(); f.binding.dispose();
  });

  it('rebinds cleanly across visits and accepts Space or Enter holds only on the map', () => {
    const f = fixture();
    for (let i = 0; i < 4; i++) { f.binding.setScreen('mission'); f.binding.setScreen('world'); }
    for (const key of [' ', 'Enter']) {
      f.send(f.button, 'keydown', { key, repeat: false }); vi.advanceTimersByTime(3000);
      f.send(f.button, 'keyup', { key });
    }
    expect(f.actions.resetProgress).toHaveBeenCalledTimes(2);
    expect(f.actions.restartLevel).not.toHaveBeenCalled();
    f.binding.setScreen('mission'); f.send(f.button, 'click');
    expect(f.actions.restartLevel).toHaveBeenCalledTimes(1);
    f.binding.dispose();
  });
});
