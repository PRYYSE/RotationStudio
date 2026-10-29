# Core V4 implementation plan and verification

Spec: `STRATEGY_STUDIO_V4_BRIEF.md`, CORE plus requested functional visual corrections.
Work in the existing `feature/strategy-studio-v4` checkout. No commits/pushes.
Published movement JSON, `author_tactics_v2.py`, Set arcs and existing validators stay unchanged.
The six identity colours in published `team.json` are the only source-data change.

1. Pure strategy format and overlay: strict bounded sparse JSON, semantic event mapping,
   all four variants per serve, immutable source, linked ball contacts, legal service hold.
   Test all rotations/serves/variants, changed event times, hostile imports and continuity.
2. Local library and editor state: independent identities, preview imports/shared links,
   explicit save-copy, autosave failure reporting, resets and per-gesture undo/redo.
   Test persistence/reload, round trips, isolation, drag transactions and invalid edits.
3. Court integration: five stages, top view, player/target/bend dragging, exact X/Z,
   ready options at Set and review warnings; retain full View playback and advanced tools.
   Test with real browser pointer interaction at desktop and narrow viewport.
4. Run original and new tests, production build, inspect source diff/protected paths,
   document results and limits for Normal Chat's product/tactical acceptance.

Review focus: Start edits drive actual playback, holding through service contact
with original legality diagnostics; alternate setter roles must not be silently replaced; later ball
contacts must stay linked; interrupted gestures must roll back; storage/import errors
must preserve prior saves. New code files remain under 500 lines.
All edited foundations require tactical review.

## Progress

- Approved brief read in full; required feature branch confirmed. Existing untracked
  `.cache/` and `.cache-install.ps1` belong to the user's environment and are left alone.

## Functional correction handoff (2026-10-29)

- Viewer main buttons and five shortcuts share semantic landmark times. Receive is
  firstContact, Attack is Our attack, and Defend is the first Defence ready (before
  our dig on our serve). Pressed state identifies the event, not a transition phase.
  Full original phases, ball timing, tracks, scrubbing and speed controls remain in View.
- Small, single-line `Name · Pn` feet tags replace two-line cards and leader lines.
  Colours come directly from canonical team data for jerseys, rings, tags, routes,
  and coverage. The existing generator reads and preserves team.json colours; no
  second generator palette or tactical regeneration was needed.
- Removed the floating target text; retained gold floor crosshair, target dragging,
  and first/second contact links.
- Coverage samples actual athlete tracks at the current time in View and Edit,
  including Start. Opponent-serve receive proportions stay authored; other stages
  use relative skill/role sizes for blocks, short tips, deep lanes and hit coverage.
  Faint fills/borders show responsibility only, with no probability or reach claim.
- Edit has a compact strategy selector/status/save, one five-stage selector, and
  player/route/history controls. The full library is in Strategies only. Video
  controls collapse while editing. Desktop court gets the remaining wide space;
  phone court and scrollable editing sheet have separate rows.
- Fixed both blocked core defects: Start now changes actual held playback coordinates
  (including the P1 serve origin); illegal edits stay visible with unchanged validator
  warnings. New baseline copies have no overrides and retain identical V3 geometry.
  `Prepare all hitters` at Set is an explicit, undoable assist and retains explicit
  user placements. Existing saved drafts with readyOptions keep that explicit data;
  Reset stage removes it.

Verification: `npm test` passed 73/73 (60 original V3 + 13 V4/coverage/store tests).
`npm run build` passed; Vite reports its existing large-chunk advisory.
Node tests cover all 48 authored variants, both serve orders R1-R6, exact event mapping,
live coverage positions, receive proportions, role sizes, six colours, baseline identity,
Start legality/holds/server contact, contact links, continuity, persistence and gestures.
The browser acceptance script has added DOM tag/target absence checks, desktop first-fold
control bounds, separate library mode, legal Start playback and phone sheet bounds.
`node --check tests/strategyStudio.browser.mjs` passed. Chrome was not run for this
correction pass; actual desktop/phone appearance, DOM checks and pointer acceptance
remain for Normal Chat. No commit, push or publication performed.

## Deferred visual roadmap

Keep current avatars and animation polish for now. A later pass can add run-up footwork,
anticipation/stutter steps, locomotion blends, jump/spike/block motion, serve approach
and contact, setting hands, richer first/second/hit contact and trajectory feedback,
natural facing, hitter-selection cues and ball-dependent opponent defence. Preserve
the existing role/contact semantics so animation can evolve independently of strategy
coordinates. None of this full art/animation work is implemented in this pass.
