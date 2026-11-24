# Model and effort policy for finishing RotationStudio

Evidence reviewed **25 November 2026**. These are evidence-informed starting choices, not measured optimum settings for this project. Use the current account picker as authority for availability and actual selection.

## Evidence and limits

| Primary evidence | What it supports | What it does not establish |
|---|---|---|
| [GPT-6.2 launch research](https://openai.com/index/introducing-gpt-6-2-astra-sol/): Sol within 0.5 points of Astra on FrontierCode 2.0 at about one-fifth cost, both at Max. | Sol is a credible efficient default for specified implementation. | Equality at Medium/High, identical UI judgement, or a fivefold subscription saving. |
| Same launch: AA-3D blinded preference result, Astra 1,318 Elo and Sol 1,259. | A relevant prior for Astra on this unresolved 3D/product-design task. | Proof of this app's visual quality, user acceptance or physical simulation correctness. |
| [Official model selection](https://learn.chatgpt.com/docs/model-selection): Sol Medium for bugs/features; Astra Medium for complex projects; higher effort for harder multistep/open-ended work. | Match model and reasoning to task uncertainty and scope. | A benchmark proving one exact effort level is always optimal. |
| [Subagent configuration](https://learn.chatgpt.com/docs/agent-configuration/subagents): High for complex reasoning, checking assumptions and edge cases, including reviewers. | High is a reasonable starting point for the substantial independent review. | More reviewers or maximal reasoning on every minor fix. |
| [Speed guide](https://learn.chatgpt.com/docs/agent-configuration/speed): Fast generates faster on the same model, separately from reasoning; Astra approximately 1.5× token speed. | Use Fast where the account offer makes it attractive. | 1.5× whole-task speed, free API Priority/Ultrafast, or unlimited usage. |
| [Cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environments): hosted task workspaces, reusable repository/dependency setup, optional browser tools. | Keep implementation, review and CI off personal computers. | Proof that this account already has a published environment or a working WebGL browser. |

## Starting assignments

S1 application experience and S2 spatial/motion work: **Astra High**. S3 specified strategy/data/handoff completion: **Sol High**. S4 integrated finish/release and independent product reviews: **Astra High**. Use **Medium** for a bounded mechanical repair. High reflects the combined scope and uncertainty; it is our engineering judgement, not a vendor benchmark threshold.

Do not default to Max/Ultra. Escalate to Extra High for an identified root-cause/architecture/spatial problem that remains unresolved after a coherent attempt. Fix missing access, data or unclear product decisions directly; more reasoning cannot supply them.

The owner supplied an account-specific Fast promotion through 31 December. Use Fast while the picker confirms that offer. Public standard rate documentation can differ from an account promotion; do not equate “no extra cost” with unlimited allowance or extend the offer to API usage. No new paid API integration is part of this plan.

## Learn from real slices

Use one status row per accepted slice: model, effort, speed, active elapsed time where measurable, usage if exposed (otherwise unknown), material review findings, repair rounds and accepted result. Optimise time and usage to accepted work. Do not run duplicate builds just to compare models. Keep Sol where it delivers with few material corrections; promote a specific difficult task to Astra when the evidence warrants it.

## Current product guidance

The current reusable setup is documented at [Cloud environments](https://learn.chatgpt.com/docs/environments/cloud-environments), reached through **Work in → Cloud**. The older `/codex/cloud/environments` path redirects to a legacy product guide. Work and Codex can both do cloud work; Codex provides convenient code/diff/PR tools. Use whichever exposes the necessary repository and rendered browser tools without adding a relay/controller.
