# PRYYSE Team — R3 Both Serve States: v1 Tactical Rationale

**Status:** PROPOSED / OWNER REVIEW. The existing R1 is retained as the first two serve-state slices of the selectable PRYYSE team strategy. This R3 extension adds R3 THEY SERVE and R3 WE SERVE, with four authored source cases per serve state. **Do not treat a working animation or a quick review of R1 as proof of game legality or approval of R3.**

**Prepared:** 10 November 2026. **Source data:** `visualizer/public/strategies/pryyse-team-tactics-2026-v1.json` (case overrides `3/they/*`, `3/us/*`, R1 unchanged). **Selection:** Court Mode > Strategy > **PRYYSE team · R1 + R3 (published proposal)** > **R3** > They serve / We serve. The supporting plan is selectable without replacing any locally saved strategy. The base V3 demo and user-authored R1 are not overwritten.

## 1. Why R3 is different from R1

In the currently used rotation order, R3 is:

| Official position | Player | Effective role |
|---|---|---|
| P4 (front left) | **Caleb** | Strong front-left hitter **and** best actual passer/digger, deliberately used for left/deep defence when play demands |
| P3 (front middle) | **Jaz** | Short-central tip/soft-ball defence and safe side attack option, **not** a conventional middle blocker |
| P2 (front right) | **Trent** | Strongest realistic **single blocker**, right-side hitting option; reads to left if the opponent set is high/slow enough |
| P5 (back left) | **Harry** | Dedicated **back-row setter**, begins moderately shallow behind Caleb so he can release to a nearby second contact without a huge diagonal |
| P6 (back middle) | **Georgia** | Primary controllable middle/deep receiver and actual emergency setter if Harry takes first |
| P1 (back right) | **Logan** | Strong server on our serve; narrow, honest right-back defensive lane. His height does **not** make him eligible to block here. |

The essential tactical trade-off is **Caleb's attacking ability versus his value on the floor**. The team has only two potentially effective front blockers: Trent and improving Caleb. Jaz is too short to be a reliable block. **The illustrated standard defence gives Trent one block and uses Caleb to defend the larger left/deep area** where the team's strongest floor defender is needed. Against a rushed far-left attack that Trent cannot close, Caleb can be an *emergency local* blocker if close enough, but that decision frees a floor gap and must be called; the app does not invent a quick-set branch.

This is intentionally different from the R1 Logan+Trent double left block. Logan is **back-row in R3** and must never join that block. Nor should the coach force Harry, another back-row player, to block simply because he reaches the front area to set.

### How Harry's difficult back-left setting route is solved

Previous R3 animations caused Harry to run diagonally around Jaz/Trent and sometimes assigned Trent to set while Harry was available. Both were rejected as **bad tactical programming, not unavoidable consequences of R3**. This plan starts Harry at P5 **(-1.45, 4.55)**, safely behind Caleb P4 but not at the deep corner. He stays capable of reading a short-left first ball, then reaches a modest centre-left setting window **(+0.20, 1.45)** *after service contact and after the normal first dig*, following the shortest practical route through the lane left of Jaz. The measured source path passes the existing movement screen; the actual player will still adjust to a real imperfect pass rather than sprint to a fixed spot on every rally.

Harry must not take both first and second normal team touches. For a **Harry-first** ball, Georgia is deliberately available to set a **high, safe** second contact. Caleb is the technically stronger alternative but is also R3's strongest immediately available front-row hitter; using Georgia preserves that attack while keeping the emergency route realistic. **If Georgia cannot reach second**, Caleb must set instead; then Trent becomes the main front hitter. This is a **coaching contingency** not a fabricated selectable extra case.

## 2. Actual R3 service-contact positions

All coordinates are on **our** 9 m court, from the endline looking to the net. x=-4.5 left to +4.5 right; z=0 at our net; z=9 at our endline.

