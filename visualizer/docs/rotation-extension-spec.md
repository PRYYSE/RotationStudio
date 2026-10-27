# Fork adaptation: indoor six-player rotation studio

Status: app implementation specification, not approved volleyball tactics. This is an extension to the existing public SetOptics code; do not build a new separate app. Source: dawsonpar/SetOptics Apache-2.0; fork: PRYYSE/RotationStudio (renamed authentic GitHub fork of dawsonpar/SetOptics). The original hosted rotation video is visual-reference-only; its code is NOT part of the public repo. Existing visualizer source lives in this directory.

## Product job
A player opens a shared link on a phone, selects R1 through R6 and serve ownership (opponents serving vs us serving), and sees six named athletes on the real 3D indoor court. Play or scrub a timed sequence to understand exactly where to start, where to move when the ball is served, who receives, WHERE THE PASS SHOULD GO, the back-row setter's path to the net, who attacks, who covers short and deep, and how everyone resets. The experience must look and behave like the user's filmed dark 3D SetOptics rotation studio, not like a flat tactical diagram.

## Reuse source, not a recreation
- Retain and extend existing visualizer/ infrastructure: React + Vite + TypeScript + three/react-three-fiber/drei, existing Court, Net, StageBox, original CameraRig approach and visual treatments, Ball/ArcLine and quadratic Bezier path logic, PlayBar interaction and top/bottom chrome, Zustand, keyboard and touch behaviors.
- Add a distinct default "Rotations" mode with its own data/keyframes/state and a separately accessible "Set arcs" mode using the existing original set-trajectory tool. Do not mix the two workflows or break original mode. Refactor shared controls only as needed.
- Indoor 6s ONLY in rotations (9x18m, own half z=0..9, opponent half z=-9..0, 3m attack line, configurable net). Original Set arcs retains existing 9-man/6s selector. Do not touch Python detector / annotation subsystems.
- Rename visible product branding to an original name such as "Rotation Studio" and do not distribute SetOptics logo or implied endorsement; keep LICENSE and required attribution intact.

## Exactly what is visualised
1. Start / service contact (legal relative-order spots; both teams TTGVA; when our team serves P1 is behind endline).
2. Serve flight / read (opponent server on opposite half, ball curve towards passing athlete if receiving; our server outside own endline and ball path toward opponent if serving).
3. Serve reception / first touch: receiving player to ball, the OTHER players move to the permitted receive lanes; display a clear receiver cue, pass origin and bright designated target "PASS HERE".
4. Transition to setter: Harry moves from his actual original back/front position to configurable setting target near front-right of centre; show visible path for full run. Ball goes from receiver to target following a gentle high pass arc, with appropriate timing. On our serve, defend first, then Harry approaches to set only after first defensive contact.
5. Our offense: front eligible hitters approach assigned sides/pins, with second contact illustrative set arc to a configured hitter if authored. Maintain real front/back-row eligibility, even if someone has moved out of their zone.
6. Their attack / our defense: front-row blockers and other defenders move to explicit assigned coordinates; front-row Jaz/Georgia may retreat to middle-back DEFENSIVE space if chosen by the coach, and Harry may advance from back row to SET but MUST NEVER block as a back-row player. Do not infer that moving behind 3m changes front-row eligibility.
7. Recover: next point/court coverage. Each event carries a short plain-English coaching cue. No physical instant swaps: players interpolate along independent keyframe tracks with easing. Show arrow trails when opted in.

Service-contact positions are not attack positions. Never portray one snapshot as both. Keep a meaningful pause/freeze at first contact so novice players can see exact start spots.

## Data authority & editing
- Public source files versioned in the fork, preferably visualizer/public/plans/team.json and visualizer/public/plans/rotations.json (or equivalent copied to dist by Vite). UI loads the files and validates all data. ChatGPT/Normal Chat will edit these JSON files and publish them without modifying application code.
- Team names: Harry, Caleb, Trent, Logan, Georgia, Jaz, with Harry tagged setter. Start order not yet approved, so label sample data TRAINING DEMO / UNAPPROVED; do not encode the rejected earlier match card as an approved rotation.
- Define ONE explicit initial service order / P1..P6 mapping then mathematically rotate to all six rotations. Never randomize identities. Distinguish legal rotation position from actual x/z.
- Per-rotation, per-serve-owner timelines of seconds or normalized time keyframes; player positions {id, x, z, facing?}, player roles at time (receive/pass/block/attack/help) and optional curved path waypoints for long runs. Full editability is essential; avoid computing tactics from hardcoded role switches.
- Explicit targets in data: setter target {x,z}, pass origin/landing and optional set destination, with segment start/end/duration/height. Render target as a named anchored marker, not as an unintelligible ball dot.
- Editable coach mode: select phase/keyframe, drag each player on the 3D floor (Top camera is acceptable for editing), drag PASS HERE target; see x/z in metres; changes are local draft only. Undo or Reset is desirable. JSON export/download and import/upload with validation; no unauthenticated writes to the public plan.
- Read-only friends mode defaults to published JSON. Local changes never silently propagate to friends. Link should encode rotation/scenario/phase/playhead not a locally unpublished plan.
- JSON schema version, robust validation, readable errors, and automated tests of rotation order, service contact positions, back-row blocking restrictions, load/export roundtrip and piecewise interpolation.

