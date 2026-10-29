# Core V4 implementation plan and verification

Spec: `STRATEGY_STUDIO_V4_BRIEF.md`, with the user's narrower CORE scope.
Work in the existing `feature/strategy-studio-v4` checkout. No commits/pushes.
Published JSON, `author_tactics_v2.py`, Set arcs and existing validators stay unchanged.

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

Review focus: Start is an editable formation preview, while service-contact playback
retains V3 legality; alternate setter roles must not be silently replaced; later ball
contacts must stay linked; interrupted gestures must roll back; storage/import errors
must preserve prior saves. New code files remain under 500 lines. No visual colour,
coverage or label pass in this slice. All edited foundations require tactical review.

## Progress

- Approved brief read in full; required feature branch confirmed. Existing untracked
  `.cache/` and `.cache-install.ps1` belong to the user's environment and are left alone.
