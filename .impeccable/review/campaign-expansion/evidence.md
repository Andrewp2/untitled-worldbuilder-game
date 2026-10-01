# Campaign expansion verification

Verification date: September 30, 2026. Documentation verdict recorded October 1, 2026: the scored correction is resolved and ready to ship.

## Requirement evidence

- Exactly 36 ordered missions in `src/levels/missions.ts`, divided into three worlds of twelve; no placeholder missions.
- Thirty additional/upgraded canonical main-and-bonus solutions: `tests/meadow-campaign.test.ts` (8), `tests/sunstone-campaign.test.ts` (10), `tests/open-sea-campaign.test.ts` (12).
- Six retained canonical main-and-bonus solutions: Hollow and Bramble in `tests/campaign-content.test.ts`, Siltwater in `tests/terrain-work.test.ts`, Rough Ridge, Woodland Workshop and Ancient Valley in `tests/roster-missions.test.ts`.
- All solutions use public movement, cargo/work, construction, dismantling, replacement and simulation time. No direct solution-state mutation grants health, power, stock, terrain or awards.
- `campaign-content` verifies 36 distinct grids and challenge concepts, exact world/map order, prerequisites including both world boundaries, all 36 saved main/bonus awards, whole-campaign reset and preserved known old awards without skipped prerequisites.
- Map and motion tests verify twelve connected pin locations per authored map and earned-scenery patrols on matching terrain. Boat scenery belongs to completed boat-bearing missions in Open Sea.
- Delivery-goal regressions: actual colors and charged batteries required; original-unit identities cannot be replaced; predeposited main shipments wait for all enemies to be defeated.
- Full test checkpoint: **259 tests in 24 files passed**. Production build passed (existing large Phaser/Three bundle warning remains).

## Native inspection

The preview briefly became available. Valid captures were opened and inspected at the actual **885×901 desktop viewport**: the three populated maps, Parts and Paths, its main and bonus dialogs, Sunstone Citadel, and Three Tides' initial view and whole-island view. All maps show twelve pins and appropriate earned residents; world navigation, finite pictured plans, shipment requirements and reward controls remain visible. Mobile reflow is outside the user's requested scope.

Native Parts and Paths play used the actual pictured controls: Hauler collected and remotely dropped the Scout kit, one Scout was built (plan stock became zero), Scout reached the Garden flag, and Try bonus resumed the visit. Scout delivered two blue pieces while Hauler delivered the remaining blue piece. The bonus then opened its final popup. Earlier campaign awards in this fixture are seeded, not native-earned.

Inspection found the largest board starting cropped at this desktop width because the narrow-screen zoom fallback also applied to large desktop boards. `GameScene.initialView` now limits that fallback to widths below 700px. The Pages-base production build passed after this correction. A fresh native visit without Overview confirmed both shores, the destination, full channel, requirements and tray; `three-tides-initial-user.png` now records that corrected view. The independent reviewer reopened it and closed the camera finding. This was one confirmation round after the initial batched inspection.

The ordinary 5189 origin also confirms visible progression: `meadow-locked-user.png` shows its pre-existing Hollow main/star award, Parts and Paths available, and ten later missions locked. Browsing forward produces `sunstone-locked-user.png`, with all twelve Sunstone mission buttons disabled and no earned residents. Native DOM agrees with those states. This is an existing one-award save, not a fresh-save or native reset claim. Intermittent preview timeouts were resolved by using the app-created native tab and checking the state after navigation settled; no server restart was needed.

- `http://127.0.0.1:5189/`: ordinary app, independent test origin with an existing Hollow main/bonus award from previous verification; never represents a fresh save without a real UI reset.
- `http://127.0.0.1:5190/`: isolated, ephemeral visual fixture. Its startup HTML seeds 36 completed IDs and four stars for checking populated maps/replays. This is not native-earned progress and is never included in production. Fixture source: `/tmp/worldbuilder-campaign-preview.mjs`.
- User-facing origin `5173` is untouched by fixture data.

The single detector pass is saved in `detector.json`. It reports only advisory palette, radius and type-ramp documentation mismatches against the older design sidecar; no mechanical UI edit is warranted from those findings. The independent five-section `finish-review.md` returns **fix** solely for stale current-scope documentation and the required final recording pass. No extension-specific UI repair remains in that review. The required documentation recording is complete. The independent [scoped verdict](finish-verdict.md) marks that correction resolved with a ship disposition limited to the scored fix. GitHub Pages deploys `main`; exact release status is available in [Actions](https://github.com/Andrewp2/untitled-worldbuilder-game/actions/workflows/deploy-pages.yml). No 1280×720 capture, native completion of every mission, listening, performance benchmark, exact-original-stat proof, or player-calibrated difficulty claim is made.
