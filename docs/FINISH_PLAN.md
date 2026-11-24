# RotationStudio finish plan

**Current software delivery authority: 25 November 2026 (Adelaide).**

**Goal:** Finish a polished volleyball coaching application that is easy to learn, pleasant to operate and trustworthy with people's plans. Preserve the functioning simulation and editor while completing the experience around them.

**Architecture:** One existing GitHub Pages application with two deliberately designed workspaces: Full Studio for authoring, Court Mode for demonstrating and practising. They share strategy data, simulation, court, actors and playback; each owns its presentation. Continue the current React/TypeScript/Vite, React Three Fiber/Three.js and Zustand implementation.

**Delivery:** Four substantial software slices, each with a complete build pass and a fresh independent review. Work in cloud Work/Codex. The old Windows/Fedora orchestration controller is retired from the active delivery path. This document contains the product specification, implementation plan and working prompts; do not reconstruct a competing plan from historical briefs.

**Starting point:** Reconciled app `main@785f762101f63b217b9ddb0ecd198313235701a8`. Court Mode shipped in `6b9a556bb26ba9c84012b56a01cdf15a73ea5aa0`; the private interrupted-build warning was stale. Fresh cloud baseline: 199 tests pass and production build passes. These facts do not establish owner acceptance. Fetch current main at execution time rather than pinning future work to this old commit.

## 1. What the finished product is

### Full Studio: plan and edit

A coach selects a named plan, rotation and serving side, chooses a meaningful moment, selects an athlete and drags them into place. Connecting movement is automatic. Optional tools adjust that athlete's incoming route, action and responsibility area. One gesture is one Undo step. The coach can play the whole rally, compare with the source, save a separate plan, reopen it and share it safely.

The default remains **stage → athlete → move → automatic path**. Show only the selected athlete's incoming previous-to-current path; select the next moment to edit the next segment. Additional authentic moments remain available. A professional multitrack/keyframe workstation is outside the default product.

### Court Mode: demonstrate and practise

A teammate opens the actual named plan or exact review and immediately understands the rotation, serve and current moment. The real court dominates. They can play or jump through the complete rally, identify a player and read concise Now/Next/If guidance, change/reset the camera, enter focus view, and add recoverable drawings or notes.

Phones and standalone tablets default to Court Mode. Desktop/laptops, including a convertible laptop, default to Full Studio. An explicit choice persists, deliberate deep links work, and resizing or folding does not switch workspaces. Both remain available on every device. The current Court implementation is a functioning foundation to improve, not a missing feature to rebuild.

### Plans and teaching material

Plan selection, creation, copying, editing and sharing form a coherent journey. Published examples, local drafts and versioned reviews are visibly different when that distinction matters. A same-named saved copy cannot masquerade as the latest published plan. A review opens its exact source, edits, moment and rationale; unavailable or invalid data shows a useful error. Sharing never silently replaces the recipient's work. Useful spatial references print on A4. Original Set arcs remains available and functional.

The application remains hosted and browser-based. An app-like result comes from composition, direct manipulation, responsive feedback and complete interaction states. This work does not require native packaging, accounts, a new backend, automatic cloud sync or a new physics engine.

### Definition of done

- All three journeys work end to end on the accepted candidate, including unsaved, empty, loading, failure and recovery states.
- Actual rendered screens and moving rallies meet the design and interaction criteria below. A build or screenshot-existence check cannot accept visual quality.
- No known material defect remains in scope. Minor optional ideas are recorded separately and do not create endless polishing.
- Existing source cases, user drafts/imports, annotations, Set arcs and attribution survive.
- The independent reviewer records the exact reviewed commit and evidence. The existing Pages site is verified after release.
- Software readiness and tactical/team approval are reported separately. The app is not declared aesthetically owner-accepted merely because an agent approves it.

## 2. Design direction to implement

