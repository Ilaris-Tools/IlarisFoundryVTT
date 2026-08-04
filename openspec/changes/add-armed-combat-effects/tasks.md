## 1. Data Contract and Effect Materialization

- [ ] 1.1 Verify against Foundry API docs (v14) the `ActiveEffect` and `Actor` embedded-document creation and deletion APIs used by the implementation.
- [ ] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers; document any accessible replacement for the currently unavailable configured wiki URLs before introducing utility code.
- [ ] 1.3 Extend the shared übernatürlich `preEffects` schema with optional, backwards-compatible `armedCombat` configuration: trigger, attack scope, attack/damage contribution, bounded numeric input descriptors, and optional charge settings.
- [ ] 1.4 Define optional charge settings with a positive integral base count plus opt-in, non-negative integral Mächtige-Magie/Liturgie charges-per-QS amplification; default omitted charges to one and keep non-charged effects unamplified.
- [ ] 1.5 Extend the Ilaris ActiveEffect TypeDataModel with validated `system.ilarisArmedCombat` runtime data including remaining charges while preserving existing timing and semantic-modifier fields.
- [ ] 1.6 Add a focused armed-combat utility that normalizes configured numeric inputs and charges, clamps persisted values, materializes attack/damage contributions, and returns a serializable attack-context snapshot without mutating effects.
- [ ] 1.7 Extend the pre-effect processor to pass successful cast-time values and materialized charge counts into each self-targeted armed ActiveEffect independently per application.

## 2. Item Authoring and Cast-Time UI

- [ ] 2.1 Extend the Pre-Effects item-sheet template with editable armed-combat trigger, scope, attack/damage contribution, numeric input, base charge, and conditional Mächtige-Magie/Liturgie charge-amplification fields using German labels.
- [ ] 2.2 Extend `UebernatuerlichTalentSheet` defaults and delegated controls so authors can add, remove, and persist armed-combat numeric input definitions through the existing pre-effect editing pattern.
- [ ] 2.3 Extend `UebernatuerlichDialog` context and Handlebars template to render declared numeric cast-time fields with configured defaults and bounds.
- [ ] 2.4 Read submitted cast-time values at the committed successful-cast boundaries, including normal difficulty and manual energy-confirmation flows, without persisting failed casts.

## 3. Actor Effect State Display

- [ ] 3.1 Verify against Foundry API docs (v14) the prepared ActiveEffect duration surface produced by `ActiveEffect#updateDuration` before choosing the native duration field for the Held effect-row context.
- [ ] 3.2 Prepare dedicated Held effect-row view data that prefers `system.ilarisTiming.remaining` for owner-turn effects and otherwise exposes a finite prepared native duration.
- [ ] 3.3 Update `scripts/actors/templates/held/tabs/effekte.hbs` to display `Dauer: <value>` from the prepared view data and `Ladungen: <remaining>` only for armed effects.
- [ ] 3.4 Add or update `scripts/actors/_spec/` coverage for owner-turn duration, native duration, armed charges, and effects without either lifecycle label.

## 4. Armed-Attack Combat Integration

- [ ] 4.1 Verify against Foundry API docs (v14) the Actor and ActiveEffect document methods used when decrementing or removing an armed effect after a matching attack resolves.
- [ ] 4.2 Add attack-context preparation to melee and ranged combat dialogs so matching armed effects contribute to the initial attack formula and preserve their materialized damage contribution for that same attack.
- [ ] 4.3 Serialize the attack context through existing defense prompt data and keep it available to the originating attack dialog for its follow-up damage roll.
- [ ] 4.4 Add a shared armed-attack helper for direct success, failed-attack, and defense-resolution paths; it must decrement only the snapshotted source effect IDs with `Actor#updateEmbeddedDocuments`, remove only exhausted effects with `Actor#deleteEmbeddedDocuments`, and must not re-resolve arbitrary effects.
- [ ] 4.5 Ensure every matching attack consumes armed-effect charges, while a failed attack or successful defense does not apply armed damage; a nonmatching attack type, preview, or standalone manual damage roll leaves armed effects and their charge count unchanged.
- [ ] 4.6 Include a confirmed armed damage contribution in the associated damage formula after the source effect has been decremented or removed, without changing ordinary semantic modifier stacking or unrelated damage behavior.

## 5. Initial Compendium Coverage

- [ ] 5.1 Configure `Falkenauge Meisterschuss` in `comp_packs/zauberspruche-und-rituale/_source/` as a self-targeted armed ranged-attack effect with one charge, including its stated Mächtige-Magie attack bonus; consume that charge on the next matching ranged attack regardless of its outcome.
- [ ] 5.2 Configure `Neun Streiche in einem` in `comp_packs/liturgien-und-mirakel/_source/` as a self-targeted armed attack effect with the bounded `Bisherige Treffer auf Ziel` input, `1W6` per stored hit, `8W6` cap, explicit charge configuration, and stated Mächtige-Liturgie attack bonus; consume the charge on the next matching attack, but apply its damage only on a hit.
- [ ] 5.3 Update source-data expectations and deferred-mechanics documentation so these two effects are no longer categorized as unsupported next-roll behavior.
- [ ] 5.4 Run `npm run pack-all` after modifying compendium `_source/` data.

## 6. Unit Tests

- [ ] 6.1 Create or extend `scripts/effects/pre-effects/_spec/armed-combat-effects.spec.js` with pure normalization, clamping, input and charge materialization, opt-in charge amplification, and independent-application coverage.
- [ ] 6.2 Update `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` to assert that armed pre-effects produce valid ActiveEffect runtime payloads and do not alter legacy pre-effects.
- [ ] 6.3 Create or extend focused `scripts/combat/_spec/` coverage for attack-context snapshots, direct hits, misses, failed defenses, successful defenses, per-attack `Actor#updateEmbeddedDocuments` charge decrements, and final-charge `Actor#deleteEmbeddedDocuments` expiration.
- [ ] 6.4 Update `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js` to verify Falkenauge Meisterschuss and Neun Streiche in einem source configuration, including Neun-Streiche's `0..8` input and `W6` cap.
- [ ] 6.5 Run the affected Jest test files after `npm install` and resolve failures within this change's scope.

## 7. E2E Tests

- [ ] 7.1 Create an E2E case under `e2e/cases/` using `HatAlles`, the existing spell-dialog helpers, and actor snapshot restoration to verify a charged Neun-Streiche cast accepts a count, applies its matching damage only on confirmed hits, consumes a charge on every matching attack, and removes the effect only at zero.
- [ ] 7.2 Add E2E scenarios proving a failed or successfully defended matching attack consumes its charge without applying armed damage, while an ineligible attack type retains the armed effect with its charge count unchanged.
- [ ] 7.3 Add E2E coverage for Falkenauge Meisterschuss applying its next-eligible-ranged-attack bonus per charge and consuming that charge on a hit, miss, or successful defense.
- [ ] 7.4 Run the new case and regress `e2e-009-uebernatuerlich-dialog`, `e2e-027-pre-effect-sheet-config`, and `e2e-028-pre-effect-buff-creation`; promote a confirmed-hit helper into `e2e/shared/` only if at least two cases reuse it.

## 8. Final Validation

- [ ] 8.1 Run `npm install` if dependencies are not already installed for this workspace.
- [ ] 8.2 Run `npm test`.
- [ ] 8.3 Run `npm run lint`.
- [ ] 8.4 Re-run `openspec validate` using the local CLI's supported change-validation syntax and resolve any artifact validation errors.
