# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

TypeScript and Phaser, accepted by the user with the first playable milestone. Vite serves and builds the app. The simulation is independent of Phaser. Three.js renders authored models once into sprites whose projection matches the grid.

## Users

Initially the project owner, playing and refining a game inspired by the old World Builder. The broader audience is undecided.

## Product Purpose

An original game of specialist units, spatial construction, and real-time hazards across handcrafted levels. Small construction puzzles should eventually grow into larger tactical encounters.

## Capabilities and Constraints

The prototype has eight handcrafted missions selected from a separate world map: Hollow Reach, Bramble Crossing, Siltwater Reach, Rough Ridge, Woodland Workshop, Tidepool Trail, Harbor Run, and Ancient Valley. The released World Builder 1 roster has 20 original buildable counterparts and six hostile counterparts, alongside Hauler, Bristleback, and Signal relay. [The roster guide](docs/ROSTER.md) records their roles and adaptations; cut and sequel units are excluded.

Play includes angled terrain, camera controls, independent orders, four distinct part colors, distant cargo and work orders, physical batteries, compatible-terrain 3×3 construction, finite per-model blueprints, and dismantling. Successful builds spend one blueprint; failed builds spend none, and dismantling or death never refunds stock. Immediate construction, dismantling and destruction have a visual smoke puff. Scoop digs/fills one dirt load and rejects cargo transfers; Dozer pushes rocks or entire piles; Arborbot moves conserved trees. Terrain profiles distinguish land, rough ground, swamp, shallow water, and deep water across complete routes. Boats transfer shore cargo; Charging station, Bot workshop, Marina, and Mender automatically restore matching families. Kind-specific arrival flags, automatic adjacent combat, enemy pursuit, and recoverable wrecks/salvage are playable. Mobile units and Sentry use battery charge as power and health; battery-free support structures take integrity damage.

Only Hollow Reach starts unlocked. The missions follow the listed order, with every preceding main completion required for access; a bonus never gates the next mission. Each visit has one main objective followed by one hidden bonus, including replays with prior saved awards. Main completion opens **World map** or **Try bonus**. Completed locations and earned bonus stars are remembered in this browser when storage is available; every visit restores terrain, units, supplies and authored blueprint stock. Existing known awards remain, but noncontiguous awards do not bypass an earlier missing main. Harbor completion earns boat residents; Ancient Valley earns one Mender resident. The approved toy identity guides the original models and retained cutouts. Balance remains provisional, including recipes, statistics, energy and support.

Normal play shows one short objective and always-visible pictured blueprints with finite stock and costs on hover/focus/selection. Units are selected on the board or with 1–9; selected context, legal actions, cargo, unit information and How to play remain available. Installed charge uses one green bar with exact charge on hover and for assistive technology; battery replacement appears when available. Invalid actions clear transient status and use the existing error cue, honoring effects mute; success and reward messages expire after 3.5 seconds. Warden, Arborbot and Mender use four jointed walking legs; vehicles retain their wheels. Rough Ridge combines typed rough-ground travel with a three-cell Scoop crossing and original-Snail rescue; Woodland combines two tree relocations with Dozer-opened cargo retrieval. Tidepool separates Frog arrival from original-Duck return, Harbor separates Freighter arrival from shore delivery, and Bramble/Ancient require their hostiles cleared for the main goal.

Game menu's Reset progress control requires a continuous three-second hold to clear all completed missions, bonus stars, and earned residents across the whole world map and return there, preserving the chosen audio settings. Restart starts a fresh current mission while keeping saved awards.

Music and sound effects both start off on every load, including when old saved preferences say enabled. Each channel can be enabled separately for the current tab's session; audio preferences are not persisted. Activating Web Audio alone keeps both channels muted.

## Brand Commitments

Original identity, art, units, and levels. World Builder supplies specialist-role and mechanical references; recipes, statistics, maps, and rules are authored adaptations. The final name and setting remain open; `Untitled` is an honest working title, and the eight named missions are current locations.

The approved visual world uses distinct lime Scout, orange Hauler, cobalt Warden, yellow Scoop with turquoise arms and hubs, and red Bristleback silhouettes, fitted glossy toy materials, rounded trees, bright cyan water, raised grassy coasts, and deep blue controls. Shared pictures connect the board, blueprints, resources, and cargo. The [approved study and scope](.impeccable/mocks/toy-world-study.json) establish art direction; real mission geometry and native controls determine the screen layout.

## Evidence on Hand

DESIGN.md records the game design discussion; docs/references contains attributed reference material and firsthand play notes. The user's approved build plan and later feature requests supply the current implementation scope.

