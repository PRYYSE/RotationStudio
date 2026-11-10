# RotationStudio: R3 both serves, owner-anchored tactical revision V2

**Status:** FOR REVIEW, NOT OWNER-APPROVED. **Date:** 10 November 2026. **Working strategy:** `PRYYSE Team · R1 + R3 refined (FOR REVIEW)`. **Scope:** R3 Their Serve and Our Serve, opponent attack left/right, normal/Harry first. **R1 unchanged.**

## 1. Evidence and source priority

1. **Definitive owner-edit source:** `PRYYSE/Volleyball/docs/rotations/sources/R3_RECEIVE_OWNER_EDITED_EXPORT_2026-11-10.json`, archived from the uploaded `strategy-89eeb026-9ed3-4ee8-87bd-a686a9090a74(1).json`. The author explicitly asked to adjust **R3 They Serve / we receive** before the assistant revised the rest. The altered case is `3/they/left/normal`, with positional edits throughout the rally. It is the source of the legal start, core receive shape, hitter lanes, short/deep floor responsibilities, and new left-of-centre setting target. Other seven R3 cases in that export were still the rejected version.
2. **Team attributes and method:** `PRYYSE/Volleyball/docs/rotations/TEAM_TACTICAL_CONTEXT_AND_12_SLICE_HANDOVER_2026-11-10.md`. Existing R1 both serves (owner said usable/good) is a **protected comparator**, not a template to impose on R3.
3. **Old R3 v1 explanation:** `visualizer/public/strategies/r3-tactical-rationale-v1.md`, **rejected** because Harry's looping release, ordinary serve-receive exposure and unhelpful recovery. We reuse only supported team facts and source-event identifiers.
4. **This V2 proposal:** Coordinates beyond the user's source case, corrective event timing, condition-specific blockers, emergency assignments and all new variants are assistant-authored. No claim of match approval or measured player reaction times is made.

**Court coordinates:** x=-4.5 is left, +4.5 right, z=0 net and z=9 our endline. Opponent attack LEFT/RIGHT refers to **our receiving court**. R3 official front row Caleb P4, Jaz P3, Trent P2; back row Harry P5, Georgia P6, Logan P1. Harry and Logan cannot block in R3, nor is Jaz assigned an effective block.

## 2. Key corrections to the user's imported R3

- **Legal serve contact kept exact from owner's `p0` for Their Serve**: Harry(-1.45,4.55), Caleb(-3.05,3.12), Trent(+2.23,3.53), Logan(+3.30,6.90), Georgia(+0.25,5.85), Jaz(+0.95,4.54). P1 Logan's **Our Serve** start differs only by moving him **outside the baseline to (+3.30,9.45)**.
- **`p1:serve-hit` now holds these positions at the serve-hit timestamp**, rather than applying the user's experimental early-release anchors to the pre-contact keyframes. Application source event handling applies positions at or before service contact, so the previous p0/p1 difference could move athletes before the ball was struck. Release begins **after** the actual serve; receive/dig phases continue into the user's intentional formation.
- **Harry's earlier leftward detour removed:** original owner export showed Harry from (-1.45,4.55) to (-3.15,4.11) at `p1` and then back inward at `p2`. New sequence moves directly to (-1.94,2.27) by the normal first pass, and then to the owner-authored **(-0.65,0.83)** for the first set. When possession turns over, he stays shallow centre/left and later releases for the next set instead of resetting to P5 or circling Georgia/Jaz.
- **The two old `p9` continuation frames are replaced** with the new next-set shape. The prior export abruptly jumped Harry from the new second-set position back to (+0.20,1.45), sent Caleb across the court by several metres and shifted Jaz back towards the original old R3. That is removed in all eight cases.
- **Directional defence now matches the selected opponent side.** The left-case user's `p6`/`p7` had Trent drifting/marking a block towards right-centre despite an opponent-left illustrated attack. This revision gives Trent a progressive left pre-shift for LEFT and right pre-shift for RIGHT, without demanding a last-instant sprint. This is an assistant correction, not represented as an unchanged owner decision.
- **Every athlete gets one of the supported explicit actions in every authored keyframe**, including intermediate ball-boundary frames. All authored bends are straight/empty unless a real lane requires a bend; no artificial circles.

## 3. Why these players are here

