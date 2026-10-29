# V4 Strategy Studio — product and implementation brief
Status: DESIGN APPROVED FOR IMPLEMENTATION BY USER'S REQUEST · tactics remain DRAFT
Source: genuine SetOptics fork PRYYSE/RotationStudio, V3 commit 8c0fb5d.
Owners: Normal Chat owns product/tactical decisions and acceptance; Codex implements bounded React/Three/TypeScript features. No rewrite of Set arcs or V3 author_tactics_v2.py.
Primary preview: desktop Windows with browser interaction and D: working files. Site: public GitHub Pages, no accounts, no backend, no multiuser sync.

## The pivot

Keep the animated, legal, six-player SetOptics fork, but make it an interactive *strategy-building tool*, not a fixed training video. Someone should be able to copy our current V3, choose R1, place a few athletes and adjust their movement routes at meaningful moments, name/save their version, and share an editable strategy for other people or ChatGPT to critique. They should NOT edit a 10+ keyframe technical timeline, manually link ball segments, or regenerate 48 scenarios. All detailed authored timelines stay available internally.

**Do not pretend one placement change automatically solves all volleyball tactics.** A user's save is a coaching *foundation*. Normal Chat can later complete/validate setter-release, alternative passes, opposite attack sides, defenders and serve-order variants from the exported machine-readable saved strategy.

## Main viewer corrections (small, before full art/animation pass)

1. **Receive / Attack / Defend section buttons seek the exact named landmark:** Receive -> first contact (First pass / Our dig), Attack -> actual hitting contact (Our attack), Defend -> **Defence ready** after our attack if They serve, but first Defence ready after our serve if We serve. Never choose Defend now / Defend again mid-transition. Keep the 3 main buttons; shorten the 10-marker visible timeline to **Start / Receive / Set / Attack / Defend**, arranged in actual possession order for serve ownership. Slider/speed/play remain available; full V3 timeline data stays unmodified.
2. **Compact feet-level athlete labels:** show one small tag near feet with Name · P1...P6, no large stacked glass label, distinctive legible text with strong contrast. Tags are recognisable by athlete colour, keep pointers unblocked.
3. **Six distinct colour identities** across avatars, label indicator, movement route and coverage area: Harry sky-blue #36C6FA, Caleb lime #A6E34A, Trent vivid orange #FF8640, Logan violet #AB87F5, Georgia magenta-pink #F26FA6, Jaz warm yellow #FFD84E. Keep high contrast on dark court and don't make labels the primary visual object.
4. Remove the floating **PASS HERE** HTML tag; retain the clear gold crosshair on the floor and draggable setter pass target.
5. **Coverage areas toggle** works at all editor stages and while playback, not only opponent serve reception. Dynamically follow player anchors and stage roles (serving/receiving, attacking and covering our hit, defending tips/blocks/deep lanes). Use a clear approximate zone ellipse per athlete, appropriate skill/mobility + role size; zones follow dragged athletes immediately. No false probability/exact-reach claims; overlays are indicative assignments. On their serve, where published receiveZones exist, preserve their compact/primary proportions rather than replacing them with identical circles. Keep zone legend compact and optionally hide area text to reduce occlusion.

## Assisted strategy editor: minimal mental model

**Two clear modes:** View (normal animation) and Edit strategy (top-down court interaction). Existing deep Coach draft JSON/keyframe tools remain optionally available as advanced access, but not visible in the default editor.

**Five editor anchors:** Start, Receive, Set, Attack, Defend. For They serve these form chronological Start -> Receive -> Set -> Attack -> Defend. For Us serve display Start -> Defend -> Receive (our dig) -> Set -> Attack. The later second defensive event uses the same chosen Defend formation where possible; don't expose another identical editor tab. The three main viewer buttons still jump to the real contact/milestone, not the start of a phase.

When editing a stage:
- Select stage and R1–R6 / They serve or Us serve. Highlight the current stage, pause simulation, switch to Top camera.
- Drag a player on court to change their anchored coordinate, or click player and enter X/Z metres precisely. Enforce court coordinate bounds and keep legal service-contact order warnings. A stage owns placement for **all six** players, not just the current first toucher or sample hitter.
- Click a player, choose **Route** to see the route from the previous anchor to current anchor (for current serve chronology). **Add bend** creates a draggable waypoint; **Straight** clears bends. Show a single selected athlete's coloured incoming route clearly, not all complex animated tracks. Path handles must be draggable with pointer capture and work on desktop/touch; no microscopic controls.
- **Undo / Redo** for placements, path waypoints and resets, with one action per gesture (not hundreds of undo steps for pointermove). **Reset stage** returns this stage to the V3 baseline; **Revert all changes to this rotation** with confirmation.
- When editing Set: explicitly place **all eligible front-row attackers in their approach-ready positions** and the available backcourt help/coverage athletes. Harry occupies the setter window unless he took first contact; front-row hitter positions must remain options to hit LEFT/MIDDLE/RIGHT. Attack shows chosen hit and rebound cover. Do not force everyone into a fixed hitting contact to artificially fit a single preselected sample.
- Support a **movable setter target** (gold crosshair); keep linked pass/set ball endpoints consistent when the contact target moves.
- User edits are explicitly *foundation draft*, not fully choreographed or APPROVED; preserve V3 authored alternates as starting templates. A single base variant edit should apply to all 4 opponent-side/first-contact authored variants of the **same serve owner** where logical. Keep serve-order starts separate due legal serving baseline; show a simple “Copy positions to other serve order” only when the coordinates/eligibility can safely be mapped, otherwise allow ChatGPT to reconcile after export. Never silently alter real approved published V3.

