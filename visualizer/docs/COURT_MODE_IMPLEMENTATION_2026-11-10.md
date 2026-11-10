# Court Mode implementation and handover

Spec: COURT_MODE_CODEX_FRESH_REBUILD_2026-11-10.md. Owner authorizes implementation and direct publication without design gates.

Architecture: independent `src/court` presentation; shared strategy simulation hook and existing 3D actors. Studio presentation loads only in Studio. No tactical source changes.

Design: graphite #202522, chalk #f3f1e8, muted #b4beb7, clay #ddad81, court green #526c60. System humanist sans, tabular time, generous 48px touch controls. Portrait uses court + bottom transport; landscape uses a compact edge dock; tablet gets a wider court and optional persistent coaching sheet. SVG court-line symbol and purpose-drawn controls belong to Court Mode.

- [x] Retire legacy phone JSX/CSS and camera/label presets; retain accepted desktop paths.
- [x] Add stable workspace routing; share exact strategy/rotation/case/time without storage deletion.
- [x] Build Court shell, strategy chooser/import, complete chronological playback, player facts, cameras and focus.
- [x] Add phase/source-scoped local notes and court-plane drawings with pen, undo/redo, import/export.
- [x] Add integrity-bound exact review snapshots/static manifests; visibly fail closed.
- [x] Build + existing domain tests; focused rendered phone/landscape/tablet/desktop checks and critique.
Publication: the owner authorizes direct main publication. The final chat records the resulting commit, successful Pages workflow and served-application check.

Review focus: unsaved selection protection; invalid exact review never falls back; later rally events remain navigable; deliberate camera survives playback/sheet/orientation; annotations never write tactics.

Execution: native in this fresh clean checkout. Repository started at 28facfd on main tracking origin/main. Existing archive was not inspected or copied. All source assets and user storage remain intact.


## Focused verification

- Production TypeScript/Vite build passed. Existing domain suite plus focused Court routing/review cases: **195 passed, 0 failed**.
- Chromium touch emulation: orbit, two-finger pinch/horizontal pan and Reset in all four views, including gestures starting over player labels. Playback does not reset the camera.
- Actual named local strategy switching changes rendered athlete positions. Studio retains the selected strategy; its editor and original Set arcs render.
- Local drawing, undo/redo, note reload and world-coordinate annotation export passed.
- Exact local strategy review opens in an independent browser profile with its original rationale; missing static reviews show an error with no fallback court.
- Phone portrait, landscape edge transport, tablet coaching pane and desktop renders reviewed. Initial court fit was widened; aspect changes now retain camera angle/target/relative zoom while fitting the available stage.
- Receive/set/attack/block phase renders use the same modern articulated actor and ball clock as Studio. No width-based motion reduction.
- No published tactical JSON or authored slice was changed. Browser strategy keys and prior drafts are preserved.
- Physical Fedora Envy touch/Surface Pen hardware and field use were not tested; browser touch and pointer checks are not hardware certification.

## Code and recovery

`src/court/` owns Court UI, SVG icons, styles, sheets, transport and coaching ink. `state/useStrategySimulation.ts` binds strategy overlays once per application lifetime, so switching workspaces cannot re-import an old shared snapshot. Review bundle/strategy state is isolated from recipient-local actors and coverage.

Exact portable reviews include source JSON, sparse edits, context and rationale with SHA-256. Exported review JSON can also be materialized into versioned static JSON/Markdown assets using `node --experimental-strip-types scripts/create-court-review.mjs review.json id version`; the helper refuses to overwrite a version and prints the integrity-bound Pages URL.

Rollback: revert the Court Mode implementation commit to recover the pre-build tree at `28facfd`. Do not reset browser storage. Remaining refinement should start from this shipped implementation rather than the archived failed branch.
