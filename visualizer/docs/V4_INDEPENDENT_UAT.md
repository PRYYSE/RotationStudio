# V4 Independent UAT — 29 October 2026

Status: **PASS — SOFTWARE / BROWSER UAT ACCEPTED, PENDING PUBLIC PAGES VERIFICATION.** Tactics remain DRAFT and are not approved match instructions. The original V3 source geometry and Set arcs remain protected. This review is by Normal Chat independently from Codex, on Windows via real locally rendered Chrome, not code-only or Codex self-attestation.

## Test host and branch
- Windows authorized desktop, genuine `PRYYSE/RotationStudio` worktree `D:\Projects\RotationStudio-V4`, branch `feature/strategy-studio-v4`, initial checkpoint `163bb1a`.
- Vite served `http://127.0.0.1:5173/` from the V4 source on D:, Puppeteer-core/Chrome QA profiles and screenshots under `D:\Projects\RotationStudio-V4\.cache\browser-qa`.
- No live publication or changes to source V3 timeline data are permitted until independent UAT gates pass.

## Verified user journeys

1. **All six rotation phases, both serve owners:** independently operated R1–R6 × They/Us serve via actual UI buttons (12 combinations). Verified Receive, Attack and Defend navigation against exact underlying first-contact/hit/defence-ready timestamps (36 assertions). Verified correct five-button order, with Start→Defend→Receive→Set→Attack on our serve and Start→Receive→Set→Attack→Defend on their serve. All passed.
2. **All 48 tactical choice selections:** in each of 12 base states switched opponent attack left/right and normal/Harry-first combinations (48 choices). Active scenario and availability of ball tracks remained coherent; zero JavaScript page errors in this matrix.
3. **Desktop editing at 1440×900:** real pointer drag of Caleb at Receive, add/drag route bend, selected setter target drag, Harry/Logan/Georgia Set positions; undo/redo one gesture at a time. Name tags, colour codes and panel control positioning were visually inspected. Target worked in a separate focused mouse test with actual projection, changing setter target X1.55/Z1.05→X2.31/Z0.88.
4. **Persistence/share:** Save→change rotation→reload→same edits; independent duplicate, confirmation/cancel for delete, upload JSON as a separate preview, Save a copy, shared fragment link preview and Save a copy; confirmed via actual browser flow. The only shared-page test failure was test harness reading state *before app hydration*; fixed by waiting for ready/preview. The original app worked on hydrated shared page.
5. **Negative edits:** moved R1/Us serve Harry P1 inside baseline (Z8), saw meaningful validation notices (9 variant violations) rather than silently declaring legal; Reset stage returned to baseline (one default review notice). Edited R1/They Caleb Start, switched to R2 and back; R1 override preserved and R2 untouched.
6. **Direct phone viewport:** entering Edit on a fresh 390×844 browser loads all six avatars, all five visible 44px editor-stage buttons, a court with 390px width, and a vertically scrollable panel. Tablet/normal View at 768 and desktop View at 1440 also rendered without JavaScript errors. Current baseline 73 unit tests and production build were verified by Codex's last run; rerun after remediation.

## RELEASE-BLOCKING BUG UAT-01: desktop→phone viewport change breaks edit court

**Reproduction:** Fresh Chrome page at 1440×900 → Edit strategy (3D court and editor panel appear) → `page.setViewport({width:390,height:844})` (equivalent to desktop window shrink / responsive viewport change) → choose Receive and selected athlete. NO reload. At 390px viewport, JS DOM metrics show:
- `main.rotations` width **390px**; overall body `scrollWidth=390` masks the issue;
- `.rotation-canvas` width remains **1085px**, left 0;
- Three.js `canvas` remains **1085px** wide;
- `.strategy-panel` becomes **1069px** wide despite viewport=390;
- 5-stage selector is **1047px** wide; only Start/Receive are initially visible;
- remaining court & controls are CLIPPED by `.strategy-editing { overflow:hidden }`.
- A real drag in this post-resize phone viewport cannot hit its intended athlete, failing the browser UAT criterion `narrow viewport player drag`; untouched direct-phone load does not reproduce this issue.

**Root evidence:** `rotations.css` `@media (max-width:850px) .strategy-editing` switches to CSS grid layout but leaves min-content grid sizing unconstrained after previous desktop canvas allocation. It needs an explicit `grid-template-columns:minmax(0,1fr)`, `min-width:0` / width constraints for affected grid children, and must allow React Three Fiber / Canvas to recalculate after resize. Do NOT solve by hiding overflow or shrinking controls alone.

**Required exact acceptance:** After 1440→390 transition, actual `.rotation-canvas` and canvas widths ≤390, `.strategy-panel` ≤390, all stage buttons entirely within 0..390, full 9×9m court visibly framed, selected athlete drag genuinely changes X/Z and creates a single undo action, no horizontal overflow, no JS errors. Also check 390 direct load, 390→1440 reverse, 768 tablet, phone 375px and narrow landscape.

## UAT-02: minor coach wording

After Reset stage, visible label reads **"Needs review · 1 notices"**. Use proper `1 notice` and `N notices`. Variant-specific multiple warnings from one illegal position are currently accurate but can overwhelm; do not silently suppress actual variants. If easy, group repeated underlying violation types for coach comprehension while retaining detailed disclosure.

## Test harness, not app bugs
- `tests/strategyStudio.browser.mjs` needed a wait for the shared page to hydrate before asserting `Preview`; resolved.
- Puppeteer `page.locator(...).scrollIntoView()` is unsupported; replaced with `page.$eval(...,el=>el.scrollIntoView({block:'center'}))`. This was a QA runner issue.
- Temporary `UAT_SHORT` option and per-Step diagnostic console logs were added for focused debugging; keep or tidy after final acceptance, but full 12-mode matrix remains the default.

## Next bounded implementation owner (Codex)
Fix UAT-01 responsive behaviour and UAT-02 grammar **only**, add regression tests to the existing browser suite, preserve all V3 data and Set arcs, and report tests/build. Commit/push only after Normal Chat independent acceptance. No new framework, backend or redesign.

## Final pending release gates
1. Repeat actual Windows Chrome end-to-end suite with desktop→phone resize and fresh phone path; every real drag, save/reload, import/link, mobile route and Set arcs access passes.
2. Independently inspect screenshots at 1440×900, 768×1024, 390×844 and 375×812 for visible actual court, all stage controls and no overlap/clipping.
3. Run `npm test`, `npm run build -- --base=/RotationStudio/`, `git diff --check` and verify authored V3 plans unchanged.
4. Commit/push reviewed branch; merge with fast-forward to main only once all gates pass, check Pages workflow and fetch actual public V4. DRAFT/tactical-human review remains open; V5 full product strategy is a separate next phase controlled by user's "continue".
