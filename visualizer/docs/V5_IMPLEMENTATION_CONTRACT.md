# Rotation Studio V5 — precise implementation contract for Codex

**Status:** DESIGN/IMPLEMENTATION-READY DOCUMENT ONLY. No V5 code has been authorised or implemented.
**Branch:** planning/v5-product-blueprint, fork PRYYSE/RotationStudio. **Released main must remain V4.**
**Starting app commit:** a8b6698262ef5009484ffd66ec243dafdd3552f1, V4 app code originally merged as 270a636.
**Product/sport authority:** PRYYSE/Volleyball/docs/V5_PRODUCT_BLUEPRINT.md and existing PROJECT_STATE.md, docs/ROTATION_REVIEW_METHOD.md, plus the original V4 brief. This document is the implementation-level interpretation.
**Primary implementation owner:** bounded Codex tasks only after user says continue. Normal Chat owns all product, athlete/volleyball, architecture and UX decisions.
**Preferred Codex model:** gpt-6.1-sol High if available/appropriate. Never silently substitute autonomous product research for the frozen instructions below.

## 0. Red lines, source and execution hygiene

- Work only in the real authentic SetOptics fork, under D:\Projects\RotationStudio-V4 on the authorised Windows host. Verify Git repository origin, HEAD, current branch and any uncommitted/untracked evidence before touching code; fetch and reconcile without stash/reset/clean/force-push. The current branch is a **docs-only planning branch**. On implementation authority, derive a dedicated feature/strategy-studio-v5 branch and verify it before editing. Do not merge or deploy without separately authorised major phase gate.
- Source paths are relative to visualizer/. Keep existing React 19, Three/R3F, Zustand, Vite and TypeScript. No new framework, backend, accounts, collaboration service, remote LLM API, video service, CSS dashboard starter, external databases or auth.
- Preserve Apache-2.0 notices and the original Set arcs mode (meshes, textures, saved sets, presets, query links and controls), unchanged V3 tactical generator scripts/author_tactics_v2.py, public plans/rotations.json and published team geometry; preserve all 12 base timelines and 36 alternates and their authored ball/track event semantics. Do not edit a plan just to fix label collision or to make validation pass. Team V3 baseline remains immutable. Do not change DRAFT to APPROVED.
- Keep code files under the repository AGENTS.md 500-line guideline; targeted tests alongside each feature and a real Chrome browser acceptance suite. No weakening existing validators, no special production code flags for tests, no invented field approval.
- Source coordinate system: our half X −4.5..4.5 left-to-right as viewed toward net, Z 0 at net to Z 9 at our endline; server can legitimately be behind our line at Z >9. All changes to Start must be held through service contact for **both** serve owners under TTGVA. FIVB 2025–28 uses foot-contact relative overlap; existing centre-based checks are conservative, not referee-certifying.

## 1. Data ownership and migration contract

### 1.1 Preserve V4 sparse strategy v1 untouched

Current source modules to inspect first:
- src/lib/strategyDraft.ts: schemaVersion 1, 100KB max, BASE_REVISION=8c0fb5d, fixed PLAYER_IDS and STAGES; strategyLink URL fragment; stageOrder()/stageTimes(); parseStrategy().
- src/lib/strategyOverlay.ts: applies saved anchors, route bends and setter target to all 4 authored cases of each rotation/serve, preserving original contact timing/ball endpoints, immutable base.
- src/state/strategyStore.ts: Zustand local library (50 strategies) stored at rotation-studio-strategies-v1, autosave/past/future/gesture and import preview.
- src/ui/useStrategyStudio.ts: single derived overlay ownership; never introduce another independent scenario store.
- src/state/rotationStore.ts and src/lib/receiveExample.ts: authored variant selection and read-only 9-point teaching samples.

**V1 invariant:** an imported V1 strategy, saved V1 browser library and V1 shared URL fragment must still load at the exact previous coordinates with identical player/ball/route outcomes after V5 release. A blank copy still exactly matches every source V3 scenario. Do not reinterpret old saved data because a new editor is nicer.

### 1.2 V2 schema (explicit proposed design, implement exactly)

Use the same kind identifier: rotation-studio-strategy. New persisted schemaVersion=2. Keep the existing id/name/author/baseRevision/overrides fields unchanged, including their R1–R6/they|us keys and within-serve 4-case inheritance.

Add only the following optional fields:

~~~typescript
type AttackSide = 'left' | 'right'
type FirstTouch = 'normal' | 'harry'
type CaseKey = `${1|2|3|4|5|6}/${'they'|'us'}/${AttackSide}/${FirstTouch}`
type Stage = 'Start' | 'Receive' | 'Set' | 'Attack' | 'Defend'
type PlayerId = 'harry' | 'caleb' | 'trent' | 'logan' | 'georgia' | 'jaz'
type Spot = { x:number; z:number }

