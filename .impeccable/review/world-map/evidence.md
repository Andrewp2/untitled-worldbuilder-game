# World map review evidence — 2026-09-29

The first capture attempt failed: existing tab 3 and fresh tab 5 timed out on navigation and basic CDP page inspection. On the user's request to restart the browser, a newly connected control session and fresh tab 6 restored navigation and inspection. No browser-process restart command was available. Current captures live in this directory; older PNG files in the parent review directory are not evidence of the world map.

The local Vite server returned the new World map page. TypeScript and the production build passed. Campaign, rover-goal integration, and audio checks passed: 28 tests across three files. Browser interaction additionally exercised real Scout movement to Ridge and Shore, the completion dialog, return to the map, a completed flag and 1/2 count, persisted completion after reload, selecting Bramble Crossing, and a fresh Hollow Reach replay.

The restored browser exposed a stacking bug: moving the shared canvas to the end of each host covered native map buttons and camera controls. Screen transitions now prepend the canvas, keeping native overlays above it. Mission switching and replay were verified again after this correction; console error logs were empty.

Post-fix interaction also verified **Keep exploring**: it closes the completion dialog, restores the Pause control, and retains 2/2 reached flags. The top-bar map action then returns to 1/2 completed missions. A fresh replay starts at 0/2 with full batteries and gets one completion popup when both flags are reached again.

Final captures (all visually opened and checked): desktop.png 1280×720, mobile.png 390×760, user-1082.png 1082×901, completion-user-1082.png 1082×901, and completion-mobile.png 390×760. Browser JPEG captures were re-encoded as genuine PNG without changing pixels. Use these five files; completed-desktop.png is an earlier extra capture, not part of the final review set.

The detector ran once over src/main.ts, src/style.css, src/view/WorldMapScene.ts, and index.html. It used a degraded regex fallback because parser modules were unavailable. Its one finding was `border-accent-on-rounded`, src/style.css line 38, snippet `border-top:9px solid`. This is the mission pin's triangular pointer pseudo-element, not a rounded card accent; preserve the pointer. Contrast and selector matching were not evaluated by the fallback.

No new shipping raster assets were created; the world reuses original code-drawn terrain and authored SVG markers. The direction contract is the first body comment in index.html and survives the production build.

## Fresh review result

The independent finish reviewer first returned `disposition: recapture` for unavailable rendered evidence, then requested replacement captures after detecting black strips in mobile images and an inaccurate desktop dimension record. Those initial files are not final evidence. A full review of the corrected captures matched the incumbent typography, terrain material, first-viewport composition, progress markers, completion dialog, and navigation. It requested softer marker/label shadows and a single elevation treatment for the dialog. Both corrections were applied together and the same five viewports/states were recaptured.


Final verdict: **disposition: ship**. The reviewer scored both listed visual fixes **resolved** and saw no visible regressions from that batch. This verdict covers those two fixes; it is not a new whole-surface audit. Documentation was refreshed after the final corrections.
