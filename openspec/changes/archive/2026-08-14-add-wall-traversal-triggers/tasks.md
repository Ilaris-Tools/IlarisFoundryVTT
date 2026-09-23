## 1. API and movement-contract verification

- [x] 1.1 Verify against Foundry API docs (v14) the exact `moveToken` hook signature, processed movement fields, `TokenDocument#segmentizeRegionMovementPath` segment contract, Region ownership, and embedded ActiveEffect APIs; record any API constraint discovered in `design.md`.
- [x] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers and movement/Region guidance; retain `deepClone`/`randomID` only if the documented behavior remains appropriate.
- [x] 1.3 Inspect the existing Zone fixture/cleanup and establish a real owned-token movement pattern before authoring the traversal test.

## 2. Traversal profile and movement classification

- [x] 2.1 Extend Zone-profile normalization with an opt-in `trigger.onTraverse` and its validated traversal-resistance configuration, preserving all existing profiles as disabled by default.
- [x] 2.2 Implement a focused, documented classifier for normal processed movement paths: recognize Region ENTER, exclude teleport/MOVE-only/EXIT-only paths, and generate a deduplicated Region/Token/movement window.
- [x] 2.3 Route `moveToken` traversal candidates to the active GM without altering the established `updateToken` membership, ordinary entry, passive, turn-start, or round-start flows.

## 3. Traversal resolution and marker lifecycle

- [x] 3.1 Dispatch configured instant traversal Pre-Effects unconditionally before sending exactly one traversal-only resistance prompt.
- [x] 3.2 Extend the resistance resolution flow with a narrow serialized traversal context: success clears the matching marker; failure creates or retains one marker and sends the German manual-reset instruction.
- [x] 3.3 Create a mechanically neutral, visible ActiveEffect marker with narrow Region/application/Token/spell provenance and idempotent ownership matching.
- [x] 3.4 Extend Region expiry and deletion cleanup to remove only matching traversal markers, preserving ordinary passive Zone effects, manual effects, and markers owned by other Regions or casts.

## 4. Reviewed spell data and documentation

- [x] 4.1 Configure `Wand aus Dornen` with `onTraverse`, GE 16 traversal resistance, creation and generic entry disabled, and an unconditional `2W6` PROFAN instant damage Pre-Effect without `avoidTest`.
- [x] 4.2 Update the Zone automation quick-reference with the traversal convention: damage on both outcomes, success permits passage, failure requires a GM reset before the wall, and the four-Initiativephase leaving rule remains manual.
- [x] 4.3 Run `npm run pack-all` after compendium source updates.

## 5. Unit Tests

- [x] 5.1 Add or extend `scripts/combat/zones/_spec/` tests for traversal-profile defaults and movement classifier outcomes: ENTER, inside/parallel movement, EXIT, teleport, multi-segment crossing, and duplicate window suppression.
- [x] 5.2 Extend `scripts/combat/zones/_spec/zone-lifecycle.spec.js` for active-GM dispatch, unconditional consequence-before-prompt ordering, and non-interference with existing Zone triggers.
- [x] 5.3 Extend `scripts/effects/pre-effects/_spec/resist-handler.spec.js` and the narrow Zone-effect ownership tests for success cleanup, failed-marker upsert, chat instruction, and expiry/deletion ownership isolation.
- [x] 5.4 Add source-data assertions for the reviewed `Wand aus Dornen` rule split.

## 6. Runtime verification and E2E Tests

- [x] 6.1 Update `runtime-verification.md` from draft to executed evidence as the implementation is verified; record exact document IDs, console diagnostics, and cleanup results.
- [x] 6.2 Add a visible-player-path Playwright case, extending E2E-038 or creating a focused neighboring case, that casts `Wand aus Dornen`, uses normal owned-token map movement through the wall, and verifies the real prompt, damage, marker/chat result, later-success cleanup, and Region cleanup.
- [x] 6.3 Use `node utils/foundry-lifecycle.mjs PackAndRestart --world ilaris-e2e-world-v14363-r1 --port 30000` before E2E because source data changes.
- [x] 6.4 Execute the focused E2E case with console/page-error collection and idempotent `finally` cleanup; do not mark it complete if a required runtime case remains failed, blocked, or not run.
- [x] 6.5 Inspect and retain screenshot evidence for the real actor Active Effects list and German failure chat instruction; dark-mode review is not required because no presentation styling changes.

## 7. Final validation and handoff

- [x] 7.1 Run `npm install` before the final build/test commands.
- [x] 7.2 Run `npm test`.
- [x] 7.3 Run `npm run lint`.
- [x] 7.4 Run `openspec validate add-wall-traversal-triggers --strict`.
- [x] 7.5 Review the scoped diff and `git diff --check`; commit only this change after all required E2E/runtime cases pass.
