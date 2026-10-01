# Terrain-work verification — September 30, 2026

Scope: Scoop dirt worker and Siltwater Reach, an ordinary extension of the approved toy world. The original game supplied behavioral reference only; original source and art were not copied.

82 unique focused tests pass across terrain-work, orders-energy, bonus, goals, motion, grounding, facing, campaign, construction, movement and combat. The crossing test proves initial disconnection, two dig/fill orders, a route to the flag, the optional haul delivery, sufficient charge and pristine replay. Sequence tests cover conservation, wrong terrain, occupied/reserved/protected tiles, full/empty bucket, weak/dead batteries, invalid clicks preserving orders, cancellation, arrival revalidation and dirt recovered through cargo/dismantling/rebuilding. Existing shared simulation checks still pass. Production build passes; Vite retains its existing large-bundle advisory.

Native browser: selected Siltwater Reach, issued a distant dig on (7,5), observed cargo 1 dirt and charge 94; filled (8,6), dug (7,7), filled (9,6), observed charge 84; moved Scoop aside and sent Scout to (11,6). Expanded Unit information showed Position 12,7, charge 92, Ready. Kept the far-bank flag unvisited to avoid marking the user's mission complete. Restart restored terrain, rovers and charge. New Dig / Fill buttons and blueprint render; no browser console errors observed. Music remains off. Initial background test tabs did not animate reliably; recovered by using the original game tab. Successful gameplay evidence uses that tab.

Required native JPEG captures, valid dimensions and pixels opened:
- desktop.jpg: 1440×1000, fresh mission, Scoop selected, overview fit.
- mobile.jpg: 390×844, fresh mission at its initial readable camera zoom.
- user-781.jpg: 781×901, loaded Scoop after distant digging; changed water tile visible.
- crossing-user-781.jpg: 781×901, Scout on far shore with position in expanded information.
- world-desktop.jpg: 1440×1000, three world-map mission pins.
- mobile-overview.jpg: 390×844, explicitly selected overview state, same controls, no page overflow. At overview zoom the units are small; Focus/zoom and the normal initial view are available.

The reviewer requested a replacement crossing capture because the initial JPEG kept Unit information closed. The same file was recaptured after Scout arrived, opened, and confirmed to show expanded Position 12,7, Ready, and charge 92. No product code changed. An additional ready-user-781.jpg records the fresh restarted mission left for the user; the temporary viewport override was reset at the original 781×901 size.

One detector run saved detector.json: 88 findings (62 color, 18 font-size and 7 radius advisories, plus one incumbent rounded border accent warning on the completion card). The added controls reuse the approved colors and existing action-button style; no new warning applies to the terrain extension. Preserve user-pinned saturated toy language rather than redesigning the incumbent UI.

Raster provenance: built-in imagegen generated Scoop's four-view sheet and one dirt picture, saved originals under sources/. Crop, alpha bounds, Lanczos resizing and transparent padding normalize five 384px runtime images. Rear-view filenames intentionally follow existing facingPicture mapping. Every shipping raster contains its exact prompt; scan: 34 images, zero missing. Manifest and sidecars record origins and sources. Original approved study is a character/material reference, not a screen comp.

Limits: reduced motion was checked by motion tests and source review, without browser preference emulation. Native full completion modal and new earned map residents were not replayed during this browser run; their shared behavior remains covered by the focused simulation/campaign/motion checks. Battery action cost 3 is provisional tuning.
