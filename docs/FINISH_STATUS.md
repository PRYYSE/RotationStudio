# RotationStudio finish status

Updated 25 November 2026 (Adelaide), revision 2. Canonical product/delivery plan: [FINISH_PLAN.md](FINISH_PLAN.md). Owner setup and start prompts: [START_HERE.md](START_HERE.md).

## Current checkpoint

**Revised full 1.0 plan and cloud workflow are prepared. S1 implementation can begin; S1–S5 product work has not started.** The new scope includes a substantially rebuilt editor, complete mobile authoring, reusable players/teams, private save, external AI editing and the integrated coach. Current planning base is `72b2f5887c7d0be6e3e3937d4d3041e997e65b58`; application baseline `785f762101f63b217b9ddb0ecd198313235701a8` and shipped Court Mode `6b9a556bb26ba9c84012b56a01cdf15a73ea5aa0` remain intact. This revision changes documentation only, not application source, dependencies or tactics.

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

- GitHub candidate validation is available. An account-level published Work/Codex cloud environment is not established by repository setup; the owner selects or creates it using the guide.
- Read-only Cloudflare preflight found the existing account. Its usage-model label is `standard`; billing/subscription inspection returned 403, so **Free-plan status is unverified**. Access/Zero Trust is not enabled. No resources, subscriptions, access rules or account settings were changed.
- Before private deployment, the owner confirms the hosting plan and completes the one-time Zero Trust Free choice. Current onboarding asks for payment details even on Free. The builder must protect this application's production and preview traffic only and keep private data out of public Pages/assets.
- OpenAI eligibility, workspace/API-organisation ownership, issued grant, remaining credit, expiry and absence of paid funding are **unverified**. No credits were claimed, API key stored or live inference call made. Full feature implementation can use fixtures; S4 live acceptance requires the documented credit-only activation evidence.
- No Windows/Fedora process or browser was started during this revision. The earlier Fedora stopped-session observation remains historical, not a fresh machine-wide audit. Fedora cleanup is still deferred.
- Reused baseline evidence above was not rerun for this documentation-only revision. It is evidence of that exact setup candidate, not of the planned new product.
- The final Unslop source is identified and pinned in S5; project-local installation and full skill reading are S5 preparation, not completed setup. No additional owner workflow is required for that worker step.
- Fresh independent planning reviews covered product continuity/workflow and the finance/hosting contract. Revisions preserve friend editing, prevent generation crossing grant expiry, align serving assessments and identify the pending Unslop installation honestly. Targeted rechecks passed. This accepts the planning text, not the unbuilt features or live billing boundary.

## Delivery ledger

| Slice | State | Candidate/release | Model / effort / speed | Evidence / findings / repair rounds |
|---|---|---|---|---|
| S1 Reusable data/private save/AI editing contracts | Ready for implementation | Not started | Builder Sol 6.2 High; reviewer Sol 6.2 High; Fast while offered | Live private-save acceptance pending hosting/access setup; include desktop/phone edit proof |
| S2 Studio/editor and team workflows | After S1 foundation | Not started | Builder Astra 6.2 High; reviewer Astra 6.2 High | Major redesign/replacement authorised; actual tool feel and touch viability required |
| S3 Full mobile, practice and motion | After S2 | Not started | Builder Astra 6.2 High; reviewer Sol 6.2 High | Complete authoring on phone/tablet, full rallies and connected handoff |
| S4 Conversational AI coach | After shared contracts and both-device workflows | Not started | Builder Sol 6.2 High; reviewer Astra 6.2 High | Credits/owner/funding unverified; complete implementation plus bounded live acceptance required |
| S5 Integrated finish/release | After S1–S4 | Not started | Builder Sol 6.2 High; reviewer Astra 6.2 High | Includes backed-up final Unslop and exact final-candidate acceptance |

For each completed slice add elapsed time and actual exposed usage, or `unknown`; never invent quota telemetry. Record the independent reviewed commit and deployed result. Do not append full terminal transcripts.

## Tactical status

R1 usable per owner; R3 v4 is for review. Last change is limited to two R3 receiving-right cases. Personalised R2/R4–R6 are unfinished. Software completion does not approve them. Private rationale and original sources remain in `PRYYSE/Volleyball`.

## Next task

Launch S1 with the prompt in [START_HERE.md](START_HERE.md). Select Cloud, Sol 6.2, High and Fast while the displayed promotion applies. Prepare hosting/login choices alongside implementation; player data and API activation are staged in the guide. No additional workflow project or personal-computer task is required.
