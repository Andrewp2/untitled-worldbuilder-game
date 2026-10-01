## verdict

1. **Resolved — immediate earned-progress persistence.** `GameScene.update` now publishes bridge state in the same frame as goal/bonus events, bypassing the 100ms HUD throttle. The two focused handoff tests cover real simulation completion and a travelling delivery bonus during a 1ms frame. The reported native reward-to-map action returned with saved `2 / 2 complete`, visible in `reward-to-map.png`.
2. **Resolved — native Space activation.** The celebration shortcut now excludes HTML buttons from Space-to-skip. The native World map Space action reached the saved map with a visible focus ring; canvas Space still opens the completion dialog immediately, visible in `canvas-skip.png`.

The five canonical recaptures and two regression captures pass the evidence check. No regression from this fix batch is visible. Supplied evidence records a passing production build, TypeScript check, and 47 focused tests across narrow runs.

## remaining

Clear. Ship covers the two scored event-boundary fixes, not whole-surface approval. The initial full review remains preserved in `finish-review.md`.

disposition: ship
