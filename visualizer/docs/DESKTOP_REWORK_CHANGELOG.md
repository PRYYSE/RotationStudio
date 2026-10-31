# RotationStudio — Courtline desktop rework

## G1.2 — Non-overlapping desktop athlete tags (31 October 2026)

**Observed:** Real 1440×900 desktop View still stacked player identity tags on top of each other near the net despite the earlier small under-foot styling. This directly conflicts with the requirement for legible player/P identities during tactical study.

**Implemented:** Desktop-only lightweight screen-position collision placement, considering the selected athlete and first/second contact player first. Try full names close to projected feet; in crowded spots use a **three-letter player identifier plus P number**, then only nearby alternate positions; preserve the actual player colour and source geometry. Avoid all six large floating cards/leader lines. The original mobile `layoutLabels` algorithm and mobile identity style were not changed.

**Real browser checks:** six visible labels, zero tag intersections on **R1 at 1440×900**, **R3 at 1440×900**, and **R3 at 3440×1440**, mobile still renders all six and no page errors. Independent [1440 screenshot](desktop-evidence/g1-label-r1-1440.jpg), [QA receipt](desktop-evidence/g1-label-receipt.json). **161/161 tests PASS** and Pages-base build PASS; this is a focused visible readability fix, not coach approval of placement or team tactics.

---

## G1.1 — Coach View clarity (31 October 2026)

**User intent:** normal desktop **View** should tell an actual teammate what to do, not lead with technical coordinates, raw source case IDs, or empty coaching fallbacks. Preserve detailed precision for people who deliberately expand it. This is a **bounded desktop-only** usability improvement; it is not a claim that the full player instructions or team tactics are complete.

- **Now · Your responsibility** visually dominates the selected-player panel; **Coming up** identifies the next actual authored rally event, not an invented contact or athletic instruction.
- Normal desktop Player Focus shows P-number/front-back/role without raw X/Z; precise coordinates, source details and incomplete fallback alerts remain in **Tactical details & full roster**. A real authored conditional fallback remains visible when it exists.
- Desktop practice variant text is human-readable, e.g. attack toward our left / first touch Caleb, instead of exposing a case key. The old diagnostic data remains in source and DOM case attributes. Do not silently change phone layout or data.
- **Validation:** 161/161 unit tests and production Pages-base build PASS. Fresh isolated Thorium against the real local Vite server: 7/7 focused browser checks PASS covering Now hierarchy, coordinates only in details, human scenario text, desktop overflow, untouched mobile Player Focus/practice text and mobile overflow. [Desktop screenshot](desktop-evidence/g1-view-1440.jpg), [browser receipt](desktop-evidence/g1-focus-receipt.json). No modification of personal saved strategies, source Team V3 or original Set arcs.

