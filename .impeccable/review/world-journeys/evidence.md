# World journeys · October 1, 2026

The user asked to replace the unnatural grid of mission locations. All three world-selection landscapes now have separate authored coastlines, landmarks, pin coordinates and route bends. Meadow follows a crescent lagoon coast and a short bridge; Sunstone follows a rocky valley, coastal inlets, oasis and river crossings; Open Sea follows uneven islands and dotted sea lanes, with a short lagoon bridge. Each retains the same twelve mission IDs in campaign order. Individual missions, save serialization, prerequisite rules and bonus rules are unchanged.

Hidden hover/focus names no longer enlarge or overlap the 42×48px marker buttons. Earned residents have distinct terrain-compatible patrol squares and stay more than one grid step from every pin. Sea-lane dots use the lower water surface. Existing flag/question motion and reduced-motion behavior are retained.

## Verification

The focused world-map, campaign, campaign-content, motion and roster-mission run passed 41 tests in five files. New checks cover every trail's endpoints, neighboring steps and compatible terrain; distinct visible marker areas at 700×900, 885×901, 1280×720 and 1920×1080; and separate resident routes away from mission pins. Existing progression tests cover sequential unlocks, both world gates and saved awards. At the publication checkpoint the full suite passed **267 tests in 27 files**, including existing public-command solutions for all 36 mains and bonuses. The final production build with the GitHub Pages base passed; its existing large-chunk advisory remains.

The initial layout detector found no layout findings. The final supplied detector ran once on the changed world data, scene, resident module and stylesheet: 12 advisories (eight palette, three font-size, one radius), all concerning retained stylesheet literals and stale design records. Zero non-advisory findings. No new colors, type sizes, radii or production raster assets were introduced. The unrelated sidecar was not refreshed.

## Visual evidence and limits

Opened the three full-size source-derived layout studies together, then confirmed the final Sunstone refinement and contact sheet. The images show the actual authored grids, pin projection, path cells and existing prop model geometry. They show varied mission spacing, distinct contours, clear paths, contained markers and no overlap in the depicted composition. Studies use synthetic available markers; earned residents are omitted and checked separately in tests. Props were rendered offline with the shared model camera and different lighting. Diagram typography is a system font. These are composition studies, **not browser screenshots** and not proof of native typography, hover interaction or animation.

The native preview at 5195 was located, but DOM inspection timed out on `Emulation.setFocusEmulationEnabled`. Opening the tab returned queued. A direct screenshot timed out and reset the browser kernel. No native interaction or capture is claimed, and the user's saved public-game progress was not altered.

- [Meadow layout](meadow-isles.png)
- [Sunstone layout](sunstone-range.png)
- [Open Sea layout](open-sea.png)
- [Contact sheet](all-worlds.png)
- [Detector findings](detector.json)