## Court legality and safety guardrails
- Positions P4 front-left, P3 front-middle, P2 front-right; P5 back-left, P6 back-middle, P1 back-right, from our baseline facing the net.
- At service CONTACT enforce: left-to-middle-to-right relative x order within rows, corresponding back person behind front (own-side z values larger farther from net), and our server beyond endline when it is our serve. Use positional-foot ordering, not naive "must stand behind the 3m line" logic. Add readable diagnostics identifying athletes and violated pair. TTGVA serving team positional constraint is stricter than current baseline FIVB; ensure both scenarios covered.
- Each player's official front/back rotation identity remains unchanged throughout rally even if front person drops deep or a back setter moves up. A back player may not complete a block; an above-net back-row attack from front zone is illegal. Harry back-row setting at net is legal. Warn if configured blocker is back-row; do NOT warn merely because back-row Harry has z<3 for setting.
- Prefer a named receiver and second-contact source. If Harry receives/digs first ball, mark fallback setter as Caleb or Georgia if authored, not Harry instantly teleporting for a second consecutive contact.
- Generic demo ball/movement may be implemented to prove the UI. Distinct on-screen disclaimer: "Demonstration movements - not approved match positions." Do not claim tactical accuracy until owner authored and verified all plans.

## Interaction / visual style contract
- 3D full court is 70-85% of initial portrait experience, with an almost-black scene, original cobalt/blue-lit court lines, elevated soft lighting/shadows, low-poly human-like team models with head/torso/arms/legs and clear hover/selection, ball/server and lightly glowing motion lines. A front row and back row must be obvious from realistic scale, not text grids.
- Top floating tabs: Receive / Attack / Defend. They navigate to meaningful timeline segments without conflating camera position with a volleyball phase.
- Rotation chooser R1..R6, toggle Us/They serve, optional player name labels and overlays, View front/side/orbit/top. Mobile settings opens as short bottom sheet (never swallow scene). Always-available bottom Play / Pause / Restart / scrubber / speed. Simple one-line coaching cue and phase indicator.
- Smooth camera transitions and robust touch controls; Play/Pause/seek reversible and stable, selecting a new rotation resets without stale animation. Show "Start", "Serve", "Pass", "Setter runs", "Attack", "Defense", "Recover" labels at timeline markers.
- Preserve existing set-trajectory visualizer as separate mode with its original 3D functionality, collections/presets and playback as much as possible.

## Build/acceptance gates
A. Unmodified fork baseline npm ci and npm run build succeed (already verified 28 Oct 2026). Original Set arcs mode remains usable after changes.
B. Rotations app 3D six HUMAN silhouettes + real court + full six rotations in both serve modes, correct labeling; track movement for named players, distinct pass target marker, illustrative ball service/pass arc.
C. Timeline play, pause, scrub, reverse-scrub, restart, speed, phase switching, camera front/side/orbit/top, mobile sheet. Real browser test at ~390x844 and desktop ~1440x900. Fix actual errors and major layout failures.
D. Author data only in editable public JSON. After changing solely that JSON, build displays changed positions without code edits. Edits via owner mode can be exported and imported, rejects invalid plan.
E. Assert structural overlap validator catches deliberate illegal x/z and back-row blocker while allowing back-row Harry z<3 setting. Rotation transforms six times back to start. Verify with tests.
F. Git commit/push on feature/volleyball-rotations; no unrelated Python changes. Keep user-facing README with exact run/deploy/edit commands. Do not publish live before functional QA and designer review; do not claim demo is a match-approved formation.

## Execution cadence
Implement in a single coherent focused slice or two:
1. Source-preserving mode switch, 3D scene and six animated players, versioned data model, timeline and validator/tests, usable authored-demo screen.
2. Owner editing/import/export, camera/touch and visual QA, original set-arcs regression, docs/deploy preparation, review.
No extraneous frameworks, accounts, database, cloud AI, backend, live collaboration, training pipelines or user-auth work. Favor existing code, minimal dependencies and original styling.

