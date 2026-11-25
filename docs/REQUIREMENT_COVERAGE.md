# Software requirement coverage

**Revision 2, 25 November 2026.** This public projection retains all **80 original software rows**: E01–E31, W01–W14, R01–R26 and C01–C09. It adds **N01–N32** for the latest scope and acceptance contracts. Private player assessments, team rankings and original tactical exports are excluded.

**Authority:** [FINISH_PLAN.md](FINISH_PLAN.md), supported by [AI_COACH_SPEC.md](AI_COACH_SPEC.md) and [START_HERE.md](START_HERE.md). These are requirement dispositions, not a second live progress ledger. Candidate/release evidence belongs in [FINISH_STATUS.md](FINISH_STATUS.md). An assigned unit does not close a requirement or claim implementation.

**Provenance:** original E/W wording and R findings come from the [30 October register](https://github.com/PRYYSE/Volleyball/blob/26eeb7084a05a4e1db81ed71b404cb21c270814b/docs/ROTATIONSTUDIO_REQUIREMENTS_AND_REVIEW_REGISTER_2026-10-30.md), with the [31 October roadmap amendments](https://github.com/PRYYSE/Volleyball/blob/26eeb7084a05a4e1db81ed71b404cb21c270814b/docs/ROTATIONSTUDIO_LOCKED_DELIVERY_ROADMAP_2026-10-31.md) and later Court requirements. Their complete software projection is below, so private-source access is not needed to implement it. The private crosswalk additionally retains T01–T24 and their provenance; `T` means separately tracked tactical authoring/owner approval.

## Delivery ownership

| Unit | Owns |
|---|---|
| S1 | Reusable players/teams/lineups, generalised contracts, private save/auth, external AI exchange and one desktop/phone edit proof. |
| S2 | Complete desktop Studio/editor and player/team/plan workflows, whole-app art direction and ongoing touch viability. |
| S3 | Complete phone/tablet authoring, Court practice, motion/camera, advanced editing and recipient/share/reference journeys. |
| S4 | Grounded conversational AI, scoped proposals and verified credit-only runtime controls on both devices. |
| S5 | Integrated acceptance, material fixes, final Unslop and verified release. |

S5 validates the integrated product even when a row names only its implementation owners. `Workflow` and `All (S1–S5)` describe operating requirements, not extra deliveries. Fixed-original-six, viewing-only mobile, no-backend/API and minimum-diff restrictions are superseded; preservation concerns authored data and valid behaviour, not awkward code or UI. Historical conditional suggestions do not automatically become extra features.

## Original software requirements and reviewer findings

| ID | Requirement/finding | Reconciled disposition | Delivery owner |
|---|---|---|---|
| E01 | Actual SetOptics 3D fork | Preserve the actual fork, provenance and authored data; replacing UI, editor, state or coupled internals is authorised when needed for the agreed product. | S1; S5 |
| E02 | Original Set arcs and 3D foundations | Preserve original Set arcs, licensing and useful 3D behaviour; implementation boundaries may change without freezing the current engine/plumbing. | S3; S5 |
| E03 | Hosted application without dev tools | Public Pages exists; private Worker/D1/Access hosting is newly required and activation remains pending. Verify both private app and maintained public entry at release. | S1; S5 |
| E04 | Actual locations and movement for both serve scenarios | Implemented source playback; animation realism/owner tactics incomplete | S1; S3; T |
| E05 | Independent owner/friend/AI strategy versions | Local versions exist. Add pinned cloud revisions and explicit copies; public friends can import a redacted roster/plan, edit locally and export without private cloud/profile/API access. | S1; S2; S3 |
| E06 | Create, rename, duplicate, save, delete strategies | Basic operations exist; complete private create/rename/copy/save/delete and clear plan provenance on desktop and phone, without silently replacing same-named plans. | S1; S2; S3 |
| E07 | Safe share and actual editable import/export | Existing imports/shares remain compatible. Validate external-AI proposals and recipient import→local edit→export, explicitly saving a copy and preserving recipient state; redact private assessments/conversations. | S1; S3; S5 |
| E08 | Stage → move → automatic paths | Retain stage→player→place→automatic path as the default; complete editor replacement is allowed to make it straightforward on both input presentations. | S1; S2; S3 |
| E09 | Direct player select/drag on top-down court | Direct placement exists; shared commands need drag preview/one commit plus usable touch placement or precise alternatives, cancellation and one Undo. | S1; S2; S3 |
| E10 | Automatic route with optional bend editing | Implemented; latest incoming-only amendment supersedes two-direction UI | S2; S3 |
| E11 | Per-stage spacing/movement control | Authentic-event editing exists. Support intentional additional moments/timing where needed; an arbitrary professional timeline/workstation remains outside the default product. | S1; S2; S3 |
| E12 | Visible Ready/Receive/Set/Attack/Block/Cover/Recover actions | Implemented including newer Serve action; real motion/turning quality open | S2; S3 |
| E13 | Editable per-player responsibility/coverage | Ellipse and polygon editors implemented; clarity/occurrence integrity review | S2; S3 |
| E14 | Distinct first/later digs and authentic contacts | Preserve distinct first/later contact identities through generalized stable moment IDs, rename/reorder and full mobile editing; no mandatory pro timeline. | S1; S2; S3 |
| E15 | Simple meaningful stages, accurate defensive anchor | Implemented stage selection; sport grounding/visual context remains reviewable | S1; S2; S3; T |
| E16 | Manual seek instant, only Play animates | Implemented protected semantic | S1; S2; S3 |
| E17 | Full edited-rally Play from selected moment | Implemented; fidelity and coherent controls open | S2; S3 |
| E18 | Exact visible case default, explicit shared changes | Exact case/occurrence remains default. UI and AI shared changes preview affected cases; stale-base protection prevents silent cross-case or cross-device overwrite. | S1; S2; S3; S4 |
| E19 | Coherent Undo/Redo/Reset and save/reload | Local Undo/save exists; shared transactions, revision conflicts, proposal Undo and private cross-device reopen must work without erasing newer work. | S1; S2; S3; S4 |
| E20 | Independent readable coverage/movement overlays | Implemented controls; crowded states and default hierarchy open | S2; S3 |
| E21 | Small feet-anchored name/P tags and identity | Implemented; label legibility/crowding product acceptance open | S2; S3 |
| E22 | Quick Top/Front/Side/Orbit controls | Implemented in workspaces; gesture/reset quality acceptance required | S2; S3 |
| E23 | Useful own-half Fit and preserved camera | Implemented refinements; actual framing/resize/phase quality open | S2; S3 |
| E24 | Shuffle only authored variations | Implemented source-bounded practice feature; retain accessibility/truth | S3 |
| E25 | First Ball + left/right and normal/Harry-first | Preserve all 48 legacy authored cases. Replace normal/Harry-first runtime identity assumptions with typed lineup-role conditions; never advertise an unmodelled animated branch. | S1; S3; S4; T |
| E26 | Useful selected-player Now/Next/If | Grounded guidance exists; connect actual selected lineup/case/moment and revised cues without inventing missing tactics or treating AI suggestions as accepted. | S3; S4; T |
| E27 | Useful spatial tactical reference/print | Full-stage/two-page A4 reference shipped; final teachability/print check open | S3; S5 |
| E28 | Richer run/attack/block/defend/recover choreography | Basic/shared poses implemented; owner reported fast/odd block turns | S3 |
| E29 | Current-vs-source visual ghost/comparison | Source comparison exists; retain readable ghosts/changes and add actual-court proposal previews without exposing private diagnostics in normal UI. | S1; S2; S3 |
| E30 | Preserve user V4 R1/R2 and legacy data | Preserve all available V4/V1/V2 originals and bounded 1 MB legacy import; old original R2 remains unrecovered. New imports create mapped copies, not destructive migrations. | S1; S5 |
| E31 | Genuinely usable mobile viewing | Viewing exists in Court Mode, but latest scope requires complete phone/tablet authoring. Prove one edit in S1 and finish all mobile authoring in S3 before final acceptance. | S1; S3; S5 |
| W01 | Purposefully designed polished app | OPEN by owner rejection; redesign the editor and whole application as a useful coaching tool. Earlier UI completion and passing tests are not aesthetic acceptance. | S2; S3; S5 |
| W02 | Desktop primary authoring, mobile separately planned | Superseded: mobile is full authoring scope. Sequence is S1 desktop/phone proof, S2 desktop workbench with touch viability, S3 complete mobile/tablet, S4 AI on both. | S1; S2; S3 |
| W03 | Simple discoverable editing, no technical timeline burden | Retain simple stage-first control with optional depth; replace resistant editor structures rather than preserving them for a smaller diff. | S2; S3 |
| W04 | Real visual/use review, beyond examples | Historical reviews are evidence only; each substantial unit needs real candidate interactions/rendered review and final integrated acceptance. | All (S1–S5) |
| W05 | GitHub context and recovery continuity | Current plan/status/guide consolidate authority; preserve history and recoverable GitHub progress. Resume coherent units without reconstructing inaccessible chats. | Workflow; All (S1–S5) |
| W06 | Owner vision/tactics; critical reviewer; bounded implementer | Owner goals/tactical decisions remain authoritative. Builders may redesign/restructure substantially; one fresh reviewer assesses the complete outcome without a mandatory Normal Chat relay. | Workflow; All (S1–S5); T |
| W07 | Independent QA before user handoff | One fresh substantial review per unit, consolidated repairs in the builder context; final human judgement is not developer QA or a beta bug hunt. | All (S1–S5) |
| W08 | Windows D, Codex and Chrome/Thorium | Windows D-drive execution is superseded by cloud work. Chrome/Chromium/Thorium, no personal-computer workers and no idle background workflow remain required. | Workflow; All (S1–S5) |
| W09 | Meaningful tested incremental public releases | Use coherent independently reviewed deliveries, not micro-releases. Private cloud app and redacted public example/review/edit entry have distinct release boundaries. | Workflow; All (S1–S5) |
| W10 | Full released software, tactics DRAFT where unaccepted | Full 1.0 requires live integrated AI plus desktop/mobile acceptance; clearly separate source DRAFT, generated proposals and owner-approved tactics. | S3; S4; S5; T |
| W11 | Bounded efficient workflow without fake deadline | Five substantial units replace orchestration and tiny handoffs. Stop at evidenced acceptance; no fake deadline, repeated planning or unnecessary verification. | Workflow; All (S1–S5) |
| W12 | Short useful recurring status | Use concise active-work/checkpoint reporting. Do not revive hourly automation, scheduled polling or idle workers. | Workflow; All (S1–S5) |
| W13 | Separate exact user and reviewer requirement/status lists | Preserve all 69 original user rows, 26 reviewer findings and nine Court additions; N-series records new scope without replacing original IDs or provenance. | Workflow; All (S1–S5) |
| W14 | No automatic unrelated banner branding | Retained design constraint | S2; S5 |
| R01 | Court/inspector proportion and wasted ultrawide space | Existing layout is not accepted; compose court, inspector and tools deliberately for desktop/ultrawide and the corresponding mobile task. | S2; S3 |
| R02 | Generic dashboard/pill art direction | OPEN by latest owner rejection; integrated redesign required | S2; S3; S5 |
| R03 | Duplicate rails and hidden true events | Single rail/temporary chooser shipped; retain full events | S2; S3 |
| R04 | Manual phase unexpectedly animates | Fixed historical semantic; preserve regression | S1; S2; S3 |
| R05 | Intrusive/overlapping labels | Improved but dense-net visual acceptance remains open | S2; S3 |
| R06 | Colour-only identity when labels off | Roster/highlights exist; assess accessible identity in real states | S2; S3 |
| R07 | Implicit select/move/camera gestures | Original speculative finding remains evidence-led; the new editor must provide explicit camera/edit/draw separation and resolve actual touch/cancellation conflicts. | S2; S3 |
| R08 | Mysterious/incomplete route semantics | Incoming-only amendment implemented; directional/bend clarity review | S2; S3 |
| R09 | Coverage hides players or implies physical probability | Purpose/polygon tools exist; readable selected/team layering open | S2; S3 |
| R10 | Primary tools buried below inspector fold | Switcher shipped; preserve first-class controls in redesign | S2; S3 |
| R11 | Developer IDs/coordinates/warnings in normal UI | Partially addressed historically; redesigned controls and concise task language must replace developer-text scaffolding, with technical details available separately. | S2; S3 |
| R12 | Shared-by-default edits affect other variants | Preserve exact-case default through new commands/proposals; shared changes require visible affected scope and revision-safe atomic application. | S1; S2; S3; S4 |
| R13 | Repeated saved/draft/status clutter | Historic state clutter persists; coherent local/private saved, saving, conflict and draft states are required without repeated status strips. | S1; S2; S3 |
| R14 | Weak player next-task/change context | Grounded Now/Next/If exists; connect exact player/lineup/moment and proposal rationale while keeping unknown tactics and owner approvals honest. | S3; S4; T |
| R15 | Implausible travel/lane timings | Travel/range remains advisory. Use source-true motion and known observations; do not claim measured athletic precision from ratings or geometry. | S3; S4; T |
| R16 | Action change falsely implies changed ball/contact | Explicit contact editing exists; generalised commands and AI proposals must update dependent ball/actor endpoints together. Teaching poses never silently transfer ownership. | S1; S2; S3; S4; T |
| R17 | Tests miss comprehension and genuine UX | Independent reviews must operate actual tasks and assess comprehension; tests and static images alone cannot accept the editor or final product. | All (S1–S5) |
| R18 | Local draft data loss | Preserve browser drafts and legacy imports; new private saving requires mapped copies, revision conflicts and meaningful recovery checks, not destructive migration. | S1; S3; S5 |
| R19 | Watch/Build personas compete | Studio/Court presentation separation remains useful; both share domain commands, and phone users can author fully without a required desktop handoff. | S2; S3 |
| R20 | Secondary practice controls dominate | Conditional reorganisation remains conditional; complete practice controls in purposeful composition without creating extra controls merely to satisfy the old suggestion. | S3 |
| R21 | Arbitrary intermediate movement stop | The old arbitrary-stop suggestion remains conditional. Latest scope does require supported added moments/timing, without a mandatory professional timeline. | S1; S2; S3 |
| R22 | Speculative wide-screen/performance issues | Investigate actual lag/overflow, pause hidden playback/rendering and keep responsive input. Do not create a speculative broad profiling programme. | S3; S5 |
| R23 | Technical impact logs | Readable change summaries and court/diff previews replace technical impact logs in normal use; retain relevant diagnostics behind details. | S2; S3; S4 |
| R24 | Strategy library settings dump | Basic plan-first flow exists; complete team/lineup/plan selection, copies and state handling as a coherent application workflow on both devices. | S1; S2; S3 |
| R25 | Print accurate but not teachable | Two-page A4 quick guide shipped; spatial relevance/readability acceptance open | S3; S5 |
| R26 | Browser tests falsely imply match readiness | Automated checks and generated suggestions never establish match readiness; final software release and owner tactical approval remain distinct. | T; S4; S5 |
| C01 | Independent Court UI, shared modern engine | Court shipped at 6b9a556. Preserve its distinct practice presentation and shared domain/simulation; authorised rewrites may replace coupled internals and poor UI. | S1; S2; S3; S5 |
| C02 | Actual named local/imported/published strategy selection | Selection exists; integrate private revisions, local/redacted recipient copies and explicit unsaved-change handling without false same-name identity. | S1; S2; S3 |
| C03 | Complete chronological playback and exact scrubbing | Shipped; preserve later contacts and exact playhead | S2; S3 |
| C04 | Orbit, two-finger court-plane pan/pinch, per-view reset | Gestures exist with historical emulation only; verify actual candidate pan/pinch/reset and label interaction. Physical-device evidence is reported separately. | S3; S5 |
| C05 | True focus/fullscreen with essentials reachable | Shipped; visual/spatial task acceptance open | S3 |
| C06 | World-coordinate, event/source-scoped ink and notes | Local scoped annotations exist; preserve event/source/revision scope through private persistence, export/redaction, reload and camera/drawing separation. | S1; S3; S5 |
| C07 | Exact immutable review data/rationale with integrity and clear failure | Exact local/static reviews exist; preserve pinned immutable data, rationale and visible invalid/stale failures through new revisions and redacted recipient workflows. | S1; S3; S5 |
| C08 | Stable device defaults and explicit persisted workspace switch | Existing device defaults may remain with persisted explicit choice and no resize switching. Every supported device must expose complete authoring. | S2; S3 |
| C09 | Modern athlete/ball animation parity on mobile | Shared modern motion exists; complete mobile label/fidelity and motion/input acceptance without removing essential actors or substituting static screenshots. | S3; S5 |

## Latest requirements and derived acceptance contracts

N-series records the latest owner direction as consolidated in the revision-2 finish plan, with technical acceptance boundaries in the AI specification and workflow guide. These **32 traceability rows are not 32 tasks, approvals or tests**. They extend the original rows rather than replacing their IDs; prepared policy/documents do not imply the product is implemented.

| ID | Requirement/finding | Current outcome / disposition | Delivery owner |
|---|---|---|---|
| N01 | Rewrite authority for the editor and internals | Authorised: replace/rework UI, editor, components, state and coupled plumbing as needed. Preserve authored data and valid behaviours; minimum diff is not an objective. | S1; S2; S3 |
| N02 | A capable tool that feels straightforward | OPEN: court-centred workbench, useful density, contextual tools, purposeful icons/states and concise copy. A colour/spacing-only or paragraph-heavy website treatment fails. | S2; S3; S5 |
| N03 | Complete authoring on desktop, phone and tablet | OPEN: all required player/team/lineup, moment, route/coverage/action/contact/timing, import/export, preview, Undo and save operations work on each supported device. | S2; S3; S4; S5 |
| N04 | Efficient desktop/mobile order | Plan ready: S1 real desktop/phone edit proof; S2 complete desktop with touch viability; S3 complete mobile/tablet; S4 AI on both; S5 integrated acceptance. No second editor engine. | S1; S2; S3; S4; S5 |
| N05 | Reusable people instead of six-name runtime identities | OPEN: stable opaque player IDs, versioned assessments and data-defined roles/names; original people remain compatible examples, not mandatory app identities. | S1; S2 |
| N06 | Multiple teams, bench players and fill-ins | OPEN: two teams can reference the same person; rosters exceed six; team-specific notes/roles remain separate from the global player. | S1; S2; S3 |
| N07 | Named, versioned six-player lineups | OPEN: six stable slots select active players/order/roles; alternate and fill-in variants preserve parent revisions and old plan/review references, with explicit adaptation. | S1; S2; S4 |
| N08 | Simple progressive player profiles with honest unknowns | OPEN: practical rating controls cover relevant skills including serving; optional depth, confidence/source/date and private notes. Unknown is explicit; no invented ability from gender/height. | S1; S2; S3 |
| N09 | Generalised tactical data and playback compilation | OPEN: stable case/moment/contact IDs survive rename/reorder; compact authored intent compiles deterministically to coherent actor/ball tracks with separate validation layers. | S1; S3; S4 |
| N10 | Straightforward control with optional authoring depth | OPEN: direct placement plus precise touch alternative, incoming paths, zones, cues, explicit contacts and supported moments/timing; cancellation commits nothing and a gesture is one Undo. | S1; S2; S3 |
| N11 | External AI can edit real app data | OPEN in S1: publish bounded schemas/guide/synthetic example/validator; export selected context and import a returned proposal through validation and preview. No API key or local MCP required. | S1; S3 |
| N12 | One safe editing and proposal transaction contract | OPEN: validate exact expected revisions and scope; court/diff preview changes no saved state; Apply commits atomically once; reject stale/duplicate misuse; one Undo preserves newer work. | S1; S2; S3; S4 |
| N13 | Private cross-device cloud saving | OPEN: authenticated owner-scoped CRUD/revisions, explicit local-to-cloud copy and conflict recovery. Fixture coding can precede activation; actual private-save acceptance requires live access/hosting proof. | S1; S3; S5 |
| N14 | Private profiles, conversations and credentials stay private | OPEN: per-app authenticated API, private assessments/notes/chat, synthetic public fixtures and redacted shares. No private data in public assets/URLs/logs or keys in browser/repo/chat. | S1; S3; S4; S5 |
| N15 | Complete in-app conversational coach | OPEN: selected team/lineup/plan drives real questions, generation, criticism and revisions on both devices. An export-only path, canned response or disabled button cannot close live 1.0 acceptance. | S4; S5 |
| N16 | Ask useful questions without a questionnaire burden | OPEN: batch only material unanswered questions, normally 2–5 when needed; suppress known facts and do not force a count. Clarify league, roles and consequential preferences. | S4 |
| N17 | Explicit grounded coaching knowledge and owner methodology | OPEN: structured source-backed catalogue covers systems, receive, setter alternatives, attack/cover, block/defence, repeat contacts and communication with conditions/failure cases. Select relevant context and approved private examples; no assumed Project/chat memory. | S4 |
| N18 | League-specific rules and honest applicability | OPEN: explicit local overrides and source/version/date; preserve the original league profile, keep a second league unknown until sourced, and separate structural/rule/plausibility checks. | S1; S4 |
| N19 | Explain useful lineup/system/order choices | OPEN: recommend under known observations/constraints, with one clear recommendation or at most two ranked candidates and concrete trade-offs. No guaranteed global-optimum claim. | S4 |
| N20 | Complete coherent requested playbook | OPEN: six rotations and both serve states when requested, declared branches/completeness, all six players assigned meaningful jobs, coherent contacts/coverage/setter availability and later events. | S1; S3; S4 |
| N21 | Scoped conversational critique and remembered preferences | OPEN: revise selected cases/moments through preview, protect accepted cases, keep camera suggestions non-mutating and remember private coaching preferences only by explicit owner action. | S4 |
| N22 | No financial billing from the AI coach | OPEN: verify eligible owner/destination/active grant and credit-only funding without API payment, purchased balance, recharge, invoice or paid fallback; backend-only secret and live activation gate. | S4; S5 |
| N23 | Bounded foreground AI work and enforced accounting | OPEN: bound context/chunks/attempts/output; reserve worst-case job plus pending work atomically. Its completion window must fit before grant expiry; recheck each chunk, retain uncertain reserves and fail closed without retry/recharge loops. | S4 |
| N24 | Complete failure, cancellation and recovery states | OPEN: useful WebGL, save/conflict, invalid import/proposal, network/refusal/cancellation and credit-expiry/exhaustion states preserve recoverable work and manual operation. | S1; S2; S3; S4; S5 |
| N25 | Research-informed worker models, effort and speed | Policy prepared: select actual builder/reviewer per unit, distinguish High/Medium/Fast, consider older models when useful and record accepted-work results without duplicate benchmarking. | Workflow; All (S1–S5) |
| N26 | Model-specific prompts with completion authority | Guide prepared: one short unit start loads tailored Astra/Sol builder/reviewer clauses, rewrite authority and stop rules. Prompts do not claim to change the actual picker. | Workflow; All (S1–S5) |
| N27 | Five substantial units with little owner relaying | Plan ready: one builder and fresh consolidated review, repairs in the same context, targeted recheck and one separate-review fallback only if needed. Normal Chat only for a real collaborative advantage. | Workflow; All (S1–S5) |
| N28 | Proportionate testing, recovery and engineering | Required: meaningful boundary/failure checks and actual journeys, normal Git recovery, necessary refactors; no speculative rollback systems, micro-TDD gates, test-count targets or unrelated repeated audits. | Workflow; All (S1–S5) |
| N29 | Cloud work without personal-computer or idle workload | Required: no Windows/Fedora controller, autostart, scheduled relay or background browser sync; stop task-owned previews/tests and avoid unnecessary hidden/paused rendering. | Workflow; S1; S3; S5 |
| N30 | Few useful owner inputs and review points | Prepared: collect two teams, league/preferences, active/bench/fill-in people and honest ratings privately alongside fixture work; one S2 direction check and final human review, not owner bug hunting. | S1; S2; S5 |
| N31 | Verified finished 1.0 and bounded final Unslop | OPEN: one pre-polish restoration point, actual rendered cleanup, independent exact post-Unslop SHA approval, live AI/private-save evidence and served release verification; name activation blockers honestly. | S5 |
| N32 | Useful friend editing without private-account access | OPEN: public redacted display roster/plan can be imported, saved as a separate local copy, edited and exported. Preserve recipient state; expose no private assessments, cloud ownership or API access. | S3; S5 |

**Counts:** E 31 + W 14 + R 26 + C 9 = **80 retained rows**; N 32 = **112 unique public IDs**. The private crosswalk adds T 24, giving 136 total IDs. No original software ID or label is removed.

Review complete journeys and concrete risks. One meaningful check may evidence multiple rows; there is no requirement for one test or review per ID. Distinguish actual physical-device evidence, owner aesthetic judgement and tactical/on-court approval from software acceptance.