## Persistence, multiple authors, sharing, openness

- Keep **Team V3 (read-only baseline)** always available and unmodified. Provide **New from current**, **Duplicate**, **Rename**, **Save**, **Delete** with confirmation, **Import**, **Export**, and a share link when compact enough.
- Named strategies belong to this browser (localStorage or IndexedDB), distinct IDs and author labels e.g. Caleb / Friend / ChatGPT. Auto-save saved draft edits; clearly show `Saved locally` vs `Unsaved` and `Needs review`. No sign-in; no pretending friends' changes live-sync across devices. Explain this once succinctly.
- Store **sparse, versioned strategy overrides** rather than a 1MB full bundle per variant: base V3 + per rotation/serve/anchor player spot overrides, route bends, and setter target adjustment. Preserve base/source revision and warn when importing a different base. Keep a safe finite bound on data size; reject unknown player IDs, malformed version, nonfinite coordinates, invalid waypoint arrays. Imported saves never overwrite existing saves or the published baseline without confirmation.
- **Share link** serialises only these small overrides, name and author (prefer URL fragment, no server upload); importing shared link shows a clear `Save a copy` action before changing local library. If too long, default to JSON export as supported fall-back. A friend can open, make a copy and send a modified file/link back. ChatGPT can read exports and author machine-readable overrides.
- Never publish user local saves to GitHub Pages or expose data from one friend's browser to another automatically. All public code remains static; backend collaborative accounts not needed.

## Implementation specifics and safety boundaries

- Layer overlay on published immutable V3 bundle in a pure module (e.g. `src/lib/strategyDraft.ts`): stage anchor maps should resolve to exact relevant frame times in BOTH base and each alternate for the selected R/serve. Use events for first/second/hit/defence, not hardcoded seconds. Preserve service-contact position until contact and legal overlap for BOTH serving teams. When a stage keyframe or target is moved, reconnect first-contact ball-to-pass and pass-to-set or set-to-hit as necessary. If a user edit breaks constraints, show an actionable warning but retain draft editing. Do NOT call an edited foundation an optimised final rally.
- Maintain geometry continuity when moving an anchor; no teleport or movement before service contact. Reuse sampleTrack() / existing validator with reality boundary; do not weaken validators to mask issues. Retain all V3 tactics and alternate branch data; avoid mass-editing the V3 author generator to make the editor compile.
- Use controlled state without a new framework. Do not require network/backend or third-party auth. Keep the 3D court and React/Three architecture. All non-image code/assets for Windows development/build/QA under **D:\\Projects\\RotationStudio-V4** (with caches also on D:). No changing user OS/app preferences and no deleting unrelated files. Windows browser can use installed Chrome, with browser user data/temp/cache under D:.
- The local strategy overlay format is the durable bridge: Normal Chat can read a shared/exported `.json` and decide which placements to accept, expand/propagate across other serves/opponent sides, regenerate all 48 production scenarios via the existing authoring generator, and push a new named ChatGPT strategy later.

## Accepted now versus future visual pass

NOW: functional drag, path editing, five-stage editor, correct phase buttons, compact labels, six colours, dynamic toggled coverage, no PASS HERE tag, named local strategies, export/import, sharing, baseline preserved, feedback on invalid tactics. Desktop usability first; narrow phone must still have readable view and a usable drawer/editor (no horizontal overflow).

DEFER (record for later, don't implement now): lifelike run-up footwork, jumping spiking and blocking animation, anticipation/stutter steps, natural locomotion blends, hitter selection visualisation, dynamic ball-dependent opponent defence, animated setting hands, volleyball serve approach/contact, more natural body orientations, richer trajectory/ball feedback, and full art direction. The editor data model must keep attack/block/first-contact role semantics so future animation layers can use it; don't hardcode visual effects into saved plan coordinates.

## Acceptance tests

A. Viewer jumps: Receive, Attack, Defend land precisely on contact/ready frame for both serve orders; Defend not the transition.
B. R1 new strategy: drag Caleb at Receive, Harry at Set, and 2 eligible hitters at Set; route bend via selected player from previous stage; save, change rotation, reload app, reselect strategy -> exact same edits. Undo/redo works.
C. Across R1-R6 they/us, stage edits are keyframed at existing semantic events, affect all 4 authored tactic variants for that serve (normal/right/Harry first/right), preserve base untouched, maintain contact/ball continuity. No illegal hidden change to serving P1 baseline.
D. Duplicate, rename, delete confirmation, import, export, and share link round-trip (with save-copy) produce independent named strategies; malformed imports are rejected without data loss.
E. Coverage follows dragged player at every stage; toggle works; six player markers distinct; labels compact at feet; no floating PASS HERE; selected route and bends visible in Top.
F. Build, original V3 suite, new strategy/persistence tests, browser end-to-end (desktop 1440x900 and phone width) pass; the actual editable player and waypoint drag is exercised through real browser interaction, not only unit tests. Source remains a *feature branch* until Normal Chat visually reviews it. Keep tactic status DRAFT.
