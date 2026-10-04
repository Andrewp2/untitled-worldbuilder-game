/** Optional nudges first, concrete advice second. Bonus hints stay hidden until unlocked. */
export type MissionHints = { main: readonly [string, string]; bonus: readonly [string, string] };
export const missionHints: Record<string, MissionHints> = {
  'hollow-reach': {
    main: ['The blue picture on the ground is a plan. A creature can collect it by walking onto it.', 'Move Duck onto the Scout plan. Choose Scout in the toolbox and build beside the loose kit; then drive to Shore.'],
    bonus: ['The nest is in shallow water. Compare the terrain that each creature can enter.', 'Select the original Duck and send it to the nest. Scout can stay on land.'],
  },
  'parts-and-paths': {
    main: ['Scout cannot cross the rocky neck. Look for a model that can.', 'Collect the Trailbuggy plan beside Scout, then build beside its kit and cross the ridge.'],
    bonus: ['Scout needs an ordinary ground route. Look at the lower rock gate from the far side.', 'Collect the far-side Dozer plan, build there and push the gate rock west twice. Move Dozer clear before bringing Scout through.'],
  },
  'siltwater-reach': {
    main: ['Snail needs land, but there is only one water tile between the banks.', 'Use Scoop to dig a spare shore tile, then fill the narrow channel. Keep Scoop out of Snail’s route.'],
    bonus: ['A crossing that helped Snail can block Fish. The two creatures need opposite things from the channel.', 'Collect Fish’s plan, take Snail apart beside the eastern blue piece and build Fish in the channel. Scoop must dig the crossing back out.'],
  },
  'stone-gate': {
    main: ['There are two tool plans and one powered kit. Look for both a route through the wall and a route around it.', 'Dozer can push the gate rock east twice. Alternatively, Scoop can borrow two shore tiles to make a lower crossing.'],
    bonus: ['The garden needs a living tree, and Arborbot needs a land route to the islet.', 'Collect Arborbot’s plan. Use Scoop to fill the southern gap, then reclaim its kit beside the green pieces for Arborbot. Lift a wall tree and carry it to the star.'],
  },
  'woodland-workshop': {
    main: ['Compare the Trailbuggy recipe with the loose kit. The missing parts may already belong to a creature.', 'Collect the plan with Duck, then take Duck apart beside the red, blue and tire kit. Its yellow piece and battery complete Trailbuggy.'],
    bonus: ['Duck cannot swim through deep water. Construction can reach places that movement cannot.', 'Collect Duck’s plan, then take Trailbuggy apart at the southeast edge of the headland. Build Duck directly on the shallow star using the diagonal of its 3×3 area.'],
  },
  'split-kit': {
    main: ['The inaccessible pieces do not have to be picked up if a build site can reach them.', 'Carry the yellow pieces and battery around the crescent. Drop them near the island kit, then use a diagonal 3×3 build site to assemble Forklift.'],
    bonus: ['A new job may need the same kit in a different shape. The grove gate itself is a living tree.', 'Collect Arborbot’s plan and bring the green pieces beside Forklift. Recycle Forklift into Arborbot, then lift the gate tree and carry it into the grove.'],
  },
  'flat-battery': {
    main: ['The stranded Scout has everything except power. There is one working battery elsewhere on the island.', 'Bring Hauler beside the original Scout and take Hauler apart. Select Scout and replace its empty battery, then guide it home.'],
    bonus: ['Scout’s remaining charge can power a fighter. Look at the red and blue parts near home.', 'Collect Warden’s plan, then dismantle Scout beside the kit. Build Warden, defeat Crab and reach the bay star.'],
  },
  'switchback-stations': {
    main: ['A station can serve more than one vehicle. Compare the coastal route with the blocked shortcut before placing it.', 'Build the camp station east of its kit, beside the empty Dozer. Recharge Hauler for the northern coast, or use Dozer to push the shortcut rock east once and park clear.'],
    bonus: ['Scout needs power before it can make room for the gate rock. A station can be built inside the enclosure from outside.', 'Collect the second station plan. Build on the clear tile east of Scout using the diagonal eastern kit. Charge Scout and move it down inside the grove; Dozer can then push the gate rock east once. Park Dozer clear and bring Scout home.'],
  },
  'bramble-crossing': {
    main: ['The camp has a combat plan and a separate powered kit. Unarmed couriers cannot fight the Bristleback.', 'Collect Warden’s plan, build beside the kit and move close to the Bristleback. Fighting is automatic; after it falls, send a creature to East.'],
    bonus: ['Arborbot needs yellow and green as well as red. Scout contains some of those parts.', 'Collect Arborbot’s plan. Take Scout apart beside the camp red and green pieces, build Arborbot, then carry an eastern tree to the star.'],
  },
  'forked-watch': {
    main: ['Watch the patrol circuit: there are two crossings, and Scout is faster than the guards.', 'Draw a patrol toward Scout and take Hauler over the other bridge, or build the two Sentry towers at the crossings. Reach Watch with Hauler.'],
    bonus: ['The inlet needs a water creature. A tower kit can have a second use.', 'Collect Duck’s plan near Watch. Use an unspent Sentry kit or dismantle a tower for Duck, then paddle to the inlet.'],
  },
  'orchard-convoy': {
    main: ['The tree and boulder need different workers. Keep the narrow causeway clear for each one.', 'Lift the gate tree with Arborbot. Push the boulder along the causeway until Dozer can go around it, then bring the loaded Bulk hauler to Orchard.'],
    bonus: ['The original Arborbot must bring a living tree, not arrive empty.', 'Lift an eastern orchard tree and carry it around the rock outcrop to the southern grove.'],
  },
  'meadow-siege': {
    main: ['Snail needs a safe crossing. Prepare the workers and defenders before sending it into the far bank.', 'Lift the river-edge tree and fill three crossing tiles with Scoop. Advance both Wardens together, refill them beside the workshop and clear every enemy before escorting Snail.'],
    bonus: ['The river star needs an amphibian. There is still a small reserve at camp.', 'Collect Frog’s plan near Haven. Ferry a green piece and the reserve battery to the far river shore, build Frog beside the water and send it to the star.'],
  },
  'rough-ridge': {
    main: ['The rocky saddle separates walkers from rough-terrain vehicles. Scout already contains part of the next vehicle’s recipe.', 'Collect Trailbuggy’s plan and take Scout apart beside the red and blue kit. Build Trailbuggy and cross to Lookout; the land Crab cannot follow over rough ground.'],
    bonus: ['Snail cannot use Trailbuggy’s route. The lower channel offers another crossing.', 'Build Scoop and make a low land crossing. Use Warden to clear the Crab before guiding the original Snail across.'],
  },
  'ridge-post': {
    main: ['The fighter cannot cross the ridge, but its parts can.', 'Use Trailbuggy to carry Warden’s kit across in two loads. Assemble Warden on the eastern sand, defeat Crab and reach Post.'],
    bonus: ['The fight leaves useful parts. Compare those with Warden’s kit and the tires stored at Post.', 'Combine Crab’s red salvage and battery with Warden’s recovered blue parts and the four tires. Build Hauler on the far bank for the southern star.'],
  },
  'mudline': {
    main: ['The shortest route may be the most expensive. Swamp costs three charge per step.', 'Give Hauler waypoints along the northern dry bank, avoiding the central bog. Reach the flag beside the far Charging station.'],
    bonus: ['The pool excludes wheels. Save enough power for the journey back to the green pieces.', 'Recharge Hauler, return by the dry route and take it apart beside a green piece. Build Frog with the recovered battery and hop to the bog pool.'],
  },
  'boulder-courtyard': {
    main: ['Check where each rock would land. Snail may need to move inside the bay before the gate can open.', 'Move Snail down within the bay. Push the outside rock north, then the inner rock west twice. Keep the vacated tiles clear.'],
    bonus: ['The high court needs a rough-terrain vehicle. Two finished machines contain its ingredients.', 'Collect Trailbuggy’s plan, then dismantle Dozer and Hauler beside each other. Their yellow and blue parts complete the vehicle for the rocky court.'],
  },
  'repair-column': {
    main: ['Warden’s power is also its health. Mender can help during a fight, but spends its own charge to do so.', 'Recharge Warden before the first encounter and keep Mender beside it through both Scorpion fights. Use recovered batteries when support runs low.'],
    bonus: ['The original Mender needs to survive the trip. The battlefield contains fresh power.', 'Replace Mender’s battery from Scorpion salvage, then use its rough-terrain access to reach the northern overlook.'],
  },
  'ancient-valley': {
    main: ['The valley has stronger predators than a lone Warden can comfortably handle. Use the support at camp.', 'Keep Mender next to Warden and restore both at the workshop between encounters. Sentry can help hold a neighboring tile; collect fresh enemy batteries as needed.'],
    bonus: ['The two predator species leave different colors. Those pieces can become a tree mover.', 'Combine Scorpion’s yellow salvage with Rex’s red, green and charged battery to build Arborbot. Carry a valley tree around the rough ground to the star.'],
  },
  'forward-foundry': {
    main: ['The far Warden is intact but powerless. The ridge courier can transport a source of continuing power.', 'Ferry the Bot workshop kit across in two Trailbuggy loads. Build it beside the original Warden and recharge before each fight.'],
    bonus: ['Frog cannot walk over the ridge surrounding the oasis. Its build area can reach diagonally from that ridge.', 'Carry the green piece and battery onto the rocky bank. Build Frog directly in the oasis from a neighboring 3×3 site.'],
  },
  'canyon-rescue': {
    main: ['Snail cannot take the rough upper route. The lower channel can be worked from both sides.', 'Build a second Scoop from the far-bank kit and join the banks from both shores. Keep Warden beside Mender while clearing Crab, then guide the original Snail west.'],
    bonus: ['The far Scoop has finished its job. Its pieces can be reused for the upper route.', 'Collect Trailbuggy’s plan, dismantle the far Scoop and build Trailbuggy from its kit. Cross the rocky upper ridge to the star.'],
  },
  'salvage-chain': {
    main: ['The gate needs a Dozer, but camp has no loose yellow pieces. Look at what the Scorpion leaves behind.', 'Defeat Scorpion, then bring the camp red piece and four tires beside its yellow salvage and charged battery. Build Dozer and push open Snail’s gate.'],
    bonus: ['A tool that opened the gate can now donate power to a water creature.', 'Bring a camp green piece beside Dozer before taking it apart. Build Frog with the recovered battery and reach the eastern pool.'],
  },
  'two-fronts': {
    main: ['The defenders cannot share the same route, but their repair support can cross the rocky divide.', 'Send Mender over the ridge to refill the eastern Warden. Clear each bank’s encounters while keeping support close to the active guard.'],
    bonus: ['The lower causeway has two living gates. Arborbot can carry only one tree at a time.', 'Lift the first gate, replant it off the route, then lift the second. Keep the passage open as Arborbot makes its way to the grove.'],
  },
  'power-bridge': {
    main: ['The far workers need different kinds of power. A bot workshop cannot recharge wheels.', 'Carry the dismantled workshop and spare battery across with Forklift. Rebuild the workshop beside Warden; give Dozer the loose battery. Clear Scorpion and push the northern gate.'],
    bonus: ['The northern return is rough ground. The carrier’s pieces can take a different form.', 'Collect Trailbuggy’s plan and dismantle Forklift beside a clear build site. Its kit supplies Trailbuggy for the northern ridge.'],
  },
  'sunstone-citadel': {
    main: ['A crossing alone is not enough. Establish power near the front before committing the convoy.', 'Open the tree gate and fill three crossing tiles. Move the workshop forward, fight beside repair support and regroup between encounters. Load Bulk hauler with camp blue, recovered green and charged batteries.'],
    bonus: ['The original Arborbot is needed again. The grove has a separate living gate.', 'Lift the grove’s gate tree and carry it through the opening to the sheltered star.'],
  },
  'tidepool-trail': {
    main: ['The original Frog has no power. A boat can bring it a battery from the shore.', 'Protect Tugboat with Patrol boat, collect the shore battery and drop it beside Frog. Replace Frog’s battery and use pale shallows to reach the eastern flag.'],
    bonus: ['The western tidepool is enclosed. A creature can be assembled where it cannot swim in.', 'Return Duck through the shallows and collect Fish’s plan. Take Duck apart beside the blue piece, then build Fish directly in the tidepool using a diagonal site.'],
  },
  'reef-courier': {
    main: ['Tugboat’s small hold cannot carry the whole kit at once. The reef port also has an unusual entrance.', 'Make two deliveries to the eastern launch site, recharging at the camp Marina. Build Freighter in deep water and enter the eastern whirlpool to reach the sealed port.'],
    bonus: ['The garden is inland, beyond a ship’s reach. Carry a land creature’s kit ashore.', 'Ship the western yellow piece and live battery to the eastern island. Build Snail on land and guide it to the garden star.'],
  },
  'deepwater-maze': {
    main: ['Fish needs connected water. Scoop needs somewhere to empty its bucket between digs.', 'Dig the three land plugs, unloading each dirt load into a southern waste pond. Keep Fish’s channel open all the way to Lagoon.'],
    bonus: ['The excavator’s kit can become a different creature. The linked pools offer a shortcut.', 'Collect Duck’s plan and recycle Scoop’s yellow piece and battery. Use the linked whirlpools between the western pool and waste pond to shorten Duck’s journey.'],
  },
  'marina-relay': {
    main: ['The empty Freighter needs a nearby berth. Tugboat must move a kit larger than its hold.', 'Ferry the Marina kit in two loads. Build in shallow water beside Freighter, keeping the delivery pile off the berth’s tile, and let both boats recharge.'],
    bonus: ['Frog cannot cross the deep water around the island. It can be built from the shore.', 'Ship a green piece and battery to the island’s edge. Use diagonal construction to assemble Frog directly on the island.'],
  },
  'harbor-run': {
    main: ['Land and water threats need different defenders. Protect the cargo route before shipping the stores.', 'Build Warden from the eastern kit for Gator; use Patrol boat against the sea predators. Clear every enemy, then reach the berth with the camp stores aboard Freighter.'],
    bonus: ['The quay pond is disconnected from the shipping channel. Enemy salvage can supply its visitor.', 'Bring blue salvage and a live battery to the western shore. Build Fish directly in the sealed pond from a diagonal site.'],
  },
  'wreck-recovery': {
    main: ['The stranded ship needs power that the hostile reef is guarding. Take the weaker fight first.', 'Defeat Reef crab with Patrol boat and recover its battery. Recharge at Marina before Shark, then use Tugboat to bring recovered power to the original Freighter.'],
    bonus: ['A fighter that is no longer needed contains the next creature’s kit.', 'Send Patrol boat into the northern shallows and take it apart. Use its yellow piece and battery to build Duck on the adjacent shore for the nest.'],
  },
  'canal-foundry': {
    main: ['The defender needs to be built beyond the canal barrier. Its parts need a water route first.', 'Dig the two land plugs and unload into the waste ponds. Ferry the Patrol boat kit into the eastern lagoon, build there and defeat Reef crab.'],
    bonus: ['The garden lies on land. The patrol’s finished job leaves a useful kit on the water.', 'Dismantle Patrol boat beside the shore. Its yellow piece and battery build Snail on land for the inland garden.'],
  },
  'gator-backwater': {
    main: ['Gators follow creatures onto land. Let stationary defenses do the fighting before opening Fish’s pool.', 'Build both shore towers and use short Frog retreats to lure Gators beside them. Restore Frog from recovered batteries as needed, then dig the plug and guide Fish to the lagoon.'],
    bonus: ['The original Frog must arrive with at least sixty power. The defeated Gators left a reserve.', 'Replace Frog’s battery with a charged Gator battery, then take a short shallow-water route to the eastern star.'],
  },
  'island-handoffs': {
    main: ['The inland shipment exceeds the small carriers’ holds. Establish the land transport before delivering its load.', 'Ship the separate Bulk hauler kit first and build it ashore. Then ferry the twenty green pieces, transfer them to the hauler and drive inland. Use both charging berths.'],
    bonus: ['The delivered green stock can combine with the land carrier’s own kit.', 'Collect Arborbot’s plan and dismantle Bulk hauler beside its green shipment. Build Arborbot and carry the southern tree to the grove star.'],
  },
  'storm-line': {
    main: ['The two channels have separate defenders, and the southern encounters need more recovery time.', 'Build a Marina beside each patrol. Clear the northern Reef crabs, and recharge the southern patrol between its two Shark fights.'],
    bonus: ['The sheltered pond is cut off from both channels. Its shore is still within building reach.', 'Ferry blue salvage and a live battery to the divider, then construct Fish directly in the pond using a diagonal site.'],
  },
  'last-reserves': {
    main: ['One charged battery must earn the next. Start with the weaker enemy.', 'Use Tugboat to give the starting battery to Patrol boat. Defeat Reef crab, replace the patrol’s battery from its salvage, then fight Shark. Deliver recovered power to the original Freighter.'],
    bonus: ['Frog needs at least fifty power at the star. The restored ship can donate its installed battery.', 'Collect the green pieces with Freighter and sail to the northwest shallows. Take the ship apart beside the shore, build Frog with its used battery and take the short route to the star.'],
  },
  'three-tides': {
    main: ['Opening the dock produces dirt that can repair a second route. The final load can travel by land or sea.', 'Lift the dock tree, push the boulder north twice and dig the two cleared tiles; fill the southern gaps with that dirt. Recover enemy green and power. Ship/build Bulk hauler or use the original Forklift to bring six green pieces and a charged spare inland.'],
    bonus: ['The far grove needs a living tree from camp. Keep the restored causeway usable.', 'Use Arborbot to lift a camp tree, then carry it over the causeway to the eastern grove.'],
  },
};
