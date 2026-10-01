# Released roster expansion — September 30, 2026

The active goal is **“Add every creature, bot, and vehicle from the original lego worldbuilder.”** This implements the released first game's 20 buildable roles (including four support/defense buildings) and six hostile families. The established extra Hauler, Bristleback and Signal relay remain. Cut Bluebird/Cargo Copter and sequel-only units are excluded. Original names identify research references; this game uses original models, maps, recipes and balance. No original game art or code was copied.

The latest steering request is sound effects off by default. `GameAudio.state` now starts both channels off. Old saved enabled preferences cannot override a fresh load; each tab can enable either channel. Twelve focused audio checks passed, including the old-preference regression. Native menu inspection found `aria-pressed=false`, “Enable music” and “Enable sound effects.” Audible playback was not assessed in this roster review.

## Requirement audit

| Original role | Counterpart | Playable encounter / behavior |
| --- | --- | --- |
| Buggy | Scout | Original introductory missions; land cargo (2 in our balance) |
| Dirtbuggy | Trailbuggy | Rough Ridge / Ancient Valley; rough-ground cargo |
| Snail | Snail | Rough Ridge; slow land creature and typed arrival flag |
| Steamshovel | Scoop | Siltwater Reach; distant Dig / Fill, one dirt |
| Bulldozer | Dozer | Woodland Workshop; distant rock / entire pile pushes |
| Forklift | Forklift | Woodland Workshop; 10-item cargo |
| Treebot | Arborbot | Woodland Workshop; uproot / replant one tree, slower when loaded |
| Defender | Warden | Bramble Crossing / Ancient Valley; automatic adjacent combat |
| Dumptruck | Bulk hauler | Woodland Workshop; 25-item cargo |
| Gas Station | Charging station | Woodland / Rough Ridge; adjacent vehicle recharge |
| Robot Lab | Bot workshop | Ancient Valley; adjacent bot recharge |
| Guard Tower | Sentry tower | Rough Ridge / Ancient Valley; battery-powered stationary combat |
| Repairbot | Mender | Ancient Valley; adjacent bot repair using own charge, rough access |
| Frog | Frog | Tidepool Trail; land / shallow water, typed arrival flag |
| Duck | Duck | Tidepool Trail; land / shallow water, typed arrival flag |
| Fish | Fish | Tidepool Trail; shallow / deep water, typed arrival flag |
| Tugboat | Tugboat | Harbor Run; 5-item cargo, shore transfers |
| Freighter | Freighter | Harbor Run; 25-item cargo, shore transfers |
| Speedboat | Patrol boat | Harbor Run; fast water unit, automatic adjacent combat |
| Marina | Marina | Harbor Run; stationary shallow-water boat charger |
| Crab | Crab | Rough Ridge; land wander / chase / contact attacks |
| Water Crab | Reef crab | Harbor Run; water wander / chase / contact attacks |
| Scorpion | Scorpion | Ancient Valley; land / rough ground hostile |
| Alligator | Gator | Harbor Run; land and shallow / deep water hostile, excludes rough ground |
| Tyrannosaurus Rex | Rex | Ancient Valley; heavy land / rough ground hostile |
| Shark | Shark | Harbor Run; fast shallow / deep water hostile |

