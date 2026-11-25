# Edit a RotationStudio plan with an external assistant

1. Open **Team plans**, load the intended plan, then select the case, moment and player. Under **Import and export**, download **AI editing pack**. It includes the selected case and its cues, display names and exact version references. Explicitly opt in to skill ratings if needed. Inspect the pack before forwarding it to anyone.
2. Give the assistant the pack and [proposal schema](proposal.schema.json). Ask it to return one JSON proposal targeting the exact strategy, lineup, assessment and league revisions in the pack. Use the IDs in the pack. Coordinates are metres from the net, with positive Z on our side, and timing is in milliseconds. Each move changes the selected slot and moment. A teaching cue or body position changes no ball ownership.
3. Start with a declared case, moment and slot scope. Omit the moment only for case-wide work. Each independently authored case has its own stable ID, even if it shares a rotation, serve or moment name with another case. Each repeated dig or set uses its own moment and contact. To author a new rally, add moments with all six slots, add named contacts, and connect them using their contact IDs. Use `partial` unless all twelve base cases have usable rallies. State assumptions and facts that still need checking.
4. Import the proposal into the open plan. Compare the original and proposed court, read the diff and choose **Apply proposal** or **Reject**. Import and preview leave the saved plan unchanged. Apply is one edit, and **Undo edit** restores the preceding revision in one step. A newer base requires an updated pack. A repeat operation ID must carry the same request.
5. Save the library. In public Pages, the library is on this browser. A redacted editable copy strips coaching cues and assessments and opens as a new independent draft. Review names and labels before sharing. An exact review opens as a read-only snapshot. **Make my own draft copy** explicitly imports a new draft.

From `visualizer/` with Node 22:

```sh
npm run validate:proposal
npm run validate:proposal -- /path/to/private-library.json /path/to/proposal.json
```

The first command checks the [synthetic proposal](synthetic-proposal.json) against the twelve-case synthetic plan supplied in the [complete pack](synthetic-pack.json). The second validates a proposal against your actual library backup and prints the diff and issues without changing it. `npm run validate:proposal -- --write-examples` regenerates the published schemas and synthetic fixtures from the same validator used by the browser and Worker.

Keep private library backups and legacy receipts off public repositories. Legacy imports accept original V1/V2 files up to 1 MB. Where mappings are ambiguous, consult the source receipt and export the original. Proposal files allow up to 150 KB and private library backups up to 1.75 MB.
