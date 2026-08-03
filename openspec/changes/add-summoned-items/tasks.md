## 0. Pre-Apply Blockers

**Do not start `/opsx:apply` until every task in this section is complete.**

- [ ] 0.1 Manually create and review the canonical source Items: Phexens Wurfstern, Armalion, Lagorax' Hammer, Firuns Ring, Heiliger Trichter Hesindes, Phexens Meisterschlüssel, Heiliger Kessel, and Schimmernder Schild. Do not infer any Item type, statistic, effect, or disappearance rule from the source text.
- [ ] 0.2 Add the manually reviewed source Items to the intended configured summon catalog and record their final UUIDs.
- [ ] 0.3 Run `npm run pack-all` after the manual source Item changes.
- [ ] 0.4 Verify that a separate, generic item-aware post-roll expiry capability exists, identifies the Actor and Item used, and covers one-use summons. This prerequisite is out of scope for this change.

## 1. Summon-Item Data and Catalog

- [ ] 1.1 Define the `summonItem` pre-effect configuration, including source UUID, owner-turn duration, and Item-data overrides with Mächtige-Magie fields.
- [ ] 1.2 Populate the pre-effect sheet context with source Items from the configured `waffenPacks` catalog and expose the summon-item controls in `scripts/items/templates/pre-effects.hbs`.
- [ ] 1.3 Validate that configured source UUIDs resolve only from the active catalog and provide a user-facing failure without partial Item creation.
- [ ] 1.4 Verify against Foundry API docs (v14) for Item source serialization and configured compendium access.
- [ ] 1.5 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers for safe source data copying.

## 2. Summon-Item Processor

- [ ] 2.1 Add the successful-cast processor path that resolves the source Item, materializes overrides, and creates one Actor-owned clone per selected target.
- [ ] 2.2 Attach Ilaris provenance flags with source UUID, caster/spell metadata, pre-effect index, and an independent application ID to each clone and its marker.
- [ ] 2.3 Preserve Item-owned transferable effects and apply configured Item-data overrides only to the created clone.
- [ ] 2.4 Set a summoned melee or ranged weapon as Hauptwaffe and clear the prior main weapon of the same type without restoring it on expiry.
- [ ] 2.5 Keep every summoned copy independent in both `ilaris` and `foundry` stacking modes.
- [ ] 2.6 Verify against Foundry API docs (v14) for `Actor#createEmbeddedDocuments`, `Actor#updateEmbeddedDocuments`, `Actor#deleteEmbeddedDocuments`, `Item#toObject`, and `Actor#allApplicableEffects`.
- [ ] 2.7 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers for clone-data preparation and path updates.

## 3. Owner-Turn Cleanup

- [ ] 3.1 Create an owner-turn marker ActiveEffect for every summoned clone using the existing Ilaris timing schema.
- [ ] 3.2 Extend `scripts/effects/combat-turn-hooks.js` so marker expiry deletes only its linked Item before deleting the marker, tolerating a clone that was already removed manually.
- [ ] 3.3 Verify against Foundry API docs (v14) for `combatTurn(combat, updateData, updateOptions)`, `combatRound(combat, updateData, updateOptions)`, and the generic update-document callback used by `updateCombat`.
- [ ] 3.4 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers before adding timing or cleanup utilities.

## 4. W3 and W20 Formula Support

- [ ] 4.1 Extend `parseIlarisModifierValue` to accept linear additive W3, W6, and W20 terms and calculate their correct expected values.
- [ ] 4.2 Preserve rejection of unsupported dice and non-linear expressions.
- [ ] 4.3 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers before introducing formula-parsing utilities.

## 5. Reviewed Summoning Data

- [ ] 5.1 Configure `summonItem` pre-effects for Phexens Sternenwurf, Segen der Heiligen Ardare, Largorax' Hammer, Firuns Einsicht, Ingalfs Alchemie, Phexens Meisterschlüssel, Speisung der Bedürftigen's Heiliger Kessel, and Fortifex's Schimmernder Schild using the manually reviewed UUIDs.
- [ ] 5.2 Configure Phexens Wurfstern's `+1W20` per Mächtige Magie QS as a clone-scoped Item override and leave its after-roll removal to the external prerequisite.
- [ ] 5.3 Run `npm run pack-all` after the compendium source changes.

## 6. Unit Tests

- [ ] 6.1 Extend `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` for valid source resolution, target fan-out, clone overrides, provenance, Hauptwaffe selection, and independent copies in both stacking modes.
- [ ] 6.2 Extend `scripts/effects/_spec/active-effect-timing.test.js` or add a focused timing spec for linked summoned-Item cleanup and missing-item idempotence.
- [ ] 6.3 Extend `scripts/effects/utils/_spec/ilaris-modifier-resolver.spec.js` for accepted W3/W20 formulas, expected-value comparisons, and rejected W8/non-linear inputs.
- [ ] 6.4 Extend `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js` for audited source UUIDs, owner-turn durations, and Phexens Wurfstern's W20 override.

## 7. E2E Tests

- [ ] 7.1 Add a Playwright summon-item scenario using the existing GM and `HatAlles` world actor to cover selected-target inventory creation and Hauptwaffe selection.
- [ ] 7.2 Add owner-turn advancement and independent-multiple-copy assertions, covering both supernatural stacking settings.
- [ ] 7.3 Regression-run `e2e/cases/e2e-027-pre-effect-sheet-config/e2e-027-pre-effect-sheet-config.spec.ts` and `e2e/cases/e2e-028-pre-effect-buff-creation/e2e-028-pre-effect-buff-creation.spec.ts`.
- [ ] 7.4 Promote any reusable Item inventory snapshot or cleanup fixture to `e2e/shared/fixtures/foundry.ts`.

## 8. Final Validation

- [ ] 8.1 Run `npm test`.
- [ ] 8.2 Run `npm run lint`.
- [ ] 8.3 Run the focused summon-item and affected pre-effect E2E tests.
- [ ] 8.4 Run `openspec validate add-summoned-items --strict`.
