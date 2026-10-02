#!/usr/bin/env python3
"""Render the original 32-bar 'Tinker Tide' score.

Offline authoring only: Python standard library, FluidSynth, FFmpeg and
the MIT-licensed FluidR3 GM soundfont. None are runtime dependencies.
Run: python3 scripts/render-music.py [path/to/FluidR3_GM.sf2]
"""
from pathlib import Path
import math
import random
import struct
import subprocess
import sys
import tempfile
import wave

ROOT = Path(__file__).resolve().parents[1]
FONT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/usr/share/sounds/sf2/FluidR3_GM.sf2')
RATE, BPM, PPQ, BARS = 44100, 108, 480, 32
TEMPO = round(60_000_000 / BPM)
SECONDS = BARS * 4 * TEMPO / 1_000_000

# Original D-Dorian groove. Short bass/mallet conversations and changing
# percussion carry the piece; there is no sustained lead or constant solo.
# (bass root, fifth, seventh, compact offbeat chord)
CHORDS = {
    'Dm9': (38, 45, 48, [60, 64, 65, 69]),
    'G13': (43, 50, 53, [59, 64, 65, 69]),
    'C69': (36, 43, 45, [60, 64, 67, 69]),
    'Fmaj9': (41, 48, 52, [60, 64, 67, 69]),
    'A7': (33, 40, 43, [61, 64, 67, 71]),
}
HARMONY = (['Dm9', 'Dm9', 'G13', 'Dm9', 'Dm9', 'Dm9', 'G13', 'Dm9']
           + ['Fmaj9', 'Fmaj9', 'C69', 'C69', 'G13', 'G13', 'Dm9', 'A7']
           + ['Dm9', 'Dm9', 'G13', 'Dm9', 'Dm9', 'Dm9', 'G13', 'Dm9']
           + ['Dm9', 'Dm9', 'G13', 'G13', 'Fmaj9', 'C69', 'Dm9', 'A7'])
# Eight-bar phrases, leaving whole beats/bar endings clear for the groove.
# (beat within bar, MIDI pitch, duration in beats)
THEME = [
    [(.5, 69, .32), (1.25, 72, .25), (1.75, 74, .5)],
    [(1.5, 72, .3), (2, 69, .32), (3, 67, .4)],
    [(.75, 67, .35), (1.5, 69, .3), (2.5, 71, .5)],
    [(1, 69, .4), (2.5, 65, .3), (3, 64, .55)],
    [(.5, 69, .32), (1.25, 72, .25), (1.75, 74, .5)],
    [(1.5, 77, .4), (2.25, 74, .3), (3, 72, .4)],
    [(.75, 71, .35), (1.5, 69, .4)],
    [(1, 65, .32), (1.75, 64, .25), (2.5, 62, .65)],
]
ANSWER = [
    [(1, 69, .45), (2.5, 67, .4)],
    [(.5, 65, .4), (1.5, 64, .4)],
    [(1, 67, .4), (2.5, 69, .4)],
    [(.5, 72, .6), (2.5, 69, .45)],
    [(1, 71, .5), (2.5, 69, .4)],
    [(.5, 67, .4), (1.5, 64, .6)],
    [(1, 65, .4), (2.5, 64, .4)],
    [(.5, 61, .4), (1.5, 64, .4), (3, 67, .3)],
]


def vlq(value):
    result = [value & 127]
    while value := value >> 7:
        result.insert(0, (value & 127) | 128)
    return bytes(result)


