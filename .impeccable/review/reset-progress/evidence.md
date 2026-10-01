# Reset progress · September 30, 2026

Request: “can you add a button to reset progress? hold for 3 seconds”.

This is a local extension of Game menu in the established toy game. The button uses the existing restart picture, navy menu, yellow control color, and compact type. It names the action and shows “Hold 3s”; a three-second linear bar and “Keep holding…” indicate an active hold. The world remains the main visual subject. No new direction, composition, raster, or mobile layout was introduced.

One continuous primary pointer, Space, or Enter hold confirms once. A plain click never confirms. Releasing, leaving the button, blurring, hiding the tab, Escape, closing the menu, or disposing the view discards the timer. Confirmation clears completed missions and bonus stars, removes earned residents, and returns to the world map. Audio settings are not part of progress. Refresh replaces saved awards rather than unioning them; a stale tab cannot restore cleared awards or add an orphan bonus. Storage failure retains session progress.

## Verification

- `npx vitest run tests/campaign.test.ts tests/hold-to-confirm.test.ts`: 33 tests passed in two files. Includes the exact 2999/3000ms boundary, once per hold, input owner/repeat handling, cancellation cases, button-event integration with persisted progress, stale tab completion, orphan bonuses, and failed writes.
- `npm run build`: passed, with the existing large bundled chunk advisory.
- Native in-app browser: opened Game menu and used an ordinary short click on Reset progress. The menu stayed open and returned to “Hold 3s”. Inspected actual pixels at 1280×720. Valid required captures: `menu-1280-first.png` (idle) and `menu-short-click-1280.png` (after short click). Text and icons fit within the small menu; the hold instruction is legible and does not obscure mission pins.
- Browser interaction used a separate dev origin, 5189, with zero awards; the user's real save at 5173 was not erased. A full native three-second hold and native removal of previously earned residents were not exercised. Exact hold/reset behavior is covered by focused automated tests; those tests do not establish animation appearance during a native hold.
- A second desktop viewport operation timed out. No 899px capture is claimed. Desktop is the shipped target for this request; mobile remains excluded by the user's earlier instruction.
- Detector ran once on changed UI targets. `detector.json` contains 37 advisory findings and zero non-advisory findings, mainly incumbent token extraction differences. No clean whole-game detector claim is made.

The review scope is this menu control and its guarded reset behavior. It excludes broader game art, balance, audio listening, and performance.
