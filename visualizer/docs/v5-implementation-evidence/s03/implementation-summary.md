# V5-S03 implementation evidence

Worktree: `D:\Projects\RotationStudio-V4`, branch `feature/strategy-studio-v5`.
Starting and current HEAD: `258db6b930312b7634d0e0c88738de704231ace2`.
Implementation work only; no independent final UAT, staging, commit, push, merge or publication.

## Exact source and test changes

Modified:

- `visualizer/src/ui/Rotations.tsx`: court/context layout, five pinned markers, shared player ID, scenario drawer, stage-preserving View/Edit handoff.
- `visualizer/src/ui/FirstBallExamples.tsx`: actual receiver/setter/hitter facts, availability and unavailable/retained-animation disclosure.
- `visualizer/src/three/RotationScene.tsx`: isolated screen label layer; remove competing first-contact Html tag; keep server below overlays.
- `visualizer/src/three/RotationCameraRig.tsx`: retain opposing-server framing at Start; frame our full half after first contact/for our serve.
- `visualizer/src/three/RotationPlayer.tsx`: same-ID View selection/ring; remove independent overlapping Html name tags. No motion or track edits.
- `visualizer/src/rotations.css`: scoped court-first grid, compact desktop context, sole mobile sheet scroll owner, adaptive landscape side controls and clipped labels.

Added:

- `visualizer/src/ui/PlayerFocus.tsx`: semantic selector/roster, source-backed role, position/eligibility, conditional/fallback and review disclosure.
- `visualizer/src/ui/useViewerReview.ts`: memoized `createReviewModel(published, working)` and context-only `project()`; separate read-only sample facts.
- `visualizer/src/three/RotationLabels.tsx`: projected feet, canonical identity colours, deterministic priorities and leaders; no pointer interception.
- `visualizer/src/three/labelLayout.ts`: pure collision packing, target exclusion and compact identity fallback.
- `visualizer/src/lib/viewer.test.mjs`: deterministic packing, bounds/collision and target/immutability tests.
- `visualizer/tests/viewer.browser.mjs`: bounded real Chrome DOM, focus, keyboard/touch, viewport/resize, nine-cell, cache and Set arcs checks.

All changed code files remain below 500 lines. Existing `.cache` evidence was retained; new S03 screenshots, isolated Chrome profiles and follow-up probes are confined to this directory.

## Verification

- `npm test`: 98 tests pass, including all 48 cases, legacy V1 fingerprints, V2 overlays, service holds, eligibility, contact continuity, nine teaching samples across 48 cases and the two new label tests.
- `npm run build -- --base=/RotationStudio/`: passes. Latest assets: `index-DjVnemh3.css` and `index-CRQ6SfnQ.js`; Vite reports its >500kB chunk advisory (JS 1,242.19kB / 352.16kB gzip).
- `node tests/viewer.browser.mjs`: full viewport run passed with 30 viewport/performance records and zero console/page errors. Actual Windows Chrome 156.0.8078.49, headless, local port 5188. Desktop 1440x900, 390x844, 375x812, 768x1024, 844x390; fresh loads and live resize both directions; six separate tags, five 44px markers, all playback control centres reachable, no horizontal/body scroll or tag/sheet intersections.
- All nine sample cells were clicked at each resized viewport. Selected states and semantic role/source text checked; failed choices retain the last valid scenario paused. Sparse working strategy, library and history remain unchanged by sample choices.
- All six named players plus Whole team, five stages, six rotations and both serve owners checked. Keyboard selection/stage activation, phone touch activation and an actual projected on-court Caleb click checked. Source/user note precedence checked using validated import-preview fixture text.
- Original Set arcs onboarding (when present), Side view, More controls and return to Rotations checked. Published Set arcs source files remain unchanged.
- Final View/Edit timestamp-retention correction was verified separately by `mode-persistence.mjs`: Set and Caleb survive View -> Edit -> View, zero console errors; see `mode-persistence.json` and `mode-edit-set.png`. The maintained browser suite also contains this assertion.
- Final direct responsiveness probe: `stage-performance.mjs` / `stage-performance.json`, 40 real stage clicks at 1440x900 and 390x844, both published and immutable working-strategy states. Max click-event-to-DOM update 23ms; max two-RAF callback 112.5ms. Audit/model counters unchanged through each stage series. No concurrent build/unit run during this probe. These are observed headless-browser timings, not physical-phone benchmarks.
- The main report's `maxClickMs` measures several automation commands plus fixed test waits; it is distinct from the direct DOM/two-frame measurements. Raw figures and historical failure artifacts are retained.
- `git diff --check` passes. No protected data, generator, state/store, migration or case-editing module changes.

## Court dimensions observed

| Chrome viewport | View court | Explorer court |
| --- | --- | --- |
| 1440x900 | 1090x604 | 1090x604 |
| 390x844 | 390x414 | 390x324 |
| 375x812 | 375x382 | 375x292 |
| 768x1024 | 768x594 | 768x504 |
| 844x390 | 544x332 | 544x332 |

## Protected source fingerprints

Byte-identical to the supplied pre-implementation QA baseline:

- `public/plans/team.json`: `0BDAAAFC5569020CB0EBD93CB239A0E12778585AE6A61F9B3D7177128A299AA9`
- `public/plans/rotations.json`: `06896FEF07722F5AB71A1A0C68E3B4DC1B1B6BBDF7E1E27515BBCCDDAE31A326`
- `scripts/author_tactics_v2.py`: `31AB8CDB99A165BB6F2BA9E1984EC1E5136D98365155CE94750172CF5FB039D7`

Paths above are relative to `visualizer/`. DRAFT status, original coordinates, event timing and ball arcs remain unchanged.

## Review artifacts and limits

- `report.json`: full viewport geometry, reachability and cache-counter evidence.
- `stage-performance.json`: direct DOM/frame latency and unchanged audit counters.
- `mode-persistence.json`: final mode-handoff evidence.
- `desktop-focus.png`, `resize-375x812-6.png`, `explorer-390x844-4.png`, `resize-844x390-12.png`, `fresh-768x1024.png`, `set-arcs.png`: representative screenshots; other recorded viewports also have PNGs.
- Local review host is `http://127.0.0.1:5188/`; no unrelated server/process was killed.

Physical phones/tablets, teammate readability, referee-foot checks and independent final V5 UAT remain deferred to the separately authorized phase. S04 case-editing/impact tools, S05 sharing/reference extensions and S06 posture/animation remain outside this slice. No tactical match approval is claimed.
