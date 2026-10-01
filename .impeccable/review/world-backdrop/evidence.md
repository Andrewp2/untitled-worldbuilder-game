# World-map ocean backdrop · October 1, 2026

The user asked for surroundings so the world maps no longer float in an empty blue void. The maps now sit in a continuous sea, with smaller wooded islets, rocky headlands or sandy shores around the edges. Main-map water has no raised border. Decorative shores use the existing terrain renderer and prop models, remain below the mission landscape and have no input or mission state. No new production raster assets or dependencies ship.

The background fills and resizes with the camera; mission pin positions, route geometry, progression, saves and earned residents are unchanged. Mission boards explicitly retain bounded water rendering. Background swells are baked on layout changes and move as one layer with the existing clock; hidden/reduced-motion states freeze the clock. World heading/count/navigation ink is darker for the bright sea. Calculated text contrast is approximately 7.69:1 on shallow cyan and 4.74:1 on deep blue; hover/focus icons retain over 3:1 contrast.

## Verification

Forty focused tests passed across world-map, campaign, motion and grounding. New checks cover sea coverage and distant-shore separation from the mission footprint at 700×900, 885×901, 1280×720 and 1920×1080, plus invalid/empty viewport rejection to prevent unbounded layout loops. The scene skips fitting when its host has zero dimensions. Existing tests cover marker spacing, compatible separate residents, order and saved awards. The final release run passed **272 tests in 27 files**. TypeScript and the final Pages-base production build pass. The build's existing large-chunk warning remains.

The detector ran once on the changed scene, backdrop, terrain renderer, mission scene and stylesheet. It returned 14 advisories (nine palette, four type-size, one radius), zero non-advisory findings. New uses of sea/ink colors come from existing colors and are recorded in DESIGN.md. Retained stylesheet and sidecar mismatches were not repaired as a side effect.

## Visual review and limits

Opened the three 885×901 environment studies and the 1280×720 Sunstone study in one batch. They show continuous water beyond the main coast, smaller peripheral scenery, no raised water slab, contained readable markers and unobstructed dark heading text. The layout helpers supply the actual geometry. Existing model meshes were rendered offline with the shared camera and different lighting. Studies use synthetic available markers, system-font diagram labels and omit earned residents. They are **source-derived composition studies, not browser screenshots**. Native text rendering, animation smoothness, hover and world/mission navigation are not claimed.

Reconnected to the same native preview at 5195 and attempted visible DOM inspection. It again timed out on `Emulation.setFocusEmulationEnabled`; no native capture was available. Public progress and the original reference tab were not modified.

- [Meadow environment](meadow-isles.png)
- [Sunstone environment](sunstone-range.png)
- [Open Sea environment](open-sea.png)
- [Sunstone wide layout](sunstone-range-wide.png)
- [Detector findings](detector.json)
