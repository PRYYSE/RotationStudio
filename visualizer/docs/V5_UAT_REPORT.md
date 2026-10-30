# V5 independent integrated UAT | 30 October 2026 (Australia/Adelaide)

**Status: Independent V5 UAT PASS after bounded P1 mobile-layout remediation. No merge or publication.** **Release gate:** separate explicit user continue required. **DO NOT merge or publish here.** Public `main` remains released V4. All team tactics remain **DRAFT** until separate on-court acceptance.

**Baseline:** `feature/strategy-studio-v5` at `411025293527f91c7e6d1184bc3e65474777d48f` before UAT remediation. Independent Windows QA on `DESKTOP-U0GUIA9` with isolated portable Thorium 156.0.8078.28 and locally served production Pages-base build `/RotationStudio/`. All QA user data is synthetic and isolated in `D:\Projects\RotationStudio-V4\.cache\browser-qa`; no personal Chrome/Thorium profile or local R1/R2 drafts were opened, reset, or imported.

## Independent evidence and acceptance

| Gate | Observation | Evidence |
| --- | --- | --- |
| Source and branch | V5 feature branch matches GitHub at `4110252`; public main remains `a8b6698`. No protected `team.json`, `rotations.json` or tactical author-generator diffs against main. | Reconciled Windows `git`, `git ls-remote` |
| Units | **153/153 passing** initially and after the UAT layout fix, zero failures. Both independent runs completed. | `v5-uat-evidence/unit-initial.log`, `unit-final.log` |
| Pages-base build | Production `npm run build -- --base=/RotationStudio/` **PASS** initially and after the fix, with correct hashed JS/CSS output (only Vite's nonblocking >500KB chunk advisory). | `build-initial.log`, `build-final.log` |
| 48 source cases | R1–R6, both serve owners, both attack sides and normal/Harry first each selected through actual Thorium UI; source first-contact player and DRAFT label verified, exactly 48 unique cases; 12 R/serve court screenshots. | `matrix-report.json`, selected `matrix-*.png` |
| First Ball | All nine selectable grid locations exercised; authored versus teaching/invalid response distinguished. | `matrix-report.json` |
| Viewer motion/controls | Real intermediate phase frame and exact Jump to source target observed; four camera choices, seven visibility controls, responsive 1440/390/375/768/844. | `matrix-report.json`, `matrix-*.png` |
| Strategy editor | Real keyboard input (not fake DOM blur), one-gesture Undo/Redo, case-specific X coordinates, coach-assigned coverage role/width, two separately editable R1 own-serve digs (`p3:our-dig` / `p8:next-dig`), no unrelated case edits, saved JSON survives real reload; left/right case switching returns distinct values. Editor shown at 390/375/844. | `editor-report.json`, `editor-*.png` |
| Strategy library, S05 historical gap | Seven completed browser journeys: V1 migration preserving original; V2 sparse coverage/case/later round-trip + unsafe/oversized rejection; Review packet DRAFT/source/case, JSON export/reimport; share fallback, clean-profile preview then Save a copy; guarded deletion; printable five-stage reference across desktop/mobile/landscape; Set arcs with no JS errors. Prior zero-check acceptance receipt rejected. | `s05-report.json`, `reference-*.png` |
| Shuffle/Set arcs, OS motion | **PASS** on final independently rerun S07C Thorium test: seeded four authored variation sequence and replay/previous/next, Off, auto advancement, library snapshot protection, disarm on Edit/Strategies, 390/844 controls, invalid example skip notice, original Set arcs WebGL return, zero JS exceptions. | `shuffle-report.json` (when completed) |
| Visual mobile remediation | **PASS** final standalone Thorium check: source-derived quick role cue immediately visible at 390 and 375 without court overlap or page overflow; no desktop duplicate; 844x390 editor scroll region increased from ~52px to **112px**, redundant edit-only stage/footer controls removed and live Play/Camera retained. At 844x390 View, the shortened panel still requires scrolling for full coaching instructions, a residual small-screen ergonomic limitation rather than missing data. | `mobile-after-report.json`, `after-*.png` |

## Reproducible issues found independently

### UAT-01 | P1 | Mobile Player Focus instruction hidden behind Shuffle | **RESOLVED**

**Before:** Open View with `390x844`, R1 They serve. The 132px fixed scroll panel displays its header, Shuffle row and authored case disclosure, while Harry's role instruction begins below the visible panel. The user cannot immediately tell what the focused athlete should do without scrolling a small nested sheet. Confirmed by captured `matrix-before-phone-390.png`.

**Expected:** The current source-derived player responsibility should be readable on entry without hiding the court or making the user scroll first; full details remain in the scrollable Player Focus.

**Bounded remediation:** In View only at narrow widths, show a concise two-line source-derived player-and-event role cue in the sticky heading above Shuffle. Desktop composition unchanged. Retest pointer access to Shuffle, legibility and overflow with fresh 390/375 and landscape screenshots. No source-tactic or persisted strategy changes.

### UAT-02 | P1 | Landscape editor initially reduced to approximately 52px of usable editing panel | **RESOLVED**

**Before:** At `844x390`, Edit strategy, the mobile grid reserves 194px for bottom playback, leaving approximately 52px for the actual strategy editor. The user sees only the strategy selector and must scroll a tiny sliver to access positions/events/coverage. Confirmed by `editor-before-landscape-844.png`.

**Expected:** A useful editing scroll region plus direct Play/Pause and camera controls. The editor itself already has its five anchor buttons.

**Bounded remediation:** On short landscape **Edit only**, give the editor panel an additional ~60px by reducing duplicated playback chrome. Suppress only the redundant stage-marker strip and Edit-mode Share-view footer (the editor/library retains export/share); retain Play transition/Prev/Next, camera and selected source event. Keep View and Set arcs unchanged. Retest `844x390` screenshot and controls.

## Harness issues correctly separated from product defects

- A legacy S05 receipt marked passed with zero checks. Replaced by seven actual completed, independently observed checks.
- S05's original stage packet assertion assumed phase buttons instantly jumped. V5 intentionally animates; test now invokes the explicit Jump control and verifies source stage.
- S05 clipboard reading can be blocked by Thorium/browser permission. A real, visible share-link fallback was used successfully by a clean recipient profile; not an application failure.
- Matrix test initially compared an array of six DOM handles to number six. Corrected to length; subsequently 48/48 independently confirmed.
- A slow test helper looked up the Jump button by scanning many controls, so natural animation completed before it clicked and Jump advanced to the next phase. Changed to immediate direct button click; confirmed exact destination.
- Initial editor harness programmatically dispatched `blur`, which did not trigger React's real `focusout` commit. Changed to actual keyboard focus, typing and Tab; Undo and Redo correctly restored physical coordinate values.
- Initial post-reload case isolation comparison used Harry's default selection, not authored Caleb. Selected Caleb explicitly; left/right exact event coordinates visibly differ. Not an application leak.

## Protection and release boundary

- The upstream SetOptics fork and separate original Set arcs remain intact.
- Published team data, existing source tactical JSON, player roles and generator are not being reauthored during software UAT. The original V3 baseline remains immutable.
- `DRAFT` is preserved throughout UI, Review packets, exports and print.
- The independent test environment used new private browser profiles; existing V4 browser-local R1/R2 custom strategy edits were not accessed and cannot be inferred from the repository.
- Browser acceptance does not certify TTGVA referee-foot overlap, athlete movement feasibility, tactical effectiveness, physical phone GPU performance or final team approval.
- Publication requires a *later explicit user continue*, after this UAT report is final and committed. The future R1/R2 reasoning/rework is tracked separately at `PRYYSE/Volleyball#1`.

## Evidence integrity

**Outcome:** All software UAT gates above passed. The small height of the short-landscape View context remains a scrollable limitation; no release-blocking functional defect was reproduced. Additional visual/device QA and tactical approval remain separate boundaries.

The named QA scripts in `visualizer/tests/` contain real DOM/browser interaction and source assertions; the receipts record nonzero completed checks. Screenshots are real Thorium WebGL capture, not mocks. Error receipts from earlier harness iterations remain preserved locally in `.cache/browser-qa` for forensic comparison, not silently erased.
