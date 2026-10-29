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
