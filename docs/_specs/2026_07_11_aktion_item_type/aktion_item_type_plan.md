# Aktion Item Type — Implementation Plan

**Status**: FINAL — all inputs resolved
**Date**: 2026-07-11
**Objective**: Define a proper `aktion` (combat action) item type with a structured `TypeDataModel` in the main Ilaris system.

---

## 1. Objective

Add a new `aktion` item type with a full `TypeDataModel` (`AktionItemDataModel`) to the Ilaris FoundryVTT system. This provides structured, typed access to combat action data (INI modifier, AT/VT modifiers, action type, weapon gating conditions) that the module (`ilaris-alternative-actor-sheet`) will consume for initiative dialog and state management.

## 2. Resolved Decisions

| #   | Topic                 | Decision                                                                                                                                                                                     |
| --- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Type key              | `aktion` (German, consistent with `nahkampfwaffe`, `manoever`, etc.)                                                                                                                         |
| 2   | `effect-item` removal | **Leave it** in `system.json` — do not remove in this change                                                                                                                                 |
| 3   | Compendium pack       | **No compendium pack** — no `comp_packs/aktionen/`, no `packs[]` entry, no `packFolders` entry                                                                                               |
| 4   | Class name            | `AktionItemDataModel` (PascalCase German)                                                                                                                                                    |
| 5   | Default factory       | **Yes** — add `createAktionDefaults()` to `scripts/items/model-data/shared.js`                                                                                                               |
| 6   | Description field     | `text` (consistent with other models: `GegenstandItemDataModel`, `VorteilItemDataModel`, etc.)                                                                                               |
| 7   | Compendium content    | **N/A** — no compendium pack                                                                                                                                                                 |
| 8   | `waffentyp` choices   | Use `choices: ['', 'nahkampfwaffe', 'fernkampfwaffe']` with `nullable: false, initial: ''`. Empty string `''` is the explicit "keine Einschränkung" sentinel — selectable in form dropdowns. |

## 3. Assumptions

- `effect-item` stays registered in `system.json` for backward compatibility with worlds that haven't yet run the v14 migration, even though `migrate-modeldata-normalization.js` ultimately deletes all instances.
- The module (`ilaris-alternative-actor-sheet`) handles: initiative dialog, state manager, templates, ActiveEffect construction from aktion data, and migration of existing `effectItem` items — all out of scope.
- `h.arrayOfStrings()` returns `ArrayField<StringField>` with proper defaults (confirmed in `field-helpers.js`).
- No item sheet is needed in this change — the module owns the UI.

## 4. Steps

### Step 1: Add `aktion` to `system.json` documentTypes

- **What**: Add `"aktion": {}` to `documentTypes.Item` (do NOT remove `"effect-item": {}`)
- **Where**: `system.json` → `documentTypes.Item`
- **Who**: code specialist
- **Depends on**: none

### Step 2: Create `AktionItemDataModel` in models.js

- **What**: Define the `AktionItemDataModel` class inside `createItemTypeDataModels()`, add `aktion: AktionItemDataModel` to the return object
- **Where**: `scripts/items/model-data/models.js`
- **Who**: code specialist
- **Depends on**: none

### Step 3: Create default factory in shared.js

- **What**: Add `createAktionDefaults()` function to `scripts/items/model-data/shared.js` and export it
- **Where**: `scripts/items/model-data/shared.js`
- **Who**: code specialist
- **Depends on**: Step 2 (must match schema fields)

### Step 4: Create item sheet class

- **What**: Create `AktionSheet` class extending `IlarisItemSheet` in `scripts/items/sheets/aktion.js`
- **Where**: `scripts/items/sheets/aktion.js` (new file)
- **Who**: code specialist
- **Depends on**: Step 2 (schema must be defined)

### Step 5: Create item sheet template

- **What**: Create `aktion.hbs` template with fields for name, `text` description, `aktionstyp` dropdown, `iniMod`/`atMod`/`vtMod` number inputs, `bedingungen.waffentyp` dropdown, `bedingungen.eigenschaften` text input, and the `base_item_layout` partial
- **Where**: `scripts/items/templates/aktion.hbs` (new file)
- **Who**: code specialist
- **Depends on**: Step 4 (sheet class references template path)

### Step 6: Register sheet in init.js

- **What**: Add import for `AktionSheet` and `Items.registerSheet('Ilaris', AktionSheet, ...)` call
- **Where**: `scripts/core/init.js`
- **Who**: code specialist
- **Depends on**: Step 4

### Step 7: Verify

- **What**: Run tests and lint, then manually verify in Foundry that the sheet renders correctly
- **Where**: `npm test`, `npm run lint`, Foundry runtime
- **Who**: code specialist
- **Depends on**: Steps 1-6

## 5. Validation Plan

| Step | Validation                                                                                                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | `system.json` parses correctly; `documentTypes.Item` contains both `aktion` and `effect-item`                                                                                  |
| 2    | `npm test` passes all existing tests; `npm run lint` passes                                                                                                                    |
| 3    | `npm test` passes; `createAktionDefaults()` returns correct plain object matching schema                                                                                       |
| 4    | Sheet class imports cleanly; `AktionSheet.DEFAULT_OPTIONS.classes` includes `'aktion'`; `AktionSheet.PARTS.form.template` points to correct path                               |
| 5    | Template parses without Handlebars errors; all `name` attributes match DataModel field paths                                                                                   |
| 6    | `npm run lint` passes; no unused imports                                                                                                                                       |
| 7    | Manual: Foundry boots without errors; opening an `aktion` item shows the sheet with all fields; changing `aktionstyp` dropdown persists correctly; `submitOnChange` auto-saves |

