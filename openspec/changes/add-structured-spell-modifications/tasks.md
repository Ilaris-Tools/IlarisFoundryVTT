## 1. API and implementation preparation

- [ ] 1.1 Run `npm install` and inspect the existing supernatural data-model helper, Item sheet, dialog, maneuver parser, and pre-effect processor boundaries.
- [ ] 1.2 Verify `Item`, `ActiveEffect`, `ApplicationV2`, and `HandlebarsApplicationMixin` usage against Foundry API docs (v14); record that no new Hook is needed.
- [ ] 1.3 Check foundryvtt.wiki for relevant `foundry.utils.deepClone` and `mergeObject` helpers before adding context/data utilities.

## 2. Structured data and context resolution

- [ ] 2.1 Add optional `spellModifications` and `spellModificationGroups` schema fields to the shared supernatural talent data model with backwards-compatible defaults.
- [ ] 2.2 Implement a pure structured-form normalizer and `resolveSpellModificationContext(item, selectedIds)` helper for ids, required/exclusive groups, profile overrides, and source-order validation.
- [ ] 2.3 Implement deterministic effective pre-effect composition: omitted mode/`inherit`, `extend`, and `replace`.
- [ ] 2.4 Verify the Item/data update flow against Foundry API docs (v14).
- [ ] 2.5 Check foundryvtt.wiki for relevant `foundry.utils.*` data-copy/merge helpers used by the resolver.

## 3. Supernatural dialog integration

- [ ] 3.1 Prepare structured form groups, choices, and effective profile data in `UebernatuerlichDialog` without persisting a player's selection.
- [ ] 3.2 Render a dedicated German **Zaubermodifikationen** section with optional checkboxes, exclusive radios, required-group validation, descriptions, and effective profile summary.
- [ ] 3.3 Feed effective difficulty, energy cost, and profile/cast chat summary into the existing roll/cost paths while leaving ordinary maneuver accounting unchanged.
- [ ] 3.4 Dispatch the resolved effective pre-effect list after successful standard and manually confirmed casts.
- [ ] 3.5 Verify dialog rendering/application behavior against Foundry API docs (v14).
- [ ] 3.6 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers before constructing dialog-local snapshots.

## 4. Pre-effect and source tracking integration

- [ ] 4.1 Extend the pre-effect processor entry point to accept an explicit effective list without changing existing resistance, timing, stacking, or summon behavior.
- [ ] 4.2 Record the selected structured form id in persistent effect provenance when a form produces an ActiveEffect.
- [ ] 4.3 Preserve source Item behavior when no form is selected and verify replacement forms do not apply base pre-effects.
- [ ] 4.4 Verify ActiveEffect creation/provenance behavior against Foundry API docs (v14).
- [ ] 4.5 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers for safe pre-effect payload copies.

## 5. Item-sheet authoring and legacy parser behavior

- [ ] 5.1 Extract/reuse the existing pre-effect card markup and handlers for structured spell-form pre-effects.
- [ ] 5.2 Add supernatural Item-sheet controls to create, edit, reorder, and delete groups/forms, profile values, modes, and nested pre-effects.
- [ ] 5.3 Change `CombatItem.setManoevers()` so legacy text parsing remains only for Items with no structured forms and structured Items avoid generated duplicates.
- [ ] 5.4 Verify `Item#update` and AppV2 Item-sheet behavior against Foundry API docs (v14).
- [ ] 5.5 Check foundryvtt.wiki for relevant `foundry.utils.deepClone` array-edit patterns.

## 6. Reviewed compendium source data

- [ ] 6.1 Add Attributo's required eight-attribute form group with replacement roll-only Ilaris modifiers; ensure no raw main attribute or derived value is changed.
- [ ] 6.2 Add Miasmafaxius as an inherited Tlalucs Odem form with its reviewed profile overrides.
- [ ] 6.3 Add Schimmernder Schild as a replacement Fortifex form using a configured shield source UUID and established summoned-item timing.
- [ ] 6.4 Identify every generic anti-magic source Item and author its required exclusive Gegenzauber, Magie unterdruecken, Zauber aufheben, and Wesenheit bannen form group with the supplied profile/rules text.
- [ ] 6.5 Ensure unsupported anti-magic outcomes are visibly reported but remain player/GM-managed; do not encode reaction, zone, dispel, or entity automation.
- [ ] 6.6 Run `npm run pack-all` after all `_source/` changes, with Foundry closed.

## 7. Unit Tests

- [ ] 7.1 Create/update resolver tests for normalization, unknown ids, optional/exclusive/required groups, conflicting overrides, cost/difficulty composition, all three modes, and legacy fallback.
- [ ] 7.2 Update `scripts/items/_spec_/combat.spec.js` for structured-source suppression and unstructured parser regression.
- [ ] 7.3 Update `scripts/combat/_spec_/uebernatuerlich_roll.spec.js` for dialog-local selections, validation, effective cost/difficulty, chat summary, and effective-list dispatch.
- [ ] 7.4 Update pre-effect processor tests for explicit effective lists and selected-form provenance without regressing source behavior.
- [ ] 7.5 Add Item-sheet tests for group/form and nested pre-effect persistence.

## 8. E2E Tests

- [ ] 8.1 Add an E2E scenario: a player selects Attributo's FF form, successfully casts it, and receives only roll-scoped +2/+1 bonuses.
- [ ] 8.2 Add an E2E scenario: Miasmafaxius applies Pestgestank's inherited outcome with its altered cast profile.
- [ ] 8.3 Add an E2E scenario: Schimmernder Schild replaces Fortifex's outcome and summons/cleans up the configured shield Item.
- [ ] 8.4 Add an E2E scenario: an anti-magic talent requires exactly one selectable form and reports the player/GM-managed outcome.
- [ ] 8.5 Add an E2E regression scenario for legacy text-only spell modifications; extract repeated helpers into `e2e/shared/` only when reusable.

## 9. Validation and review

- [ ] 9.1 Run the focused unit suites, then `npm test`.
- [ ] 9.2 Run `npm run lint`.
- [ ] 9.3 Run the affected E2E scenarios in the configured Foundry world with a GM, player caster, target Actor, and configured spell/item packs.
- [ ] 9.4 Review source data, task completion, and active-effect/chat output against the specs; run `openspec validate add-structured-spell-modifications --strict`.
