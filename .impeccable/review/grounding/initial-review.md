disposition: fix

Inputs not supplied: detector/hook findings. Review is scoped to the latest grounding, z-order, and music-default feedback; the supplied study is binding for material and silhouette, not screen layout. All named captures exist and are valid: before/desktop/loaded-hauler 1280×720, mobile 390×760, user-748 748×901. No browser was used.

## persistence

Pass. PRODUCT.md and DESIGN.md describe the shipped toy world and current gameplay. The surface brief, index.html body contract, and approved study sidecar record the accepted material/silhouette scope and the user pin overriding seed d9955f0d. This defect correction does not require a screen-comp reproduction checkpoint. The manifest records the reusable cutouts and identifies its current y338 anchor as the lowest visible contact edge; that measurement must be distinguished from a physical footprint center when the correction is documented.

## fidelity

The study's salient inventory is glossy fitted lime/orange/red toy machines with dark tires or articulated feet, readable eyes, large rounded leaf crowns on dark trunks, chunky faceted stones, cyan water, thick grass/earth islands, sunny sand, a plank crossing, recognizable loose/carryable parts, and a small yellow flag. The shipped mission geometry and native controls are governed by the existing game, per the approval scope.

| Element | Classification | Evidence |
| --- | --- | --- |
| TYPE | Match | Rounded locally bundled Nunito Sans remains consistent with the accepted native UI; this material study supplies no binding UI lettering composition. |
| MATERIAL and role silhouettes | Match | All captures visibly use the approved saturated toy bodies, rounded trees, faceted stones, cyan water, grassy tops, and earthy raised sides. Individual tree, rocks, Scout, and Hauler PNGs contain the required shaded material and transparent cutout. |
| Mission composition and native frame | Acceptable adaptation | The study approval JSON and surface brief explicitly reserve actual handcrafted mission geometry, live camera framing, and sparse native controls. Before.png retains Bramble's two islands and crossing. |
| Ground contact | Contradicted | Before.png and the larger loaded-hauler.png show weak or detached turf contact beneath trunks, stones, and tires. toy-art.ts:19–20 assigns every image the lowest-pixel y338 origin; :33 centers the vehicle shadow at y+5. art.ts:72–75 repeats that origin with prop shadows at y+6. Manifest limitations confirm y338 is an edge, while the raw sprites have wheel/foot and rock contact spread above it. |
| World occlusion and shadow order | Contradicted | The dense hauler/tree/parts group in loaded-hauler.png has ambiguous attachment and overlap. Props and actors are ordered by separate y+2/y+3 biases, and their shadow Graphics live inside each sorted body container (art.ts:72–75; toy-art.ts:31–35,47), allowing a ground shadow to travel above another object's body. |
| Attached cargo | Contradicted | Loaded-hauler.png provides the current cargo fixture. GameScene.ts:413 assigns its separate container p.y+4 while the carrier uses p.y+3, so an intervening foreground object can cover the carrier and leave its cargo visible; a single physical object has two world depths. |
| Ground marks versus status | Contradicted | GameScene.ts:110 puts every marker at depth2000. The selected-relay diamond, pickup/drop target diamonds, goal diamonds/checks, and cargo-range marks therefore paint above physical bodies (:438,:455,:485–500). The rover selection ellipse is already correctly in the ground-level routes Graphics (:470–471); retain that behavior. |
| Music default | Contradicted | Latest explicit user request requires music off by default. GameAudio.ts initializes musicEnabled:true and restores preferences only at construction. The images cannot establish audible playback; the source establishes the current default and absence of cross-tab preference updates. |

## ceiling

The toy world has committed to its native color, silhouette, and raster material devices. Its remaining depth device is physical contact: shadows must belong to the terrain footprint, and foreground objects must occlude an entire actor consistently. The supplied stills cannot verify motion, so movement bob, direction changes, and paused contact remain confirmation cases for these same fixes. No replacement art or changed mission composition is warranted.

## material_fixes

1. Ground Contact / MATERIAL: align each prop and directional actor to its physical footprint center rather than its lowest alpha edge, and place a restrained contact shadow beneath the full wheel, foot, trunk, or rock footprint on a shared ground layer; confirm trees, rocks, and stationary/moving vehicles sit on grass at desktop and mobile scale without changing their approved art.
2. STORY / world depth: use one coherent footprint-based world ordering for props, units, relays, parts, flags, and picking, and keep carried parts inside their carrier's sorted world object; confirm a loaded hauler crossing behind a tree/rock has body and cargo occluded together, with ground shadows remaining beneath every body.
3. Ground Contact / state readability: split ground-space relay, goal, pickup/drop, and range marks from above-body arrows, health/charge, and hazard indicators; confirm the ground marks disappear beneath intervening trees and vehicles while actionable status stays readable. Preserve the existing ground-level rover selection ellipse.
4. Latest user feedback / audio: start unsaved or invalid preferences with music off, preserve a deliberate music opt-in, and apply a deliberate off preference across already-open tabs so repeated manual correction is unnecessary; verify the visible toggle and actual audible behavior after the first interaction and in a second tab.

## keep

Keep the approved saturated toy art, role silhouettes, raised terrain, cyan water, mission geometry, sparse native UI, distinct presentation motion, shared inventory pictures, and existing gameplay.