| Player | Serve / first touch | After our set or hit | Opponent attack and next contact |
|---|---|---|---|
| **Harry, P5 back** | Sheltered shallow-left setter support; **not** a routine passer. Owns only genuinely unavoidable short or net-roll first balls. | Sets the second after another player's first; short rebound support immediately after setting. | Short left/centre floor coverage, then a **short direct route to set again** after another athlete digs. Never blocks. If Harry dug first, call Georgia or the actually reachable backup. |
| **Caleb, P4 front** | Best receiver and court reader; larger left/deep seams, not every ball everywhere. | Sample left hitter from a reachable route; if he passed an awkward ball, a delayed high set to Trent/Jaz is safer than assuming an immediate fast left hit. | Main larger left/deep floor defender, sample later dig; emergency local left blocker only if already in range and Trent genuinely cannot close. When he blocks, the floor reorganises around four other defenders. |
| **Trent, P2 front** | Own short/right local responsibilities without chasing vast floor coverage. | Right/mid attacking option with minimal swapping; needs a playable set. | **Single blocker on the early-read reachable LEFT or RIGHT** in animated examples. Advance progressively during opponent set rather than sprinting at the last instant. If a quick set makes closing impossible, use nearest legal local blocker or zero block, not a fictitious flying Trent. |
| **Logan, P1 back** | Narrow deep-right reception, avoiding large high-pressure serve-receive areas. On Our Serve he is the actual server from behind endline. | Remains deep-right: no fictional front-row spike or block. | Covers deep-right/line and difficult long deflections; needs a real return-from-serve window before occupying right-back. |
| **Georgia, P6 back** | Primary deep-middle sample first passer; she can handle stable local serve/dig zones. | Recover to middle/deep floor. If Harry made first contact, Georgia takes the **actual second**, starting to move when the short ball is read. | Deep middle/left seam; share responsibility when Caleb changes to blocker. Emergency setter if Harry digs, with Caleb if closer/more available. |
| **Jaz, P3 front** | Manageable short-right and shallow-centre seam, not a huge deep chase. | Controlled right-side/high-ball option if actually reachable, not a conventional middle quick. | Short-right tips/cut shots; no pretend middle block. Hold a defined local area when not attacking. |

**Important trade-off:** The sample uses Caleb to hit left and later to dig. Those are separated by a genuine possession sequence and recovery time; they are not two consecutive actions over an impossible half-second. No one is made to abandon an incoming ball just to execute a script.

## 4. Real serve and reception policy

**THEY SERVE:** Everyone remains in the staggered legal stack through contact. Georgia owns the illustrated deep-middle pass. Caleb calls left and deeper left/middle seams and can override the example when the ball goes there. Logan owns narrow deep-right, Jaz reachable short-right, Trent short-right/front. Harry is deliberately sheltered, with only a small short-left emergency window. **A ball in a seam is taken by the first well-positioned, ready caller, with the other player becoming backup; no one holds back because a source case names Georgia.** No theoretical receive zone implies the player can cover it from any distance.

**OUR SERVE:** Logan starts behind the endline. The other five hold the legal stack until his actual serve. The opponent may return quickly, so while Logan is still returning, the nearest front player covers the early short ball and the remaining floor group shifts. On a normal three-touch opponent return, Trent moves along the shown left/right block preparation, Caleb covers left/deep, Harry short-left and setter-reachable, Georgia deep middle, Jaz short-right and Logan recovering to right-back. First incoming team contact is **our dig**, not serve receive.

**Second contacts:** Normal illustrated first Georgia → **Harry set**. Unavoidable Harry-first → **Georgia set** (Caleb if closer in the actual rally). Trent sets only if neither is reachable and the simple safe play genuinely needs him. Always obey no consecutive regular team contacts by the same player. The current data fixes actual ball/pose ownership with the V2 `contacts` field; the sidebar actions alone are not sufficient.

## 5. Defensive reads, floor seam ownership and blocking conditions