### Test commands

```bash
npm test
npm run lint
```

## 6. Delegation Map

| Step | Specialist | Input                                          | Expected Output                          |
| ---- | ---------- | ---------------------------------------------- | ---------------------------------------- |
| 1    | code       | system.json current state                      | Updated system.json with `"aktion": {}`  |
| 2    | code       | models.js, shared.js, field-helpers.js         | AktionItemDataModel class + registration |
| 3    | code       | shared.js                                      | createAktionDefaults() function          |
| 4    | code       | item.js (base sheet), vorteil.js (reference)   | AktionSheet class                        |
| 5    | code       | vorteil.hbs, base_item_layout.hbs (references) | aktion.hbs template                      |
| 6    | code       | init.js imports + registrations                | Import + registerSheet call              |
| 7    | code       | Foundry runtime                                | Verified sheet renders correctly         |

## 7. Files Changed

| File                                 | Change                                                               |
| ------------------------------------ | -------------------------------------------------------------------- |
| `system.json`                        | Add `"aktion": {}` to `documentTypes.Item`                           |
| `scripts/items/model-data/models.js` | Add `AktionItemDataModel` class; add `aktion` to return object       |
| `scripts/items/model-data/shared.js` | Add `createAktionDefaults()` function                                |
| `scripts/items/sheets/aktion.js`     | **New** — `AktionSheet` class extending `IlarisItemSheet`            |
| `scripts/items/templates/aktion.hbs` | **New** — template with all aktion fields + base_item_layout partial |
| `scripts/core/init.js`               | Add import + `Items.registerSheet` for `AktionSheet`                 |

## 8. Data Model Schema (Final)

```js
// In scripts/items/model-data/models.js
// Inside createItemTypeDataModels(TypeDataModel, h):

class AktionItemDataModel extends TypeDataModel {
    static defineSchema() {
        const itemBase = createItemTemplateFields(h)

        return {
            ...itemBase,

            text: h.string(''),

            aktionstyp: new foundry.data.fields.StringField({
                required: true,
                nullable: false,
                blank: false,
                choices: ['einfach', 'komplex'],
                initial: 'einfach',
            }),

            iniMod: h.number(0),

            atMod: h.number(0),

            vtMod: h.number(0),

            bedingungen: h.schema({
                // Empty string '' = no weapon type restriction (selectable "beliebig").
                waffentyp: new foundry.data.fields.StringField({
                    required: false,
                    nullable: false,
                    blank: true,
                    choices: ['', 'nahkampfwaffe', 'fernkampfwaffe'],
                    initial: '',
                }),
                eigenschaften: h.arrayOfStrings(),
            }),
        }
    }
}

// In the return object of createItemTypeDataModels:
return {
    // ... existing types ...
    aktion: AktionItemDataModel,
    // ... legacy aliases ...
}
```

## 9. Default Factory (Final)

```js
// In scripts/items/model-data/shared.js

/**
 * Complete system defaults for aktion items.
 * Mirrors AktionItemDataModel.defineSchema().
 * @returns {Object}
 */
export function createAktionDefaults() {
    return {
        ...createItemTemplateDefaults(),
        text: '',
        aktionstyp: 'einfach',
        iniMod: 0,
        atMod: 0,
        vtMod: 0,
        bedingungen: {
            waffentyp: '',
            eigenschaften: [],
        },
    }
}
```

## 10. system.json Change (precise)

```jsonc
// In documentTypes.Item, add this entry (keep effect-item):
"aktion": {},
```

## 11. Field Semantics Reference

### `text`

Free-form description text. Mirrors `text` fields on `GegenstandItemDataModel`, `VorteilItemDataModel`, etc.

### `aktionstyp`

- `"einfach"` — Can be combined with another `"einfach"` action. Both rolls suffer a -4 malus (AT -4, VT -4, skill checks -4).
- `"komplex"` — Occupies the entire turn alone. Cannot be combined.

### `iniMod`

Initiative modifier applied when this action is selected. Examples: "Gezielter Angriff" → -4, "Schnelle Bewegung" → +2.

### `atMod` / `vtMod`

Attack and defense/parry roll modifiers applied during this action.

### `bedingungen.waffentyp`

- `""` (empty string) — Available regardless of weapon selection (including unarmed / no weapon). This is the explicit "beliebig" choice.
- `"nahkampfwaffe"` — Requires a nahkampfwaffe item (or nahkampfwaffe with "Fernkampfoption" eigenschaft, which also counts as fernkampf-capable)
- `"fernkampfwaffe"` — Requires a fernkampfwaffe item (or nahkampfwaffe with "Fernkampfoption" eigenschaft)

### `bedingungen.eigenschaften`

Array of Waffeneigenschaft keys. ALL listed eigenschaften must be present on the selected weapon. Empty array = no gating.