// Existing anchors/routes/readyOptions/setterTarget format from V1 stays valid.
type StageRotationChanges = {
  anchors?: Partial<Record<Stage, Partial<Record<PlayerId,Spot>>>>
  routes?: Partial<Record<Stage, Partial<Record<PlayerId,Spot[]>>>>
  setterTarget?: Spot
  readyOptions?: boolean
  // Own-serve only: derived second defensive occurrence after our hit.
  laterDefend?: {
    anchors?: Partial<Record<PlayerId,Spot>>
    routes?: Partial<Record<PlayerId,Spot[]>>
  }
}
type CoachInstruction = {
  primary?: string
  ifDifferent?: string
  fallback?: string
  teamCall?: string
}
type CoachNotes = {
  // A shared note by rotation/serve/stage.
  team?: Partial<Record<`${1|2|3|4|5|6}/${'they'|'us'}`, Partial<Record<Stage,string>>>>
  // Optional player-scoped roles/narrative for this stage.
  players?: Partial<Record<`${1|2|3|4|5|6}/${'they'|'us'}`, Partial<Record<Stage,Partial<Record<PlayerId,CoachInstruction>>>>>
}
type StrategyDraftV2 = {
  kind: 'rotation-studio-strategy'
  schemaVersion: 2
  id:string; name:string; author:string; baseRevision:string
  overrides: Partial<Record<`${1|2|3|4|5|6}/${'they'|'us'}`, StageRotationChanges>>
  // Case specificity is opt-in. Only an exact case override can narrow the global baseline.
  caseOverrides?: Partial<Record<CaseKey, StageRotationChanges>>
  notes?: CoachNotes
}
~~~

The TypeScript definitions above specify the required structure; reuse existing source types where compatible without changing these semantics.

**Application order for every authored scenario**: immutable V3 base → shared overrides of that exact R/serve → optional exact caseOverrides key formed from scenario.tactics.opponentAttack and scenario.tactics.firstTouch → re-link contacts and all ball endpoints → validate structural/movement and report diagnostics. Later Defend is applied to the **second** own-serve “Defend again” event and its following defence/recovery frame(s), NOT the first “Defence ready” stage. For they serve, no laterDefend allowed; explicitly reject it from imports. No new sixth top-level editor stage.

**Case precedence:** an explicit case-specific anchor overwrites the shared anchor for that player and stage, not the entire stage object; unset players still inherit. An explicit case route replaces the inherited route for that player/stage. A case-specific empty route array means Straight, even when shared route has bends. A case-specific setterTarget/readyOptions value overwrites shared. Avoid merging a route array point-by-point. The “Reset this case” action removes only that caseOverrides key. The “Reset this stage” action in shared mode removes only that shared stage; in case mode removes only corresponding case-specific stage. Both are one undo step.

**V1 migration:** parse V1 with existing validator, lift fields without reshaping, set schemaVersion 2 and empty optional fields in memory. Do NOT rewrite/delete the V1 localStorage key during first read. Use a V2 library key rotation-studio-strategies-v2; on first V2 launch, if V2 library absent, read/validate V1 and present compatible V2 in memory, with guarded write to V2 on explicit save/first accepted autosave. Leave V1 as recoverable backup. If V2 unreadable, do not discard V1 or create empty V2; surface recover/export notice. Keep V1 links importable and always Save a copy for imported fragments. No ID collision, no overwriting baseline or existing library without explicit selection. Keep max 50 strategies; 100KB UTF-8 per strategy unless a tested hard reason requires a documented change; notes max 400 characters per field and an aggregate limit so a 48-case pathological import cannot lock UI.

**Validation:** exact allowed keys/IDs/versions/finite ranges; case keys only 48 valid formats; max 8 bends per selected route; no prototypes, executable fields or prototype pollution; notes plain text stripped/rejected for controls, no HTML rendering. Only save valid sparse format. Allow tactically invalid (but structurally valid) placements as **DRAFT with diagnostics**.

### 1.3 Preview/in-memory provenance

Do not store “Approved” in a strategy merely because diagnostics pass. Baseline source status DRAFT; user-created and imported copies show “Needs review”. A case may have:
- published source V3 example,
- edited foundation,
- explicitly edited case,
- simulated first-ball teaching sample,
- unavailable/infeasible.

Display these as distinct labels. No derived teaching sample persists to public tactical source; importing/exporting an edited foundation serialises only explicit user overrides/notes, not generated 48-case full timelines. Active sample mode cannot accidentally mutate the foundational strategy or its cases.

## 2. Deterministic teaching and tactical projection

### 2.1 One derived read model for View, Edit and review packet

