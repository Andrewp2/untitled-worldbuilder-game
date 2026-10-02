#!/usr/bin/env python3
"""Render the original 32-bar 'Little Expeditions' score.

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
RATE, BPM, PPQ, BARS = 44100, 120, 480, 32
SECONDS = BARS * 4 * 60 / BPM

# Root below middle C, then compact keyboard voicings. D major, with a
# contrasting middle phrase and a sparse final eight bars to give the ear rest.
CHORDS = {
    'D': (38, [57, 62, 66, 71]), 'Dmaj': (38, [57, 61, 66, 69]),
    'G': (43, [55, 59, 62, 66]), 'Em': (40, [55, 59, 62, 66]),
    'A': (45, [55, 61, 64, 69]), 'Bm': (35, [57, 62, 66, 71]),
    'Fsm': (42, [57, 61, 64, 68]),
}
HARMONY = (['D', 'G', 'Em', 'A', 'Dmaj', 'Bm', 'Em', 'A']
           + ['G', 'Dmaj', 'Em', 'A', 'Bm', 'G', 'Em', 'A']
           + ['D', 'G', 'Em', 'A', 'Dmaj', 'Bm', 'Em', 'A']
           + ['Dmaj', 'G', 'Bm', 'Fsm', 'Em', 'A', 'G', 'A'])
# (beat within bar, MIDI pitch, duration in beats). Spaces between gestures
# are intentional; the accompaniment does not double the lead melody.
THEME = [
    [(.5, 66, .65), (1.5, 69, .4), (2, 71, .9), (3.25, 69, .5)],
    [(0, 67, .9), (1.5, 66, .5), (2.5, 64, 1.05)],
    [(.5, 64, .45), (1, 67, .4), (2, 71, .9), (3.25, 69, .4)],
    [(0, 73, .9), (1.5, 71, .5), (2.5, 69, 1)],
    [(0, 66, .9), (1.5, 69, .5), (2.5, 74, 1)],
    [(0, 73, .65), (1, 71, 1.2), (3, 66, .65)],
    [(.5, 67, .8), (2, 66, .4), (2.75, 64, .8)],
    [(0, 64, .65), (1, 73, .65), (2.5, 69, .7)],
]
MIDDLE = [
    [(0, 71, 1.2), (2, 74, .5), (3, 71, .6)],
    [(.5, 69, .6), (1.5, 66, .5), (2.5, 64, 1)],
    [(0, 67, .65), (1, 71, .65), (2.5, 76, 1)],
    [(0, 73, 1.1), (2, 71, .5), (3, 69, .65)],
    [(.5, 66, .6), (1.5, 71, 1.4)],
    [(0, 74, .7), (1.5, 71, .5), (2.5, 67, .9)],
    [(.5, 66, .65), (1.5, 64, .6), (2.5, 67, .7)],
    [(0, 69, 1.4)],
]


def vlq(value):
    result = [value & 127]
    while value := value >> 7:
        result.insert(0, (value & 127) | 128)
    return bytes(result)


def score():
    events = [(0, bytes([0xff, 0x51, 3]) + int(60_000_000 / BPM).to_bytes(3, 'big'))]
    # General MIDI: electric piano, square lead, marimba, and synth bass.
    # A compact, sampled 16-bit game palette.
    for channel, program, volume, pan in [(0, 5, 62, 42), (1, 80, 53, 59),
                                          (2, 12, 66, 85), (3, 38, 70, 64)]:
        events.extend([(0, bytes([0xc0 + channel, program])),
                       (0, bytes([0xb0 + channel, 7, volume])),
                       (0, bytes([0xb0 + channel, 10, pan])),
                       (0, bytes([0xb0 + channel, 91, 28]))])
    events.extend([(0, bytes([0xc9, 0])), (0, bytes([0xb9, 7, 54]))])
    rng = random.Random(417)
    phrase = []

    def note(channel, pitch, beat, duration, velocity):
        # Fixed microtiming/dynamics repeat with the composition, so the
        # ambience also has a reproducible seamless boundary.
        offset = rng.uniform(0, .018) if channel != 3 else 0
        phrase.append((round((beat + offset) * PPQ), bytes([0x90 + channel, pitch, max(1, min(100, velocity + rng.randint(-3, 3)))])))
        phrase.append((round((beat + offset + duration) * PPQ), bytes([0x80 + channel, pitch, 0])))

    for bar, name in enumerate(HARMONY):
        section, local = divmod(bar, 8)
        at = bar * 4
        root, voicing = CHORDS[name]
        soft = section == 3
        # Short octave skips supply bounce without a constant high arpeggio.
        note(3, root, at, .6, 66 if not soft else 54)
        note(3, root + 12, at + 1.5, .3, 48)
        note(3, root + (12 if local % 2 else 7), at + 2.5, .6, 57)
        if not soft:
            note(3, root + 12, at + 3.5, .3, 46)
        # Offbeat keyboard stabs leave the melody room to speak.
        for beat in ([.5, 2.5] if soft else [.5, 1.75, 2.5, 3.5]):
            for index, pitch in enumerate(voicing):
                note(0, pitch, at + beat + index * .008, .35, 47 - (8 if soft else 0))
        if section != 3:
            lead = MIDDLE[local] if section == 1 else THEME[local]
            # Square lead states the theme; marimba answers in the middle.
            channel = 2 if section == 1 else 1
            for beat, pitch, duration in lead:
                note(channel, pitch, at + beat, duration * .72, 68 if channel == 2 else 57)
            if section == 2 and local in [1, 3, 5, 7]:
                note(2, voicing[-1] + 12, at + 3.5, .35, 38)
        else:
            # Instrumental breathing space before the theme returns.
            for beat, pitch in [(1, voicing[1] + 12), (2.75, voicing[2] + 12)]:
                if local not in [3, 7]:
                    note(2, pitch, at + beat, .65, 42)
        # Restrained drum-machine pulse, with small fills at phrase endings.
        # The last phrase drops the backbeat to avoid an unbroken loop of it.
        if not soft:
            for beat in [0, 2.5]:
                note(9, 36, at + beat, .1, 46)
            for beat in [1, 3]:
                note(9, 38, at + beat, .1, 35)
            for beat in [.5, 1.5, 2.5, 3.5]:
                note(9, 42, at + beat, .08, 26)
            if local == 7:
                note(9, 38, at + 3.5, .08, 27)
                note(9, 38, at + 3.75, .08, 22)

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
    target = ROOT / 'src/audio/assets/little-expeditions.ogg'
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='worldbuilder-music-') as folder:
        midi, rendered, loop = (Path(folder) / name for name in ['score.mid', 'render.wav', 'loop.wav'])
        midi.write_bytes(score())
        subprocess.run(['fluidsynth', '-ni', '-q', '-C', '0', '-R', '1', '-r', str(RATE), '-g', '.55',
                        '-o', 'synth.reverb.room-size=.35', '-o', 'synth.reverb.level=.18',
                        '-F', str(rendered), '-T', 'wav', '-O', 's16', str(FONT), str(midi)], check=True)
        with wave.open(str(rendered), 'rb') as source:
            assert source.getnchannels() == 2 and source.getsampwidth() == 2
            source.setpos(round(SECONDS * RATE))
            pcm = source.readframes(round(SECONDS * RATE))
        values = struct.unpack('<' + 'h' * (len(pcm) // 2), pcm)
        peak = max(abs(value) for value in values)
        rms = math.sqrt(sum(value * value for value in values) / len(values))
        # Peak-normalize the file to -4 dBFS; GameAudio applies the actual
        # background mix gain. No limiter pumping or clipped peaks.
        gain = 32767 * 10 ** (-4 / 20) / peak
        with wave.open(str(loop), 'wb') as output:
            output.setparams((2, 2, RATE, 0, 'NONE', 'not compressed'))
            output.writeframes(struct.pack('<' + 'h' * len(values), *(round(value * gain) for value in values)))
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(loop), '-c:a', 'libvorbis', '-q:a', '4',
                        '-metadata', 'title=Little Expeditions', '-metadata', 'comment=Original game score; FluidR3 GM instruments (MIT)', str(target)], check=True)
        print(f'{target.relative_to(ROOT)}: {SECONDS:.0f}s, {target.stat().st_size / 1024:.0f} KiB; '
              f'pre-encode peak -4 dBFS, RMS {20 * math.log10(rms * gain / 32768):.1f} dBFS')


if __name__ == '__main__':
    main()
