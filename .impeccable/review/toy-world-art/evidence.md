# Toy-world sprite production evidence

The approved source is `.impeccable/mocks/toy-world-study.png`. The user approved it with “Yeah I like this this looks a lot better,” and the parent assigned production assets in that direction. The source JSON's earlier `approved: false` field predates this approval. Both native generations used the built-in imagegen tool, the approved study as an image reference, and `transparent_background: true`.

## Shipping assets

`public/art/toy-world/manifest.json` carries the complete produce/direct/semantic handoff, per-image bounds, exact origin, native source bounds, normalization details, limitations, execution order, blockers and assumptions. Each PNG has the exact generation prompt embedded with `embed-prompt.mjs`; each also has a JSON prompt/provenance sidecar.

Every individual texture is 384×384 with contact edge y=338 and origin `(0.5, 0.8802083333333334)`. The four unit views share horizontal center x=192 and equal apparent width within their kind: Scout 276px, Hauler/Warden/Bristleback 300px. Trees, flag, and relay center their lower physical base at x=192. Loose parts center their subject bounds. All sprites have transparent margins.

Unit filenames are `{scout,hauler,warden,bristleback}-{se,sw,nw,ne}.png`. `units.png` is a uniform 1536×1536 sheet with 384×384 cells. Its rows are Scout, Hauler, Warden, Bristleback; columns are southeast, southwest, northwest, northeast. Southeast and southwest show fronts; northwest and northeast show rears.

Object filenames are `tree.png`, `rocks.png`, `flag.png`, `alloy.png`, `core.png`, `battery.png`, `relay.png`, `connector.png`, and `tree-small.png`. `objects.png` is a uniform 1152×1152 sheet with 384×384 cells. Its rows are tree/rocks/flag, alloy/core/battery, relay/connector/tree-small.

## Preparation

The built-in tool returned two native 1254×1254 transparent sheets, despite prompts asking for 2048×2048. The native sources are saved under `sources/` with embedded prompts. Every subject forms one confident alpha island: 16 units and 9 objects. The preparation script retains original RGBA pixels within two pixels of these subject islands, discards tiny detached generation specks, crops exact bounds, scales with ImageMagick Lanczos interpolation, pads, and repacks. It never paints or invents pixels. Native crops and the reproducible script stay in this review folder.

No application, core, UI, or GameScene code was edited. The parent's `terrain-surfaces.png` and sidecar were preserved. The parent owns terrain projection, raised coast geometry, ground shadows, separately attached cargo, motion and interface composition.

## Visual inspection

I loaded the approved study, both generated sheets, both normalized full sheets against an ink-blue field, every unit view at 80px full-cell game size, all objects at 80px full-cell game size, and the four southeast unit views at 256px full-cell roster size. The unit sheet presents clear lime, orange, cobalt and red silhouettes in all directions. Eye panels read in front views, rear views expose the appropriate backs, the Scout retains its rear battery, and every Hauler bed is visibly empty. The Warden's broad molded armor and shield-like front remain in the approved toy vocabulary. The Bristleback has the distinct ridged shell and articulated animal silhouette. No subject is clipped or overlapped; dark tire and joint shading remains intrinsic to the objects. There is no text, visible grid, scenery, floor, card frame or cast/contact shadow baked into the assets, and the detached edge specks seen in the native output have been removed.

The object sheet shows rounded lime leaf panels and brown trunks, three chunky gray rocks, a yellow flag on a compact dark base, the three colored curved connectors, a violet cartridge with cyan socket, a blue battery, a blue-footed yellow relay, one yellow cargo connector and the smaller tree. All nine are identifiable at small game size and have enough detail for larger pictures. The flag's physical base and the tree trunks sit at the common anchor after normalization.

Inspection previews: `units-over-ink.png`, `objects-over-ink.png`, `units-game-size.png`, `objects-game-size.png`, `roster-size.png`.

The metadata scan passed: 28 public rasters, zero missing embedded prompts, including the parent's terrain sheet. `manifest.json` marks the produced sprites and atlases `accepted`; gameplay composition remains for the parent to review in the browser.

## Limitations

The padded sheets have greater dimensions than the native source; resizing does not add generated detail. This is adequate for the assigned approximately 80px gameplay cells and 256px roster cells. The direction views are individual renders and have small differences in panels, joints and ridge counts; they are not guaranteed rotations of a rigid 3D mesh. The red six-legged creature's identity and silhouette remain consistent with the reference.

No blockers remain. No new art-direction tournament was performed.
