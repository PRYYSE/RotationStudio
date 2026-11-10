# PRYYSE Team Strategy — R1, both serve owners — v1 coaching review

**Status: PROPOSED / FOR OWNER REVIEW, NOT MATCH-APPROVED.** Created 10 November 2026.
**Linked live preset:** `PRYYSE Team · R1 both serve states` inside RotationStudio Court Mode > Strategy.
**Exact editable proposal source:** `visualizer/public/strategies/pryyse-team-tactics-2026-v1.json`. This is a sparse strategy over the existing published V3 data, not a replacement for original player-edited source.
**Protected owner source:** `PRYYSE/Volleyball/docs/rotations/sources/R1_THEIR_SERVE_OWNER_AUTHORED_2026-11-09.json`. Keep it byte-for-byte unchanged.
**Evidence base:** Owner's R1 receive build and subsequent explicit instructions, six-player skills from Volleyball team context, the unapproved R1 tactical plan, source scenario contacts/timings, and current app constraints. No coach/referee approval is implied.

## How to review quickly

From the live Court Mode, select **PRYYSE Team · R1 both serve states**, select **R1**, then **They serve** or **We serve**. Under Authored case, compare **Attack at our left** against **Attack at our right** and **Normal first contact** against **Harry first**. Play the whole timeline, especially *Defend / Next dig / Next set*. The R1 strategy is selectable but **R2–R6 remain the existing unreviewed V3 examples** and are not yet authored in this preset. The strategy selector intentionally prevents using those rotations as if they were finished.

The current app/source format only names **left or right opponent attacks** and **normal or Harry-first**. A middle double block, actual first touches by Jaz/Georgia/Logan/Trent, emergency very-early returns and changing opponent directions on *subsequent* returns are written as coaching requirements below; they are **not falsely depicted as additional selectable animated cases**. A later data-model expansion can illustrate those precisely without inventing volleyball events.

## The six and why they are here

| Player | R1 official position | Particular responsibility | Limit/avoid |
|---|---|---|---|
| **Harry** | **P1 back** | Dedicated setter, forward sheltered receive start, short tip after our hit, genuine emergency first contact | He **cannot block** in R1; cannot receive first and then set second; cannot start near the net on **our** serve because he is serving |
| **Georgia** | **P2 front right** | Shallow right coverage, right-side attack when Harry sets, **emergency setter** when Harry has first contact | Avoid sending Harry around her; don't demand right tip, second contact and instant right hit simultaneously |
| **Logan** | **P3 front middle** | Primary left hitter, left/middle double block alongside Trent; **short cut defender** when attack comes right | Strong attacker but weak receiver; do not assign ordinary large receive lane or simultaneous block and cut dig |
| **Trent** | **P4 front left** | Short-left receiving help, transition toward middle hit, principal blocker; conditional right single block | Heavy/less laterally fast, so a fast right set may beat his close |
| **Jaz** | **P5 back left** | Smaller controlled deep-left/line receive and dig, left deeper attack coverage | Slow across distance; no broad centre/deep-right chase or short tip several metres ahead |
| **Caleb** | **P6 back middle** | Best digger/pass receiver, major deep-middle/right responsibility and centre seams | Not every ball is automatically his; do not require immediate net set after a deep dig |

**Net-facing coordinate convention:** x=-4.5 left to +4.5 right; z=0 at our net, z=9 on our baseline; z>9 is the outside serving area. The example does not certify literal foot-overlap or match speed, but the virtual service-hit centre-point order is screened under TTGVA's requirement for **both teams** to hold rotation order.

## A. R1: THEY SERVE (owner-authored opening preserved)

### A1. Starting feet and serve ownership

| Player | Proposed start (x,z) metres | Reason |
|---|---|---|
| Trent | (-2.04, 2.33) | P4 short left, later move toward middle block and attack |
| Logan | (-0.98, 3.15) | P3 legally between Trent and Georgia and available for short centre/left |
| Georgia | (+3.08, 3.91) | P2 short right, genuine right-side attacker, clear Harry setting corridor |
| Jaz | (-2.52, 6.24) | P5 manageable deep left |
| Caleb | (+1.62, 6.82) | P6 deeper central/right, strong passer sees seams |
| **Harry** | **(+2.23, 4.73)** | P1 behind Georgia, intentionally closer to setting without being a routine passer |

**These six start anchors match the owner-authored R1 data, exactly.** They are held through the opponent's service contact. Harry is a **back-row** setter despite his shallow physical location. Harry is responsible for very short/net-roll danger if that is the only safe first contact, but Georgia/Logan/Trent and the stronger deep receivers should take their normal serve lanes.

### A2. First pass, setter release, attack

The **normal animated sample** follows Caleb's first contact. His transition at 2.75 s is inherited from the owner's specific original R1 build, and the ball contact is linked to the actual displayed player. It does **not** establish that Caleb receives all serves. **Who calls:** Caleb owns deep central/right and the central Caleb–Jaz seam; Jaz takes a clearly left/deep ball; Georgia shallow right; Trent/Logan the nearest shallow left/centre. The player already positioned square to an unexpected ball can override planned ownership with an early MINE call.