| Player | Rotation eligibility | THEY SERVE start x,z (m) | WE SERVE start x,z (m) | Design decision |
|---|---|---|---|---|
| Harry | P5 back left | **-1.45, 4.55** | **-1.45, 4.55** | Protect his setting route while remaining behind front-left Caleb |
| Caleb | P4 front left | **-3.05, 3.12** | **-3.05, 3.12** | Strong accessible left receive and front-left attack |
| Jaz | P3 front middle | **-0.10, 3.15** | **-0.10, 3.15** | Shallow centre/tip, with narrow reach requirement |
| Trent | P2 front right | **+1.65, 2.35** | **+1.65, 2.35** | Main blocker with a central-enough base for realistic left or right reads |
| Georgia | P6 back middle | **+0.25, 5.85** | **+0.25, 5.85** | Deep-centre receiver, emergency setter when Harry takes first |
| Logan | P1 back right/server | **+3.30, 6.90** | **+3.30, 9.45** | Narrow deep right on their serve; **physically outside baseline** on our serve |

These are tactical illustration coordinates, not a referee's foot-by-foot certification. The current app's conservative service-contact position checker was applied to **all eight** R3 cases with no order errors. In particular, the row ordering and front/back requirements hold at **both teams'** actual service contact under the previously researched TTGVA model. None of the six players should reposition before the ball is struck.

## 3. R3 — THEY SERVE

### 3.1 Receiving the ball without breaking the setter route

The **normal sample** names **Georgia** as the first passer, landing in deep centre around (-0.40, 6.55). She owns this controllable middle/deep receive and calls it early. **Caleb** has meaningful deeper left and left-middle seams, not just a tiny cosmetic circle, and can override the planned first passer when he is better placed. **Jaz** takes manageable short-centre/tips and does not have to chase deep-right. **Trent** helps on short-right if needed, then remains a right hitter/blocker. **Logan** protects his compact deep-right line; his weak receive technique is explicitly accounted for rather than ignored. Harry is sheltered from the ordinary first ball but still plays an unavoidable short/net-roll ball actually in his space.

From the first contact, Harry follows the ball forward toward approximately (+0.20, 1.45) for the normal second contact, with **no detour around Jaz** and no pointless reset to P5. The exact animated example passes through a high first pass; a poor first ball calls for a simpler high set to the hitter who is actually ready.

### 3.2 Set, attack and responsibility of the other five

The primary depicted hit is **Caleb from the left**. This may appear unusual because Caleb is also the team's best floor defender, but he is **front row in R3**, and a clean pass should take advantage of his second-best overall hitting. He can hit from his natural left position without a long route. **Trent** remains a genuine right-side hitter on a suitable set, especially when Caleb was the first passer or has just defended. **Jaz** is a shorter, safe high-ball/controlled side option when time allows, not a forced middle quick attacker.

**Harry** covers the short area after his set and returns into shallow left defence rather than his old service start. **Trent** prepares to read the opponent's setting direction. **Jaz** occupies short centre for tips and rebound cover. **Georgia** holds/recovers toward deeper centre, **Logan** protects deep right/line, and **Caleb**, once he hits, begins dropping to his useful left/deep defensive responsibility. No player is deliberately left without a job.

### 3.3 Harry-first exceptional serve

In the explicitly selectable **Harry first** scenario, the incoming short service ball reaches **Harry** at the actual source contact location near (-1.25, 3.25). Georgia changes from ordinary receiving into the **second contact setter** at approximately (+0.20, 1.45). She has enough illustrative time from her nearby starting back-middle position with a high pass; Caleb is the backup if she cannot arrive. **Caleb continues as the sample left hitter.** Harry does not take second, does not jump to block, and instead covers short-left for the counterattack.

### 3.4 Opponent's left/right attack and next rally

