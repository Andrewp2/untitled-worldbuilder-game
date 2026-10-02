import { describe, expect, it, vi } from 'vitest';
import { GameAudio } from '../src/audio/GameAudio';
import { AUDIO_SAMPLE_RATE, makeEffect, makeMotor, type SoundCue } from '../src/audio/score';

class Param {
  value = 1;
  cancelScheduledValues() {}
  setValueAtTime(value: number) { this.value = value; }
  linearRampToValueAtTime(value: number) { this.value = value; }
}
class Source {
  buffer: unknown;
  loop = false;
  started = false;
  stopped = false;
  disconnected = false;
  onended: (() => void) | null = null;
  connect() {}
  start() { this.started = true; }
  stop() { this.stopped = true; this.onended?.(); }
  disconnect() { this.disconnected = true; }
}
class Context {
  state: AudioContextState = 'suspended';
  currentTime = 0;
  destination = {};
  gains: { gain: Param; connect: () => void }[] = [];
  sources: Source[] = [];
  resume = vi.fn(async () => { this.state = 'running'; });
  suspend = vi.fn(async () => { this.state = 'suspended'; });
  close = vi.fn(async () => { this.state = 'closed'; });
  createGain() {
    const gain = { gain: new Param(), connect() {} };
    this.gains.push(gain); return gain;
  }
  createBuffer(_channels: number, length: number, sampleRate: number) {
    return { length, sampleRate, copyToChannel(_samples: Float32Array) {} };
  }
  createBufferSource() { const source = new Source(); this.sources.push(source); return source; }
}
const setup = (loadMusic = vi.fn(async (_context: AudioContext, _signal: AbortSignal) => ({ duration: 64 }) as AudioBuffer)) => {
  const context = new Context();
  const createContext = vi.fn(() => context as unknown as AudioContext);
  return { context, createContext, loadMusic, audio: new GameAudio({ createContext, loadMusic }) };
};

