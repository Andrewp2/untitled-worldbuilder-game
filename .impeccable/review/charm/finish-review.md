disposition: fix

No separate QUALITY BAR card was supplied; the explicit bar in `.impeccable/toy-world-brief.md` governs this pass. Larger source files were sampled at their charm, event, rendering, and navigation paths; unrelated gameplay and design-discussion sections were not reviewed.

## persistence

Fail on the immediate-save behavior in material fix 1. The durable direction artifacts pass: PRODUCT.md exists; DESIGN.md records the current motion, bonus rules, residents, reduced-motion handling, native pin treatment, and intentional new palette values. The approved study has an explicit approval record and material/silhouette scope. The opening body contract corroborates the user pin and seed `d9955f0d`. The new freighter is a real RGBA raster, visibly present in the earned maps, with its exact prompt embedded and preserved in its JSON/text provenance. This code-led extension has no hero-reproduction or layout-comp obligation.

Exact scope: the charm extension to the existing approved toy world, including step-driven body/cargo motion and ground contact, mission flag cloth, rising goal rewards, optional deliveries and earned stars, resident patrols/freighters, native map pins/shadows, pause/reduced motion, and reward/navigation boundaries. All thirteen named captures were re-opened: desktop 1280×720, corrected mobile 390×760, user 1234×901, desktop/mobile mission, original reference map, moving Scout, two actual rising-star heights, settled completion dialog, initial questions, one completed mission, and pause. They exist, have plausible dimensions, and show their named states; the corrected mobile evidence passes. The original map's emulator frame is reference evidence, not a shipping viewport defect.

The reported build and 45 focused tests were reviewed as supplied evidence, not rerun. Reduced motion is supported by source and pure tests, without an emulated capture; audio is event-wired, without a listening claim; Bramble's delivery has simulation evidence, without a browser combat replay. This review does not approve every game mechanic, balance, or previously shipped surface.

## fidelity

Faithful for the reviewed visual extension. The study's salient materials are broad toy-plastic highlights, rubber wheels, large fitted colored panels, readable eyes, rounded leaf crowns, chunky stones, cyan water, raised green coasts, and a deep blue frame. Those remain the implemented world. The study and original map are material/reference inputs, not composition specifications.

- TYPE: match to OWN-WORLD. Rounded, sturdy Nunito Sans lettering, short labels, and clear heading/control scale preserve the incumbent voice. Native SVG action/status symbols remain consistent; the question mark is an authored icon.
- MATERIAL: match to OWN-WORLD. The focal terrain, machines, trees, stones, and new boat are actual raster material. The orange/cobalt freighter belongs to the same fitted glossy world. Simple vector stars and native pin geometry serve status rather than imitate physical illustration.
- THESIS: kept. Movement now has role-weighted hops and rocking; the Scout motion capture retains a grounded footprint/shadow rather than an idle floating pose.
- OWN-WORLD: kept. Original character silhouettes, saturated palette, raised coast geometry, and sparse blue/yellow controls remain intact.
- STORY: visually kept, with the persistence boundary below unresolved. Initial, partially earned, and fully earned maps distinguish questions, flags, and a bonus star; residents accumulate with completion. Optional delivery pads remain separate from required flags.
- FIRST-VIEWPORT: kept. The island leads at all three map sizes, with names and progress legible and hit areas fixed. The mobile mission retains the board and compact pictured controls. The memorable first view is a bright toy island with earned machines and boats.
- FORM: kept. The user pin explicitly overrides seed `d9955f0d`; this is a code-led motion extension using existing geometry and shared sprites. The two star captures show real successive heights before the actual dialog. Immediate completion persistence is contradicted by material fix 1; native keyboard behavior is regressed by material fix 2.

## ceiling

Reached for the scoped visual motion: distinct step heights convey machine weight; carried pictures follow the body; shadows stay on the terrain; cloth moves around planted masts; questions bob over separate contact shadows; earned patrols and water-bound freighters populate the map; one short rising-star beat precedes the completion choices. Pause freezes the captured mission pose, and reduced motion retains the outcome with decorative travel removed. No additional visual device is required for this extension. The detector's single warning describes the existing triangular pin pointer, not a thick card accent; its palette/type/radius advisories do not establish a visible craft defect. No new floor violation appears in the reviewed captures.

## material_fixes

1. [P1 — Persistence/Truth] Save final completion and any newly earned post-completion bonus synchronously with the goal/bonus event, before reward rendering can be followed by navigation: `src/view/GameScene.ts:421` starts the visible reward, but `src/view/GameScene.ts:460` delays `bridge.state` until the 100ms HUD timer, while `src/main.ts:267` saves only from that state and `src/main.ts:342` can clear the mission and sleep the scene first. A player can see the earned star, return to World map before the next HUD emission, and lose that progress. Verify immediate reward-to-map navigation and immediate post-win bonus-to-map navigation without advancing the HUD timer.
2. [P2 — Native interaction/Floor] Preserve Space activation for focused native buttons before applying the celebration shortcut: `src/view/GameScene.ts:71` prevents the default and skips the reward before the existing HTMLButtonElement exclusion at line 76, so Space on the focused World map or another native button is swallowed during the reward. Limit the Space skip to the game input surface or honor the button exclusion first; verify both canvas Space-to-skip and focused-button Space activation during the reward.

## keep

Preserve the approved original glossy toy art, planted idle bodies and shadows, role-weighted step motion, fixed pin hit areas, sparse native controls, actual earned status, independent real-time movement/combat, and music off at startup while fixing the two event boundaries.
