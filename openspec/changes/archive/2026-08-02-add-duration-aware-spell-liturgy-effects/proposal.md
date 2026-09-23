## Why

The reviewed spells and liturgies include several fully system-coverable numeric effects. Their minute-, hour-, and day-based durations can use the existing Ilaris owner-turn pre-effect timing once the rule conversion of one minute to 16 Initiativephasen is applied consistently.

## What Changes

- Add structured, non-instant pre-effects to the nine reviewed compendium source Items in seven effect families:
    - `Tanz der Schwerter` (+4 GS, +2 AT, +2 VT for 16 Initiativephasen);
    - `Adlerauge Luchsenohr` and `Adlerauge Luchsenohr (Tiergeist)` (+4 Sinnenschärfe and Wachsamkeit for 64 Initiativephasen);
    - `Innere Ruhe` (+4 Selbstbeherrschung for 7,680 Initiativephasen);
    - `Mondsilberzunge` (+4 Überreden for 960 Initiativephasen);
    - `Rahjas Wohlgefallen` (+4 Menschenkenntnis and Betören for 960 Initiativephasen);
    - `Psychostabilis` and `Psychostabilis (Tiergeist)` (+4 MR for 960 Initiativephasen); and
    - `Tanz des Ungehorsams` (+4 MR for 23,040 Initiativephasen).
- In the Ilaris ActiveEffect duration tab, render a supplementary human-readable duration when the original or remaining owner-turn duration is greater than 100 Initiativephasen: show hours below one day and days at or above one day, while retaining the exact Initiativephase input.
- Use semantic `ilarisModifiers` for rule-aware GS, AT, VT, and named-skill bonuses; use the native `system.abgeleitete.mr` path only for MR. The resulting spell/liturgy effects remain classified as übernatürlich, so matching rule-aware modifiers use existing strongest-positive and strongest-absolute-negative resolution.
- Materialize each selected source Item's stated Mächtige Magie/Liturgie `+2` increase through the existing per-modifier/per-change amplification fields.
- Keep explicitly partial, contact/crossing, zone, repeated-trigger, resource-drain, next-roll, condition-only, and otherwise ambiguous effects out of this change. In particular, it does not automate Armatrutz/Rondras Rüstung, Attributo, Krötenkuss, Entzug von Travias Gaben, Warzen sprießen, Sensattaco, Ackersegen, or Feuersegen.

This is compendium coverage using existing owner-turn pre-effect behavior. It does not change the existing supernatural stacking rules, ActiveEffect duration implementation, or pre-effect authoring UI.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `active-effects`: The Ilaris duration configuration tab displays long owner-turn durations in human-readable Ilaris hours or days without changing their stored Initiativephase value.
- `spell-pre-effect-data`: Reviewed duration-based spell/liturgy source entries use literal owner-turn durations derived from the Ilaris minute-to-Initiativephase conversion and the appropriate effect changes.
- `supported-spell-pre-effects`: The supported inventory includes the seven reviewed numeric effect families and their nine source Items.

## Impact

- **Code:** `scripts/effects/ilaris-effect-config.js`, `scripts/effects/templates/ilaris-duration-tab.hbs`, and the focused active-effect timing/configuration test.
- **Compendium data:** nine JSON files beneath `comp_packs/zaubersprueche-und-rituale/_source/` and `comp_packs/liturgien-und-mirakel/_source/`; the implementation must run `npm run pack-all`.
- **Documentation:** `docs/develop/spell-liturgy-effect-inventory.md` and any deferred-mechanics note needed to keep the deliberate exclusions discoverable.
- **Foundry VTT API:** [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html) and [Actor#createEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#createEmbeddedDocuments), which the existing pre-effect processor already uses to create the target effect; and [ActiveEffectConfig](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ActiveEffectConfig.html), whose documented Handlebars application context is extended for the display. No Hook event or `foundry.utils.*` usage changes.

## Testing Impact

- **New unit coverage:** cover each new semantic skill/combat modifier and native MR mapping, including its exact owner-turn duration, in the supported source-data test; verify the display context boundary, hour formatting, and day formatting.
- **Existing unit coverage to update:** `active-effect-timing.test.js`, `supported-spell-data.spec.js`, and, only if required by the source-data test harness, `pre-effects-processor.spec.js` to demonstrate the existing duration payload supports the large converted values.
- **New E2E coverage:** in the `schwarzpulver` world, a GM casts each family against a selected actor, confirms the created effect and its visible applied modifiers and long-duration display, and advances combat for `Tanz der Schwerter` to verify owner-turn expiry.
- **Affected E2E environment:** GM user in the existing `schwarzpulver` Foundry world with two actor tokens (caster and selected target). No player client or shared-code candidate is required; no existing E2E case should change outside the duration assertions.
