# Released-roster counterparts

The game now covers the released LEGO World Builder 1 roster: 20 buildable roles and six hostile roles. These are original toy designs with authored names, recipes, statistics, maps, and mission rules. The reference supplies role coverage, not an exact reconstruction. Cut Bluebird and Cargo Copter, and sequel additions, are outside this roster. Hauler, Bristleback, and Signal relay are retained additions distinct from the reference roster.

[catalog.ts](../src/core/catalog.ts) is the source of truth for recipes, capacity, speed, damage, family, terrain, actions, and enemy salvage. [grid.ts](../src/core/grid.ts) applies terrain profiles to every tile of a route. Reference identities are recorded in the catalog from [the released-roster account](https://brickipedia.fandom.com/wiki/World_Builder), with [sprite references](https://www.spriters-resource.com/browser_games/legoworldbuilder/page-1/) and [cut/sequel distinctions](https://bricks.stackexchange.com/questions/15211/world-builder-game-units). Exact original statistics have not been established.

## Buildable roles

“Land” below means grass, sand, swamp, and boardwalk. “Rough” adds rough ground to land. Shallow and deep water are separate terrain types. Trees, rocks, occupied tiles, and static structures block routes. Cargo capacities count parts, carried batteries, and dirt; Scoop's one-dirt bucket and Arborbot's tree are specialist loads.

| Reference | Counterpart / family | Role and capacity | Terrain | Action or automatic support |
| --- | --- | --- | --- | --- |
| Buggy | Scout / vehicle | Fast courier, 2 cargo | Land | Pick up / Drop off |
| Dirtbuggy | Trailbuggy / vehicle | Rough-ground courier, 3 cargo | Rough | Pick up / Drop off |
| Snail | Snail / creature | Slow explorer, no cargo | Land | Move |
| Steamshovel | Scoop / vehicle | Shoreline worker, 1 dirt | Land | Dig / Fill; no cargo transfers |
| Bulldozer | Dozer / vehicle | Obstacle worker, no cargo | Land | Push rock or whole loose pile |
| Forklift | Forklift / vehicle | Carrier, 10 cargo | Land | Pick up / Drop off |
| Treebot | Arborbot / bot | Tree worker, 1 tree | Land | Uproot / Plant; slower while loaded |
| Defender | Warden / bot | Fighter, 1 cargo | Land | Automatic adjacent combat; Pick up / Drop off |
| Dumptruck | Bulk hauler / vehicle | Heavy carrier, 25 cargo | Land | Pick up / Drop off |
| Gas Station | Charging station / structure | Stationary, no cargo | Land site | Restores adjacent vehicles |
| Robot Lab | Bot workshop / structure | Stationary, no cargo | Land site | Restores adjacent bots |
| Guard Tower | Sentry tower / structure | Stationary fighter, no cargo | Land site | Battery-powered adjacent combat |
| Repairbot | Mender / bot | Mobile support, no cargo | Rough | Restores one adjacent bot using its own charge |
| Frog | Frog / creature | Explorer, no cargo | Land + shallow water | Move |
| Duck | Duck / creature | Explorer, no cargo | Land + shallow water | Move |
| Fish | Fish / creature | Swimmer, no cargo | Shallow + deep water | Move |
| Tugboat | Tugboat / boat | Water courier, 5 cargo | Shallow + deep water | Pick up / Drop off, including shores |
| Freighter | Freighter / boat | Heavy water carrier, 25 cargo | Shallow + deep water | Pick up / Drop off, including shores |
| Speedboat | Patrol boat / boat | Fast fighter, no cargo | Shallow + deep water | Automatic adjacent combat |
| Marina | Marina / structure | Stationary, no cargo | Shallow-water site | Restores adjacent boats |

The additional Hauler is a land vehicle carrying 4 cargo. Signal relay is a battery-free dismantlable object built on grass/sand; it does not recharge units. Bristleback remains the land hostile in Bramble Crossing and drops no enemy salvage.

## Hostile roles

Hostiles wander, detect nearby friendly units, pursue them, and attack automatically at adjacent range. Their movement obeys the same complete terrain profiles. The six roster hostiles release authored colored parts and one full-charge battery when defeated; this differs from friendly wrecks.

| Reference | Counterpart | Terrain | Defeat salvage |
| --- | --- | --- | --- |
| Crab | Crab | Land | 3 red + charged battery |
| Water Crab | Reef crab | Shallow + deep water | 3 blue + charged battery |
| Scorpion | Scorpion | Rough | 4 yellow + charged battery |
| Alligator | Gator | Land + shallow/deep water, excludes rough | 4 green + charged battery |
| Tyrannosaurus Rex | Rex | Rough | 2 red + 4 green + charged battery |
| Shark | Shark | Shallow + deep water | 5 blue + charged battery |

Reference accounts disagree about Alligator's deep-water access. Gator's deep-water profile is a provisional adaptation; it never gains rough-ground access from that profile.

## Shared rules

Construction consumes only loose ground supplies in the site's full 3×3 area, including diagonals. The site must be clear and match the model's terrain profile: boats and Fish use water, and Marina needs shallow water. Carried supplies do not count. Construction remains immediate with no nearby builder requirement. `Mission.blueprints` authors finite per-model stock; ground plans add one use when a mobile model walks onto them, with some revealed after the main. successful builds consume one, failed builds consume none, and dismantling/death never refunds a blueprint. The drawer displays remaining counts and disables zero stock; fresh visits/restarts restore authored stock.

Every mobile role and Sentry uses one physical battery. Charging station, Bot workshop, and Marina use no battery and instead have structural integrity; enemy damage can destroy them and release their recipe parts. Dismantling returns recipe parts and carried contents, preserving the installed battery's current charge. Spending a friendly unit's last charge leaves it intact and powerless. A lethal enemy hit leaves a dead installed battery in the wreck; batteries carried as cargo keep their own charge. Rebuilding requires remaining blueprint stock; it and battery replacement create no charge. Construction, dismantling and destruction have a presentation smoke puff.

Support is automatic at adjacent range, with up to 6 charge restored per one-second pulse. Charging station serves vehicles, Bot workshop serves bots, and Marina serves boats; they can restore all adjacent units of the matching family. Mender restores one adjacent bot per pulse, spending 1 of its own charge, and can itself recharge at Bot workshop. Creatures and Sentry do not belong to those recharge families. Passive support and combat need no new action button.

Travel normally costs 1 charge per entered tile; swamp costs 3. Successful cargo transfers cost 2, terrain/obstacle work costs 3, Warden attacks cost 2 and other friendly attacks cost 1. Capacity, recipes, speeds, damage, energy costs, support rates, and maps are authored prototype balance. [The prototype notes](PROTOTYPE.md) explain the retained order, combat, and battery rules.

Cargo boats can queue distant shore pickup/drop-off and sail to an orthogonally adjacent water tile before transferring. Dozer chooses a reachable working side and pushes the entire pile or rock one tile away on grass, sand or swamp. Loose piles combine with existing piles without losing colored parts, battery charges or dirt; rocks require an empty destination. Arborbot queues distant Uproot/Plant, preserves the ground under moved trees, and carries only one tree. Work revalidates occupancy, protected goals/routes, target, destination, and charge on arrival. Trees remain conserved through uprooting, planting, dismantling, and wrecks; an exposed loose tree can be recovered by Arborbot.

Space follows the catalog's default action: pickup/drop, Scoop Dig/Fill, Dozer Push, or Arborbot Uproot/Plant. Unsupported actions are hidden and rejected without spending resources or replacing valid orders. Stationary structures cannot move or satisfy arrival flags.

## Current campaign

The canonical [mission registry](../src/levels/missions.ts) now contains 36 ordered missions in Meadow Isles, Sunstone Range and Open Sea, twelve per world. [CAMPAIGN.md](CAMPAIGN.md) lists each distinct challenge and its verification evidence. The earlier five-mission extension is retained in its historical review records below; its original Tidepool/Harbor objectives and two-resident rewards are superseded by the current campaign.

Only Hollow Reach starts unlocked. Every preceding main is required to enter a later mission, including across both world boundaries; bonuses never gate access. Each visit has one main, then one hidden optional bonus. Main completion offers World map or Try bonus; bonus completion ends the visit with the final World map popup. Visits restore terrain, units, supplies, batteries and authored finite plans while retaining saved awards. Existing known awards cannot bypass newly inserted prerequisites.

Meadow develops individual tools into combined engineering, colored shipments, power and combat. Sunstone adds rough/swamp constraints, mobile repair, forward construction and salvage. Open Sea adds shoreline transfer, launch sites, excavated canals, remote recharging and combined fleet/inland logistics. Tidepool Trail now requires restoring the original Frog and clearing its threats before the bank arrival; Harbor Run now requires an actual shore shipment with hostile clearance. Other goals bind an original rescue unit or require deposited colored parts and charged batteries, rather than an empty carrier's arrival.

Each completed mission adds one chosen resident to its own world, with a patrol fitted to compatible authored map terrain. Boat scenery belongs only to completed boat-bearing Open Sea missions. Replays do not duplicate residents. [World definitions](../src/levels/world-map.ts) and [resident definitions](../src/view/world-residents.ts) are the source of truth; the current campaign no longer awards two residents per early mission.

## Visuals and verification

Every roster unit and hostile uses code-native Three.js geometry rendered once through the established orthographic camera into reusable Phaser canvases. Four headings share geometry, lighting and support plane; Warden, Arborbot and Mender have four jointed walking legs, vehicles retain wheels, and boat hulls occupy one tile. Shared construction/dismantling/destruction smoke lasts .7 seconds, freezes on pause and uses a .25-second static reduced-motion puff. Water actors sit 10px below land, shoreline motion interpolates surface height, and picking follows the rendered anchor. The extension ships no new raster assets and preserves the existing [34-PNG provenance manifest](../public/art/toy-world/manifest.json). The approved study remains a style reference. Quiet broad terrain is still a reversible trial, and desktop is the required layout scope.

Historical [roster evidence](../.impeccable/review/roster/evidence.md) records a full 194-test pass before final small fixes, a subsequent 107-test focused pass, and a passing build after those fixes and the final help-copy correction. Native captures at 1280×720 and 899×900 were inspected and independently reviewed. Native actions verified Uproot/Plant, a 12-part shore pickup, Marina recharge, and Sentry 3×3 construction. Deterministic public simulation commands completed every new mission's main goals and bonus, including Ancient combat, support, and salvage; native play did not complete every mission.

The [finish review](../.impeccable/review/roster/finish-review.md) requested a single Build-help correction. The [final verdict](../.impeccable/review/roster/finish-verdict.md) returned **ship** for that resolved fix, retaining the original review's desktop evidence. These records do not certify whole-game balance, original-stat fidelity, mobile behavior, audible audio, or performance. The existing Phaser/Three bundle warning remains; the single detector output was truncated and has no clean-count claim.


The historical [campaign-rules review](../.impeccable/review/campaign-rules/finish-review.md) returned **ship** with no material fixes. [Evidence](../.impeccable/review/campaign-rules/evidence.md) records 219 passing tests in 19 files and a passing build, isolated native 1280×720 Hollow main/bonus progression and finite relay stock, and a native construction puff. Later mission solutions use public simulation commands; native specialist completion, combat smoke capture, preference-emulated reduced motion, balance, performance and audible audio remain unclaimed.


The current [campaign expansion evidence](../.impeccable/review/campaign-expansion/evidence.md) records 259 passing tests in 24 files, all 36 canonical public-command main/bonus solutions and a passing Pages-base build after the desktop initial-fit correction. Native review used 885×901 captures: populated maps and later replays used synthetic awards in an isolated fixture absent from production; actual Parts and Paths play transported/built the finite Scout kit and completed both popups. The ordinary origin's pre-existing Hollow award exposed Parts while later Meadow and all Sunstone missions remained locked. A fresh Three Tides visit confirmed the complete starting board without Overview. The five-section finish review returns **fix** solely for current documentation; the [scoped verdict](../.impeccable/review/campaign-expansion/finish-verdict.md) marks that correction resolved and ready to ship, without whole-game approval. No all-36 native completion, mobile, audio listening, performance or calibrated-balance claim is made.
