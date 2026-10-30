# RotationStudio 1.0.0 | First full software release

**Released:** 30 October 2026 (Australia/Adelaide).
**Public site:** https://pryyse.github.io/RotationStudio/
**GitHub release tag:** v1.0.0 (points to the release commit on `main`).

## What's in 1.0

- Complete interactive 3D volleyball rotation viewer for R1–R6, either serve owner, and all 48 authored direction/first-contact cases.
- Animated source-timed rally events, View playback, exact Jump, camera presets, overlays, player-focus notes and first-ball examples.
- Strategy editing with per-rotation and case-specific anchors/routes, setter-target positions, coverage zones, two distinct defensive event occurrences, coaching notes, Undo/Redo and guarded resets.
- Local strategy library with non-destructive legacy migration, Save a copy, rename/duplicate/delete, JSON import/export, preview-only share links, printable team references and Review packets.
- Source-truthful seeded Shuffle and preserved Set arcs from upstream SetOptics.
- Responsive desktop, portrait phone, tablet and landscape layout, with source-derived mobile role summary and expanded short-landscape editing room.

## Software release and tactical review

RotationStudio 1.0.0 is the **first full product release**, not an early-access, preview or demo version. Future releases can focus on smaller bug fixes, usability refinement and additional features.

The bundled TTGVA C Grade tactical formations are a **coaching DRAFT**. Tests confirm software behaviour, data integrity and authored source selection; they do not establish live match-foot overlap legality, athlete capacity, strategic merit or coach sign-off. Keeping `DRAFT` in tactical plans is deliberate and separate from the application's release version.

**Local data:** strategies are stored by browser/profile and origin, not synced through a cloud service. Legacy V1/V2 library migration is non-destructive; users should export important strategy JSON for independent backup. Existing personal R1/R2 V4 browser saves must not be cleared.

## Acceptance and provenance

- Independent pre-release software UAT: 153/153 unit tests PASS; successful GitHub Pages-base production build.
- 48/48 rotation/case combinations and 9/9 First Ball selections checked through a real Thorium 3D browser.
- Actual edit/Undo/Redo, coverage, distinct R1 own-serve first/later dig, case isolation and save/reload tested.
- Strategy library V1/V2 migration, export/import, share-preview/Save copy, Review packet and print/reference end-to-end checked.
- Shuffle, keyboard/phase interaction, camera and responsive phone/short landscape checked; original Set arcs preserved.

[Full independent V5 UAT evidence](V5_UAT_REPORT.md) · [Machine-readable results and screenshots](v5-uat-evidence/)

## Public deployment verification

The deployment run, published commit, actual asset fingerprint and independent live-browser checks are recorded separately in [public 1.0.0 release verification](../../docs/RELEASE_1_0_LIVE.md). This separates the product's release notes from the deployment evidence.
