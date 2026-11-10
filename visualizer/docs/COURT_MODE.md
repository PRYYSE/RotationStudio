# Court Mode

Permanent coaching workspace at https://pryyse.github.io/RotationStudio/?ui=court . Full Studio and its View/Edit strategy/Strategies tools remain a separate workspace; Set arcs is unchanged. The always-visible workspace switch retains selection/time and the working strategy. Phones/standalone tablets default to Court; Linux/Windows laptops, including touch convertibles, default to Studio. Resizing does not switch. Explicit `ui=court` / `ui=studio` links override stored choices for that visit.

## Coaching

One finger or mouse drag orbits in 3D. Top/Front/Side drag across the horizontal court; Free orbit releases the preset without snapping. Two fingers pan and pinch simultaneously in every view. Right mouse drag pans; wheel zooms. Reset View fits the current viewpoint. Camera position stays stable through authored events and playback. Space plays/pauses; arrows step exact events. Repeat can loop a rally or the phase selected when repeat was enabled. Scrubbing always pauses at the selected exact time.

Fullscreen prefers the browser API and falls back to viewport focus when unavailable/denied. Exit and Reset remain visible with the event strip, scrubber and Play. Escape exits drawing/focus/sheets.

Annotate pauses playback. Pen/finger/mouse draws on court-ground coordinates; a second finger cancels the pending mark and pans/pinches. Navigate returns normal camera gestures. Pen, arrow, circle, highlight, text and erase are available. Choose moment or whole rotation; moment notes appear only within 0.045 seconds of their saved time. Notes sheet lists all notes for the current source/rotation/serve/variation; tapping one restores its exact moment. It supports text edits, scope changes, deletion, clear confirmation, undo/redo and export/import. Each mark records local coach ownership.

Notes are local to this browser; view links exclude note bytes. Export JSON and explicitly share/import it to move notes between devices. No accounts or automatic sync. Storage failure keeps changes in memory, clearly reports unsaved state and offers export. An unreadable stored document is protected against overwrite, with recovery export available. Source identity includes the full active source content (or review ID plus SHA-256); changed versions do not inherit old annotations. Geometry/tactics and existing strategy storage keys are never changed by notes.

## Publishing exact per-rotation reviews

No tactical proposals are authored by this feature release. The review manifest starts empty. Future tactical chats add BOTH a JSON packet and a Markdown plan for each new version under `visualizer/public/reviews/<id>/`, then add a manifest entry. Commit to main; the existing Pages workflow publishes the data on the same site.

Manifest `public/reviews/manifest.json`:

```json
{"schemaVersion":1,"reviews":{"r1-v1":{"rotation":1,"version":"R1 v1","data":"r1-v1/rotation.json","plan":"r1-v1/plan.md","sha256":"<64 lowercase hexadecimal SHA-256 characters of exact JSON file bytes>"}}}
```

The bracketed SHA value is a placeholder and is not accepted by the loader. Calculate the real hash after writing the final JSON. IDs use lowercase letters/digits/hyphens, up to 64 characters. Data/plan paths must be directly within their ID directory. Each JSON packet has this contract:

```json
{"schemaVersion":1,"id":"r1-v1","rotation":1,"version":"R1 v1","scenarios":["<one or two complete Scenario objects for R1, each a distinct serve owner>"]}
```

The string above illustrates the shape; replace it with real validated Scenario objects, using the existing `rotationTypes.ts` and published `plans/rotations.json` format. Each serve scenario includes its full phase/ball/player tracks, named contacts, setter target and tactics. To support both attack sides and normal/Harry first contact, include all three complete alternates (`right`, `harry`, `harryRight`) with correct tactics metadata. The unchanged team identities/net come from the published app; packets cannot override another rotation or the team. JSON is limited to 1 MB; the same full structural validator runs before it becomes visible. Source positions remain FOR REVIEW / not match-approved.

A future valid link is:

`https://pryyse.github.io/RotationStudio/?ui=court&review=r1-v1&r=1&serve=they&attack=left&first=normal&t=0`

This illustrative ID does not exist in the empty initial manifest. Missing IDs, malformed selections, mismatched SHA/version/rotation and unavailable serves show “Review not available,” with retry and an explicit return to the published example. No fallback court is rendered. Both workspaces restrict navigation to the reviewed rotation and included serves; editing reviews is disabled. Copy view retains review/version/selection/time. Review JSON and Markdown links are in More.

Keep every published ID, entry, JSON and Markdown immutable; publish corrections as `r1-v2`, etc. The Pages workflow validates packet hashes/schema and rejects modification/removal of existing entries or plans against the previous main push. `node --experimental-strip-types scripts/check-reviews.mjs` validates locally. `REVIEW_BASE_REF=<old-main-sha>` also checks immutability. Notes are private unless the owner explicitly exports and publishes them separately; review packets do not import arbitrary public annotations.

## Verification for this release

Production build passed. Initial existing plus focused suite: 192/192; after review fixes, targeted source/workspace/review/notes/clock checks: 23/23. Chromium rendered checks covered 390×844 portrait, 844×390 landscape and 1366×900 Linux touch laptop (plus a narrow window). CDP exercised orbit, all preset ground-plane pans, simultaneous two-touch pan/pinch, pen strokes, finger drawing and second-finger cancellation. Browser checks covered note undo/redo/save/reload, workspace preservation/persistence, fullscreen/native fallback, exact SHA-verified R1 fixture loading and missing/mismatched review failures. The fixture reused existing geometry and was intercepted only in the test browser. No tactics or review fixture were published. Full Studio View/Edit controls and Set arcs remained available.

Physical HP Envy folding, touchscreen, Microsoft Surface Pen 1776, Fedora compositor and actual iPhone Safari were not directly tested; input/fallback testing was emulated in Chromium. The reproducible focused script is `scripts/smoke-court.py`; use `uv run --no-project --with playwright` from `/tmp` with Vite running. No additional test framework was added.
