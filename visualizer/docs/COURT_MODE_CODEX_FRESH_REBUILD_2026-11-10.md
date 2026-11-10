# CODEX execution brief: clean-slate mobile/tablet Court Mode

**Owner directive, 10 November 2026.** This is the **current, implementation-authorising task** for a new Codex conversation. The earlier Work-produced Court Mode has been rejected and reverted. **Do not use the two earlier `ROTATIONSTUDIO_PRACTICE_VIEW_WORK_*.md` briefs as build instructions.** The owner's new direction and this document supersede their architecture, design and testing assumptions.

**Single outcome:** Build and ship to the existing live RotationStudio GitHub Pages site a **finished, fundamentally new, mobile/tablet-first Court Mode**, as a **separate application workspace within the same product**, using only the appropriate modern Full Studio *domain/3D/motion foundations*. Retire the previous legacy responsive mobile interface code rather than using it to scaffold the new UI. The result must look, feel and behave like a dedicated touch application for reviewing, explaining, demonstrating and practising volleyball rotations. **Do not do a small cosmetic facelift of the existing app or another read-only View tab.**

**Owner approval policy:** The user expressly authorises implementation and live publication **in the same run**. No intermediate concept-only design deliverable, no prototype milestone, no separate staging site, no pause for design approval or release permission. Work through to a useful, complete product, publish, and report what actually passed and what requires further user refinement. Use meaningful commits/checkpoints without deploying knowingly half-finished mobile UX.

## 1. Start from the right code and protect it

