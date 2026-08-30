## 1. Research and source-data contract

- [x] 1.1 Verify against Foundry API docs (v14) the `Actor`, `ChatMessage`, `Roll`, and `ApplicationV2` methods used by the target-MR request, roll, chat, and rerender paths.
- [x] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.*` request-ID, cloning, and socket-adjacent helpers before adding a utility.
- [x] 1.3 Audit every authoritative supernatural `_source` entry whose difficulty mentions Magieresistenz; record the exact unconditional single-Actor set and exclude conditional, Zone, multi-target, and non-Actor cases.
- [x] 1.4 Add the optional `magicResistance` model schema, effective-profile normalization, structured-form override behavior, and item-sheet authoring controls with disabled-safe defaults.
- [x] 1.5 Apply the audited explicit `{ enabled: true, targetMode: "singleActor" }` source data and run `npm run pack-all`.

## 2. Target-Magieresistenz request and roll flow

- [x] 2.1 Extract a dialog-safe target-MR challenge resolver that validates exactly one selected Actor, snapshots its prepared MR, constructs request IDs, and rejects stale or duplicate results.
- [x] 2.2 Reuse the existing target-owner executor policy and `system.Ilaris` socket infrastructure to route one target-roll request to the responsible active owner or GM fallback.
- [x] 2.3 Implement the target-side `1W20` roll, whispered chat card, result routing, and bounded duplicate-event guard without accepting a client-supplied MR value.
- [x] 2.4 Integrate the accepted `MR + 1W20` total into `UebernatuerlichDialog` before `evaluate_roll_with_crit`, retaining existing success, energy, draft-cleanup, and Pre-Effect paths.

## 3. Casting-dialog UI and lifecycle

- [x] 3.1 Render the target-MR subsection after target selection and before maneuvers with missing-target, pending-request, and resolved-calculation states.
- [x] 3.2 Disable the casting control only while an enabled single-Actor MR profile lacks a current resolved challenge; leave target-selection-disabled and unmarked/manual casts unchanged.
- [x] 3.3 Invalidate the transient challenge after target selection changes or dialog closure and ensure late socket results cannot update a different cast.
- [x] 3.4 Verify light and dark theme layout: target, request control, and resolved `MR + 1W20 = Schwierigkeit` row remain visibly reachable.

## 4. Unit Tests

- [x] 4.1 Extend `scripts/items/data/_spec/spell-modifications.spec.js` for base/form `magicResistance` normalization, override, malformed data, and disabled fallback.
- [x] 4.2 Extend `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js` with the audited source-marker set and explicit exclusions.
- [x] 4.3 Add a focused `_spec` suite for target-MR challenge eligibility, MR snapshot calculation, request identity, stale-result rejection, duplicate-result handling, and target-owner/GM fallback selection.
- [x] 4.4 Extend supernatural-dialog tests for numeric evaluator input, pending roll disablement, manual fallback, and no energy/Pre-Effect dispatch before a valid MR result.
- [x] 4.5 Run the focused model, spell-modification, source-data, target-MR, and supernatural-dialog Jest suites.

## 5. E2E Tests and runtime verification

- [x] 5.1 Use the `foundry-runtime-verification` skill to derive and record a checklist for source refresh, target selection, remote target D20, MR calculation, caster roll, chat evidence, successful/failed effects, stale-result rejection, and cleanup.
- [x] 5.2 Run `node utils/foundry-lifecycle.mjs PackAndRestart --world ilaris-e2e-world-v14363-r1 --port 30000` after source-data changes.
- [x] 5.3 Add a Playwright E2E scenario with target selection locally enabled that visibly selects an Actor target for _Blitz dich find_, completes the remote controller's D20, and proves the exact `MR + 1W20` difficulty in the caster dialog and chat.
- [x] 5.4 Extend that E2E coverage for a failed target-MR-gated cast (no Pre-Effect), an unmarked/manual spell, stale/duplicate target-roll events, and full restoration of settings, targets, Actors, chat, and temporary documents.
- [x] 5.5 Inspect the visible normal- and dark-theme casting dialog, target-roll card, and post-roll modifier/effect state in the running Foundry world.

## 6. Final validation and handoff

- [x] 6.1 Run `npm install`, `npm test`, and `npm run lint`; resolve relevant failures.
- [x] 6.2 Run `openspec validate add-target-magic-resistance --strict` and resolve validation failures.
- [x] 6.3 Review the diff, ensure only this change's files are staged, and commit the completed implementation after unit and runtime verification pass.
