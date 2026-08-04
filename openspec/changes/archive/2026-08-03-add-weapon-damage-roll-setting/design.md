## Context

Hammerschlag is defined as a `WEAPON_DAMAGE` multiplier in compendium data. The combat modifier pipeline currently renders that multiplication as a parenthesized formula, so a base damage formula such as `2W6+3` becomes `(2W6+3)*2` and the evaluated result is doubled. Some worlds use the former system behavior: duplicate the base weapon formula before rolling, yielding `4W6+6`.

The selected interpretation is a world rule, not a client preference: all participants must see and roll the same formula. The default must remain the current result-multiplication behavior. Hammerschlag is the only current `WEAPON_DAMAGE` multiplier, but the implementation must operate on the modifier type rather than maneuver name so that future rules use the selected convention consistently.

## Goals / Non-Goals

**Goals:**

- Provide a GM-managed, world-scoped, opt-in boolean setting for expanding `WEAPON_DAMAGE` multiplier formulas.
- Preserve `(base formula)*multiplier` while the setting is disabled.
- Expand both dice counts and numeric weapon-damage terms while the setting is enabled, so `2W6+3` multiplied by `2` becomes `4W6+6`.
- Keep non-weapon damage modifiers outside the expanded formula.

**Non-Goals:**

- Changing Hammerschlag's compendium data, description, or default behavior.
- Applying the setting to `ATTACK`, `DEFENCE`, `DAMAGE`, `SPECIAL_RESOURCE`, or other modification types.
- Providing per-actor, per-item, per-maneuver, or client-scoped overrides.
- Supporting rule-specific exceptions beyond the generic `WEAPON_DAMAGE` multiplier contract.

## Decisions

### Use a world-scoped boolean with the current behavior as its default

Register a boolean setting through the existing settings registry, expose it in the GM-only Allgemein tab, persist it through the existing dialog save path, and include it in the dialog reset defaults. Set its default to `false` so existing worlds continue to roll `(2W6+3)*2` unless a GM explicitly enables expansion.

This follows the existing settings architecture and Foundry's documented world scope for shared rule variants. A client setting would allow conflicting roll behavior among users, while a per-maneuver setting would exceed the requested scope.

### Transform only `WEAPON_DAMAGE` multiplier formulas using Foundry's roll API

When a `WEAPON_DAMAGE` modification has the `MULTIPLY` operator and the world setting is enabled, create a Foundry [`Roll`](https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html) from the current base weapon formula and use its documented [`Roll#alter`](https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html#alter) operation with the multiplier and numeric-term multiplication enabled. Use the returned standardized formula as the updated weapon-damage formula.

`Roll#alter` is selected over regular-expression or manual string rewriting because it parses dice terms and can intentionally multiply numeric terms. This produces the confirmed desired result `2W6+3 -> 4W6+6` while retaining valid Foundry formula handling. With the setting disabled, retain the current parenthesized multiplication branch unchanged.

The implementation must preserve the existing modifier ordering: only `rollValues.schaden` is expanded; later flat `mod_dm` adjustments are appended by the damage-roll path and therefore are not multiplied.

### Keep the setting reusable but limit its present semantic scope

The condition is based on modifier type and operator, not `manoeverName === 'Hammerschlag'`. This lets any future `WEAPON_DAMAGE` multiplier follow the world rule without a new special case. It does not affect other modifier types or operators.

### API Surface

- [`foundry.helpers.ClientSettings`](https://foundryvtt.com/api/v14/classes/foundry.helpers.ClientSettings.html): existing `game.settings.register`, `game.settings.get`, and `game.settings.set` calls register, read, and persist the world setting.
- [`foundry.dice.Roll`](https://foundryvtt.com/api/v14/classes/foundry.dice.Roll.html): construct a roll from the weapon-damage formula and call `alter(multiply, add, multiplyNumeric)` to expand its dice and numeric terms.
- Hooks: none are registered, called, or modified by this change.
- `foundry.utils.*`: none are required. The community wiki identifies Roll and Settings as the applicable API areas; the official API provides the required roll transformation and setting lifecycle methods.

## Risks / Trade-offs

- [Malformed or unsupported custom weapon formula] → Let Foundry's Roll parser be the single parser; retain the normal formula unchanged if the transformation cannot safely produce a valid formula, with a diagnostic warning rather than a broken roll.
- [Formula display normalization] → `Roll#alter` can standardize notation and spacing. Tests assert semantic formula expansion, not arbitrary original whitespace.
- [Future multiplier semantics] → Applying the option to all `WEAPON_DAMAGE` multipliers is intentional. The setting label and hint must state that it governs weapon-damage multipliers, not Hammerschlag alone.
- [Jest does not provide a complete Roll implementation] → Isolate transformation in a pure helper or inject a minimal Roll mock in the existing modifier-helper unit tests.

## Migration Plan

1. Add the setting with `false` as its registered default.
2. Existing worlds obtain the default unless a GM enables the setting; no document or compendium migration is needed.
3. A rollback removes the code path and setting registration. Existing persistent world-setting data can remain harmlessly unused.

## Open Questions

None. The confirmed opt-in result is `2W6+3 -> 4W6+6`; current result multiplication remains the default.

## Testing Strategy

- Extend `scripts/combat/_spec/shared_dialog_helpers.test.js`, which already uses pure `processModification` tests and Jest mocks. Cover disabled multiplication, enabled dice-and-numeric expansion, and a later flat damage modifier remaining outside the expanded base weapon formula.
- Add a focused settings registration/dialog test if a suitable test file is introduced; otherwise cover registry behavior through the existing Jest Foundry `game.settings` mocks and the end-to-end settings flow.
- Add an E2E test based on `e2e/cases/e2e-031-damage-type-settings/e2e-031-damage-type-settings.spec.ts`: a GM opens Allgemein, toggles the setting, saves it, verifies persistence, and restores the original setting after the test.
- Add a combat E2E scenario only if the test world can reliably invoke a Hammerschlag damage roll and inspect its formula. It requires one GM, a world actor with a `2W6+3` weapon, and Hammerschlag; no target or player client is needed for direct damage rolling.
