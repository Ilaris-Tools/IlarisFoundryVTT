## 1. Reviewed Spell and Liturgy Source Data

- [x] 1.1 Verify the existing `ActiveEffect` and `Actor#createEmbeddedDocuments` duration behavior against the Foundry VTT v14 API documentation.
- [x] 1.2 Add the 16-Initiativephase semantic GS/AT/VT pre-effect for `Tanz der Schwerter`.
- [x] 1.3 Add the 64-Initiativephase named-talent pre-effects for `Adlerauge Luchsenohr` and `Adlerauge Luchsenohr (Tiergeist)`.
- [x] 1.4 Add the 7,680-Initiativephase `Selbstbeherrschung` pre-effect for `Innere Ruhe` and the 960-Initiativephase `Überreden` pre-effect for `Mondsilberzunge`.
- [x] 1.5 Add the 960-Initiativephase `Menschenkenntnis`/`Betören` pre-effect for `Rahjas Wohlgefallen`.
- [x] 1.6 Add the native MR pre-effects for `Psychostabilis`, `Psychostabilis (Tiergeist)`, and `Tanz des Ungehorsams` with 960, 960, and 23,040 Initiativephasen respectively.
- [x] 1.7 Update `docs/develop/spell-liturgy-effect-inventory.md` and deferred-mechanics documentation to record the selected coverage and deliberate exclusions.
- [x] 1.8 Run `npm run pack-all`.

## 2. Unit Tests

- [x] 2.1 Extend `scripts/effects/pre-effects/_spec/supported-spell-data.spec.js` with exact source Item, selector, stacking, native MR, and Initiativephase-duration assertions for all nine Items.
- [x] 2.2 Update `scripts/effects/pre-effects/_spec/pre-effects-processor.spec.js` only if needed to demonstrate the existing payload preserves the large converted owner-turn values.
- [x] 2.3 Run `npm test`.

## 3. E2E Tests and Validation

- [ ] 3.1 In the `schwarzpulver` world as GM, cast `Tanz der Schwerter` on a selected target and verify the visible applied modifiers and owner-turn expiry.
- [ ] 3.2 In the same world, cast every named-talent and MR effect family on a selected target and verify its visible applied effect, modifier scope, and displayed converted duration.
- [x] 3.3 Run `npm run lint` and document any live-Foundry validation that remains unavailable.

## 4. Long-Duration Effect Display

- [x] 4.1 Verify `ActiveEffectConfig` context and Handlebars-part behavior against the Foundry VTT v14 API documentation.
- [x] 4.2 Add a pure display formatter to `IlarisActiveEffectConfig` for values over 100 Initiativephasen, using 960 phases per hour and 23,040 phases per day.
- [x] 4.3 Render the derived original and remaining hours/days labels in `ilaris-duration-tab.hbs` while preserving the exact Initiativephase inputs.
- [x] 4.4 Update `scripts/effects/_spec/active-effect-timing.test.js` for the 100-phase boundary and German singular/plural hour/day formatting.
- [ ] 4.5 In the `schwarzpulver` world, inspect a long-duration effect's tab to verify its exact Initiativephase value and the supplementary hours/days label are both visible.