**A dedicated coaching instrument, with the court as the primary working surface.** This is the proposed art direction for the finish, not a claim that the owner has already accepted its pixels.

| Area | Required design decision |
|---|---|
| Studio composition | One concise plan/scenario context bar, a stable court workspace, one contextual inspector and one compact playback/event rail. Consolidate repeated context and status. |
| Court composition | Minimal strategy/scenario header, court-first stage, reachable playback, purposeful sheets. Deliberate portrait, landscape and tablet compositions. |
| Plan library | A real plan-selection/management surface with a clear normal action. Replace the ad hoc special-plan button and equal-weight action pile. Preserve all useful operations. |
| Type | A readable working sans and a small, consistent hierarchy for task, control and secondary metadata. Numerals align where helpful. Avoid tiny metadata and paragraph-heavy controls. |
| Colour and surfaces | Restrained sports identity, clear working surfaces, strong current/selected/focus states, colour that distinguishes players and actions. Avoid generic glow, decorative gradients and repetitive bordered cards. The two workspaces retain separate presentation ownership. |
| Copy | Use actual task language such as Team plan, Save a copy, Saved on this device and Import plan. Put hashes, schema/source diagnostics and implementation vocabulary in details. Preserve necessary review/local-data truth. |
| Player information | Identity and the current coaching action lead. Now/Next/If is concise and grounded in the selected scenario. Do not replace missing tactics with invented instructions. |
| Court and actors | Legible identities, sensible default framing including the server, useful layers and recognisable motion. Improve materials/lighting only when they improve clarity; retain performance and truthful geometry. |
| Interaction | Clear hover/pressed/disabled/keyboard-focus states; usable touch targets; feedback near the action. Manual moment selection is instant; Play alone animates the rally. |
| Failure states | If WebGL cannot initialise, present a useful recovery/help state instead of an apparently functioning interface around a blank court. Storage, import and review failures preserve existing work. |

