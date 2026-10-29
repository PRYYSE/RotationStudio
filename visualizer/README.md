# Rotation Studio — V4 Strategy Studio

**Live app:** https://pryyse.github.io/RotationStudio/ · **Tactics:** DRAFT, not match-approved. An independently named, source-preserving fork of [dawsonpar/SetOptics](https://github.com/dawsonpar/SetOptics). The original **Set arcs** mode is still available.

## V4: create, review and share a volleyball strategy

- **View**: select R1–R6 and **They serve / Us serve**, press **Receive / Attack / Defend** to jump to exact event positions, or play the full rally. Settings controls opponent attack left/right, Harry-first alternatives, first-ball examples, camera and dynamic coverage.
- **Edit strategy**: a new copy starts with **exactly the existing V3** (unchanged until you move someone). Choose the five understandable anchors **Start, Receive, Set, Attack, Defend**, ordered on *our serve* as **Start, Defend, Receive, Set, Attack**. Drag an athlete to their spot or enter X/Z metres; select them and add/drag an **incoming route bend**, or return to **Straight**. The gold target is movable. Undo/redo and reset are available.
- **Strategies**: **Save** locally in this browser; rename/attribute to a coach, duplicate, delete with confirmation, export/import a small JSON strategy, or share a link that recipients open as a **preview** and explicitly **Save a copy**. Every coach/friend can have a different strategy. **There is no account, backend or automatic cross-device sync**: export/share to transfer work.
- A strategy is a **sparse foundation**, applied to four tactical authored alternatives for a selected rotation and serve order. The animation preserves the V3 authored timing and remains marked **Needs review**. It does **not** independently optimise arbitrary first passes, blockers or all return paths. Ask ChatGPT to review an exported strategy and complete tactical variants before using it as team instructions.
- The public **Team V3 baseline** is immutable. An illegal starting stack or an implausible animated movement gives review notices, not false approval. Front-row eligibility, back-row Harry rules, and TTGVA serve-contact order still apply.

**Verification:** see [V4 Independent UAT](docs/V4_INDEPENDENT_UAT.md): 73 unit/regression tests, real desktop/phone browser interactions, all rotations/alternatives, live resize, save/share, and production preview. Real-court execution has not been verified. More realistic jumping/spiking/blocking, collision-aware mobile labels and expanded tactical assistance are future design work.

---

## V1–V3 technical background (historical; V4 above governs normal use)