Implement a pure helper module group (e.g. src/lib/caseReview.ts and src/lib/coachProjection.ts), no second mutable state. Inputs: current immutable published bundle, optional V2 strategy, current selected rotation/serve/attackSide/firstTouch, selected stage, selected player. Output:

~~~typescript
type ReviewContext = {
  rotation:1|2|3|4|5|6; serve:'they'|'us'
  attackSide:'left'|'right'; firstTouch:'normal'|'harry'
  stage:Stage; playerId:PlayerId|null
}
type ReviewActor = {
  id:PlayerId; number:1|2|3|4|5|6
  frontEligible:boolean
  role:string; point:Spot; eventTime:number
  isNamedFirst:boolean; isNamedSecond:boolean; isAnimatedHitter:boolean
  isOtherFrontHitterOption:boolean
}
type ReviewProjection = {
  caseSource:'published'|'shared-draft'|'case-specific'
  eventLabel:string; eventTime:number
  actors:ReviewActor[]
  firstContact:PlayerId; secondContact:PlayerId
  animatedHitter:PlayerId|null
  eligibleFrontAttackers:PlayerId[]
  setterTarget:Spot
  notes:{team:string|null; player:CoachInstruction|null}
  reviewFindings:ReviewFinding[]
  nextEvent?:{label:string;time:number}
}
~~~

**Eligibility and actual availability must be different:** frontEligible means *legally front row*, and stays true for Harry even when he is setting. The **other front-hitter option** list must exclude whoever makes the current second contact. If a front-row athlete just took the first contact, show “Conditional: needs sufficient time after passing” rather than asserting they are ready. If a nominal hitter has no authored second-contact-to-approach route, show “Eligible but not modelled as a ready hitter”. No arbitrary filter based on gender, height or the person's ability to block. In particular: R4/R5 front-row Harry is still front-eligible but ordinarily occupies the setting job; R5 first-touch Caleb must not be shown as immediately available for an unverified quick attack. An **available** hitter is a coaching/route qualification, not the same boolean as front-row legality.

The renderer must derive actual player positions/eligibility from existing positionOf() and sampled tracks. The selected actor's role and the **named** pass/set/hit are source-backed. Where contact or hitter is unmodeled, label “Not authored for this case” instead of guessing. If notes absent, use short **factual** fallbacks drawn from named scenario facts (“Harry makes second contact”); do not invent individualized tactical jobs purely from coordinates or imply that a training sample has all possibilities covered.

The current 9-location example engine is a **separate read-only teaching projection**. It has its own visible “Teaching example / unavailable” source indicator. Normal excludes Harry by current authored policy and Harry-first uses named backup. Do not pretend success from a heuristic reach screen equals probability of real reception.

### 2.2 ReviewFinding model and exact disclosure

~~~typescript
type ReviewFinding = {
  code:string
  category:'RULE'|'GEOMETRY_TIME'|'CONTACT'|'COVERAGE'|'TACTICAL_REVIEW'
  severity:'INVALID'|'CAUTION'|'REVIEW'
  affectedCases:CaseKey[]
  affectedStage?:Stage
  playerId?:PlayerId
  summary:string        // concise, grounded, action-oriented
  suggestedCheck:string // one next check, not auto-fix
  source:'validator'|'sampled-timeline'|'authored-data'|'human-review'
}
~~~

Reuse all existing validateBundle/serviceDiagnostics/movementIssue checks; do not relax numerical/legal screens. Group repeated underlying findings across four cases for a human-readable summary, but retain an expanded list with individual case, stage and player. **Display real data rather than derived pass/fail claims**: selected route straight-line distance, path length after bends, seconds available for that stage transition, and whether the current animation's timing/model flags it. Do not use percentages such as “93% successful coverage” or invented player speeds. No hidden auto-correct. An invalid Start keeps the changed draft visible, prevents any “reviewed valid” claim and offers Reset/Undo. Persist user edits subject to the structural schema cap.

Proposed audit hooks for V5-S02:
- court coordinates in metres, event times from stageTimes() and phase label events, not hardcoded timestamps;
- preserve exact linked pass/second/set ball endpoints and service contact hold;
- check authored next contact and active setter remain possible *as a template*, with explicit warnings if edited geometry creates unrealistic displacement or broken connection;
- coverage means **indicative role assignments**, not ball reach probability; avoid rejecting a strategy only because two human-scale coverage ellipses overlap;
- case comparison uses modelled sampled trajectory and highlights changes in displacement; no external hidden coach API.
- Opponents represented by a server and attack side only; never claim opponent rotational legality verified.

### 2.3 Later own-serve defence event

Current published own-serve R3 phase labels include Start 0, Serve hit 1.4, first Defence ready 4.18, Our dig 5.40, Second contact 7.77, Our attack 8.63, **Defend again 9.50**, Their next attack 10.97, Next dig 12.29 and Next set ready 14.71. This is illustrative, NOT hardcoded for all rotations. Their-serve contains different “Defend now”, “Their attack”, “Defence ready” labels.

