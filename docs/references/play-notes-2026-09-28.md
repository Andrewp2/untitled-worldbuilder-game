# Original World Builder: firsthand play notes

September 28, 2026. Played the original through the [DirPlayer browser emulator](https://dirplayer.com/worldbuilder), using mouse clicks, pointer movement, and the Space key. These notes describe actions actually performed and visible results. They do not imply a full playthrough or verification against the original Shockwave runtime.

## Missions played

- **World One, Mission 1: Tutorial.** Completed the main goal, then continued into the optional bonus phase to experiment with the two models. Did not complete the bonus.
- **World One, Mission 2: Buggy Ride.** Completed both the main and bonus goals.
- **World One, Mission 3: Build a Dirtbuggy.** Collected the dirtbuggy plan and tried construction near the distant supplies. Did not complete the mission.

## Tutorial sequence

1. Used the edge scroll buttons to reveal the goal. Hovering the exclamation mark identified a buggy as the required model.
2. Selected the duck and clicked a plan lying on the map. The duck traveled to it and the buggy plan appeared in the bottom tray.
3. Selected the buggy plan. The recipe showed one battery, ten red bricks, and four tires.
4. Clicked an empty location beside the loose supplies. A buggy appeared and became selected.
5. Clicked Take Apart. The buggy became loose parts at its position.
6. Selected the plan again and built a replacement buggy beside those parts.
7. Opened the model's Info panel. It described the buggy as fast, limited to normal terrain, and able to carry three bricks with Pick Up and Drop Off actions.
8. Drove beside the blue bricks, selected Pick Up, then clicked the pile. Blue cargo appeared on the buggy and the action changed to Drop Off.
9. Clicked another map destination to move the loaded buggy. Selected Drop Off and clicked a neighboring target. The blue bricks appeared on the ground.
10. Sent the buggy to the exclamation-mark goal. The game displayed Goal Complete, with options to end the mission or pursue its bonus.

## Movement after switching selection

After finishing the guided tutorial, selected the duck and sent it left across several clear tiles. Immediately selected the stationary buggy. A first observation showed the duck partway across the route while the sidebar and overhead arrow identified the buggy as selected. A later observation showed the duck at the destination, with the buggy still selected.

**Result:** selecting another model did not cancel the duck's travel. This establishes overlapping individual movement orders in this situation. It does not establish group commands, queued routes, or autonomous combat.

## Action mode and keyboard shortcut

With the buggy selected beside yellow bricks, pressed Space. Directional action markers appeared around it, with a permitted target toward the pile and crosses in unavailable directions. Clicking the pile loaded cargo; the sidebar subsequently offered Drop Off.

The tutorial also demonstrated returning to ordinary destination movement after a successful pickup. A click on the map moved the loaded buggy without first clicking the Move button.

The tested cargo actions were performed from adjacent positions. Distant targeting was not tested in this session. The user later clarified that a distant drop-off target makes the buggy drive beside it and attempt the drop-off; see the clarification below.

## Navigation, camera, and campaign

In Buggy Ride, selected the starting buggy and clicked the main goal on the other side of a tree arrangement. The buggy reached it without intermediate movement clicks. After choosing to pursue the bonus, clicked the bonus location; that goal also completed without intermediate orders. This demonstrates route-finding on that layout, not every blocked-route case.

The viewport has edge arrows for stepwise scrolling. Selection and movement also caused camera shifts, which changed the on-screen positions of targets. Exact camera rules were not measured.

Completing the tutorial revealed two question-mark mission locations on the campaign map and replaced the tutorial marker with a flag. Completing Buggy Ride's bonus produced a flag with a star. Returning to the campaign did not carry the tutorial's duck, cargo, or map into the next mission.

## Mission 3: unfinished construction experiment

Started with an ordinary buggy on a board containing rocky tiles. Moved it over the dirtbuggy plan, then selected that plan from the tray. Its recipe showed one battery, four tires, and ten yellow bricks.

Tried placing the new model near a parts pile across the map, with the starting buggy still away from that pile. Some pointer positions displayed a green check in the construction preview, but the attempted clicks did not produce a visibly built dirtbuggy. The cause was not established: placement interpretation, input coordinates, or emulation behavior still need checking. Do not infer a builder-proximity requirement or a game bug from this attempt.

## Subsequent user recollection: combat

This account came from the user's memory after the play session; it was not observed during the missions above.

- There is no attack button. Moving a combat model next to an enemy causes automatic attacks.
- Enemies wander in an apparently random way until a friendly unit enters a detection range, then chase that unit directly.
- Exact detection distance, attack timing, adjacency rules, target choice, and conditions for ending pursuit were not specified.

## Remaining firsthand work

- Verify construction outside the guided tutorial, including the exact supply neighborhood and terrain restrictions.
- Test unreachable destinations, interrupted routes, and replacement movement orders.
- Check distant ability targets and whether actions persist after selection changes.
- Play combat missions to check the remembered automatic-attack behavior and examine timing, enemy detection and pursuit, energy loss, and dismantled units.
- Reach a larger ocean encounter before specifying the late-game control experience.

## Later clarification from the user

The user clarified these reference mechanics after playing the prototype:

- With a loaded buggy selected, Space followed by a distant target orders it to drive beside that tile and attempt to drop its cargo.
- Every movable unit requires a battery. Movement and actions drain charge. An empty battery can still be used for construction, but the unit cannot move under its own power.
- Blueprint construction uses the complete 3×3 area around the site, including diagonal tiles.

These are user-provided reference facts, not additional firsthand observations from the initial emulator session. Exact capacities, costs, and recovery behavior remain unverified in that reference session.
