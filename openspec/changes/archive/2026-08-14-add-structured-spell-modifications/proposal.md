## Why

`system.modifikationen` is currently parsed from prose into temporary maneuver-like
objects. That can express a numeric difficulty or energy adjustment, but not a
different spell form: for example, Miasmafaxius changes the target profile of
Tlalucs Odem, and Schimmernder Schild replaces Fortifex's wall with a summoned
shield. The generic Antimagie talents demonstrate the same problem even more
clearly: their four modes have wholly different casting profiles and must be
mutually exclusive.

## What Changes

- Add persisted, structured spell-modification data to Zauber, Liturgien, and
  Anrufungen. A modification has a stable id, German display text, casting
  overrides, optional pre-effects, and an effect mode.
- Make `inherit` the default effect mode: it preserves the source talent's
  pre-effects while applying the modification's casting overrides. Authors can
  explicitly select `extend` or `replace` for additional or replacement
  outcomes.
- Present structured modifications in their own **Zaubermodifikationen** area
  of the supernatural dialog. They are not synthetic `manoever` Items and do
  not participate in maneuver-only rules such as Gildenmagier II.
- Support data-driven exclusivity groups and required groups, so a player can
  choose exactly one anti-magic form while still combining unrelated legal
  modifications where a source permits it.
- Let a chosen modification override the casting profile (difficulty, energy
  cost, permanent cost text, target, range, and duration) and select its
  effective pre-effects before a successful casting resolves.
- Add authoring controls to the supernatural Item sheet, reusing the existing
  pre-effect editor for a modification's own effects.
- Migrate representative source data: Attributo attribute choices, Tlalucs
  Odem's Miasmafaxius, Fortifex's Schimmernder Schild, and each generic
  anti-magic talent's Gegenzauber, Magie unterdrücken, Zauber aufheben, and
  Wesenheit bannen forms.
- Retain the free-text `system.modifikationen` field as rules text. **BREAKING:**
  it will no longer create runtime-generated maneuvers for Items which define
  structured modifications; unstructured legacy text retains its current
  temporary-maneuver fallback during migration.

## Capabilities

### New Capabilities

- `structured-spell-modifications`: Persisted, selectable spell forms with
  profile overrides, effect composition, and exclusive/required groups.

### Modified Capabilities

- `supernatural-pre-effects`: Resolve the effective pre-effect list selected
  by a structured spell modification after a successful casting.
- `spell-pre-effect-data`: Store representative spell-form data alongside
  source talent pre-effects.
- `summoned-item-source-data`: Allow a replacement spell form such as
  Schimmernder Schild to invoke the established summoned-item pre-effect flow.

## Impact

This is additive to Item source data and dialog state, while modifying the
existing `CombatItem.setManoevers()` legacy path and
`UebernatuerlichDialog` casting calculation. It affects
`scripts/items/data/combat-item.js`, `scripts/combat/dialogs/uebernatuerlich.js`,
the supernatural dialog and Item-sheet Handlebars templates, the shared
pre-effect processor, the `TypeDataModel` field helper, and selected compendium
`_source/` JSON files.

Foundry VTT API surface: [Item](https://foundryvtt.com/api/v14/classes/foundry.documents.Item.html)
for persistent `system` data and `Item#update`; the existing
[ApplicationV2](https://foundryvtt.com/api/v14/classes/foundry.applications.api.ApplicationV2.html)
and [HandlebarsApplicationMixin](https://foundryvtt.com/api/v14/functions/foundry.applications.api.HandlebarsApplicationMixin.html)
for dialog and sheet context/template rendering; and
[ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html)
through the existing pre-effect processor. The implementation will use
[foundry.utils.deepClone](https://foundryvtt.com/api/v14/functions/foundry.utils.deepClone.html)
and [foundry.utils.mergeObject](https://foundryvtt.com/api/v14/functions/foundry.utils.mergeObject.html)
when assembling non-persistent effective casting data. No new Foundry Hook
event is introduced; existing Ilaris roll hooks retain their current timing.

## Testing Impact

- New unit coverage: normalize legacy/malformed structured data; group
  selection and required-group validation; default `inherit`, explicit
  `extend`, and explicit `replace`; profile cost/difficulty overrides; and the
  regression fallback for unstructured text modifications.
- Existing unit coverage to update: `scripts/items/_spec_/combat.spec.js`,
  `scripts/combat/_spec_/uebernatuerlich_roll.spec.js`, and pre-effect processor
  tests for an explicitly supplied effective pre-effect list.
- New E2E cases: one player casts Attributo and selects an attribute; one player
  chooses Miasmafaxius and receives the base Pestgestank outcome on its changed
  target profile; a GM selects Schimmernder Schild and creates the replacement
  item; and a player cannot confirm two anti-magic forms. The shared world needs
  a Hero with the relevant source talent, a controlled target Actor, configured
  spell/item compendium packs, and a GM client for inspection. Reusable dialog
  opening, target selection, roll confirmation, and effect cleanup helpers
  should be promoted to `e2e/shared/` where they do not already exist.
