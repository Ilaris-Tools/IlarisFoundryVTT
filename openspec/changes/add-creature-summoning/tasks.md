## 1. Data Model and Settings

- [x] 1.1 Add `summoningDifficulty` and `summoningCost` to the `kreatur` TypeDataModel with numeric default 12 and legacy/invalid-value normalization.
- [x] 1.2 Add `kreaturenPacks` to `configure-game-settings.model.js` and register the world-scoped JSON setting with default `["Ilaris.kreaturen"]`.
- [x] 1.3 Extend the Ilaris compendium settings context, template, save handler, and reset handler with a Kreaturen group that discovers Actor packs containing `type: "kreatur"`.
- [x] 1.4 Verify against Foundry API docs (v14) for `game.settings.get`, `game.settings.set`, `game.packs`, and the registered world setting contract.
- [ ] 1.5 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers used for setting JSON normalization or pack-index transformation.

## 2. Creature Source and Placement Runtime

- [x] 2.1 Add a creature source helper that reads configured creature pack collections, filters Actor index entries by `type: "kreatur"` and `system.kreaturentyp`, and resolves the selected Actor UUID with `fromUuid`.
- [x] 2.2 Implement deterministic expanding-ring placement candidates around the summoner TokenDocument, rejecting occupied, out-of-bounds, and size-overlapping positions.
- [x] 2.3 Implement creature token creation using `Actor#getTokenDocument` and `Scene#createEmbeddedDocuments("Token", ...)`, preserving the compendium source and creating an unlinked scene token.
- [x] 2.4 Open the created token's represented creature Actor sheet after persistence and report source, permission, placement, or sheet failures without duplicating tokens.
- [x] 2.5 Reserve the spell-defined `boundResourceCost` on the held summoner, record provenance on the created token, and roll back any reservation if token creation fails.
- [x] 2.6 Register the token-deletion lifecycle that releases the recorded gAsP/gKaP reservation exactly once without recreating unavailable summoners.
- [x] 2.7 Verify against Foundry API docs (v14) for [Actor#getTokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#gettokendocument), [Scene#createEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html#createembeddeddocuments), [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html), Actor sheet rendering, and Token deletion lifecycle APIs.
- [ ] 2.8 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers before cloning token/source data, storing provenance, or testing occupied token positions.

## 3. Pre-Effect and Casting Integration

- [x] 3.1 Add the `summonCreature` payload defaults and authoring controls to the shared Pre-Effect item sheet and template, including allowed `kreaturentyp` values.
- [x] 3.2 Add creature-summon controls to structured supernatural spell forms while preserving inherit, extend, replace, and whole-array persistence semantics.
- [ ] 3.3 Make `pre-effects.hbs` and `uebernatuerlich_talent.hbs` hide or disable unrelated fields for inactive creature summon, domination, and probe-type branches, and normalize disabled branches on save.
- [x] 3.4 Add `boundResourceCost` authoring with resource type (`gasp`/`gkap`) and amount, showing those fields only when binding is enabled.
- [x] 3.5 Extend `UebernatuerlichDialog` to prepare the dependent creature-type and creature selectors and carry the selected UUID in the effective pre-effect context.
- [x] 3.6 Apply the selected creature's normalized `summoningDifficulty` and `summoningCost` as replacement values for the effective spell profile.
- [x] 3.7 Add global `dominationChecks.enabled` authoring plus per-`kreaturentyp` domination-check entries with fixed difficulty and attribute or skill/talent configuration.
- [x] 3.8 Resolve the selected domination configuration from effective spell data and run the summoner's probe only after token creation and creature-sheet opening.
- [x] 3.9 Display only domination success/failure; skip the check when globally disabled or when the selected type has no entry, and ensure a failed check does not alter the created token or successful summon.
- [x] 3.10 Extend `applyPreEffects` with a `summonCreature` branch that invokes the creature runtime only after successful casts and leaves `summonItem` behavior unchanged.
- [x] 3.11 Verify against Foundry API docs (v14) for `fromUuid`, `ActiveEffect`, `Actor`, `Scene`, and the existing AppV2/Handlebars application APIs touched by the dialog and sheets.
- [ ] 3.12 Check foundryvtt.wiki for relevant `foundry.utils.deepClone` and `foundry.utils.mergeObject` patterns before injecting runtime selection context.

## 4. Reviewed Compendium Source Data

- [x] 4.1 Identify and review the intended summoning spell source entries in `comp_packs/zauberspruche-und-rituale/_source/` and add only the reviewed `summonCreature` payloads.
- [x] 4.2 Verify each configured creature type maps to existing `system.kreaturentyp` values and each source payload remains valid JSON.
- [x] 4.3 Add a German creature-summoning tutorial or quick-reference entry to the established tutorial-oriented compendium under `comp_packs/`, covering pack setup, summon authoring, optional domination checks, and post-cast behavior.
- [x] 4.4 Run `npm run pack-all` after modifying compendium source data.

## 5. Unit Tests

- [x] 5.1 Add or update `scripts/actors/_spec/kreatur-summoning.spec.js` for default and legacy normalization of `summoningDifficulty` and `summoningCost`.
- [x] 5.2 Add `scripts/effects/pre-effects/_spec/summoned-creatures.spec.js` for configured pack filtering, UUID validation, placement rings, unlinked TokenDocument creation, manual lifecycle, and sheet opening.
- [ ] 5.3 Add bound-resource unit coverage for gAsP/gKaP reservation, insufficient-resource rollback, token provenance, unavailable summoner handling, and exactly-once release after deletion.
- [ ] 5.4 Update `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` for successful `summonCreature` dispatch, failed-cast guards, structured effective lists, and `summonItem` regression.
- [ ] 5.5 Update `scripts/combat/_spec/uebernatuerlich.spec.js` for dependent selector state, selected creature context, replacement difficulty/cost profile behavior, and optional domination configuration.
- [ ] 5.6 Add domination-check unit coverage for the global enable flag, attribute and skill/talent probes, post-token ordering, missing type configuration, and informational success/failure handling.
- [ ] 5.7 Update `scripts/items/sheets/_spec/pre-effect-item.spec.js` and `scripts/items/sheets/_spec/uebernatuerlich-talent.spec.js` for persisted creature-summon authoring data and structured-form controls.
- [ ] 5.8 Extend the template-focused tests for `scripts/items/templates/pre-effects.hbs` and `scripts/items/templates/uebernatuerlich_talent.hbs` to verify inactive branches do not expose unrelated active inputs.
- [x] 5.9 Update `scripts/settings/_spec/weapon-damage-roll-setting.spec.js` or add `scripts/settings/_spec/creature-packs-setting.spec.js` for registration, default, save, reset, and eligible-pack discovery.

## 6. E2E Tests

- [ ] 6.1 Add an E2E scenario under `e2e/cases/e2e-035-creature-summoning/` covering GM creature-pack configuration, dependent selectors, successful cast, nearest available placement, creature-sheet opening, and an optional domination result.
- [x] 6.2 Configure the E2E world with a GM, player caster, active Scene, controlled caster Token, enabled creature Actor pack, and a reviewed summonCreature spell source.
- [ ] 6.3 Promote reusable active-scene-token, creature-pack, and created-token lookup helpers to `e2e/shared/` where they overlap with E2E-034.
- [ ] 6.4 Cover globally disabled and missing-type configurations and verify the summoner is not prompted for an additional roll.
- [ ] 6.5 Cover a spell with a gAsP/gKaP bound-resource cost, verify reservation on the held summoner, and verify release after deleting the summoned token.
- [x] 6.6 Run the existing `e2e/cases/e2e-034-summoned-items/e2e-034-summoned-items.spec.ts` as a regression check for unchanged item summoning.

## 7. Validation and Documentation

- [x] 7.1 Run `npm install` before build or test validation if dependencies are not installed for the current checkout.
- [x] 7.2 Run focused unit tests for the new and updated test files, then run `npm test`.
- [ ] 7.3 Run `npm run lint` and fix only issues introduced by this change.
- [ ] 7.4 Verify against Foundry API docs (v14) and the community wiki for all final API and utility usage before implementation is marked complete.
- [x] 7.5 Update relevant user/developer documentation or quick-reference content for creature summon configuration, manual token lifecycle, and the Kreaturen-Kompendien setting.