def score():
    events = [(0, bytes([0xff, 0x51, 3]) + TEMPO.to_bytes(3, 'big'))]
    # Finger bass, muted guitar, marimba, clavinet and vibraphone. Keep a
    # narrow stereo stage and dry percussion, like a little toy ensemble.
    for channel, program, volume, pan in [(0, 28, 49, 45), (1, 7, 47, 78),
                                          (2, 12, 66, 58), (3, 33, 94, 64),
                                          (4, 11, 49, 75)]:
        events.extend([(0, bytes([0xc0 + channel, program])),
                       (0, bytes([0xb0 + channel, 7, volume])),
                       (0, bytes([0xb0 + channel, 10, pan])),
                       (0, bytes([0xb0 + channel, 91, 13 if channel in [2, 4] else 0]))])
    events.extend([(0, bytes([0xc9, 0])), (0, bytes([0xb9, 7, 74])),
                   (0, bytes([0xb9, 91, 0]))])
    rng = random.Random(417)
    phrase = []

    def note(channel, pitch, beat, duration, velocity):
        # Slight sixteenth-note swing, with fixed microtiming and dynamics.
        # Fixed variations preserve the composed, repeatable loop boundary.
        swing = .045 if round(beat * 4) % 2 == 1 else 0
        offset = rng.uniform(0, .009) + swing
        velocity = max(1, min(110, velocity + rng.randint(-3, 3)))
        phrase.append((round((beat + offset) * PPQ), bytes([0x90 + channel, pitch, velocity])))
        phrase.append((round((beat + offset + duration) * PPQ), bytes([0x80 + channel, pitch, 0])))

    for bar, name in enumerate(HARMONY):
        section, local = divmod(bar, 8)
        at = bar * 4
        root, fifth, seventh, voicing = CHORDS[name]
        sparse = section == 3 and local < 4
        # A two-bar bass question/answer; the sixteenth pickups give it a
        # different feel from the previous track's regular octave skips.
        bass = ([(0, root, .48, 81), (.75, root + 12, .19, 55),
                 (1.5, seventh, .26, 66), (2.25, fifth, .38, 73),
                 (3.5, root + 12, .25, 64)] if local % 2 == 0 else
                [(0, root, .55, 81), (1.25, fifth, .22, 63),
                 (1.75, root + 12, .37, 72), (2.75, seventh, .28, 63),
                 (3.5, fifth, .22, 67), (3.75, root + 11, .16, 46)])
        for beat, pitch, duration, velocity in bass:
            if not sparse or beat < 3:
                note(3, pitch, at + beat, duration, velocity - (6 if sparse else 0))
        # Short muted-guitar offbeats; the clav answers in spaces, never
        # doubling a loud keyboard chord throughout the whole piece.
        for beat in ([1.5, 3.5] if sparse else [.5, 1.5, 2.5, 3.5]):
            for index, pitch in enumerate(voicing[:3]):
                note(0, pitch, at + beat + index * .008, .14, 47)
        if section in [0, 2] and local % 2:
            for beat, pitch in [(0.75, voicing[1]), (3.25, voicing[2])]:
                note(1, pitch, at + beat, .18, 50)
        if section in [0, 2]:
            for beat, pitch, duration in THEME[local]:
                note(2, pitch, at + beat, duration, 65 if section == 0 else 59)
            if section == 2 and local in [1, 5]:
                note(4, voicing[-1], at + 3.5, .4, 43)
        elif section == 1:
            for beat, pitch, duration in ANSWER[local]:
                note(4, pitch, at + beat, duration, 60)
        elif local >= 4:
            for beat, pitch, duration in ANSWER[local]:
                note(2, pitch, at + beat, duration, 53)
        # Bass drum, cross-stick, closed hat, and a little hand-drum exchange.
        # The half-time cross-stick in the break lets the groove breathe.
        for beat, velocity in [(0, 72), (2, 62), (2.75, 45)]:
            if not sparse or beat in [0, 2]:
                note(9, 36, at + beat, .1, velocity)
        for beat in ([2] if sparse else [1, 3]):
            note(9, 37, at + beat + .016, .1, 56)
        for i in range(8):
            if not sparse or i % 2:
                note(9, 42, at + i * .5, .08, 33 if i % 2 else 24)
        congas = ([(.75, 62, 39), (1.5, 64, 52), (2.25, 62, 41), (3.5, 63, 57)]
                  if local % 2 == 0 else
                  [(.5, 64, 49), (1.75, 62, 40), (2.5, 63, 54), (3.25, 64, 47)])
        for beat, pitch, velocity in congas:
            note(9, pitch, at + beat, .12, velocity - (9 if sparse else 0))
        if local == 7:
            for beat, pitch, velocity in [(3.5, 60, 42), (3.75, 61, 48)]:
                note(9, pitch, at + beat, .1, velocity)

    # Render three passes and keep the middle one: reverb/release tails from
    # the previous pass are present at the start, with no fade-to-silence seam.
    for cycle in range(3):
        events.extend((tick + cycle * BARS * 4 * PPQ, event) for tick, event in phrase)
    events.append((3 * BARS * 4 * PPQ, b'\xff\x2f\x00'))
    events.sort(key=lambda event: event[0])
    track, last = bytearray(), 0
    for tick, event in events:
        track += vlq(tick - last) + event
        last = tick
    return b'MThd' + struct.pack('>IHHH', 6, 0, 1, PPQ) + b'MTrk' + struct.pack('>I', len(track)) + track