describe('game audio lifecycle and player controls', () => {
  it('waits for activation, then reuses one context and its enabled loops across repeated gestures', async () => {
    const { audio, context, createContext } = setup();
    audio.setEffects(true);
    audio.play('select'); audio.setSceneState(false, 1);
    expect(createContext).not.toHaveBeenCalled();
    await audio.unlock(); await audio.unlock();
    expect(createContext).toHaveBeenCalledTimes(1);
    expect(context.resume).toHaveBeenCalledTimes(1);
    expect(context.sources.filter(source => source.loop && source.started)).toHaveLength(1);
    audio.setMusic(true); await audio.unlock(); await audio.unlock();
    expect(context.sources.filter(source => source.loop && source.started)).toHaveLength(2);
    expect(context.gains[2].gain.value).toBeGreaterThan(0);
    audio.dispose();
  });
  it('mutes each channel independently and never queues effects while muted', async () => {
    const { audio, context } = setup(); audio.setEffects(true); await audio.unlock();
    audio.setMusic(false); audio.play('pickup');
    expect(context.gains[0].gain.value).toBe(0);
    expect(context.sources.filter(source => !source.loop)).toHaveLength(1);
    audio.setEffects(false); audio.play('drop');
    expect(context.gains[1].gain.value).toBe(0);
    expect(context.sources.find(source => !source.loop)!.stopped).toBe(true);
    audio.setMusic(true); await audio.unlock();
    expect(context.gains[0].gain.value).toBeGreaterThan(0);
    expect(context.gains[1].gain.value).toBe(0);
    audio.setEffects(true);
    expect(context.sources.filter(source => !source.loop)).toHaveLength(1);
    audio.dispose();
  });
  it('silences motors while idle or paused, retaining quiet music during pause', async () => {
    const { audio, context } = setup(); audio.setMusic(true); audio.setEffects(true); await audio.unlock();
    expect(context.gains[2].gain.value).toBe(0);
    audio.setSceneState(false, 2);
    expect(context.gains[2].gain.value).toBeGreaterThan(0);
    const musicVolume = context.gains[0].gain.value;
    audio.setSceneState(true, 2);
    expect(context.gains[2].gain.value).toBe(0);
    expect(context.gains[0].gain.value).toBeGreaterThan(0);
    expect(context.gains[0].gain.value).toBeLessThan(musicVolume);
    audio.setSceneState(false, 0);
    expect(context.gains[2].gain.value).toBe(0);
    audio.dispose();
  });
  it('suspends a hidden tab, discards transient sounds, and resumes without duplicating loops', async () => {
    const { audio, context } = setup(); audio.setMusic(true); audio.setEffects(true); await audio.unlock(); audio.play('build');
    audio.setHidden(true); audio.play('complete');
    expect(context.suspend).toHaveBeenCalledTimes(1);
    expect(context.sources[2].stopped).toBe(true);
    expect(context.gains.every(gain => gain.gain.value === 0)).toBe(true);
    audio.setHidden(false); await audio.unlock();
    expect(context.sources).toHaveLength(3);
    expect(context.resume).toHaveBeenCalledTimes(2);
    expect(context.gains[0].gain.value).toBeGreaterThan(0);
    audio.dispose();
  });
  it('starts both channels off for every new session and enables them independently', async () => {
    const { audio, context } = setup();
    audio.setSceneState(false, 1);
    await audio.unlock();
    expect(context.gains[0].gain.value).toBe(0);
    expect(context.gains[1].gain.value).toBe(0);
    expect(audio.state).toMatchObject({ musicEnabled: false, effectsEnabled: false });
    audio.play('select');
    expect(context.sources.filter(source => !source.loop)).toHaveLength(0);
    audio.setEffects(true); audio.play('pickup');
    expect(context.gains[1].gain.value).toBeGreaterThan(0);
    expect(context.gains[0].gain.value).toBe(0);
    expect(context.sources.filter(source => !source.loop)).toHaveLength(1);
    audio.setMusic(true);
    expect(context.gains[0].gain.value).toBeGreaterThan(0);
    const next = setup(); await next.audio.unlock();
    expect(next.audio.state).toMatchObject({ musicEnabled: false, effectsEnabled: false });
    expect(next.context.gains[0].gain.value).toBe(0);
    expect(next.context.gains[1].gain.value).toBe(0);
    audio.dispose(); next.audio.dispose();
  });
  it('starts quietly even when older saved preferences enable both channels', async () => {
    vi.stubGlobal('localStorage', { getItem: () => '{"musicEnabled":true,"effectsEnabled":true}', setItem: () => {} });
    const { audio, context } = setup();
    try {
      await audio.unlock(); audio.play('select');
      expect(audio.state).toMatchObject({ musicEnabled: false, effectsEnabled: false });
      expect(context.gains.every(gain => gain.gain.value === 0)).toBe(true);
      expect(context.sources.filter(source => !source.loop)).toHaveLength(0);
    } finally { audio.dispose(); vi.unstubAllGlobals(); }
  });
  it('cleans up all sources and remains safe when audio is unavailable', async () => {
    const { audio, context } = setup(); audio.setEffects(true); await audio.unlock(); audio.play('signal');
    audio.dispose(); audio.dispose(); await audio.unlock(); audio.play('build');
    expect(context.close).toHaveBeenCalledTimes(1);
    expect(context.sources.every(source => source.stopped && source.disconnected)).toBe(true);
    const unavailable = new GameAudio({ createContext: () => { throw new Error('audio unavailable'); } });
    await expect(unavailable.unlock()).resolves.toBeUndefined();
    expect(unavailable.state.available).toBe(false);
    expect(() => unavailable.play('error')).not.toThrow();
    unavailable.dispose();
  });
  it('bounds simultaneous effects and frees voices after playback', async () => {
    const { audio, context } = setup(); audio.setEffects(true); await audio.unlock();
    for (let i = 0; i < 100; i++) audio.play('select');
    expect(context.sources.filter(source => !source.loop)).toHaveLength(8);
    const ended = context.sources.find(source => !source.loop)!;
    ended.onended?.(); audio.play('pickup');
    expect(context.sources.filter(source => !source.loop)).toHaveLength(9);
    expect(ended.disconnected).toBe(true);
    audio.dispose();
  });
  it('does not wake hidden or disposed audio when a delayed activation finishes', async () => {
    for (const deactivate of ['hide', 'dispose'] as const) {
      const { audio, context } = setup();
      audio.setEffects(true);
      let finishResume!: () => void;
      context.resume = vi.fn(() => new Promise<void>(resolve => {
        finishResume = () => { context.state = 'running'; resolve(); };
      }));
      const activation = audio.unlock(); audio.play('pickup');
      if (deactivate === 'hide') audio.setHidden(true); else audio.dispose();
      finishResume(); await activation;
      expect(context.sources).toHaveLength(1);
      expect(context.gains.every(gain => gain.gain.value === 0)).toBe(true);
      if (deactivate === 'hide') expect(context.state).toBe('suspended');
      else expect(context.sources.every(source => source.stopped)).toBe(true);
      audio.dispose();
    }
  });
});

