## 1. API and implementation discovery

- [ ] 1.1 Verify `Actor#allApplicableEffects()` and `Actor#applyActiveEffects(phase)` against Foundry API docs (v14), including the active-effect phase used by the Ilaris Actor preparation flow.
- [ ] 1.2 Verify `ActiveEffect`, `ActiveEffect#shouldApplyChange`, `isSuppressed`, `ActiveEffectConfig`, TypeDataModel schema fields, and `game.settings` against Foundry API docs (v14).
- [ ] 1.3 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers before cloning/merging ActiveEffect or Pre-Effect data, and record the selected helper or the reason none is needed.
- [ ] 1.4 Trace current Actor preparation, weapon Fertigkeit/Talent data, combat formulas, and FertigkeitDialog context to finalize the initial canonical Ilaris target IDs and selector normalization rules.

## 2. Rule-aware ActiveEffect data and resolver

- [ ] 2.1 Extend `scripts/effects/model-data/ilaris-effect-model.js` with validated `ilarisSource` and `ilarisModifiers` fields, preserving `ilarisTiming` and native `changes` compatibility.
- [ ] 2.2 Add canonical target, phase, source-category, stacking-policy, selector, and comparison-value constants/configuration with German UI labels where users see them, including one damage comparison group for TP/Waffenschaden effects and roll-only main-attribute targets.
- [ ] 2.3 Create a pure `scripts/effects/utils/ilaris-modifier-resolver.js` that collects active applicable effects, matches selectors, adds ordinary contributions, selects the strongest matching supernatural component across and within effects in Ilaris mode, and returns a value plus explanation ledger.
- [ ] 2.4 Implement deterministic comparison magnitude handling for numeric and linear `XW6` values, explicit comparison values, signed effects, and validation/rejection of unsupported formula shapes; keep all effect magnitudes independent of later maneuvers.
- [ ] 2.5 Ensure resolver suppression is transient and component-local; do not set `disabled`, `isSuppressed`, or persist a losing effect state.

## 3. ActiveEffect lifecycle and configuration

- [ ] 3.1 Integrate only prepare-capable resolution into the verified Ilaris Actor ActiveEffect preparation boundary in `scripts/actors/data/actor.js`, after core changes and before dependent derived calculations, without persisting Actor data; reject or route semantic main-attribute modifiers to roll resolution.
- [ ] 3.2 Add a German Ilaris-Modifikatoren part/tab to `scripts/effects/ilaris-effect-config.js` and a dedicated Handlebars template alongside `ilaris-duration-tab.hbs`.
- [ ] 3.3 Implement add, edit, remove, validation, and form persistence for source category, phase, target, value, stacking policy, comparison value, and Fertigkeit/Talent/Situation selectors.
- [ ] 3.4 Keep the native Foundry Changes tab unchanged and verify a single ActiveEffect can use both channels without double application.

## 4. Roll and world-setting integration

- [ ] 4.1 Register `supernaturalEffectStacking` in `scripts/settings/configure-game-settings.js` and its central constant in `configure-game-settings.model.js` as a world-scoped setting with `ilaris` default and `foundry` alternative.
- [ ] 4.2 Add the German setting control and explanation to `scripts/settings/ilaris-settings.dialog.js` and the appropriate settings Handlebars template; retain `config: false` management through the Ilaris dialog.
- [ ] 4.3 Route melee attack, defense, and damage contexts in `scripts/combat/dialogs/angriff.js`, `fernkampf-angriff.js`, and shared dialog helpers through the resolver, including weapon Fertigkeit and Talent; append selected effect-derived damage after maneuver transformations.
- [ ] 4.4 Render resolved Ilaris effect modifiers in the combat summaries without obscuring existing manual, status, environment, or maneuver modifiers.
- [ ] 4.5 Route FertigkeitDialog and attribute/talent probe contexts through the resolver in the dice flow, including tested main attributes and an explicit `sozialesDuell` situation when supplied by the caller; do not mutate prepared attributes or derived values.
- [ ] 4.6 Preserve current ordinary status and manual modifiers as normal additive behavior while integrating semantic AT, VT, TP, Waffenschaden, GS, and probe outputs.

## 5. Pre-Effects, generation, and compendium migration

