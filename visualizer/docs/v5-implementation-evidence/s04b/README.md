# V5-S04B — editable coverage and our-court zoom (29 October 2026)

**Acceptance: PASS — scoped V5 implementation only.** Parent independently tested the UI. No V5 merge, full release UAT, Pages publication or tactical approval.

## Source and behaviour

- Add strictly validated **optional V2** per-athlete, per-stage, shared/exact-case coverage responsibility and later own-serve defence coverage. Roles: receive, tip, block, deep, attack-cover, setter-support, custom. Separate width/depth radii (0.1–4.5 m), offsets (−4.5..4.5 m), metre fields and draggable radius handles. All/Selected/Off and per-player toggles; Reset coverage/Undo. Default approximate zones remain for untouched strategies.
- Coverage zones are explicitly **coach-assigned responsibility**, not measured physical reach, contact ownership, probability or a tactical win claim. Coverage-only edits cannot alter source 48 scenarios, contact times, player positions, ball endpoints or roles. Back-row block prompts COVERAGE/REVIEW.
- Edit mode enables wheel/trackpad/pinch, ± buttons and Fit our court. Camera target is **[0,0,4.5]** on our side. Stage changes retain zoom. During independent testing a **real 390px bug** was found: a 3px canvas-top shift triggered CameraRig's effect dependency on the whole `size` object, resetting zoom. The effect now tracks only `size.width` and `size.height`, eliminating this unwanted refit while still responding to actual size changes.
- A genuine phone screenshot also exposed overlap between the Set arcs/Rotations mode switch and View/Edit/Strategies tabs. A targeted ≤600px CSS adjustment separated them; 390px and 375px Chrome bounding-box checks show **zero overlap and no horizontal scrolling**. No rearchitecture.
- Preserve team roster, V3 plans/generator, original Set arcs and V1/V2 local saved strategies; user's actual V4 browser draft collection was not inspected or modified.

## Verification

- Independent complete **108/108 unit tests PASS**, no failed/skipped/cancelled; log `unit-test.txt`. Independent Pages-base **production build PASS**, log `build.txt`. Existing large JS chunk advisory is non-blocking.
- Independent real Windows Chrome 1440×900 and 390×844 **11/11 browser journeys PASS**: Harry tip coverage with separate 3×1 metre ellipse and signed offsets, role warning/one-step undo, independent Georgia rightward placement, exact case inheritance, overlay toggle states, desktop and mobile zoom in/out/wheel/pinch/stage retention/Fit target, draggable X/Z radius handles and one-step undo, own-serve first and later defence coverage isolation, mobile athlete and target drag still working, responsive court/sheet and no label bleed, save/reload, original Set arcs, zero JS exceptions. Raw `browser-result.json` and `browser-test.txt`; screenshots `desktop.png`, `phone.png`.
- Separate real Chrome 375/390 header non-overlap checks PASS with measured bounding rectangles. Evidence: `header-test.txt`, `header-375.png`, `header-390.png`.
- Repeatable harnesses `visualizer/tests/strategyS04B.browser.mjs` and `strategyS04B.header.browser.mjs`; each uses a private Chrome profile. During UAT the initial harness imported a **stale, non-HMR-versioned dev-server Zustand store**; it now discovers the exact module URL used by the real app from Vite's transformed editor import. The first run's false null-state reading is not treated as a product defect. Another harness assertion originally entered Georgia's existing X=2.8 and incorrectly expected a new override; revised to an actual X=3.4 movement. Both harness issues fixed and rerun.
- New CSS fix separately built after the 108-test suite; `build.txt` is that final Pages-base build. `protected-hashes.json` and clean protected-source diff establish unchanged V3 team, rotations and generator. No personal/browser V4 data was used.

## What this does not verify

- Physical Android/iOS device, actual human reach, on-court foot positions or teammate tactical approval. All team strategies remain **DRAFT**.
- New S07 all-event keyframe editing, distinct first/second R1 own-serve receptions, moving phase buttons, Edit preview without exact scrubber, View quick camera switch and shuffle are **not implemented in S04B**. S05 local library/reference and S06 readable poses are also future implementation slices.
- Independent full V5 UAT and public deployment need the later user-gated stages; this report only accepts S04B.