describe('recorded music loading', () => {
  it('loads only after opting in, and never duplicates a loading or playing soundtrack', async () => {
    let finish!: (buffer: AudioBuffer) => void;
    const loader = vi.fn((_context: AudioContext, _signal: AbortSignal) => new Promise<AudioBuffer>(resolve => { finish = resolve; }));
    const { audio, context, loadMusic } = setup(loader);
    await audio.unlock();
    expect(loadMusic).not.toHaveBeenCalled();
    audio.setMusic(true); audio.setMusic(false); audio.setMusic(true);
    expect(loadMusic).toHaveBeenCalledTimes(1);
    finish({ duration: 64 } as AudioBuffer); await audio.unlock();
    audio.setMusic(false); audio.setMusic(true); await audio.unlock();
    expect(loadMusic).toHaveBeenCalledTimes(1);
    expect(context.sources.filter(source => source.loop)).toHaveLength(2);
    audio.dispose();
  });
  it.each(['mute', 'hide', 'dispose'] as const)('does not start music if %s happens during loading', async action => {
    let finish!: (buffer: AudioBuffer) => void;
    const loader = vi.fn((_context: AudioContext, _signal: AbortSignal) => new Promise<AudioBuffer>(resolve => { finish = resolve; }));
    const { audio, context } = setup(loader);
    await audio.unlock(); audio.setMusic(true);
    const waiting = audio.unlock();
    if (action === 'mute') audio.setMusic(false);
    else if (action === 'hide') audio.setHidden(true);
    else audio.dispose();
    finish({ duration: 64 } as AudioBuffer); await waiting;
    expect(context.sources).toHaveLength(1);
    if (action === 'dispose') expect(loader.mock.calls[0][1].aborted).toBe(true);
    else {
      if (action === 'mute') audio.setMusic(true); else audio.setHidden(false);
      await audio.unlock();
      expect(loader).toHaveBeenCalledTimes(1);
      expect(context.sources.filter(source => source.loop)).toHaveLength(2);
    }
    audio.dispose();
  });
  it('keeps effects working after a failed music load and allows a later retry', async () => {
    const loader = vi.fn(async (_context: AudioContext, _signal: AbortSignal) => ({ duration: 64 }) as AudioBuffer)
      .mockRejectedValueOnce(new Error('offline'));
    const { audio, context } = setup(loader);
    audio.setMusic(true); audio.setEffects(true); await audio.unlock();
    expect(audio.state).toMatchObject({ available: true, musicEnabled: false, effectsEnabled: true });
    audio.play('pickup'); expect(context.sources.some(source => !source.loop && source.started)).toBe(true);
    audio.setMusic(true); await audio.unlock();
    expect(loader).toHaveBeenCalledTimes(2);
    expect(context.sources.filter(source => source.loop)).toHaveLength(2);
    audio.dispose();
  });
});

function levels(samples: Float32Array) {
  let peak = 0, squares = 0;
  for (const sample of samples) {
    if (!Number.isFinite(sample)) throw new Error('Invalid PCM sample');
    peak = Math.max(peak, Math.abs(sample)); squares += sample * sample;
  }
  return { peak, rms: Math.sqrt(squares / samples.length) };
}
describe('authored audio signals', () => {
  it('keeps action effects short, audible, and within safe sample bounds', () => {
    const cues: SoundCue[] = ['select','order','pickup','drop','build','dismantle','battery','signal','complete','error','hit','wreck'];
    for (const cue of cues) {
      const samples = makeEffect(cue), { peak, rms } = levels(samples);
      expect(peak, cue).toBeLessThanOrEqual(.701); expect(rms, cue).toBeGreaterThan(.005);
      expect(samples.length / AUDIO_SAMPLE_RATE, cue).toBeLessThan(2);
      expect(Math.abs(samples.at(-1)!), cue).toBeLessThan(.001);
    }
  });
  it('renders a quiet motor loop without a discontinuity', () => {
    const motor = makeMotor(), { peak, rms } = levels(motor);
    expect(peak).toBeLessThan(.1); expect(rms).toBeGreaterThan(.01);
    expect(Math.abs(motor[0] - motor.at(-1)!)).toBeLessThan(.003);
  });
});