The earlier world-map checkpoint is preserved in [its review evidence](.impeccable/review/world-map/evidence.md). At that checkpoint, browser checks passed for rover goals, completion actions, mission switching, fresh replay, and saved completion after reload. Desktop, mobile, and 1082×901 map captures and desktop/mobile completion dialogs were inspected, and the reviewer returned **ship** for that earlier scope.

Historical toy-world [implementation evidence](.impeccable/review/toy-world/evidence.md) records a passing production build and 28 focused picking, orders-energy, and campaign tests. Browser checks observed an independently moving Scout reach a flag while Hauler stayed selected, a three-alloy pickup at 98 charge, Warden construction at 100 charge, both mission visits, and return to the map. Mission and map captures at 1280×720, 390×760, and 748×901 showed matching canvas/host dimensions and no page overflow; the final warning/error log was empty. The finish review found the implementation faithful. The [final verdict](.impeccable/review/toy-world/finish-verdict.md) returned **ship** after the sole Persistence/FINISH documentation correction was resolved, with no regression. Ship covers that scored fix, not whole-surface approval. This is focused redesign evidence, not broad validation of game balance or every mechanic.

The historical [terrain-work evidence](.impeccable/review/terrain-work/evidence.md) records 82 unique focused tests and a passing production build. Native browser play verified a distant dig, two-cell fill, Scout crossing, and pristine restart; desktop, mobile, and 781×901 mission/map captures were inspected. The [finish review](.impeccable/review/terrain-work/finish-review.md) returned **ship** for Scoop / Siltwater Reach with no material defect owed. Full native completion and the newly earned residents were not replayed in this run; shared simulation/campaign checks cover them. Reduced motion has source and focused test evidence without browser emulation, and no audio listening claim is made. The [manifest](public/art/toy-world/manifest.json) records 34 retained PNGs, all with embedded generation provenance.

Historical desktop corrections established the full board and compact bottom toolbox, contextual build costs/menu, hover-only map names and pile counts, shared rover/rock projection, four distinct resource colors, terrain-only Scoop, and removal of premature freighters. The [eight-fix verdict](.impeccable/review/user-feedback/finish-verdict.md) returned **ship**, with [106 passing tests, build and desktop evidence](.impeccable/review/user-feedback/evidence.md). Subsequent shore corrections use a 10px land-to-water drop and 4px bridge decks with posts over water, replacing that checkpoint's 22px geometry. Harbor Run now provides playable one-tile boats, with map boats gated on completion. Quiet broad terrain remains a reversible trial; mobile reflow is outside the current requested scope. The historical verdict does not certify the whole game, performance, sound, or balance.

The historical [roster evidence](.impeccable/review/roster/evidence.md) records 194 passing tests before final small fixes, then 107 focused tests and a passing build after them, followed by another passing build for the help-copy correction. Native 1280×720 and 899×900 captures were inspected and independently reviewed; tree work, shore cargo, Marina recharge, and Sentry construction were observed. Public simulation commands completed all five new missions' main goals and bonuses, including Ancient Valley combat/support/salvage. Native play did not complete every mission. The [full finish review](.impeccable/review/roster/finish-review.md) requested one Build-help correction, resolved by the [ship verdict](.impeccable/review/roster/finish-verdict.md); approval stays scoped to this extension and that fix. No audio listening, performance benchmark, exact-original-stat proof, or clean detector count is claimed. No new raster assets were shipped; the retained provenance manifest is unchanged.

The [campaign-rules finish review](.impeccable/review/campaign-rules/finish-review.md) returned **ship** with no material fixes. [Evidence](.impeccable/review/campaign-rules/evidence.md) records 219 passing tests in 19 files, a passing production build, isolated native 1280×720 Hollow main/bonus progression, finite relay stock after dismantling, construction smoke, and the next unlocked map state. Later combined mission solves use public simulation commands. Native specialist completion, combat smoke captures, reduced-motion preference emulation, balance, performance and audible audio are outside that evidence. The user disliked and turned off the existing music; this refinement leaves both channels default off without recomposing music. The picking complaint was retracted.

## Product Principles

The follow-up [grounding and audio correction](.impeccable/review/grounding/evidence.md) has a passing build and 18 focused audio, picking and grounding checks. Desktop, close, intermediate and mobile views confirm ground contact and joint body/cargo occlusion. The [scoped verdict](.impeccable/review/grounding/finish-verdict.md) returned **ship** for all four scored fixes, including startup-off music and working current-tab opt-in.

- Make selection, legal movement, and destinations visible.
- Keep normal play sparse: pictures and counts for resources, with instructions and detailed stats available on demand.
- Preserve individual orders when attention moves elsewhere.
- Let terrain create choices.
- Keep levels and unit definitions easy to change.
- Choose our own rules explicitly wherever the reference leaves room.
