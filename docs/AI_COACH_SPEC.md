# AI coach, reusable teams and editing contract

**Authority: 25 November 2026.** Product contract supporting [FINISH_PLAN.md](FINISH_PLAN.md). This specifies the full 1.0 outcome, including integrated conversational generation. It is not a receipt of implementation, account activation or tactical approval. Development model choices are in [MODEL_POLICY.md](MODEL_POLICY.md).

The coach helps the owner choose a lineup, develop a coherent playbook, understand alternatives and improve an existing plan through conversation. Its proposals become ordinary editable application data. Desktop and mobile can inspect, apply, undo and continue editing the same result. External AI file exchange is an earlier capability and a useful fallback; it does not replace the in-app coach required in S4.

## 1. Reusable people, teams and plans

Maintain canonical versioned types and validators shared by browser, API, compiler, imports and AI. Suggested locations are `visualizer/src/domain/` and `visualizer/contracts/`; avoid a separate framework solely for schemas.

| Entity | Required contract |
|---|---|
| Player | Stable opaque `playerId`, display name, profile/assessment revision and optional number/appearance. Height in centimetres, descriptive gender, handedness and measured reach are optional. Unknown is explicit. |
| Assessment | Skill observations, strengths/preferences, confidence, source and observation date. Keep private coach assessments separate from public display identity. A revision records changed observations without altering old plans. |
| Team | Stable ID, name and references to reusable players. A roster can exceed six; a person can be referenced by different teams. Team-specific preferences do not rewrite the shared person. |
| TeamLineup | Exact team revision, six stable slot IDs assigned to player/profile revisions, initial order and local tactical role assignments. Setter is a lineup role, not a permanent player identity. |
| Lineup variant | Named derivation pinned to its parent revision. A fill-in changes a slot assignment; review/adaptation is explicit. Original lineups and saved plans remain reproducible. |
| Strategy revision | Stable plan ID, immutable revision, exact lineup and league-profile references, optional source/template hash, cases, moments, contacts, cues and approval state. |
| Case / moment | Stable IDs independent of names, array indices and timestamps. Case context includes rotation, serving side and typed conditions. First contact by the designated setter references a role/slot, never a hardcoded person's name. Repeated digs/sets have separate moment IDs. |
| Contact / flight | Explicit actor slot or opponent endpoint, moment, contact kind and connected ball flight. Teaching action, responsibility area and actual ball ownership remain separate fields. |

### Assessments without a data-entry project

Offer a short initial form: name, relevant skill ratings, strengths and preferences. Put measurements, nuanced observations and provenance in optional advanced sections. Suggested skill keys are receive, setting, attack, serving, block, defence, movement and communication. Each uses **1–5 or Unknown (`null`)**. Zero is not a hidden low score.

Anchor the scale to observed reliability at the team's stated playing level: 1 needs substantial support; 2 inconsistent under routine demands; 3 generally reliable in ordinary situations; 4 reliable under pressure with useful options; 5 a clear relative strength across varied situations. These are coach observations, not calibrated physical measurements. Each field needs an Unknown option and a short skill-specific example. Never invent ratings or infer ability from gender, height, name or appearance. Eligibility categories are separate and used only by an applicable league rule.

Strength/preference chips can describe familiar responsibilities, preferred attacking side and comfort setting or receiving, with optional notes. AI may recommend assessment updates, but remembering them requires owner approval of a separate change. Preserve source, confidence and date so a tentative observation does not become an unexplained fact.

Keep the original six-player examples and all legacy strategies compatible. Replace runtime six-name allowlists with resolved lineup references. Import old V1/V2 files into new copies through an explicit mapping receipt; preserve originals, localStorage and bounded 1 MB support. Pin legacy source hashes and map old event IDs. Never silently discard unsupported fields on export. Authorised private profile imports remain private; public fixtures use synthetic people.

## 2. One editing contract for people and AI

Both editors and the assistant submit typed domain commands: create/copy plan, assign lineup slot, move player, set incoming route, set coverage, set teaching action/cue, assign contact, add moment, adjust timing and copy case. Components may be redesigned completely without changing these semantics.