**Open:** more substantial initial-user readability, full tactic specificity, case/branch teaching notes and plan-management UX remain part of [G1](https://github.com/PRYYSE/Volleyball/issues/3), [G3](https://github.com/PRYYSE/Volleyball/issues/5) and [G4](https://github.com/PRYYSE/Volleyball/issues/6); do not replace them with this small patch.

---

## Slice D — Simple stage-first placement and automatic movement (30 October 2026)

**User-requested course correction:** Restore the easy V4 authoring model. Author selects Start, Receive/Dig, Set, Attack, Defend/Recover, Block/Defend or Next Dig as appropriate; selects a player and drags them to their position. The underlying track connects the player to other authored positions and displays their path. Route editing is **optional** for a selected incoming/outgoing interval: Add bend, drag/remove bend, straighten. Do not expose a mandatory timeline or force manual path drawing. "More moments" expands the full authoritative source event list for later/alternate contacts without burying normal stage navigation in 16 technical events.

**Implemented in desktop only:** Human quick-stage strip with exact mappings for both Us-serve and They-serve source labels (including their First pass → Receive/Dig, their attack → Block/Defend, Next set), instant jump on stage selection, fully accessible extra-events disclosure, a readable More moments button (corrected 48px clipping), concise placement/path guidance, Arriving/Leaving route names, and compact under-foot name/P-number tags without concatenated action text. Action remains visible in the selected-athlete inspector. Mobile View is not redesigned.

**Evidence:** Normal Windows real Thorium regression **10/10 PASS**: instant Start→Receive, required quick stages on each serve, optional source events, independent first/next dig edits, Georgia route bend, Jaz coverage, case-isolated saved/reloaded strategy, Play/Pause, 1440 and 3440 desktop with unchanged phone breakpoint, no page errors or horizontal overflow. Separate real-mouse drag moved Jaz **0.93m at Start** while Receive/Dig retained separate placement; the source movement route is derived from the saved positions. **161/161 unit tests PASS** and Pages-base production build PASS; pre-existing nonblocking large-bundle advisory. Actual published Pages status to be confirmed through the release workflow.

This is a focused product improvement, not proof the complete editor has perfect UI or all plausible volleyball contacts/alternate ball trajectories. Preserve legacy V1/V2 saves, original SetOptics/Set arcs, V3 DRAFT team source, all 48 authored cases and user browser-local R1/R2 drafts.

---

## Slice C — Direct editing-tool layout (30 October 2026)

**Status: locally verified; public release state is tracked in the canonical project checkpoint.** Independent 1440x900 desktop screenshot critique found that Action and Coverage were buried far below Position and Movement in the right inspector. This was a discoverability defect, despite correct storage logic.

- Replaced the vertically stacked four-tool interface with a clear **Place | Route | Action | Zone** button switcher directly under the selected athlete, current moment and one-case scope. Exactly one focused editing panel is displayed at once; all four choices remain visible within a 1440x900 desktop viewport.
- Player heading shows the **current teaching action** and selected coverage zone regardless of which tool is active. Undo/Redo and saved/unsaved indication remain visible while changing tools. Strong contrasting amber selected state and keyboard-visible focus.
- Existing athlete position dragging, complete event-to-event routes, teaching actions, coverage and save behaviour are preserved, with no change to mobile View layout.
- TypeScript/Pages-base build PASS; the independent isolated Thorium end-to-end player workflow 8/8 PASS after real tab switching, including Save/reload, Play/Pause and desktop/ultrawide/phone overflow checks. Images: [1440 with tools](desktop-evidence/slice-c-1440-tool-switcher.png), [3440](desktop-evidence/slice-c-3440-ultrawide.png), [QA receipt](desktop-evidence/slice-c-browser-receipt.json).
- A separate real Thorium broad View matrix also PASS: **48/48 authored R1–R6 rotation/serve/attack-side/first-toucher cases**, nine First Ball cells, phase motion and exact Jump, Top/Front/Side/Orbit, seven visibility toggles, five viewports (1440, 390, 375, 768, landscape 844) with zero horizontal overflow. [Machine-readable receipt](desktop-evidence/slice-c-48-case-matrix-receipt.json); 19 screenshots in protected Windows QA cache.
- This is a focused P1 usability remediation, not a claim of complete tactical or full-app UX sign-off.

## Slice B — Athlete editing (30 October 2026)

**Status: implementation and local acceptance PASS.** This is the second coherent desktop milestone, following the already-public Slice A. Publication through existing Pages workflow is performed after a clean Git checkpoint.

### What works
- **Position:** select any athlete, edit their position by dragging on Top view; original-position ghost, Undo/Redo and selected-case scope.
- **Movement:** visible incoming and outgoing event-to-event routes, sampled length/time, add/drag/delete route bends and straighten. Routes replay in original source timing. One simple source-event rail, with First dig and Next dig independently editable.
- **Action:** selected moment's Ready, Receive/Dig, Set, Attack, Block, Cover, Recover. Action selection drives a distinct teaching pose/label in the 3D viewer; source-touch ownership, contacts and ball flights remain immutable. Unauthorised back-row blocking or action/contact mismatches show warnings.
- **Coverage:** independent player responsibility and purpose, direct area handles and optional advanced dimensions; selected case is default and shared foundation requires deliberate confirmation.
- **Persistence:** strictly validated, backwards-compatible V2 optional coaching extension, saved and reloaded locally, with guarded import/share. Unedited old V2 drafts remain byte-identical on read; old bends and source stages are not reinterpreted when only action changes.
- **Playback:** desktop Play traverses the remaining authored rally; selecting moments seeks instantly. Desktop-only UI; mobile View/transport unchanged.

### Local acceptance
- 161/161 automated unit/integration tests PASS, no skips. TypeScript and production Pages-base build PASS; non-blocking large-bundle warning only.
- Independent REAL Thorium session against current Vite code (not Codex sandbox): **8/8 browser acceptance checks PASS**. In R1 our serve, Harry Cover at first dig and Receive/Dig at next dig remained independent. Georgia movement bend, Jaz short-ball tip zone, Save->reload byte-equivalence, single-case isolation and Play/Pause were exercised through actual UI. No JS errors or horizontal overflow on desktop 1440x900, ultrawide 3440x1440 and preserved phone 390x844.
- The repository's `visualizer/tests/desktopCourtline.browser.mjs` now matches the **new desktop editor**, replacing assertions against the retired "Only this version" button and numeric primary fields; it runs with isolated Thorium using `COURTLINE_QA_URL` override when needed.
- GitHub-recoverable screenshots and receipt: [1440 desktop](desktop-evidence/slice-b-1440-desktop.png), [3440 ultrawide](desktop-evidence/slice-b-3440-ultrawide.png), [phone unchanged](desktop-evidence/slice-b-390-mobile-preserved.png), [browser acceptance receipt](desktop-evidence/slice-b-browser-receipt.json). These are focused acceptance evidence, **not** final visual design sign-off.

### Open limitations and remaining product work
- **Optional arbitrary extra movement stop deferred:** source event identity and fractional-time coverage handling need a coherent implementation; no non-working control is displayed. Per-event position/route-bend editing already works.
- **Addressed in Slice C:** Action and Coverage were buried in a scrolling form at 1440×900; the new direct four-tool switcher makes them available in one click. Additional large-part visual/tactical review must still distinguish good UX from merely passing tests.
- Larger independent desktop UX review remains to do: varied case/athlete user journeys, full visual composition/camera at different sizes, tactics interpreted as coach instead of programmer, and fixes. Mobile View redesign intentionally deferred separately.
- Real TTGVA referee-foot and tactical playbook approval are **not** established by browser tests; all base team tactics remain DRAFT.

## Slice A — Desktop foundation (30 October 2026)

**Published and publicly verified** on [RotationStudio Pages](https://pryyse.github.io/RotationStudio/) at app main commit [4192ab7](https://github.com/PRYYSE/RotationStudio/commit/4192ab77cca92ba6a75dc158d802dd5d95de8293); first Pages build/deploy completed successfully.

- New desktop Courtline art-direction foundation: graphite panels, teal court, amber selection, better typography, court-first composition, focused inspector.
- Adaptive inspector ~389/518/520px at 1440/1920/3440, resizable with keyboard, compact under-foot player labels.
- Single visible chronological source-event rail in desktop Edit, separate first/next dig, instant event selection and direct Top/Orbit/Front/Side/Fit.
- 154/154 regression tests and Pages-base build passed, independent real Thorium layout at 1440, 1920, 3440 and 390 confirmed no horizontal overflow.
- Public HTML/JS/CSS asset hashes matched local production build; untouched original public plans both served HTTP 200.

## Invariants across both milestones
- Authentic PRYYSE/RotationStudio SetOptics fork, original Set arcs and source V3 JSON, all 48 cases, original contacts, DRAFT provenance, local-storage user R1/R2 drafts, import/migration and browser saves preserved.
- No destructive clearing/migration of browser data. Original user browser profile never used by automated QA, only isolated profiles.
- Incremental tested publishing allowed. Final comprehensive UX/visual review happens near major integration finish, not after every minor commit.