A source-preserving extension of the public [SetOptics visualizer](https://github.com/dawsonpar/SetOptics), licensed under the repository's Apache-2.0 [LICENSE](../LICENSE). Rotation Studio is a fork adaptation, with original branding and no implied endorsement. No hosted SetOptics rotation code is included.

**Published plan: DRAFT / NOT APPROVED FOR MATCH USE (28 October 2026).** Normal Chat authored all twelve TTGVA C Grade scenarios from this team's player assessments and local rotation rules. They are concrete coaching proposals, not arbitrary demonstration moves and **not verified on court**. The independently frozen old demo data is in tests/fixtures/; app tests no longer assert that public tactical coordinates match the old sample. Structural validation does not establish practical tactical suitability.

## Run and check

Requires Node **22.12+** and npm. From the repository root:

```bash
cd visualizer
npm ci
npm test
npm run build
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5188/`. Rotations is the default. **Set arcs** retains the original 9-man / indoor 6s format selector, presets, draggable set handles, collections and playback. Legacy `?s=...` links still open Set arcs; `?mode=sets` selects it directly.

In Rotations, choose R1–R6 and serve ownership. Receive / Attack / Defend jump to timeline events; these are independent of camera view. Play/Pause, Restart, scrub and speed are always in the lower bar. Space plays/pauses outside controls. Shift+1/2/3/4 selects Front/Side/Orbit/Top. Orbit accepts touch orbit and pinch zoom; fixed cameras accept zoom. Settings opens a bounded, scrolling sheet with cameras, names, paths and Coach draft. Paths default off; enable them explicitly in Settings. On phones the court has a dedicated viewport between the compact top controls and playback. Names sit below avatars; the first-touch cue appears only within 0.55s of contact, temporarily replacing the PASS HERE label. Names include fixed P1–P6 and front/back eligibility, even after moving.

**Share view** copies only the published rotation, serve owner and playhead, e.g. `?mode=rotations&r=2&serve=us&t=7.00`. It never contains a draft. Friends open published JSON without enabling editing. Local drafts are memory-only until exported; refreshing discards them.

## Author the public JSON

The application fetches and validates these Vite public assets at runtime:

- [`public/plans/team.json`](public/plans/team.json): schema version, publication status, six stable athlete IDs/names/colors, primary setter tag and one explicit `initialOrder` in **P1,P2,P3,P4,P5,P6** order.
- [`public/plans/rotations.json`](public/plans/rotations.json): schema version, publication status, net height and twelve fully explicit timelines (six rotations × `they`/`us` serve).

Both files require `schemaVersion: 1` and the same `status`: `"TRAINING DEMO / UNAPPROVED"`, `"DRAFT"`, or `"APPROVED"`. Status is an explicit author/coach declaration, never assigned by validation. The currently published team plan is DRAFT, with persistent warnings. The earlier DEMO fixture is retained only for tests. To publish a reviewed plan later, edit both JSON statuses to `"APPROVED"` along with the authored plan; no application edits are needed. DRAFT and APPROVED plans must pass the same structural checks as DEMO. No deployment is authorized by editing status. Unknown versions and invalid imports fail with readable diagnostics.

The current tactical DRAFT R1 order is P1 Harry, P2 Georgia, P3 Logan, P4 Trent, P5 Jaz, P6 Caleb. Each side-out shifts the P1..P6 array left by one: P2 becomes P1, P1 becomes P6. Six turns restore the original order. Identity/eligibility uses this transform throughout the rally; it is never inferred from animated depth.

Units are metres and seconds. X increases left-to-right from our baseline looking at the net. The net is Z=0; our half is Z=0..9 and their half Z=-9..0, with X=-4.5..4.5. P4/P3/P2 are front-left/middle/right, P5/P6/P1 back-left/middle/right. `x,z` are avatar-centre floor reference points for the structural ordering checks, not a naive front/back division at the attack line. These strict centre-order checks are conservative and can reject positions that a referee would allow based on feet. They do not implement the exact foot rule or certify legality. The human meshes are illustrative rather than a foot-contact simulation.

Each scenario contains:

| Field | Meaning |
| --- | --- |
| `rotation`, `serve`, `duration` | R1..R6, `they` or `us`, total seconds |
| `phases[]` | Increasing `{time,label,cue,section}` events; section is Receive, Attack or Defend |
| `tracks.<athlete>[]` | Independent increasing `{time,x,z,role,facing?,via?}` keyframes covering 0..duration |
| `setterTarget` | `{x,z}` anchored PASS HERE marker, inside our front zone |
| `firstContact`, `secondContact` | Explicit `{player,time}`; different athletes, ordered in time |
| `ball[]` | Ordered `{kind,start,end,from:{x,y,z},to:{x,y,z},height}` flights |

`role` is start, serve, receive, pass, set, attack, block, help, defend or recover. `facing` is radians about Y. Optional `via` points on an arrival frame describe its incoming path; interpolation follows distance-weighted segments with smooth easing. Paths are continuous but waypoint corners are not a physical motion simulation. Roles change at keyframe timestamps. Above-net attacks must explicitly include `aboveNet` and `takeoffZ`; back-row takeoff inside 3m is rejected. Moving a front-row athlete deep never changes eligibility. Back-row setting near the net is allowed; back-row blocking is rejected.

Hold all service-contact positions until the first serve flight (at least one second). The validator samples actual service contact at `ball[0].start`, including interpolation and incoming waypoints, and rejects movement beginning before it. Under the requested TTGVA convention both teams must be in rotation; our six-athlete model enforces ordering for our team under **both serve owners**. Opponents are represented only by a server cue, so their six-player order is not validated. Both serve-owner scenarios enforce relative ordering in each row, corresponding back/front depth and our P1 server outside the endline. The pass segment must link the named first contact to the target at the second-contact time. Consecutive flights share endpoints, with holds permitted between segments. If Harry receives first, explicitly author Caleb or Georgia (or another named athlete) at the second-contact target. No automatic tactic selection or fallback setter is inferred.

Edit the public files directly with a JSON editor, then run:

```bash
npm test
npm run build
npm run preview -- --host 127.0.0.1
```

Changing only valid JSON updates the loaded positions, cues and flights; no application edits are needed. Vite copies both files into `dist/plans/`. A changed `initialOrder` may require corresponding edits to starts, roles and contacts in all affected timelines; tests reject incompatible plans.

## Tactical V2 controls and data authority (28 October 2026)

**The published positions are still a tactical DRAFT, not an approved match formation.**
The real tactical JSON now contains **12 base scenarios plus 36 complete alternatives**
for R1–R6, either serve owner, opponent attack from our left or right, and normal
versus Harry-first-contact examples. The fallback option names the actual second
setter for each relevant scenario; R3 can show Trent emergency-setting because
Harry cannot necessarily return from deep defence in time.

Open **Settings** → **Their attack** (Our left / Our right) and **First contact**
(Normal / Harry first). The player movements, pass arcs, setter paths and
defending shifts are authored tracks stored in JSON—not automatic tactical
guesses. Share links retain the variant. Old links default to left/normal.

During **They serve** near first contact, coloured receive areas display broad,
supporting and compact player responsibilities. On a phone the names are in
**Settings**' receive-area legend rather than duplicated over the athletes.
The areas are intentionally overlapping; players still call MINE. These
receive overlays are hidden for **Us serve**, when the same six defensive
responsibilities follow a different sequence (serve → defend → dig → set → hit).

For controlled tactical authoring, update
`visualizer/scripts/author_tactics_v2.py` (the ChatGPT-owned V3 geometry and
possession script), then run from the repository root:

```bash
python3 visualizer/scripts/author_tactics_v2.py
cd visualizer/scripts && node --experimental-strip-types audit_tactics_v2.mjs
cd .. && npm test && npm run build -- --base=/RotationStudio/
```

The script writes the two public plan files; the structural validator checks
all **48** authored variants, and the movement audit samples player separation
and speeds. The checks do not establish practical fitness, foot-position
rulings or player ability to execute it without practice. Keep `DRAFT` until
the team has reviewed the actual court placements.

## Local coach drafts

1. Open Settings → Coach draft. The camera changes to Top and playback pauses.
2. Choose a keyframe and athlete. Drag a human on the floor, or edit X/Z in metres. Scrubbing while editing snaps to authored keyframes; leave Coach draft to play continuously.
3. Select PASS HERE to drag/edit the target. Its pass landing, following flight origin and linked setter contact frame move together. Dragging the first-contact athlete at its contact keyframe moves the incoming flight endpoint and pass origin together. Dragging the second-contact athlete at its contact keyframe moves the target, pass landing and following flight origin. Connected endpoints remain linked across holds between flights; other edits can produce diagnostics until resolved.
4. Reset draft restores published files. Export JSON requires a valid draft; Import JSON validates before replacing the current draft. Neither action writes public files or publishes anything. Editing an APPROVED plan downgrades the local copy to DRAFT; DEMO remains DEMO.

Export produces a single `{team,plans}` bundle. To author the two source files from an exported bundle, save it outside the repository (example `/tmp/rotation-studio-plan.json`) and, from `visualizer/`, run:

```bash
node --experimental-strip-types --input-type=module <<'JS'
import fs from 'node:fs'
import { parseBundle } from './src/lib/rotationValidation.ts'
const bundle = parseBundle(fs.readFileSync('/tmp/rotation-studio-demo.json', 'utf8'))
fs.writeFileSync('public/plans/team.json', JSON.stringify(bundle.team, null, 2) + '\n')
fs.writeFileSync('public/plans/rotations.json', JSON.stringify(bundle.plans, null, 2) + '\n')
JS
npm test
npm run build
```

## Local preview and deployment boundary

The interactive DRAFT is deployed on GitHub Pages, but it has **not** been approved or tested at a live match. Earlier build-slice QA is in [the implementation/QA record](docs/rotation-slice-results.md). The commands below allow independent local production preview.

For a later, separately authorized root-path static host, the exact build and local production check are:

```bash
npm ci
npm test
npm run build
npm run preview -- --host 127.0.0.1
```

Inspect `http://127.0.0.1:4173/`. Upload **the contents** of `visualizer/dist/`, including `plans/` and `textures/`, to the reviewed static document root. For a filesystem host, after that root has been explicitly chosen:

```bash
rsync -a dist/ /path/to/reviewed-document-root/
```

This is an optional alternative filesystem-host command, not the current publishing method. The live GitHub Pages deployment uses the correct /RotationStudio/ base path for the original Set arcs textures. Serve plan JSON with revalidation/no-cache so shared views receive published edits. No backend, accounts or cloud services are required.

## Public viewer publishing (GitHub Pages)

The genuine fork publishes the `visualizer/` app through `.github/workflows/publish-rotation-studio.yml` on pushes to `main`. Build and tests must pass first. No login is required to view the site; friends cannot change the published plan. The GitHub Pages URL is `https://pryyse.github.io/RotationStudio/`.

For tactical V3 changes, update the ChatGPT-owned generator under visualizer/scripts/author_tactics_v2.py, regenerate both JSON files under visualizer/public/plans/, run the tactical audit and tests, then commit to main. GitHub Actions rebuilds the DRAFT public viewer automatically. The script remains the source of truth; editing only generated JSON would be overwritten. Approved status must be explicit and matching in both JSON documents, and does not replace tactical or match validation.

Local production build for the same base path: `npm run build -- --base=/RotationStudio/`. This base path also applies to the retained original Set arcs ball textures.
