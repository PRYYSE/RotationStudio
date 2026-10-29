# S07C - source-backed Shuffle Play implementation checkpoint

**Date:** 30 October 2026. **Branch:** `feature/strategy-studio-v5`. **Status:** S07C implementation accepted (code/unit/build and scoped independent browser checks). This is **not** the independent full-V5 UAT, published release, or tactical/on-court approval.

## What is implemented
- The View screen offers **Shuffle On/Off**, **Next variation**, a seeded case **History**, the exact R/serve/case/first-touch source label, and opt-in `Play shuffle`.
- Cycling selects only the **four original authored variations** for the current rotation and serving team. No invented receiver, ball contacts, probability, opponent physics or adaptive training claim.
- Playback follows each actual source trajectory to its final frame before returning to time zero for the next authored case. Off or manual navigation stops it cleanly. Entering Edit, Strategies, Set arcs or hiding the page disarms it.
- All actions are transient viewer state: they do not write to the saved V1/V2 strategy library, working editor draft, undo history, or 48 source scenarios. All plans remain labelled DRAFT / Needs review.

## Acceptance evidence
- **153/153 unit tests PASS**, zero failures/skips; combined Shuffle/motion/store tests 29/29 PASS. Source: `V5-S07C-final-tests.txt`.
- GitHub Pages-base production build PASS: `V5-S07C-final-build.txt`. The private preview returned the real JavaScript asset with proper MIME (rather than HTML fallback).
- Original team.json, rotations.json and author_tactics_v2.py hashes all match prior protected baselines: `V5-S07C-protected-hashes.json`.
- Independent host-launched **Thorium 156 AVX2** Puppeteer checks PASS: seed history and four unique source variations, exact first-touch ownership, unchanged R/serve; automatic playback, Off stop, strategy storage invariance; Edit and Strategies disarming; 390x844 and 844x390 real WebGL court and usable controls without horizontal overflow; invalid teaching-sample skip and source disclosure; original Set arcs entry and return; **zero JavaScript page errors**. Detailed result: `V5-S07C-browser-result.json`.
- Screenshots reviewed: `V5-S07C-desktop-next.png`, `V5-S07C-desktop-playing.png`, `V5-S07C-390x844.png`, `V5-S07C-844x390.png`, `V5-S07C-invalid-skip.png`.
- The original Set arcs first-run onboarding tutorial initially blocked a return-path test assertion. The private browser QA script was corrected to dismiss its existing `Skip` button and then **all checks passed**, without changing any application source. `V5-S07C-set-arcs.png` depicts that first-use tutorial, **not** an unobstructed Set arcs scene. The repeatable, host-independent browser script is `visualizer/tests/strategyS07C.browser.mjs`.

## Boundaries still open
- **Implementation-complete checkpoint only:** after this verified commit, do not merge `main` or publish the GitHub Pages site without a separate user's explicit approval.
- The separate **independent full V5 UAT** must re-exercise the entire application and old V4 regression paths, including detailed browser-local V1/V2 migration, S05 link/share fallback and print, phone drag/zoom, S06 performance and visual motion, S07B all-event playback, save/reload and keyboard/pointer accessibility, and original Set arcs.
- The owner's real **V4 R1/R2 edits** still live in their browser until exported; their tactical meaning should be reviewed **after** V5 release and a separate user-authorised acquisition/review. Do not fabricate edits or approve match tactics.

The existing public V4 release and all protected tactical source files were unchanged by this slice.