Catalog references use the released roster recorded at [Brickipedia](https://brickipedia.fandom.com/wiki/World_Builder), with supporting [sprite archive](https://www.spriters-resource.com/browser_games/legoworldbuilder/page-1/) and [cut/sequel unit distinction](https://bricks.stackexchange.com/questions/15211/world-builder-game-units). This is role coverage, not an exact rules/balance reconstruction. Scout's small cargo, Warden's retained one-item cargo, recipes, speeds, attack strengths, support rates and new mission conditions are authored adaptations. Reference accounts disagree about Gator deep-water access; allowing it here is provisional. No claim of inspecting original game source is made.

## Current implementation

`src/core/catalog.ts` owns kind, recipe, capability, family, mobility and enemy loot definitions. `grid.ts` applies each mobility profile to whole paths. `simulation.ts` owns construction, queues, distant work/shore transfers, obstacle conservation, support pulses, battery health and salvage. New actions reject unsupported units atomically. Static buildings cannot move or satisfy arrival flags; battery-free buildings take structural damage. All battery-powered mobile units retain dead-battery construction and friendly wreck recovery.

`src/view/toy-models.ts` authors every unit/enemy with the established 30-degree orthographic camera, common support plane and four headings. Hulls are one tile. Three.js renders reusable canvases; this scope creates no shipped raster assets. Existing cutouts and their provenance remain untouched. `surfacePoint` in `projection.ts` places water actors 10px below land and interpolates shoreline steps; picking uses the same rendered anchor.

Five new handcrafted missions join the original three. All eight are immediately available. Each new main objective and optional delivery is exercised through public simulation commands with authored enemy behavior active. Harbor completion earns water residents; no boats appear on the map before a maritime completion. Original completion/reward flow remains.

## Verification

- The full suite passed **18 files / 194 tests** before the final small fixes (Gator profile naming / rough exclusion, depleted Sentry status, explicit Scoop model branch, roster selection visibility).
- After those fixes, the focused run passed **107 tests in 6 files**: audio, roster, roster missions, model projection, motion and water surface. All current source passed `npm run build` (TypeScript and Vite). Vite reports the existing large Phaser/Three bundle warning; no performance benchmark is claimed.
- Roster tests cover all 20 references / six foes, every construction/dismantling recipe, terrain restrictions and real arrival, unsupported actions, cargo capacities and shore commands, Dozer working sides and revalidation, Arborbot tree/ground conservation and wreck recovery, depleted/family-specific support, structure damage, enemy charged loot and stationary Sentry recovery.
- Model tests inspect actual vertex footprints and support-plane contact for all unit/enemy kinds at four headings; boat hulls fit a tile. Pure tests verify continuous shoreline height and rendered-anchor picking.
- Native in-app browser interaction covered all five new missions, Arborbot distant Uproot and Plant, Freighter's distant 12-part shore pickup and Marina recharge, legal controls on Marina and Sentry, and Sentry construction from the 3×3 kit. Native gameplay did not complete every new mission; deterministic mission tests completed all main objectives and optional deliveries, including Mender-assisted Ancient Valley encounters and salvage.

## Native captures

Required desktop sizes are **1280×720** and **899×900**. Mobile is outside the user's requested scope. All listed captures were loaded and visually inspected. They show rendered game states, not mockups. Final narrower captures also verify the five-unit roster and compact carried-tree HUD. Camera movement and UI paint settled between interactions and captures; world-user-899-final replaces an initial resize-transition capture under the same name.

| File | Visible state |
| --- | --- |
| `world-first.jpg` | 1280×720 world map, eight pins and existing two earned flags, no premature boats |
| `ridge-first.jpg` | Trailbuggy / Snail / Crab and rough crossing |
| `woodland-first.jpg` | Arborbot / Dozer / Forklift / Bulk hauler / Charging station |
| `harbor-first.jpg` | Tugboat / Freighter / Patrol boat / Marina; Reef crab / Gator / Shark |
| `freighter-cargo-first.jpg` | Native 12-part shore pickup, compact colored cargo totals |
| `tidepool-first.jpg` | Frog / Duck / Fish, no unsupported cargo controls |
| `ancient-first.jpg` | Warden / Mender / Workshop / Trailbuggy and Scorpion / Rex |
| `sentry-first.jpg` | Native-built stationary Sentry, battery and legal controls |
| `world-user-899-final.jpg` | Final eight-pin map at 899×900 |
| `woodland-user-899-final.jpg` | All five roster choices and legal specialist actions at 899×900 |
| `tree-carried-user-899-final.jpg` | Native distant Uproot result, tree attached in world and small tree HUD, Plant enabled |
| `audio-user-899-final.jpg` | Menu showing both audio channels off at 899×900 |

`tree-carried-first.jpg` is historical defect evidence: an oversized incorrect Arborbot picture escaped its HUD bounds. `treeCargoIcon()` replaces it with the contained tree model; **tree-carried-user-899-final.jpg is authoritative for that state**. The roster's width and visible themed scrollbar were also corrected in the batched fix. No additional defect hunt follows the final capture round.

## Detector and review boundaries

The hookless web detector ran once on main, CSS, HUD art, GameScene, toy models and WorldMapScene. It returned exit 2 with DESIGN.md palette/type/radius advisory findings. Tool output was truncated, so no exact clean-count or full retained JSON claim is made. The documented historical system predates the desktop correction; known literals are in the incumbent surface. The finish reviewer should judge actual scope against the pinned toy style rather than replace existing tokens to silence stale guidance. No second detector ran.

Quiet terrain remains a reversible trial, not newly approved visual direction. This is a roster-extension review, not approval of whole-game balance, original fidelity, mobile behavior, accessibility of the entire canvas, audible audio, performance, or every earned-resident animation. Source and native captures support the claims above.

## Finish-review correction

The independent full review returned **fix** for one help-text contradiction, while finding the roster's desktop visual craft at its required ceiling. Build help still restricted all blueprints to grass/sand. The single correction now directs players to a clear tile the model can use and explicitly states water for boats/Fish and shallow water for Marina, retaining the 3×3 loose-supply rule. No unrelated code or visual change followed the review.

The current build passes after this text correction. No additional behavior tests were added for static help copy. The reviewer's required verdict matrix is `help-1280-fix.jpg` (1280×720) and `help-899-fix.jpg` (899×900). Both native captures were loaded and inspected with the complete Build row readable; they show a normally scrolled help panel. Temporary viewport override was reset. Existing gameplay captures remain unchanged evidence, as the reviewer specified. No second detector ran.

The [finish verdict](finish-verdict.md) returned **ship**, scoring the sole Build-help correction resolved with no visible regression. This verdict covers that fix; the [full review](finish-review.md) supplies the unchanged roster's desktop assessment and its stated limits. The documenter follows this closed correction.
