# V3 efficient movement + adaptive receive examples — review-only
Status: TACTICAL DRAFT. Do not merge/publish before browser acceptance.
Owner: Normal Chat tactics; Codex only for the bounded engine control.
Revision: 2026-10-28, created after the user's request to remove rigid positioning and unnecessary travel.

## Verified current work on feature/tactical-v3-efficient
- No source reimplementation: the genuine SetOptics fork and original Set arcs remain.
- V3 generator visualizer/scripts/author_tactics_v2.py (same historical filename) now sets local near-side blocking; opposite blocker HOLDS THEIR SIDE rather than travelling across the net to help every attack. The far blocker is not labelled as an active block.
- Back row retains left / centre / right responsibility with <0.3m shade as the attack develops. Back-row Harry maintains a shallow second-ball/defence role, rather than repeatedly sprinting to the baseline.
- Jaz / Georgia front players drop about one step for short-ball defence rather than crossing from right to short-middle; they remain legal and genuine front-row hitters during our possessions.
- R4 Caleb attacks inside-left from P3, reducing pointless sideways travel. R6 Harry-first shows a reduced block rather than rushing through Georgia's setter lane.
- Own-side server begins 45cm behind the baseline, enough for an illustrated serve without a gratuitous 1.4m run-in.
- Fixed first-contact fallbacks: no pointless path detours that loop out and back to the SAME position.
- **48/48** timelines pass structural legal service/role/ball checks and sampled minimum .56m centre spacing / <=4m/s speed screen (teaching-model thresholds, not physical safety proof).
- **44/44** existing tests and Vite build passed.
- Across the 24 opponent-serve scenarios, combined six-player displacement from our attack to defensive-ready: V2 mean **9.09m** → V3 **6.42m** (29.4% less).
- Across 24 own-serve scenarios, combined displacement from starting line-up to defensive-ready: V2 **10.90m** → V3 **8.14m** (25.4% less).
- UNVERIFIED: actual human match execution and exact foot-overlap. The newly attached video 1000016810.mp4 could not be decoded here because the attachment-processing runtime returned ClientError repeatedly; do not claim to have inspected it.

## Engine gap: first contact cannot be one predetermined ball
The current scenarios script only one normal receiver (or Harry-first) for each rotation, and the first-contact position is held constant despite actual serve/dig location. Purely shrinking defence positions does NOT solve user requirement "best overall no matter who and where ball is received."

### Required adaptive sample experience
Put a **First-ball example** tool under existing Settings, separate from persistent match positions. Default is *Authored example* (preserves current 48). Other choices: select one of nine sample landing areas on our 9×9m court: x = -3 / 0 / +3 metres, z = 3.5 / 5.8 / 8.0 metres (short / mid / deep). A player selector should allow **Auto (best reachable)** or a named player. For Harry-first tactic, only Harry can be first contact, so do not silently override that. Add a short one-line warning for unreached/illogical samples.

The tool is an explanatory training simulator, NOT a claim it predicts a rally. Show a named receiver, who sets second and the chosen available hitter. Do not show a generated scenario that requires anyone to teleport.

### Tactical decision contract
- Inputs: selected authored R1–R6, they/us serve, opponent attack our left/right, normal/Harry-first, sample first-contact location, optional receiver override.
- **Match legality stays fixed** at the first serve hit: starts and rotational identities are inherited, no moving before contact, no illegal back-row blocks or attacks.
- For THEIR serve choose amongst non-Harry eligible passers using starting position, travel/reaction feasibility, receive proficiency and assigned broad/compact reception area. For OUR serve use actual defending spots at the moment of opponent attack, not the original start. The more convenient first responder should normally receive. Harry is excluded under Normal; explicit Harry-first uses existing alternate backup set.
- Preferred receiver quality: Caleb strongest; Georgia/Trent middle; Jaz lower; Logan weakest. Mobility: Caleb/Harry agile; Georgia/Logan moderate; Trent restricted and Jaz most restricted. Use coaching-relative values stored in team plan JSON rather than hiding sensitive movement policy in TS; note values are preferences, not measured running speeds.
- If no one can reasonably reach sampled spot before contact, **report uncovered/unrealistic**, keep last valid animation; do not animate impossible reach. Forced player must also pass reach test; explain when the requested athlete cannot reach.
- Maintain the **same selected defender/attacker roles unless the first-contact event changes their availability**. The non-receiver should stay in their local lane, not cross the court to fill the former scripted receiver's role.
- Preserve Harry as setter for a non-Harry first contact; Harry first triggers the existing authored backup. When first passer is also the authored main hitter, select a different viable FRONT ROW hitter for the sample (or a safe high ball if no hitter reachable); don't make them receive deep and instantly launch a quick hit.
- Set target may remain the rotation's normal off-net window for a good pass. Never force the catcher to sprint to a predetermined "attack position" if their first touch consumed that time; the nonselected attackers cover.
- Reconnect ball segment endpoints (serve/attack -> first contact -> pass -> second contact -> set -> selected hitter -> next return) and change the named receiver, cue and local tracks accordingly. Avoid modifying defensive shape if the first contact doesn't require it.
- The original 48 authored scenarios remain canonical JSON. Sampled examples are derived non-destructively at runtime. Coach draft edits/import/export must not mutate a derived example: disable sample mode inside Coach draft, or reset to Authored example before entering.
- Share links may encode example sample coordinates and optional player, but must preserve old-link defaults and never leak local drafts.
- **Verification:** sample 9 locations across all 6 rotations and both serve modes; exercise both opponent attack sides and Harry first, check reachable cases and explicit unsupported case; validate contact/ball/above-net, animation speed, near-collisions, pass-to-target continuity, and no browser errors. Browser top-down on phone and one wider viewport. Do not lower or bypass validator. Keep plan status DRAFT.

### Acceptance boundary
Implement only this small conditional first-ball teaching tool and protect historical modes. No cloud backend, user accounts, new framework, auto-publishing, changing the approved actual player coaching policy, or generic motion cosmetics. On feasibility failure, clearly communicate rather than fake an optimal movement. Do not publish or set status APPROVED; wait for Normal Chat to inspect resulting model and visuals.
