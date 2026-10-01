# Campaign redesign evidence — October 1, 2026

Scope: all 36 canonical missions, creature-based bonuses, ground blueprint discovery, loaded-arrival convoy mains, cargo depth, clay soil and Warden power balance. Ordered mission IDs and saved awards remain unchanged.

The first seven use new boards and objective pairs. The later maps retain selected useful engineering/combat ideas but have revised shorelines, deeper inlets, route pockets, reefs or passing constraints. Every bonus requires a mobile model on its star; none accepts a loose block shipment. Five main convoy goals additionally require cargo aboard. [Campaign notes](../../../docs/CAMPAIGN.md) describe every pair.

## Behavior verification

- Final `npm test`: 261 tests passed in 26 files.
- Final `npm run build -- --base=/untitled-worldbuilder-game/`: type checking and production build passed. Vite retains its existing large-bundle advisory; no performance benchmark is claimed.
- Canonical public-command solutions cover all 36 mains and all 36 bonuses: seven opening, four later Meadow additions, Bramble, two roster missions, ten Sunstone additions and twelve Sea missions.
- Solutions use movement, work orders, construction, dismantling, battery swaps and elapsed simulation time. They do not alter terrain, health, charge, supplies, blueprint stock or completion state directly.
- New failure contracts verify delayed ground plans, one-use collection, no dismantling refund, fresh replay isolation, wrong species, original identity, charge/tree requirements and cargo aboard rather than on the ground.
- The enclosed Tidepool star rejects an existing patrol route. Citadel’s bonus grove rejects Arborbot before its tree gate is removed. The narrow convoy routes require parking workers outside passing places.
- The last sea solve can rebuild an east berth destroyed during the first shore fight, using the authored spare kit and one finite Marina plan. Merged naval salvage remains usable.

## Visual evidence and limits

[Cargo models](cargo-models.png) render meshes exported directly from `toy-models.ts`, with the same orthographic camera and actual attached cargo geometry. They show two headings each of Hauler, Scoop with soil, Bulk hauler and Freighter. Blender lighting differs from the browser’s atlas lighting. These are model renders, not native game screenshots. Inspection confirms cargo inside the Hauler bed, clipped by its rim, and soil in Scoop’s bucket; model projection tests cover loaded atlas bounds in four headings.

[Board overview](campaign-layouts.png) is a source-derived top-down diagram of all 36 final authored grids, main/bonus locations, ground plans and starting units. It does not represent native game appearance. Reviewing the earlier overview exposed remaining broad banks; the final source adds deeper inlets and pockets, with solutions rechecked afterward.

Native browser inspection was unavailable. The owned preview on isolated origin 5195 loaded, but navigation, snapshots and focus commands timed out. `open_in_codex` reported a queued tab; a request to bring the preview into view remained unanswered during this session. The original-game tab and the user’s live Pages game/save were not changed. The isolated preview injects synthetic completion awards from an ephemeral script outside the repository so all levels are accessible; that fixture is absent from the production bundle.

The one detector pass returned thirteen advisory palette, radius and typography documentation mismatches. It did not return a clean-zero result. The design sidecar remains stale and has not been repaired as a side effect.

This checkpoint establishes deterministic solvability and model geometry, not human-calibrated difficulty, enjoyment, native clicks/pacing, audio quality or measured frame performance. Those need playtesting of the redesigned campaign.