For V5, derive the *first* defence anchor from stageTimes().Defend; derive **later** own-serve readiness from the existing authored phase label “Defend again” (require it present before enabling nested override). The default is **exact unchanged V4 shared-Defend outcome**. When a user expressly opens Defend > “Later: after our attack” and edits an anchor/route, apply only at/after Defend again as specified by source roles and stop before the next named contact if route linking would otherwise force a false teleport. Re-link actual ball endpoints where appropriate; do not change first defence, serve, first pass or original second-contact identities. Show warning if a plausible later-defence adjustment cannot be fit within existing authored timeline. One nested optional event is enough; do not add another top-level row.

### 2.4 Locked default copy and player explanations (do not ask Codex to invent these)

Source-authored phase cues and explicit user-supplied notes outrank the templates below. An author-written note never becomes official team approval. Default labels must be **data-bound** and have the following meanings:

| Stage/context | Mandatory core text pattern | Selected-player nuance |
| --- | --- | --- |
| **Start** | “R{n}, {They/Us} serve. Hold your rotational order until service contact.” | “{Name} begins P{n}. After contact you may move to your next displayed responsibility.” If our server P1: “Serve from behind the baseline, then recover to the displayed role.” |
| **Receive** | “Sample first touch: {firstContactPlayer}. Pass toward the marked setter window.” | If selected first toucher: “You are the named first passer in this **authored example**, not necessarily every serve/dig.” If Harry first: “A named backup, {secondContactPlayer}, makes contact two.” Others: “Stay available for your nearby seam/next role; the shown sample does not cover all ball locations.” |
| **Set** | “Second contact: {secondContactPlayer}; shown setter target is the gold ring.” | If selected second toucher: “Get to the shown setting window, if the ball and time allow.” If eligible front hitter: “You may be a front-row attack option, even if another athlete is animated to hit.” No “middle” prescription for Georgia/Jaz. |
| **Attack** | “Shown third contact: {animatedHitter or ‘not authored’}. Other eligible front athletes: {list}.” | If selected animated hitter: “Approach the displayed ball; teammates cover a possible block.” If selected front alternative: “Available front-row hitter, but a separate trajectory has not been authored here.” If back row: “Keep your covering role; do not pretend you can make a front-row attack.” |
| **Defend** | “Defend this shown opponent attack. Follow your marked local lane and read the actual ball.” | Front eligible and role=block: “Shown blocker: watch their hitter.” Back row: “Stay ready for deep/tip/cover as assigned by this *draft* example.” If no explicit defence lane data, say “Specific responsibility needs coaching review.” On our serve, secondary occurrence caption is “Later defence after our attack”, not a different top-level stage. |

**No unsupported name substitutions:** do not say Caleb always receives or Harry always makes second contact when a valid Harry-first alternate has a different named setter. Display “No named alternate” if no authored alternative exists. The selected player's exact P number comes from rotation/eligibility source, never a literal in translation strings. If a player is at the same ball contact whose source and notes disagree after a draft edit, show a REVIEW warning and the contact source (not a confident tactical command).

**Warning text examples tied to deterministic conditions** (source may add actual metres/seconds and case count; do not emit if condition absent):
- **RULE / INVALID:** “Start position may break service-contact rotational order in R{n} {serve}. Return {player} behind/in the required overlap or ask a referee to check foot positions.” If the exact referee-foot relation is unknown, replace “breaks” with “is flagged by our centre-point screen”; never certify a foot fault.
- **GEOMETRY_TIME / CAUTION:** “Harry's shown route covers {distance} m over {availableTime} s in this example. Check pass height and whether a nearby setter should take contact two.”
- **CONTACT / INVALID:** “The first pass or set no longer connects to the named contact for {case}. Adjust the target/route or reset that stage.”
- **COVERAGE / REVIEW:** “This edit changes the assigned short/deep cover for {case}. Check that another athlete still has the uncovered lane; overlay ellipses are illustrative.”
- **TACTICAL_REVIEW / REVIEW:** “This placement applies to four authored cases, but other receivers or hitters have not been newly optimised. Review each case before team use.”

These are interface explanations and **coaching prompts**, not a new tactical assignment. No authoritative blanket prediction of the best athlete for every ball is permitted from these copy templates.

## 3. Exact UI anatomy and design system

### 3.1 Shared UX language and state hierarchy

Preserve original three top-level View / Edit strategy / Strategies and Set arcs switch. Main task hierarchy in **View**: (1) Court and chosen stage; (2) chosen athlete's instruction or whole team; (3) conditional alternate; (4) playback/advanced configuration. In **Edit**: (1) Court and selected athlete; (2) stage and scope (all 4 cases vs this case); (3) edit action; (4) impact/diagnostics; (5) Save/Share. In **Strategies**: (1) name/author/source/local state; (2) Open/Copy; (3) Import preview, export/share; (4) delete with confirmation.

