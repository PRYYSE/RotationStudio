# Court Mode implementation plan — 2026-11-10

Goal: publish a permanent coaching workspace alongside unchanged Full Studio and Set arcs, using the existing renderer and source clock. Owner supplied the full specification and waived design/release gates and exhaustive testing.

Design: navy #101b23 canvas, #182b35 surfaces, #73ded0 selected actions, #edf5f7 text, #a8bbc6 supporting text. Existing system sans typography. A court fills the space between a slim selection header and exact-event playback dock. Camera/tools sit in a quiet edge rail; optional sheets hold context. Fullscreen retains only exit/reset and playback. The court, rather than decorative cards, is the defining visual.

1. Add a persistent workspace preference, conservative platform default and URL/history handling. Keep shared stores mounted, disable tactical editing in Court Mode, preserve local strategies.
2. Add bounded same-origin SHA-256-verified manifest/review loading, isolated rotation/serve packets and explicit failures. Preserve source and local drafts separately. Document publication contract without authoring tactics.
3. Build ground-plane pointer navigation and annotation overlay: simultaneous pan/pinch, orbit, useful presets/reset, stable camera, local exact-source/moment persistence, tools and import/export.
4. Build Court Mode shell, exact event playback, loop, player guidance, layers, fullscreen/fallback, notes and sharing.
5. Run existing tests plus focused model/storage/review tests and production build; one rendered smoke across portrait/landscape and larger touch input, then publish main and check Pages/live court.

Review focus: storage errors and invalid imports must preserve notes; review failures never show baseline as review; source revision isolates annotations; touch laptop defaults do not depend on viewport/pointer; switching retains selection/time and cannot edit tactics. Physical pen/fold hardware remains unverified if unavailable.

Checkpoint: 57678a4 (original clean main). Work on a feature branch in the clean local clone; no reset/clean or browser profile writes. No extra worktree/setup project.