| Opponent attack into our court | Blocking plan | What the five nonblockers do |
|---|---|---|
| **OUR LEFT** | **Trent single block** if the opponent's left-set tempo is readable | **Caleb** left/deep drives and seam; **Harry** short-left/tip, then second contact; **Jaz** short-centre tip; **Georgia** deep middle; **Logan** compact deep right |
| **OUR RIGHT** | **Trent single block**, nearer to his normal P2 approach | Caleb flexes left/mid deeper; Harry covers shallow left/centre; Jaz short centre; Georgia deep centre/cross; Logan right back/line |
| **OUR MIDDLE** | Prioritise readable Trent single and floor seams; an exact middle case does **not** exist in the current selector | Six read their own areas rather than precommitting to a nonexistent middle animation |
| **Very fast far-left set** | If Trent cannot physically close, **nearby Caleb may take an emergency left block**, or use zero block with six floor defenders | Redistribute the left-deep lane to Harry/Georgia as reachable; **this alternative remains coaching-only** |

The important tactical choice here is **not to force a theoretical Caleb+Trent double block** every rally just because both are front row. That would deprive the floor of its best digger, make Trent cover a large lateral distance and give weak diggers the largest backcourt areas. On a slow obvious high outside set, a double may sometimes be viable; that is a situational extension, not the base shape.

The **later incoming ball** is illustrated as a separate dig by **Caleb**, approximately (-1.08, 6.90) for opponent-left and (-0.72, 6.90) for opponent-right. He moves there from the previous attack/coverage without returning to P4 service start. **Harry** sets the next ball near (+0.20, 1.45). The earlier source demo incorrectly named Trent as next setter; **the published R3 case now explicitly changes the actual player poses, next ball ownership and coaching cues to Harry**. This is not merely a sidebar action label.

## 4. R3 — WE SERVE

### 4.1 Logan is actually the server

On R3 **our P1 is Logan**, not Harry. Logan starts outside the endline at about **(+3.30, 9.45)**, delivers his naturally powerful but potentially inconsistent serve, and returns to a **compact right-back** lane. If the opponent sends back a quick overpass or first-/second-touch ball, Logan cannot magically be deep-right ready and close to the net simultaneously. The nearest front player covers the early short ball; Harry stays responsible for whatever left-shallow ball is physically reachable and available to set only after someone else digs.

**Harry starts legally P5 back-left**, not deep in a corner or hiding near the front. **Georgia P6** controls the middle/back. **Caleb P4** can move back to defend even though still an officially front-row attacker. **Jaz P3** occupies a reachable central-short role, and **Trent P2** sees the opponent's setter and picks a feasible single block. The formation is not simply a mirror of THEY SERVE, because the first incoming team touch after our serve is a **defensive dig**, and Logan's entry consumes real time.

### 4.2 First opponent attack, dig, set and attack

At the example first defence-ready time, **Trent** occupies the appropriate left or right single block, **Caleb** handles left/deeper floor, **Jaz** short-centre/tips, **Harry** short-left, **Georgia** deeper middle/left, and **Logan** the right back/line once he has recovered.

The **normal** sample has **Georgia** digging the driven return near (-1.08, 6.90) or (-0.72, 6.90). **Harry** goes from his reached back-left defender position into a nearby centre-left second set. **Caleb** attacks left in the depicted possession, with Trent genuinely available as right alternative. Teammates cover short/deep rebounding and do not stand as spectators.

The **Harry-first** variation is a driven/tipped ball that actually lands within Harry's reachable shallow-left space near (-0.98, 4.35). Harry makes the first dig and **cannot** take the second. Georgia moves into the setter position for a high ball; Caleb backs up only if Georgia cannot reach. Trent remains a real right-side attacker, not the default setter.

### 4.3 Second attack and later contacts

After Caleb's sample hit, everyone moves toward useful opponent-attack defence **from the previous positions**. Trent reads another left or right set; he can single-block the side in reach, and the other five have clear floor jobs. Harry remains short-left rather than returning to his P5 legal start; Georgia fills middle/deeper lanes, Logan stays narrow right and Jaz owns short centre.

The next illustrated ball is **Caleb's dig**, not a mechanical repetition of Georgia's first dig. Caleb moves deep-left into the ball, while Harry makes the next actual set. This reflects the owner's insistence that a rally can have distinct first and second digs and that the second recovery must be thought through instead of repeating the first positions.

## 5. Complete six-player role coverage, every phase