- Application repo: **`PRYYSE/RotationStudio`**, app under `visualizer/`; current known `main` as of this brief: `3e5c7563ce839dd625686bf1a2d52529b9a9bcb3` (the same restored desktop code tree as `57678a4ecd4b797c89696c347e02712a8084a013`, plus documentation-only authority changes).
- Previous failed feature: archived branch **`archive/failed-court-mode-2026-11-10`**, original commit `d19099ce37e2efbfe14fbfcf473b48f8f1ef043e`. **Do not cherry-pick, copy or use its UI implementation as a component/design starting point.** It exists only for historical review/recovery.
- The forward rollback `8e974798518f1b99effe6bfbfd56784103475401` restored the prior desktop code tree. The rollback GitHub Pages deployment [succeeded](https://github.com/PRYYSE/RotationStudio/actions/runs/42744876139). This confirms deployment only, not a new real-device visual QA.
- First do normal **short Git source hygiene**: verify correct repo/worktree/branch/upstream, fetch and safely reconcile; if dirty, preserve rather than reset/clean/stash/force-pull. Use the real repo checkout, not an old copied workspace. No extended archaeology/browser-version investigation.
- **Preserve:** current complete desktop Full Studio, its View/Edit strategy/Strategies workflows, original Set arcs, authored plan JSON and 48 source DRAFT examples, existing export/import compatibility, browser-local strategies/R1/R2 drafts, modern event/ball/pose/animation code, polygon coverage editor and all other accepted desktop enhancements. Do not wipe browser storage or overwrite user-authored tactics.
- Do not author or modify the team's 12 tactical slices here. Separate Normal Chat/owner will review each `R1–R6 × THEY/WE SERVE` slice; future integration uses their approved Markdown and JSON. This is the **software experience** build.

## 2. Hard architectural boundary: independent UI assets, shared simulation

**This is the most important correction.**

**COURT MODE MUST NOT REUSE THE FULL STUDIO'S UI ASSETS, UI COMPONENTS OR STYLING.** Do not import Full Studio buttons, toolbars, card panels, header/nav chrome, strategy sidebars, control strips, CSS classes, colour/type tokens, stylesheets, legacy mobile rendering presets or the old page/component hierarchy to assemble the new workspace. No “slightly rearranged Studio layout,” no narrow-screen rendering of `Rotations`, no multiple stacked desktop-style toolbars, no generic card soup. Merely renaming or restyling the old controls is NOT a fresh Court Mode.

Court Mode must have a **self-contained UI component tree, style scope/design tokens, independent controls/navigation/icon treatment and purposeful mobile-first hierarchy**. Choose a considered volleyball-coaching visual identity: court-dominant, readable on a real phone at practice, visually polished, restrained, not generic blue-grey enterprise dashboard. Natural neutral/dark tones are acceptable if appropriate; don't copy Full Studio palette simply for consistency. Its UX and UI assets should be designed **from the actual owner tasks**, not from the structure of old source JSX or previously generated Work layouts. A source-level check should find no Court Mode imports of legacy Studio presentation components/styles. Shared product naming or external libraries do not invalidate independence, but **UI ownership must be separate**.

**Allowed and encouraged common foundation:** tactical data/state, exact strategy selection/persistence/import/export, opponent/serve cases, timeline/playback semantics, event and ball actors, 3D court/net/ball geometry, player avatars, their true positions/animation poses, camera mathematics and rendering utilities. **Share the actual volleyball simulation, not the application interface.** You may make tasteful improvements to court/players/net/ball quality (player recognition, silhouettes, arm/leg articulation, uniform colour, court contrast/markings, lighting, visual legibility), ideally benefiting both workspaces; keep identity fidelity and performance, and do not regress modern desktop motion or damage Full Studio.

**Animation parity is mandatory:** Current modern desktop movement, poses/gestures and authentic event transitions must appear in Court Mode, with the ball and player actors in sync. Do not call `prefers-reduced-motion` or a performance shortcut to silently remove essential receive, set, spike, block and recovery cues at phone widths. Respect an actual OS reduced-motion user preference, but distinguish optional environmental effects from core coaching animation. Establish this by visual playback, not just code reuse.

### Physically retire legacy mobile UI rather than hiding it

The restored code still includes the **old responsive mobile Full Studio UI** intertwined with `visualizer/src/ui/Rotations.tsx`, `visualizer/src/rotations.css`, conditional `!desktop` React sections, `useDesktopWorkbench` decisions, and some label/render paths. **There is no separable “mobile backend” folder**. Do a **short, careful first code-extraction step**: identify shared engine/desktop-owned functionality, then physically delete obsolete mobile-only *presentation/behaviour* and CSS paths that are replaced by Court Mode. Do not merely hide the old phone UI with CSS or leave it around as the new workspace's alternative layout. Preserve shared model/playback, the improved desktop rendering and Full Studio desktop functionality. There may be a temporary in-code gap while implementing, but the final main/live app must not have a broken default mobile entry.

**Do not treat the old phone UI as design reference** while removing it; it is an anti-example. Avoid a broad desktop refactor or unrelated repository cleanup. Commit the extraction together with, or immediately before, the new working Court Mode so recovery is easy.

## 3. Product use cases: a permanent coaching application, not a tactical-preview hack

1. **Review rotations ChatGPT proposes:** Open an immutable, versioned **exact** rotation/serve/case preview on the **same live application**, play it, inspect positions from any angle, annotate a specific phase, give feedback, and distinguish `FOR REVIEW` from approved tactics. A normal Share View link that drops browser-local edits and silently shows the published example is inadequate. An unavailable review must show a clear error, **never** an unrelated fallback strategy.
2. **Explain to six teammates:** Quickly select an actual **named strategy**, R1–R6 and THEY SERVE/WE SERVE, navigate phases and the full chronological rally, tap a player to show plain Now/Next/If instructions, show route/coverage/ball paths as useful, and minimise distractions.
3. **Use at real practice:** The screen should become almost all 3D court, with legible players, reliable touch navigation, fast phase jump and scrubbing, playback speed, a quick Reset View, annotations and notes, and a genuine screen-filling focus mode usable in portrait/landscape and tablet orientations.

### Strategy access, a previous hard failure

**A full strategy picker is essential.** Not just R1–R6 or a serve toggle. Court Mode must allow selecting the available saved/local/imported/published strategies using the same underlying **strategyStore** as Full Studio, clearly show the active strategy and its local/unsaved/review status, then select rotation and serve **within that strategy**. Switching strategy must change actual court positions/animation and notes context, not just the label. Make it easy to return to Full Studio to edit a strategy without losing context; provide an appropriate import/open workflow if existing user strategies are otherwise unreachable from Court Mode. Avoid claiming cross-device sync for browser-local files.

### Core playback and court interaction

- **One-finger touch:** Free movement/orbit in 3D around the useful court focal point; for preset top/front/side allow sensible movement while respecting perspective, optionally with a readily discoverable free-orbit toggle. Mouse/trackpad also work.
- **Two fingers:** Pinch to zoom **and** pan along the **horizontal court plane**, not accidental vertical fly-through. Zoom/pan must work in every available view; sensible limits prevent losing the court.
- **Reset View in EVERY view:** Immediately restore that view's ideal framing, with a target that fits the current 9 × 9 m tactical area and real viewport. Changing phase, selecting a player, changing orientation or opening a sheet must not arbitrarily erase the deliberate camera pose.
- **Views:** 3D orbit, top, front, side; camera movement should be smooth and responsive, without forced jumps and unwanted automatic orbit.
- **Phases:** Legal start/service contact, receive/dig, set, attack, defence and **later** contacts as the authored scenario actually contains. The user can swipe/scroll phase choices and scrub the complete time axis; Play/Pause/Previous/Next/Restart and speed controls are easy to reach. Don't truncate to only five static stages when real timeline has second dig/set.
- **Focus fullscreen:** Predominantly court; keep just a slim timeline/phase rail and immediately accessible essential playback/reset tools. Secondary information appears on demand in sheets or overlays and can be dismissed. Fullscreen is a coherent interaction mode, not a narrow CSS resize.
- **Player and team focus:** Tap one player to inspect actual responsibilities in the current phase (Now/Next/If); restore team-wide mode quickly. Labels/roles remain readable and attached to their actual players through camera movement, avoiding overlapping clutter.
- **Coaching drawings and writing:** Annotate with fingers or HP Envy Surface Pen 1776, with drawing/arrow/highlight/text/erase, undo/redo and sensible separation of one-finger drawing from two-finger navigate. Scope notes/marks to strategy, rotation, serving team, case, relevant phase/event and source version. Persist safely in the browser; export/import or copy where appropriate. Clearly label that they are **local**, not synced. Do not mutate underlying tactics by annotating.
- **Data/version provenance:** Show whether the displayed scenario is an approved strategy, local draft, published example or versioned tactical review. Never fabricate middle-attack cases or alternate receivers that the data doesn't actually implement. An exact review URL should bind immutable JSON and Markdown rationale assets with integrity/version checks using straightforward static Pages assets; do not require a cloud service or new backend unless actually necessary.

### Adaptive devices and default behaviour

- **Phone:** Court Mode by default; portrait and landscape compositions purpose-built, safe-area aware, usable with Android Chrome browser chrome.
- **Standalone tablet:** Court Mode by default with **true tablet composition**, not a scaled phone.
- **HP Envy x360 Fedora KDE:** Full Studio by default even folded into tablet posture. Court Mode manually available with complete touch navigation, pinch, camera reset and **Surface Pen** annotation. Do not depend on unreliable fold/posture detection.
- **Ordinary desktop/laptop:** Full Studio by default, with a clear switch to Court Mode. User selection persists; deliberate deep link can open Court Mode. Resizing, turning the screen or folding should not unexpectedly change workspaces.
- Both workspaces share the **selected actual strategy, current rotation/serve/case/playhead** where supported; switching must not delete changes, corrupt a local strategy or unexpectedly load a different default scenario.

## 4. Design/implementation method: finish the application, don't create an experiment

1. Inspect only the **minimum** relevant current source to establish where the **desktop simulation** and **old mobile-specific presentation** split. Do **not** rediscover months of project history, build a separate orchestration tool or spend significant usage analysing the failed Court Mode's UI.
2. Define a **distinct compact Court Mode UI system in code** (layout and UI assets) based on the three user journeys. A court-first composition in portrait, landscape and tablet, not the existing desktop/nav/inspector stack. The dominant object should be the actual volleyball court.
3. Remove/rewrite legacy mobile-only UI code as part of implementing the new separate workspace; reuse the correct desktop engine/render state. Any shared rendering refactor must be limited to exposing functionality safely to both workspaces.
4. Complete the **full functional feature**, including real strategy selection, exact data provenance, realistic motion, touch, full focus, annotations and workspace switches. Do not deliver a cheap skeleton with “TODO later” for primary journeys.
5. **One economical acceptance pass** after it exists: existing production build + relevant tests; short real rendered checks of phone portrait/landscape, tablet/HP-sized viewport and desktop Full Studio; specifically check full strategy switch, playback receive/set/spike/block poses, court movement/reset, fullscreen phase rail, annotation save/reload, review URL and browser-local draft protection. Make at least **one deliberate visual-quality critique** of actual renders: if it still looks like stacked website controls or an incomplete mobile app, fix it before publishing. Avoid screenshot/test swarms, exhaustive arbitrary-browser matrices, repeatedly running full suites and fake QA artefacts. Real Fedora touch/pen can be checked if available; state honestly if not.
6. Push complete, verified code to **current `PRYYSE/RotationStudio` main** and verify the existing GitHub Pages deployment, then check the real served URL if browser access permits. The user wants the **existing live app**, not a separate staging app. Preserve a simple rollback path, tidy up temporary dev processes and save a concise code/change handover.

**No need to ask the owner for approval between steps.** Stop and report only a genuine blocking dependency (repository inaccessible, destructive protected-state collision, unsupported missing credentials, or an inability to publish safely). Do not claim devices or a live URL were tested unless they were.

## 5. Minimum acceptance: what must be demonstrably true

- [ ] Old mobile Full Studio presentation code **has been physically retired**, not cloned or used as Court Mode's basis. Failed Court Mode source isn't reinstated.
- [ ] Distinct, intentional **Court Mode UI assets/design system/components**, not imported/imitated Studio controls, styles or mobile markup; Full Studio remains a separate working app workspace.
- [ ] Court Mode is visually convincing at phone portrait, landscape and tablet sizes; court is dominant; no crowded strips of small controls; immersive mode keeps slim accessible timeline/phases.
- [ ] Actual strategy chooser finds/switches **user-saved strategies** and named published/imported plans rather than only R1–R6; changing strategy changes the rendered players/playback.
- [ ] Full modern desktop-quality athlete/ball animations play (receive, set, spike, block, realistic movement), with no mobile-width downgrade silently deleting actions.
- [ ] Touch orbit, pinch, horizontal plane pan and per-view Reset work; accessible on Envy touch/pen as well as handheld.
- [ ] All six rotations × two serve states and every actually available phase/variation can be reviewed without implicitly overwriting user authored data.
- [ ] Notes and drawings can be saved/reloaded, scoped correctly, exported, and do not change strategy source.
- [ ] Versioned review links load **the exact intended proposal**, not fallback V3; missing/bad data fails visibly.
- [ ] Desktop Full Studio editor/strategy library, modern rendering/motion, Set arcs and existing tactics/saves remain functional.
- [ ] Build/tests, one rendered visual quality pass, successful Pages deployment and current actual implementation status are recorded without overclaiming field/hardware verification.

## 6. Durable supporting context

- [Failure/rollback and code boundary report](https://github.com/PRYYSE/Volleyball/blob/main/docs/work-handoffs/COURT_MODE_FAILED_BUILD_RESET_2026-11-10.md). Useful for *why* the old effort failed, **not** a design template.
- [Volleyball team and twelve-slice tactical continuity](https://github.com/PRYYSE/Volleyball/blob/main/docs/rotations/TEAM_TACTICAL_CONTEXT_AND_12_SLICE_HANDOVER_2026-11-10.md). Read for names, strategy-review workflow and limits; do not implement tactical positions in this software task.
- The actual source of truth for code is the **current** `PRYYSE/RotationStudio` Git worktree and its existing desktop strategy/animation implementation. Do not use the archived failed branch or old responsive phone screen as UX inspiration.

**Done means a working, visually purposeful, permanently useful Court Mode shipped on the existing app, plus proof of full strategy access and real animations, without harming the desktop Studio. Not merely a successful compile.**
