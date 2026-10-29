# V5 independent live-product review evidence

**29 October 2026, Windows Chrome, real public https://pryyse.github.io/RotationStudio/**

This directory contains the direct browser capture for the **V5 product planning audit**, not a newly built V5. All images below are live V4 scenes. No V5 application code was modified. The underlying detailed JSON documents include stage, viewport, labels, rendered element rectangles and browser exception list.

## Browser captures and product relevance

| Screenshot | Real state | Review observation |
| --- | --- | --- |
| v5-review-desktop-start.png | 1440x900, R1, they serve, legal Start | Court too small within abundant unused space for a teammate to read all six placements rapidly |
| v5-review-desktop-receive.png | R1 Receive first-contact shortcut | Event correctly seeks Caleb sample touch; useful advice is a small footer rather than selected-player responsibility |
| v5-review-desktop-settings.png | R1 expanded Settings | Modal obscures court and overlapping 3D labels can appear through/behind controls |
| v5-review-desktop-deep-left-example.png | R1 Deep Left teaching first ball | Jaz selected as sample receiver, Harry setter, Logan hitter; useful option but rationale and model status need prominence |
| v5-review-desktop-r3-us-start.png | R3 own serve Start | Baseline/legal role at service contact before later defence and setter release |
| v5-review-desktop-r3-us-defend.png | R3 own serve first Defence ready | Defensive court shape and back-row Harry; distinct from later opponent possession |
| v5-review-desktop-r3-us-attack.png | R3 own serve Attack | Trent is sample hitter, Caleb remains eligible; renderer does not explain other hitter options or rebound cover |
| v5-review-desktop-edit-start.png | 1440px initial five-stage editor | Stable wide top-down editing, but generic sidebar terminology and little impact explanation |
| v5-review-desktop-edit-set.png | Set without hitter-preparation assist | Real V3 sample formations, one chosen hitter trajectory |
| v5-review-desktop-all-hitters-prepared.png | Set after “Prepare all hitters” | All eligible front-row athletes receive ready positions, but not fully modelled alternative contacts |
| v5-review-desktop-strategies.png | Strategies mode with draft open | Court shrinks and library controls are undifferentiated; friend sharing flow is not obvious |
| v5-review-phone-view.png | 390x844 View | All functions present, but near-net tags collide and multiple top navigation ribbons reduce court prominence |
| v5-review-phone-settings.png | 390x844 Settings open | 3D name labels visually bleed into an overlapping sheet; sample controls cover tactical view |
| v5-review-phone-edit-start.png | 390x844 editor Start | Usable court and five tabs; inspector bottom sheet requires scroll to reach inputs |
| v5-review-phone-edit-set.png | 390x844 editor Set | Dense front-row tags and short court area; selected-person context below fold |
| v5-review-phone-edit-set-scrollbottom.png | Bottom scrolled inspector | User loses strategy name and current player field while reaching route/prepare/diagnostics controls |
| v5-review-phone-strategies.png | 390x844 Strategies library | Library and court divide display; primary actions require context shift/scroll |

## Structured evidence

- **v5-product-audit.json**: all 17 captured states, viewport/canvas/panel/stage metadata, selected controls and the real UI cue text. Browser result PASS for navigation/capture, JS page exceptions [].
- **v5-tactical-matrix.json**: parsed and derived from released V3 public plan files on Windows. Twelve root combinations, team initial P1..P6, first/second/sample hitter, eligible front players and **start-to-set straight-line distances**, not player speed certification. All root scenarios retain 3 alternates each.
- Screenshots are **observations**, not proof that tactics are optimal, that a phone device has been tested physically, or that all visible player positions are game approved. V4 prior release UAT is separately at visualizer/docs/V4_PUBLIC_RELEASE.md.

## Review conclusions and locked next phase

For the entire decision rationale see PRYYSE/Volleyball/docs/V5_PRODUCT_BLUEPRINT.md. Implementation details and bounded Codex tasks are at visualizer/docs/V5_IMPLEMENTATION_CONTRACT.md (planning branch). The product owner intentionally prioritises court readability, teammate focus, true branch provenance and consequential review over more cosmetic animation, while reserving a limited role-animation slice for later. All tactics remain DRAFT. STOP before V5 implementation until the user explicitly says continue.