The imported strategy JSON explicitly assigns **six coaching actions at every authored source event** (including ball/track boundaries, not only the five labelled phases). The actions are picked from `Ready / Serve / Receive-Dig / Set / Attack / Block / Cover / Recover`. At the ball-contact events, the appropriate actual toucher receives the matching role. The action field does not magically turn a player into the ball owner; **the new contact-owner fields explicitly change the actual ball and player pose where needed**.

| Player | At our attack | When opponents attack | After next dig |
|---|---|---|---|
| Harry | Short rebound cover after set, or left-short if he dug | Back-row left short/tip; ready to set | **Sets next** after Caleb dig |
| Caleb | **Left sample hitter** | Larger left/deep real floor; emergency block only if closer than Trent | **Actual sample next dig**, then safe recovery |
| Trent | Right-side alternative and rebound cover | **Single block** left/right when reachable | Recovers, prepares right attack; **not default setter** |
| Jaz | Short-centre rebound/soft ball | Short-centre tips, no conventional block | Holds shallow centre responsibility |
| Georgia | Deep centre/recovery, or just finishing emergency set | Deep middle/cross and backup seam | Deep middle cover, emergency setter if Harry is first |
| Logan | Deep-right attack return insurance | Compact right deep/line, **no block** | Protects right boundary |

The player-focused Now/Next/If coaching notes in Court Mode describe the same responsibilities for **both serve owners**.

## 6. Explicitly rejected alternatives and unresolved live-play choices

- **Rejected:** Reusing the V3 example's Trent-as-next-setter simply because its default ball path said so. **Actual sample next setter is now Harry**, and the published strategy changes ball ownership/pose accordingly.
- **Rejected:** Making back-row Logan or Harry block. Neither may block in R3 under normal volleyball eligibility.
- **Rejected:** A front-middle Jaz blocking plan. She can defend and later hit a safe high ball but currently cannot form a meaningful net block.
- **Rejected:** A rigid 6–1 “set from the same right antenna every time” if it forces Harry to run round Jaz/Trent. The setting area is centre-left enough to be reached by a back-left player; actual ball location still governs.
- **Rejected:** Assigning every deep ball to Logan/Georgia just to keep Caleb in a static front-right hitter pose. Caleb can defend behind the attack line while remaining officially front-row eligible.
- **Rejected:** Having the first and next digs automatically assigned to Georgia and the later set to Trent simply because the original R3 demonstration did.
- **Open for on-court revision:** Whether Trent consistently reaches fast **far-left** sets; whether the standard defence should instead have Caleb blocking left in some enemy styles; whether Harry's P5 starting point gives enough short-left receive help without becoming the first receiver too often; whether Georgia can arrive as emergency setter after Harry's short first ball in a poor/low pass. The animation models a workable high-ball scenario, not every unpredictable ball.
- **Current app branch limit:** The selector only offers **opponent OUR LEFT or RIGHT** and **normal/Georgia first or Harry first**. The specific middle, quick-return, Logan-targeted, seam-caller, zero-block and backup-Caleb-set cases remain **honest coaching decisions** rather than fictional selectable source alternatives.

## 7. Verification and preservation

The strategy is a **sparse, distinct team preset**. It uses the underlying published source's timestamps but precisely updates R3 court positions/actions and explicitly replaces incorrect second/later contact owners through a bounded V2 strategy extension. R1's original eight case override objects and coaching-note fields are **untouched** by this R3 authoring. Your original R1 source JSON in the separate Volleyball repo also remains unchanged.

Before publication, verify: eight R3 cases all apply; six actions per actual source event; the ball endpoint aligns with Georgia/Harry/Caleb/Harry as appropriate; P1 Logan stays outside the baseline through OUR SERVE contact; no R3 back-row block; conservative service order; and six-player timed movement. These software checks do not establish actual competition approval.

**Next step:** Owner reviews **R3 THEY SERVE and WE SERVE** in the same Court Mode strategy, with opponent left/right and normal/Harry-first cases. After that, follow the owner's latest order: **R2**, then **R4–R6 together**. Any changed R3 positions or rules should update both this rationale and the same selectable strategy rather than silently editing the historical R1 source.
