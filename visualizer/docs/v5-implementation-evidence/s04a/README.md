# V5-S04A — implementation acceptance (29 October 2026)

**Branch:** feature/strategy-studio-v5. **Status:** S04A implementation accepted; **NOT** full V5 UAT, public release or tactical match approval.

## What changed

- Strategy editor now shows Shared (all four authored cases) versus explicit exact case, opponent attack side, normal/Harry-first, and first versus later own-serve Defend. Resetting an exact case preserves the inherited shared positions.
- Selected player source details: actual V3 ghost, current coordinates, path length/time, eligible versus animated hitter, grouped RULE/GEOMETRY_TIME/CONTACT/COVERAGE/TACTICAL_REVIEW findings. No claim of referee-foot or on-court approval.
- Signed negative X input fix: editable text draft with Enter/blur commit and Escape cancel, rather than accidentally saving +0.5 when typing -0.5.
- No authored tactical source, generator, source event/timing, Set arcs or legacy V1/V2 migration changes.

## Direct verification

- **100/100 unit tests PASS**, **Pages-base build PASS**. Details retained on D: in `.cache/browser-qa/V5-S04A-parent-unit.txt` and `V5-S04A-parent-build.txt`. Existing Vite large-chunk warning is non-blocking.
- Independent Windows Chrome targeted run PASS: signed X entry; exact-case and shared placement isolation; case reset; separate later defence; 390px court/inspector non-overlap; mobile numerical edit; save/reload preserving a preexisting saved sentinel, current draft and original V1 localStorage backup; original Set arcs; zero JavaScript exceptions. `parent-result.json` records nine checks.
- Independent 390px Chrome real 3D pointer drag: Caleb Receive moved from (0.30,6.20) to (1.47,5.75), one undo entry, Undo restored the draft. `phone-drag.png` documents the rendered state.
- Repeatable standalone private-Chrome browser scripts are `visualizer/tests/strategyS04A.browser.mjs` and `strategyS04A.phone.browser.mjs`. They never access the user's personal V4 browser or GitHub Pages.
- Codex's earlier large combined Chrome harness provided desktop screenshots and verified point/waypoint/target drags and warning disclosure, but had unstable click/wait/profiler assertions and **is not claimed as a complete PASS**. Raw historical test receipts stay in D: `.cache/browser-qa`.

## Evidence here

`desktop.png` shared editor and V3 ghost; `impact.png` R1 own-serve invalid service-contact disclosure; `r3-release.png` setter route and elapsed interval; `phone.png` separate later Defend controls; `phone-drag.png` actual phone-viewport 3D drag; `parent-result.json` browser results.

## Scope boundary

S04B will add editable individual coverage responsibility/ellipse and Edit zoom targeting our half-court. S05 local sharing, S06 role animation and S07 event-level edit/replay/camera/Shuffle are **not part of this acceptance**. The user's R1/R2 V4 local drafts were never imported, modified or inspected. All tactics remain DRAFT; physical-phone and match review deferred.
