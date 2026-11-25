# Model and effort policy

**Evidence checked 25 November 2026.** These are starting assignments informed by current primary sources and the actual work, not measured optimum settings for this repository. The account picker and tool metadata establish availability and actual selection.

## 1. Use two primary models deliberately

Use **GPT-6.2 Sol** for substantial implementation with defined contracts and most independent correctness reviews. Use **GPT-6.2 Astra** when unresolved interaction, product or spatial judgement is the difficult part. Keep a coherent outcome with its builder; do not create serial model handoffs just to reduce apparent token cost.

Official guidance starts most Work/Codex tasks with Sol, recommends Astra for complex projects, and shows Medium as useful for existing-code features and complex planning. The assignments below reflect this project's combined scope and uncertainty. [Model selection](https://learn.chatgpt.com/docs/model-selection)

| Unit | Lead builder | Fresh independent reviewer | Reason |
|---|---|---|---|
| **S1: Players, teams, versioned lineups, editable contracts, private save/auth and one desktop/phone edit proof** | **Sol 6.2 High** | **Sol 6.2 High** | Implement specified identity, versioning, patch, compatibility and access contracts end to end. Resolve genuinely unspecified architecture before treating implementation as settled. |
| **S2: Desktop Studio/editor rebuild, player/team forms and whole-app art direction** | **Astra 6.2 High** | **Astra 6.2 High** | Interaction and visual judgement dominate. Check touch viability throughout; the existing editor may be substantially replaced. |
| **S3: Complete phone/tablet authoring, Court practice, motion/camera, advanced editing and connected handoff** | **Astra 6.2 High** | **Sol 6.2 High** | The builder handles spatial and responsive design. The reviewer operates gestures, watches complete rallies and verifies save/reload/Undo against concrete contracts. |
| **S4: Conversational AI coach, proposals, Preview/Apply/Undo and credit-only integration** | **Sol 6.2 High** | **Astra 6.2 High** | Specified implementation plus independent judgement about grounding, missing information, revision behaviour and useful coaching interaction. |
| **S5: Integrated acceptance, known fixes, final Unslop and release** | **Sol 6.2 High** | **Astra 6.2 High** | Sol handles integration and known repairs; Astra assesses the finished product. Use an Astra builder only for identified unresolved redesign. |

Fresh evidence-based review is independent even with the same model as the builder. Do not claim self-review is independent. If the environment cannot supply a fresh reviewer, use the single separate-review fallback in [START_HERE.md](START_HERE.md).

## 2. What the performance evidence establishes

