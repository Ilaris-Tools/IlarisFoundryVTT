## 1. API and implementation preparation

- [x] 1.1 Verify `ChatMessage`, `renderChatMessageHTML`, `DialogV2.wait`, and `Roll#total` usage against the Foundry VTT v14 API documentation before changing the prompt flow.
- [x] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers and retain the existing serializable payload approach unless a documented helper is necessary.

## 2. Resistance difficulty resolution

- [x] 2.1 Add a focused resolver in `scripts/effects/pre-effects/resist-handler.js` for `fixed` and `triggeringRoll` difficulty sources, including the 12 default, explicit zero, fixed-only QS bonus, and localized missing-total fallback.
- [x] 2.2 Pass the resolved difficulty to `openSkillDialog` without changing the existing `_resistContext` completion flow.
- [x] 2.3 Update `scripts/effects/pre-effects/pre-effects-processor.js` to snapshot a finite `rollResult.roll.total` as `triggeringRollTotal` in each resistance prompt payload.

## 3. Combat and authoring integration

- [x] 3.1 Update `scripts/combat/dialogs/angriff.js` so confirmed-hit and successful-defense maneuver pre-effects pass the activating roll result to `applyPreEffects`.
- [x] 3.2 Verify the applicable Foundry VTT v14 `Roll` API documentation for the combat roll-total hand-off.
- [x] 3.3 Add `resistDifficultySource: "fixed"` to new Pre-Effect defaults in `scripts/items/sheets/uebernatuerlich-talent.js`.
- [x] 3.4 Add the German `Schwierigkeit aus` selector and fixed/triggering-roll presentation to `scripts/items/templates/pre-effects.hbs`.

## 4. Compendium and documentation

- [x] 4.1 Migrate `Entwaffnen`, `Niederwerfen`, and `Umreißen` in `comp_packs/manover/_source/` to `resistDifficultySource: "triggeringRoll"` with 12 as their ordinary fixed fallback.
- [x] 4.2 Update `comp_packs/kurzuebersichten/_source/Zauber_Liturgien_Pre_Effects_Quick_Reference_preeffect001.json` with structured German guidance for both resistance-difficulty sources and the non-sentinel meaning of zero.
- [x] 4.3 Run `npm run pack-all` after the `_source/` compendium changes.

## 5. Unit Tests

- [x] 5.1 Extend `scripts/effects/pre-effects/_spec/resist-handler.spec.js` for default fixed difficulty, explicit zero, fixed QS adjustment, triggering total, and missing-trigger fallback.
- [x] 5.2 Extend `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` to assert serialized `triggeringRollTotal` handling.
- [x] 5.3 Add or extend the relevant combat-dialog spec to verify confirmed-hit and successful-defense maneuver dispatch retain their real roll result.
- [x] 5.4 Extend `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js` or the relevant compendium-data spec to validate the three migrated maneuvers.

## 6. E2E Tests

- [x] 6.1 Extend `e2e/cases/e2e-035-maneuver-pre-effects/e2e-035-maneuver-pre-effects.spec.ts` (or add a narrowly scoped companion case) for a triggering-roll maneuver resistance prompt in `ilaris-e2e-world-v14363-r1` as `e2e-gm`.
- [x] 6.2 Verify the E2E case's displayed `Erschwernis` equals the activating roll total and restores chat messages, effects, and equipped-weapon state after the run.

## 7. Validation

- [x] 7.1 Run `npm install` before the validation suite.
- [x] 7.2 Run focused Jest tests and then `npm test`.
- [x] 7.3 Run `npm run lint` and review only changes belonging to this OpenSpec change.
- [x] 7.4 Run the focused E2E case with `npm run test:e2e` once a Foundry instance and the requested world are available.
