# Water under bridges — September 30, 2026

The user expected water beneath raised bridges. Previously bridge cells had no lower water tile and their wooden sides extended the full 22px to the river surface. The shared terrain renderer now draws water and a subtle deck shadow beneath every bridge cell, uses 4px deck edges and narrow posts, and keeps 22px land faces at bridge abutments. Water ripples sort above the water plane but below banks, decks and posts. Traversability, terrain state and walking height are unchanged.

Native in-app captures were opened and inspected: [before](before.png), [world map](map.png), [Hollow Reach narrow crossings](hollow.png), and [Bramble Crossing wide deck](wide.png). Water visibly continues beneath each deck; support posts are readable; bank joins remain solid. The wide deck remains continuous across neighboring bridge cells. The final browser error log was empty. Browser visibility had to be restored after initial capture timeouts. The resulting game tab is retained; the stale duplicate preview is removed.

`npm run build`: passed (TypeScript and Vite). The existing bundle-size warning remains. No new tests were added for this cosmetic rendering change; native visual checks cover the changed surface. This does not claim a full gameplay, mobile, audio or performance audit.

DESIGN, prototype notes, active surface briefs and the design sidecar now describe the thin raised decks and visible water, superseding the earlier full-height bridge-side correction. Historical evidence is preserved.
