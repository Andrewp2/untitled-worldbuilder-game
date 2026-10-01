# Charm pass evidence · September 30, 2026

User asked for World Builder’s playful motion: hopping/rustling machines, a rising goal star with sound, earned map machines, waving flags with bonus stars, and bobbing question marks with shadows. User chose handcrafted optional objectives for bonus stars. Preserve the previously approved original glossy toy art world, sparse UI, real-time movement/combat, and quiet music startup.

## Implemented behavior

- Actual step-progress-driven hops/rocking with grounded sorting origins and shadows; landed idle poses and attached cargo.
- Goal star rises for 1.25 seconds, synchronized to the existing signal/completion chime. Final reward freezes simulation; dialog follows. Click, Space, or Escape skips it. Completion saves immediately. Keep exploring resumes the current run and prior pause state.
- Planted goal masts with cropped texture-frame cloth that flutters; native completed map flags wave and carry stars only for earned bonuses. Available question markers bob above separate shadows, keeping names and hit areas fixed.
- Two earned map rovers and one freighter per completed mission; patrols use authored connected land routes, boats stay in water, replays do not duplicate residents. World clock stops hidden/asleep.
- Hollow Reach charged-battery delivery to the camp gold star; Bramble Crossing 3 alloy + 1 core delivery to the eastern gold star. Supplies remain physical/recoverable and bonuses persist with completion or when earned afterward in Keep exploring.
- Live reduced-motion preference removes decorative travel and retains a brief static goal reward. Native CSS also respects the preference. The in-app browser has no reduced-motion emulation capability, so that alternative was checked with focused pure-function tests and source inspection, not claimed as an emulated browser capture.

## Verification

Production build passed. 45 focused tests passed across bonus, motion, campaign, goals, orders-energy, facing, and grounding. All 29 shipping rasters carry prompt provenance. Static detector ran once on changed UI targets; full output is detector.json. Existing CSS palette/type advisories remain preserved; the warning about border-top:9px is the existing triangular mission-pin pointer, not a rounded card accent. New tiny shadow and hover/border tones are intentional extensions of the toy palette.

Real native browser actions (no hidden app-state manipulation):

1. At 127.0.0.1, Hauler drove to the spare 100-charge battery, collected it, and delivered it to the camp gold-star tile. The HUD recorded Camp power: bonus star earned. Scout reached Ridge then Shore. The real completion dialog displayed Bonus star earned; reload restored a starred Hollow Reach flag without changing existing completed missions.
2. At a separate localhost origin with initially empty progress, Scout reached both flags with no bonus. Captured the final star rising at two distinct heights, then the actual dialog after it settled. World map showed 1 / 2 complete, one earned crew/freighter, and a question mark for the unfinished mission.
3. Keep exploring accepted a new Scout movement order and spent one additional charge, without reopening the completion dialog. Pause screenshots remained pixel-identical (ImageMagick AE=0).
4. Music aria-pressed remained false at load. Hover-only loose-part counts and existing facing/grounding behavior remain intact.
5. Native world captures at 1280×720, 390×760, and 1234×901. Narrow mission capture at 390×760: canvas 390×386 matches the 390×386.3 host after rounding; no page overflow. Viewport override applies to the active browser tab; malformed early captures were replaced with verified-size captures before review.

## Required review images

All paths are under this directory. Each was actually opened and inspected; JPEG captures were losslessly packaged as PNG for review.

- desktop.png: 1280×720 world, both completions, one earned bonus, two crews/freighters.
- mobile.png: 390×760 world, both completions with the earned Hollow Reach bonus, matching desktop progress.
- user-1234.png: 1234×901 world, both completions with the earned Hollow Reach bonus, matching desktop progress.
- mission.png: desktop mission, planted goal flags and optional camp star.
- mobile-mission.png: mobile mission, sparse controls and camp delivery marker.
- original-map.png: live original World Builder map, reference evidence only, not shipping art or a composition contract.
- hop-03.png: closer Scout moving away from Shore, body hop over its grounded footprint/shadow.
- final-star-02.png and final-star-11.png: actual final arrival star at successive heights before the popup.
- completion.png: final built dialog after star animation, no bonus earned in this run.
- questions.png / one-complete.png: initial and partially populated worlds.
- paused.png: mission presentation frozen; paired paused-again.jpg yielded AE=0.

The approved toy-world study remains the material/silhouette reference, not a pixel screen contract. This pass extends the existing visual world; it does not replace it or reproduce LEGO artwork. Handcrafted bonus rules are our own design. Bramble’s bonus has focused simulation tests but was not replayed through combat for this motion-focused browser check. Audio cues are wired to actual goal events and retain existing effects/music toggles; no claim of listening to captured audio is made.

Capture correction: the first review returned recapture because the saved mobile.png was 390×285 even though a subsequent preview showed the correct viewport. Replaced it with the exact screenshot buffer that was viewed; identify now confirms 390×760. The fresh full review uses that corrected file. Temporary testing tabs were closed and the viewport override reset; the user’s game and original World Builder tabs remain.

## Review correction batch

The initial full review returned fix for two event-boundary defects. GameScene now emits state in the same frame as a drained goal/bonus event, bypassing the ordinary HUD interval. Completion shortcuts now exclude HTML buttons from Space-to-skip. No geometry, CSS, or assets changed.

Two new reward-handoff tests use the real simulation with rendering stubbed: flag completion and a travelling delivery bonus both publish to the bridge during a 1ms frame, well before the 100ms HUD interval. Both pass. The earlier 45 focused tests passed separately, giving 47 focused passing tests; final production build and TypeScript check passed.

Actual native keyboard checks on the initially partial localhost origin: Scout reached Bramble Crossing’s final flag. While the star beat was active, press Space on the focused World map button returned to the map with 2 / 2 completed; reward-to-map.png captures the saved result. On replay, Space on the canvas skipped that reward and immediately opened the completion dialog; canvas-skip.png captures it. Keep exploring then accepted a return to the map. Music remained off.

Recaptured the same canonical desktop, mobile, user-1234, mission, and mobile-mission files after the event fixes, saving the exact buffers that were visually opened. These now use the 127.0.0.1 origin with two completed missions and the earned Hollow Reach bonus; earlier question/partial-progress captures remain valid references because their rendering was unchanged. No second detector ran.

Focused regression checking also replayed Bramble Crossing through actual movement, pursuit and incoming damage: Scout reached East at 78 charge. This does not verify Bramble’s delivery bonus or combat balance. Temporary regression tab was closed and the viewport override reset.

## Final scoped outcome

The [final verdict](finish-verdict.md) returns **ship**. Both event-boundary fixes are resolved, with no visible regression in the five canonical recaptures and two regression captures. This disposition covers the two scored fixes; the [initial full review](finish-review.md) remains preserved and the verdict does not claim whole-surface approval.
