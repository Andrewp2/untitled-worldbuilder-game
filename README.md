# Untitled Worldbuilder Game

An original browser game inspired by spatial construction and real-time specialist-unit control. Thirty-six handcrafted missions across Meadow Isles, Sunstone Range and Open Sea combine movement, construction, cargo transport, terrain work, automatic combat, and family-specific recharging. The released World Builder 1 roster has original counterparts here: 20 buildable roles and six hostile roles, alongside the game's Hauler, Bristleback, and Signal relay. See [the roster guide](docs/ROSTER.md).

## Run

Requires Node.js 22 and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The app has no backend, account, external font requests, or game asset downloads.

```sh
npm test       # focused movement, construction, cargo, battery, combat, and mission checks
npm run build # type-check and bundle into dist/
```

## GitHub Pages

Play at [andrewp2.github.io/untitled-worldbuilder-game](https://andrewp2.github.io/untitled-worldbuilder-game/).

Pushing to `main` runs the tests, builds the game and deploys `dist/` through [GitHub Actions](.github/workflows/deploy-pages.yml). The build uses the path supplied by GitHub Pages, and game assets follow Vite's base URL. Local development still runs at `/`. Deployment status is available in [GitHub Actions](https://github.com/Andrewp2/untitled-worldbuilder-game/actions/workflows/deploy-pages.yml). Verification for the redesign is recorded in [the campaign evidence](.impeccable/review/campaign-redesign/evidence.md).

To check the Pages build locally:

```sh
npm run build -- --base=/untitled-worldbuilder-game/
npm run preview -- --base=/untitled-worldbuilder-game/
```

Open `http://127.0.0.1:4173/untitled-worldbuilder-game/`. Saves stay in the browser for each site's origin; progress on localhost is separate from progress on GitHub Pages.

## Play

Blueprints and supplies use pictures with counts. Hover for names, open the unit Info button for details, and open **Game menu → How to play** for controls and the resource legend. A short objective with pictured cargo requirements for convoy mains replaces the mission information panel; mission-specific hints live only in How to play. Walk onto blue ground plans to add pictured blueprints to the bottom toolbox; remaining stock is visible and costs appear on hover, focus or selection. Select units on the board or with 1–9. Installed charge uses one green bar with exact charge on hover. Invalid actions clear any transient message and use the existing error cue, honoring effects mute; success and reward messages expire after 3.5 seconds.

Start at **Hollow Reach**: Duck collects a blue plan, and the Scout you build reaches Shore. Three landscapes each contain twelve missions, with previous/next arrows beside the world name. Future maps can be viewed, but their missions stay locked until every preceding main has been completed. Names and prerequisites appear on hover or keyboard focus. Each completed mission adds one matching resident to its own landscape on compatible terrain; boats arrive only after their completed boat-bearing Open Sea missions.

**Meadow Isles** builds from independent movement and colored kits to split construction supplies, power rescue, charging stops, tower placement and a combined siege. **Sunstone Range** adds rough terrain, swamp energy costs, mobile repair, two-bank construction, salvage-funded kits, workshop relocation and a squad shipment. **Open Sea** adds shallow/deep restrictions, shore transfers, excavated canals, remote boat power, amphibious threats and combined ship/inland logistics. The [complete mission guide](docs/CAMPAIGN.md) lists all 36 distinct challenges. Convoy flags require the pictured colored parts and charged batteries aboard the arriving carrier; loose deposits do not count. Rescue flags may require the original unit.

Each mission has one main objective, then one hidden optional bonus. Completing the main pauses the mission and opens **Mission complete**. Choose **World map** to return, or **Try bonus** to resume with the bonus revealed. Bonus completion saves its star immediately, freezes the mission for the existing star rise (1.25 seconds, or 0.35 seconds with reduced motion), then opens **Bonus complete** with a starred flag, **Bonus star earned** and only **World map**. Escape also returns to the map and the final run cannot resume; each replay gets a new ending even if its star was already saved, without a duplicate award. Main completion unlocks the next mission; bonus stars never gate progress. Completed locations and stars are remembered in this browser, and unlocked missions can be replayed. Each visit restores terrain, units, supplies and finite blueprint stock; the bonus stays hidden until that visit's main is complete, even on replay. In-progress state is not saved. Older saved awards remain, but every preceding main is required to enter a later mission.

**Game menu → Reset progress** shows **Hold 3s**. Hold the primary pointer button, or hold **Space / Enter** while the control has focus, continuously for three seconds to clear all completed missions, bonus stars, and earned residents across the whole world map and return there. A short click does nothing; releasing early, leaving the button, losing focus, hiding the tab, pressing Escape, or closing the menu cancels the hold. Audio settings stay as chosen. **Restart** starts a fresh run of the current mission and keeps saved completions and stars.

In Game menu, the note and speaker buttons toggle music and sound effects separately. Both start off on every load; enable either for the current tab. Audio activates on the first click or keypress, remaining muted until enabled. An original synthesized theme accompanies quiet rover motors, cargo and construction sounds, and signal chimes. Pausing quiets enabled music and stops motors; hiding the tab suspends audio.

1. Move Duck onto the blue Scout plan to collect one construction use.
2. Build Scout beside the yellow/green/battery kit, then send Scout to Shore.
3. Choose **Try bonus**, then guide the original Duck to the shallow-water nest. The main already unlocks Parts and Paths.

In Bramble Crossing, collect the blue Warden plan, then build a **Warden** beside the camp's red/blue parts and charged battery kit. Move it to the crossing. It attacks nearby enemies automatically, spending battery charge with each hit; the Bristleback wanders until a rover enters its detection range, then pursues it. After clearing the crossing, move a rover onto the East flag.

**Battery charge is also the rover's health.** Movement, actions, and enemy damage all drain the same gauge. Using the last charge leaves an intact, powerless rover. An enemy hit that empties the battery destroys it, returning its recipe parts and cargo with an **empty installed battery**. Rebuilding from those parts leaves it powerless until you replace the battery. Batteries carried as cargo retain their own charge.

- Click a rover or press **1–9** to select it. Switching selection preserves movement and cargo orders.
- **Pick up / Drop off** accept distant reachable targets. The rover chooses a reachable orthogonally adjacent stopping tile, travels there, and checks the target again before transferring. Failed transfers preserve cargo. A successful order returns the cursor to Move mode; **Stop** cancels the pending transfer.
- **Space** chooses the selected unit's default action: pickup/drop for cargo units, Dig/Fill for Scoop, Uproot/Plant for Arborbot, or Push for Dozer. Passive creatures, fighters, and support structures need no extra action button. The Pick up button can add to partial loads. Scout holds 2 parts; Hauler holds 4; Forklift holds 10; Bulk hauler and Freighter hold 25. Mixed piles load red, blue, yellow and green parts, then batteries, then dirt. Scoop holds only 1 dirt through Dig/Fill. Drop-off unloads everything.
- **Dig / Fill** appear when Scoop is selected. Dig turns open grass/sand into water and loads 1 dirt; Fill consumes it to turn water into grass. Distant targets queue travel to an orthogonally adjacent tile and are checked again on arrival. Units and their reserved routes, relays, piles, flags, and bonus pads protect their tiles from work. Scoop offers only Move, Dig and Fill, and cannot pick up or drop cargo. Taking it apart releases its dirt for a Hauler to recover. Its recipe is 1 red + 1 blue + 2 yellow + 1 battery.
- **Build** uses only loose parts in the full **3×3** area centered on the site, including diagonals. Carried parts do not count. Choose a clear tile compatible with the model: boats and Fish use water, Marina needs shallow water, and land units follow their terrain profile. Signal relay requires grass/sand. No nearby builder is required. Each successful build spends one finite blueprint; failed builds spend none. Exhausted choices are disabled. Construction is immediate, with a visual smoke puff.
- **Every mobile unit and Sentry tower needs one battery** in its recipe. An empty battery works for construction but leaves it powerless. Charging station, Bot workshop, and Marina use no battery; they have structural integrity and recharge their matching family automatically. The best charged battery in the construction area is used first.
- **Battery balance is provisional:** full charge 100; entering an ordinary tile costs 1 and swamp costs 3; each successful pickup/drop costs 2; each successful terrain/obstacle action costs 3; each Warden attack costs 2 and other friendly attacks cost 1. A unit pays for a tile before leaving, so it always finishes that step before stopping. Idling and waiting do not drain charge. A depleted order stops and keeps its cargo. Support pulses add up to 6 charge each second; Mender spends 1 of its own charge per repaired bot.
- **Dozer** pushes a rock or an entire loose pile one tile away from its working side. **Arborbot** lifts and replants one tree, moving slower while carrying it. Distant work chooses a reachable side and checks the target and destination again on arrival. Trees survive dismantling or wrecks as recoverable loose trees.
- **Terrain belongs to each role:** Trailbuggy and Mender cross rough ground; Frog and Duck use land and shallow water; Fish and boats use shallow/deep water. Paths check every tile. Tugboat and Freighter can sail beside shore supplies to pick up or drop off.
- **Replace battery** on a stopped rover uses a battery with more charge on the ground in its 3×3 area. Another rover can deliver one. The old battery returns to the ground; no charge is created. Some rescues require dismantling another model to donate its remaining power.
- **Click a relay or rover**, then **Take apart** to recover its parts, installed battery at its remaining charge, and cargo. The Take apart tool in the blueprint tray also targets objects directly. Dismantling and destruction show smoke and never refund a blueprint. Rebuilding needs remaining stock and never refills a battery.
- Drag / **WASD / arrows** pan; scroll to zoom. **F** centers selection; **Home** shows the island. **Esc** cancels targeting, or clears selection when already in Move mode.
- **Pause** freezes movement, pursuit, combat, and presentation motion. Nearby cargo/terrain actions and construction remain available; distant orders wait for movement to resume. **Restart** restores the current mission's terrain, units, enemies, materials, batteries, and objectives. Switching missions starts fresh.

The game runs locally and saves mission completion when browser storage is available. Balance remains provisional. Units cannot share tiles; opposing traffic in a one-tile corridor may require redirecting one unit. Warden, Arborbot and Mender use four jointed legs; vehicles retain wheels. Desktop mouse and keyboard are the target. The board fills the viewport with a compact bottom toolbox; desktop visits initially fit the entire authored board, including larger final missions at widths of at least 700px; a mobile layout is outside the current scope.

The historical [campaign-rules finish review](.impeccable/review/campaign-rules/finish-review.md) returned **ship** with no material fixes. Its [evidence](.impeccable/review/campaign-rules/evidence.md) records 219 passing tests in 19 files and a passing production build. Isolated native 1280×720 play verified Hollow main → bonus → saved star → next mission, plus finite relay stock after build/dismantle and construction smoke. Later mission solves use public simulation commands. Specialist native completion, combat smoke capture, reduced-motion preference emulation, balance, performance and audible audio remain unclaimed.

The historical [Scoop / Siltwater finish review](.impeccable/review/terrain-work/finish-review.md) returned **ship**, with 82 unique focused tests, a passing build, and native browser digging, filling, crossing, and fresh restart. Its [evidence](.impeccable/review/terrain-work/evidence.md) records desktop/mobile captures and the limits of completion, reduced-motion, and audio verification.

The historical [desktop feedback verdict](.impeccable/review/user-feedback/finish-verdict.md) returned **ship** for all eight scored fixes. That checkpoint passed the build and 106 tests. Rover and rock models share the grid projection; red, blue, yellow and green parts are distinct quantities. Terrain uses quieter color planes as a reversible trial. Its freighter withdrawal is superseded by Harbor Run's playable one-tile boats; the current campaign earns one boat resident per completed boat-bearing Open Sea mission. See [checkpoint evidence](.impeccable/review/user-feedback/evidence.md).

The historical [roster finish review](.impeccable/review/roster/finish-review.md) found one Build-help contradiction; the [final verdict](.impeccable/review/roster/finish-verdict.md) returned **ship** after that correction. The full suite passed 194 tests before the final small fixes, then 107 focused tests and the build passed after them; the build passed again after the help-copy fix. Native desktop review covered 1280×720 and 899×900, including tree work, shore cargo, recharge, and Sentry construction. All five new missions' main goals and bonuses completed through deterministic public simulation commands, rather than every native mission completion. [Roster evidence](.impeccable/review/roster/evidence.md) records the exact scope; audible audio, performance, original-stat fidelity, mobile layouts, and whole-game approval are not claimed.

The current [campaign expansion evidence](.impeccable/review/campaign-expansion/evidence.md) records 259 passing tests in 24 files, public-command solutions for all 36 canonical mains/bonuses and a passing Pages-base build after the desktop initial-fit correction. Native 885×901 captures cover all three landscapes, representative missions and both Parts and Paths popups. Populated-map progress was seeded in a separate ephemeral fixture absent from production; actual pictured controls completed Parts and Paths, including kit transport/build with zero stock and blue delivery. An ordinary origin with a pre-existing Hollow award confirmed later Meadow locks and all twelve Sunstone locks; a fresh Three Tides visit confirmed the complete initial board without Overview. The [scoped finish verdict](.impeccable/review/campaign-expansion/finish-verdict.md) marks the documentation correction resolved and ready to ship; it is not whole-game approval. This evidence does not claim all-36 native completion, mobile behavior, audio listening, performance or calibrated balance.

## Layout

- `src/core/`: grid routing, isometric coordinate conversion, and the rendering-independent simulation.
- `src/levels/`: hand-authored terrain, starts, unit definitions, and objectives.
- `src/view/`: Phaser scenes, input, camera, map, and toy rendering. Three.js renders authored units, enemies, battery, rock, tree and colored-part models once into reusable canvas sprites.
- `src/audio/`: original synthesized music/effects and the Web Audio playback controller.
- `src/main.ts` and `src/style.css`: the accessible HTML HUD and game bootstrap.
- `tests/`: focused behavior tests.
- `DESIGN.md`: game direction and reference research.
- `docs/PROTOTYPE.md`: provisional rules and visual choices for this milestone.
- `docs/ROSTER.md`: released-roster counterparts, terrain, specialist roles, and their authored adaptations.
- `docs/CAMPAIGN.md`: the current 36-mission order, distinct authored challenges and verification scope.

Phaser and Three.js are MIT-licensed. Nunito Sans is bundled through Fontsource under the SIL Open Font License. All three licenses are included in `public/` and the production build. All map layouts, art, music, and sound effects are original to this prototype. Retained cutouts use built-in image generation; the [asset manifest](public/art/toy-world/manifest.json) records 34 PNGs with embedded provenance, including older rover, Bristleback, battery, rock, tree, terrain and freighter reference assets. Current unit/enemy, battery, rock, tree and colored-part art and quiet terrain come from code. The roster extension adds no shipped raster assets. Original reference code and art were not copied.
