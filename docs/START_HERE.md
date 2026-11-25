# Start here: finish RotationStudio in the cloud

**25 November 2026.** This guide prepares the work; it does not claim implementation or account activation is complete. [FINISH_STATUS.md](FINISH_STATUS.md) records actual progress. [FINISH_PLAN.md](FINISH_PLAN.md) defines the product and acceptance criteria.

**Start one substantial cloud task, let its builder complete and repair the work with one fresh reviewer, then move to the next unit.** Routine fixes stay in that task. Nothing needs to run on Windows or Fedora. No local controller, relay, scheduled worker or API key is needed to begin coding.

## 1. Prepare one cloud environment

Use Work or Codex with **Work in → Cloud**. Select an existing suitable environment, or choose **Create environment**, add `PRYYSE/RotationStudio`, select **Get started**, review its setup and **Publish**. A default cloud environment can also clone an accessible repository. The published state must actually be visible; repository configuration alone does not establish it. [Official cloud setup](https://learn.chatgpt.com/docs/environments/cloud-environments)

The setup worker handles the repository's Node version, lockfile, dependencies and existing build/test commands. For new Cloudflare configuration, it uses the current `cf` CLI and `cloudflare.config.ts` inside its cloud workspace, with compatible Node. Caleb installs nothing locally. [Cloudflare project tooling](https://developers.cloudflare.com/cf/projects/)

The environment needs repository write access, package-install access and cloud Chrome/Chromium capable of rendering the 3D court. Hosted candidate screenshots are useful when inspected; they cannot prove motion or gestures. If a tool is unavailable, report the specific limitation and finish independent work that can proceed.

Keep private assessments and original tactical exports out of this public repository. Use synthetic fixtures until approved private inputs are available. Add private `PRYYSE/Volleyball` sources only when needed and accessible.

## 2. Five substantial units

Choose the row's **builder** in the picker, select **High**, and enable **Fast** while the displayed promotion applies. The worker requests the assigned fresh reviewer. A prompt cannot prove the picker changed. [MODEL_POLICY.md](MODEL_POLICY.md) explains the choices and fallbacks.

| ID | Complete outcome | Builder | Fresh reviewer |
|---|---|---|---|
| **S1** | Reusable players/teams, versioned lineups, generalised editable tactics/contracts, private save/auth foundation, one real desktop and phone edit. | Sol 6.2 High | Sol 6.2 High |
| **S2** | Serious desktop Studio/editor rebuild, complete player/team forms and whole-app art direction, with touch viability throughout. | Astra 6.2 High | Astra 6.2 High |
| **S3** | Complete phone/tablet authoring, Court practice, motion/camera, advanced editing and connected sharing/reference journeys. | Astra 6.2 High | Sol 6.2 High |
| **S4** | In-app AI coaching, questions and generation, bounded revision Preview/Apply/Undo, credit-only activation. | Sol 6.2 High | Astra 6.2 High |
| **S5** | Integrated acceptance and known fixes, final Unslop, exact final review and verified release. | Sol 6.2 High | Astra 6.2 High |

Phone interaction is proved in S1 and considered during S2; full mobile/tablet authoring finishes in S3. It is not deferred to final polish. S5 uses an Astra builder only for named unresolved redesign.

### Start prompt

Copy this for S1. For subsequent units, change only **S1** to the corresponding ID.

```text
Complete S1 of PRYYSE/RotationStudio in cloud Work/Codex. Read AGENTS.md,
docs/FINISH_PLAN.md, docs/FINISH_STATUS.md and docs/START_HERE.md.
Follow this unit's assigned builder/reviewer models and the operating
clauses in START_HERE. Deliver the full outcome, inspect the real app,
use one fresh independent reviewer and resolve its consolidated findings
in this task. Respect the documented account activation boundaries;
continue work that is not blocked. Keep recoverable progress in GitHub,
follow the existing release authority, and stop owned temporary processes.
```

This starts implementation when the owner sends it. Preparing this guide does not itself activate that prompt.

## 3. The owner's few inputs

Prepare these alongside S1/S2. Missing profiles do not block code using synthetic fixtures.

- **Two teams:** names, league/grade, relevant competition rules and preferred style.
- **Players:** six active players plus bench/fill-ins, possible/preferred roles and known availability constraints.
- **Simple ratings:** use the agreed understandable scale for relevant skills; record **Unknown** instead of inventing ability. Add useful preferences and limitations.
- **Private sources:** provide owner-authored profiles/exports through the private route when ready. Distinguish facts, assumptions and generated suggestions.

After S2, inspect the desktop editor and demonstrated touch interaction for one direction check: does it feel straightforward and provide the needed control? The builder should already have fixed known defects. Final S5 human review concerns whether the finished product fits its use, not a beta bug hunt. Personalised tactical approval remains separate from software acceptance.

## 4. Hosting: one account step before private deployment

Use **Cloudflare Workers Static Assets plus D1, behind an app-specific Access policy**. Workers and D1 offer Free plans; Free-tier limits must produce a handled capacity failure, not an automatic upgrade. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 Free behaviour](https://developers.cloudflare.com/d1/reference/faq/)

The public build keeps examples, exact redacted reviews and local import/edit/export for friends' independent copies. It exposes neither private profiles nor the owner's cloud data or AI credentials; friends do not need accounts for that existing sharing workflow.

**Current state:** the existing Cloudflare account is connected. Free billing status is unverified because the connector could not read billing; its usage-model label does not establish the plan. Access/Zero Trust is not enabled. Do not create another account or describe private hosting as ready.

Before deploying private storage:

1. Confirm **Workers Free** in the existing account, without a paid subscription or automatic upgrade.
2. Choose **Zero Trust Free** after reviewing its terms. Current Cloudflare onboarding requires payment details even for Free, with no charge. The owner makes that one-time choice in the secure account UI; a worker must not enrol billing silently. If the owner declines, or a paid plan is required, stop that activation and report it. [Zero Trust setup](https://developers.cloudflare.com/cloudflare-one/setup/)
3. Supply the exact permitted login email through the private setup route. The builder configures the app-specific policy and verifies sign-in, unauthorised-user rejection and protected API access. Keep account identifiers and the email out of this public repository.

S1 implementation and fixture checks can proceed first. **Deployed private save is not accepted until Free-plan/access evidence and authorised/unauthorised journeys pass.** Other account applications and policies are outside scope.

## 5. OpenAI: needed before live S4 activation

The API-credit benefit is separate from Work/Codex usage and Fast. For Business, activation requires ownership of both the ChatGPT workspace and receiving API organisation, matching account emails, and the qualifying paid-subscription waiting period. Membership or an admin role is insufficient. Actual ownership, grants and balances remain unverified. [Eligibility and activation](https://help.openai.com/en/articles/20001626-api-credits-benefit-for-eligible-chatgpt-subscriptions)

When S4 is ready:

1. Confirm those owner roles and claim the benefit from Business workspace billing into the intended isolated API organisation. Review the destination before confirming.
2. Verify issued free credits, remaining balance and expiry. The organisation must have **no API payment method, purchased credits, automatic recharge, invoice contract or other paid funding**. The subscription's existing card does not authorise API billing.
3. Configure conservative organisation/project controls and the app reservation boundary in [AI_COACH_SPEC.md](AI_COACH_SPEC.md). A budget or alert alone does not prove credit-only operation; metering/enforcement can lag. If the funding boundary cannot be established, leave live AI disabled and complete the feature using controlled responses. [Spend controls](https://developers.openai.com/api/docs/guides/spend-limits), [prepaid limits](https://help.openai.com/en/articles/8264644-setting-up-and-managing-prepaid-api-billing)
4. Store a dedicated project key through the backend's secure secret UI/tool. **Never paste keys or card details into chat, GitHub, screenshots or the browser bundle.** [Key safety](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)

Manual editing and saved work remain usable when credits expire or run out. No automatic top-up or silent switch to paid funding. S1's context export and validated patch import provide a manual ChatGPT-assisted path before API activation. Preparing these documents does not claim a benefit, call a provider or provision resources.

## 6. Operating clauses the builder reads

These are part of the start prompt. Caleb does not assemble or paste them.

### All builders

Complete one coherent outcome. Inspect current code and relevant contracts, make necessary decisions and carry them through implementation, interaction checks and repairs. Consult history for named gaps instead of loading every old instruction.

You may replace or substantially rework the UI, editor, components and internal structure. **A small diff is not an acceptance criterion.** Protect authored inputs, personal drafts, compatibility and valid domain behaviour while removing awkward implementation. Keep abstractions proportionate to actual features.

Resolve routine reversible choices yourself. Keep normal Git recovery and preserve unrelated work. Additional backups are for actual irreversible data operations or the required pre-Unslop checkpoint. Do not add approval rituals, speculative rollback systems or orchestration machinery.

Use existing checks and focused regressions for changed behaviour or real failures. Operate changed journeys and inspect actual renders. Repeat passed checks only after a relevant change, failure or unresolved risk; complete required release checks. Stop when acceptance is evidenced. Report inaccessible evidence, incomplete work and actual model settings plainly.

### Astra builder emphasis

Make the product/spatial decisions needed to finish. Identify the few decisions affecting the outcome, then implement a coherent solution. Do not stop at a proposal or defer ordinary design choices. Judge real screen sizes, gestures and playback, with concise task language and useful control states. Delegate independent work when it improves time or quality; retain one owner of shared implementation.

### Sol builder emphasis

Treat behaviour contracts and the acceptance journey as the specification. Follow affected state through UI, domain data, persistence and reload. Implement valid, invalid and recovery paths together. Identify material contract conflicts rather than inventing private requirements. You have the same permission to replace modules as the Astra builder. Return an integrated candidate, not partially completed files.

## 7. One independent review, then repair in place

Request **one fresh reviewer** at the assigned model/effort. Give it the exact candidate SHA, requirements and accessible evidence. The reviewer assesses the complete unit, returns one prioritised material-finding list, and follows targeted repairs. Same-model review is independent when the agent is fresh; builder self-checks are not.

**Sol reviewer:** reproduce the journey and affected state transitions; check persistence, compatibility, access, recovery and Undo. For S3, watch complete rallies and perform camera/touch gestures. Escalate a named spatial judgement it cannot resolve, not the whole review automatically.

**Astra reviewer:** assess actual composition and interactions on desktop and phone. For S4, challenge vague requests, missing facts, conflicting rules, unsupported advice, revision preview and Apply/Undo. For S5, review the integrated post-Unslop candidate. Software approval does not approve personalised tactics.

Separate acceptance failures from optional preferences. Each finding needs impact, reproduction, expected behaviour and evidence. Do not require a smaller diff, extra abstraction, speculative test or rollback ceremony. Approve the exact final SHA with honest limits. Recheck corrected paths and affected neighbours, without repeating the whole audit after every fix or hiding material defects to cap rounds.

### Separate review prompt, only if in-task fresh review is unavailable

Select the unit's reviewer in the picker, then copy:

```text
Independently review the current candidate for S1 in PRYYSE/RotationStudio.
Read docs/FINISH_STATUS.md for its exact SHA and evidence, and follow
docs/FINISH_PLAN.md plus the reviewer clauses in docs/START_HERE.md.
Use the actual candidate and operate the complete required journeys.
Return one consolidated material-finding list, or approve that exact SHA
with evidence and honest limits. Do not edit code or approve team tactics.
```

Change S1 to the relevant ID. Give the result to the existing builder task:

```text
Resolve this unit's consolidated review findings in the existing task.
Preserve the agreed outcome and use the necessary scope of rework.
Recheck corrected paths and affected neighbours, then obtain the
reviewer's verdict on the final candidate and update FINISH_STATUS.md.
Do not restart planning or broaden testing without a concrete reason.

[Paste the consolidated review or link its accessible result.]
```

## 8. Pause, resume and finish

To pause, ask the builder to push recoverable progress, record the next action and stop its preview/test processes. Resume the same task where possible; a replacement task reads the branch/status instead of reconstructing chat history. Cloud work can continue while a personal computer is asleep, so explicitly pause the task when work should stop. [Cloud execution](https://learn.chatgpt.com/docs/environments/cloud-environments)

Normal Chat is optional for a collaborative choice. Work/Codex can research, plan, implement and review without a relay. [Surface comparison](https://learn.chatgpt.com/docs/use-chatgpt)

Each unit ends with one status update: behaviour, candidate, actual model/effort/speed, meaningful checks/rendered evidence, review result, repair rounds and genuine limitations. S5 requires independent approval of the exact post-Unslop candidate and deployment verification. The owner receives a finished application to assess, not a new workflow to maintain.

The existing merge/publish authority is retained: the worker uses a candidate branch/PR, obtains the exact-candidate review and required checks, then merges and verifies the authorised deployment. It does not ask for routine approval after every fix. Account activation and private-data publication remain subject to the specific setup boundaries above. The guide being written does not itself start a unit.
