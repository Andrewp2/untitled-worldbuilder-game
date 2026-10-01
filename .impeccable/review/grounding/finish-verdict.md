## verdict

1. Resolved — desktop.png, occlusion.png, user-748.png, and mobile.png show trees, rocks, and vehicles seated against the grass with compact contact beneath their bases. The 92% view makes the wheel and trunk attachment readable. grounding.ts distinguishes footprint centers from y338 export bounds; toy-art.ts keeps soft shadows on the floor and suspension about the fixed footprint. The supplied browser evidence records multiple facing changes, movement, and paused contact.
2. Resolved — occlusion.png shows foreground rocks covering the loaded Hauler's lower body and carried assembly together; tree-occlusion.png shows the same relationship behind the leaf crowns and trunks. Shadows stay beneath upright objects. Source uses shared worldDepth for render/picking and nests cargo inside the carrier, removing its independent world depth.
3. Resolved — the visible selection ring and goal diamond sit on the terrain beneath physical bodies, while charge/health and selection status stay readable above them. GameScene.ts places relay, pending transfer, goal/check, and range marks in ground-level routes; these less frequently shown states share the corrected layer. The original ground-level rover ellipse remains intact.
4. Resolved — every supplied capture shows the muted music icon. The confirmed policy is off on every tab load/reload, including legacy saved-on data, with deliberate opt-in limited to that tab session. GameAudio.ts starts false, restores only effects preferences, and sends music gain to zero until opt-in. The supplied browser evidence records activation remaining off, true/false toggling, and reload returning off; focused audio checks verify muted gain. No browser audio recording was supplied.

## remaining

Clear. All five after captures are valid at their named viewport dimensions. No regression introduced by this fix batch is visible in the reviewed captures. Ship covers the four scored fixes.

disposition: ship