The selected rotation and serve order are **never** hidden behind an expanded panel or obscured while adjusting player placement. Use direct words:
- “Whole team” / “Focus: Harry”, not “Athlete selector state”.
- “At serve contact” instead of “Legal start” where appropriate; retain Start as stage label.
- “Incoming path”, “Add a bend”, “Make path straight”.
- “Applies to all 4 authored cases for this serve” vs “Only this case”.
- “This is an authored example, not the only possible first touch.”
- “Draft / Needs review”, not “Approved” on a model pass.
- “This browser only. Save a copy of a shared preview.”

Add small accessible description when X/Z shown: “X: court left/right, 0 centre; Z: distance back from net in metres.” Do not force friends to understand +/- coordinate signs.

### 3.2 Desktop layout 1440×900

Make the court the dominant left flexible region and keep a 300–360px right context panel only where sufficient width; do not shrink the usable court to a narrow remote preview when selecting Strategies. Court gets the full 9×9m floor (with opponents and server if the authored view needs them), visible net and a recognisable top orientation. Use a disciplined single compact top utility area rather than three competing floating rows that waste height; still preserve R1–R6, serve, modes, stage/phase and Set arcs. Stage control remains direct; exact current event and cue on/under the court.

A selection is represented by a clear one-player ring/route/identity and the matching panel title. Do not over-dim non-selected athletes to the point where a team formation disappears. All 6 distinct source colours remain unchanged; include name/P number for non-colour recognition. Minimise opaque card backgrounds between viewer and court.

### 3.3 Mobile 390×844, 375×812 and short landscape

Phone toolbar fits within viewport without horizontal page scroll. The 9×9m court remains visually clear and not behind a large opaque Settings modal. In View, aim for a court at least ~390px tall when space allows. In Edit with sheet, floor must remain at least ~290px tall; a pinned stage and selected-player context remain apparent. Controls may live in a bottom sheet with **one scroll owner** (not nested body+drawer scroll), sticky sheet title/section header when content scrolled; size/position should adapt to short landscape, not assume portrait.

The first-ball 3×3 grid opens in this sheet and all nine choices are reachable, with a visible selected state, receiver name, setter/hitter and review warning. Do not allow Three/drei Html labels to paint on top of the sheet; either portal/render the label layer below overlay or use correct stacking/pointer clipping. Settings overlay never blocks a requested court click while dismissed.

Five stage controls have at least 44px effective touch heights and remain accessible at 375 and 390; labels may become abbreviated only if full wording remains accessible by name/title. Do not “fix” mobile player collisions by moving tactic coordinates.

### 3.4 Collision-aware 3D tags

Keep each player's six canonical colours. Implement a deterministic layout after projecting each avatar's feet marker to screen with ResizeObserver/viewport changes, not by mutating source track geometry. Candidate tag offsets anchored to body/feet; avoid overlapping other labels, stage controls and selected target; prioritise selected athlete and first/second-contact player. When all 6 names cannot fit, degrade unselected to short identity chip (e.g. “H · P5”) while a nearby legend/list preserves full identity. A short leader connection is acceptable; avoid huge floating panels. The label algorithm must run deterministically for 375×812, 390×844, desktop, and live 1440→390→1440 resize; no thrashing, flickering or pointer interception. Add a “Names” toggle respecting original settings.

### 3.5 View player focus

Add one visible “Whole team / player” selector with stable IDs, available outside the 3D scene. Selected actor panel reads ReviewProjection: current stage event, exact position/P# and front/back eligibility; first/second/animated hitter facts; next stage and a single coach note if available. One short primary, conditional and fallback field. If a note is blank, present a factual source-backed message and “Needs coaching note” as appropriate. Do not pretend a generic V3 simulation is personalized expert coaching.

Whichever athlete is chosen, View, Edit and Scenario Explorer must highlight the same ID. Selecting a new stage updates highlight/cue without clearing strategy. Interaction works by mouse, touch and keyboard; six distinct names and stage roles are available in semantic DOM, not only WebGL pixels.

### 3.6 Scenario Explorer (not another editor)

This is a contextual panel/drawer replacing central modal interference, with opponent attack Our left/Our right, first touch Normal/Harry first, an “Authored” selection, 3×3 short/mid/deep example ball locations, receiver Auto or named, and a clear current sample source. It shows receiver, setter, sample hitter, other eligible front options, selected route(s), unavailable reason, and always leaves the court visible. “Teaching example” and “No feasible authored example” must be prominent, with the last valid animation paused and not falsely re-labelled. Selecting these **does not save edits**, reset authored data or force all four variants to that sample.

