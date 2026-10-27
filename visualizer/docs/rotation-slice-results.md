# Rotation Studio: first slice and QA record

## Bounded repair follow-up (28 October 2026)

The supplied actual 390×844 screenshot exposed oversized controls, labels covering avatars, steep/skewed framing and permanent path/contact overlays. This repair compacts the rotation controls, reserves a mobile court viewport between controls, straightens the portrait camera, moves larger player labels below human models, defaults paths off and limits the first-touch cue to ±0.55s around contact. PASS HERE text yields during that window; its floor marker remains. Original Set arcs stays separate. Rendered mobile/desktop/touch acceptance remains with the owner; no browser setup or automated visual QA was performed in this repair.

Service ordering now samples `ball[0].start`; pre-service interpolated movement and waypoint excursions are rejected. Checks use conservative avatar centres rather than referee-exact feet. TTGVA ordering applies for either serve owner; the opposing six-player order is outside this one-team model. Both JSON files can explicitly declare matching DEMO, DRAFT or APPROVED statuses, subject to identical structural validation. Validation never grants approval. Local edits to approved plans become drafts; bundled public JSON remains unchanged and DEMO.

First- and second-contact keyframe edits link their adjacent ball endpoints, including holds between flights; setter contact edits also move the target. Regression tests cover the repaired validator, JSON status loading/export, contact dragging and approval downgrade. `npm test`: 31 passed, 0 failed; `npm run build`: TypeScript and Vite passed with the existing >500kB chunk warning. No dependencies, Python, services, commits, pushes or deployment were added.

The remainder below is the historical first-slice record; the follow-up above supersedes its demo-only status limitation and initial-coordinate service checks.

Date: 28 October 2026 (Australia/Adelaide). Branch: `feature/volleyball-rotations`. Baseline: `00c9064b844a244f5e9715ced8f33bf81c20d916`.

Status: **implemented training-demo slice; technical checks pass; real-browser and designer acceptance pending**. No deployment and no claim of approved formations. All new app code/data lives in the existing visualizer; the detector and annotation subsystems are untouched.

## Delivered

The default Rotations mode reuses the existing court, net, stage, visual palette, React/Three/Zustand stack and aspect-fitted camera approach. It adds six named human models, all six mathematically related service orders and both serve directions, independent eased tracks, a first-contact cue and anchored PASS HERE target, a full Harry setter run, illustrative serve/pass/set/attack/return flights, fixed rotation eligibility, phase navigation, playback/scrubbing/speed, camera views and a mobile settings sheet. The original Set arcs scene, handles, format switch, presets, saved collections, playback and legacy URLs remain separate. Its arc calculation now shares the same pure quadratic control-point helper, with a numerical regression test.

Public version-1 JSON contains every tactical coordinate and role. The viewer never computes a formation from hardcoded player roles. Coach drafts permit floor dragging in Top view, keyframe selection, metric coordinate edits, target edits, reset, validated import/export and explicit local-only status. Share links omit draft data. Demo labels remain visible.

## Commands and actual results

| Check | Actual result |
| --- | --- |
| Unmodified `npm ci --offline` | Blocked by sandbox esbuild install check: `spawnSync .../esbuild EPERM`; not reported as passed |
| `npm ci --offline --ignore-scripts --logs-dir=/tmp/rotation-npm-logs` | Passed; 195 packages installed from the lockfile; no dependency changes |
| Unmodified `npm run build` | Passed on a `git archive HEAD visualizer` copy in `/tmp`, using the installed dependencies |
| Feature `npm test` | **25 passed, 0 failed, 0 skipped**, exit 0 |
| Feature `npm run build` | Passed TypeScript and Vite production build, exit 0 |
| `dist/plans` vs public JSON | Exact byte-for-byte copies verified after build |
| `git diff --check` | Passed |
| Desktop 1440×900 / phone 390×844 browser QA | **Blocked, not passed**; details below |

Vite emits the same class of >500kB bundle warning as the original Three.js baseline. No unrelated dependency or bundler redesign was introduced.

## Requirement → executable evidence

Tests are colocated in `src/lib/rotationModel.test.mjs`, `src/lib/rotationValidation.test.mjs` and `src/state/rotationStore.test.mjs`. They use Node's built-in test/assert APIs, with no added test framework dependency.

