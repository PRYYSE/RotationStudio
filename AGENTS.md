# RotationStudio agent instructions

## Current authority: 25 November 2026

Read [docs/FINISH_PLAN.md](docs/FINISH_PLAN.md) and [docs/FINISH_STATUS.md](docs/FINISH_STATUS.md) before software work. The owner's current goal is a finished, deliberately designed application delivered in four substantial cloud slices, with one substantial independent review per slice. The previous local workflow engine, Windows browser/authentication gates and numerous small handoffs are superseded.

The application is `PRYYSE/RotationStudio`, under `visualizer/`. Private requirements, team facts and protected owner tactical exports belong to `PRYYSE/Volleyball`. Do not publish private player assessments or conversation exports in this public repository.

Court Mode already shipped in `6b9a556` and is part of the reconciled `main@785f762`. Do not replay the old fresh-rebuild prompt, restore the rejected archive, or chase an already-shipped interrupted task. Fetch current main before mutation; these hashes describe the reconciliation, not a permanent checkout pin.

## Product boundaries

- Full Studio owns coach authoring; Court Mode owns a distinct practice/review experience. Keep separate presentation, shared domain/simulation/3D state and modern actor motion.
- Visual/interaction quality is OPEN. A previous UI milestone or green tests do not establish owner acceptance. Inspect actual candidate pixels and perform complete tasks.
- Default editing is stage → player → drag → automatic path. Edit only the selected player's incoming previous-to-current route; choose the next moment for the next segment. Optional bends, no mandatory professional keyframe workstation.
- Manual moment selection is instant; Play alone animates. Keep first and later contacts distinct, deliberate camera framing stable, case-local editing default and one Undo step per gesture.
- Preserve named strategy selection, true contact/ball ownership, local plans, safe import/export, exact review isolation, scoped notes/ink and original Set arcs. Invalid review data fails visibly rather than showing a different plan.
- Phones/tablets default Court Mode; desktops/laptops default Studio. Explicit mode choice persists; resize/folding does not switch mode.
- UI actions/positions do not silently rewrite contacts or tactics. Software readiness is separate from team/match approval. Current R1 is usable per owner; R3 v4 is still for review; personalised remaining rotations are unfinished.

## Preserve data and work

- Keep authentic SetOptics history, licence/attribution, original source generator and all 48 Team V3 DRAFT cases. Preserve existing published strategy assets and owner originals.
- No clearing personal localStorage, overwriting original drafts, personal browser-profile testing or destructive migrations. Preserve V1/V2 compatibility and existing bounded 1 MB strategy support.
- Verify repository, branch, remote and dirty state, fetch and reconcile safely. Never reset/clean/force-pull or silently stash to make a checkout look clean. Use one writer per worktree and preserve unrelated changes.
- Commit and push recoverable work before interruption/usage limits. Do not leave important work solely in a cloud task filesystem.

## Execution

- **Cloud Work/Codex is the default.** No local controller, browser relay, cron/scheduled task, daemon, paid API or idle worker. Windows is not part of this workflow. Fedora is only an explicitly chosen fallback; preserve all existing files/cache and unrelated processes.
- Use the slice's [model policy](docs/MODEL_POLICY.md). Fast is a speed setting, not a reasoning setting. Confirm actual picker settings; do not claim a prompt changed the model.
- Use Node 22 and the existing lockfile. From `visualizer/`: `npm ci`, `npm test`, `npm run build -- --base=/RotationStudio/`.
- The root Python/video tools are a separate upstream workstream. Do not run root `setup.sh`, install its ML dependencies or request API keys for visualizer work. Read root README and relevant upstream docs only when actually changing that workstream.
- Candidate PR validation provides tests/build and Chromium software-WebGL screenshots. Capture is not independent visual acceptance. Review the exact candidate, not public main in its place.
- Use Chrome/Chromium/Thorium for visual checks. Stop owned preview/test processes at completion. Do not start a personal computer to compensate for missing cloud tooling without an active need.
- Make focused changes and focused failure regressions. Run the appropriate final suite/build once per meaningful candidate; repeat only after a relevant change. No speculative frameworks, repeated broad UAT or unrelated refactors.
- One fresh independent reviewer checks the full slice and provides a consolidated list. The builder fixes it in the same context; recheck changed risks. Routine repairs do not require a new owner planning round.
- Keep the final requested Unslop audit and pre-polish backup in S4. It must inspect the real application and preserve functionality and source truth.
- Update `docs/FINISH_STATUS.md` once at a meaningful checkpoint. Include candidate, actual tests/rendered evidence, review verdict, open limitations and release result. Report publication only after actual deployment verification.

## Historical guidance

Earlier product/execution notes remain in Git history and linked documents. The pre-reconciliation instructions are available at [AGENTS at 785f762](https://github.com/PRYYSE/RotationStudio/blob/785f762101f63b217b9ddb0ecd198313235701a8/AGENTS.md). Their obsolete mobile-rebuild and delivery directives are historical. Preserve applicable upstream licensing, source/data safety and module conventions when working on upstream Python/video tooling.
