# Improvement playtest · October 2, 2026

Accepted improvement pass: meaningful route/tool choices, moving hazards and distraction, clearer construction, enemy notice cues and creature personality. The user excluded a retry-bonus checkpoint. Finite plans, physical batteries, main-before-bonus objectives and quiet startup remain.

## Progress this pass

The choices/construction/reactions refinement and pictured objective requirements are implemented. Stone Gate was completed through the visible controls, including construction, rock pushing and the main-to-bonus handoff. The ready ghost and objective pictures were inspected, and action-strip overlap with long bonus descriptions was fixed. See [objective evidence](../.impeccable/review/objective-clarity/evidence.md).

Forked Watch was then played through both main and bonus objectives. Early attempts showed why a direct route and lingering beside predators are costly. Inspection also found that a chasing enemy switched to the nearest unit every step, undermining deliberate distractions. Predators now keep their target until it escapes their pursuit range or disappears; reacquisition does not grant another notice delay. Scout drew both enemies south, Hauler crossed north and skirted the eastern bank, and the main completed with both Sentry blueprints unused. The unlocked Duck plan was collected, Duck was built from the spare kit and reached the inlet. The final bonus popup appeared. See [patrol and motion evidence](../.impeccable/review/patrol-playtest/evidence.md).

Native captures also show Duck entering water, Snail gliding and tucking its head near a Crab in Canyon Rescue, and Frog moving and landing in Gator Backwater. These are bounded appearance checks, not complete playthroughs of the latter two missions. The Duck idle head-look timing was not separately captured.

Later player feedback refined target selection: adjacent powered fighters now take first priority, followed by other powered fighters in detection range. Current chases remain stable among equally threatening targets, preserving unarmed distractions when no defender is nearby. Ten public-simulation checks cover all three fighting roles, battery replacement, defenders protecting carriers, cooldown continuity, range limits, target removal and roster-order independence. This behavior refinement has automated evidence rather than another native playthrough.

## Verification and remaining judgment

- 25 focused tests pass for combat, target retention/reacquisition, patrols and alternative mission plans.
- 50 campaign tests pass, including all 36 scripted main-and-bonus solutions after the targeting change.
- TypeScript and the production build pass. The existing large-bundle advisory remains.
- The accepted improvement pass is complete. Wider human playtesting is still needed to judge pacing, discovery and overall fun; scripted solvability does not settle those questions.

The uncommitted matte-shading trial is preserved separately. Native captures include it while published code retains the prior materials.
