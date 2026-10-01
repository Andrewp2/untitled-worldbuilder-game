# Ground contact, drawing order, and quiet startup

User feedback: music should be off by default because muting multiple tabs is tedious; trees, rocks and buggies appear to float; some drawing order is incorrect. The approved toy art and gameplay stay in place.

The fresh scoped review in `initial-review.md` listed four material fixes. The implementation now uses physical support-footprint centers in `src/view/grounding.ts`, separate from source images' lowest-alpha-edge alignment at y338. Soft shadows occupy one ground layer below all upright objects. World depth and picking share footprint-based ordering, with only a tiny equal-position tie-break. Cargo is a child of its carrier, so foreground objects occlude the whole assembly. Tile-space relay, goal, cargo target and range markings use the ground layer; status and inventory counts remain above bodies. Suspension compresses around the footprint instead of lifting the entire body.

Music is deliberately off on every page load/reload, including when older saved data says on. Explicit opt-in applies to the current tab's session; the effects preference remains saved. No saved music-on preference is carried into another tab. This is the chosen scope of the requested default. An unchanged audio icon is no longer replaced during pointerdown, avoiding lost toggle clicks.

After-fix captures inspected by the builder:

| File | State |
| --- | --- |
| desktop.png | 1280×720 Bramble Crossing, paused, three rovers, loaded Hauler behind rocks |
| occlusion.png | 1280×720, 92% camera, loaded Hauler body/cargo occluded together by foreground rocks, all four character kinds visible |
| tree-occlusion.png | Loaded Hauler body/cargo behind foreground trees; paused. Captured before the last audio-icon event fix, with the same visual grounding and mute state. |
| user-748.png | 748×901 intermediate width / last known user width, fresh Bramble camp |
| mobile.png | 390×760, fresh Hollow Reach camp, music remains off after entering a mission |

`before.png` and `contact-before.png` retain the original placement for comparison. Captures use fullPage:false because the native browser's full-page mode fails with viewport overrides. The app is fixed to 100vh; measured page dimensions equal viewport dimensions, so the captures include the whole page. JPEG-to-PNG conversion did not alter the depicted UI. All listed files were opened and visually inspected. Measuring the original user tab timed out; 748 is a prior known width, not a new measurement. A temporary responsive-check tab was used because the browser's viewport capability targets its selected tab.

Browser checks: Hauler picked up three alloy (98 charge), travelled behind the rocks (96 charge), then behind trees (93 charge), with multiple facing changes. Warden construction joined the roster with 100 charge. Pause preserved visible contact. Music starts with aria-pressed=false, remains false after entering a mission, toggles to true and back to false, and returns to false on reload after opt-in. These UI checks plus focused audio tests verify muted gain after activation; no browser audio recording was made. The final temporary-preview warning/error log was empty. Both authored missions and return-to-map transitions loaded successfully.

Verification: production build passes. Eighteen focused audio, picking and grounding checks pass, including small movement steps across object types and choosing the foreground model during overlap. No simulation rules or raster pixels changed. The detector ran once on changed source files and returned three advisory entries for existing white canvas labels and 17px world resource counts; both now have explicit design tokens/notes. No second detector pass was run. README, PRODUCT, DESIGN, prototype notes, sidecar, brief and manifest rendering notes record the revised audio and ground-contact contracts.

Final verdict: **ship**. The same fresh reviewer scored all four listed fixes resolved, with no introduced regression visible in the supplied evidence. The verdict covers those four fixes; see `finish-verdict.md`.