- [ ] 5.1 Extend the übernatürlich item model, `scripts/items/sheets/uebernatuerlich-talent.js`, and `scripts/items/templates/pre-effects.hbs` with a separate editable `ilarisModifiers` list alongside native changes.
- [ ] 5.2 Update `scripts/effects/pre-effects/pre-effects-processor.js` so spell Pre-Effects copy native changes and semantic modifiers to their distinct ActiveEffect fields and classify the created effect as `uebernatuerlich` while retaining origin flags.
- [ ] 5.3 Update `scripts/effects/utils/llm-prompt-builder.js` so generated Pre-Effect JSON distinguishes `changes` from `ilarisModifiers`, documents selectors, and retains the native-change option.
- [ ] 5.4 Migrate Axxeleratus in `comp_packs/zauberspruche-und-rituale/_source/` to +4 GS prepare and +2 AT/+2 VT roll Ilaris modifiers using supernatural strongest-effect stacking.
- [ ] 5.5 Review other existing spell buff/debuff source entries for the same semantic pattern and migrate only entries that require Ilaris suppression or contextual selection.
- [ ] 5.6 Run `npm run pack-all` after all `_source/` compendium changes.

## 6. Unit Tests

- [ ] 6.1 Add `scripts/effects/utils/_spec/ilaris-modifier-resolver.spec.js` covering selector matches, a +1 AT general plus +2 AT/Klingenwaffen supernatural pair on the same effect resolving to +2, partial overlap, ordinary plus supernatural totals, stronger-effect expiry reactivation, and Foundry stack mode.
- [ ] 6.2 Add resolver comparison tests for fixed values, positive/negative magnitude, linear `XW6` expected values, explicit comparison values, unsupported formula validation, transferred item effects, and a +3 TP versus +2 Waffenschaden case unaffected by Hammerschlag/Unaufhaltsam.
- [ ] 6.3 Update or add Actor preparation tests under `scripts/actors/_spec/` to prove prepare modifiers run after native effect changes, before derived values, and never persist an Actor update; prove that semantic GE/KK modifiers cannot alter prepared attributes or GS.
- [ ] 6.4 Update `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` to verify separate native/semantic payload mapping and supernatural source classification.
- [ ] 6.5 Update `scripts/effects/utils/_spec/llm-prompt-builder.spec.js` for the expanded generated JSON schema and selector guidance.
- [ ] 6.6 Update `scripts/combat/_spec/angriff.spec.js` and `fernkampf_angriff.spec.js` for contextual AT, VT, and linear damage modifier integration.
- [ ] 6.7 Add or update dice tests under `scripts/dice/_spec/` for Fertigkeit/Talent and social-duel situation modifiers, including semantic GE/KK bonuses applied only when the probe tests that attribute.
- [ ] 6.8 Add focused configuration/model tests for defaults, validation, and coexistence of native changes with `ilarisModifiers`.

## 7. E2E Tests

- [ ] 7.1 Extend the Pre-Effect sheet configuration E2E scenario to add, save, reopen, and edit an Ilaris modifier with selectors and stacking policy.
- [ ] 7.2 Extend the buff ActiveEffect E2E scenario to assert `system.ilarisModifiers`, supernatural source classification, duration, and preservation of any native changes.
- [ ] 7.3 Add an E2E scenario in the existing GM baseline world for two competing supernatural buffs in the same combat or probe context, asserting only the stronger contribution in Ilaris mode.
- [ ] 7.4 Extend that scenario to switch the world setting to Foundry stack mode and assert both existing effects add without recreation.
- [ ] 7.5 Run affected existing E2E regressions for effects tab, pre-effect sheet/buff, melee, ranged, and skill dialog flows.

## 8. Documentation and validation

- [ ] 8.1 Document the world setting, Ilaris-Modifikatoren authoring model, source classification, partial suppression behavior, and known non-linear damage limitation in the German user documentation and in-game settings quick reference where applicable.
- [ ] 8.2 Run `npm install` before any test, lint, or pack validation command.
- [ ] 8.3 Run `npm test` and resolve regressions.
- [ ] 8.4 Run `npm run lint` and resolve style violations.
- [ ] 8.5 Confirm the built compendium and all changed artifacts are represented in the final OpenSpec task completion report.