## 4. Editor, review panel and safe library

### 4.1 Exact editor semantics

Continue real on-court athlete/target/waypoint drag, two-dimensional numeric entry and one history step per gesture. A staged edit is either:
- **Shared**: existing default, all four authored cases for this R/serve inherit; or
- **This case**: explicitly entered via “Customise this case” after showing side/first-touch parameters.

Show scope in a stable caption, before each significant edit. Toggling from shared to case view does NOT itself write override. The first actual case edit creates one narrow key. “Reset case to shared” deletes it after confirmation; do not delete other case edits, other rotations or local library items.

At the Set stage, “Prepare all hitters” keeps active setter contact and existing explicit placements, only positions eligible front hitters, makes one undoable operation, remains opt-in. Display “Animated hitter: X; other available front-row hitters: Y,Z. This does not author Y/Z ball trajectories.” Do not add illegal back-row hitter options. Respect Georgia/Jaz not middle as *design intent* without falsely classifying them ineligible front-row athletes.

### 4.2 Impact, Compare and practical route hints

Selected player inspector displays Current / Team V3 ghost at the *same timestamp*, x/z point and one incoming route (plus optional faint outgoing arrow), selected case/source and number of affected authored alternatives. If artistically comparing, actual baseline is low-opacity floor marker/line only, not a second overlapping player avatar with fake body collisions.

For the relevant transition output:
- prior event, current event and time delta in seconds;
- straight line point-to-point metres;
- sampled path length including waypoints, clearly labelled; no fake sprint speed or success guarantee;
- warnings if existing movement checker considers it invalid, if second setter cannot realistically be there under authored timeline, or contact link has changed.
- an accessible warning detail list with “what happened / why it matters / what to check” and case fan-out, grouped by root cause, never silencing distinct variants.

Compute distances with unit-tested geometric helpers; never measure from pixel positions or invent court scale. A hard rule warning and a tactical coach concern have different styling/labels and do not collapse into one “0 errors” approval.

### 4.3 Library, export and team reference

Keep current localStorage-based strategy library and 50-item cap, reliable autosave and discard-guard. No automatic autosave of a shared preview into somebody else's library. Existing v1 and future v2 fragments/JSON round-trip; Save a copy uses independent ID, import never writes published plan JSON or source.

Add a **Review packet** export as a deterministic JSON object (separate kind, e.g. rotation-studio-review-packet) with source revision, sparse V2 draft, selected R/serve/case, a summary of user-written notes, deterministic findings, and explicitly stated “DRAFT; not match-approved”. Importing a Review packet must yield preview strategy only after validating contained draft; do NOT execute or trust text notes. It is intended to bring back to ChatGPT for actual tactical review. An ordinary strategy export remains a bare lossless sparse draft for machine compatibility.

Add a single-rotation **Team reference** rendered from the currently chosen court/projection and player notes: court anchored with names/P numbers, service start and selected main paths, stage calls, explicitly Draft disclaimer; printable from browser without blank generic boxes or a second data source. If a full visual export would require a new image library, use print CSS plus a read-only in-app share page; don't add a raster pipeline unless essential and tested. A share link fallback still uses JSON when >8000 chars. No backend.

## 5. Bounded animation semantics

After core data and reading UX are accepted, add a restrained, recognisable motion vocabulary to src/three/RotationPlayer.tsx and small supporting modules as needed:
- walking/running stance and facing tied to actual interpolated velocity and arrival;
- receive/dig posture only near contact event, not the entire previous stage;
- set hands when the named athlete makes second contact, including emergency setter, with readable pose;
- an approach-ready stance and small jump arm extension for the **one actually animated hitter**; alternate eligible hitters are shown ready, not teleport-spiking;
- blocker rise/touch cue only for actual front-row eligible blocker, and a reach-safe static/help pose otherwise;
- own serve contact and planted recovery; no early movement before TTGVA service hit;
- better centre body proportions and short stop transitions as the animations settle.

Don't alter authored coordinates, roles, exact contact times or ball path to make an animation easier. Don't animate back-row Harry as blocker. No full IK engine or skeletal/mocap assets. Respect prefers-reduced-motion: turn off secondary motions while preserving location and event highlighting, and allow a low-motion performance setting for phone. Keep original Set arcs unaffected.

## 6. Implementation slices and exact Codex handoff contracts

All slices must be sequential on the V5 *implementation* branch, after user permission. Each slice is accepted by a narrow direct observable gate and must commit/push recoverable implementation and test evidence. Only one mutation owner per worktree, no Codex cleanup of other projects.

### V5-S01 — Sparse V2 persistence, case overrides and later defence

**Outcome:** V1 saved strategies and links load unchanged; V2 supports explicit per-case overrides and later own-serve Defend without changing public source.

