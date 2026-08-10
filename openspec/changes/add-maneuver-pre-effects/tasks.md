## 1. API and Existing-Flow Verification

- [ ] 1.1 Verify `ActiveEffect`, `Actor#createEmbeddedDocuments`, `Actor#deleteEmbeddedDocuments`, and `ChatMessage#create` against Foundry VTT API docs (v14).
- [ ] 1.2 Verify the exact existing `Ilaris.postSkillRoll` and combat-resolution call paths before adding maneuver dispatch; do not introduce an undocumented core-hook assumption.
- [ ] 1.3 Check foundryvtt.wiki for relevant `foundry.utils.deepClone`, `expandObject`, `randomID`, `fromUuid`, ActiveEffect embedding, and chat-prompt helpers.

## 2. Maneuver Pre-Effect Authoring

- [ ] 2.1 Add optional `preEffects` data to the maneuver Item model, including the bounded `activation` values `onConfirmedHit` and `onSuccessfulDefense`, plus `SELECTOR` input choices.
- [ ] 2.2 Extend the maneuver Item sheet and Handlebars template to author, add, remove, and persist the shared pre-effect payload and `SELECTOR` choices while preserving `modifications`.
- [ ] 2.3 Render and normalize `SELECTOR` inputs in melee, ranged, and supernatural combat dialogs; a selected string must activate modifications once and remain available to pre-effects.
- [ ] 2.4 Reuse existing pre-effect form behavior and `foundry.utils.deepClone`/`expandObject` helpers rather than duplicating form normalization.
- [ ] 2.5 Verify the Item data-model and sheet integration against Foundry VTT API docs (v14) and the AppV2/Handlebars guidance.
- [ ] 2.6 Keep `CombatItem._parseModifikationen()` runtime-generated spell/liturgy maneuvers outside this feature and preserve their current immediate-modification behavior.

## 3. Source-Neutral Pre-Effect Application

- [ ] 3.1 Extract a source-neutral pre-effect application context from the spell/liturgy processor without changing existing supernatural behavior.
- [ ] 3.2 Reuse the existing resist prompt and `Ilaris.postSkillRoll` resolution flow for maneuver pre-effects, including failed-resist application and successful-resist avoidance.
- [ ] 3.3 Materialize maneuver ActiveEffects with maneuver UUID, source Actor UUID, source type, pre-effect index, and application ID provenance.
- [ ] 3.4 Keep supernatural stacking replacement restricted to its existing spell/liturgy path; maneuver effects must not replace same-source effects through that policy.
- [ ] 3.5 Add the bounded `deselectEquippedWeapon` pre-effect operation, consuming Entwaffnen's selected Hauptwaffe/Nebenwaffe slot and showing a no-weapon-in-slot notice.
- [ ] 3.6 Verify embedded ActiveEffect creation/deletion and Item update method signatures against Foundry VTT API docs (v14).

## 4. Final Combat Outcome Dispatch

- [ ] 4.1 Add selected-maneuver snapshots needed to dispatch effects after the final melee attack-versus-defense result.
- [ ] 4.2 Dispatch `onConfirmedHit` maneuver pre-effects only for a final attacker win, using the attack dialog's selected defenders.
- [ ] 4.3 Dispatch `onSuccessfulDefense` maneuver pre-effects only for a final defender win, using the defense dialog's automatically selected attacker.
- [ ] 4.4 Guard multiplayer routing and repeated resolution so each maneuver pre-effect application is dispatched exactly once per resolved target.
- [ ] 4.5 Verify the combat dialog result flow and any touched Foundry combat APIs against Foundry VTT API docs (v14).

## 5. Opposed Escape Effect Ending

