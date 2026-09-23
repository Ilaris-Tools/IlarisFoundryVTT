## 1. API and current lifecycle preparation

- [x] 1.1 Verify against Foundry API docs (v14) `ActiveEffect`, `Actor#createEmbeddedDocuments`, `Actor#deleteEmbeddedDocuments`, `ChatMessage`, ActiveEffect duration/expiry, and the exact `combatTurn(combat, updateData, updateOptions)` Hook signature.
- [x] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.*` data-copy, document, and timing helpers before adding any utility.
- [x] 1.3 Trace configured damage-type parsing, direct damage application, countercheck routing, condition-source creation/removal, and the current authoritative combat-turn reducer.

## 2. Configured trigger and Nachbrennen lifecycle

- [x] 2.1 Extend configurable damage-type behavior with an editable optional `elementalSideEffect`, preserving legacy behavior defaults and the settings UI's safe serialization.
- [x] 2.2 Configure every default damage type with an explicit `elementalSideEffect` value (`"nachbrennen"` for FEUER, `null` otherwise) and dispatch a named side-effect resolver only after resolved direct fire damage.
- [x] 2.3 Implement the KO-20 countercheck and a visible, target-owned pending Nachbrennen source with four owner initiative phases.
- [x] 2.4 Implement idempotent fourth-phase completion: exactly one wound, a visible chat result, and removal of only the Nachbrennen source.
- [x] 2.5 Ensure manual removal through the existing effects/status UI extinguishes the pending source and retains unrelated condition sources.
- [x] 2.6 Audit _Ignifaxius Flammenstrahl_ as the first fire-side-effect consumer after `add-ballistic-spell-resolution` is available.
- [x] 2.7 Run `npm run pack-all`.

## 3. Unit Tests

- [x] 3.1 Extend `scripts/combat/_spec/shared_dialog_helpers.test.js` for legacy behavior, every built-in default `elementalSideEffect` value, and post-damage dispatch/no-dispatch.
- [x] 3.1a Extend damage-type settings tests for editing, clearing, and persisting `elementalSideEffect` values.
- [x] 3.2 Extend `scripts/effects/_spec/combat-turn-hooks.spec.js` for four owner phases, one completion wound, and duplicate-turn idempotence.
- [x] 3.3 Extend `scripts/effects/_spec/status-conditions.spec.js` for pending-source visibility, extinguishing, and unrelated-source preservation.
- [x] 3.4 Extend `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js` for Ignifaxius fire-side-effect source data and configured FEUER behavior.
- [x] 3.5 Run `npm install` and the focused Jest suites, then run `npm test`.

## 4. E2E Tests and runtime verification

- [x] 4.1 Use the `foundry-runtime-verification` skill to derive and record a change-specific checklist for cast, KO countercheck, pending status, four owner turns, one wound, extinguishing, cleanup, and screenshots.
- [x] 4.2 Run `node utils/foundry-lifecycle.mjs PackAndRestart --world ilaris-e2e-world-v14363-r1 --port 30000` after source-data changes; use `Status` first when starting verification.
- [x] 4.3 Add a focused Playwright case with active GM, post-ballistic Ignifaxius caster, owned target token, and target combatant; exercise the visible countercheck, effect/status, four-phase completion, and final chat/wound result.
- [x] 4.4 Add the explicit effect-removal run and assert it prevents the final wound while leaving unrelated sources; promote a fixture only if it is reusable.
- [x] 4.5 Inspect and screenshot the existing effects/status and chat surfaces in the supported current theme; regression-run direct-damage, configured-damage, condition-lifecycle, and ballistic Ignifaxius E2E cases.

## 5. Final validation and handoff

- [x] 5.1 Run `npm run lint` and resolve relevant failures.
- [x] 5.2 Run `openspec validate add-nachbrennen-effect --strict` and resolve validation failures.
- [x] 5.3 Review the diff, stage only this change's implementation files, and commit after unit tests and runtime verification pass.