**Allowed source:** src/lib/strategyDraft.ts, strategyOverlay.ts, associated types/validators/tests, src/state/strategyStore.ts/tests, useStrategyStudio.ts, plus small new pure helpers where needed. No large layout rebuild or Set arcs changes.

**Exact work:** implement Section 1 schema and merging, v1→v2 non-destructive migration, preview/save-copy, bounded notes, later “Defend again” event mapping and full ball/role continuity. No new UI except minimal hidden or tested controlled state selector required by tests. Changed case exactly one of four. Reject unsafe imports. Preserve service contact and immutable source.

**Tests/acceptance:** empty V1, populated V1 and V2 imported all exact; 48 authored variants unchanged with empty V2; change shared R3/they Receive moves intended player in 4 cases; explicit right/harry exception changes only one case; own-serve Later Defend changes only later event; two invalid case formats rejected without data loss; history one action per gesture; roundtrip/size/storage failure. Build succeeds.

**Stop:** after tests and commit, no product/animation extension. Report exact files and known limits.

### V5-S02 — Deterministic projection, honest diagnostics and comparison

**Outcome:** a pure read model returns source-backed player roles, selectable first/second/hitter, eligible front options, selected path distance/time, simple review findings and planned source notes for all 48 authored cases.

**Allowed source:** new small pure modules in src/lib, tests, optional minimal state selectors. Do not modify tactical author generator, plan JSON or UI styling.

**Exact work:** Section 2 ReviewProjection/ReviewFinding contracts, source note fallback, base-vs-edited delta and exact case fan-out. Use existing structural and reach screens, do not fabricate success estimates; expose missing coverage as REVIEW not impossible verdict. Filter/cluster four-case duplicate warnings while keeping details.

**Tests/acceptance:** 6×2×4 matrix, all six players, front/back eligibility, first/second/attack event labels, R3/R1 time/distance examples, legible invalid Start and unmodeled hitter fallback, case-specific and later defence comparison, zero source mutations, no random generation.

**Stop:** commit/push and return concise output; UI slice follows only when authorised implementation continues within the same major phase.

### V5-S03 — Court-first viewer, Player Focus and non-occluding Scenario Explorer

**Outcome:** someone unfamiliar with the source can select their player and see court + one grounded rule/exception without opening code; settings no longer covers the phone court or lets 3D names bleed over the sheet.

**Allowed source:** src/ui/Rotations.tsx, FirstBallExamples.tsx, view-related UI modules, src/rotations.css, src/three/RotationCameraRig.tsx/RotationScene.tsx for rendering/layer only, tests. Preserve public application and all controls, no changed geometry/timing.

**Exact work:** Sections 3.1–3.6; persistent R/serve/stage/focus selection, improved court-first proportions and keyboard semantics, inspectable actions, proper mobile bottom sheet, first-ball example role explanation, robust 375/390/768/1440/844 landscape. Ensure Set arcs remains separately selectable. Any UI default policy must match Section 3, not a new Codex-designed layout.

**Tests/acceptance:** real Chrome loaded at 1440×900, 390×844, 375×812, 768×1024, 844×390 and live resize each direction; 6 visible named/identity tags and stage controls, selected player screen-readable, no tag/panel overlaps, all nine sample-grid cells reachable, no horizontal overflow/pointer bleed, direct navigation and not-hidden current phase.

**Stop:** screenshots and bounded UI tests; no feature creep.

### V5-S04 — Case-aware editing, Compare and Impact inspector

**Outcome:** user makes one shared or case-specific placement, sees exactly whom/when it affects, can compare with Team V3, and gets an actionable honest finding instead of generic “1 notice”.

**Allowed source:** src/ui/StrategyEditor.tsx, useStrategyStudio.ts, StrategyRoute.tsx and view/store selectors, src/rotations.css, tests. No tactical generator modifications.

**Exact work:** Sections 4.1–4.2. Case scope explicit, secondary later-defence editor nested under Defend for own serve, baseline ghost, path intervals/length with truthful screen limitations, warnings grouped with expand-all per case, one-gesture undo, edge-case save safety. Keep Top camera and current source semantics.

**Tests/acceptance:** live Chrome pointer drag of Caleb and a route bend, gold target drag, four-case fan-out, one-case exception and single-case reset, V3 ghost exact coordinate, R1 own-serve hold, illegal Harry P1 warning, R3 release travel readout, Set eligible front hitter options including Jaz/Georgia, no discarded library data. Screen captures desktop/phone with no obstructing UI.

**Stop:** commit/test, no V5 publish.

### V5-S05 — Local sharing, Review packet and trustworthy team reference

**Outcome:** author can send a V2 sparse draft and a readable DRAFT team reference; recipient can preview/save-copy without syncing or overwriting existing work; ChatGPT gets structured review data.

