# Tree refinement — September 30, 2026

The user found the retained illustrated trees out of place after the terrain and rover update. Both tree sizes now use authored geometry in `src/view/toy-models.ts`: six broad rounded canopy lobes, softer greens, a warm trunk and four planted roots. They share the same camera, lighting and origin as the rovers. Display size is 96 world pixels, with the small model scaled to 80%. Trees remain blocked cells; terrain, orders and gameplay rules are unchanged. Old generated tree PNGs remain provenance/reference assets and are no longer preloaded.

Native in-app browser captures were opened and inspected: [world map](map.png), [whole mission](mission.png), and [close view beside Scout/Hauler](close.png). Canopies remain rounded without the older leaf detail and heavy shading; trunks contact the centers of their cells. The two scales remain distinct, with board resources and rovers readable. Native browser error log returned empty. Initial screenshot/DOM attempts timed out; a fresh preview and bringing the chat into view restored inspection. The preview tab is retained for the user.

`npm test -- tests/model-projection.test.ts tests/grounding.test.ts`: 6 passed. The tree regression checks both planted bases, shared ground origin and all projected geometry vertices fitting in the atlas. `npm run build`: passed. Existing bundle-size warning remains. No full gameplay, audio, performance or mobile certification is implied.

README, DESIGN, prototype notes and active surface briefs now describe the authored trees. This is a scoped tree refinement; terrain remains a reversible trial awaiting user preference.
