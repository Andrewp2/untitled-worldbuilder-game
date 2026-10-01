/** Original, small PCM scores. No recordings or third-party audio assets. */
export const AUDIO_SAMPLE_RATE = 22050;
export type SoundCue = 'select' | 'order' | 'pickup' | 'drop' | 'build' | 'dismantle' | 'battery' | 'signal' | 'complete' | 'error' | 'hit' | 'wreck';
type Instrument = 'bell' | 'pad' | 'bass' | 'metal';
type Note = { pitch: number; at: number; duration: number; volume: number; instrument?: Instrument };

function render(notes: Note[], seconds: number, loop = false): Float32Array {
  const samples = new Float32Array(Math.ceil(seconds * AUDIO_SAMPLE_RATE));
  for (const note of notes) {
    const frequency = 440 * 2 ** ((note.pitch - 69) / 12);
    const start = Math.round(note.at * AUDIO_SAMPLE_RATE);
    const length = Math.ceil(note.duration * AUDIO_SAMPLE_RATE);
    const instrument = note.instrument ?? 'bell';
    for (let i = 0; i < length; i++) {
      const index = loop ? (start + i) % samples.length : start + i;
      if (index >= samples.length) break;
      const t = i / AUDIO_SAMPLE_RATE, phase = 2 * Math.PI * frequency * t;
      const attack = Math.min(1, t / .008);
      const release = Math.min(1, (note.duration - t) / .045);
      const envelope = instrument === 'pad'
        ? Math.sin(Math.PI * t / note.duration) ** 2
        : attack * release * Math.exp(-t / (note.duration * .28));
      const tone = instrument === 'metal'
        ? Math.sin(phase) + .4 * Math.sin(phase * 1.47) + .22 * Math.sin(phase * 2.09)
        : Math.sin(phase) + (instrument === 'bass' ? .12 : .22) * Math.sin(phase * 2)
          + (instrument === 'bell' ? .12 * Math.exp(-t * 12) * Math.sin(phase * 3) : 0);
      samples[index] += tone * envelope * note.volume;
    }
  }
  // Leave headroom for music, motors, and simultaneous action sounds.
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  if (peak > .7) for (let i = 0; i < samples.length; i++) samples[i] *= .7 / peak;
  return samples;
}

/** A relaxed eight-bar D-minor theme: rounded bells, soft bass, and slow chords. */
export function makeMusic(): Float32Array {
  const beat = 60 / 92;
  const chords = [[50, 57, 60, 64], [46, 53, 57, 60], [48, 55, 57, 64], [48, 55, 62, 67],
    [50, 57, 60, 65], [46, 53, 57, 62], [48, 55, 60, 64], [45, 52, 57, 62]];
  const melody = [[74, 0, 77, 0, 81, 77, 0, 72], [74, 0, 72, 0, 69, 0, 65, 0],
    [72, 0, 76, 77, 0, 76, 72, 0], [74, 0, 79, 0, 76, 0, 72, 0],
    [77, 0, 81, 0, 84, 81, 77, 0], [74, 0, 77, 0, 72, 0, 69, 0],
    [76, 0, 79, 0, 77, 76, 72, 0], [74, 0, 69, 0, 72, 0, 0, 0]];
  const notes: Note[] = [];
  chords.forEach((chord, bar) => {
    const at = bar * 4 * beat;
    for (const pitch of chord) notes.push({ pitch, at, duration: 5 * beat, volume: .025, instrument: 'pad' });
    for (const offset of [0, 2]) notes.push({ pitch: chord[0] - 12, at: at + offset * beat, duration: 1.7 * beat, volume: .085, instrument: 'bass' });
    melody[bar].forEach((pitch, step) => {
      if (pitch) notes.push({ pitch, at: at + step * beat / 2, duration: 1.15 * beat, volume: step % 2 ? .07 : .095 });
    });
  });
  // Wrap chord tails into the beginning so the loop has no cut or silent seam.
  return render(notes, chords.length * 4 * beat, true);
}

export function makeEffect(cue: SoundCue): Float32Array {
  const notes: Note[] = [];
  const phrase = (pitches: number[], spacing: number, duration: number, volume: number, instrument: Instrument = 'bell') => {
    pitches.forEach((pitch, i) => notes.push({ pitch, at: i * spacing, duration, volume, instrument }));
  };
  switch (cue) {
    case 'select': phrase([81], .04, .08, .15); break;
    case 'order': phrase([62, 69], .055, .12, .17); break;
    case 'pickup': phrase([67, 74, 79], .055, .19, .19, 'metal'); break;
    case 'drop': phrase([79, 74, 67], .065, .22, .19, 'metal'); break;
    case 'build': phrase([50, 57, 62, 69], .07, .3, .21, 'metal'); break;
    case 'dismantle': phrase([69, 62, 57, 50], .06, .22, .18, 'metal'); break;
    case 'battery': phrase([57, 69, 76], .08, .24, .18); break;
    case 'signal': phrase([74, 81, 86], .14, .55, .2); break;
    case 'complete':
      phrase([74, 77, 81, 86], .16, .75, .2);
      for (const pitch of [50, 57, 62, 65, 69]) notes.push({ pitch, at: .48, duration: 1.1, volume: .07, instrument: 'pad' });
      break;
    case 'error': phrase([50, 46], .1, .17, .14, 'bass'); break;
    case 'hit': phrase([43, 67], .025, .12, .18, 'metal'); break;
    case 'wreck': phrase([62, 55, 43], .065, .28, .2, 'metal'); break;
  }
  return render(notes, Math.max(...notes.map(note => note.at + note.duration)) + .02);
}

/** Quiet electrical motor, with whole cycles at the seam of its one-second loop. */
export function makeMotor(): Float32Array {
  const samples = new Float32Array(AUDIO_SAMPLE_RATE);
  for (let i = 0; i < samples.length; i++) {
    const t = i / AUDIO_SAMPLE_RATE, phase = 2 * Math.PI * 62 * t;
    samples[i] = (.055 * Math.sin(phase) + .012 * Math.sin(phase * 3)) * (.85 + .15 * Math.sin(2 * Math.PI * 4 * t));
  }
  return samples;
}
