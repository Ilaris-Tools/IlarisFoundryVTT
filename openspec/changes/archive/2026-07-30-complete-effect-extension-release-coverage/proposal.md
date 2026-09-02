## Why

The effect-extension branch adds pre-effects, resist resolution, configurable damage-type behavior, and healing flows, but several branch-added E2E cases only prove that a dialog opens or that a value changes. They do not yet exercise the complete outcomes promised by the existing specifications. Release documentation also does not trace the new healing and damage-type checks to their automated evidence.

This change turns those partial checks into release-relevant regression coverage without changing game rules or production behavior.

## What Changes

- Strengthen E2E-025 through E2E-028 to verify exact instant-damage, resist-resolution, pre-effect editing/persistence, and created ActiveEffect outcomes.
- Extend E2E-030 and E2E-031 with deterministic healing and full damage-type settings CRUD/behavior persistence coverage.
- Add focused unit coverage for pre-effect processing and resist-result resolution.
- Add a target-selection assertion to the existing combat E2E flow, proving that dialog selection synchronizes to `game.user.targets`.
- Update the major-release PR template and `docs/develop/release.md` so healing and configurable-damage E2E evidence is traceable during release validation.

This is purely additive test and release-documentation work; it does not change production functionality or public data formats.

## Capabilities

### New Capabilities

- `effect-extension-release-coverage`: Regression coverage and release traceability for the effect-extension branch's pre-effects, resist, healing, damage-type, and target-selection flows.

### Modified Capabilities

- `pre-effect-e2e-tests`: Require outcome-level assertions for the existing instant damage, resist, item-sheet configuration, and ActiveEffect scenarios.
- `configurable-damage-types`: Require E2E evidence for damage-type add/delete behavior flags and persistence.
- `e2e-testing`: Add explicit target-selection synchronization coverage to the combat E2E baseline.
- `release-validation-traceability`: Require release documentation to map healing and damage-type settings checks to E2E-030 and E2E-031.

## Impact

- E2E cases: `e2e-010`, `e2e-025` through `e2e-028`, `e2e-030`, and `e2e-031`; shared helpers may be promoted to `e2e/shared/fixtures/foundry.ts` only if repetition warrants it.
- Unit tests: `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` and a new colocated resist-handler spec.
- Release documentation: `.github/PULL_REQUEST_TEMPLATE/pr_major_release.md` and `docs/develop/release.md` (German user-facing release guidance).
- Foundry VTT APIs exercised by the tests: [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html), [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html), [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html), [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html), [Token](https://foundryvtt.com/api/v14/classes/foundry.canvas.placeables.Token.html), [Game settings](https://foundryvtt.com/api/v14/classes/foundry.Game.html#settings), and [Hooks](https://foundryvtt.com/api/v14/classes/foundry.Hooks.html), including the system's `Ilaris.postSkillRoll` integration hook.
- E2E environment: the portable baseline world, GM account, and existing `HatAlles` actor are sufficient for all cases except any explicit owner-routing check; the existing multiplayer fixture remains available if a player-owned target is needed.
