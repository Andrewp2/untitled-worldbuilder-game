import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachHoldToConfirm } from '../src/view/hold-to-confirm';
import { Campaign, type ProgressStorage } from '../src/core/campaign';

// Exercise the public input boundary with EventTargets, without a browser or real saves.
function fixture(confirm = vi.fn()) {
  const doc = Object.assign(new EventTarget(), { hidden: false });
  const win = new EventTarget();
  const hint = { textContent: 'Hold 3s' }, classes = new Set<string>();
  const button = Object.assign(new EventTarget(), {
    style: { setProperty: vi.fn() },
    classList: { toggle: (name: string, enabled: boolean) => enabled ? classes.add(name) : classes.delete(name) },
    querySelector: () => hint,
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 100, bottom: 48 }),
  });
  vi.stubGlobal('document', doc); vi.stubGlobal('window', win);
  const binding = attachHoldToConfirm(button as unknown as HTMLButtonElement, confirm);
  const send = (target: EventTarget, type: string, fields = {}) => target.dispatchEvent(Object.assign(new Event(type, { cancelable: true }), fields));
  const down = () => send(button, 'pointerdown', { isPrimary: true, button: 0, pointerId: 1 });
  const up = () => send(doc, 'pointerup', { pointerId: 1 });
  return { doc, win, button, hint, classes, confirm, binding, send, down, up };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('three-second hold confirmation', () => {
  it('confirms exactly once at three seconds, while clicks and early releases do nothing', () => {
    const f = fixture(); f.send(f.button, 'click'); vi.advanceTimersByTime(4000);
    expect(f.confirm).not.toHaveBeenCalled();
    f.down(); vi.advanceTimersByTime(2999); f.up(); vi.advanceTimersByTime(4000);
    expect(f.confirm).not.toHaveBeenCalled();
    f.down(); expect(f.classes.has('holding')).toBe(true);
    vi.advanceTimersByTime(2999); expect(f.confirm).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1); expect(f.confirm).toHaveBeenCalledTimes(1);
    f.down(); vi.advanceTimersByTime(5000); expect(f.confirm).toHaveBeenCalledTimes(1);
    f.up(); f.down(); vi.advanceTimersByTime(3000); expect(f.confirm).toHaveBeenCalledTimes(2);
    f.binding.dispose();
  });
  it.each(['leave', 'outside', 'pointercancel', 'button-blur', 'window-blur', 'hidden', 'escape', 'menu-close', 'dispose'])('cancels on %s and never carries partial time into the next hold', reason => {
    const f = fixture(); f.down(); vi.advanceTimersByTime(2900);
    if (reason === 'leave') f.send(f.button, 'pointerleave');
    if (reason === 'outside') f.send(f.button, 'pointermove', { pointerId: 1, clientX: 110, clientY: 20 });
    if (reason === 'pointercancel') f.send(f.doc, 'pointercancel', { pointerId: 1 });
    if (reason === 'button-blur') f.send(f.button, 'blur');
    if (reason === 'window-blur') f.send(f.win, 'blur');
    if (reason === 'hidden') { f.doc.hidden = true; f.send(f.doc, 'visibilitychange'); }
    if (reason === 'escape') f.send(f.doc, 'keydown', { key: 'Escape' });
    if (reason === 'menu-close') f.binding.cancel();
    if (reason === 'dispose') f.binding.dispose();
    vi.advanceTimersByTime(4000); expect(f.confirm).not.toHaveBeenCalled();
    expect(f.classes.has('holding')).toBe(false);
    if (reason !== 'dispose') {
      f.doc.hidden = false; f.down(); vi.advanceTimersByTime(100);
      expect(f.confirm).not.toHaveBeenCalled(); f.up();
    }
    f.binding.dispose();
  });
  it.each([' ', 'Enter'])('accepts a continuous %j key hold without treating autorepeat as new presses', key => {
    const f = fixture(); f.send(f.button, 'keydown', { key, repeat: false });
    vi.advanceTimersByTime(2000); f.send(f.button, 'keydown', { key, repeat: true });
    vi.advanceTimersByTime(1000); expect(f.confirm).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 5; i++) { f.send(f.button, 'keydown', { key, repeat: true }); vi.advanceTimersByTime(1000); }
    expect(f.confirm).toHaveBeenCalledTimes(1);
    f.send(f.button, 'keyup', { key }); f.send(f.button, 'keydown', { key, repeat: false });
    vi.advanceTimersByTime(2000); f.send(f.button, 'keyup', { key }); vi.advanceTimersByTime(3000);
    expect(f.confirm).toHaveBeenCalledTimes(1); f.binding.dispose();
  });
  it('ignores secondary mouse buttons and unrelated pointer releases', () => {
    const f = fixture(); f.send(f.button, 'pointerdown', { isPrimary: true, button: 2, pointerId: 1 });
    vi.advanceTimersByTime(4000); expect(f.confirm).not.toHaveBeenCalled();
    f.down(); vi.advanceTimersByTime(1500); f.send(f.doc, 'pointerup', { pointerId: 2 });
    vi.advanceTimersByTime(1500); expect(f.confirm).toHaveBeenCalledTimes(1); f.binding.dispose();
  });
  it('preserves campaign awards on a short press and clears persisted awards after a full hold', () => {
    let saved = JSON.stringify({ completed: ['a', 'b'], bonuses: ['a'] });
    const storage: ProgressStorage = { getItem: () => saved, setItem: (_key, value) => { saved = value; } };
    const campaign = new Campaign(['a', 'b'], storage);
    const f = fixture(vi.fn(() => campaign.reset()));
    f.down(); vi.advanceTimersByTime(2900); f.up();
    expect(new Campaign(['a', 'b'], storage).completed.size).toBe(2);
    f.down(); vi.advanceTimersByTime(3000);
    const reloaded = new Campaign(['a', 'b'], storage);
    expect(reloaded.completed.size).toBe(0); expect(reloaded.bonuses.size).toBe(0);
    expect(campaign.screen).toBe('world'); f.binding.dispose();
  });
});
