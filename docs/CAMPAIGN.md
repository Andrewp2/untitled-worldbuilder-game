# Campaign redesign: 36 handcrafted missions

All three worlds have twelve ordered missions. Each mission has one main goal and one bonus revealed after that visit’s main. Reaching the bonus ends the visit through the final popup. Replays restore the authored terrain, units, supplies, battery charge and finite plans; saved awards remain.

This pass responds to the repetitive delivery bonuses and rectangular banks in the first campaign. The seven opening missions have new layouts and solutions. The remaining 29 have revised coasts, obstacles or route geometry and reworked objective pairs. Some later mains retain their useful engineering or combat idea; their bonuses add another terrain, salvage or power decision. All flags require a mobile model on the target. Five convoy mains additionally require cargo aboard that model. Loose deposits never finish a goal, and no bonus is a block shipment.

Normal objective text describes the destination and success conditions without giving away the conversion or route. Game menu → How to play offers two optional hints per main and bonus: a conceptual nudge first, concrete advice second. No hint appears until requested. Completing the main clears its revealed hints and makes the bonus hints available; restarting or revisiting starts with none revealed. Hints have no star penalty and do not change saved progress. The authored [hint table](../src/levels/mission-hints.ts) covers all 36 missions.

Every wheeled recipe also needs four tires. Tires occupy one cargo slot each and survive dismantling or destruction along with colored parts. Blueprint counts still limit rebuilds.

Linked whirlpools count as shallow water: entering one takes its unit and cargo to a predetermined exit without an extra battery cost. The exit is reserved while entering, and a unit must leave and re-enter before it jumps back. Reef Courier uses the pair to discover a ship plan in a sealed port and land a gate-opening tool inside the reef; Deepwater Maze offers a power-saving pond detour.

Builder licenses use saved bonus stars: Class 1 initially, Class 2 at 12, Class 3 at 24, Class 4 at all 36. The yellow license button shows a printable keepsake, an earned portrait and stamps for finished worlds. Replays cannot duplicate stars; Reset progress also resets the license.

Blue ground plans add one construction use when a mobile unit walks onto their tile. A plan may appear after the main. Successful construction consumes stock; dismantling and destruction do not refund it. Donated batteries retain their charge, so rebuilding does not provide free movement. Warden attacks cost two power rather than one; repair support, static defenses and regrouping matter in the later fights. Those values remain provisional until player testing.

The October 1 play-feel refinement adds alternative plans to Stone Gate, Forked Watch and Three Tides. Forked Watch’s authored patrols make distraction and crossing timing deliberate; most other enemies retain seeded wandering. All missions show a grounded construction preview with pictured missing ingredients and a short enemy-notice cue before distant pursuit. Adjacent combat remains automatic and immediate. No bonus checkpoint or undo was added. Public-command solutions cover both new plans and the full 36-mission main/bonus campaign; this is not a claim of complete human playtesting or final balance.

## Meadow Isles

| # | Mission | Main decision | Bonus twist |
| --- | --- | --- | --- |
| 1 | Hollow Reach | Duck finds Scout’s plan; build Scout for the land flag. | Duck reaches a shallow-water nest that Scout cannot enter. |
| 2 | Parts and Paths | Build Trailbuggy to cross the rocky neck. | Find Dozer on the far side and reverse-push the lower rock gate for the original Scout. |
| 3 | Siltwater Reach | Borrow land to bridge the channel for Snail. | Recycle Snail into Fish, then dig out the crossing to reopen the water route. |
| 4 | Stone Gate | Spend the shared kit on Dozer through the rock gate or Scoop along the lower shore. | Make an islet crossing, then reclaim the tool as Arborbot and bring a living wall tree to the garden. |
| 5 | Tidal Workshop | Dismantle Duck for the yellow piece and battery needed by Trailbuggy. | Recycle Trailbuggy and construct Duck directly on the shallow star surrounded by deep water. |
| 6 | Split Kit | Carry half a kit around the crescent; use diagonal construction to combine it with inaccessible island pieces. | Recycle Forklift with green stock into Arborbot; lift the tree gate and carry it to the garden. |
| 7 | Flat Battery | Donate Hauler’s used battery to the original stranded Scout. | Recycle Scout into Warden and clear the Crab before reaching the bay star. |
| 8 | Switchback Stations | Place shared power for Hauler and Dozer; take the northern coast or open a rock shortcut. | Build a charger inside the isolated grove using diagonal supplies. Charge Scout and move it aside so Dozer can push its gate open, then guide Scout home. |
| 9 | Bramble Crossing | Find a finite Warden plan and defend the narrow crossing. | Recycle Scout with camp colors into Arborbot; bring an eastern tree to the star. |
| 10 | Forked Watch | Draw the bridge patrol away with Scout while Hauler takes another crossing, or hold both with towers. | Reserve or reclaim a tower kit to build Duck for the water-only inlet. |
| 11 | Orchard Convoy | Replant a tree, push the boulder along the causeway and bring the loaded Bulk hauler to Orchard. | Original Arborbot brings an eastern tree around the rock outcrop to the southern grove. |
| 12 | Meadow Siege | Clear the tree gate, make a causeway, fight together and escort the original Snail. | Ferry a reserve to the river shore and build Frog for the water star. |