A proposal envelope contains:

- `kind`, `schemaVersion`, `proposalId` and idempotent `operationId`.
- Expected strategy, lineup, assessment and league-profile revisions.
- Explicit case/moment/player-slot scope and bounded typed operations.
- Short rationale, assumptions, unresolved questions, source references and completeness declaration.

Parse untrusted data, validate references and bounds, compile a candidate, then show the actual court and a human diff. The diff identifies affected cases, player assignments, positions, routes, contacts and cues. **Preview changes no saved state. Apply commits one atomic transaction and one Undo step.** Reject a stale base rather than rebasing silently. Repeating the same operation ID returns its original result. Undo creates a traceable restoration; it cannot erase another device's newer work. Selective application is optional only when the selected subset independently validates.

Position edits never transfer ball ownership through proximity. An explicit contact edit updates dependent endpoints and actor roles together and flags unresolved downstream cues. Exact case/occurrence is the default scope; shared changes list their affected cases before Apply. Approved cases are protected from silent replacement. Adapting them creates a reviewable new revision.

Use a deterministic compiler to turn compact tactical intent into consistent track frames, moments and ball paths. Reuse existing geometry/motion where correct. Validate structural integrity, applicable rules and coaching plausibility separately. Broken IDs/contacts cannot be committed as usable data; incomplete tactical drafts may be saved with clear issues. Timing screens and rating-based suggestions are advisory, not exact athletic predictions or referee certification.

### External AI pack

Before live API integration, deliver JSON Schemas, an editing guide, a complete synthetic fixture, a sample proposal and a local validation command. Export a selected plan/context pack; reimport the returned proposal through the same diff/Preview/Apply/Undo flow. Include only profile fields deliberately selected for that export. No separate MCP server, plugin or local background agent is required for 1.0.

## 3. What the coach knows

Build a short, curated, versioned knowledge pack. Each item has a stable tag, source URL/version, checked date, scope and concise original summary. Select by tags and current case; do not crawl the web or send the entire private repository on every turn.

Context consists of the applicable league profile, general coaching principles, owner-approved private coaching preferences, relevant player assessments, selected lineup/plan/case/moment and a few approved examples or feedback items. The application does not automatically inherit ChatGPT memory or prior chats. During S4, derive a proposed private coaching profile from authorised project context, identify assumptions and obtain owner approval before remembering preferences.

### Rules hierarchy

Ship `ttgva-c-2025-03` with the March 2025 TTGVA bylaws, checked 25 November 2026. Clause **3.4.7 requires both teams to maintain rotational order at the service hit**, explicitly overriding FIVB 7.4. Clause **3.4.6 excludes a libero in C Grade**. Clause **3.2** permits continuous substitutions in C/D subject to its conditions. The app's named fill-in variants do not claim to track legal live substitutions. [TTGVA source](https://www.ttgva.com.au/Site/documents/Bylaws.pdf)

