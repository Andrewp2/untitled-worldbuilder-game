# Lower ground — September 30, 2026

The user requested ground closer to water. The presentation gap is reduced from 22 to 10 world pixels. `WATER_DROP` in `src/view/art.ts` now supplies the coast depth, lower water plane, bridge shadows/post feet and the ripples in both scenes. Bridge decks retain their 4px thickness and visible water beneath. Ground/grid coordinates, prop contact, traversal and mission rules are unchanged.

Opened and inspected native in-app [world map](map.png) and [Bramble Crossing](mission.png) captures. Coast faces are shallower, the broad deck meets both banks, and its posts no longer reach down to the previous level. The thin coast band still distinguishes land from water. An initial preview connection stalled; a fresh visible preview restored capture. The updated game tab is retained.

`npm run build`: passed. No new tests were added for this low-impact visual adjustment. Existing historical verification remains historical; no whole-game or mobile certification is implied. Active design/prototype notes and the JSON sidecar now record 10px, preserving the previous evidence.