**Allowed source:** src/ui/StrategyLibrary.tsx, small share/review/print components, src/lib/share/validation helpers, existing local store and CSS. No remote service.

**Exact work:** Sections 1.2, 4.3. Preserve V1 imports and old links; V2 URL/JSON, explicit Save a copy, no copy into published baseline, lossless export, review packet marked DRAFT, print/read-only page with accurate live court and concise stage/player notes. No generic blank positional PDF design.

**Tests/acceptance:** saved V1 still accessible, V2 export/import round trip, malicious/oversized import fails without data loss, share link of typical small case loads as preview in clean browser; noncompact falls back to JSON, user-protected delete confirm; team reference R3/our serve includes actual stage positions and DRAFT, print CSS doesn't crop court/labels, original Set arcs intact.

**Stop:** report and evidence, no deployment.

### V5-S06 — Bounded posture/animation legibility and performance

**Outcome:** existing avatars communicate their **actual** observed receive/set/attack/block/defence role with restrained pose and plausible travel, without invented tactical movement or a performance regression.

**Allowed source:** src/three/RotationPlayer.tsx, limited small animation helpers and tests, scoped CSS/settings for reduced motion. Do not rework court scale or entire visual pipeline.

**Exact work:** Section 5, no skeletal/mocap packages unless proven essential and approved. Do not recreate SetOptics scene or change animation times. First/second/hit cues reflect true named actors, back-row eligibility respected.

**Tests/acceptance:** compare real Chrome footage/screens at serve, receive, set, attack, defend for R1/R3/R5 both serve types; ensure service hold and emergency-setter examples, no back-row blocking pose; prefers-reduced-motion and phone performance. Use browser evidence, not only type checks.

**Stop:** implementation-complete **major checkpoint**. Full *independent* UAT belongs to a separately user-authorised next phase, not Codex self-certification.

## 7. Independent acceptance plan (next major phase, Normal Chat owner)

After implementation checkpoint and the next user continue, Normal Chat conducts independent Chrome UI/video/screenshot review on Windows, not merely reading Codex test results. Inspect all six rotations and serve owners, especially R1 own serve, R3 Harry release, R2/R3 Jaz attacking, R4/R5 constraints, base-vs-case override fan-out and all first-ball teaching grid categories. Use actual 3D pointer/court interactions and difficult narrow states. If a material defect is found, write a *precise* bounded Codex repair instruction, run changed-case tests, then repeat the failed UI interaction and an appropriate broader acceptance pass. Don't hand the user an unfinished beta.

Independent exit gates:
1. Every scope feature above materially works through the real UI with screenshots/trace and without page errors.
2. Existing 73+ V4 tests, V3 source validation/48 scenarios and Set arcs still pass, production Pages-base build succeeds.
3. No hidden data loss on save/import/link/migration/undo/redo, no false “approved” or probability claim, no invalid service-contact clearance.
4. No tablet/phone controls clipped, labels do not occlude data or bleed above drawers, selected actor and all five anchors discernible.
5. No claim of tactical match acceptance. Record remaining physical-phone, teammate readability and referee-foot checks as **DEFERRED**, not failed or passed.

Then stop for a publication **major checkpoint**. On separate continue, merge and verify real Pages deployment and independent real browser interaction. No V5 deployment during planning or implementation or before the explicit release gate.

## 8. Developer handoff boilerplate (copy for one slice only)

**Use after the user's implementation continue, not now.**

~~~text
You are Codex implementing a *bounded* slice of V5 in the real PRYYSE/RotationStudio SetOptics fork.
Read AGENTS.md, visualizer/docs/V5_IMPLEMENTATION_CONTRACT.md, the linked PRYYSE/Volleyball/docs/V5_PRODUCT_BLUEPRINT.md, V4 brief/UAT, and PROJECT_STATE.md.
Verify Windows D:\Projects\RotationStudio-V4 is the real worktree and safely fetch/reconcile its upstream; create or select the dedicated feature/strategy-studio-v5 implementation branch. Preserve dirty QA evidence.
Implement ONLY slice [V5-S0N] exactly as specified. Do not make product/UX/volleyball placement choices. No new app, backend, auth, live sync, generator change, relaxation of validation, or Set arcs regression.
Use the existing React/R3F/Zustand and test conventions. Keep code files focused and <=500 lines. Test your slice with its explicit unit + real browser gates, run npm test and production base-path build at appropriate final integration, verify protected V3 source diff remains empty.
Record what changed, precise tests and limitations, commit and push the proper feature branch. Stop at the slice boundary. Do not merge/publish or call any tactic APPROVED.
~~~

At the end of the **entire authorised implementation phase**, Normal Chat reconciles the commits/test results and stops at implementation-complete; **the next phase is independent UAT** only after the user says continue.
