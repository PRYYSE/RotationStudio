# RotationStudio finish status

Updated 25 November 2026 (Adelaide), S1 checkpoint. Canonical product/delivery plan: [FINISH_PLAN.md](FINISH_PLAN.md). Owner setup and start prompts: [START_HERE.md](START_HERE.md).

## Current checkpoint

**S1 authoring shipped on public Pages. Live private save remains gated.** Open **Team plans** from Studio or from Court Mode's strategy panel. The public workflow uses browser-local save, reusable players, named fill-ins, exact-case placement and explicit editable or review copies. The private Worker and D1 contract are implemented and checked with synthetic identity and storage.

- [S1 PR #4](https://github.com/PRYYSE/RotationStudio/pull/4) merged after the independent reviewer approved exact candidate `f30b3f36e45d628b890689f08052515098c04aa9`. [Candidate validation](https://github.com/PRYYSE/RotationStudio/actions/runs/45534673657) passed 213 tests, the Pages build and Chromium evidence. The private bundle also built locally using `cf`.
- Chromium exercised desktop drag, phone-size touch placement, Undo and save/reopen, proposal rejection and apply, exact original and proposed geometry, a named fill-in, two failed tabs retaining separate drafts, and stale recovery into a new private copy. A separate browser context reopened and saved the fixture library. The existing 3D Studio, Court and Set arcs smoke produced nine WebGL screenshots. Physical phone input, tactical quality and live Access/D1 were outside this evidence.
- The independent Sol 6.2 High review reproduced six material findings. Repairs shared unchanged cases across revisions, isolated recovery branches, required typed save receipts, preserved imported route bends, surfaced missing flights and inconsistent contact duties, and compared the exact affected moment and player. Targeted rechecks covered two repair rounds. Builder picker and Fast state were not exposed. Usage was unavailable.
- The public release at `5dfda2d34419e4516fcaba77e5b959cb3919e2d8` passed [Pages deployment](https://github.com/PRYYSE/RotationStudio/actions/runs/45535038227). The served candidate HTML, app module and 12 base public scenario records were checked directly. The original legacy assets and tactics remain in place.

### Earlier setup evidence

- Setup [PR #3](https://github.com/PRYYSE/RotationStudio/pull/3) merged as `4c885a15a114d1aa52675635c15804b8bfc89ae6`. Plan/crosswalk and browser capture code received independent review; the two plan findings and one capture timing finding were resolved.
- Exact tested candidate: `8e336bdc2e6550ce144e672b742386731dcd55f9`. [Hosted run 45506394806](https://github.com/PRYYSE/RotationStudio/actions/runs/45506394806) **passed 199 tests, the Pages-base production build and software-WebGL browser capture**. Nine screenshots cover Studio View/Plans/Edit, original Set arcs, Court portrait/landscape/tablet and actual R3 proposal/phase selection. No recorded runtime, console-error or same-origin HTTP failures.
- Root and independent app reviewer inspected the rendered evidence. Court, athletes, net and Set arcs render. The manifest correctly leaves visual acceptance pending; successful capture is not product approval. Physical touch/pen, GPU performance and full-rally motion were not accepted by this setup smoke check.
- Initial live-shell browser had WebGL disabled. Those earlier blank-court images are superseded for rendering evidence by the actual hosted Chromium captures; they are not proof of a user-app rendering fault.
- Evidence artifact `rotation-review-evidence-8e336bdc2e6550ce144e672b742386731dcd55f9` is attached to that run with 14-day retention. The durable findings are recorded below; collect fresh candidate evidence during S1.
- Old app draft PR #1 and private workflow PR #8 are closed as superseded, with branches retained. No new schedule or personal computer worker was created. Candidate CI runs only on relevant pull requests or a deliberate manual start; its preview and browser stop at task end. Existing hourly status automation remains disabled.

### Confirmed product gaps and placement

1. **Phone layout overflow with a real named plan:** at 390×844, selecting the longer R1/R3 proposal and advancing to R3 their-serve widens the canvas to 613px and visibly crops the header, court, camera controls, playback and bottom navigation. Contain long content and verify the whole viewport after selection, not just the short default Team V3 name. Preserve a deliberate scrollable event rail without allowing the whole application to overflow.
2. **Court identity/framing:** labels cluster or drift visually away from the player they identify, while default framing cuts useful server/opponent space at smaller sizes. Improve legibility and framing using actual rendered scenes.
3. **Studio hierarchy and plan entry:** competing context/playback strips, repetitive generic guidance, developer-oriented terminology and an ad hoc special-plan button obscure the normal coaching task. Complete the layout, control anatomy and real plan workflow together.

These are existing product defects and design gaps. S2 owns desktop/editor hierarchy and overflow repair; S3 completes mobile, framing and motion. Source inspection additionally confirms fixed six-name identities, hardcoded normal/Harry branches and no complete mobile authoring. S1 must generalise those data/command assumptions and prove an actual desktop/phone edit before either presentation is finished. The setup's green technical checks do not close these gaps.

## Account and execution readiness

- The S1 remote candidate checks and Pages deployment are recorded above. Private hosting uses a separate account activation boundary.
- Read-only Cloudflare preflight found the existing account. Its usage-model label is `standard`; billing/subscription inspection returned 403, so **Free-plan status is unverified**. Access/Zero Trust is not enabled. No resources, subscriptions, access rules or account settings were changed.
- Before private deployment, the owner confirms the hosting plan and completes the one-time Zero Trust Free choice. Current onboarding asks for payment details even on Free. The builder must protect this application's production and preview traffic only and keep private data out of public Pages/assets.
- Measure ordinary and 48-case legacy saves against the actual Workers Free CPU limit before accepting hosting. The local fixture verifies transactions and recovery. A compact 48-case archive saved and reopened through the fixture but its timing does not establish hosted CPU headroom.
- OpenAI eligibility, workspace/API-organisation ownership, issued grant, remaining credit, expiry and absence of paid funding are **unverified**. No credits were claimed, API key stored or live inference call made. Full feature implementation can use fixtures; S4 live acceptance requires the documented credit-only activation evidence.
- No Windows/Fedora process or browser was started during this revision. The earlier Fedora stopped-session observation remains historical, not a fresh machine-wide audit. Fedora cleanup is still deferred.
- Reused baseline evidence above was not rerun for this documentation-only revision. It is evidence of that exact setup candidate, not of the planned new product.
- The final Unslop source is identified and pinned in S5; project-local installation and full skill reading are S5 preparation, not completed setup. No additional owner workflow is required for that worker step.
- Fresh independent planning reviews covered product continuity/workflow and the finance/hosting contract. Revisions preserve friend editing, prevent generation crossing grant expiry, align serving assessments and identify the pending Unslop installation honestly. Targeted rechecks passed. This accepts the planning text, not the unbuilt features or live billing boundary.

## Delivery ledger

| Slice | State | Candidate/release | Model / effort / speed | Evidence / findings / repair rounds |
|---|---|---|---|---|
| S1 Reusable data/private save/AI editing contracts | Public implementation shipped; private fixture passes | [PR #4](https://github.com/PRYYSE/RotationStudio/pull/4), public release `5dfda2d34419` | Builder picker/effort/Fast unverified; reviewer Sol 6.2 High | 213 tests, Pages and private builds, desktop/touch edit and recovery; six findings resolved in two repair rounds. Live private acceptance pending Free-tier and Access checks. |
| S2 Studio/editor and team workflows | After S1 foundation | Not started | Builder Astra 6.2 High; reviewer Astra 6.2 High | Major redesign/replacement authorised; actual tool feel and touch viability required |
| S3 Full mobile, practice and motion | After S2 | Not started | Builder Astra 6.2 High; reviewer Sol 6.2 High | Complete authoring on phone/tablet, full rallies and connected handoff |
| S4 Conversational AI coach | After shared contracts and both-device workflows | Not started | Builder Sol 6.2 High; reviewer Astra 6.2 High | Credits/owner/funding unverified; complete implementation plus bounded live acceptance required |
| S5 Integrated finish/release | After S1–S4 | Not started | Builder Sol 6.2 High; reviewer Astra 6.2 High | Includes backed-up final Unslop and exact final-candidate acceptance |

For each completed slice add elapsed time and actual exposed usage, or `unknown`; never invent quota telemetry. Record the independent reviewed commit and deployed result. Do not append full terminal transcripts.

## Tactical status

R1 usable per owner; R3 v4 is for review. Last change is limited to two R3 receiving-right cases. Personalised R2/R4–R6 are unfinished. Software completion does not approve them. Private rationale and original sources remain in `PRYYSE/Volleyball`.

## Next task

Private save can proceed to live acceptance once the account prerequisites in [START_HERE.md](START_HERE.md#4-hosting-one-account-step-before-private-deployment) are available. S2 editor work can use fixtures. Keep private source data and API activation on the documented routes.
