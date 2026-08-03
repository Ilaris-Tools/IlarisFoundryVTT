## 1. World Setting

- [x] 1.1 Verify against Foundry API docs (v14) that `game.settings.register`, `game.settings.get`, and `game.settings.set` use the documented `ClientSettings` signatures and world scope.
- [x] 1.2 Add a named boolean setting constant for opt-in weapon-damage formula expansion in `scripts/settings/configure-game-settings.model.js`.
- [x] 1.3 Register the world-scoped setting with `config: false` and a `false` default in `scripts/settings/configure-game-settings.js`.
- [x] 1.4 Add the GM-visible Allgemein-tab checkbox, German label, world scope indicator, and rule-focused hint in `scripts/settings/templates/ilaris-settings_general.hbs`.
- [x] 1.5 Read, save, and reset the setting through `scripts/settings/ilaris-settings.dialog.js` using the existing settings-dialog patterns.

## 2. Weapon-Damage Multiplier Processing

- [x] 2.1 Verify against Foundry API docs (v14) that `Roll#alter(multiply, add, multiplyNumeric)` expands both dice and numeric formula terms as required.
- [x] 2.2 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers before adding any formula manipulation; use Foundry's Roll API rather than a custom string parser.
- [x] 2.3 Update `scripts/combat/dialogs/shared-dialog-helpers.js` so enabled `WEAPON_DAMAGE` `MULTIPLY` modifications expand the current base weapon formula through `Roll#alter` with numeric multiplication.
- [x] 2.4 Preserve the existing parenthesized result-multiplier formula while the setting is disabled and preserve existing behavior for all non-`WEAPON_DAMAGE` modification types.
- [x] 2.5 Ensure flat `DAMAGE` modifiers remain outside an expanded weapon formula and that invalid custom formulas fail safely without preventing a damage roll.

## 3. Unit Tests

- [x] 3.1 Update `scripts/combat/_spec/shared_dialog_helpers.test.js` with disabled-setting coverage for the existing result-multiplication formula.
- [x] 3.2 Add enabled-setting coverage showing a `WEAPON_DAMAGE` multiplier transforms `2W6+3` into `4W6+6`, using a focused Foundry Roll mock where needed.
- [x] 3.3 Add coverage proving separate flat `DAMAGE` modifiers and other modifier types are not expanded by the setting.
- [x] 3.4 Add or update focused settings registration/dialog tests for the setting's default, persistence, and reset behavior.
- [x] 3.5 Run the focused Jest test files and resolve failures.

## 4. E2E Tests

- [x] 4.1 Extend `e2e/cases/e2e-031-damage-type-settings/e2e-031-damage-type-settings.spec.ts` or add a focused settings scenario that opens Allgemein as a GM, enables the setting, saves it, verifies persistence, and restores the original world setting.
- [x] 4.2 Create `e2e/cases/e2e-032-weapon-damage-roll-setting/` coverage for a GM rolling Hammerschlag with a `2W6+3` weapon: verify default result multiplication and opt-in `4W6+6` formula expansion. Use a world actor with Hammerschlag and the weapon; no player or target is required for direct damage rolling.
- [x] 4.3 Run the affected E2E cases and regression-verify `e2e-031-damage-type-settings`.

## 5. Validation

- [x] 5.1 Run `npm install` before build or test validation.
- [x] 5.2 Run `npm test`.
- [x] 5.3 Run `npm run lint`.
- [x] 5.4 Verify disabled and enabled behavior manually in Foundry with Hammerschlag, including the displayed and rolled formulas.
