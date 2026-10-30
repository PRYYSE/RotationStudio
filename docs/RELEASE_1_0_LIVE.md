# RotationStudio 1.0.0 | verified public software release

**Public application:** https://pryyse.github.io/RotationStudio/
**Released:** 30 October 2026 (Australia/Adelaide).
**Software:** first full 1.0.0 release, not an early-access or partial build.
**Published source commit:** [df82a48](https://github.com/PRYYSE/RotationStudio/commit/df82a481fbb445d0caf91eb16bf2c1cc2baa302d) on main.
**Tag:** [v1.0.0](https://github.com/PRYYSE/RotationStudio/tree/v1.0.0) points to that tested source commit.
**GitHub Pages:** [successful build and deploy workflow 40988762788](https://github.com/PRYYSE/RotationStudio/actions/runs/40988762788).

## Independent real public browser verification

The published website was exercised using portable Thorium on Windows in a newly created, isolated browser profile. Existing personal V4 R1/R2 browser-local strategy data were neither read nor changed.

- PASS: Live public 1.0 HTML, exact hashed JS/CSS, and protected plan JSON — {"mainAsset":"/RotationStudio/assets/index-D1VzJF-a.js","styleAsset":"/RotationStudio/assets/index-DA3NgI2Y.css","planStatus":"DRAFT","players":6}
- PASS: Real live desktop court renders six people and 1.0 header
- PASS: Public rotations and actual right/Harry case selection — {"id":"6/they/right/harry","receiver":"harry","text":"Authored V3 · 6/they/right/harry · our right · Harry first · DRAFT"}
- PASS: New local strategy saved and restored after real public reload — {"savedId":"14fcc1ac-9b37-41a5-aabc-cc82e74c21ad"}
- PASS: Public share URL opens isolated recipient preview without writing their library
- PASS: Responsive public phone/landscape 390x844 — {"width":390,"doc":390,"canvas":390,"brand":122.234375,"modes":242.90625}
- PASS: Responsive public phone/landscape 375x812 — {"width":375,"doc":375,"canvas":375,"brand":122.234375,"modes":227.90625}
- PASS: Responsive public phone/landscape 844x390 — {"width":844,"doc":844,"canvas":544,"brand":142.34375,"modes":664.453125}
- PASS: Original Set arcs opens and returns to 3D rotations

**Zero application JavaScript page exceptions and zero failed first-party asset/plan requests** were recorded.

## Asset and source validation

The actual public HTML identifies RotationStudio 1.0. Both public JavaScript and CSS were SHA-256 compared with the accepted locally built production assets; both matched exactly. Public plan/team JSON returned HTTP 200, with six players, twelve root scenarios and tactical status DRAFT.

- /RotationStudio/assets/index-D1VzJF-a.js : 2887231b8ea296e418b5778ff61c4b99f377e093c4e569738a7afcb15d209edd (SHA-256)
- /RotationStudio/assets/index-DA3NgI2Y.css : 85842ae48c5c560bd46ad383cbd41bf6897823b3312c96dbbd6c5dbbde7d649e (SHA-256)

## Scope

RotationStudio 1.0.0 is the completed software release. Future changes are expected to be fixes, refinements and added features. The bundled TTGVA team tactics remain coaching DRAFT pending real-player, foot-overlap and match strategy approval. This label is not a software pre-release status.

Source SetOptics and Set arcs are preserved. There is no account or automatic sync; browser-local saved strategies should be exported before clearing site data. Personal R1/R2 tactics will be examined only in the separately authorised post-release work tracked in [Volleyball issue #1](https://github.com/PRYYSE/Volleyball/issues/1).

## Evidence

[Public browser report](release-evidence-1.0/report.json) | [Desktop](release-evidence-1.0/public-desktop.png) | [Phone 390px](release-evidence-1.0/public-390x844.png) | [Landscape 844px](release-evidence-1.0/public-844x390.png) | [Original Set arcs](release-evidence-1.0/public-set-arcs.png).

The old V4 source commit a8b6698 remains available in Git history as a recovery point. No rollback was required.
