## Context

Compared with `origin/develop`, this branch introduces pre-effect execution, resist resolution, healing damage types, a damage-type settings editor, and target selection synchronization. It also adds E2E-025 through E2E-031, but several cases currently establish only reachability rather than the outcome required by their canonical OpenSpec scenarios.

The change is test and documentation work only. Existing production behavior, compendium source data, and the portable E2E baseline remain the subject under test.

## Goals / Non-Goals

**Goals:**

- Make the existing pre-effect E2E specifications executable through deterministic, outcome-level assertions.
- Cover pure/preparable pre-effect and resist behavior with Jest mocks instead of relying solely on browser tests.
- Verify that combat-dialog selection updates Foundry's target set.
- Make major-release guidance explicitly trace healing and damage-type settings coverage to E2E-030 and E2E-031.

**Non-Goals:**

- Change pre-effect, resist, targeting, damage, healing, or ActiveEffect production behavior.
- Add a new persistent data model, migration, compendium data change, or third-party dependency.
- Automate browser compatibility, initiative, module compatibility, or other checks that the release template intentionally keeps manual.

## Decisions

### Strengthen existing cases instead of adding parallel coverage

E2E-025 through E2E-028 already reference the canonical `pre-effect-e2e-tests` scenarios. They will be expanded in place so one test ID remains the release evidence for each feature flow. E2E-030 and E2E-031 will similarly gain deterministic behavioral checks rather than duplicate cases.

Alternative: create new numbered E2E cases for every missing scenario. Rejected because it would split one feature scenario across multiple release identifiers and make the traceability template harder to maintain.

### Assert observable document state and chat outcomes

Browser tests will set deterministic dice, snapshot and restore actors/settings, then assert exact Actor health values, ActiveEffect data, `game.user.targets`, ChatMessage content/count, and persisted Item/settings data. This follows the existing E2E baseline and restoration pattern.

Alternative: assert only visible markup. Rejected because markup can render while the underlying document update, resist resolution, or target synchronization is incorrect.

### Test processor and resist integration through public entry points

Jest tests will use existing patterns (`jest.mock`, mocked Foundry globals, captured `Hooks.on` callbacks, and document-like objects) to verify exported processor functions and registered resist listeners. Tests must not add production-only test APIs.

Alternative: export private handlers purely for testing. Rejected to keep the production module API unchanged.

### Keep release traceability in both contributor-facing locations

The major-release PR template will name E2E-030 and E2E-031 in the healing/damage and world-settings checks. `docs/develop/release.md` will explain that these cases are automated evidence, while the remaining manual checks stay mandatory.

## API Surface

- [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html): E2E fixtures update and restore target Actors, and inspect `appliedEffects`/health state.
- [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html): E2E cases save, close, and reopen a temporary spell Item to verify pre-effect persistence.
- [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html): tests inspect effects created on the target Actor and their `changes`, duration, and Ilaris timing data.
- [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html): E2E and Jest mocks verify resist prompts and damage/healing messages.
- [Token](https://foundryvtt.com/api/v14/classes/foundry.canvas.placeables.Token.html): the target-selection E2E verifies the effect of `Token#setTarget` through `game.user.targets`.
- [Game](https://foundryvtt.com/api/v14/classes/foundry.Game.html#settings): tests set and restore the `damageTypes` world setting.
- [Hooks](https://foundryvtt.com/api/v14/classes/foundry.Hooks.html): Jest captures the listener registered for the system's `Ilaris.postSkillRoll` hook. This change does not add or alter a Foundry lifecycle hook signature.
- `foundry.utils.fromUuid` and `foundry.utils.randomID` are mocked where the resist flow resolves source documents and serializes a prompt. No new utility is introduced; the community wiki must be checked for an existing test-safe helper before adding one.

## Testing Strategy

### Unit tests

- Extend `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` using mocked `Roll`, `ActiveEffect.createDocuments`, target documents, and damage helper boundaries. Cover `W`/`d` normalization, MÃ¤chtige Magie bonuses, multiple changes, effect document construction, self-cast/maneuver duration, and skipped targets.
- Create `scripts/effects/pre-effects/_spec/resist-handler.spec.js`. Capture `Hooks.on('Ilaris.postSkillRoll', ...)`, mock `game`, `ChatMessage`, `foundry.utils.fromUuid`, and `openSkillDialog`, then verify failed, successful, and diminished resolutions plus missing-target/skill guard behavior.
- Keep existing damage-type behavior tests in `scripts/combat/_spec/shared_dialog_helpers.test.js` as the unit source of truth; update them only if expanded E2E cases expose an untested boundary.

### E2E tests

- E2E-010: after dialog submission, assert the selected token is in `game.user.targets` and restore the target-selection setting.
- E2E-025: assert computed wounds and the WS-threshold no-damage/chat branch.
- E2E-026: use deterministic roll outcomes for full avoidance, full application, and diminished application; assert numeric Erschwernis.
- E2E-027: add/delete a pre-effect and verify selected values after save, close, and reopen.
- E2E-028: compare created effect changes and all duration/timing fields to the source pre-effect.
- E2E-030: assert deterministic healing amount and the zero-wound cap.
- E2E-031: add, edit behavior flags, delete, save, and reopen the damage-type setting.

All E2E cases use the portable baseline, GM login, serial execution, predicate-based waits, AppV2 click fallbacks where needed, and full cleanup. No new shared helper is required unless repeated setup proves it necessary.

## Risks / Trade-offs

- [Asynchronous Foundry document updates make assertions flaky] → wait for concrete document/chat predicates; never use fixed delays.
- [Stateful baseline contamination] → snapshot and restore actors/settings, remove temporary world items, and clear chat in `afterEach`.
- [Jest module mocking is brittle around ESM dynamic imports] → assert public side effects through mocked globals and captured Hooks callbacks; keep mocks colocated and minimal.
- [Release documentation could imply automation replaces manual checks] → retain explicit German manual scope statements in both release documents.

## Migration Plan

1. Add and run the focused tests locally against the portable baseline.
2. Run the serial full E2E suite and record whether the result is a full-suite pass or isolated rerun.
3. Update the release documentation together with the verified test IDs.
4. Rollback is limited to reverting test/documentation changes; no runtime or data migration is involved.

## Open Questions

- None. The existing portable baseline and GM account cover the intended tests; a player-owned target is only needed if the owner-routing assertion is expanded beyond the current scope.
