# RotationStudio finish status

Updated 25 November 2026 (Adelaide). Canonical software plan: [FINISH_PLAN.md](FINISH_PLAN.md).

## Current checkpoint

**Reconciliation and cloud workflow setup complete. S1 is ready. No S1–S4 product changes have been made.** Baseline application `785f762101f63b217b9ddb0ecd198313235701a8`; shipped Court Mode `6b9a556bb26ba9c84012b56a01cdf15a73ea5aa0` is present. Application source, dependencies and strategies are preserved.

- Setup [PR #3](https://github.com/PRYYSE/RotationStudio/pull/3) merged as `4c885a15a114d1aa52675635c15804b8bfc89ae6`. Plan/crosswalk and browser capture code received independent review; the two plan findings and one capture timing finding were resolved.
- Exact tested candidate: `8e336bdc2e6550ce144e672b742386731dcd55f9`. [Hosted run 45506394806](https://github.com/PRYYSE/RotationStudio/actions/runs/45506394806) **passed 199 tests, the Pages-base production build and software-WebGL browser capture**. Nine screenshots cover Studio View/Plans/Edit, original Set arcs, Court portrait/landscape/tablet and actual R3 proposal/phase selection. No recorded runtime, console-error or same-origin HTTP failures.
- Root and independent app reviewer inspected the rendered evidence. Court, athletes, net and Set arcs render. The manifest correctly leaves visual acceptance pending; successful capture is not product approval. Physical touch/pen, GPU performance and full-rally motion were not accepted by this setup smoke check.
- Initial live-shell browser had WebGL disabled. Those earlier blank-court images are superseded for rendering evidence by the actual hosted Chromium captures; they are not proof of a user-app rendering fault.
- Evidence artifact `rotation-review-evidence-8e336bdc2e6550ce144e672b742386731dcd55f9` is attached to that run with 14-day retention. The durable findings are recorded below; collect fresh candidate evidence during S1.
- Old app draft PR #1 and private workflow PR #8 are closed as superseded, with branches retained. No new schedule or personal computer worker was created. Candidate CI runs only on relevant pull requests or a deliberate manual start; its preview and browser stop at task end. Existing hourly status automation remains disabled.

### Confirmed priorities for S1

1. **Phone layout overflow with a real named plan:** at 390×844, selecting the longer R1/R3 proposal and advancing to R3 their-serve widens the canvas to 613px and visibly crops the header, court, camera controls, playback and bottom navigation. Contain long content and verify the whole viewport after selection, not just the short default Team V3 name. Preserve a deliberate scrollable event rail without allowing the whole application to overflow.
2. **Court identity/framing:** labels cluster or drift visually away from the player they identify, while default framing cuts useful server/opponent space at smaller sizes. Improve legibility and framing using actual rendered scenes.
3. **Studio hierarchy and plan entry:** competing context/playback strips, repetitive generic guidance, developer-oriented terminology and an ad hoc special-plan button obscure the normal coaching task. Complete the layout, control anatomy and real plan workflow together.

These are existing product defects and design gaps. The setup's green technical checks do not close them.

## Delivery ledger

| Slice | State | Candidate/release | Model / effort / speed | Evidence / findings / repair rounds |
|---|---|---|---|---|
| S1 Application experience | Ready | Not started | Planned Astra / High / Fast | Visual and interaction quality open; named-plan phone overflow confirmed |
| S2 Motion and editing | After S1 | Not started | Planned Astra / High / Fast | Full-rally movement/input acceptance open |
| S3 Connected journeys | After S2 | Not started | Planned Sol / High / Fast | Persistence/review/teaching acceptance open |
| S4 Integrated finish/release | After S1–S3 | Not started | Planned Astra / High / Fast | Includes requested final Unslop pass and independent acceptance |

For each completed slice add elapsed time and actual exposed usage, or `unknown`; never invent quota telemetry. Record the independent reviewed commit and deployed result. Do not append full terminal transcripts.

## Tactical status

R1 usable per owner; R3 v4 is for review. Last change is limited to two R3 receiving-right cases. Personalised R2/R4–R6 are unfinished. Software completion does not approve them. Private rationale and original sources remain in `PRYYSE/Volleyball`.

## Next task

Launch S1 with the prompt in the finish plan. Select Cloud and the actual requested model/effort in the task picker. No additional workflow project is needed. The repository setup does not assert a saved account-level environment exists.
