# Patrol playtest · October 2, 2026

Native in-app browser, local port 5195. The user reopened the game after the earlier browser error page. Initial captures used a narrow pane; final evidence uses the actual 1037×901 desktop pane. Public controls only, with Pause for inspection and command planning. No hidden state edits or forced completions.

The early play attempts exposed opportunistic target switching: a nearby Hauler could steal the pursuit from Scout. Enemy targeting was changed to retain a live target within pursuit range. Automated checks cover a closer passerby, escape, target dismantling, timer continuity and existing adjacent combat.

Inspected evidence:

- `distraction.png`: both enemies follow Scout on the west island while Hauler crosses the northern bridge. Hauler subsequently reached Watch via the eastern bank; both Sentry blueprints were still unused. The main completion dialog was observed.
- `duck-water.png`: Duck built from the spare kit enters the inlet; the model stays close to the water surface. The 3×3 ready construction preview was inspected before building. The finite Duck plan reads zero afterward.
- `bonus-complete.png`: the inlet arrival produces the final Bonus complete dialog and World map action. No bonus checkpoint was introduced.
- `snail-threat.png`: Snail approaches Crab in Canyon Rescue with its head tucked into its shell. Earlier approach captures show its grounded glide. No full mission completion is claimed for this check.
- `frog-hop.png` and `frog-landed.png`: Frog moves across the starting shore in Gator Backwater and settles back on its tile, with a stable ground selection ring. No full mission completion is claimed here either.

The screenshots were opened and reviewed. The HUD remains readable at the captured desktop size; the sparse toolbar exposes only supported actions. The Duck idle head-look cycle was not separately captured, and still-image checks do not substitute for a broad animation or balance review. This pass changes simulation targeting, not the visual design, so it adds no new design-detector run.

The preexisting matte-lighting trial appears in these local captures but is excluded from the gameplay commit. Source materials on the published site remain unchanged.

Validation: 25 focused tests and 50 campaign tests pass, including all 36 scripted main/bonus solutions. TypeScript and production build pass with the existing bundle-size advisory. These establish behavior and solvability; the user’s next playthrough should judge whether the choices are enjoyable.