Harry travels forward after service hit via a straightforward route, **without crossing around Georgia**, toward the ball's playable second-contact location; he is not required to return to P1 between contacts. **Logan** opens the left-side approach, **Trent** the middle, **Georgia** the right. The attacker who just took first pass can be temporarily removed from the immediate hit choice if a safe approach is impossible. The illustrated hit is **Logan from left**; unused front hitters are relevant coverers, not frozen spectators. Harry covers short/central after setting, Jaz a reachable left/deeper rebound and Caleb a wider deep return.

**Harry-first alternate:** A targeted very short/net-roll serve reaches Harry. **Harry is first** at the actual sample ball and **Georgia takes second** because she is nearby; Caleb is next if Georgia is unavailable or already occupied. This is the practical R1 reachability exception to the usual backup setter skill order (Caleb then Georgia). The animation's named first and second actors follow this. Georgia is temporarily the setter, so the immediate hitter is normally Logan or Trent rather than requiring Georgia also to run to the right antenna.

### A3. Opponent's subsequent attack

After our left-side hit, **do not reset to our serve-receive positions**. The return defense starts from where the six actually finished the attack/cover. The opposing setter/attack direction controls the next shape:

| Opponent attack directed toward | Blockers | Four/five floor jobs |
|---|---|---|
| **OUR LEFT** | **Trent + Logan double** | Harry in short tip space behind; Georgia short right/line; Caleb deep centre/right and difficult seams; Jaz controlled deep left |
| **OUR MIDDLE** | **Trent + Logan double centred** | Same principle, shifted to close the real middle seam. **Not separately selectable in current app** |
| **OUR RIGHT** | **Trent single if the early read allows**; Logan **is released** | Logan short-left/cross-cut; Harry short centre/tip and future set; Georgia short right/line; Caleb deep centre/right; Jaz deep left |

For an exceptionally quick far-right attack, Trent may **not** close in time. The fallback isn't to teleport him. An already-set **Georgia emergency single block** is possible if she can genuinely get hands up; otherwise zero block with all six floor duties. This is an **owner-review decision still unresolved**; the selectable right sample illustrates the preferred timely Trent single, **not** the impossible quick version. Georgia's presently weaker blocking is an important trade-off.

**Next dig to next set:** No one is obligated to make a hard dig outside their reachable area. Harry sets again if a teammate digs. In the illustrated left/right sample, Caleb takes the next dig and Harry the next set, with Logan/Trent/Georgia opening attack options as their actual recovery permits. A tipped ball near Harry would instead require another setter. Each phase holds player ownership, not an instruction to mechanically chase a single ball.

### A4. Owner-source fidelity vs tactical refinements

The original owner JSON remains preserved unmodified. The new preset **keeps its entire opening receive lineup**, major R1 left-offence and left double-block shape. It also adds complete case-specific transitions, explicit blocking/coverage duties, a real Harry-first alternative and a distinct opponent-right defense. A few **later** intermediate positions were adjusted by decimetres for physically smoother transitions, and inherited old V3 intermediate detours were removed. Thus the new proposal is **derived from** the original R1 rather than claiming to be the original file unchanged.

## B. R1: WE SERVE (independent, fully worked sequence)

This situation is fundamentally different. **Harry P1 actually serves from (approximately +3.30,+9.45), beyond the endline**; the other five preserve the legal R1 ordering at service hit. Harry cannot already be covering a net tip.

### B1. Serve-to-defence release

At the 1.40 s illustrative service hit, Harry stays at the baseline, then enters on the **right side of Caleb** so he does not intersect Caleb's primary deep dig lane. He moves as far into useful short/central defence as the time of the opponent's return permits. The animated sample gives the opponent a conventional receive/set/attack sequence. **For a first- or second-touch quick return, Harry may still be deep:** Georgia or the nearer front eligible athlete owns short/tip danger while Caleb/Jaz take their manageable backcourt balls. Do not wait for an artificial three-touch timer.

At the sample first defence-ready time 4.18 s:

| Player | OUR LEFT opponent attack sample | OUR RIGHT opponent attack sample | Why |
|---|---|---|---|
| **Trent P4** | (-1.00, 0.62), **block** | (+1.36, 0.67), **single block if readable** | Same blocking policy as receive-side rally, but he starts from legal front-left |
| **Logan P3** | (-2.45, 0.67), **block** | (-1.75, 2.45), **floor cut** | Released blocker gives a real extra short defender on right attacks |
| **Georgia P2** | (+2.85, 3.25), right short | (+3.05, 3.40), right short | Owns quick overpass/tips while Harry recovers |
| **Jaz P5** | (-2.88, 6.55), deep left | (-2.82, 6.55), deep left | Realistic compact lane, not a sprint to short centre |
| **Caleb P6** | (+0.78, 6.60), deep centre/right | (+1.05, 6.60), deep centre/right | Strong deep digger/cross-seam, keeps route clear for Harry |
| **Harry P1** | (+1.45, 4.25), recovering | (+1.55, 4.22), recovering | Not a back-row blocker; not prematurely stationed at a fixed front set target |