- **Opponent attack OUR LEFT (illustrated):** Trent may single-block left **when the opponent gives enough readable time**. Caleb takes the larger left/deep floor lanes, Harry short centre/left behind the block, Georgia deep middle, Logan deep-right, Jaz shorter right/cut. The staged leftward Trent movement begins before the final attack marker, not during a fictional instantaneous jump across the net.
- **Opponent attack OUR RIGHT (illustrated):** Trent singles near the right antenna after a much shorter lateral release. Jaz owns local short-right cut/tip, Harry covers short centre, Caleb covers left/deep and cross-court, Georgia middle/deep cross seam, Logan right line/deep.
- **Opponent quick far-left set:** If Trent cannot close from his previous position, **Caleb is the possible emergency front-left blocker** only if still sufficiently close. Trent then takes a reachable short/middle floor job, with Harry/Georgia shifting to protect the larger left/deep gap. If neither legal front-row blocker can arrive, call a **zero-block full floor coverage** rather than pretending a late jump succeeds. This is a coaching fallback, *not currently a separate animated source branch*.
- **Opponent high middle set:** A reachable Trent + Caleb double can be considered, but only when both are nearby. With **two blockers, four floor defenders** inherit short-left, short-right, deep-middle and line/cross duties; with **one blocker, five**; with **zero, six**. Never assign a blocker the same floor zone simultaneously. Jaz, Harry and Logan remain nonblockers in R3.
- **Late rally:** After our attack, reassess the next opponent set from the *actual current positions*, and only then decide block and floor coverage. After Caleb's sample next dig, Harry steps to the left-of-centre target; the other five cover or recover without returning to their original start.

**Seam rule:** First player who can make a controlled contact calls “MINE”; the near neighbour backs out or backs up. Deep-left belongs primarily to Caleb, deep-middle Georgia (Caleb backup), deep-right Logan (Georgia backup), short-left Harry with nearby Caleb, short-right Jaz with Trent as front support when not blocking, centre tips Harry/Jaz by whichever is nearer and free. A poor pass triggers a high safe set to a *present* hitter, not the illustrated fastest attack.

## 6. Illustrated event-by-event positioning and actions

The tables below give **every named event** for the normal, opponent-left sample of **both serve states**. Additional variations are encoded in the JSON and summarised afterwards. Each cell is `x,z [action]` in metres, the location is an animation teaching anchor rather than a guarantee that the player can cover a polygon at match speed.

### R3 THEY SERVE, OUR LEFT attack, normal first contact

| Event | Harry | Caleb | Trent | Logan | Georgia | Jaz |
|---|---|---|---|---|---|---|
| `p0:legal-start` | (-1.45,4.55) ready | (-3.05,3.12) ready | (+2.23,3.53) ready | (+3.30,6.90) ready | (+0.25,5.85) ready | (+0.95,4.54) ready |
| `p1:serve-hit` | (-1.45,4.55) ready | (-3.05,3.12) ready | (+2.23,3.53) ready | (+3.30,6.90) ready | (+0.25,5.85) ready | (+0.95,4.54) ready |
| `p2:first-pass` | (-1.94,2.27) ready | (-2.45,4.18) cover | (+2.13,2.47) cover | (+2.84,6.32) cover | (-0.40,6.55) receive | (+0.81,3.79) cover |
| `p3:second-contact` | (-0.65,0.83) set | (-3.90,3.03) ready | (+0.72,1.89) ready | (+2.52,5.14) cover | (-1.23,4.89) cover | (+2.68,2.37) cover |
| `p4:our-attack` | (-0.27,2.21) cover | (-3.07,1.07) attack | (+1.07,0.95) cover | (+3.10,6.70) cover | (-1.36,5.21) cover | (+3.25,1.25) cover |
| `p5:defend-now` | (-0.56,2.93) cover | (-2.81,1.59) recover | (-0.11,1.18) recover | (+1.68,5.36) recover | (-1.56,5.74) cover | (+2.89,2.97) cover |
| `p5:defend-now:t730` | (-0.39,2.77) cover | (-3.10,3.55) recover | (-1.10,0.85) ready | (+1.52,6.45) cover | (-1.12,6.10) cover | (+2.73,3.58) cover |
| `p6:their-attack` | (-0.78,2.48) cover | (-3.05,5.12) cover | (-1.55,0.65) block | (+2.25,6.50) cover | (-0.85,6.65) cover | (+2.75,3.70) cover |
| `p7:defence-ready` | (-0.80,2.55) cover | (-3.00,5.30) cover | (-1.56,0.65) block | (+2.25,6.50) cover | (-0.85,6.65) cover | (+2.73,3.66) cover |
| `p8:next-dig` | (-0.71,1.32) ready | (-2.80,5.08) receive | (+0.65,1.72) recover | (+2.80,6.30) cover | (-0.85,6.55) cover | (+3.13,2.90) cover |
| `p9:next-set-ready` | (-0.81,0.57) set | (-3.85,2.65) recover | (+0.75,1.45) ready | (+2.25,5.45) cover | (-1.20,5.25) cover | (+3.35,2.30) cover |
| `p9:next-set-ready:t1182` | (-0.81,0.57) set | (-3.85,2.65) recover | (+0.75,1.45) ready | (+2.25,5.45) cover | (-1.20,5.25) cover | (+3.35,2.30) cover |
| `p9:next-set-ready:t1220` | (-0.81,0.57) set | (-3.85,2.65) recover | (+0.75,1.45) ready | (+2.25,5.45) cover | (-1.20,5.25) cover | (+3.35,2.30) cover |

