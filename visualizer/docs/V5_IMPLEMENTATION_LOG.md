# V5 implementation ledger

**Authorised phase:** implementation on feature/strategy-studio-v5 only. Public V4 main stays at a8b6698262ef5009484ffd66ec243dafdd3552f1. This ledger is software evidence, not on-court approval.

## S01: Sparse strategy V2 and migration - PASS (29 October 2026)

- Capability: V2 sparse draft with shared/exact-case overrides, whole-route array precedence, V1 JSON/URL migration, guarded v1 backup/v2 localStorage writes, notes validation, case undo/reset, and opt-in later own-serve Defend-again.
- Source review: only strategy data/overlay/store and dedicated tests changed; the original Set arcs, published V3 team/rotation plan JSONs and tactical author generator were not modified. Original SHA-256 baselines remain in D:\Projects\RotationStudio-V4\.cache\browser-qa\V5-protected-source-baseline.json.
- Verification: focused 23/23, full npm test 87/87, npm run build -- --base=/RotationStudio/ PASS (existing bundle size advisory). Dedicated Chrome tests/strategyV2.browser.mjs PASS: V1 backup left untouched, migrated saves and reload, controlled case/later edits, file+fragment preview/save copy, zero browser JS errors. Existing V4 full Chrome suite PASS: all 48 variants, real 3D drags, undo, saving/sharing/import and responsive 1440/390/375/768/844x390 plus Set arcs. Git diff --check PASS.
- Populated V4 overlay output compatibility SHA-256 d54b27471747c2723c88d1b42af024d2926c170972d32d07d847bfad467b6b7d.
- Code: src/lib/strategyDraft.ts, strategyOverlay.ts, strategyLibrary.ts; src/state/strategyStore.ts; focused V2 test files and tests/strategyV2.browser.mjs. Full receipts in .cache/browser-qa/V5-S01-run.log and .cache/v5-s01-browser/.
- Scope boundary: Case/later-defence store APIs are ready; visible scope controls, editor path display and impact review deliberately belong to S04. No tactical match approval or referee-foot certification.
- Next planned: S02 deterministic case projection; S03 court-first viewer; S04 visible editor; S05 local sharing/team reference; S06 restrained animation. Stop after implementation completion; independent full UAT and release require separate user continues.

## S02: Deterministic source-backed case review - PASS (29 October 2026)

- Pure review modules in src/lib/caseReview.ts, reviewTypes.ts, reviewFindings.ts, reviewGeometry.ts and coachProjection.ts; receiveExample.ts only exports the original movementIssue screen without changing its formula. No UI, V3 plans or Set arcs edits.
- Includes all 48 authored cases; five stage meanings; six-player front/back eligibility separate from named setter/hitter and physical readiness; authored/user-coach-note provenance; actual path/interval/metres, case-difference and V3 ghost comparison; detailed grouped INVALID/CAUTION/REVIEW findings without invented probabilities.
- Provides createReviewModel(published,draft) to precompute modelled bundle and full warnings exactly once, then project(context) for fast stage/player changes. S03 MUST memoise this precomputation by immutable [published, draft] object identity. The convenience createReviewProjection is intended for one-offs, not render loops.
- Codex scoped suite 9/9 PASS; full npm test 96/96 PASS; npm run build -- --base=/RotationStudio/ PASS (existing chunk advisory); git diff --check and diff vs protected V3 plans, generators, UI/scene/store PASS. No physical match approval.
- Note: long matrix tests motivated precomputed model approach, not a change to source tactical movement thresholds. Independent visual/product UAT remains a separate user-authorised phase.

## S03: Court-first viewer, Player Focus and Scenario Explorer - IMPLEMENTATION PASS (29 October 2026)

- UI: real SetOptics court-first viewer, accessible six-player focus and source-backed role/fallback, non-occluding first-ball Scenario Explorer, projected collision-aware names, stable View/Edit selection and stage context, responsive desktop/tablet/phone/landscape. Set arcs remains intact.
- Codex checks: npm test 98/98 PASS; Pages-base production build PASS. Real Windows Chrome test PASSED 30 viewport/performance records across 1440x900, 390x844, 375x812, 768x1024, 844x390 and repeated live resizes. All nine sample-cell interactions, focus/keyboard/touch/player-selection, actual 3D court click, stage/playback, Set arcs, no page exceptions. 40-stage-click probe observed no redundant audit/model recomputations, maximum DOM update 23 ms in headless Chrome (not physical-phone benchmark). Browser report and source-code details in the D:-drive .cache/v5-s03-browser/implementation-summary.md.
- Independent implementation review: looked at real browser screenshots; discovered a small phone visual defect with the stage cue painting over the Player Focus sheet. Fixed only mobile CSS to hide the duplicate cue because the selected stage and actor are already represented by pinned marker and focus panel. Rebuilt and reran npm test 98/98 PASS; direct Windows Chrome at 375, 390, and 1440 verified responsive cue visibility, five stage buttons, no horizontal overflow and a clean 375 screenshot. Desktop cue remains visible.
- Protected original team/rotation plan hashes and tactics generator unchanged; src/state, sparse drafts, stage/case overlay and original Set arcs are untouched by S03. No production deploy or match approval. Earlier transient Chrome reload timeouts were followed by a passing full 30-record run, not hidden or treated as success.
- Representative screenshots and structured evidence are in docs/v5-implementation-evidence/s03, with complete Windows-only test receipts and captures retained under .cache/v5-s03-browser and .cache/browser-qa. This is implementation slice verification, NOT the separate user-authorised independent full V5 UAT.
- Next: S04 case-aware editing and Impact inspector; then S05 sharing/team reference and S06 bounded role animation. Do not publish V5.
