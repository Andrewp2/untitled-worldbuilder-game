# Bonus ending · September 30, 2026

Contract: ../../bonus-complete-brief.md. This extends the existing star reward and completion dialog; the toy island, sparse toolbox, finite plans and audio defaults remain unchanged.

Earning the bonus now moves the current run into bonus-complete, saving a new star immediately and accepting an already-starred replay once per visit. It freezes simulation movement/combat for the star beat, then opens Bonus complete with a starred flag, Bonus star earned and one World map action. Escape returns to the map. Main completion still offers World map/Try bonus. The normal resume path cannot resume a bonus-complete run.

39 focused tests passed across campaign, reward-handoff, bonus and motion. New tests cover first awards and already-starred replays, one ending per visit, refusal to resume the final run, early HUD publication before reward-event processing, a separate bonus celebration after the main, and movement/charge staying frozen through both normal and reduced-motion reward durations. The production TypeScript/build passed with the existing chunk warning. No broad simulation rerun was needed.

Native in-app play used isolated origin5189, leaving the user's5173 save untouched. An already-starred Hollow replay picked up the charged battery, reached Shore, used Try bonus, delivered at Ridge, opened the final one-button Bonus complete dialog with the mission paused, and returned to a still-starred world map with Bramble unlocked. This specifically verifies the stored-star replay case. Fresh first-star persistence, reduced-motion timing and other mission bonuses have focused test/source evidence, not additional native completions.

Required final captures at1280×720: main.png (unchanged main popup and Try bonus), bonus.png (new final starred popup/paused mission), map.png (successful return and retained award). The main/bonus pixels were loaded and inspected; map capture is inspected before handoff. Native captures do not establish audible audio, preference-emulated motion, the star's intermediate heights, Escape/native Space activation, performance, mobile or other desktop widths.

One bounded visual inspection round found no correction. The detector ran once on changed UI/scene sources; detector.json has1 advisory finding and0 non-advisory. No raster/provenance changed and no detector rerun is owed. Historical HUD/campaign captures retain their prior scope.
