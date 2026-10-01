import { AUDIO_SAMPLE_RATE, makeEffect, makeMotor, makeMusic, type SoundCue } from './score';

export type AudioState = { musicEnabled: boolean; effectsEnabled: boolean; started: boolean; available: boolean };
// Prepare samples during startup, keeping synthesis work out of the first game click.
const musicSamples = makeMusic();
const motorSamples = makeMotor();

/** Owns audio only; simulation events and visible controls drive it. */
export class GameAudio {
  readonly state: AudioState = { musicEnabled: false, effectsEnabled: false, started: false, available: true };
  private context: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private effectsGain: GainNode | null = null;
  private motorGain: GainNode | null = null;
  private buffers = new Map<SoundCue, AudioBuffer>();
  private loops: AudioBufferSourceNode[] = [];
  private effects = new Set<AudioBufferSourceNode>();
  private pending: SoundCue[] = [];
  private hidden = false;
  private paused = false;
  private moving = 0;
  private disposed = false;
  private resuming: Promise<void> | null = null;
  private createContext: () => AudioContext;
  private onChange: (state: AudioState) => void;

  constructor(options: { createContext?: () => AudioContext; onChange?: (state: AudioState) => void } = {}) {
    this.createContext = options.createContext ?? (() => new AudioContext({ latencyHint: 'interactive' }));
    this.onChange = options.onChange ?? (() => {});
    this.state.available = !!options.createContext || typeof AudioContext !== 'undefined';
  }

  private buffer(samples: Float32Array): AudioBuffer {
    const buffer = this.context!.createBuffer(1, samples.length, AUDIO_SAMPLE_RATE);
    buffer.copyToChannel(samples as Float32Array<ArrayBuffer>, 0);
    return buffer;
  }
  private startLoop(samples: Float32Array, gain: GainNode): void {
    const source = this.context!.createBufferSource();
    source.buffer = this.buffer(samples); source.loop = true; source.connect(gain); source.start();
    this.loops.push(source);
  }
  private initialize(): void {
    this.context = this.createContext();
    this.musicGain = this.context.createGain();
    this.effectsGain = this.context.createGain();
    this.motorGain = this.context.createGain();
    for (const gain of [this.musicGain, this.effectsGain, this.motorGain]) gain.gain.value = 0;
    this.musicGain.connect(this.context.destination);
    this.effectsGain.connect(this.context.destination);
    this.motorGain.connect(this.effectsGain);
    this.startLoop(musicSamples, this.musicGain);
    this.startLoop(motorSamples, this.motorGain);
  }
  /** Called directly by a pointer/key gesture; no audio is created on page load. */
  async unlock(): Promise<void> {
    if (this.disposed || this.hidden || !this.state.available) return;
    try {
      if (!this.context) this.initialize();
      if (this.context!.state !== 'running') {
        this.resuming ??= this.context!.resume().finally(() => { this.resuming = null; });
        await this.resuming;
      }
      if (this.disposed) return;
      if (this.hidden) { await this.context!.suspend(); return; }
      this.state.started = true;
      this.updateGains(); this.onChange(this.state);
      for (const cue of this.pending.splice(0)) this.play(cue);
    } catch {
      if (!this.disposed) { this.state.available = false; this.state.started = false; this.onChange(this.state); }
    }
  }
  private ramp(gain: GainNode | null, value: number): void {
    if (!gain || !this.context || this.context.state === 'closed') return;
    const now = this.context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(value, now + .06);
  }
  private updateGains(): void {
    const active = this.state.started && !this.hidden;
    this.ramp(this.musicGain, active && this.state.musicEnabled ? (this.paused ? .2 : .55) : 0);
    this.ramp(this.effectsGain, active && this.state.effectsEnabled ? .65 : 0);
    this.ramp(this.motorGain, active && !this.paused && this.moving ? Math.min(1.2, .65 + this.moving * .15) : 0);
  }
  // Both channels are opt-ins for this tab; every game load starts quietly.
  setMusic(enabled: boolean): void {
    this.state.musicEnabled = enabled;
    this.updateGains(); this.onChange(this.state);
  }
  setEffects(enabled: boolean): void {
    this.state.effectsEnabled = enabled;
    if (!enabled) { this.pending = []; this.stopEffects(); }
    this.updateGains(); this.onChange(this.state);
  }
  setSceneState(paused: boolean, moving: number): void {
    if (this.paused === paused && this.moving === moving) return;
    this.paused = paused; this.moving = moving; this.updateGains();
  }
  setHidden(hidden: boolean): void {
    if (this.hidden === hidden || this.disposed) return;
    this.hidden = hidden;
    if (hidden) {
      this.pending = []; this.stopEffects(); this.updateGains();
      void this.context?.suspend().catch(() => {});
    } else if (this.state.started) void this.unlock();
  }
  play(cue: SoundCue): void {
    if (this.disposed || this.hidden || !this.state.effectsEnabled || !this.state.available || !this.context) return;
    if (!this.state.started) { if (this.pending.length < 4) this.pending.push(cue); return; }
    // A flurry of input cannot turn into a loud stack or keep unbounded nodes alive.
    if (this.effects.size >= 8) return;
    let buffer = this.buffers.get(cue);
    if (!buffer) { buffer = this.buffer(makeEffect(cue)); this.buffers.set(cue, buffer); }
    const source = this.context.createBufferSource();
    source.buffer = buffer; source.connect(this.effectsGain!);
    source.onended = () => { source.disconnect(); this.effects.delete(source); };
    this.effects.add(source); source.start();
  }
  private stopEffects(): void {
    for (const source of this.effects) { source.stop(); source.disconnect(); }
    this.effects.clear();
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.pending = []; this.stopEffects();
    for (const source of this.loops) { source.stop(); source.disconnect(); }
    this.loops = []; this.buffers.clear();
    void this.context?.close().catch(() => {});
  }
}
