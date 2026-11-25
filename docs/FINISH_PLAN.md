# RotationStudio 1.0: product and delivery plan

**Revision 2, 25 November 2026 (Adelaide). Current delivery authority.**

**Goal:** Finish a capable, straightforward volleyball coaching tool for desktop, tablet and phone, with a substantially improved editor, reusable players and teams, AI-editable plans and an integrated conversational coach. This replaces the earlier four-slice polish plan with five substantial deliveries.

**Execution:** Cloud Work/Codex, one builder and one fresh consolidated review per delivery. The owner accepts manual task starts. No local controller, personal-computer worker, scheduled relay or mandatory Normal Chat handoff. [START_HERE.md](START_HERE.md) contains setup and model-specific prompts; [MODEL_POLICY.md](MODEL_POLICY.md) owns routing; [FINISH_STATUS.md](FINISH_STATUS.md) owns actual progress.

**Architecture:** Continue the existing React/TypeScript/Vite and Three.js application where useful, with a versioned authoring domain, small private cloud API/storage and bounded AI proposal service. The current editor, component/state structure and fixed-roster assumptions may be replaced. Data, AI and credit controls are in [AI_COACH_SPEC.md](AI_COACH_SPEC.md).

## 1. Original intent and current corrections

This revision retains the original [69-requirement register](https://github.com/PRYYSE/Volleyball/blob/26eeb7084a05a4e1db81ed71b404cb21c270814b/docs/ROTATIONSTUDIO_REQUIREMENTS_AND_REVIEW_REGISTER_2026-10-30.md), [amended roadmap](https://github.com/PRYYSE/Volleyball/blob/26eeb7084a05a4e1db81ed71b404cb21c270814b/docs/ROTATIONSTUDIO_LOCKED_DELIVERY_ROADMAP_2026-10-31.md), later Court requirements and owner corrections. Core outcomes remain: a deliberately designed application, stage-first editing, useful path/action/coverage control, realistic whole-rally movement, player-specific teaching and independent product review. The [software crosswalk](REQUIREMENT_COVERAGE.md) and private crosswalk retain traceability.

The latest owner instruction supersedes fixed-roster, mobile-view-only, no-backend/API and minimal-change restrictions. The earlier plan is recoverable at [72b2f58](https://github.com/PRYYSE/RotationStudio/blob/72b2f5887c7d0be6e3e3937d4d3041e997e65b58/docs/FINISH_PLAN.md). Old completion labels do not establish visual acceptance.

Court Mode already shipped. The unchanged baseline passed 199 tests, a Pages build and cloud WebGL capture. Actual images exposed phone overflow from a long plan title, unclear player labels, clutter and a weak plan workflow. Source inspection also found six-name player IDs, hardcoded `normal/harry` branches, source-bound moment identities and no complete mobile authoring. The new contracts must remove those restrictions before the interface is finished.

## 2. Rewrite authority and protected outcomes

**Build the right product. Minimising the diff is not an acceptance criterion.** Workers may substantially redesign or replace the editor, controls, layout, components, state management and internal representation. Remove obsolete duplicate paths once the replacement works. Existing code and passing tests are not reasons to retain an awkward interaction.

Protect authored data and useful behaviour:

- Owner exports, browser drafts, annotations, published examples and all 48 original Team V3 DRAFT cases. Import new-format copies; do not silently rewrite originals.
- Authentic SetOptics provenance/licensing and original Set arcs.
- V1/V2 imports and existing exact reviews, including the existing 1 MB legacy import capability. Define appropriate bounded limits for new plans and whole-library backups instead of applying one old limit blindly to every new entity.
- Instant manual moment selection, explicit Play, exact-case/occurrence scope by default, one Undo per completed gesture/proposal, and reliable save/reopen.
- Truthful ball/contact ownership, consistent actor/ball paths, distinct later digs/sets, deliberate camera framing and a meaningful action/responsibility for every active player.

These contracts do not freeze UI anatomy, named enums, CSS, schema implementation, state stores or simulation plumbing. Keep the renderer where it helps; replace coupled parts when the outcome requires it. Legacy compatibility should be one import boundary, not a second active editor.

Normal Git commits/branches provide routine recovery. Add an export/restore point for a real data migration and the requested final Unslop pass. Do not build speculative rollback machinery, reset to old releases during routine work or rehearse rollback for reversible UI changes. Routine reversible implementation choices do not need owner permission.

## 3. The finished product

### Players, teams and lineups

The private app begins with a clear create/import path. The original six people are an optional example or legacy import, not hardcoded identities.

A reusable Player can belong to multiple Teams. A roster may include reserves and fill-ins; a named Lineup chooses six active players, their initial order and team-specific roles. Alternate lineups and player replacements create explicit versions/copies. Old plans/reviews retain their original player and lineup references. A fill-in does not silently inherit a claim that the old tactics suit them.

Player creation must reveal depth progressively:

| Layer | Simple owner-facing controls |
|---|---|
| Quick profile | Name, optional height in cm, optional gender, handedness, preferred roles and strength chips. |
| Main abilities | Labelled five-step choices/sliders for receiving, setting, attacking, serving, blocking, defence and movement. Each has plain anchors and Unknown. |
| Optional depth | Consistency, pressure, short/deep coverage, lateral movement, communication, rotation familiarity, attack-side preferences, known reach and practical limitations. |
| Team context | Role/availability and coaching notes for this team or lineup, without changing the global person. |

Unknown is not zero or average. Distinguish measured facts from coach estimates, with confidence/source/date. Never infer ability from gender or height. Existing private profiles may seed a reviewable import; missing ratings are not invented. Detailed fields are in the AI specification.

### Full Studio: straightforward control

The editor needs serious redesign, including replacement where appropriate. Its default journey is:

**Choose team/lineup and plan → choose rotation/serve/case → choose moment → select player → place them → preview → save.**

Movement between moments connects automatically. Show the selected player's incoming previous-to-current route; select the next moment for the next segment. Refinement tools stay close to selection, without a mandatory multitrack/keyframe workstation.

Required behaviour:

- Direct selection/placement, plus tap-to-place or precise nudge/coordinate alternatives when a finger obscures a target.
- Clear editing, camera and drawing modes; viewport width cannot change mutation semantics.
- Incoming bends/straighten, ellipse/polygon coverage, teaching action/cue, explicit contact assignment and intentional additional moments/timing where needed.
- Stable moment identity through renaming/reordering, including first and later digs/sets.
- Contact changes update ball/actor dependencies coherently. A pose change alone never transfers possession.
- One gesture, one Undo; cancellation commits nothing. Exact-case edits default; shared edits preview their affected cases.
- Immediate feedback, stable camera, useful before/after comparison, reliable save/reload and conflict recovery.
- Incomplete drafts can be saved. Missing scenarios are identified rather than silently replaced by a fallback and labelled complete.

### Practice, review and handoff

Court Mode remains an independently designed practice/review presentation sharing the same domain/simulation. It includes the full rally, meaningful moments, player-specific Now/Next/If, camera/focus, recoverable ink/notes and exact review data.

Court may remain the phone/tablet default and Studio the desktop default, with a visible Edit action and persistent explicit choice. **Every supported device must support complete authoring.** Playback-only mobile or a required desktop handoff fails 1.0.

Plans must reopen consistently across the owner's devices through private cloud storage. Import existing browser-local work into a new cloud copy explicitly. A4 references must be spatially useful. Public review exports include necessary display/tactical information and exclude private assessments, private notes and assistant conversations. Preserve independent friend editing: the public build supports explicit local import → edit → export of a redacted editable copy, without private cloud access, API credentials or signup. Exact review remains read-only until the recipient deliberately creates their own copy; it never overwrites their work.

### External AI editing and integrated coaching

Two entry points use the same validated proposal contract:

1. **External AI:** export a documented editing/coaching pack with stable IDs, selected plan/context and schema. ChatGPT or another capable assistant returns a plan/patch that the app validates and previews. This requires neither API credits nor a new MCP service.
2. **Integrated coach:** discuss a selected team/lineup or existing plan in the app. Ask material unanswered questions, create a coherent playbook, explain trade-offs, accept criticism and revise selected rotations/moments without blindly changing everything.

The API receives explicit versioned knowledge. It does not automatically inherit this Project, past chats, skills or private repository. Distil the owner's methodology into a private reviewed coaching profile and approved examples.

Generation must cover the requested rotations and both serve states with declared branches/completeness. Every authored moment assigns all six a meaningful job. The plan accounts for selected league rules, actual contact order, setter availability, legal attackers, paths, short/deep defence and plausible transitions. Optimisation means a strong explainable proposal under known constraints, not a guaranteed global optimum or referee approval.

AI output is a proposal: validate → court/diff preview → Apply/reject → one Undo. No silent overwrite of accepted cases, profiles, source examples or saved preferences. Remembering a coaching preference is an explicit owner action scoped to the relevant team.

The complete in-app coach is required for 1.0. Credentials can remain disabled while implementation/fixtures proceed. A stub, export button or disabled AI control does not satisfy the live feature.

## 4. A tool-like visual and interaction system

**A coaching workbench centred on the court**, including Players, Teams and Plans.

- Compact application navigation and contextual authoring/practice controls.
- One concise plan/scenario context, stable court, one inspector/sheet and useful moment/playback rail. Consolidate repeated strips and statuses.
- Deliberate typography, control hierarchy, useful density, functional colour, consistent icons and accessible selected/focus/pressed/disabled states.
- Direct manipulation and controls carry the task. Concise help appears at decisions; technical IDs/schema/source diagnostics stay in details or export.
- Complete empty/loading/saving/offline/conflict/import/AI-exhaustion states. Failed WebGL must show useful recovery instead of blank court surrounded by apparently working controls.
- Reliable label-to-athlete association and meaningful camera framing. Long titles never widen the entire app beyond the viewport.
- Desktop workbench, reachable phone tools, deliberate landscape/tablet compositions and working software-keyboard states. A dense editor must work as well as the initial screen.

The builder chooses and carries through a coherent design. Exploration is bounded and internal unless a consequential preference needs the owner. A colour/spacing-only pass fails the editor and application outcome.

## 5. Efficient desktop/mobile sequence

1. **S1:** shared data/commands and a real desktop AND phone edit, preview, Undo and save/reopen using a newly named team.
2. **S2:** establish complete desktop authoring and application design; keep touch viability visible as tools are introduced.
3. **S3:** complete all phone/tablet authoring and practice, plus motion/input across both. This is substantial product work, not a CSS port.
4. **S4:** integrate the AI coach into both presentations together.
5. **S5:** review and polish the complete product after its flows exist.

This proves touch early, establishes the desktop interaction reference and completes mobile before final polish. It avoids two separate editing engines and a late discovery that desktop assumptions cannot work on a phone.

Representative targets: 1440×900 desktop, the owner's 3440×1440 ultrawide, approximately 390×844 phone, 844×390 landscape and 1024×768 tablet. Pixel 9 Pro XL is the primary real phone. Use long names, the real named-plan overflow case, a selected player and a dense tool state. Report physical-device verification separately from CSS/touch emulation; do not maintain an exhaustive matrix without a concrete risk.

## 6. Five implementation deliveries

Starting reasoning is **High** with **Fast while the account promotion applies**. See model policy for evidence and older-model fallbacks. A slice can have multiple commits or continued sessions; it does not restart planning when a context ends.

| Slice | Builder | Fresh reviewer | Complete outcome |
|---|---|---|---|
| S1 | Sol 6.2 | Sol 6.2 | Reusable entities/contracts, private persistence, external AI editing and desktop/phone edit proof. |
| S2 | Astra 6.2 | Astra 6.2 | Rebuilt desktop Studio/editor and complete player/team/plan workflows with coherent application design. |
| S3 | Astra 6.2 | Sol 6.2 | Complete mobile/tablet authoring, Court practice, motion/input and teaching/share journeys. |
| S4 | Sol 6.2 | Astra 6.2 | Grounded conversational AI generation/editing, safe proposal application and verified credit controls. |
| S5 | Sol 6.2 | Astra 6.2 | Integrated acceptance, material repairs, backed-up final Unslop and verified release. |

### S1. Reusable team and authoring foundation

**Outcome:** a new team and named fill-in lineup are real data, can save privately and can be edited through the same contract by UI or external AI.

**Starting seams:** `visualizer/src/lib/strategyDraft.ts`, `strategyEvents.ts`, `strategyOverlay.ts`, `rotationTypes.ts`, `rotationValidation.ts`, `strategyLibrary.ts`, `courtReview.ts`, `state/strategyStore.ts`, `useStrategySimulation.ts`; new small `src/domain/`, `visualizer/contracts/` and request-driven `visualizer/server/`. Paths are a starting map, not a restriction on better organisation.

- [ ] Implement versioned Player, Team, Lineup, Strategy, Case, Moment, Contact, Review and Proposal contracts from the AI specification. Stable tactical slot IDs resolve to reusable people; roles and names are data.
- [ ] Import legacy plans into new copies with pinned sources/event maps. Original payloads/notes survive; unresolved mappings remain recoverable. A new team must not secretly become the old six IDs behind an adapter.
- [ ] Implement shared validation, transactions, deterministic playback compilation, expected-revision conflicts, idempotent saves and atomic Undo.
- [ ] Implement private cloud storage/API and owner authentication, with preview fixtures isolated from production. Complete fixture implementation before unavailable account steps; private-save acceptance still requires configured live hosting.
- [ ] Supply AI editing schemas, concise guide, synthetic complete pack/proposal and a validation command. Import never auto-applies a patch.
- [ ] Prove one non-zero placement, Undo and save/reopen on desktop and phone plus a named fill-in copy. A simple usable library entry is sufficient here; full editor/form refinement follows in S2.

**Minimum evidence:** roster larger than six, two teams sharing a player, fill-in variant, renamed IDs remaining coherent, legacy import, stale-save preservation, unauthorised API denial and the non-zero edit/reload on both input presentations. Focused contract tests; no full-product UAT yet.

### S2. Rebuild Studio and the team workflows

**Outcome:** create a team/lineup, build and revise a plan, and understand each edit's effect without fighting the interface.

**Starting seams:** `StudioApp.tsx`, `ui/Rotations.tsx`, `StrategyLibrary.tsx`, `DesktopAthleteEditor.tsx`, `DesktopEventRail.tsx`, `StrategyEditor.tsx`, playback/focus panels, application styles and the S1 domain. Replace components when that is the better implementation.

- [ ] Carry the workbench direction through shell, Players, Teams, Lineups, Plans, View and Edit, including progressive profile forms and deliberate fill-in variants.
- [ ] Complete placement, incoming-route bends, coverage, action/cue, supported contact/moment/timing, comparison, case scope and save feedback. Real controls take priority over paragraphs.
- [ ] Make selection/navigation/Undo predictable. Correct underlying state/renderer coupling when required; do not preserve it for a small diff.
- [ ] Use a new roster and a legacy plan. Fix long-title overflow and identity ambiguity; keep touch proof viable and command semantics consistent.
- [ ] Inspect matching before/after screens and a full authoring journey. This is a useful point for one owner direction/taste check; worker/reviewer remain responsible for finding bugs.

**Minimum evidence:** create player/team/six-slot lineup, create plan, edit a later moment and route/zone/action/contact, preview, Undo, save/reopen and create a fill-in version. Inspect desktop/ultrawide and phone interaction proof. Required control must remain discoverable; developer-text scaffolding and resistant manipulation fail acceptance.

### S3. Complete mobile, practice and motion

**Outcome:** phone/tablet users author the same plans and use them at practice, with reliable motion/input across both workspaces.

**Starting seams:** responsive editor; `court/*`; `three/RotationPlayer.tsx`, `RotationLabels.tsx`, `RotationCameraRig.tsx`, route/coverage/scene components; motion/strategy libraries; `TeamReference`, share, notes and review boundaries.

- [ ] Finish phone/tablet player/team/lineup forms, every case/moment, accurate placement, routes/coverage/actions/cues/contacts/timing, Undo, preview, save/reopen and import/export. No desktop-only required operation.
- [ ] Resolve finger occlusion, keyboard resizing, pointer cancellation, camera/edit/draw conflicts, orientation, long names and short viewports. Explicit workspace choice survives resizing/folding.
- [ ] Finish block/turn/approach/recovery timing, full-rally continuity, labels, camera framing and persistence. Ball actors/endpoints, poses and coaching instructions agree.
- [ ] Complete Court playback/focus, scoped ink/notes, exact reviews, Now/Next/If, recipient-safe share/backup and actual A4 spatial reference. Preserve public local import/edit/export for a friend's independent copy, without exposing private profiles or AI access. Only modelled variations are offered as animated scenarios.
- [ ] Pause unnecessary rendering/work when hidden and stop owned QA processes at completion. No local background worker or service-worker background sync.

**Minimum evidence:** full phone authoring journey; portrait/landscape/tablet states; real moving rallies spanning serve orders and repeated contacts; camera/drawing separation; save/notes reload; isolated-recipient review followed by deliberate independent copy/edit/export; and actual print. Sol reviewer watches motion and can escalate one substantiated unresolved spatial question to Astra, rather than rerunning the whole review automatically.

### S4. Integrated conversational volleyball coach

**Outcome:** select team/lineup, answer a few relevant questions, receive a coherent playable proposal, discuss criticism and apply only intended revisions.

**Starting seams:** S1 domain/contracts/server, `visualizer/server/assistant/`, curated knowledge/rules, private coaching preferences, assistant UI and proposal preview. Follow the AI specification; no general autonomous-agent platform.

- [ ] Assemble explicit versioned context and distil existing private coaching methodology into a reviewable profile. Never claim automatic memory of earlier ChatGPT conversations.
- [ ] Complete initial questions, generation, declared coverage, trade-offs, selected-case revision, source-linked uncertainty and explicit remembered preferences.
- [ ] Compile compact authored intent into playback. Bound whole-playbook chunks, repair calls and cost within one owner-started foreground task; no exhaustive frame-by-frame LLM output or agent swarm.
- [ ] Apply structural/rule checks and separate advisory plausibility checks. Complete exact-base court preview/Apply/reject/Undo; never silently rewrite source, contacts, profiles or approved cases.
- [ ] Implement and test credit-only activation, reservations, expiry and failure handling. Provider credentials follow fixture implementation and actual owner/grant/funding verification.
- [ ] Exercise a small representative coaching set: new team, fill-in, setter-first, unclear instruction, league conflict, invalid/stale proposal and exhausted credits. Compare models only for a named quality uncertainty.

**Minimum evidence:** a bounded live request after verified activation generates the complete requested proposal; conversational criticism produces a scoped actual change; preview, validation and one Undo agree. Exhaustion/unknown accounting preserves manual operation. A missing owner activation step blocks live acceptance, not unrelated implementation.

### S5. Integrated finish and release

**Outcome:** complete desktop/mobile journeys pass independent review and the final candidate is deployed.

- [ ] Fresh whole-product review of creator → AI discussion/edit → practice → share/print → reopen on another device, plus a legacy import and Set arcs. Use the crosswalk for coverage, not one script per row.
- [ ] Repair one prioritised material-findings list. Continue the reviewer through fixes; recheck changed paths and affected neighbours. Neither hide a defect to meet a one-round target nor start repeated unrelated audits.
- [ ] Create one pushed pre-polish restore point and matching renders. Retrieve the complete upstream [Unslop skill folder pinned at 620163e](https://github.com/heydamir/unslop/tree/620163eedb3529d9cd23a3994ed8d287d06f760d/skills/unslop) into `.agents/skills/unslop/`, retaining its references/scripts, attribution and CC-BY-4.0 licence. Read the full skill before applying it across actual user-facing modes. It is **not installed by this planning revision**. Sol implements known fixes; use Astra only for a named unresolved redesign if needed.
- [ ] Reviewer inspects post-Unslop renders/affected journeys and approves the exact final commit. Never release an unreviewed polish commit.
- [ ] Run the relevant final suite/build/deployment checks. Verify the served private app and maintained public example/review/local-edit entry; record release, restoration reference and limitations.
- [ ] Provide the finished app and concise usage guide for final human review, with tactical decisions separated from software readiness.

**Acceptance:** no known material in-scope software, data, billing-boundary or visual defect; real journeys on both devices; live AI acceptance evidenced; original work recoverable; served release matches reviewed source. If an owner-only activation remains, identify that acceptance blocker rather than calling the entire 1.0 complete.

## 7. Proportionate work and review

One writer per branch/worktree. Read active documents first; consult history for a named gap. Push recoverable progress before limits/interruption. Continue the same coherent slice after a context break without another planning exercise.

Use a feature branch and candidate PR for each substantial unit. The original roadmap's standing merge/publish authority continues: after the assigned independent reviewer approves the exact candidate and relevant required checks pass, merge the reviewed work and verify the resulting deployment without another routine permission loop. Respect existing branch protections and the guide's owner-only hosting/API activation boundaries. An unreviewed candidate or failed activation gate is not authority to publish private data. Merely marking S1 Ready does not start it; the owner starts each unit with the guide's prompt.

Use focused tests while iterating. Existing engine/data tests remain useful; replace obsolete UI tests when their interaction is deliberately redesigned. Test count is not a target. Label/spacing fixes need visual inspection; schema migration, authorisation, stale-save and credit-reservation boundaries need meaningful failure checks.

Run appropriate final checks on a meaningful candidate. Repeat a passed check only after a relevant change or unresolved risk. Extend the existing cloud browser evidence to real edits and motion. Screenshots existing is not approval. Stop once criteria are evidenced and material findings resolved. Avoid speculative performance programmes, frameworks, logging, rollback drills and review swarms.

Normal Chat is useful for an actual conversational product/tactical choice. Repository research, implementation, code review and testing can stay in cloud Work/Codex. Do not require planner/reviewer relays or owner forwarding of individual fixes. The guide's model-specific prompts explicitly override stale minimal-change and over-testing instructions.

## 8. Tactical continuity and limits

Preserve the original team's nuanced methodology privately. R1 was usable per owner; R3 v4 still needs review; personalised R2/R4–R6 remain unfinished. Latest sequence is R3 review, R2 both serves, then R4–R6 together when directed. That is not a twelve-software-slice schedule and does not constrain another team's workflow.

The coach respects explicitly locked cases and distinguishes proposals from approved tactics. It may challenge a preference with reasons and an alternative, but not silently apply the criticism. Demonstrate complete six-rotation generation capability; actual acceptance of Caleb's remaining team playbook remains an owner decision.

1.0 includes saved alternate/fill-in lineups, not live match scoring/substitution tracking. It does not require native packaging, real-time multiuser editing, video analysis, voice, vector databases, fine-tuning, public SaaS signup or paid background research. Add such scope only for a concrete accepted need; these limits do not protect poor existing implementations.

## 9. Setup boundary

The GitHub candidate workflow is already verified. This revision changes the plan/instructions, not S1–S5 product code. It does not provision private hosting, claim credits or spend them. Actual account prerequisites are in [START_HERE.md](START_HERE.md). No Windows/Fedora task is required; Fedora cleanup remains a deferred note.
