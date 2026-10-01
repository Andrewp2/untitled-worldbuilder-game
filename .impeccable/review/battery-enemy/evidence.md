# Battery and Bristleback models

Scope: replace the loose battery and enemy illustrations with authored geometry in the existing Three.js-to-Phaser atlas. Preserve the toy identity, shared camera, simulation and presentation motion.

`toy-models.ts` now supplies a blue cylindrical battery with collars, dark cap rings and a terminal, sharing its geometry with the installed rover cells. Bristleback has six bent legs, teal joints, dark feet, a segmented cherry-red shell, three ivory back spines, eyes and a blunt snout. All four headings render from one model using the incumbent facing mapping. Both types use the shared 30-degree camera and planted origin (192,280). Generated battery/enemy files remain provenance references and are no longer preloaded.

Ground and cargo rendering retain charge-preserving behavior, gray empty-cell tint and ground charge strips. Battery hover-count pictures use cropped atlas portraits. HUD battery indicators, costs, cargo and the help legend use the same model portrait. The native review caught a startup defect: blueprint costs and the help legend had retained their initial fallback battery image. The one correction batch refreshes them when `toy-art-ready` fires.

Verification: `npx vitest run tests/model-projection.test.ts tests/facing.test.ts tests/grounding.test.ts` passes **9 checks**. Coverage includes shared ground support, correct grid headings, occlusion/picking, and actual vertex projection within the atlas for the battery and all enemy rotations. The production build passes after the startup correction. Its existing large-bundle advisory remains; startup performance was not benchmarked.

Native desktop captures were saved and loaded for pixel inspection:

- [Bramble mission](mission.jpg): the red enemy and blue construction-kit battery render alongside modeled rovers, trees and rocks; the bottom dock keeps the installed charge gauge.
- [Enemy close view](enemy-close.jpg): segmented red shell, ivory spines, teal leg joints and dark feet are legible. A foreground tree correctly occludes part of the enemy's snout. The mission is paused, so a movement hop can remain held in the captured pose.
- [Battery close view](battery-close.jpg): the spent cell sits behind the Hauler with its empty charge strip; the distant spare is partly outside this framing. The Bramble close view also shows a charged loose blue cell beside the colored kit parts. The new HUD battery portrait was directly verified through the visible DOM.
- `battery-cost.jpg` records the initial cost-picture defect before its correction; it is not proof of final cost imagery. Reloading after the fix again made browser controls time out, so that final startup refresh has build/source verification but no confirmed native capture.

No combat, charge, cargo, recovery, level or motion rules changed. No whole-game balance, audio, mobile or performance review is claimed.