| Requested behavior | Exact test name / evidence |
| --- | --- |
| “Retain existing Set arcs mode” | `sampleArc shares the original Set arcs quadratic midpoint and endpoint math`; original Scene, Handles, ControlSheet, presets and collection code retained; actual browser regression remains pending |
| “six 3D named human players” | `published JSON validates all 12 unique rotation and serve combinations` pins the six names and Harry setter tag; `RotationPlayer.tsx` implements head/torso/arms/legs; rendered appearance pending browser QA |
| “both serve directions” | `published JSON validates all 12 unique rotation and serve combinations`; `service contact catches x order and z pair violations when they serve`; `service contact catches x order and z pair violations when us serve` |
| “six legal starting orders” | `rotationOrder rotates clockwise through all six and returns to the initial identities`; the two service-contact tests deliberately violate all adjacent row pairs and all corresponding depth pairs |
| “player movement timeline” | `sampleTrack clamps boundaries, eases interiors and reverses without stale roles`; `sampleTrack uses independent distance-weighted waypoints including stationary segments`; `ballAt holds at start and after flight, phaseAt seeks at exact event boundaries` |
| “pass target” | `contacts require an authored fallback setter, matching pass target, timing and continuous flight`; `PASS HERE edits maintain pass landing, set origin and setter contact together` |
| “back-row setter movement” | `all authored scenarios show a held start, first contact, setter run and fixed eligibility`; `back-row Harry may set inside 3m but cannot block or complete front-zone above-net attack` |
| “mobile UI” | Responsive stylesheet, aspect-fitted portrait camera, native touch controls, bounded settings sheet; **390×844 rendering/touch acceptance blocked** |
| “versioned editable tactical JSON” | `load and export roundtrip preserves a JSON-only authored change without application edits`; `coach edits clone data, snap to keyframes, pause and reset without public writes`; `validated draft import resets playback and invalid import preserves the previous draft` |
| “validators” | Both deliberate service-order tests; `unknown JSON is rejected safely for versions, identities, fields, enums and numeric bounds`; `loading failures and invalid imports produce readable errors`; `export rejects invalid drafts instead of producing a misleading valid-looking download` |
| “tests” | `npm test`: 25/25, exit 0. Includes `play pause resume speed seek reverse and end restart are deterministic` and `changing rotation or serve clears animation and editor time without changing published plans` |
| “clear DEMO-only label” / “Do not invent match-approved tactics” | Persistent DEMO ONLY / TRAINING DEMO / UNAPPROVED and exact disclaimer in `Rotations.tsx`; at the time, validator rejected an approved status; source JSON has only unapproved demo status |
| Fixed front-row identity even in deep defense | `front-row eligibility survives retreat to defensive middle-back` |
| Named fallback setter | `Harry first touch is allowed with an explicitly authored Caleb fallback setter` |
| Friends links exclude local data | `rotation links clamp malformed inputs and contain only the published view` |
| Structural contact checks use relative spots rather than attack-line zones | `service contact accepts front players deeper than 3m and enforces endlines and held spots` |

Tests explicitly compare rejected and allowed behavior, endpoint/midpoint numbers, deep objects, exceptions and playback/draft state transitions. They do not assert tactical correctness or substitute for visual, touch or player-comprehension acceptance.

## Browser blocker and remaining acceptance

The environment rejected `npm run dev -- --host 127.0.0.1` with `listen EPERM ...127.0.0.1:5188`. Chromium launched via a debugging pipe also failed its socket setup (`setsockopt: Operation not permitted` / target closed). The native browser-control tool returned `UnreachableCaseError`. Python Playwright is not installed; fetching it also failed DNS. No screenshots, live WebGL proof or successful desktop/mobile interaction run can honestly be recorded from this session.

Run the following acceptance on a host with a working browser/server before considering deployment:

1. `npm ci && npm test && npm run build && npm run dev -- --host 127.0.0.1` from `visualizer/`; open port 5188 at 1440×900 and 390×844.
2. Confirm all six named human silhouettes, the full court, net/attack lines, names/eligibility, receiver cue and PASS HERE are legible. Verify the portrait court occupies the intended 70–85% experience and adjust actual framing/overlaps if needed.
3. Cycle R1–R6 with each serve owner. Watch the held start, both serve directions, first touch, target pass, Harry's full run, set/attack, defense and recovery. Confirm no stale motion after switching.
4. Play, pause/resume, seek forward and backwards, Restart, speed, all three phase tabs, all four cameras, zoom/pinch and Orbit touch. Check console errors and horizontal overflow.
5. Open/close Settings on phone, toggle labels/paths, enter Coach draft, select keyframes and drag each athlete and the pass target. Verify coordinate edits, diagnostics, Reset, JSON download/upload and rejection of an illegal plan. Reopen a Share view link in a fresh session and confirm drafts are absent.
6. Switch to Set arcs: test 9-man and 6s, presets, all handles, all cameras, playback/rate/scrub, saved collection add/load/delete and a legacy shared set link.
7. Edit only a valid JSON coordinate/cue, rebuild, hard refresh and observe the changed rendering. Confirm a malformed public file shows readable load errors with Retry.
8. Capture both viewports and obtain designer/owner review. Match-position authoring and verification are a separate open task.

Shell GitHub access failed DNS, while the GitHub connector can read the exact baseline feature head. Local `.git` is read-only (`git add` cannot create `index.lock`), so local branch/index metadata cannot advance in this environment. The attempted GitHub `create_tree` write was blocked with `MCP tool call requires approval, but approval policy is never`. No remote commit/ref update occurred. The tested feature is preserved as a local commit in `/tmp/rotation-studio-feature-checkpoint-20261028` and a portable `/tmp/rotation-studio-feature.bundle`; the bundle has the existing baseline commit as a prerequisite. Remote push remains blocked.

The local feature commit and working files are reviewable with these explicit limits; the remote feature branch remains at the baseline until a permitted push. Nothing here authorizes live publishing.
