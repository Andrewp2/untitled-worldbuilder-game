# Toy world implementation evidence

Request: give the game the playful look and personality missing from its initial placeholder art. User approved the toy-world study. This is an art direction replacement within the existing original game, preserving real authored levels and mechanics.

Required captures, all inspected by the builder after saving:

| Viewport | Mission | World map |
| --- | --- | --- |
| 1280×720 | desktop.png | world-desktop.png |
| 390×760 | mobile.png | world-mobile.png |
| 748×901 (user width) | user-748.png | world-user-748.png |

Mission desktop shows Bramble Crossing after normal cargo pickup and Warden construction; smaller captures show fresh camp views (mobile Hollow Reach, user Bramble Crossing). World-map captures show two previously completed locations. `loaded-hauler.png` shows all four character roles at 92% zoom with three carried alloy parts. `construction-mode.png` shows the bounded picture and placement controls after fixing an oversized raster icon.

The in-app browser fails fullPage captures with viewport overrides. These captures use fullPage:false from the document top; the app occupies exactly 100vh. DOM checks confirmed scrollHeight equals innerHeight and scrollWidth equals innerWidth, so each image contains the entire app with no omitted page content. JPEG captures were converted to PNG without editing the page content. No entrance animation hides UI. The live enemy can move between captures.

Browser verification: selected the Scout on the canvas, issued a flag destination, selected the Hauler, and later observed 1/2 flags reached by the Scout. In Bramble Crossing, picked up three alloy with the Hauler (HUD 3/4, charge 98) and built a Warden from the 3×3 recipe area (third roster entry, charge 100). Opened both missions and returned to the map. After the resize fix, measured world canvas and host both 1280×664 on desktop and 390×708 on mobile; native pins remained over their island locations. Mission canvas also matched its host at all three sizes. Final browser error/warning log returned [].

Build: npm run build passes. Focused checks: tests/picking.test.ts, tests/orders-energy.test.ts and tests/campaign.test.ts pass (28 tests). The picking coverage includes the taller toy silhouette and outside boundaries. Detector ran once and returned [] (exit 0). Shipping raster provenance scan: 28 PNGs, zero missing prompts.

The generated study is a character/material reference, not an approved screen comp. No pixel fidelity claim is made; existing mission geometry remains authoritative. Core simulation rules were not modified for the art direction.

Full finish review: **fix**, solely for stale current visual documentation. The reviewer found the implementation faithful to the approved art direction, all eight submitted captures valid, and no visible material craft-floor failure. See `finish-review.md`. After the scoped documentation refresh, the same reviewer returned **ship**, scoring its one documentation correction resolved with no regression. See `finish-verdict.md`. This final verdict covers that correction; no visual implementation changes were requested.
