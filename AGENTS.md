# RotationStudio agent instructions

## Current authority: 25 November 2026

Read [docs/FINISH_PLAN.md](docs/FINISH_PLAN.md), [docs/FINISH_STATUS.md](docs/FINISH_STATUS.md) and the operating clauses in [docs/START_HERE.md](docs/START_HERE.md) before software work. Revision 2 delivers a complete 1.0 in five substantial cloud units: reusable data/private save; rebuilt desktop editor; full mobile/practice; conversational AI; integrated finish/release. One fresh substantial review per unit. Previous local controllers, browser/login gates and numerous small handoffs are superseded.

The application is `PRYYSE/RotationStudio`, under `visualizer/`. Private requirements, team facts and protected owner tactical exports belong to `PRYYSE/Volleyball`. Do not publish private player assessments or conversation exports in this public repository.

Court Mode already shipped in `6b9a556` and is part of the reconciled `main@785f762`. Do not replay the old fresh-rebuild prompt, restore the rejected archive, or chase an already-shipped interrupted task. Fetch current main before mutation; these hashes describe the reconciliation, not a permanent checkout pin.

## Product boundaries

- Full Studio owns coach authoring on desktop, phone and tablet; Court Mode owns a distinct practice/review experience. Keep separate presentation and shared domain/simulation. Complete mobile authoring is required, not a desktop handoff.
- Substantial replacement of the editor, components, state, schema and coupled simulation code is authorised when needed. A small diff is not an acceptance criterion. Protect authored data and useful behaviour, not awkward implementation. The whole app must feel like a purposeful coaching tool.
- Reusable players may belong to several teams. Rosters may exceed six; versioned lineups select six stable slots and named fill-in variants. Remove hardcoded original-name and Harry-first assumptions from generic domain contracts. Original examples remain compatible imports.
- Private cloud saving/authentication and the integrated conversational AI coach are required 1.0 features. Follow [docs/AI_COACH_SPEC.md](docs/AI_COACH_SPEC.md). External AI packs and in-app proposals share validation, exact-base court/diff preview, explicit Apply and one Undo. Manual operation survives unavailable AI.
- Visual/interaction quality is OPEN. A previous UI milestone or green tests do not establish owner acceptance. Inspect actual candidate pixels and perform complete tasks.
- Default editing is stage → player → drag → automatic path. Edit only the selected player's incoming previous-to-current route; choose the next moment for the next segment. Optional bends, no mandatory professional keyframe workstation.
- Manual moment selection is instant; Play alone animates. Keep first and later contacts distinct, deliberate camera framing stable, case-local editing default and one Undo step per gesture.
- Preserve named strategy selection, true contact/ball ownership, local plans, safe import/export, exact review isolation, scoped notes/ink and original Set arcs. Invalid review data fails visibly rather than showing a different plan.
- Phones/tablets may default Court Mode with visible Edit; desktops/laptops default Studio. Explicit mode choice persists; resize/folding does not switch mode. Prove phone editing in S1, maintain touch viability in S2, complete mobile in S3.
- UI actions/positions do not silently rewrite contacts or tactics. Software readiness is separate from team/match approval. Current R1 is usable per owner; R3 v4 is still for review; personalised remaining rotations are unfinished.

## Preserve data and work

- Keep authentic SetOptics history, licence/attribution, original source generator and all 48 Team V3 DRAFT cases. Preserve existing published strategy assets and owner originals.
- No clearing personal localStorage, overwriting original drafts, personal browser-profile testing or destructive migrations. Preserve V1/V2 imports and existing bounded 1 MB legacy strategy support. Import new-format copies, preserve source receipts and set suitable bounds for new plans/library backups.
- Verify repository, branch, remote and dirty state, fetch and reconcile safely. Never reset/clean/force-pull or silently stash to make a checkout look clean. Use one writer per worktree and preserve unrelated changes.
- Commit and push recoverable work before interruption/usage limits. Do not leave important work solely in a cloud task filesystem.

## Execution

- **Cloud Work/Codex is the default.** No local controller, browser relay, cron/scheduled task, daemon or idle worker. Windows/Fedora need no task. Preserve their files/cache and unrelated processes; Fedora cleanup remains deferred.
- Cloud backend operations are request-driven. No live API activation until actual owner/grant/expiry and credit-only funding evidence plus the specified reservation boundary are verified. No paid fallback, recharge or secret in client/public files. Missing activation blocks live acceptance, not fixture implementation. Confirm hosting limits and application-only access before private deployment; do not change unrelated account resources.
- Use the slice's [model policy](docs/MODEL_POLICY.md). Fast is a speed setting, not a reasoning setting. Confirm actual picker settings; do not claim a prompt changed the model.
- Use the repository's Node version and lockfile; the current frontend baseline uses Node 22. From `visualizer/`: `npm ci`, `npm test`, `npm run build -- --base=/RotationStudio/`. Choose a compatible cloud runtime for any new CLI without installing anything on the owner's machines. New Cloudflare configuration follows current `cf` guidance, not an invented legacy setup.
- The root Python/video tools are a separate upstream workstream. Do not run root `setup.sh`, install its ML dependencies or request API keys for visualizer work. Read root README and relevant upstream docs only when actually changing that workstream.
- Candidate PR validation provides tests/build and Chromium software-WebGL screenshots. Capture is not independent visual acceptance. Review the exact candidate, not public main in its place.
- Use Chrome/Chromium/Thorium for visual checks. Stop owned preview/test processes at completion. Do not start a personal computer to compensate for missing cloud tooling without an active need.
- Complete the necessary scope of rework. Use focused meaningful regressions for actual behaviour, data/access/billing risks and failures. Visual changes need real interaction/render evidence. Run appropriate final checks on a meaningful candidate; repeat only after a relevant change or unresolved risk. No speculative frameworks, mirrored tests, repeated broad UAT or rollback drills.
- One fresh independent reviewer checks the full slice and provides a consolidated list. The builder fixes it in the same context; recheck changed risks. Routine repairs do not require a new owner planning round.
- Use a candidate branch/PR. Standing merge/publish authority from the original roadmap continues after exact-candidate independent approval and required checks, subject to existing branch protection and documented account activation boundaries. Verify the served result; planning readiness alone does not start execution.
- Keep the requested final Unslop audit and one pre-polish restore point in S5. Inspect the real application and independently review the exact post-polish candidate. Routine reversible UI work uses normal Git recovery.
- Update `docs/FINISH_STATUS.md` once at a meaningful checkpoint. Include candidate, actual tests/rendered evidence, review verdict, open limitations and release result. Report publication only after actual deployment verification.

## Historical guidance

Earlier product/execution notes remain in Git history and linked documents. The pre-reconciliation instructions are available at [AGENTS at 785f762](https://github.com/PRYYSE/RotationStudio/blob/785f762101f63b217b9ddb0ecd198313235701a8/AGENTS.md). Their obsolete mobile-rebuild and delivery directives are historical. Preserve applicable upstream licensing, source/data safety and module conventions when working on upstream Python/video tooling.