Use [FIVB Official Rules 2025–2028](https://www.fivb.com/wp-content/uploads/2025/01/FIVB-Volleyball_Rules2025_2028-EN-v05.pdf) as the base only where local provisions do not override it. Store clause-level applicability and provenance, not just a generic “volleyball rules” prompt. A second league is **unknown until its actual rules are supplied/verified**; do not copy TTGVA assumptions into it. Any service-order geometry using avatar centres remains an approximation of foot-position adjudication.

### Coaching principles

Seed the general pack with short summaries grounded in primary coaching material: setter selection includes movement, communication and decision-making ([USA Volleyball: Recipe for a Setter](https://usavolleyball.org/resource/recipe-for-a-setter/)); defence must coordinate team strengths, blocking, anticipation and timing ([Defense](https://usavolleyball.org/resource/defense/)); useful calls clarify responsibility and hitter coverage ([Silence Is Not Always Golden](https://usavolleyball.org/resource/silence-is-not-always-golden/)). These inform suggestions, not mandatory tactics or numerical success predictions. Keep the pack small, attributed and revisable; no vector database, fine-tuning or paid web-search tools are required.

Those links are research seeds, not a complete coaching curriculum. In S4, build a structured, source-backed catalogue covering system/setter choice; rotational order and front/back-row eligibility; serve-receive spacing/seams; setter-first and poor-pass alternatives; attack transition and hitter cover; block/floor coordination; short/deep defence; repeat digs, recovery and communication. Each topic needs applicable conditions, practical criteria, common failure cases, uncertainty and concise source references. Map the original team's detailed methodology to explicit private preferences/examples without turning it into a universal rule. Research unsupported claims using current primary rules/coaching sources; use match experience as labelled observation. Keep the full catalogue available while selecting only relevant sections per request. A short generic volleyball prompt does not meet the coaching requirement.

## 4. Conversation and generation behaviour

Start with the selected team, lineup and requested scope. Ask **2–5 material missing questions in one batch when needed**, suppressing facts already supplied; do not force questions merely to fill the count. Useful unknowns include league, setter availability, current order, desired complexity and a genuinely consequential preference.

Recommend a setter/system/order with reasons tied to known observations and constraints. Respect fixed choices and approved examples. Offer at most two ranked candidates, or one recommendation with concrete trade-offs. Optimise for stated goals and reliable execution under known facts; do not claim a globally optimal system.

Rank decisions in explicit layers: applicable rules and locked choices first; coherent contacts, reachable responsibilities and six-player coverage next; then observed role/skill fit, receiving exposure, attacking options, transition load and communication burden. Compare those trade-offs against the team's chosen simplicity/competitiveness goals. Treat 1–5 observations as ordinal evidence rather than calibrated probabilities, avoid hiding unknowns inside an average, and explain which missing fact could change the recommendation. Do not assign universal numerical weights that override the owner's stated priorities.

A complete-playbook request produces a coherent six-rotation base for **both serving sides**, with declared authored branches. Every moment accounts for all six players through a placement, action/responsibility and relevant cue. Actual contacts, hitter cover, setter availability, first versus later digs and recovery transitions must agree. Missing or unsupported branches are listed rather than replaced by a convenient baseline. Clarify that the illustrated rally is a teaching scenario, not every possible match outcome.

The model returns compact intent and approved domain operations; the compiler creates dense frames. Use one bounded foreground generation job with a planned request count and token budget. Initial whole-playbook ceiling: one outline, up to six rotation chunks and one repair call, eight calls total; routine chat/critique normally needs one call. Any lower configured ceiling still applies. Reserve the entire worst-case job before dispatch. Do not request exhaustive coordinates for every animation frame, launch model swarms or continue an unattended optimisation loop.

Existing-plan critique uses the selected player, moment and case. It can explain a risk, suggest a useful camera view, compare a variant and propose an improvement. Camera suggestions do not mutate tactics. The normal sequence is **conversation → candidate court/diff → Apply or reject → one Undo**. Retain declined suggestions as conversation history without treating them as approved preferences.

States include asking, generating, validating, proposal ready, cancelled, failed and unavailable. Stop propagates cancellation; no partial streamed JSON is applied. Preserve chat and manual editing on refusal, malformed/incomplete output, timeout, credit exhaustion or network failure. Structured output controls format, not tactical correctness. [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)

## 5. Private cloud boundary

Use one private Cloudflare Worker serving the React build and `/api/v1/*`, D1 and application-scoped Access for the owner's exact identity. Public Pages remains a demo, redacted-review viewer and local recipient editor. A recipient can explicitly import an editable shared copy, edit it using the same domain/UI and export their own version without an account, private cloud access or AI credentials. Include only necessary display identities and tactical data in that share format; exclude private assessments and conversations. Viewing an exact review never silently saves over recipient work. Keep local/cloud persistence adapters small and shared contracts authoritative, not two editing engines. Do not put real private profiles, assessments or conversations in public assets, fixtures, URLs or logs. Access protection must include this Worker's production and preview addresses, without changing account-wide protection.

Serve owner-scoped player/team/lineup CRUD, exact plan revisions, transaction commit/dry-run and assistant-turn endpoints. Validate every request on the server. Treat imported notes and model text as data, never authority to execute code, fetch arbitrary URLs, change access or bypass limits. Keep provider keys exclusively in Worker secrets. For static-asset Workers, current documentation warns that the internal router does not pass `ctx.access` through; validate `Cf-Access-Jwt-Assertion` against configured issuer/audience and verified identity instead of trusting an email header. [Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)

Use the current [Cloudflare CLI agent guidance](https://developers.cloudflare.com/cf/agents/index.md) and `cloudflare.config.ts` for this new deployment, not a fresh legacy Wrangler configuration. Previews use synthetic fixtures or a separate private development database, never an accidental production binding. [Static assets](https://developers.cloudflare.com/workers/static-assets/) and [D1](https://developers.cloudflare.com/d1/) support this topology.

Private cloud saving belongs in **S1**; provider credentials/activation belong in **S4**. Load/save during active use, retain recoverable edits and use revision preconditions for conflicts. No cron, queue, WebSocket sync, personal-machine controller or background browser worker is needed. Pause playback when hidden; avoid continuous rendering of a paused court.

Current setup evidence: Cloudflare is connected, but billing-plan inspection returned 403 and Access is not enabled. A Free plan or a no-charge hosting boundary is therefore **unverified**. Verify account/plan limits before activation; ordinary usage telemetry is not billing evidence.

## 6. Runtime models and credit-only activation

Initial substantive coaching uses **`gpt-6.2-sol`, medium reasoning, `service_tier: "default"`**. Luna is eligible for narrow extraction/summary helpers only after representative quality checks. Astra is an explicit, cost-bounded escalation for a difficult case where measured benefit justifies it. The browser cannot choose arbitrary models, tools or spend settings. Runtime API pricing/entitlement is separate from the development account's Fast offer; no volleyball-specific benchmark establishes the cheapest sufficient model. See [MODEL_POLICY.md](MODEL_POLICY.md) and current [API pricing](https://developers.openai.com/api/docs/pricing).

Included subscription API credits are a real benefit for eligible owners, require activation in the correct API organisation and expire under their grant terms. No API payment method is required to use an active free grant. Actual subscription eligibility, ownership, destination, balance and expiry remain account checks. [API-credit guide](https://developers.openai.com/api/docs/guides/chatgpt-api-credits) · [eligibility details](https://help.openai.com/en/articles/20001626-api-credits-benefit-for-eligible-chatgpt-subscriptions)

Before enabling calls, record redacted proof of the receiving organisation/project, active unspent grant and expiry, dedicated backend key, and **no API payment method, purchased balance, auto-recharge, invoice arrangement or paid fallback**. Prefer an isolated eligible organisation; otherwise all other grant-consuming usage must be accounted for. Verify conservative organisation/project hard-limit settings as additional controls. Do not activate when the funding boundary is unclear.

A budget is not a no-charge guarantee. Current hard spend limits can take time to enforce, and prepaid processing can produce a negative balance after exhaustion. The account arrangement, conservative reservation and remaining uncertainty must all be explicit. Hosting and other vendors are separate. [Spend limits](https://developers.openai.com/api/docs/guides/spend-limits) · [prepaid timing caveat](https://help.openai.com/en/articles/8264644-setting-up-and-managing-prepaid-api-billing)

### Reservation and dispatch contract

Start with an app grant-period ceiling of **`min(USD 10, 80% × verified unspent grant)`**. This is a conservative application policy with headroom, not a provider guarantee. Keep its grant ID/expiry and verification timestamp; do not reset spent totals by rechecking the same grant.

For each planned call `k`, reserve:

```text
R_job = round_up(sum_k(
  max_input_tokens_k × worst_applicable_input_rate_k
  + max_output_tokens_k × output_rate_k
  + maximum_tool_charges_k + maximum_other_overhead_k
))
```

Use consistent USD units and integer micro-units for the ledger. Input bounds include full context/message/schema overhead and the worst applicable cached, uncached or cache-write charging combination. Output bounds include reasoning and visible output. Include every permitted retry/chunk and tool charge; v1 paid tools are disabled. Resolve current supported caps and prices before dispatch. [Reasoning usage](https://developers.openai.com/api/docs/guides/reasoning) · [prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)

In an atomic D1 conditional transaction, require that confirmed spend plus **all pending reservations plus `R_job`** fits both the app ceiling and conservative remaining grant after other known usage. Initially allow one active owner job. Commit the reservation before the network request; never hold a database transaction open across inference. Disable uncontrolled SDK retries. Each provider attempt has its own durable operation/request record.

Admit a job only when its conservative completion window, including configured attempt timeouts and headroom, fits before the verified grant expiry. A local reservation cannot preserve expiring provider credits. Recheck grant validity and remaining accounting before every chunk or repair call; stop further dispatch when validity changes. Keep in-flight reservations held. If a defensible completion bound is unavailable, refuse execution near expiry instead of assuming credits will last.

Reconcile confirmed responses against actual billed-token categories. Release only demonstrably unused reservation. Timeouts, ambiguous cancellations and uncertain completion remain reserved until reconciled; lease expiry is not proof of zero spend. A duplicate request cannot dispatch inference again merely because a browser retried.

Fail closed on unknown model/price, unknown or expired grant, stale accounting, unexplained other usage or insufficient reserve. A calendar rollover does not establish a new grant. Verify a renewal before increasing availability. Do not invent a real-time authoritative grant-balance API; usage totals alone do not prove remaining free credit.

Handle `credit_balance_exhausted`, `organization_spend_limit_exceeded` and `project_spend_limit_exceeded` by stopping inference and showing a clear unavailable state. No retry loop, checkout, automatic recharge, alternate paid key or model fallback. Manual editing and external proposal import continue. Build and test this complete feature before activation; uncertainty blocks live calls, not the implementation work.

## 7. Focused evaluation and acceptance

Keep eight meaningful cases with synthetic data; record model/version, effort, pack/schema versions, latency, billed usage, validity and necessary repairs. Use deterministic fixtures for failure paths. Compare Luna or Astra only where their proposed role needs evidence.

| Case | Pass condition |
|---|---|
| Renamed/new team | Arbitrary IDs/names and a roster over six generate correct slot references, six rotations and both serving sides without original-name assumptions. |
| Fill-in variant | Substitute one lineup slot; adaptation considers the known profile, preserves the old lineup/plan and creates an explicit reviewed revision. |
| TTGVA service order | Detect an order violation on either serving side, cite 3.4.7, preserve the no-libero C Grade profile and avoid silently applying another league's rule. |
| Setter first / poor pass | Use a reachable declared backup and coherent contacts/coverage; distinguish first and later digs; mark uncertainty instead of fabricating precision. |
| Stale or repeated proposal | Newer plan revision blocks Apply; duplicate operation ID has one result; no silent overwrite of an approved case. |
| Real edits and Undo | A non-zero placement/route/contact change visibly alters the candidate, applies atomically, survives reload and reverses with one Undo on desktop and phone. |
| Unknown assessments | Null ratings stay unknown; questions suppress known facts; gender/height never create ability scores; proposed remembered preferences need owner approval. |
| Credit/error boundary | Exhaustion, expiry before or during a multi-call job, concurrent dispatch, ambiguous timeout and browser model/limit tampering cannot bypass reservations or invoke paid fallback; no later chunk dispatches after expiry and in-flight reserves remain held. Work stays recoverable. |

A fresh independent reviewer checks the actual candidate, sources, privacy boundary, proposal semantics and credit ledger. After account/billing proof, perform at least one genuinely live, bounded call and inspect its rendered proposal and recorded usage. Complete acceptance also needs the representative coaching cases above and both-device Apply/Undo journeys. A stub, canned response or valid JSON alone cannot close S4 or establish the full 1.0 AI coach. Record remaining account or tactical limitations plainly; never promote a generated plan to team/match approval automatically.