### R3 WE SERVE, OUR LEFT attack, normal first contact

| Event | Harry | Caleb | Trent | Logan | Georgia | Jaz |
|---|---|---|---|---|---|---|
| `p0:legal-start` | (-1.45,4.55) ready | (-3.05,3.12) ready | (+2.23,3.53) ready | (+3.30,9.45) ready | (+0.25,5.85) ready | (+0.95,4.54) ready |
| `p1:serve-hit` | (-1.45,4.55) ready | (-3.05,3.12) ready | (+2.23,3.53) ready | (+3.30,9.45) serve | (+0.25,5.85) ready | (+0.95,4.54) ready |
| `p1:serve-hit:t255` | (-1.35,4.35) cover | (-2.87,3.78) cover | (+0.90,2.30) ready | (+3.24,8.43) recover | (+0.12,5.95) cover | (+1.20,3.95) cover |
| `p1:serve-hit:t328` | (-1.15,3.95) cover | (-2.73,4.15) cover | (-0.10,1.58) ready | (+3.21,7.78) recover | (-0.10,6.20) cover | (+1.65,3.85) cover |
| `p1:serve-hit:t395` | (-0.95,3.58) cover | (-2.63,4.55) cover | (-1.00,1.00) ready | (+3.17,7.18) recover | (-0.32,6.45) cover | (+2.15,3.75) cover |
| `p2:defence-ready` | (-0.85,3.45) cover | (-2.55,4.85) cover | (-1.30,0.85) block | (+3.16,6.98) cover | (-0.50,6.55) cover | (+2.50,3.70) cover |
| `p3:our-dig` | (-0.75,2.80) ready | (-2.50,4.85) cover | (-1.10,1.20) recover | (+3.05,6.90) cover | (-0.78,6.50) receive | (+2.55,3.65) cover |
| `p4:second-contact` | (-0.65,0.83) set | (-3.90,3.03) ready | (+0.72,1.89) ready | (+2.52,5.14) cover | (-1.23,4.89) cover | (+2.68,2.37) cover |
| `p5:our-attack` | (-0.27,2.21) cover | (-3.07,1.07) attack | (+1.07,0.95) cover | (+3.10,6.70) cover | (-1.36,5.21) cover | (+3.25,1.25) cover |
| `p6:defend-again` | (-0.56,2.93) cover | (-2.81,1.59) recover | (-0.11,1.18) recover | (+1.68,5.36) recover | (-1.56,5.74) cover | (+2.89,2.97) cover |
| `p6:defend-again:t1025` | (-0.42,2.77) cover | (-3.08,3.50) recover | (-1.10,0.85) ready | (+1.70,6.50) cover | (-1.12,6.10) cover | (+2.75,3.60) cover |
| `p7:their-next-attack` | (-0.78,2.48) cover | (-3.05,5.12) cover | (-1.55,0.65) block | (+2.25,6.50) cover | (-0.85,6.65) cover | (+2.75,3.70) cover |
| `p7:their-next-attack:t1117` | (-0.78,2.48) cover | (-3.05,5.12) cover | (-1.55,0.65) block | (+2.25,6.50) cover | (-0.85,6.65) cover | (+2.75,3.70) cover |
| `p8:next-dig` | (-0.71,1.32) ready | (-2.80,5.08) receive | (+0.65,1.72) recover | (+2.80,6.30) cover | (-0.85,6.55) cover | (+3.13,2.90) cover |
| `p9:next-set-ready` | (-0.81,0.57) set | (-3.85,2.65) recover | (+0.75,1.45) ready | (+2.25,5.45) cover | (-1.20,5.25) cover | (+3.35,2.30) cover |
| `p9:next-set-ready:t1507` | (-0.81,0.57) set | (-3.85,2.65) recover | (+0.75,1.45) ready | (+2.25,5.45) cover | (-1.20,5.25) cover | (+3.35,2.30) cover |


