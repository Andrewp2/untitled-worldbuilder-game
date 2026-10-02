# Tinker Tide

Original 32-bar game groove in D Dorian, 108 BPM, approximately 71 seconds. Finger bass, muted-guitar offbeats, short marimba phrases, a vibraphone response, cross-stick and hand percussion replace the rejected square-wave-led theme. Small two-bar variations and an eight-bar break keep the arrangement from playing a continuous solo.

The editable score and render recipe are in `scripts/render-music.py`. It uses Python's standard library, FluidSynth and FFmpeg with FluidR3 GM. These are offline authoring tools, not browser or build dependencies. The soundfont is MIT-licensed; the distributed notice is `public/FLUIDR3-LICENSE.txt`. All notes and arrangements are newly authored. No recordings, melodies, source code or samples from LEGO World Builder are included in the game.

## Reference and limits

The player rejected both earlier music attempts and requested the original World Builder theme as a reference. The original movie served by [DirPlayer](https://dirplayer.com/?movie=worldbuilder) was inspected locally with ProjectorRays: its intro chooses between two short loops; gameplay chooses among four families of short loops with variation. The reference recordings and extracted files stay outside this repository.

Local [CLAP audio classification](https://huggingface.co/laion/clap-htsat-unfused) ranked funk, reggae/Latin jazz, plucked bass, hand percussion and mallets above a chiptune lead across relevant reference clips. Those are tentative style/instrument clues, not a human listening assessment or an exact transcription. This score uses that palette and short-phrase structure, with its own melody, harmony and rhythm. The 108 BPM tempo is an authored choice.

The renderer keeps the middle of three complete passes so earlier reverb and release tails wrap into the start. An 8ms blend aligns the loop tail with the retained pass’s lead-in to avoid a waveform jump at the wrap. The stereo Ogg Vorbis file is peak-normalized to -4 dBFS before encoding, then mixed more quietly by GameAudio. Vite gives it a versioned URL that works under the GitHub Pages base path. The game only fetches and decodes it after music is enabled, and reuses one buffer and source within the session. Both music and effects remain off on each fresh load.

Regenerate with `python3 scripts/render-music.py /path/to/FluidR3_GM.sf2`. Signal measurements verify encoding and level bounds; they do not establish musical quality. This remains a trial pending player listening feedback.
