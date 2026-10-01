# Terrain, facing and hover correction

User feedback identified reversed rear-facing movement, persistent loose-part badges, terrain faces covering neighboring tiles, and rocks offset from their highlighted footprint. The user's two screenshots are the primary before evidence.

`src/view/facing.ts` separates projected movement headings from the shipping atlas's reversed rear-view filenames. Every character uses this mapping. `src/view/art.ts` paints each raised tile's faces, top and outline together in diagonal back-to-front order, with water in a lower foundation container. This prevents rear cliffs covering foreground land or bridge tops while retaining the thick island faces. Bridge plank strokes now end at the tile edges. Rocks use the center of the whole support area (192, 288 on the existing 384px picture), rather than an anchor near the foreground stone. Raster pixels and simulation rules are unchanged.

Loose-part badges start hidden and appear only on the hovered pile tile. Panning, keyboard camera movement, zooming, leaving the board, and mission changes clear hover. The duplicate loose-part prose panel has been removed. Battery strips, goal names, charge/selection status and existing construction feedback remain visible.

Final captures:

- `desktop.png`: 1280×720 whole-island mission overview, no loose-part badges.
- `bridges.png`: 1280×720, 190% zoom, both bridge joins with uninterrupted tops and correct cliff overlap.
- `rocks.png`: 1280×720, 190% zoom, foreground rock cluster within its highlighted tile.
- `hover.png`: 1280×720, 190% zoom, one hovered alloy pile with picture/count badge and no duplicate prose.
- `facing-ne.png` and `facing-nw.png`: 1280×720, 190% zoom, actual sequential upper-right then upper-left movement, paused after arrival. Charge 99 then 98 confirms one grid step each. Their rear views face the corresponding destinations.
- `user-1234.png`: 1234×901, current user window size measured from the original tab, whole-island overview. Document width/height match viewport; no page overflow.
- `mobile.png`: 390×760 fresh camp. Document width/height match viewport; native controls and canvas remain visible.

Native screenshots were saved as JPEG and converted to PNG without pixel edits. Root inspected the actual saved or emitted screenshot pixels for every captured state. The fixed-height app is at document top; fullPage:false covers the complete viewport. Temporary viewport override was reset after compact checks.

Verification: production build passes (existing bundle-size advisory remains). Eight focused facing, grounding and picking tests pass. Facing tests compare all projected grid axes and the observed headings of the shipping rear exports. The mechanical detector ran once over changed view files and returned an empty findings array. This is focused rendering/interaction evidence, not exhaustive gameplay or balance validation.

A fresh Impeccable reviewer received the user's primary captures and all final captures. Disposition: **ship**. The reviewer found the four corrections visibly satisfied with no material regression in the required captures. This verdict covers the requested rendering scope only; see `finish-review.md`.
