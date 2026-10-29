# S07A: Event-specific editing

30 October 2026. Implementation checkpoint; not final V5 UAT, publication or tactical approval.

Implemented expandable navigation of authored rally events, including distinct R1 Us serve first dig (5.40 s) and next dig (12.29 s), with independent player anchors, route bends, coverage responsibilities, shared versus exact-case inheritance, reset and undo. The source contacts, actors, timing and original Set arcs remain unchanged.

Verification: 141/141 complete unit tests and Pages-base build passed. Independent Thorium Windows test passed seven targeted browser checks: rendering a 3D court, listing 16 source events, selecting both separate R1 digs, displaying the editor at 390 px without horizontal overflow, and zero page errors. Visual screenshots: desktop-events.png and phone-events.png. Receipt: independent-browser.json. Protected original file hashes: protected-sources.json.

Remaining for later independent full UAT: physical-phone gestures, all case combinations, detailed drag and save/reload browser journeys and overall combined motion/UX. Codex's original browser test timed out; it is not counted as a pass. Original user V4 drafts and public V4 remain untouched.

Next: S07B continuous stage and event playback, Edit preview controls, quick camera/overlay toggles; then S07C authored-case Shuffle Play.