The exact illustrative phase times come from the underlying scenario source and are not claims about any particular team's real speed.

### B2. Their attack, our dig, our second and third

The **normal first-dig sample** sends a driven ball to Caleb, at the actual sample endpoint. Harry proceeds from his reached position toward the **set**, not back around the serve spot; Logan left, Trent middle and Georgia right remain options if their earlier defence allows. Harry only has his second touch after someone else made the first.

The **Harry-first alternate** models a reachable opponent ball going to him during right-side recovery. He digs and **Georgia takes second**, while Logan/Trent remain the uncomplicated hitters and Caleb retains deep insurance. Do not force Harry to touch the ball twice or teleport Caleb to the net.

At our attack, the preferred clear first-choice sample is **Logan left**, with Trent's middle ball and Georgia's right controlled ball also possible when not otherwise occupied. Cover is layered: Harry just beyond the attack lane, Jaz left-middle/deeper, Caleb middle/deeper; nonhitting front athletes own short rebounds. A poor pass means a higher, simpler ball to the front player who can actually approach.

### B3. Second opponent return is a new defensive decision

At **Defend again**, keep the six where the previous attack/cover led them. During the opponent's next receive/set, read **OUR LEFT/RIGHT anew**, shift to the applicable block and restore real floor-area assignments. The sample later opponent shot again reaches Caleb deep, followed by Harry setting the next one. Neither the next defensive shape nor Harry's set route resets to the serving lineup. The actual app includes **both** dig/set cycles in the phase timeline.

**Right-side quick-set caveat** is the same as A3, with one added constraint: Trent is starting from front-left when we serve, so judging whether he can cross to a fast right hitter is particularly important. If his read is too late, explicitly call no block or the only realistic emergency alternative; never demand a last-second sprint just because the right sample shows the ideal single.

## C. Simple practice instructions for the six

- **Harry:** “Stay back-row legal. Their serve: start forward behind Georgia and set second. Our serve: serve first, run in on Caleb's right. If you touch first, call Georgia to set.”
- **Caleb:** “Own deep centre/right and tough seams. Call MINE early. You don't have to take every ball; hold the deep court while Harry gets ready to set.”
- **Jaz:** “Deep left is yours, with a small manageable lane. Call the left ball early; don't chase across everyone else's court.”
- **Georgia:** “Right short/line is yours. Stay a real right hitter when Harry sets. If Harry digs first, you take second if you're nearest.”
- **Trent:** “Think middle, read their setter, double with Logan on left/middle. On an early right set you single; if you're late, call it and cover instead.”
- **Logan:** “Be our strong left hitter. Double block with Trent for left/middle. If they go right, drop off the net and own the short/cut shot.”

## D. What is implemented vs what is still a coaching rule

| Item | Present in selectable strategy? |
|---|---|
| R1 legal start for both serve owners and distinct Harry routes | **Yes**, exact sample x/z coordinates and movement |
| They-serve normal/Caleb and exceptional Harry-first → Georgia second | **Yes**, both left and right source branches |
| We-serve first defensive dig, set/hit, recovery, next attack/dig/set | **Yes**, both serving states and left/right branches |
| Left double block, right timely Trent single with Logan released to cut | **Yes**, geometry, role action and coverage |
| Actual player pace / no old-script detours | **Reviewed** with source motion screen; no athlete movements are physics-verified |
| Middle double block as its own distinct rendered branch | **Coaching direction only**: source attack type supports only left/right |
| Jaz/Georgia/Trent/Logan first-contact animated alternatives | **Coaching rules only**: source first-touch selector supports normal/Harry |
| Very quick opponent return and right emergency block/no-block fallback | **Coaching rules only**: not separate authored timeline branches |
| Real feet under TTGVA bylaws and actual C Grade player skill realism | **Awaiting physical team/owner review**; software screen ≠ referee clearance |
| R2–R6 personalised team plans | **Not yet authored** |

## E. Change/review contract

**Requested review order now supersedes the older twelve-slice schedule:** **R1 both serve situations first**, owner quick review, **R3 both** next, **R2 both** after, then **R4–R6 together** if the owner confirms. This is an explicit latest user instruction. Approval is per rotation **both serve owners**, not approval of every unrepresented ball flight or physical match certainty.

User review should first check: (1) Harry's R1 sheltered starting point and short setting path; (2) our-serve Harry's realistic recovery; (3) Trent+Logan left block vs Trent single/Logan short cut on right; (4) Georgia's hitter/emergency setter duties; (5) Jaz/Caleb deep coverage; (6) a next dig/next set with no snap back. Record changes in the next version of this rationale and the same selectable strategy JSON.

**Source and publish:** The static preset is loaded as a **non-destructive preview** through Court Mode's real strategy picker; selecting it changes actual rendered positions through the shared strategy overlay. It does not automatically overwrite any user's local strategies or falsely mark team tactics approved. The current source data still has limitations stated above, which need targeted enhancements if later owner review requires them.
