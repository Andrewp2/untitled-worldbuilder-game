## verdict

All 18 requested final JPEGs decoded and were opened at original resolution. Sixteen are 1455×901; `map-large.jpg` and `scoop-large.jpg` are 1920×1080. Each shows the named state without malformed, unloaded, or blank content. The eight stationary Scout/Scoop endpoint captures show the selected named rover at 200% game zoom. This is a verdict pass against the eight fixes in `baseline-review.md`, with the user's screenshots and updated desktop brief as authority.

1. **Resolved — desktop controls.** `scoop-desktop.jpg`, `hollow-desktop.jpg`, and both large captures show a full board with a compact bottom toolbox and small mission/camera/menu groups. Empty cargo boxes, permanent recipe cards, the sidebar, and large world-map name blocks are gone. `blueprints-desktop.jpg` exposes the construction choices and costs on demand; selection, charge, and legal actions remain visible.
2. **Resolved — terrain treatment.** Mission and map captures replace mottled grass and dense water caustics with broad grass/sand/cyan planes, restrained edges, and sparse ripples. Raised banks remain intact. The active brief records this as a reversible terrain trial; this verdict does not claim the user has approved its final aesthetic.
3. **Resolved — sprite projection.** All four `scoop-*.jpg` and four `scout-*.jpg` endpoints show planted wheels and consistent axes relative to the tile diamonds. Body scale, support centers, and headings remain stable across views. The shared Three camera and ground-plane geometry establish the same 2:1 projection; the correction addresses perspective rather than merely translating the old illustrations.
4. **Resolved — colored parts.** `parts-hover.jpg` shows separate red and blue quantities; `blueprints-desktop.jpg` shows Scoop's red/blue/yellow costs and battery; `hauler-loaded.jpg` shows red, blue, and two green pieces in its cargo display and loaded bed. Source uses four distinct counts for recipes, pickup/drop, construction, bonus checks, dismantling, and wreck recovery. The supplied focused/full checks support conservation and rejection of color substitution; this reviewer did not rerun them.
5. **Resolved — Scoop capabilities.** Empty and loaded Scoop captures expose Move/Dig/Fill without Pickup/Drop. `scoop-loaded.jpg` places dirt in the bucket and visibly enables Fill while disabling Dig. UI capability checks and the simulation's cargo validation both reject Scoop cargo transfers; the bucket remains a terrain-work state.
6. **Resolved — rock footprint.** The close bridge and mission captures show complete rock groups centered on their respective blocked tiles, with flat bases contained within those tiles. The authored support geometry replaces the offset illustrated cluster; supplied hull checks support the visible alignment.
7. **Resolved — freighters.** Both world-map captures show the earned rover residents and clear shoreline with no freight boats. Current resident data and scene spawning contain no boats. No maritime behavior is being claimed for these missions.
8. **Resolved — bridge/coast joins.** `bridge-close.jpg` shows both crossings attached continuously to land, including the previously exposed lower band. Map captures at both desktop sizes show the same intact joins. The source uses equal 22px land/bridge depth and a lower water foundation.

No regression introduced by this fix batch is visible within the scored scope.

## remaining

Clear for these eight material fixes; no additional correction or capture is owed for this verdict. Documentation reconciliation remains the planned subsequent handoff. This pass does not certify mobile layouts, audible sound, whole-campaign balance, startup performance, or final user approval of the terrain trial. Ship earned here covers the scored fixes, not the whole surface.

disposition: ship
