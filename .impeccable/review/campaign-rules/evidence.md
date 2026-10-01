# Campaign rules · September 30, 2026

Contract: ../../campaign-rules-brief.md. This refines the established toy identity, desktop map, mission controls and shared models in response to play feedback.

## Verification

The final `npm test` run passed 219 tests in 19 files; `npm run build` passed with the existing bundled-chunk warning. The broader suite is justified by the changed shared construction, goal, bonus and saved-campaign contracts, used by every mission and cargo/work/combat sequence. Focused failures were stale assumptions about unlimited rebuilds, two Hollow flags and pre-main bonuses; fixtures now explicitly fund charge-conservation rebuild tests, while new tests verify exhausted blueprints and sequential phases.

Public simulation commands solve both stages of Rough Ridge (including three fills and live Crab combat), Woodland's two tree relocations and boxed-in supply retrieval, Frog/Duck stages, live-hazard Freighter escort/delivery and Ancient combat/support/salvage. Existing Siltwater tests solve terrain work, the flag and a post-main delivery. Tests cover sequential unlock/replay/reload/reset, noncontiguous saved awards, stale tabs, post-main bonuses, original-unit rescue, failed build atomicity, nonrefundable blueprint stock after dismantling and death, empty batteries, and fresh authored stock. Four-heading projection tests keep the complete roster planted and inside its atlas.

Native in-app browser play used a separate test origin, 5189, without clearing or completing the user's actual 5173 save. From a fresh map, only Hollow Reach was available. Actual Hauler arrival at Shore opened the completion popup and revealed the bonus; Try bonus resumed the run. A charged battery was picked up across the map and dropped on Ridge, awarding the star. One relay was built and dismantled: its stock stayed zero and its disabled blueprint remained visible. Construction smoke was captured. Returning to the map showed a starred first flag, residents, available Bramble and six locked later missions. No mission information panel or premature bonus was present.

## Captures

All valid captures were loaded and inspected at the native 1280×720 desktop viewport. Required final evidence:

- `hollow-main.png`: one main flag, sparse objective, no bonus or mission info box.
- `hollow-complete.png`: completion popup and Try bonus; bonus now visible.
- `relay-puff.png`: native construction smoke and exhausted blueprint.
- `hollow-bonus-done.png`: actual bonus award and zero relay stock after salvage.
- `world-next.png`: corrected number placement, readable dark locks, starred first mission and next unlocked mission.
- `bot-study.png`: actual Warden/Arborbot/Mender geometry under the game camera and lighting in four headings. `bot-study.html` is the local review fixture; this is model evidence, not gameplay in the three specialist missions.

`world-locked.png` is a preliminary capture, before the one batched correction to number placement and lock contrast; it is not final visual authority. There was one inspection round and one correction/confirmation batch. No mobile layout was requested or tested. No second desktop width is claimed.

The detector ran once on changed UI/model/view targets; `detector.json` contains 40 advisory findings and zero non-advisory findings. The subsequent small correction used the existing navy/yellow palette and was not followed by a second detector run.

Native play did not complete all eight missions, capture a combat destruction puff, or establish balance. Shared smoke wiring has source evidence and native construction-puff pixels; combat/drop/empty-battery outcomes have focused simulation evidence. Reduced-motion smoke and paused puff behavior are source-verified, not native preference-emulated. No audio listening or startup/performance benchmark is claimed. No generated raster/provenance asset changed.