OpenAI reports Sol 6.2 within **0.5 points** of Astra 6.2 on FrontierCode 2.0 at roughly **one-fifth cost**, both at **Max**. Reported AA-3D blinded preference results are Astra **1,318 Elo** and Sol **1,259**. These support Sol as a credible efficient coder and Astra as a useful prior for unresolved interactive/3D design. They do not establish equivalence at Medium/High, independent-review performance, volleyball correctness, or a fivefold subscription saving. [GPT-6.2 research](https://openai.com/index/introducing-gpt-6-2-astra-sol/)

Default Codex context is documented as 272,000 tokens for Astra 6.2 and 500,000 for Sol 6.2. This removes an obvious capacity objection to Sol for large reviews; it is not permission to flood a task with historical logs or a guarantee of a particular environment's limit. [Models](https://learn.chatgpt.com/docs/models)

Optimise **time and allowance to an accepted result**, including repair and review. A quick partial result or an attractive but awkward editor is not efficient. Neither is speculative checking after acceptance is evidenced.

## 3. Effort and speed are separate

- **Medium:** a bounded repair or investigation with clear behaviour and limited uncertainty.
- **High:** the assigned substantial units, cross-component causes, assumptions and edge cases.
- **Extra High:** a named difficult problem with interacting causes, unresolved after a coherent investigation.
- **Max/Ultra:** no default use. Larger scope alone does not establish a benefit.

These distinctions follow the [6.2 prompting guide](https://learn.chatgpt.com/guides/prompting-gpt-6-2-astra) and [review/subagent guidance](https://learn.chatgpt.com/docs/agent-configuration/subagents). Missing credentials, sources or owner-only facts require access or information, not more reasoning.

Use **Fast** while the owner's displayed promotion through 31 December applies. Verify actual settings; naming a model in a prompt does not switch it. Fast changes generation speed on the same model. The approximate 1.5× Astra figure concerns tokens, not total task time. Do not substitute Ultrafast or API authentication. [Speed modes](https://learn.chatgpt.com/docs/agent-configuration/speed)

Work and Codex share usage limits. Allowance depends on model, context, reasoning, tools and caching; API prices do not estimate included tasks. Free Fast does not establish unlimited usage or free API Fast. [Usage and pricing](https://learn.chatgpt.com/docs/pricing)

## 4. Older models when justified

| Model | Use here |
|---|---|
| **6.1 Sol / 6 Sol** | Availability fallback for specified implementation, or when actual accepted-task evidence favours it. Older does not automatically mean cheaper overall. |
| **6 Astra** | Fallback for difficult product/spatial work if 6.2 Astra is unavailable. No current evidence gives it the default role here. |
| **6.1 Terra Medium** | Optional bounded visual/browser inspection that removes a real bottleneck. The main reviewer integrates its evidence. |
| **6 Luna High** | Optional batch of directly checkable extraction, inventory or mechanical transformation. Avoid a full handoff for a trivial edit. |
| **5.5 / 5.6** | No planned critical-path role. An explicitly available runtime and measured benefit would be needed. |

GPT-5.5 retired from Codex with ChatGPT sign-in on **14 October 2026**; API-key sessions are unaffected. A legacy identifier in a tool does not establish future subscription-picker access. [Retirement](https://learn.chatgpt.com/docs/models#gpt-55-retirement)

Terra/Luna roles follow the [model guidance](https://learn.chatgpt.com/docs/model-selection). Delegation adds token use and coordination; introduce a helper only when its independent contribution saves time or improves the result. [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)

## 5. Prompt and review discipline

Use the short start prompt and model-specific clauses in [START_HERE.md](START_HERE.md). They allow substantial rework while protecting authored data and valid behaviours. A small diff is not an acceptance criterion. Routine reversible decisions, repairs and necessary restructuring do not require another owner planning round.

The current guide recommends clear completion criteria, real-size visual inspection and lean instructions. Older Astra guidance identifies clarification pauses, sensitivity to stale instructions and overly broad verification as behaviours to manage. Apply concise autonomy and proportional-testing instructions; do not assume every older tendency is measured on 6.2. [6.2 prompting](https://learn.chatgpt.com/guides/prompting-gpt-6-2-astra), [GPT-6 family guidance](https://developers.openai.com/api/docs/guides/latest-model/gpt-6-astra.md#prompting-best-practices)

Keep one lead builder and one substantial fresh review per unit. Resolve consolidated findings in the builder's context. Recheck corrected paths and affected neighbours. Do not add a reviewer per component, repeat the full audit after every fix, or hide material defects to meet an artificial round limit. Escalate unresolved questions specifically.

Record actual model/effort/speed, elapsed time if known, usage if exposed, material findings, repair rounds and accepted SHA in status. Unknown usage remains unknown. Do not duplicate implementations just to benchmark models.

## 6. Choose the surface for the task

Cloud Work/Codex can research, plan, implement and review. Codex's developer views help with diffs and PRs. Normal Chat is useful for actual back-and-forth, such as editor-feel feedback or a personalised tactic; it is not a required relay between workers. Record resulting decisions in active project documents. [Product surfaces](https://learn.chatgpt.com/docs/use-chatgpt)

This policy selects development workers. The app's inference models, credit reserve and activation boundary belong in [AI_COACH_SPEC.md](AI_COACH_SPEC.md).