def main():
    if not FONT.is_file():
        raise SystemExit(f'Soundfont missing: {FONT}')
    target = ROOT / 'src/audio/assets/tinker-tide.ogg'
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='worldbuilder-music-') as folder:
        midi, rendered, loop = (Path(folder) / name for name in ['score.mid', 'render.wav', 'loop.wav'])
        midi.write_bytes(score())
        subprocess.run(['fluidsynth', '-ni', '-q', '-C', '0', '-R', '1', '-r', str(RATE), '-g', '.55',
                        '-o', 'synth.reverb.room-size=.2', '-o', 'synth.reverb.level=.11',
                        '-F', str(rendered), '-T', 'wav', '-O', 's16', str(FONT), str(midi)], check=True)
        with wave.open(str(rendered), 'rb') as source:
            assert source.getnchannels() == 2 and source.getsampwidth() == 2
            # Match the last 8ms to the actual lead-in of the retained pass.
            # Sampled instruments can retain different oscillator phases
            # across repeats even when the MIDI events are identical.
            seam_frames = round(.008 * RATE)
            source.setpos(round(SECONDS * RATE) - seam_frames)
            lead_in = source.readframes(seam_frames)
            pcm = source.readframes(round(SECONDS * RATE))
        values = list(struct.unpack('<' + 'h' * (len(pcm) // 2), pcm))
        lead_values = struct.unpack('<' + 'h' * (len(lead_in) // 2), lead_in)
        for frame in range(seam_frames):
            blend = .5 - .5 * math.cos(math.pi * frame / (seam_frames - 1))
            for channel in range(2):
                offset = frame * 2 + channel
                index = len(values) - len(lead_values) + offset
                values[index] = round(values[index] * (1 - blend) + lead_values[offset] * blend)
        peak = max(abs(value) for value in values)
        rms = math.sqrt(sum(value * value for value in values) / len(values))
        # Peak-normalize the file to -4 dBFS; GameAudio applies the actual
        # background mix gain. No limiter pumping or clipped peaks.
        gain = 32767 * 10 ** (-4 / 20) / peak
        with wave.open(str(loop), 'wb') as output:
            output.setparams((2, 2, RATE, 0, 'NONE', 'not compressed'))
            output.writeframes(struct.pack('<' + 'h' * len(values), *(round(value * gain) for value in values)))
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(loop), '-c:a', 'libvorbis', '-q:a', '4',
                        '-metadata', 'title=Tinker Tide', '-metadata', 'comment=Original game score; FluidR3 GM instruments (MIT)', str(target)], check=True)
        print(f'{target.relative_to(ROOT)}: {SECONDS:.0f}s, {target.stat().st_size / 1024:.0f} KiB; '
              f'pre-encode peak -4 dBFS, RMS {20 * math.log10(rms * gain / 32768):.1f} dBFS')


if __name__ == '__main__':
    main()
