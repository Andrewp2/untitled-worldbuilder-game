# Objective clarity · October 2, 2026

Scope: `.impeccable/objective-clarity-brief.md`. A refinement of the existing desktop HUD, using the existing model atlas and resource pictures.

## Native play and inspection

The local server was stopped and was restarted on port 5195. Browser security blocked reloading its error page; the user manually reopened the game. Subsequent native browser interaction succeeded. A temporary 1100×850 viewport was reset; final captures use the actual 650×562 desktop pane, with Overview fitting the board. No progress fixture, hidden-state mutation or forced mission completion was used.

Stone Gate was completed through ground-plan collection, construction, two queued rock pushes and arrival at Gate. The normal completion popup and Try bonus action worked. The ready construction ghost was visibly planted and translucent, with the 3×3 supply outline and readiness check (`build-ghost.png`). This supplies native visual evidence missing from the prior play-feel pass for that particular ready state.

Final inspected captures:

- `choice.png`: Stone Gate shows Dozer or Scoop beside its main flag; the bonus is not revealed.
- `rescue.png`: Flat Battery distinguishes the original Scout from its starting Hauler.
- `convoy.png`: Three Tides shows either carrier, six green pieces, one charged cargo battery and the enemy-clearance symbol. Gameplay was paused for this inspection.
- `bonus.png`: after Stone Gate's real main completion, the row changes to the bonus star, Arborbot and carried tree. The selected Scoop build strip follows below it.

The first bonus inspection exposed a 1.8px overlap between the objective row and the formerly fixed build strip. Moving action/hover feedback into the mission's normal flow resolved it; final native DOM bounds confirm a 12px gap. The final screenshot was opened and inspected. No new browser console errors were reported.

These captures include the preexisting local matte-lighting trial. This commit excludes that trial and retains the published material baseline. No visual approval of unobserved enemy-notice timing, all creature reactions, all 36 native completions, mobile use, audio or final balance is claimed.

## Verification

- Eight focused tests passed: objective mapping, hidden-before-main bonus requirements, original rescue identity, cargo-vs-installed charge, and the existing reward handoff.
- TypeScript and the GitHub Pages base-path production build passed after the layout correction. The existing large-bundle advisory remains.
- One scoped detector pass found 11 advisory palette/radius/type documentation mismatches and no non-advisory findings. Existing values were reused; no detector-driven palette or typography redesign was performed.
- Source review confirms goal evaluation, finite blueprints, saved awards, resets and bonus progression are unchanged. The new helper reads authored objectives, rather than guessing the target from surviving units.
