# Mission toolbox · September 30, 2026

The explicit screenshot/request supersedes the previous dock's unit roster, closed build drawer and repeated installed-charge picture/number. See ../../hud-distill-brief.md. The same toy world remains the visual authority; this is a narrow desktop refinement with no new comp, seed or raster.

The default dock now contains pictured finite blueprints, selected-unit context and legal actions. Build choices stay visible during selection, build mode and after successful construction. Roster DOM/wiring/styles and the build toggle were removed. Map clicks and 1–9 selection remain. Installed charge is one green native progress bar; its exact value is available on hover and as accessible progress text. The conditional battery-swap action remains. Invalid actions use the existing error sound cue and hide any earlier transient message; audio mute/defaults are preserved. Success/reward messages and contextual hover/build previews remain.

Verification: 14 focused tests passed in audio.test.ts and reward-handoff.test.ts; the production TypeScript/build passed with the existing chunk-size warning. These checks cover the unchanged audio mute/play lifecycle and reward handoff; the revised DOM was checked natively. No broad simulation rerun or new tests were needed for this reversible HUD change.

Native in-app play on isolated origin5189 preserved the user's5173 progress. At1280×720, Hollow's default build choices were visible without a toggle; clicking Scout selected it on the board. Relay construction succeeded from the dock and changed stock1→0 with an exhausted disabled choice. Selecting the relay hid mobile actions/installed charge, retaining salvage and build choices. Switching through World map to Bramble replaced the mission's plans, including Warden stock2. An invalid water movement showed no status popup; a rejected Warden build also showed no status popup and kept stock2. Contextual hover/build previews were retained deliberately.

Required final captures, all loaded as pixels at1280×720:

- default.png: Hollow default dock, one charge bar, no roster/toggle.
- invalid-water.png: invalid movement target with no transient status popup.
- build-ready.png: Scout selection and pressed Relay plan, pictured recipe on demand.
- structure.png: relay selected, exhausted stock, stationary-object controls.
- bramble.png: mission switching and four pictured choices, Warden stock2.

One bounded inspection round found no layout correction. Build-ready.png was captured again after the native frame caught up; the earlier stale capture was overwritten and is not authority. The detector ran once on the changed HUD source/CSS:32 advisory findings,0 non-advisory. The subsequent one-line change classifies a no-selected-rover click as an error, so it shares sound-only feedback; no second detector is owed.

No audible listening, empty-charge/available-swap native state, reduced-motion emulation, all-mission gameplay, mobile or another desktop width is claimed. The longest later-mission blueprint row was not unlocked in native play; its wrap behavior has source evidence. Simulation/campaign rules and audio defaults were untouched.