- [ ] 5.1 Extend the Ilaris ActiveEffect type data with a bounded `ilarisEnding.opposedEscape` configuration and source Actor UUID metadata.
- [ ] 5.2 Add a visible `Befreiungsprobe` action to eligible actor effect rows and a GE/KK selection dialog displaying current PW values.
- [ ] 5.3 Create the whispered source-actor counter-check prompt, with active-GM fallback when the source has no eligible controlling user.
- [ ] 5.4 Resolve the opposed escape through the existing attacker-versus-defender outcome convention and delete only the linked ActiveEffect on success.
- [ ] 5.5 Validate effect ID, target Actor, source Actor UUID, ending type, and single-use nonce for every escape interaction; reject stale or duplicate prompts.
- [ ] 5.6 Verify `ChatMessage#create`, embedded effect deletion, and the relevant UI/application APIs against Foundry VTT API docs (v14).
- [ ] 5.7 Check foundryvtt.wiki for existing chat, hook, and dialog patterns before adding custom interaction handling.

## 6. Reviewed Maneuver Data

- [ ] 6.1 Author Binden with an `onSuccessfulDefense` pre-effect that applies the configured VT penalty to the attacker for one owner turn through that actor's turn end.
- [ ] 6.2 Author Niederwerfen with an `onConfirmedHit` pre-effect, KK resistance gate, and Liegend result.
- [ ] 6.3 Author Umreißen with an `onConfirmedHit` Liegend pre-effect and its reviewed GE/KO resistance data.
- [ ] 6.4 Author Umklammern with an `onConfirmedHit` persistent hold effect and `opposedEscape` ending configuration.
- [ ] 6.5 Author Entwaffnen with an `onConfirmedHit` KK resistance gate and `deselectEquippedWeapon` operation.
- [ ] 6.6 Confirm that weapon-property `targetEffect` data is untouched and has no runtime integration in this change.
- [ ] 6.7 Run `npm run pack-all` after the compendium source changes.

## 7. Unit Tests

- [ ] 7.1 Update maneuver data-model and sheet specs for pre-effect defaults, activation selection, `SELECTOR` choices, and form persistence.
- [ ] 7.2 Add or retain regression coverage proving `system.modifikationen` runtime-generated maneuvers do not gain pre-effects or selector behavior.
- [ ] 7.3 Update `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` and `resist-handler.spec.js` for source-neutral maneuver applications and unchanged supernatural behavior.
- [ ] 7.4 Add focused ActiveEffect/effect-row tests for GE/KK selection, source-user/GM routing, nonce validation, failed escape retention, and exact-effect deletion.
- [ ] 7.5 Update melee combat-dialog specs for confirmed-hit and successful-defense dispatch, selected-target propagation, and duplicate-dispatch protection.
- [ ] 7.6 Add pre-effect operation tests for generic selector inputs and Entwaffnen's selected-slot flag clearing and no-weapon-in-slot path.
- [ ] 7.7 Add compendium source-data assertions for Binden, Niederwerfen, Umreißen, Entwaffnen, and Umklammern.
- [ ] 7.8 Run `npm install` and `npm test`.

## 8. E2E Tests

- [ ] 8.1 Add a Foundry E2E case for Binden: successful defense, attacker-targeted VT penalty, and expiry at the end of the attacker's next phase.
- [ ] 8.2 Add a Foundry E2E case for Niederwerfen: confirmed hit, failed KK resistance, and Liegend effect; also verify successful resistance creates no effect.
- [ ] 8.3 Add a Foundry E2E case for Umreißen: confirmed hit, reviewed resistance choice, and Liegend effect.
- [ ] 8.4 Add a Foundry E2E case for Entwaffnen: a maneuver dropdown selects Hauptwaffe/Nebenwaffe, failed KK resistance, and clearing only that selected slot flag.
- [ ] 8.5 Add a Foundry E2E case for Umklammern: effect creation, GE/KK/PW selection, whispered source counter-check, failed escape retention, and successful exact-effect deletion.
- [ ] 8.6 Run E2E tests in a world with a GM and controllable maneuver-user and target actors; extract repeated chat-prompt helpers to `e2e/shared/` only if reused.

## 9. Final Validation

- [ ] 9.1 Run `npm test`.
- [ ] 9.2 Run `npm run lint`.
- [ ] 9.3 Run `npm run pack-all` and reload Foundry before live E2E validation.
- [ ] 9.4 Run `openspec validate add-maneuver-pre-effects --strict`.
- [ ] 9.5 Verify Binden, Niederwerfen, Umreißen, Entwaffnen, and Umklammern manually in the configured Foundry world.
