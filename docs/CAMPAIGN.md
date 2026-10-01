# Campaign expansion: 36 handcrafted missions

The current implementation contains 36 missions in three ordered worlds. All 36 main objectives and 36 bonuses have public-command simulation solutions. The expanded registry, distinct maps and compact world navigation are implemented locally and have native desktop review. The [scoped finish verdict](../.impeccable/review/campaign-expansion/finish-verdict.md) marks the documentation correction resolved and ready to ship. GitHub Pages deploys `main`; current deployment status is available in [Actions](https://github.com/Andrewp2/untitled-worldbuilder-game/actions/workflows/deploy-pages.yml).

Three worlds contain twelve missions each. Main objectives unlock the next level in a single order, including world boundaries. Every mission has one main objective and one hidden, optional bonus. Main completion opens the existing continuation popup; bonus completion ends that visit with the final popup. Replays reset finite plans, supplies, batteries and terrain, while retaining saved awards.

The progression starts with individual actions, then forces relationships between unit roles. Sunstone adds rough terrain, costly swamp routes, mobile repair, forward construction and salvage. Open Sea adds deep/shallow restrictions, shoreline transfers, canals, launch sites and fleet logistics. The final missions require combined construction, transport, energy planning and real-time automatic combat. The authored difficulty curve uses those interacting constraints; player-calibrated balance remains provisional.

The [stitched original maps](https://rockraidersunited.com/topic/9159-lego-worldbuilder-maps/) informed the progression from specialist introductions and narrow construction puzzles to mixed-unit islands, long supply routes and naval encounters. The user's supplied Ocean 12 screenshot also informs the last world's wider battles. Layouts, names, recipes, unit models and solutions here are original. Existing [play notes](references/play-notes-2026-09-28.md) distinguish observed reference controls from later recollection; no unverified original statistic is used as an asserted rule.

| Order | Meadow Isles | Distinct challenge |
| --- | --- | --- |
| 1 | Hollow Reach | Independent rover movement; reserve battery delivery after arrival. |
| 2 | Parts and Paths | Haul a colored kit, build Scout once and use its role at the flag. |
| 3 | Siltwater Reach | Borrow two land tiles to construct a missing crossing. |
| 4 | Stone Gate | Push the gate from the right side and park the worker outside the exit. |
| 5 | Woodland Workshop | Replant two trees without sealing the corridor; open a loading pocket. |
| 6 | Split Kit | Combine separated recipe colors and use a larger carrier for repeated deliveries. |
| 7 | Flat Battery | Restore the original stranded Scout while keeping a separate power reserve. |
| 8 | Switchback Stations | Build charging stops on a long route and fund the loaded return. |
| 9 | Bramble Crossing | Construct a combat specialist and protect a crossing before proceeding. |
| 10 | Forked Watch | Spend two tower plans at useful sites on separate hostile choke points. |
| 11 | Orchard Convoy | Combine tree relocation, repeated rock pushes and an actual heavy shipment. |
| 12 | Meadow Siege | Clear a tree gate, build a causeway, fight together and escort the original Snail. |

| Order | Sunstone Range | Distinct challenge |
| --- | --- | --- |
| 13 | Rough Ridge | Send the rough specialist first; engineer a second route for a vulnerable unit. |
| 14 | Ridge Post | Ferry a combat kit across terrain its finished unit cannot traverse. |
| 15 | Mudline | Reject the shortest route when swamp energy costs make it unaffordable. |
| 16 | Boulder Courtyard | Shift the captive inside a holding bay to permit reverse rock pushes. |
| 17 | Repair Column | Keep mobile support close during two fights; recover power from field salvage. |
| 18 | Ancient Valley | Pair combat and repair against different creatures, then conserve salvage. |
| 19 | Forward Foundry | Ferry parts to build power beside an original depleted forward defender. |
| 20 | Canyon Rescue | Work from opposite banks to reunite separated crews over a wider gap. |
| 21 | Salvage Chain | Defeat a creature to obtain the otherwise missing construction colors. |
| 22 | Two Fronts | Coordinate separated defenders while the support unit crosses the rough divide. |
| 23 | Power Bridge | Relocate a workshop, carry a vehicle battery and clear the final rock gate. |
| 24 | Sunstone Citadel | Engineer a heavy-transport route and sustain a squad through mixed predators. |

| Order | Open Sea | Distinct challenge |
| --- | --- | --- |
| 25 | Tidepool Trail | Upgrade the existing shallows lesson into a boat-powered amphibious rescue. |
| 26 | Reef Courier | Use small-boat shoreline transfer to supply a remote launch site. |
| 27 | Deepwater Maze | Dig land barriers into connected water passages for an original Fish. |
| 28 | Marina Relay | Bootstrap boat recharging from a kit larger than the first boat's hold. |
| 29 | Harbor Run | Upgrade the harbor into a combined shore-defense and naval supply operation. |
| 30 | Wreck Recovery | Deliver power to an original immobile ship while a patrol protects the recovery. |
| 31 | Canal Foundry | Coordinate shore workers, canal access and forward naval construction. |
| 32 | Gator Backwater | Draw amphibious pursuers toward shore defenses before opening a rescue passage. |
| 33 | Island Handoffs | Transfer a shipment between ships and newly built inland carriers. |
| 34 | Storm Line | Sustain a fleet through separate hostile choke points with limited repair positions. |
| 35 | Last Reserves | Turn the sole starting power reserve into a chain of combat salvage and recovery. |
| 36 | Three Tides | Combine fleet transport, land construction, terrain work, power and multiple live threats. |

## Verification contract

Each authored addition has a mission-specific solution using public Simulation orders, builds, transfers, battery swaps and elapsed simulation time. Solutions must complete the main before the bonus without editing unit charge, enemy health, terrain, stocks or objective state. Resource and terrain changes must leave a fresh replay intact. Failure cases establish important gates, such as an unaffordable direct swamp route or an original rescue unit that cannot be replaced by a newly built copy.

The core/content checkpoint passed 259 tests in 24 files and the production build on September 30. `meadow-campaign`, `sunstone-campaign` and `open-sea-campaign` exercise 30 canonical main/bonus solutions. `campaign-content` adds real Hollow and Bramble solves; `terrain-work` completes Siltwater; `roster-missions` completes Rough Ridge, Woodland Workshop and Ancient Valley. Together they cover the 36 distinct canonical missions, not an alternate test-only registry. Cargo, terrain work, construction, support, combat and battery changes occur through public Simulation commands and elapsed time; solution tests never write health, charge, terrain or objective state.

`campaign-content` also verifies three exact ordered groups of twelve, 36 distinct tile layouts and challenge descriptions, every main prerequisite, both world boundaries, saved stars, reset of all 36 awards and preservation of known older awards without bypassing newly inserted prerequisites. Map path and resident tests verify all locations and patrols against the corresponding authored landscape. Delivery-goal tests reject empty carriers and empty batteries, bind original rescue identities, and delay predeposited shipments until the last hostile is defeated.

Native desktop inspection used actual 885×901 captures of all three landscapes and representative mission visits. Populated maps and later replays used known synthetic awards on isolated origin 5190, from an ephemeral fixture outside the repository and absent from production. Actual Parts and Paths controls transported the Scout kit, built one Scout with plan stock reduced to zero, reached its main, resumed through Try bonus, delivered the blue shipment and opened the final popup. The fixture's earlier awards are not native-earned completion.

Ordinary origin 5189 had a pre-existing Hollow main/star award: Parts was available, ten later Meadow levels were locked and all twelve Sunstone buttons were disabled after browsing forward. This is an existing one-award save, not a native fresh-save/reset claim. A fresh Three Tides visit without Overview confirmed the corrected initial full-board fit; the independent reviewer reopened it and closed the camera gap. The Pages-base build passed after that fix.

The [five-section finish review](../.impeccable/review/campaign-expansion/finish-review.md) returns **fix** solely for stale current-scope documentation and the required final recording pass, with no extension UI repair remaining. The current records and sidecar have been reconciled; the [scoped verdict](../.impeccable/review/campaign-expansion/finish-verdict.md) marks that fix resolved, without whole-game approval. [Evidence](../.impeccable/review/campaign-expansion/evidence.md) is authoritative about fixture and native states. No all-36 native completion, additional 1280 capture, mobile behavior, audio listening, benchmark, exact-original-stat fidelity or player-calibrated balance is claimed. The single detector pass reports advisory palette/radius/type documentation mismatches, with no clean-zero claim. No new raster assets ship; the retained 34-PNG provenance manifest is unchanged.
