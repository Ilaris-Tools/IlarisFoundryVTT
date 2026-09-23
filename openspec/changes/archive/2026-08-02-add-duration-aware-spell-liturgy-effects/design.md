## Context

`system.preEffects` is intentionally a loose object array shared by Zauber, Liturgien, and Anrufungen. A non-instant pre-effect already creates an ActiveEffect with `duration.turns` and `system.ilarisTiming.durationType: "ownerTurns"`; combat hooks then decrement it exclusively on the target's turn. The Ilaris rule conversion is one minute = 16 Initiativephasen, so the reviewed 4-minute, 1-hour, 8-hour, and 1-day effects have exact owner-turn durations without new duration behavior.

The nine selected source Items are the narrow set whose full numeric rule text maps to existing capabilities. They are intentionally separate from effects with unsupported trigger, target-relation, derived-value, or next-roll mechanics.

## Goals / Non-Goals

**Goals:**

- Preserve the current owner-turn behavior for every existing pre-effect.
- Convert the selected rules durations exactly using one minute = 16 Initiativephasen.
- Add the seven selected effect families (nine source Items) with exact numeric scope and duration conversion.

**Non-Goals:**

- Do not create a system timer, `setTimeout`, custom world-time hook, Ilaris date/calendar model, or a new duration authoring mode.
- Do not add automatic self-targeting; casters continue to use the existing selected-target flow.
- Do not convert world-time duration bonuses, self-cast turn bonuses, zones, touch/crossing triggers, repeated damage, contact effects, resources, status enforcement, or ambiguous blessing effects.
- Do not alter the resolver's strongest-supernatural semantics, nor add Ilaris modifiers to Vorteile.

## Decisions

### Use existing owner-turn pre-effect timing

Every added non-instant pre-effect uses the existing `baseDuration` in Initiativephasen and `system.ilarisTiming.durationType: "ownerTurns"`. No new field, ActiveEffect behavior, authoring control, or timing hook is needed. Existing maneuver duration bonuses and the existing self-cast `+1` therefore retain their established behavior for every selected effect.

The alternative—introducing native Foundry world-time duration—was rejected because the rule conversion already expresses the durations in the system's established Initiativephase unit.

### Derive a display-only long-duration label in the configuration context

`IlarisActiveEffectConfig._getIlarisTimingData()` will derive two display-only strings from `originalValue` and `remaining`; the stored values and timing behavior remain untouched. The Handlebars duration tab renders the respective string directly below its exact Initiativephase input only when the value is greater than 100.

The conversion is 16 Initiativephasen per minute, 960 per hour, and 23,040 per day. A value below 23,040 is rendered in German hours; a value at or above 23,040 is rendered in German days. Exact singular/plural labels are used (`1 Stunde` / `Stunden`, `1 Tag` / `Tage`). Fractions are rounded to two decimal places and use a German decimal comma, allowing the display to remain useful for arbitrary effects while the editable value remains exact.

This is context preparation rather than a global Handlebars helper: all number conversion is testable JavaScript, while the template remains declarative and only conditionally renders `humanReadableOriginal` and `humanReadableRemaining`. The alternative—a global helper that receives a raw number—was rejected because it would duplicate threshold and localization rules at every future call site.

### Use existing modifier channels without scope broadening

`Tanz der Schwerter` uses prepare GS plus roll AT and VT semantic Ilaris modifiers, all with `strongest-supernatural` stacking. The named-skill effects use roll-phase `talent` modifiers with their exact talent selectors. The three MR effects use a native additive `system.abgeleitete.mr` change because MR has an addressable actor field.

The implementation does not model `Probe` as a universal roll hook: it retains the resolver's current, documented target/selector behavior. The proposed data therefore avoids claims that it can enforce unrelated effects.

### Source-data duration mapping is literal

The added source data will use 16 Initiativephasen for `Tanz der Schwerter`, 64 for four minutes, 960 for one hour, 7,680 for eight hours, and 23,040 for one day. Each source Item receives one grouped pre-effect so a visible ActiveEffect contains all changes from that spell/liturgy.

## API Surface

| Surface                                                                                                                      | Use in this change                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)                                   | Existing target document created by the pre-effect processor; no class change is needed.                                                              |
| [Actor#createEmbeddedDocuments](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#createEmbeddedDocuments) | Create the target's embedded ActiveEffect through the existing pre-effect processor.                                                                  |
| [Actor#applyActiveEffects](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html#applyActiveEffects)           | Existing lifecycle for prepared semantic modifiers; this change does not add a second lifecycle.                                                      |
| [ActiveEffectConfig](https://foundryvtt.com/api/v14/classes/foundry.applications.sheets.ActiveEffectConfig.html)             | Existing AppV2 Handlebars application whose `_prepareContext()` and `_preparePartContext()` receive the derived display context for the duration tab. |
| Hook events / `foundry.utils.*` helpers                                                                                      | None added or changed. Existing `combatTurn` and `updateCombat` handling remains owner-turn-only.                                                     |

## Risks / Trade-offs

- [A rounded label might be mistaken for the stored duration] → Keep the exact editable Initiativephase number and identify the hours/days value as an equivalent display.
- [Large durations are inconvenient to exhaust manually] → Unit-test exact values; E2E-test owner-turn expiry on the 16-phase effect and inspect the long effects' visible duration rather than advancing thousands of turns.
- [Source text can be revised or a target is not selected] → Preserve existing cast/target behavior and validate the exact source data in a focused test plus Foundry E2E.
- [Editing a generated effect manually can change its displayed duration] → Keep the existing Ilaris owner-turn timing controls as the authoritative editor for those effects.

## Migration Plan

1. Add the display-only formatter to the existing effect configuration context and render it in the duration Handlebars tab.
2. Author the nine `_source` entries and update the coverage/deferred inventory documentation.
3. Extend focused configuration and source-data assertions for the display boundary, exact converted durations, and modifier representations.
4. Run `npm run pack-all`, then validate the generated packs and focused assertions.
5. In the `schwarzpulver` world, cast and inspect the selected effects; advance combat for `Tanz der Schwerter`.

No data migration is required. Source compendium edits are regenerated through the normal pack step. Rolling back consists of reverting the nine source entries; existing pre-effect data remains valid.

## Open Questions

None. Unsupported mechanics remain deferred rather than approximated.

## Testing Strategy

- Unit-test `_getIlarisTimingData()` with 100, 101, 960, and 23,040 Initiativephasen, including exact original and remaining values plus singular/plural display labels.
- Extend supported spell/liturgy source-data assertions to verify the exact family, modifier selectors, stacking policy, native MR key, and Initiativephase conversion of all nine Items.
- If the source-data test requires a processor fixture, assert the large existing `duration.turns` payload without changing production logic.
- E2E-test with the GM in `schwarzpulver`: cast each family on a selected target, inspect the always-visible applied effect, and advance combat turns to confirm expiry of `Tanz der Schwerter`.