## Sunstone Range

| # | Mission | Main decision | Bonus twist |
| --- | --- | --- | --- |
| 13 | Rough Ridge | Recycle Scout with loose red/blue into Trailbuggy for the rocky saddle. | Scoop makes a separate low crossing; Warden protects the original Snail’s route. |
| 14 | Ridge Post | Ferry a Warden kit across rough terrain its finished model cannot cross. | Combine defeated Crab’s red pieces and battery, Warden’s blue kit and four spare tires at Post to build Hauler. |
| 15 | Mudline | Use dry waypoints; the shorter swamp route exhausts the starting battery. | Recharge and recycle Hauler with a green piece into Frog for the bog pool. |
| 16 | Boulder Courtyard | Move Snail inside the holding bay to permit reverse pushes. | Combine Dozer and Hauler’s kits into Trailbuggy for the high rocky court. |
| 17 | Repair Column | Keep Mender close through two Scorpion fights. | Use field salvage to restore the original Mender for the northern overlook. |
| 18 | Ancient Valley | Coordinate Warden and Mender against Scorpion and Rex around rocky pockets. | Combine their different salvage colors into Arborbot and carry a valley tree around the rough ground. |
| 19 | Forward Foundry | Ferry workshop parts to restore the original empty far-bank Warden. | Trailbuggy places a Frog kit on the rocky ridge for diagonal construction directly into the oasis. |
| 20 | Canyon Rescue | Build Scoop on the far side and work from both banks to join the channel. | Recycle the far Scoop into Trailbuggy for the upper ridge. |
| 21 | Salvage Chain | Scorpion supplies the missing yellow pieces and power for the gate-opening Dozer. | Bring green beside Dozer, recycle its battery into Frog and visit the eastern pool. |
| 22 | Two Fronts | Move repair support across the rough divide while the two guards clear separate encounters. | Arborbot must open and replant both tree gates along the lower causeway. |
| 23 | Power Bridge | Relocate a workshop; separately deliver a vehicle battery to Dozer for the rock gate. | Recycle Forklift into Trailbuggy to explore the rough northern return. |
| 24 | Sunstone Citadel | Make a heavy crossing, establish a guard post, fight mixed predators and bring the loaded salvage convoy to Citadel. | Original Arborbot lifts the separate tree gate into a sheltered grove and brings it to the star. |

## Open Sea

