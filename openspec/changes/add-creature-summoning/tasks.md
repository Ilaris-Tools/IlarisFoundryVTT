## 1. Data Model and Settings

- [ ] 1.1 Add `summoningDifficulty` and `summoningCost` to the `kreatur` TypeDataModel with numeric default 12 and legacy/invalid-value normalization.
- [ ] 1.2 Add `kreaturenPacks` to `configure-game-settings.model.js` and register the world-scoped JSON setting with default `["Ilaris.kreaturen"]`.
- [ ] 1.3 Extend the Ilaris compendium settings context, template, save handler, and reset handler with a Kreaturen group that discovers Actor packs containing `type: "kreatur"`.
- [ ] 1.4 Verify against Foundry API docs (v14) for `game.settings.get`, `game.settings.set`, `game.packs`, and the registered world setting contract.
- [ ] 1.5 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers used for setting JSON normalization or pack-index transformation.

## 2. Creature Source and Placement Runtime

- [ ] 2.1 Add a creature source helper that reads configured creature pack collections, filters Actor index entries by `type: "kreatur"` and `system.kreaturentyp`, and resolves the selected Actor UUID with `fromUuid`.
- [ ] 2.2 Implement deterministic expanding-ring placement candidates around the summoner TokenDocument, rejecting occupied, out-of-bounds, and size-overlapping positions.
- [ ] 2.3 Implement creature token creation using `Actor#getTokenDocument` and `Scene#createEmbeddedDocuments("Token", ...)`, preserving the compendium source and creating an unlinked scene token.
- [ ] 2.4 Open the created token's represented creature Actor sheet after persistence and report source, permission, placement, or sheet failures without duplicating tokens.
- [ ] 2.5 Verify against Foundry API docs (v14) for [Actor#getTokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#gettokendocument), [Scene#createEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html#createembeddeddocuments), [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html), and Actor sheet rendering.
- [ ] 2.6 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers before cloning token/source data or testing occupied token positions.

## 3. Pre-Effect and Casting Integration

- [ ] 3.1 Add the `summonCreature` payload defaults and authoring controls to the shared Pre-Effect item sheet and template, including allowed `kreaturentyp` values.
- [ ] 3.2 Add creature-summon controls to structured supernatural spell forms while preserving inherit, extend, replace, and whole-array persistence semantics.
- [ ] 3.3 Extend `UebernatuerlichDialog` to prepare the dependent creature-type and creature selectors and carry the selected UUID in the effective pre-effect context.
- [ ] 3.4 Apply the selected creature's normalized `summoningDifficulty` and `summoningCost` as replacement values for the effective spell profile.
- [ ] 3.5 Extend `applyPreEffects` with a `summonCreature` branch that invokes the creature runtime only after successful casts and leaves `summonItem` behavior unchanged.
- [ ] 3.6 Verify against Foundry API docs (v14) for `fromUuid`, `ActiveEffect`, `Actor`, `Scene`, and the existing AppV2/Handlebars application APIs touched by the dialog and sheets.
- [ ] 3.7 Check foundryvtt.wiki for relevant `foundry.utils.deepClone` and `foundry.utils.mergeObject` patterns before injecting runtime selection context.

## 4. Reviewed Compendium Source Data

- [ ] 4.1 Identify and review the intended summoning spell source entries in `comp_packs/zauberspruche-und-rituale/_source/` and add only the reviewed `summonCreature` payloads.
- [ ] 4.2 Verify each configured creature type maps to existing `system.kreaturentyp` values and each source payload remains valid JSON.
- [ ] 4.3 Run `npm run pack-all` after modifying compendium source data.

## 5. Unit Tests

- [ ] 5.1 Add or update `scripts/actors/_spec/kreatur-summoning.spec.js` for default and legacy normalization of `summoningDifficulty` and `summoningCost`.
- [ ] 5.2 Add `scripts/effects/pre-effects/_spec/summoned-creatures.spec.js` for configured pack filtering, UUID validation, placement rings, unlinked TokenDocument creation, manual lifecycle, and sheet opening.
- [ ] 5.3 Update `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` for successful `summonCreature` dispatch, failed-cast guards, structured effective lists, and `summonItem` regression.
- [ ] 5.4 Update `scripts/combat/_spec/uebernatuerlich.spec.js` for dependent selector state, selected creature context, and replacement difficulty/cost profile behavior.
- [ ] 5.5 Update `scripts/items/sheets/_spec/pre-effect-item.spec.js` and `scripts/items/sheets/_spec/uebernatuerlich-talent.spec.js` for persisted creature-summon authoring data and structured-form controls.
- [ ] 5.6 Update `scripts/settings/_spec/weapon-damage-roll-setting.spec.js` or add `scripts/settings/_spec/creature-packs-setting.spec.js` for registration, default, save, reset, and eligible-pack discovery.

## 6. E2E Tests

- [ ] 6.1 Add an E2E scenario under `e2e/cases/e2e-035-creature-summoning/` covering GM creature-pack configuration, dependent selectors, successful cast, nearest available placement, and creature-sheet opening.
- [ ] 6.2 Configure the E2E world with a GM, player caster, active Scene, controlled caster Token, enabled creature Actor pack, and a reviewed summonCreature spell source.
- [ ] 6.3 Promote reusable active-scene-token, creature-pack, and created-token lookup helpers to `e2e/shared/` where they overlap with E2E-034.
- [ ] 6.4 Run the existing `e2e/cases/e2e-034-summoned-items/e2e-034-summoned-items.spec.ts` as a regression check for unchanged item summoning.

## 7. Validation and Documentation

- [ ] 7.1 Run `npm install` before build or test validation if dependencies are not installed for the current checkout.
- [ ] 7.2 Run focused unit tests for the new and updated test files, then run `npm test`.
- [ ] 7.3 Run `npm run lint` and fix only issues introduced by this change.
- [ ] 7.4 Verify against Foundry API docs (v14) and the community wiki for all final API and utility usage before implementation is marked complete.
- [ ] 7.5 Update relevant user/developer documentation or quick-reference content for creature summon configuration, manual token lifecycle, and the Kreaturen-Kompendien setting.
