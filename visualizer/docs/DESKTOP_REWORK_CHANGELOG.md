# RotationStudio — Courtline desktop rework
## Slice A — Desktop foundation (30 October 2026)

**Status: implemented and locally verified.** User explicitly authorises **incremental public publication** of coherent desktop work, rather than protecting the previously shipped 1.0 interface. This milestone will be published after the guarded release check. No mobile visual redesign.

### Changes
- Substantially new **Courtline** desktop visual system: graphite panels, bright teal playing court, amber selection, clearer typography and less visual noise.
- Responsive and keyboard-resizable desktop inspector (~389px at 1440; 518px at 1920; 520px at 3440). Primary player/action context is visible; low-level source details are under disclosures.
- New chronology of all existing source events along the bottom of desktop Edit; separate first and later digs, one stage rail, instant editor navigation.
- Manual desktop phase, event, previous and next controls **do not animate**; only explicit Play starts time transition. The selected event is reflected in edit state, not just the 3D position.
- Larger, more readable court framing and quick Top/Orbit/Front/Side/Fit tools; compact player name/P-number labels under avatars.
- Focused test for first vs later dig event edit isolation, plus independent live local Thorium viewport evidence. Phone UI retains prior geometry.

### Local verification
- 154/154 tests PASS. Production Pages-base build PASS. Existing nonblocking large-bundle advisory.
- **Independent normal-desktop browser run:** `D:\Projects\RotationStudio-V4\.cache\desktop-rework-qa\report.json` and screenshots for desktop 1440x900, 1920x1080, 3440x1440 and phone 390x844. All four browser captures completed; no page errors or horizontal overflow.
- Desktop inspector measured 389/518/520px at those widths; event rail visible and only one editor stage navigation set. Mobile 390x844 reported old 12px inspector, old event panel and old 338-equivalent layout.
- Codex's separate sandbox browser attempt could not start isolated Thorium in time. It is not used as evidence of product failure: independent normal Windows Thorium rendered the actual feature-branch Vite server (port 5221) successfully. More complete UI/task UAT remains for the major integrated rework.

### Still to build (Slice B)
- User-friendly **player Action selection** (ready/receive/dig/set/attack/block/cover/recover), with correctly reflected role/pose and protected source ball ownership.
- Whole incoming/outgoing route editing, optional simple intermediate movement stop, useful event-based positioning, coverage responsibility clarity, local save and case-scope safety.
- Final broad polish and genuinely independent desktop user-task tests after major parts; never equate test passes with finished usability.

### Protected
Original SetOptics and Set arcs; source V3 JSON, first/next contacts, all 48 authored cases; browser-local personal R1/R2 drafts and V1/V2 migration. Tactics remain DRAFT. Desktop changes do not redesign mobile View.
