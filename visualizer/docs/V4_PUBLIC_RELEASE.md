# V4 public release verification — 29 October 2026

**Release gate:** PASS — public browser/software. **Team strategy:** DRAFT, not approved for match use.

## Authoritative source and deployment

- Actual V4 source already merged to `PRYYSE/RotationStudio` `main` at `270a636fa87f32d0c2953cf4ffbd28cb4da08df1`.
- [GitHub Pages workflow 40808899475](https://github.com/PRYYSE/RotationStudio/actions/runs/40808899475) completed **successfully**, with successful **build** (install, app tests, production build, artifact upload) and **deploy** jobs, both for that exact SHA.
- Public URL: https://pryyse.github.io/RotationStudio/ . Windows Chrome loaded the HTML and JavaScript asset `/RotationStudio/assets/index-C3zcOCsS.js`, same fingerprint as the local `visualizer/dist/index.html` built from V4. The HTML, JavaScript and both public plan JSONs served HTTP 200. The public plan and team JSONs report **DRAFT**. The original SetOptics Set arcs mode remains accessible.
- These facts establish a deployed V4, not merely a successful HTTP response or a local preview. No source or tactical-data repair was necessary at this release gate.

## Independent public-browser acceptance (Windows Chrome)

The actual public URL was operated using Chrome/Puppeteer from the authorised Windows machine, with browser profiles and screenshots confined to `D:\Projects\RotationStudio-V4\.cache\browser-qa`. Both runs completed successfully on 29 Oct 2026 (reports record UTC timestamps). This is **separate** from the earlier comprehensive local production/browser UAT in [V4_INDEPENDENT_UAT.md](V4_INDEPENDENT_UAT.md).

| Public check | Observed result |
| --- | --- |
| Startup, app assets and plan | HTTP 200 for page, V4 JavaScript and plans; six named player tags render; plan remains DRAFT; no obsolete floating PASS HERE label |
| Rotation and serve selection | R1–R6 × They/Us = 12 actual UI combinations; Start/Receive/Set/Attack/Defend order changes correctly for serving team |
| Keyframe shortcuts | Receive, Attack and Defend UI buttons operate across all 12 combinations = 36 interactions |
| Direct editable foundation | In live R1/They Receive, the selected athlete **Caleb** moved by X-coordinate input 0.30 → 0.44m; UI Add bend produced **Replace with one bend** route action |
| Real pointer drag | Actual live 3D athlete pointer drag moved Caleb X 0.30 → 0.85m, Z 6.20 → 6.48m; not merely modifying local JSON or a form |
| Save and reload | Named `Public deployment smoke draft` persisted the coordinate edit after real browser reload |
| Sharing | `Share strategy` reported copied link and explicitly identified preview/save-copy behaviour |
| Desktop→phone live resize | Without reloading, 1440×900 → 390×844: 390px court and WebGL canvas, 374px strategy sheet, all five stage buttons within viewport at 44px height; no horizontal overflow; mobile Z input edit 6.20 → 6.32m |
| Set arcs | Opened and rendered a canvas in the public V4 app |
| JS and assets | Zero browser page exceptions and zero failed application requests in the public smoke tests |

**Important:** The short public smoke does not redundantly prove every interaction from the full **local independent UAT**. Earlier local acceptance exercised real waypoint/target/hitter drags, full 48 tactical choices, save/duplicate/import/fragment preview/save-copy, 73/73 app tests, 12 serve-mode matrix, responsive 390/375/768/844×390 and static production preview. Both bodies of evidence are complementary. One public smoke assertion initially expected a button named `Straight`; source and screen show the actual valid label `Replace with one bend`, so the harness assertion was corrected. No app defect was reproduced by that mismatch.

## Evidence preserved in the fork

- [Public HTTP/DOM/viewport results](release-evidence/v4-public-live-report.json)
- [Public pointer-drag/share results](release-evidence/v4-public-gestures-report.json)
- [Public desktop viewer screenshot](release-evidence/v4-public-live-desktop.png)
- [Public editing screenshot](release-evidence/v4-public-live-edit.png)
- [Public desktop pointer-drag screenshot](release-evidence/v4-public-pointer.png)
- [Public 390px mobile editor screenshot](release-evidence/v4-public-live-mobile.png)

The QA scripts and remaining expanded screenshot matrix also remain on Windows D: under `.cache\browser-qa`. The screenshots are visual proof of a rendered 3D court but are not proof of tactical correctness. In particular, mobile name labels can overlap near clustered players; this is a **deferred UX/design concern**, not a software release blocker.

## Scope and explicit stop condition

- **Accepted:** V4 Strategy Studio software released for public viewing and individual local strategy drafting; all saved editor foundations are **Needs review**.
- **Still unverified:** real Android/iOS hardware, real TTGVA referee foot-overlap judgement, on-court running/setting timing, no-practice team comprehension, exact ball-dependent optimisation. These must never be represented as passed.
- **Preserved:** original SetOptics fork and Set arcs; authored V3 timeline source `visualizer/scripts/author_tactics_v2.py`; 48 V3 tactical alternatives and DRAFT status; immutable Team V3 baseline. User-owned strategies stay browser-local unless explicitly exported or shared. No account/backend/live collaboration implied.
- **Next major checkpoint:** stop after V4 release reporting. Await explicit user **continue** before starting the full history/player/team-POV V5 product review and implementation-ready specification. V5 implementation is later and separately gated.
