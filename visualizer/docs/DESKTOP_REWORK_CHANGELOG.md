# RotationStudio — Courtline desktop rework

## G1.10 — Plan-first Strategy Library, all safety workflows intact (1 November 2026)

**Failure observed:** The desktop Strategies panel remained an AI-style numbered setup form (01 / Start a plan, 02 / Work on a plan, 03 / Share & back up) that required scanning repeated metadata and scrolling to reach the useful daily actions. A teammate needs to select the active plan, open it or save it, create a new plan, and find a reference quickly; rare destructive/technical actions must remain accessible but secondary. [Canonical 1 Nov independent product audit](https://github.com/PRYYSE/Volleyball/blob/main/docs/ROTATIONSTUDIO_PRODUCT_AUDIT_2026-11-01.md).

**Implementation:** Desktop full Strategies panel presents `Current plan` and explicit saved/unsaved/preview state, with `Edit on court`, `Save`/`Save a copy` when applicable and `Team reference` immediately accessible. New from baseline/current remains visible. `Manage plan` disclosure holds Duplicate, Rename/author, guarded Delete; `Share & backup` disclosure holds Import JSON preview, lossless Export JSON, Share URL and Export Review packet. Browser-local-only and not-match-approved truths are concise and visible. No numbered wizard, server, accounts, cloud sync, data regeneration or new dependency. Compact editor plan selector and phone layout/actions remain unchanged; Set arcs continues to be original.

**Non-destructive guarantees:** all callbacks remain wired to the original strategy store. Unsaved creation/switch requires explicit protection; guarded Delete; duplicate creates an independent unsaved ID; stored rename autosaves while preview rename does not; imported JSON remains a preview and cannot delete a saved plan with same ID; Save a copy is independent; share recipient does not write to their local storage until explicitly saving, and then clears the shared URL. Denied clipboard exposes a usable link; oversized link points to JSON export. Oversized/corrupt JSON does not alter working/saved data, quota and 50-plan errors preserve existing bytes, and share review packet retains exact draft and DRAFT provenance. These properties are directly checked, not inferred from visible buttons.

**Evidence and acceptance:** [Before desktop](desktop-evidence/nov1-plans-before-1440.png), [After baseline](desktop-evidence/nov1-plans-after-baseline-1440.png), [After unsaved plan 1440](desktop-evidence/nov1-plans-after-unsaved-1440.png), [After saved plan short screen 1366](desktop-evidence/nov1-plans-after-saved-1366.png), [After ultrawide 3440](desktop-evidence/nov1-plans-after-saved-3440.png), [Recipient preview](desktop-evidence/nov1-plans-preview-recipient-1366.png), [Phone unchanged](desktop-evidence/nov1-plans-phone-390.png) and [78/78 browser checks receipt](desktop-evidence/nov1-plans-qa-receipt.json). New baseline test was witnessed RED on old numbered wizard then GREEN after implementation. The final isolated Thorium suite covered 1366×768, 1440×900, 3440×1440, phone 390×844, selected/empty/unsaved/saved/preview, source export/import/clipboard safety, actual click/keyboard, localStorage, download bytes and Set arcs first-run overlay. **78/78 PASS, no JS errors. 168/168 unit PASS and Pages-base build PASS.** Codex sandbox Thorium initial launch timed out; final fully exercised suite ran on the Windows host with isolated temporary profile. Full original 10/10 editor integration was independently accepted in preceding G1.9; source editor, Set arcs, source team, player paths and action/coverage code untouched.

**Remaining:** This slice improves the Plans UI and safeguards but does not make the Team Reference itself a useful compact print artefact, author the team's Now/Next/If, confirm sport legality or finish G2/G3/G4/G5. G4 printable quick playbook is next. Source data and real personal R1/R2 browser strategies preserved; no owner sign-off inferred.

---

## G1.9 — Actual stage-first editor and temporary source-moment chooser (1 November 2026)

**Original usability failure:** Previous independent desktop review showed a selected player named three times, duplicated scenario/scope metadata and lengthy instructions before their real editing actions. Expanding "More moments" introduced a second horizontal 13–16-event strip, increased footer height from 184 px to 278 px, and physically **shrunk the 3D court**. The direct user requirement is Start → choose Receive/Dig or other moment → move player → automatic movement path → optionally add a bend, with authentic extra contacts available without complexity.

**Implemented:** One visible colour-accented selected-athlete dropdown that displays real name/P#; the selected moment's actual source label/time immediately below it; a compact truthful R#/serve/attack/first-touch status; exact **This case** default and preserved **Shared foundation** confirmation; immediately visible Place/Route/Action/Zone, Undo/Redo and sticky Save. Position instructions collapsed to one practical sentence; coaching detail is secondary. The G2.5 selected incoming-only movement path, action/zone controls, per-case isolation, save/preview guards, and player colours/roles are untouched. Editor never calls "all shared variants" without explicit confirmation.

**Detailed moments:** Primary horizontal stages always remain immediately usable; "More moments" opens a **temporary scrollable vertical list above the stage rail** showing each genuine source event in chronological order, its actual time and available contact labels. First and second receive/dig are explicitly distinguished. This list never changes footer/court height; closing by choice, Escape, re-click or outside click works; focus moves into selected/first choice and returns to opener; selecting any event immediately seeks and pauses; off-strip selection remains identified in the closed rail and reopening focuses the selected event. No fake keyframe editor or second permanent timeline.

**Independent visual and functional evidence:** [R3 before 1440](desktop-evidence/nov1-editor-before-r3-1440.png), [R3 corrected after 1440](desktop-evidence/nov1-editor-after-r3-1440.png), [R3 source event chooser](desktop-evidence/nov1-editor-moments-r3-1440.png), [short desktop 1366](desktop-evidence/nov1-editor-moments-1366.png). Isolated Thorium **7/7 new focused workflows** [receipt](desktop-evidence/nov1-editor-qa-focused.json): tests 1440, 1366, 3440 court equality and menu placement, 16 R1 source moments, every event select, keyboard/escape/outside, selected detailed focus, real mouse drag + Undo/Redo, unchanged phone. Independent reviewer **16/16 at 1440** and **9/9 each at 1366 & 3440** (the first independent assertion mistake selected a normal primary Next Dig, then was corrected to a genuinely off-strip moment; the multi-viewport-in-one-browser runner hung on reload, so each viewport was rerun separately, without changing app code). See [1440](desktop-evidence/nov1-editor-qa-independent-1440.json), [1366](desktop-evidence/nov1-editor-qa-independent-1366.json), [3440](desktop-evidence/nov1-editor-qa-independent-3440.json). Existing **10/10 integrated browser editor tests** [receipt](desktop-evidence/nov1-editor-qa-integrated.json): Harry first/later actions, Georgia incoming bend, Jaz zone, case-isolated safe Save, byte-identical reload, full Play/Pause, both serve owners and unchanged phone. **168/168 unit tests** and Pages-base production build pass. Headless isolated Chromium under Codex sandbox had timed out before checks; browser verification was subsequently performed directly on the Windows host with independent isolated profiles and actual screenshots, so it is NOT unverified.

**Remaining/explicit boundaries:** These are usability and visual acceptance results of G1.9, not owner sign-off on the entire product or proof of G3 tactical legality. Original source contact/ball/48 variants and personal browser strategies are unchanged; Set arcs and phone remain on original screens. Plans, print/reference, actual coaching-specific Now/Next/If, G2 animation quality and full independent sports acceptance remain open. See canonical [1 Nov product-quality contract](https://github.com/PRYYSE/Volleyball/blob/main/docs/ROTATIONSTUDIO_PRODUCT_AUDIT_2026-11-01.md).

---

## G1.8 — Integrated desktop View / Scenario Explorer product-quality pass (1 November 2026)

**Why this was needed:** A fresh independent 23-state Thorium product audit, comparing actual View, Edit, Plans, scenarios, print and Set arcs at 1366x768 / 1440x900 / 1920x1080 / 3440x1440 plus unchanged phone, found that earlier successful G1 micro-fixes still left the *whole product* reading as an over-explained AI dashboard. View led with Shuffle/technical metadata rather than the teammate's next action; Scenario Explorer exposed too many model details and practice controls; black athlete cast shadows overpowered the court; small angled framing left unused space. This is a meaningful product rework, not a requirement-checkbox/CSS colour change. [Canonical independent Nov 1 audit and delivery contract](https://github.com/PRYYSE/Volleyball/blob/main/docs/ROTATIONSTUDIO_PRODUCT_AUDIT_2026-11-01.md).

**Desktop View changes:** One clearly visible selected-athlete dropdown doubles as a calm name/P heading: a teammate can switch from Harry to another player directly, rather than opening a technical details panel. The inspector leads with actual authored Now, next source moment and available conditional responsibilities, retaining original tactical provenance, full roster and coordinates under Tactical details. Generic status repetition, synthetic COURTLINE STUDIO eyebrow and duplicated court-size captions are removed; one DRAFT indicator remains. **Important limitation:** the real Team V3 Now wording can still be generic, so G4 must improve the *meaning*, not just reformat it. No invented coaching advice added here.

**Scenario/Practice:** One clear Their attack left/right and First contact Normal/Harry first choice; First-ball 3x3 examples, authentic Shuffle/Next/History and teaching notes remain in expandable Practice / first-ball, while advanced display options are secondary and existing quick Top/Orbit/Front/Side remain on the court. The early reviewer detected a cramped History popover; it was corrected and rechecked. No capability or one of the 48 authored cases removed.

**3D court presentation:** Desktop directional cast shadows replaced by subtle existing contact shading so players, coloured identities, reference zones, court/net and selection dominate. Camera Orbit default framing enlarged modestly for desktop, keeping all six original team members and the R1 serving player on screen; manual camera framing remains untouched during events/playback, and explicit camera presets and Fit still work. A first 1366px revision clipped Harry's server label and was *rejected*, not marked pass; final camera target was adjusted and retested. Mobile rendering/framing and original Set arcs are preserved.

**Independent reviewer acceptance evidence:** [1440 before](desktop-evidence/nov1-view-before-1440.png), [1440 corrected after](desktop-evidence/nov1-view-after-1440.png), [1366 after](desktop-evidence/nov1-view-after-1366.png), [Scenario after](desktop-evidence/nov1-scenario-after-1440.png), [Practice/History after](desktop-evidence/nov1-practice-history-after-1440.png), [final View/browser receipt](desktop-evidence/nov1-view-browser-receipt.json), [6-way serve/framing/one-picker receipt](desktop-evidence/nov1-view-framing-receipt.json). Isolated Thorium **5/5 focused end-to-end checks PASS**, including all **48 authored scenario selectors**, First-ball 9 cells, Shuffle/History, instant stage seeking, Play/Pause, all four camera presets, and **pixel/DOM-identical mobile View/settings and original Set arcs controls**. **6/6 independent manual reviewer browser combinations PASS** (both serve owners x 1366/1440/3440, each with all six labels inside visible canvas and click-to-switch picker), original integrated desktop editing **10/10 PASS**, unit **168/168 PASS**, Pages-base production build PASS. Only existing Vite bundle-size advisory; not a failure.

**Source/preservation:** Did not change 48 source tactical scenarios, ball/contact ownership, saved draft schema, personal R1/R2 browser profiles, G2.5 incoming-only path or original Set arcs. G1 still not whole-product accepted: Edit inspector and Moments, Plans, readable printed teammate references, actual useful Now/Next/If, animation quality and G3 sport legality are still open. See linked project roadmap. Do not infer owner sign-off or real-game tactical approval from these browser results.

---

## G2.5 — Only the selected athlete's incoming path in desktop Edit (31 October 2026)

**Direct user requirement:** When a teammate is selected in the editor, show **only the path from that player's previous position into the selected moment**, not a separate future/outgoing path. Keep the V4 stage-first workflow simple: move athlete at Start, choose Receive/Dig, move them, see automatic route and optionally drag/add a bend. The outgoing path appears only when selecting its destination moment next.

**Implementation:** Desktop detailed-event route scene no longer draws the next/outgoing segment or its separate direction arrow. The incoming path and its optional existing bend handles remain editable. The Route inspector has a single **From previous** distance/time assessment, with **Add bend / Straighten / Delete bend** controls and explicit guidance to choose the next event to adjust the next movement. Removed **Arriving path / Leaving path** toggle and outgoing movement warnings from the current-stage Place view. At the first authored event, no fabricated preceding route appears. The normal stage-only route renderer already displayed just the incoming path and is preserved. No strategy data or tactics/schema/contact/ball ownership modifications; an outgoing bend saved previously is **still retained** and is editable as incoming when its destination stage is selected. Desktop only; mobile View unchanged.

**Evidence:** [Real selected Harry/Set incoming path screenshot](desktop-evidence/g2-incoming-only-harry-set-1440.jpg). Focused isolated Thorium **7/7 PASS**: incoming-only Route text and controls, stage switch showing next segment as its incoming path, no invented Start path, phone no overflow and no JS errors. Full independent 1440/3440/390px integrated editor **10/10 PASS** including Harry different first/next actions, selected Georgia incoming bend, coverage, case-isolated save, reload byte-identical and Play/Pause. **168/168 unit tests PASS**, production Pages-base build PASS. [Browser receipt](desktop-evidence/g2-incoming-only-receipt.json). G1/G2 broader user/tactical acceptance remain OPEN.

---

## G1.6–G1.7 + G2.2–G2.4 — Major desktop editing/playback repair (31 October 2026)

**User's new high-priority reports:** Full-name player tags still obstructed the court, jittered and jumped around as play advanced; camera forcibly cut/reframed after contacts even when deliberately positioned; moving a player in Edit strategy was **extremely laggy**. Keep the simple stage→move players→automatic route→optional bend workflow.

### Stable compact player identity (G1.6)
Desktop identities now use **small, predictable, translucent full-name + P-number tags at the player's projected feet**, without dynamic collision-slot searching, priority-based teleportation, changing first initials or coarse 80ms position updates. They follow the athlete each rendered frame with GPU transform and do not intercept mouse input. Original mobile layout algorithm remains unchanged. Dense net formations may still have labels physically close together; do not claim full owner aesthetic acceptance. **Browser:** six named/P# labels, 9/9 checks, sampled maximum move **19.31 px per ~90 ms** during playback rather than collision-teleporting; 1440/1920/3440 and unchanged 390px mobile tested. Pure collision-independence and fractional motion unit tests added.

### Camera remains where the coach put it (G1.7)
Desktop contact timing, event seeking, playback advancement and canvas/inspector resizing no longer auto-reset the 3D camera. The user's **manual zoom and Orbit positioning remain in force**. Explicit Top/Orbit/Front/Side selection and editor Fit remain valid camera preset actions. Mobile's existing service-contact framing logic intentionally unchanged. Isolated 1440×900 screenshots before and after selecting Receive from a manually zoomed view retain court framing (only approximately 2.72% of the broad canvas region changed from player/ball movement, rather than a hard court jump).

### Smooth editable-player dragging (G2.2)
**Root cause verified:** During every pointer-move, the old editor cloned and validated the entire user strategy, reapplied sparse changes to the complete authored set, rerendered the court and wrote state repeatedly. The measured identical **75-step headless drag** required **46.19s overall / 44.55s JavaScript**. Desktop dragging now previews the avatar **and name tag directly** via a transient, non-persisted coordinate; it commits **one undoable strategy edit only on release**. On cancel/unmount the preview clears. Mobile Editor keeps its original drag logic.

**Repeat benchmark on same isolated headless Thorium:** **20.75s overall / 1.76s JavaScript**, roughly **25.3× less JavaScript execution** during the 75-step drag, and ~2.23× shorter overall test. The residual total includes headless WebGL/input overhead, **not a measured user-visible RTX desktop FPS**; judge feel in a real normal-speed browser. The actual Edit mouse test verified preview follows finger/mouse while the saved position remains unchanged during drag, release commits ~0.96m, **one Undo** restores, **one Redo** reapplies, Receive/Dig remains independent. The original mobile View and real saved R1/R2 browser profile were never accessed.

### Coverage continuity and honest route feasibility (G2.3–G2.4)
A case-specific player responsibility formerly appeared **only at the exact source-event timestamp** and vanished between frames. It now remains visible through its authored phase and expires at the next phase, keeping separate first/later contacts distinct. Tests exercise all **48 case variants**. The Route tool now presents per-interval distance/time and flags demanding required travel against the application's conservative rough speed screen, labelled **approximate teaching guidance**, never a real measurement of an individual's speed or a guarantee of volleyball legality. No source contact/ball path or original strategy overwritten.

### Acceptance / boundaries
- **168/168 unit tests PASS** including new label, drag-preview, 48-case movement and coverage continuity tests; production Pages-base build PASS.
- **9/9 browser** identity/camera/viewport tests, **8/8 real mouse drag and Undo/Redo** checks, **10/10 full editing integration** (case-scope/save/reload/bends/coverage/playback/multiple digs/phone compatibility) PASS.
- [Player label screenshot](desktop-evidence/g2-stable-identity-1440.png), [before/after camera zoom framing](desktop-evidence/g2-camera-before.png) and [after](desktop-evidence/g2-camera-after.png), [drag screenshot](desktop-evidence/g2-fast-drag-1440.jpg), [label/camera receipt](desktop-evidence/g2-label-camera-receipt.json), [drag receipt](desktop-evidence/g2-drag-receipt.json), [performance comparison](desktop-evidence/g2-drag-performance.json).
- Genuine 3D SetOptics and original Set arcs, published 48 source scenarios, Team V3 tactical DRAFT, browser-local user strategies/legacy import/export and exact-case editing unchanged. **This does not finish all G1 visual polish or G2 tactical/animation fidelity**; specific owner acceptance of tags, framing and drag feel is still pending.

---

## G2.1 — Edited athlete actions settle naturally after the authored moment (31 October 2026)

**Observed from real animation code and user request:** An athlete explicitly marked Block / Receive / Set / Attack / Cover / Recover at one rally event retained that static pose while their authored route continued to move toward the next event. This produced sliding and unnatural frozen arms, undermining simple full-rally playback.

**Fix:** At the selected source event, the original authored **teaching action is fully visible**. Its pose then **eases out over 0.6 seconds** into the player's already-computed locomotion/contact pose, so legs and direction still follow the real saved track without an artificial permanent action lock. The selected edited action and case scope remain exactly the same; this changes only **how it is drawn during playback**, not strategy saved data, contacts, who touches the ball, path positions, stage timings or branch logic. Front-row Block can show a small bounded rise (.1m) after serve contact, never for back-row or reduced-motion preview. No new timeline, animation control or invented ball trajectory.

**Acceptance:** New pure pose unit test checks all six edited action cues are explicit at their event, unwind smoothly with no frozen arms 0.6s later, retain original x/z travel, block front-row bounded lift only, back-row and reduced motion no jump. **162/162 unit PASS**, production Pages-base build PASS, full browser editor acceptance re-run covering source events, independent first/next actions, route bends, zones, case-only save, reload and Play/Pause. [Code](../src/lib/rotationPose.ts), [pose unit](../src/lib/rotationPose.test.mjs).

**Known limits:** simplified player geometry and teaching poses remain stylised. G2 still requires broader realism/coverage testing and cannot infer real athletic speed or alternate ball contact from a displayed action.

---

## G1.5 — Instant manual navigation throughout desktop View (31 October 2026)

**Real bug found by integrated teammate walkthrough:** On the published app, clicking **Receive** in desktop View started `playing=true` with destination 2.75s while the court still showed 0.00s. This contradicts the user-approved rule **manual stage/event navigation is instant; Play alone animates**. Earlier edit-only tests missed the View behaviour.

**Fix, desktop-only:** View stage buttons, Previous/Next arrow controls, keyboard Left/Right phase changes and expanded **All source events** selections now jump straight to the exact authored moment and stop motion. The actual Play/Pause controls continue animating the full rally; on phone the existing transition behaviour is left untouched. No event timestamps, tactics, source contact ownership, strategy saves or Stage→position→automatic path editing logic was changed. The All Events explanation no longer misleadingly tells people they must use Jump to complete a transition.

**Evidence:** Fresh isolated real Thorium **11/11 acceptance checks PASS**: Receive instant at 2.75s, Next/Previous instant, full source list with explicit selected event at exact 5.38s, explicit Play actually advances, Pause holds, no overflow at 1920×1080 and 3440×1440, phone unchanged, no JS errors. The baseline before code changes was independently recorded `VIEW_MANUAL_STAGE {"playing":"true","target":"2.75","time":"0.00s"}`. **161/161 unit tests PASS**, Pages-base build, and a full integrated **10/10 desktop editor browser pass** after updating an obsolete test assertion to check actual Place/Route/Action/Zone buttons instead of the deliberately removed default coverage warning. The integrated pass checked independently saved first/next dig actions, route bend, coverage, case isolation, reload identity, Play/Pause, both serve modes and mobile no-overflow. [View screenshot](desktop-evidence/g1-view-instant-1440.jpg), [browser receipt](desktop-evidence/g1-view-instant-receipt.json).

This closes a real inconsistency, **not** the whole G1 visual/usability acceptance gate. Continue remaining integrated novice/teammate and coach walkthroughs before marking G1 fully complete.

---

## G1.4 — Desktop editor hierarchy and tool-first access (31 October 2026)

**Observed at 1440×900:** The selected-athlete inspector buried Place/Route/Action/Zone below a long generic coaching note, repeated "Coverage not customised" and save-status labels. Users needed tools first, not a larger developer information panel.

**Implemented desktop-only:** Keep selected player/P-number, current source moment and case-specific vs shared scope visible, then show the four actual editing tools sooner. Move the unchanged original coaching note to an optional **Coaching cue for this moment** disclosure just beneath tool tabs. Show athlete action (and actual assigned coverage purpose only when present) without an empty "Coverage not customised" warning. Remove a repeated "Unsaved changes" message from the history row, since the strategy selector already shows its save state. The actual stage→drag→auto-path→optional bend and explicit Play logic are unchanged. Mobile uses a separate LegacyStrategyEditor and is not restyled.

**Evidence:** fresh isolated Thorium **11/11 PASS**: four tool buttons at Y=540, collapsed coaching cue containing the original action text, no duplicate unsaved/uncustomised messaging, stage selection instant, phone original editor/no overflow, and no JS errors. [Screenshot](desktop-evidence/g1-editor-task-first-1440.jpg), [browser receipt](desktop-evidence/g1-editor-task-receipt.json). **161/161 unit tests PASS, production Pages-base build PASS**; source tactics and original Set arcs untouched.

**Remaining:** G1 full novice teammate/coach visual review remains open. G2 later improves real action/route/coverage fidelity; G3/G4 improve the underlying tactical coaching content.

---

## G1.3 — Desktop strategy management organised around tasks (31 October 2026)

**Observed in a real 1440×900 screenshot:** New, duplicate, rename, save, delete, import/export/share/review/print appeared as equally ranked actions, many disabled under a read-only source, obscuring what an ordinary teammate should do.

**Implemented, desktop only:** Selected source and saved strategies stay in the same safe browser-local store. A progressive task hierarchy displays **01 Start a plan** (New from baseline / New from current), **02 Work on a plan** (when a local draft exists: prominent **Edit on court**, duplicate, rename, save, delete), and **03 Share & back up** (import, export/share where available, team reference, review packet). Empty baseline no longer shows unavailable destructive/editing options. The everyday panel hides raw revision hashes while preserving all underlying data and review/export functions. The same existing `openEditor` handler is used by the top navigation and new **Edit on court** button; stage-first positioning and automatic paths remain unchanged. Mobile browser renders original action list, no desktop headings; no user saves or source tactics modified.

**Acceptance:** fresh isolated Thorium at 1440×900, **10/10 workflow checks PASS**: clear three stages, no unavailable editing controls on source, import/reference remain reachable, create editable local plan, edit management appears, **Edit on court** enters Start/Receive/Set/Attack/Defend stage-first editor without replacing the working plan; 390px phone still renders original actions without overflow, no page errors. **161/161 unit tests PASS, production Pages-base build PASS.** [Screenshot](desktop-evidence/g1-strategies-start-1440.jpg) and [browser receipt](desktop-evidence/g1-strategies-receipt.json). This is a bounded usability improvement, **not** full G1 visual acceptance, a new cloud sync system, or final review of plan-sharing quality.

---

## G1.2 — Non-overlapping desktop athlete tags (31 October 2026)

**Observed:** Real 1440×900 desktop View still stacked player identity tags on top of each other near the net despite the earlier small under-foot styling. This directly conflicts with the requirement for legible player/P identities during tactical study.

**Implemented:** Desktop-only lightweight screen-position collision placement, considering the selected athlete and first/second contact player first. Try full names close to projected feet; in crowded spots use a **three-letter player identifier plus P number**, then only nearby alternate positions; preserve the actual player colour and source geometry. Avoid all six large floating cards/leader lines. The original mobile `layoutLabels` algorithm and mobile identity style were not changed.

**Real browser checks:** six visible labels, zero tag intersections on **R1 at 1440×900**, **R3 at 1440×900**, and **R3 at 3440×1440**, mobile still renders all six and no page errors. Independent [1440 screenshot](desktop-evidence/g1-label-r1-1440.jpg), [QA receipt](desktop-evidence/g1-label-receipt.json). **161/161 tests PASS** and Pages-base build PASS; this is a focused visible readability fix, not coach approval of placement or team tactics.

---

## G1.1 — Coach View clarity (31 October 2026)

**User intent:** normal desktop **View** should tell an actual teammate what to do, not lead with technical coordinates, raw source case IDs, or empty coaching fallbacks. Preserve detailed precision for people who deliberately expand it. This is a **bounded desktop-only** usability improvement; it is not a claim that the full player instructions or team tactics are complete.

- **Now · Your responsibility** visually dominates the selected-player panel; **Coming up** identifies the next actual authored rally event, not an invented contact or athletic instruction.
- Normal desktop Player Focus shows P-number/front-back/role without raw X/Z; precise coordinates, source details and incomplete fallback alerts remain in **Tactical details & full roster**. A real authored conditional fallback remains visible when it exists.
- Desktop practice variant text is human-readable, e.g. attack toward our left / first touch Caleb, instead of exposing a case key. The old diagnostic data remains in source and DOM case attributes. Do not silently change phone layout or data.
- **Validation:** 161/161 unit tests and production Pages-base build PASS. Fresh isolated Thorium against the real local Vite server: 7/7 focused browser checks PASS covering Now hierarchy, coordinates only in details, human scenario text, desktop overflow, untouched mobile Player Focus/practice text and mobile overflow. [Desktop screenshot](desktop-evidence/g1-view-1440.jpg), [browser receipt](desktop-evidence/g1-focus-receipt.json). No modification of personal saved strategies, source Team V3 or original Set arcs.

**Open:** more substantial initial-user readability, full tactic specificity, case/branch teaching notes and plan-management UX remain part of [G1](https://github.com/PRYYSE/Volleyball/issues/3), [G3](https://github.com/PRYYSE/Volleyball/issues/5) and [G4](https://github.com/PRYYSE/Volleyball/issues/6); do not replace them with this small patch.

---

## Slice D — Simple stage-first placement and automatic movement (30 October 2026)

**User-requested course correction:** Restore the easy V4 authoring model. Author selects Start, Receive/Dig, Set, Attack, Defend/Recover, Block/Defend or Next Dig as appropriate; selects a player and drags them to their position. The underlying track connects the player to other authored positions and displays their path. Route editing is **optional** for a selected incoming/outgoing interval: Add bend, drag/remove bend, straighten. Do not expose a mandatory timeline or force manual path drawing. "More moments" expands the full authoritative source event list for later/alternate contacts without burying normal stage navigation in 16 technical events.

**Implemented in desktop only:** Human quick-stage strip with exact mappings for both Us-serve and They-serve source labels (including their First pass → Receive/Dig, their attack → Block/Defend, Next set), instant jump on stage selection, fully accessible extra-events disclosure, a readable More moments button (corrected 48px clipping), concise placement/path guidance, Arriving/Leaving route names, and compact under-foot name/P-number tags without concatenated action text. Action remains visible in the selected-athlete inspector. Mobile View is not redesigned.

**Evidence:** Normal Windows real Thorium regression **10/10 PASS**: instant Start→Receive, required quick stages on each serve, optional source events, independent first/next dig edits, Georgia route bend, Jaz coverage, case-isolated saved/reloaded strategy, Play/Pause, 1440 and 3440 desktop with unchanged phone breakpoint, no page errors or horizontal overflow. Separate real-mouse drag moved Jaz **0.93m at Start** while Receive/Dig retained separate placement; the source movement route is derived from the saved positions. **161/161 unit tests PASS** and Pages-base production build PASS; pre-existing nonblocking large-bundle advisory. Actual published Pages status to be confirmed through the release workflow.

This is a focused product improvement, not proof the complete editor has perfect UI or all plausible volleyball contacts/alternate ball trajectories. Preserve legacy V1/V2 saves, original SetOptics/Set arcs, V3 DRAFT team source, all 48 authored cases and user browser-local R1/R2 drafts.

---

## Slice C — Direct editing-tool layout (30 October 2026)

**Status: locally verified; public release state is tracked in the canonical project checkpoint.** Independent 1440x900 desktop screenshot critique found that Action and Coverage were buried far below Position and Movement in the right inspector. This was a discoverability defect, despite correct storage logic.

- Replaced the vertically stacked four-tool interface with a clear **Place | Route | Action | Zone** button switcher directly under the selected athlete, current moment and one-case scope. Exactly one focused editing panel is displayed at once; all four choices remain visible within a 1440x900 desktop viewport.
- Player heading shows the **current teaching action** and selected coverage zone regardless of which tool is active. Undo/Redo and saved/unsaved indication remain visible while changing tools. Strong contrasting amber selected state and keyboard-visible focus.
- Existing athlete position dragging, complete event-to-event routes, teaching actions, coverage and save behaviour are preserved, with no change to mobile View layout.
- TypeScript/Pages-base build PASS; the independent isolated Thorium end-to-end player workflow 8/8 PASS after real tab switching, including Save/reload, Play/Pause and desktop/ultrawide/phone overflow checks. Images: [1440 with tools](desktop-evidence/slice-c-1440-tool-switcher.png), [3440](desktop-evidence/slice-c-3440-ultrawide.png), [QA receipt](desktop-evidence/slice-c-browser-receipt.json).
- A separate real Thorium broad View matrix also PASS: **48/48 authored R1–R6 rotation/serve/attack-side/first-toucher cases**, nine First Ball cells, phase motion and exact Jump, Top/Front/Side/Orbit, seven visibility toggles, five viewports (1440, 390, 375, 768, landscape 844) with zero horizontal overflow. [Machine-readable receipt](desktop-evidence/slice-c-48-case-matrix-receipt.json); 19 screenshots in protected Windows QA cache.
- This is a focused P1 usability remediation, not a claim of complete tactical or full-app UX sign-off.

## Slice B — Athlete editing (30 October 2026)

**Status: implementation and local acceptance PASS.** This is the second coherent desktop milestone, following the already-public Slice A. Publication through existing Pages workflow is performed after a clean Git checkpoint.

### What works
- **Position:** select any athlete, edit their position by dragging on Top view; original-position ghost, Undo/Redo and selected-case scope.
- **Movement:** visible incoming and outgoing event-to-event routes, sampled length/time, add/drag/delete route bends and straighten. Routes replay in original source timing. One simple source-event rail, with First dig and Next dig independently editable.
- **Action:** selected moment's Ready, Receive/Dig, Set, Attack, Block, Cover, Recover. Action selection drives a distinct teaching pose/label in the 3D viewer; source-touch ownership, contacts and ball flights remain immutable. Unauthorised back-row blocking or action/contact mismatches show warnings.
- **Coverage:** independent player responsibility and purpose, direct area handles and optional advanced dimensions; selected case is default and shared foundation requires deliberate confirmation.
- **Persistence:** strictly validated, backwards-compatible V2 optional coaching extension, saved and reloaded locally, with guarded import/share. Unedited old V2 drafts remain byte-identical on read; old bends and source stages are not reinterpreted when only action changes.
- **Playback:** desktop Play traverses the remaining authored rally; selecting moments seeks instantly. Desktop-only UI; mobile View/transport unchanged.

### Local acceptance
- 161/161 automated unit/integration tests PASS, no skips. TypeScript and production Pages-base build PASS; non-blocking large-bundle warning only.
- Independent REAL Thorium session against current Vite code (not Codex sandbox): **8/8 browser acceptance checks PASS**. In R1 our serve, Harry Cover at first dig and Receive/Dig at next dig remained independent. Georgia movement bend, Jaz short-ball tip zone, Save->reload byte-equivalence, single-case isolation and Play/Pause were exercised through actual UI. No JS errors or horizontal overflow on desktop 1440x900, ultrawide 3440x1440 and preserved phone 390x844.
- The repository's `visualizer/tests/desktopCourtline.browser.mjs` now matches the **new desktop editor**, replacing assertions against the retired "Only this version" button and numeric primary fields; it runs with isolated Thorium using `COURTLINE_QA_URL` override when needed.
- GitHub-recoverable screenshots and receipt: [1440 desktop](desktop-evidence/slice-b-1440-desktop.png), [3440 ultrawide](desktop-evidence/slice-b-3440-ultrawide.png), [phone unchanged](desktop-evidence/slice-b-390-mobile-preserved.png), [browser acceptance receipt](desktop-evidence/slice-b-browser-receipt.json). These are focused acceptance evidence, **not** final visual design sign-off.

### Open limitations and remaining product work
- **Optional arbitrary extra movement stop deferred:** source event identity and fractional-time coverage handling need a coherent implementation; no non-working control is displayed. Per-event position/route-bend editing already works.
- **Addressed in Slice C:** Action and Coverage were buried in a scrolling form at 1440×900; the new direct four-tool switcher makes them available in one click. Additional large-part visual/tactical review must still distinguish good UX from merely passing tests.
- Larger independent desktop UX review remains to do: varied case/athlete user journeys, full visual composition/camera at different sizes, tactics interpreted as coach instead of programmer, and fixes. Mobile View redesign intentionally deferred separately.
- Real TTGVA referee-foot and tactical playbook approval are **not** established by browser tests; all base team tactics remain DRAFT.

## Slice A — Desktop foundation (30 October 2026)

**Published and publicly verified** on [RotationStudio Pages](https://pryyse.github.io/RotationStudio/) at app main commit [4192ab7](https://github.com/PRYYSE/RotationStudio/commit/4192ab77cca92ba6a75dc158d802dd5d95de8293); first Pages build/deploy completed successfully.

- New desktop Courtline art-direction foundation: graphite panels, teal court, amber selection, better typography, court-first composition, focused inspector.
- Adaptive inspector ~389/518/520px at 1440/1920/3440, resizable with keyboard, compact under-foot player labels.
- Single visible chronological source-event rail in desktop Edit, separate first/next dig, instant event selection and direct Top/Orbit/Front/Side/Fit.
- 154/154 regression tests and Pages-base build passed, independent real Thorium layout at 1440, 1920, 3440 and 390 confirmed no horizontal overflow.
- Public HTML/JS/CSS asset hashes matched local production build; untouched original public plans both served HTTP 200.

## Invariants across both milestones
- Authentic PRYYSE/RotationStudio SetOptics fork, original Set arcs and source V3 JSON, all 48 cases, original contacts, DRAFT provenance, local-storage user R1/R2 drafts, import/migration and browser saves preserved.
- No destructive clearing/migration of browser data. Original user browser profile never used by automated QA, only isolated profiles.
- Incremental tested publishing allowed. Final comprehensive UX/visual review happens near major integration finish, not after every minor commit.
