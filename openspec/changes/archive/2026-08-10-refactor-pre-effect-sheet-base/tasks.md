## 1. AppV2 and shared-base preparation

- [x] 1.1 Verify `ItemSheetV2` named parts plus `_prepareContext` and `_onRender` lifecycle usage against the Foundry VTT v14 API documentation.
- [x] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.deepClone` guidance before moving the mutable Pre-Effect array operations.
- [x] 1.3 Identify and preserve the public imports/registrations of `UebernatuerlichTalentSheet` and `ManoeverSheet`; no sheet registration API change is intended.

## 2. Shared Pre-Effect Item sheet base

- [x] 2.1 Create `PreEffectItemSheet` under `scripts/items/sheets/` as the `IlarisItemSheet` subclass owning the shared `preEffects` part and standard Pre-Effect editor context.
- [x] 2.2 Move unchanged generic default factories, indexed-array normalization, delegated add/remove handlers, summon source options, and change-key autocomplete into the shared base.
- [x] 2.3 Preserve the generic Pre-Effect template data contract, including conditions, resistance selects, damage types, Ilaris modifiers, summon items, and armed combat fields.

## 3. Concrete sheet refactor

- [x] 3.1 Refactor `UebernatuerlichTalentSheet` to extend `PreEffectItemSheet`, retain its supernatural form and owned-item skill context, and keep its LLM request implementation local.
- [x] 3.2 Refactor `ManoeverSheet` to extend `PreEffectItemSheet` directly, retain its maneuver form/actions, and provide only the maneuver activation context needed by the shared template.
- [x] 3.3 Update static `PARTS` and `DEFAULT_OPTIONS` composition so both children render their own form and the shared Pre-Effect part without dropping inherited AppV2 behavior.
- [x] 3.4 Update `scripts/items/templates/pre-effects.hbs` so the generation button is controlled by supernatural-only generation context while standard Pre-Effect authoring remains unchanged for compatible sheets.

## 4. Unit Tests

- [x] 4.1 Create `scripts/items/sheets/_spec/pre-effect-item.spec.js` for shared base defaults, normalized indexed data, and delegated Pre-Effect add/remove operations.
- [x] 4.2 Update `scripts/items/sheets/_spec/uebernatuerlich-talent.spec.js` to verify the supernatural form, shared part, and LLM availability stay correctly composed.
- [x] 4.3 Update `scripts/items/sheets/_spec/manoever.spec.js` to verify direct sibling inheritance, maneuver form/actions, shared Pre-Effect part, and absence of LLM generation.
- [x] 4.4 Add a template/context regression assertion that a configured GM sees generation only on an übernatürlich sheet.

## 5. E2E Tests

- [x] 5.1 Regression-run `e2e/cases/e2e-027-pre-effect-sheet-config/` in `ilaris-e2e-world-v14363-r1` as `e2e-gm` to confirm standard Pre-Effect editing still works.
- [x] 5.2 Regression-run `e2e/cases/e2e-035-maneuver-pre-effects/` in the same world as `e2e-gm` to confirm maneuver-specific Pre-Effect authoring and application still work.

## 6. Validation

- [x] 6.1 Run `npm install` before validation.
- [x] 6.2 Run focused Jest sheet tests and then `npm test`.
- [x] 6.3 Run `npm run lint` and review only files belonging to this refactor.
- [x] 6.4 Run the focused existing E2E cases with `npm run test:e2e` once Foundry and the requested world are available.
