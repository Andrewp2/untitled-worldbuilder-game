# September 30 desktop feedback corrections

Baseline: `baseline-review.md` (disposition fix) opened all three supplied user screenshots and `baseline-desktop.jpg` at 1455×901. This packet scores that review's eight material fixes, not the whole game. Current direction: `.impeccable/user-feedback-brief.md`; latest user answer left terrain preference uncertain, so flat terrain is a trial. Desktop is the explicitly requested device scope.

## Source and mechanics

- `src/view/toy-models.ts`: exact shared orthographic camera, code-authored rover/rock/colored-piece models, common origin, bounded rock support hull and camera-derived cargo anchors. Render once, dispose the 3D renderer, reuse Phaser canvases. Cropped HUD thumbnails frame the object without changing world anchors. No original reference code/art used.
- `catalog.ts`, `simulation.ts`, three authored missions: distinct red/blue/yellow/green recipes, ground/cargo supplies, construction, bonus checks, dismantling and wrecks. No saved inventory migration: only campaign mission progress persists. Scoop order preview/local transfer reject cargo atomically; Dig/Fill own its bucket.
- `main.ts`, `style.css`: full desktop board, compact bottom controls, contextual build drawer/costs, small mission/menu/camera groups, hover-only map names. Native labels and optional help retained. Scoop shows Move/Dig/Fill only. Music preference logic unchanged (off by default).
- `art.ts`: quiet color planes, water 22px lower, land/bridge sides both 22px; corrected part badge icons. `WorldMapScene.ts`/`world-residents.ts`: no boats spawned for current missions.

## Verified

`npm test`: 15 files, 106 tests passed. Includes actual Three-camera/grid projection, planted wheel planes at four headings, whole rock support hull, color substitution rejection, colored conservation through cargo/construction/recovery, dead battery rebuilds, Scoop API rejection without losing terrain orders, all mission goals, optional delivery colors, terrain crossing, combat and reward/campaign handoff. The full suite is justified by the changed shared resource schema; focused tests ran first.

`npm run build`: success. Vite still reports the existing large-bundle warning; adding Three makes the main bundle about 548KB gzip. Startup performance was not benchmarked.

One scoped detector ran. It flagged a selected blueprint underline, which was replaced with an outline. Advisory palette/type/radius differences reflect the newly approved scope and require documentation reconciliation; no second detector ran. Raster provenance scan: 34 PNG files, zero missing. Generated reference PNGs are retained; active models/terrain are runtime code art, with source as their provenance.

## Native browser and captures

The initial browser was hidden: screenshot/click commands stalled and open reported queued. User brought this chat/preview into view; replacement game tab 6 responded. Original Worldbuilder tab 2 preserved. Native screenshot bytes saved as JPEG and decoded to validate dimensions. No standalone browser used.

1455×901: `scoop-desktop.jpg`, `blueprints-desktop.jpg`, `hollow-desktop.jpg`, `map-desktop.jpg`, `parts-hover.jpg`, `hauler-loaded.jpg`, `scoop-loaded.jpg`, and four stationary endpoint files for each of Scoop and Scout (`*-se/ne/nw/sw.jpg`) at 200% game zoom. Initial Scout attempt clicked Scoop's silhouette; those four files were overwritten with verified Scout endpoints on separate clear land. Native DOM confirmed Scout selected. Native DOM also confirmed Hauler cargo 1 red + 1 blue + 2 green, and loaded Scoop has Fill enabled/Dig disabled without Pickup/Drop.

1920×1080: `map-large.jpg`, `scoop-large.jpg`. Close land/bridge joins: `bridge-close.jpg`. Root opened native rendered pixels at desktop, close model states, bucket, recipe and world map. Reviewer must open current files at their recorded native dimensions. `map-first.jpg` is a discarded narrow 480×1292 capture; `scoop-first.jpg` is the first overly lit model pass. Neither supports the final verdict.

Native playback exercised orthogonal moves, selection, Dig/Fill, colored pickup, blueprint costs, and map/mission transitions. Simulation tests establish the complete crossing/delivery/recovery loop. This pass does not re-certify audible sound, the whole campaign's balance, startup performance, or historical mobile layouts.
