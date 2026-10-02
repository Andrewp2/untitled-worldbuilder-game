# Little Expeditions

Original 32-bar game theme in D major, 120 BPM, 64 seconds. The requested direction is bouncy retro game music: a short square-wave lead, octave-skipping synth bass, electric-piano offbeats, a marimba response and light drums. The final eight bars thin out before returning to the main theme.

The editable score and render recipe are in `scripts/render-music.py`. It uses Python's standard library, FluidSynth and FFmpeg with FluidR3 GM. These are offline authoring tools, not browser or build dependencies. The soundfont is MIT-licensed; the distributed notice is `public/FLUIDR3-LICENSE.txt`. No music or samples from LEGO World Builder are used.

The renderer keeps the middle of three complete passes so earlier reverb and release tails wrap into the start. The stereo Ogg Vorbis file is peak-normalized to -4 dBFS before encoding, then mixed more quietly by GameAudio. Vite gives it a versioned URL that works under the GitHub Pages base path. The game only fetches and decodes it after music is enabled, and reuses one buffer and source within the session.

Regenerate with `python3 scripts/render-music.py /path/to/FluidR3_GM.sf2`. Run `npm test -- tests/audio.test.ts` after changing playback behavior. Signal measurements verify encoding and level bounds; they do not establish musical quality. Player listening feedback remains the authority for that.