| # | Mission | Main decision | Bonus twist |
| --- | --- | --- | --- |
| 25 | Tidepool Trail | Protect a boat transfer that restores the original Frog; use the shallow route. | Return through the shallows, recycle Duck’s battery with a shore blue piece and build Fish directly into the enclosed western tidepool. |
| 26 | Reef Courier | Explore the whirlpool for Freighter’s plan. Recycle Tugboat with two extra camp pieces into Freighter, either at camp or inside the sealed port. | Ship wheels and yellow pieces through the whirlpool; convert Freighter into Dozer on the inner shore. Open the gate from inside with two outward pushes, then move clear so the original stranded Snail can reach home. |
| 27 | Deepwater Maze | Dig three canal plugs and dispose of each dirt load without sealing Fish’s escape. | Recycle Scoop into Duck; linked whirlpools offer a power-saving route from the western pool to the waste pond. |
| 28 | Marina Relay | Reclaim Tugboat with three camp pieces to build Marina beside the original empty Freighter, or donate its battery first and build the berth later. | Recharge Freighter before reclaiming its battery and Marina’s colored kit as Patrol boat. The only yellow piece belongs to the charger; give up the berth, clear the outer Shark and reach the beacon. |
| 29 | Harbor Run | Coordinate land and sea defense; Freighter must reach its berth with camp stores aboard. | Bring blue salvage to the sealed quay pond and build Fish directly into it. |
| 30 | Wreck Recovery | Recover power beyond a hostile reef and restore the original stranded ship. | Dismantle Patrol boat in the northern shallows to build Duck on the island shore. |
| 31 | Canal Foundry | Open the land plugs, ferry a Patrol boat kit and build beyond the canal barrier. | Recycle the patrol into Snail on the shore for an inland garden. |
| 32 | Gator Backwater | Lure amphibious threats into shore towers before excavating Fish’s escape. | Restore the original bait Frog from Gator salvage; reach the far shore with at least 60 power. |
| 33 | Island Handoffs | Land at the near quay and use the shared kit as Dozer to open the rock pass, then rebuild as Bulk hauler; or sail to the distant northern quay and build beyond the gate. Bring twenty green pieces aboard the hauler to the inland flag. | Recycle the loaded hauler into Scoop. Borrow coastal ground to bridge two shallows to a separate garden island, collect Arborbot’s plan there, then recycle Scoop with the delivered green stock and carry a living tree across. |
| 34 | Storm Line | Restore and fight with separate patrols in two channels. | Ferry blue salvage to the divider and construct Fish in the pond disconnected from both channels. |
| 35 | Last Reserves | Turn the sole starting charged battery into combat salvage that restores the original Freighter. | Collect green, donate Freighter’s installed battery and build Frog on the northwest shore with at least 50 power. |
| 36 | Three Tides | Open the coast and fight for salvage; ship/build Bulk hauler on the far bank or take the original Forklift over the causeway with six green pieces and a charged spare. | Bring a living camp tree to the far-island grove through the restored causeway. |

## Verification

`opening`, `meadow-campaign`, `sunstone-campaign`, `open-sea-campaign`, `roster-missions` and `campaign-content` demonstrate all 36 canonical mains and bonuses through public movement, work, construction, dismantling, battery replacement and elapsed time. They do not edit charge, enemy health, terrain, supplies or completion state to solve a mission. A fresh replay must retain the authored board and resources.

Focused objective tests reject the wrong species, replacement copies of original rescue targets, insufficient remaining charge, missing carried trees, ground shipments and uncharged cargo batteries. Blueprint tests cover collection, delayed discovery, consumption and replay isolation. Map tests preserve the ordered 36 IDs and saved awards. Simulation solutions establish solvability; they do not establish that the campaign is fun. Difficulty and pacing need human playtesting across all three worlds.

The October 4 Island Handoffs revision replaces its two rectangular banks and adjacent-tree bonus with a crescent, two landing sites and a separate garden island. The near landing lets shipping and gate clearing overlap; the longer boat route saves the Dozer conversion. The bonus preserves the vehicle battery through two further transformations, and the garden blueprint requires exploration after the main. Public-command play covers both landing choices through the bonus without changing terrain, resources or power directly. It also verifies that the garden remains disconnected after only one fill and that the unused Dozer plan and rock gate survive the northern approach. Native play and visual inspection of this revision are still pending; the browser preview was on a connection-error page during verification.

The October 4 Reef Courier revision replaces another two-bank ferry errand with an enclosed lagoon, a rough reef and an inner-shore rescue. The finite construction chain is Tugboat → Freighter → Dozer, with ground plans discovered through exploration and the second plan hidden until the main. Public-command solutions cover upgrades at camp and inside the lagoon, preserved charge through both conversions, whirlpool round trips and delivery of the bonus kit through the whirlpool, and Snail’s blocked exit before the second push and before Dozer moves aside. The bonus requires the original Snail, not a new model assembled beside the star. This revision also awaits native play and visual inspection while browser access is blocked.

The October 4 Marina Relay revision separates the inner rescue berth from the Shark’s outer waters, with an open strait and northern passage around the central islands. A single yellow piece links the main’s charging structure to the bonus’s defender: recharge the rescued ship before dismantling the only Marina and turning its kit into Patrol boat. Public-command play covers both charger-first and battery-first rescues, the missing yellow piece while Marina remains intact, finite construction stock, and automatic combat followed by the beacon arrival. Supplies, power and enemy health are not edited to make either solution pass. Native interaction, presentation and pacing are still unverified because the browser preview remains blocked.

The reference [play notes](references/play-notes-2026-09-28.md) separate directly observed controls from recollection. These layouts, recipes, units and objectives are original. Earlier expansion screenshots and finish reviews describe the previous campaign and are historical evidence, not visual approval of this redesign.
