# RotationStudio — Courtline desktop rework

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
