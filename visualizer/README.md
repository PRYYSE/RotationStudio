# Rotation Studio

A source-preserving extension of the public [SetOptics visualizer](https://github.com/dawsonpar/SetOptics), licensed under the repository's Apache-2.0 [LICENSE](../LICENSE). Rotation Studio is a fork adaptation, with original branding and no implied endorsement. No hosted SetOptics rotation code is included.

**TRAINING DEMO / UNAPPROVED. Demonstration movements - not approved match positions.** All twelve scenarios use arbitrary sample coordinates and timing to demonstrate the application. The service order, receive lanes, attacks and defensive assignments need owner/coach authoring and verification before use in a match. Structural validators do not establish tactical correctness.

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

In Rotations, choose R1–R6 and serve ownership. Receive / Attack / Defend jump to timeline events; these are independent of camera view. Play/Pause, Restart, scrub and speed are always in the lower bar. Space plays/pauses outside controls. Shift+1/2/3/4 selects Front/Side/Orbit/Top. Orbit accepts touch orbit and pinch zoom; fixed cameras accept zoom. Settings opens a bounded, scrolling sheet with cameras, names, paths and Coach draft. Names include fixed P1–P6 and front/back eligibility, even after moving.

**Share view** copies only the published rotation, serve owner and playhead, e.g. `?mode=rotations&r=2&serve=us&t=7.00`. It never contains a draft. Friends open published JSON without enabling editing. Local drafts are memory-only until exported; refreshing discards them.

## Author the public JSON

The application fetches and validates these Vite public assets at runtime:

- [`public/plans/team.json`](public/plans/team.json): schema version, demo status, six stable athlete IDs/names/colors, primary setter tag and one explicit `initialOrder` in **P1,P2,P3,P4,P5,P6** order.
- [`public/plans/rotations.json`](public/plans/rotations.json): schema version, demo status, net height and twelve fully explicit timelines (six rotations × `they`/`us` serve).

Both files require `schemaVersion: 1` and `status: "TRAINING DEMO / UNAPPROVED"`. This first slice deliberately has no match-approved status. Unknown versions and invalid imports fail with readable diagnostics.

The arbitrary R1 demo order is P1 Harry, P2 Caleb, P3 Trent, P4 Logan, P5 Georgia, P6 Jaz. Each side-out shifts the P1..P6 array left by one: P2 becomes P1, P1 becomes P6. Six turns restore the original order. Identity/eligibility uses this transform throughout the rally; it is never inferred from animated depth.

Units are metres and seconds. X increases left-to-right from our baseline looking at the net. The net is Z=0; our half is Z=0..9 and their half Z=-9..0, with X=-4.5..4.5. P4/P3/P2 are front-left/middle/right, P5/P6/P1 back-left/middle/right. `x,z` are service-contact floor reference points for the structural ordering checks, not a naive front/back division at the attack line. The human meshes are illustrative rather than a foot-contact simulation.

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

Hold all service-contact positions until the first serve flight (at least one second). Both scenarios enforce relative ordering in each row, corresponding back/front depth and our P1 server outside the endline. The pass segment must link the named first contact to the target at the second-contact time. Consecutive flights share endpoints, with holds permitted between segments. If Harry receives first, explicitly author Caleb or Georgia (or another named athlete) at the second-contact target. No automatic tactic selection or fallback setter is inferred.

Edit the public files directly with a JSON editor, then run:

```bash
npm test
npm run build
npm run preview -- --host 127.0.0.1
```

Changing only valid JSON updates the loaded positions, cues and flights; no application edits are needed. Vite copies both files into `dist/plans/`. A changed `initialOrder` may require corresponding edits to starts, roles and contacts in all affected timelines; tests reject incompatible plans.

## Local coach drafts

1. Open Settings → Coach draft. The camera changes to Top and playback pauses.
2. Choose a keyframe and athlete. Drag a human on the floor, or edit X/Z in metres. Scrubbing while editing snaps to authored keyframes; leave Coach draft to play continuously.
3. Select PASS HERE to drag/edit the target. Its pass landing, set origin and linked setter contact frame move together. Other player/flight edits remain explicit and can produce diagnostics until resolved.
4. Reset draft restores published files. Export JSON requires a valid draft; Import JSON validates before replacing the current draft. Neither action writes public files or publishes anything.

Export produces a single `{team,plans}` bundle. To author the two source files from an exported bundle, save it outside the repository (example `/tmp/rotation-studio-demo.json`) and, from `visualizer/`, run:

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

## Prepare static hosting later

No deployment is part of this change. Functional browser QA and designer review remain required; see the [implementation/QA record](docs/rotation-slice-results.md).

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

This is a documented future command, not an executed deployment. Host at the document root: the original Set arcs texture URLs remain root-relative. Serve plan JSON with revalidation/no-cache so shared views receive published edits. No backend, accounts or cloud services are required.