The initial live-shell audit found competing context strips, repeated generic coaching text, developer-oriented terminology and overloaded strategy sheets. Its browser had WebGL disabled. Subsequent [hosted candidate evidence](https://github.com/PRYYSE/RotationStudio/actions/runs/45506394806) rendered the real court and Set arcs successfully. Actual images also confirmed a material phone layout bug: loading the longer R1/R3 plan makes the app wider than a 390px viewport and crops controls/players. They also show weak label-to-player association and small-screen framing. These are explicit S1 priorities; technical capture success is not visual acceptance. Use actual 3D-capable candidate evidence for design decisions and motion review.

## 3. Global constraints

1. Keep the real SetOptics-derived application, its licence/attribution, shared domain/3D foundations and original Set arcs. Do not run the unrelated Python/video setup for visualizer work.
2. Preserve the Team V3 source generator and all 48 original authored DRAFT cases. Preserve published strategy files and owner-authored references. Software work does not silently redesign tactics.
3. Never clear personal browser storage, reset/clean/stash away work, overwrite original drafts or test in a personal signed-in browser profile. Use isolated cloud test contexts and fixture copies.
4. Preserve V1/V2 strategy compatibility, current 1 MB bounded strategy support, exact-case editing, occurrence-specific later contacts and safe recipient previews.
5. A coaching pose/position change does not silently transfer real ball ownership. Any explicitly authored contact change must stay consistent with actors, endpoints and instructions.
6. Keep Court presentation independent of Studio presentation; share simulation and technical utilities. Do not reinstate the archived failed Court UI or remove essential motion at phone widths.
7. Use existing project commands and small focused regressions. No general refactoring, new controller, task daemon, polling loop, paid API integration or local autostart.
8. Cloud is the execution default. Fedora is an optional explicitly chosen fallback; Windows remains outside this workflow. Stop owned preview/test processes when the task ends.
9. Retain the requested final Unslop pass with a restorable backup in S4. It is bounded product work, not another orchestration system.

## 4. Four implementation slices

These are delivery units, not limits on internal commits. Each builder completes the whole listed outcome before handing it over. Setup and fixes that the outcome requires stay in the same slice.

| Slice | Builder | Independent reviewer | Why this starting configuration |
|---|---|---|---|
| **S1: Application experience** | **GPT-6.2 Astra, High, Fast** | **Astra, High, Fast** | The unresolved work is design judgement across an existing 3D application, not straightforward styling. |
| **S2: Motion and spatial editing** | **GPT-6.2 Astra, High, Fast** | **Astra, High, Fast** | Camera/input/pose/event interactions require cross-component spatial reasoning. |
| **S3: Plans and connected journeys** | **GPT-6.2 Sol, High, Fast** | **Astra, High, Fast** | Much of the behaviour is specified and already implemented; Sol is the efficient implementation default. High reflects the combined persistence/review scope. |
| **S4: Integrated finish and release** | **GPT-6.2 Astra, High, Fast** | **Fresh Astra, High, Fast** | Whole-product judgement, remaining integration fixes and final rendered comparison. |

Use Fast while the owner's displayed account offer applies; check the picker rather than assuming API Priority or Ultrafast is included. Medium is sufficient for clearly bounded repairs. Extra High is an escalation for a named unresolved difficult problem, not the default for every task. Model evidence and limits are in [MODEL_POLICY.md](MODEL_POLICY.md).

### S1. Complete the application experience

**Deliverable:** A coherent redesign across Studio View, Edit, Plans and Court Mode, including their primary panels, states and playback. Carry the design through the existing product in one substantial pass.

**Primary files:** `visualizer/src/StudioApp.tsx`, `ui/Rotations.tsx`, `ui/StrategyLibrary.tsx`, `ui/DesktopAthleteEditor.tsx`, `ui/DesktopEventRail.tsx`, `ui/RotationPlayback.tsx`, `ui/PlayerFocus.tsx`, `desktop-courtline.css`, `rotations.css`, `court/CourtMode.tsx`, `court/CourtSheet.tsx`, `court/CourtPlayback.tsx`, `court/CourtStrategyPanel.tsx`, `court/court.css`. Paths after the first are relative to `visualizer/src/`. Touch scene failure handling only as required by the explicit WebGL gap.

- [ ] Implement the design direction and complete normal, empty, unsaved, selected and error states. Simplify information placement and actual control anatomy, not just colour/spacing.
- [ ] Make selecting a plan, changing scenario, identifying a player, entering Edit and returning to Court understandable without explanatory paragraphs. Keep every existing useful operation reachable.
- [ ] Keep the court and six identities usable at 1440×900, a representative ultrawide, 390×844 phone, 844×390 landscape and 1024×768 tablet. Use real content, the longer R1/R3 plan title and one dense sheet/editor state. Fix the confirmed named-plan whole-app horizontal overflow and verify controls remain reachable after plan/scenario changes.
- [ ] Inspect matching before/after candidate screenshots and perform the two core journeys. Correct obvious visual failures before review. Reuse existing automated checks; add tests only for new behaviour/failure handling.

**Acceptance:** The independent reviewer can select a real plan, find rotation/serve, find an athlete's immediate job and discover stage-first editing without reading a developer guide. Screens are consistently composed and no longer rely on repetitive plain-text scaffolding. No functional/data regressions. One consolidated review includes all touched screens, not a separate review per component.

### S2. Complete motion, camera and simple editing

**Deliverable:** Convincing, source-true teaching motion and reliable direct authoring throughout the complete rally.

**Primary files:** `visualizer/src/three/RotationPlayer.tsx`, `RotationLabels.tsx`, `RotationCameraRig.tsx`, `DesktopStrategyRoute.tsx`, `StrategyCoverage.tsx`, `RotationScene.tsx`; `lib/rotationPose.ts`, `rotationModel.ts`, `strategyEvents.ts`, `strategyOverlay.ts`; `state/rotationStore.ts`, `strategyStore.ts`; `court/CourtCamera.tsx`, `CourtInk.tsx`, `useCourtLabelGestures.ts`; relevant current `.test.mjs` and browser tests. Use existing interfaces and event identities; avoid replacing the engine.

- [ ] Resolve actual block-turn/too-fast-pose defects and discontinuities in receive/set/attack/block/recovery. Show credible approach, contact and recovery cues without changing approved positions or inventing a different ball outcome.
- [ ] Finish stage placement, incoming-route bends, actions and ellipse/polygon coverage as connected operations. Preview during drag, commit once, Undo once; edits remain scoped to the chosen event and case through save/reload.
- [ ] Preserve deliberate camera framing through playback and panel/orientation changes; keep default server/athlete framing legible. Check Top/Front/Side/Orbit reset, pinch/pan, label-start gestures and drawing/navigation separation.
- [ ] Check first and later digs/sets, both serve orders, normal/Harry-first and left/right cases. Ball actors, endpoints, visible poses and coaching instructions must agree. Existing contact-edit semantics must remain explicit; do not imply arbitrary alternate rally simulation.
- [ ] Add focused regressions for corrected failures and watch representative full-rally playback. Software-renderer results are not a hardware FPS or Surface Pen claim.

**Acceptance:** One real edit-to-replay-to-save journey preserves another case and later moment; one-gesture Undo works. Full rallies have no known material animation/camera/input defect. The reviewer watches motion and performs interactions, rather than accepting static frames alone.

### S3. Complete safe plans, reviews and teaching handoff

**Deliverable:** A coach can create/edit/back up/share a plan and a teammate can open the intended version, understand it, annotate it and use a readable reference.

**Primary files:** `visualizer/src/ui/StrategyLibrary.tsx`, `ShareButton.tsx`, `TeamReference.tsx`, `PlayerFocus.tsx`; `lib/strategyDraft.ts`, `strategyLibrary.ts`, `strategyShare.ts`, `courtReview.ts`, `playerFocusStory.ts`, `teamReference.ts`; `state/strategyStore.ts`, `useStrategySimulation.ts`; `court/CourtStrategyPanel.tsx`, `CourtSharePanel.tsx`, `CourtPlayerPanel.tsx`, `CourtNotesPanel.tsx`, `courtNotes.ts`, `useCourtReview.ts`; existing strategy/review/reference tests.

- [ ] Complete create/copy/rename/save/delete and plan-switching states, including unsaved edits, same-named local versus published plans, invalid imports and unavailable storage. Preserve the original on failure.
- [ ] Round-trip representative V1, V2 and larger current plans, event coverage and explicit contacts. Open shared/review data in an isolated recipient context without replacing that context's saved plan.
- [ ] Exact reviews bind the intended data, time and rationale; invalid/missing assets fail clearly. Provide the existing file route when a reliable share link is too large. Do not promise live cross-device sync.
- [ ] Complete note/ink source-and-event scope, reload, import/export and workspace switching. Source changes cannot attach an old note to an unrelated tactic.
- [ ] Refine grounded Now/Next/If and existing A4 spatial reference. Check the actual print output and an unfamiliar-user teaching journey. Do not reimplement the already shipped G4 features from stale October notes.

**Acceptance:** One complete creator-to-recipient journey succeeds, plus one deliberate invalid-review/import/storage failure without data loss. The recipient can tell what plan/version they are viewing and which player action is relevant. Printed reference is spatially useful and legible. Unsupported tactical variations remain visibly unavailable.

### S4. Integrated finish, final visual audit and release

**Deliverable:** The whole product is independently reviewed, material findings are resolved, and the accepted candidate is deployed on the existing site.

- [ ] A fresh reviewer runs the complete coach and teammate journeys against the exact candidate, covering both workspaces, dense/sparse states, meaningful keyboard/touch operation, save/share/notes/print and Set arcs. Use the public [software requirement coverage](REQUIREMENT_COVERAGE.md) for self-contained software review, not a separate test script per ID. The private [full crosswalk](https://github.com/PRYYSE/Volleyball/blob/main/docs/ROTATIONSTUDIO_REQUIREMENTS_CROSSWALK_2026-11-25.md) additionally preserves team/tactical requirements; private access is not required to finish the software slice.
- [ ] Resolve one consolidated prioritised findings list. Further review is limited to changed areas and genuinely affected integration paths. Escalate a continuing root-cause failure; do not bounce small questions to the owner.
- [ ] Before the previously requested `$unslop` pass, create a pushed restorable pre-polish commit/tag or recovery branch and matching screenshots. Install/use the official `heydamir/unslop` project-local skill in the cloud. Apply its audit to every actual user-facing mode; allow light/no change where appropriate. Preserve the chosen design, useful controls and source truth. No paid image generation or story video.
- [ ] The same independent reviewer inspects final matching renders and affected journeys after polish and signs the exact final post-polish commit before release. If that reviewer is unavailable, use a fresh reviewer for those changes; never release an unreviewed polish commit. Existing data tests cover all 48 baseline cases; visually sample full rallies/known difficult cases instead of screenshotting every permutation repeatedly.
- [ ] Run the final relevant suite and Pages-base build on the accepted source. Merge normally, verify the existing Pages deployment and actual served application, retain rollback and a concise release record. Stop owned temporary processes.

**Acceptance:** No material unresolved in-scope software or visual defect. Exact candidate, checks, reviewed images/journeys, deployment and limitations are recorded. Owner taste feedback and physical device/real-court validation are named honestly if still outstanding; never relabel them as passed.

## 5. Tactical work remains visible

The software plan does not erase the team's unfinished playbook. Current personalised preset contains R1 and R3. R1 was called usable; R3 v4 still needs owner review. Its last change affected two receiving-right cases, not every R3 branch. R2/R4–R6 remain unfinished personalised tactics.

The latest recorded tactical sequence is **R3 review → R2 both serves → R4–R6 together when directed**, preserving accepted R1 and the owner's original R1/R3 source exports. The earlier twelve-individual-check-in timetable was superseded. Team-specific facts and rationale stay in the private `PRYYSE/Volleyball` repository. Do not infer tactical approval from this software plan or publish private player assessments in the public app repo.

App completion can proceed while this decision is outstanding. A final report must distinguish **software finished** from **the entire personalised team playbook accepted**. If the latter is requested, finish the tactical sequence and integrated branches rather than checking off T01–T24 from software tests.

## 6. Simple cloud workflow

### One-time environment

Choose **Work in → Cloud** in Codex (or an equivalent cloud Work task), using `PRYYSE/RotationStudio`. A reusable environment is convenient, not a new project prerequisite. The public app repo contains everything required for software slices. Add private `PRYYSE/Volleyball` only for authorised coordination/tactical work; never copy its private context wholesale into this repo.

Use Node 22 and `npm ci` in `visualizer`. Install Chromium/Playwright and dependencies only when needed for repeatable browser evidence; the provided GitHub candidate workflow is an off-device fallback when the task browser cannot render WebGL. No API key, personal browser profile, local bridge or controller is needed. Do not use root `setup.sh` for this app.

```bash
cd visualizer
npm ci
npm test
npm run build -- --base=/RotationStudio/
```

The actual cloud environment must be selected/published through the account UI if it is not already available. Repository configuration is not proof that an account-level environment was published. Start a preview only while working; terminate it afterwards. Cloud compute may continue during an intentionally running task even while the owner's computers are asleep.

### Per slice

1. **Builder:** reconcile current branch/remote, read this plan and `docs/FINISH_STATUS.md`, complete the full slice on one branch, run focused checks while iterating, produce one candidate with evidence. Commit/push recoverable progress before a limit/interruption.
2. **Independent review:** a fresh reviewer uses the exact candidate, the slice criteria and rendered product. Review code, tasks, data preservation and design together. One prioritised findings list includes reproduction and expected result. Do not review public main in place of a newer feature candidate.
3. **Repair and close:** the builder handles the consolidated list in the same task/context. The reviewer rechecks the corrected paths. No replanning chat for routine fixes and no reviewer per button. After accepted review, merge/deploy the coherent slice under the existing publication authority and update the status once.

Use a fresh reviewer subagent inside the cloud task when supported, so the owner can start one task per slice. If that surface cannot provide independent review, use one separate review task with the short prompt below. Do not build software to relay prompts between chats. The planned budget is four main deliveries with one substantial review apiece; a genuinely blocked review is not hidden to meet a numerical target.

### Evidence and stopping rule

The ordinary final evidence is existing tests/build, a small representative image set, real task/motion observations and source preservation checks for touched boundaries. Hosted screenshot capture is evidence collection; someone must inspect it. Stop when acceptance is evidenced. Re-run a passed check only after a relevant change. Do not claim remaining quota or completed background work without actual evidence.

Record one row per slice in `docs/FINISH_STATUS.md`: candidate, model/effort/speed, elapsed time if available, usage if exposed, material findings, repair rounds, acceptance and release. This is enough to improve model choices using real project data; no duplicate implementations solely to benchmark models.

## 7. Copyable task prompts

### Build a slice

```text
Work only in the cloud on PRYYSE/RotationStudio. Read AGENTS.md,
docs/FINISH_PLAN.md and docs/FINISH_STATUS.md. Complete S1 in one
substantial pass from current main, preserving the protected source/data.
Use GPT-6.2 Astra, High reasoning, Fast while my displayed offer applies.
Build the full working experience, inspect actual candidate renders and
fix your own findings. Use one fresh Astra High independent reviewer
for the whole slice, then resolve its consolidated material findings.
If independent subagents are unavailable, stop at a pushed candidate
with the exact review prompt and evidence. Do not claim self-review is
independent. Keep changes recoverable in GitHub, follow the plan's
acceptance/release rules, and stop temporary processes when finished.
No local controller, personal computer work, paid API or tactical rewrite.
```

For S2–S4 change the slice ID and use that row's model. The task must verify whether the picker actually allows the requested setting; a prompt is not evidence that the model changed.

### Separate reviewer, only when needed

```text
Independently review S1 in PRYYSE/RotationStudio at the candidate
commit recorded in docs/FINISH_STATUS.md. Use the exact candidate,
docs/FINISH_PLAN.md and the linked evidence. Inspect the actual app,
including its rendered 3D court, and perform the complete slice journeys.
Assess design, interaction, correctness and preservation in one review.
Return one prioritised list with reproduction and expected behaviour,
or PASS with exact evidence and honest limitations. Do not accept the
builder's summary as proof, redesign unrelated scope, or approve tactics.
```

## 8. Authority and supporting records

This plan supersedes the old local automation blueprint, Windows transport/login gates, mobile deferment and stale interrupted-Court recovery task. It consolidates the earlier G1–G6 engineering delivery order; it does not delete original requirements, source evidence or tactical approval boundaries.

The private reconciliation maps all **69 original user requirements, 26 separate reviewer findings and nine grouped later Court Mode requirements** to these slices. Conditional ideas such as arbitrary intermediate keyframes remain conditional; they are not converted to compulsory features. Current product evidence and owner corrections outrank historical completion labels.

Useful current code references: [Court implementation](../visualizer/docs/COURT_MODE_IMPLEMENTATION_2026-11-10.md), [desktop change history](../visualizer/docs/DESKTOP_REWORK_CHANGELOG.md), [model policy](MODEL_POLICY.md), [current finish status](FINISH_STATUS.md).