## 7. Alternative cases and what really changes

| Case | Differences from the illustrated tables | Contact ownership |
|---|---|---|
| THEY / LEFT / Harry-first | The very short ball reaches Harry at approximately (-1.75,2.75); Georgia moves forward into the left-of-centre set. Harry recovers to short-left floor cover rather than setting second. Left-side Trent blocker read is unchanged when the next ball permits. | Harry first → Georgia second; Caleb next dig → Harry next set. |
| THEY / RIGHT / normal | Identical legal receive start and standard Georgia/Harry contacts. After the team's attack, Trent reads and travels to a *right* block; five others redistribute, including Jaz local cut/tip and Logan right/deep. | Georgia first → Harry second; Caleb next dig → Harry next set. |
| THEY / RIGHT / Harry-first | Short-left Harry first, Georgia second. Opponent-right shifts Trent to nearer right block. | Harry → Georgia; later Caleb → Harry. |
| US / LEFT / normal | Logan serves; first team ball is Georgia's deep-middle dig, then Harry sets from the user-derived left-of-centre window. Progressive left Trent block, real server recovery. | Georgia first dig → Harry; later Caleb → Harry. |
| US / LEFT / Harry-first | Logan still serves. A reachable short-left opposition attack makes Harry the digger; Georgia prepares and sets while Harry recovers as short-left cover. | Harry first dig → Georgia; later Caleb → Harry. |
| US / RIGHT / normal | Logan serves; right-reading Trent shifts towards his near antenna, with short-right Jaz, central Georgia and Caleb left/deep. | Georgia first dig → Harry; later Caleb → Harry. |
| US / RIGHT / Harry-first | Short-left Harry first dig, Georgia second; right block and other defenders move without a fixed reset. | Harry first dig → Georgia; later Caleb → Harry. |

**Not represented by a separate menu case yet:** every possible alternate server target, middle/quick balls, differing first diggers other than normal Georgia/Harry, two- or zero-block emergencies, backcourt overpasses and genuinely poor passes. They are addressed by the seam/role rules above but must not be described as automatically animated. The later final Work integration should model the meaningful distinct branches after owner review.

## 8. Implementation contract, tests and review status

- **Source JSON:** `R3_REBUILT_OWNER_ANCHORED_2026-11-10.json` (V2 strategy, combined R1+R3; `coachingVersion:1`). The exact owner export remains protected at the archived source path. Eight R1 `caseOverrides`, all R1 player notes and team notes are unchanged. Eight R3 `caseOverrides` are rebuilt and fully action-assigned.
- **Contacts:** Every R3 normal variant uses `contacts.secondSetter=harry`; Harry-first uses `georgia`; all use `nextReceiver=caleb`, `nextSetter=harry`, `fallbackSetter=georgia`. The represented first receiver remains the original source Georgia (normal) or Harry (exception), not merely a displayed fake action.
- **Validation performed in generation:** full start-order centre-point comparison, all six-player action/event records, no R3 back-row block, Logan outside baseline on our serve, same coordinates at service contact, no old end-of-rally resets, first/next setter identities, unchanged R1 records and straight route-bends. A **rough 1.5× straight-line movement screen** was applied between authored event anchors (illustrative timing; not a measured player-speed test). The app's full TypeScript bundle validation, live browser choreography and actual match-foot/coverage assessments must be separately checked before claiming those results.
- **Do not broaden scope:** No Court Mode redesign, Full Studio change, new UI controls or R2/R4–R6 edit belongs to this R3 tactical handoff. The published strategy is **FOR REVIEW**, not team or referee approval. The user will inspect both serve states; revise THIS R3 before going to R2.

### Specific owner decisions still pending visual review

1. Whether Trent's illustrated left single block becomes easier than expected with the earlier shift, or Caleb should sometimes take that nearer left block instead. This varies by opponent setter speed; it should not become a forced double-block sprint.
2. Whether Jaz's shift to the short-right lane is the preferred way to free Harry's left-centre setter path, while Georgia and Logan remain sound at deep middle/right. This matches the submitted geometry better than the old central Jaz receive placement but has not been owner-approved.
3. Whether the user wants the next-set window as close to the net as (-0.81,0.57), or a slightly deeper target when passes are not tight. V2 retains the submitted target for visual comparison.

**Review outcome:** Awaiting owner inspection and corrections. No R3 tactic has been marked ACCEPTED.