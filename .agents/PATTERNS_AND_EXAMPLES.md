# Patterns & Examples — Ilaris FoundryVTT System

Step-by-step guides for common implementation patterns, referencing actual files in the codebase.

---

## Pattern A: Creating a New Item Type

How to add a new item type to the Ilaris system.

### Step 1: Define the Data Schema

Add the new type to `template.json` under `Item.types` and define its schema.

```json
// template.json
{
  "Item": {
    "types": ["nahkampfwaffe", "fernkampfwaffe", ..., "my_new_type"],
    "templates": { ... },
    "my_new_type": {
      "templates": ["relevant_template"],
      "custom_field": "",
      "numeric_field": 0
    }
  }
}
```

### Step 2: Create a Data Model (Optional)

If the type needs computed values or special logic, create a data model.

**Reference**: `scripts/items/data/item.js` (base), `scripts/items/data/manoever.js` (example)

### Step 3: Register in the Proxy

Add the new type to `scripts/items/data/proxy.js` so it dispatches correctly.

### Step 4: Create a Sheet Class

Create a new sheet in `scripts/items/sheets/`:

```js
// scripts/items/sheets/my-new-type.js
import { IlarisItemSheet } from './item.js'

export class MyNewTypeSheet extends IlarisItemSheet {
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item', 'my-new-type'],
        position: { width: 600, height: 'auto' },
    }

    static PARTS = {
        main: { template: 'systems/Ilaris/scripts/items/templates/my-new-type.hbs' },
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        // Add type-specific context
        return context
    }
}
```

### Step 5: Create a Handlebars Template

Create `scripts/items/templates/my-new-type.hbs`:

```hbs
<div class='my-new-type'>
    <h2>{{item.name}}</h2>
    <input type='text' name='system.custom_field' value='{{item.system.custom_field}}' />
</div>
```

### Step 6: Register the Sheet

In `scripts/core/init.js`, import and register the new sheet:

```js
import { MyNewTypeSheet } from '../items/sheets/my-new-type.js'

// Inside Hooks.once('init', () => { ... })
Items.registerSheet('Ilaris', MyNewTypeSheet, { types: ['my_new_type'], makeDefault: true })
```

### Step 7: Add CSS (Optional)

Add styles in `scripts/items/styles/` and register in `system.json`.

### Step 8: Add Tests

Create `scripts/items/_spec/my-new-type.spec.js` with Jest tests.

### Step 9: Validate

```bash
npm test
npm run lint
```

---

## Pattern B: Creating a New Actor Sheet

How to create a new actor type sheet (AppV2).

### Step 1: Define Actor Type in `template.json`

Add under `Actor.types` with required templates.

### Step 2: Create Data Model

In `scripts/actors/data/`, create a type-specific model extending the base.

**Reference**: `scripts/actors/data/held.js`, `scripts/actors/data/kreatur.js`

### Step 3: Create Sheet Class

In `scripts/actors/sheets/`:

```js
import { IlarisActorSheet } from './actor.js'

export class NewActorSheet extends IlarisActorSheet {
    static DEFAULT_OPTIONS = {
        classes: ['new-actor-type'],
        position: { width: 900, height: 700 },
        window: { icon: 'fa-solid fa-icon-name' },
        actions: {
            // Action handlers
        },
    }

    static PARTS = {
        header: { template: 'systems/Ilaris/scripts/actors/templates/new-type/header.hbs' },
        tabs: { template: 'systems/Ilaris/scripts/actors/templates/new-type/navigation.hbs' },
        // Tab content parts with scrollable
    }

    static TABS = {
        primary: {
            initial: 'main-tab',
            tabs: [{ id: 'main-tab', label: 'Haupttab' }],
        },
    }
}
```

### Step 4: Create Templates

Create Handlebars templates in `scripts/actors/templates/new-type/`.

### Step 5: Register

In `scripts/core/init.js`:

```js
Actors.registerSheet('Ilaris', NewActorSheet, { types: ['new_type'], makeDefault: true })
```

---

## Pattern C: Adding Compendium Content

How to add new entries to an existing compendium pack.

### Step 1: Create JSON Source File

Create a new `.json` file in the appropriate `comp_packs/<pack>/_source/` directory.

**Reference**: Look at existing `_source/` files for the exact schema.

### Step 2: JSON Structure

```json
{
    "_id": "unique-16-char-id",
    "name": "Neuer Eintrag",
    "type": "item-type-from-template-json",
    "img": "systems/Ilaris/assets/images/icon/default.svg",
    "system": {
        // Fields matching template.json schema for this type
    },
    "effects": [],
    "flags": {},
    "folder": null,
    "sort": 0,
    "ownership": { "default": 0 },
    "_stats": { "systemId": "Ilaris", "systemVersion": "13.0.0", "coreVersion": "13" },
    "_key": "!items!unique-16-char-id"
}
```

### Step 3: Build

```bash
npm run pack-all
```

### Step 4: Verify

Open Foundry VTT and check the compendium for the new entry.

---

## Pattern D: Hooks & Events

How to add new Foundry hooks for a feature.

### Step 1: Create or Edit the Feature's `hooks.js`

```js
// scripts/<feature>/hooks.js

Hooks.once('init', () => {
    // One-time initialization (register sheets, config, etc.)
})

Hooks.on('ready', () => {
    // After all initialization is complete
})

Hooks.on('renderActorSheet', (sheet, html) => {
    // Modify a rendered actor sheet
})

Hooks.on('createItem', (item, options, userId) => {
    // React to item creation
})
```

### Step 2: Import in Central Entry Point

Ensure the hook file is imported in `scripts/core/hooks.js`:

```js
import '../<feature>/hooks.js'
```

### Step 3: Available Hooks

Common hooks used in Ilaris:

- `init` — System initialization (register sheets, config)
- `ready` — After all systems loaded
- `renderActorSheet` / `renderItemSheet` — After sheet HTML is rendered
- `createItem` / `deleteItem` / `updateItem` — Item lifecycle
- `createActor` / `deleteActor` / `updateActor` — Actor lifecycle
- `preCreateCombatant` / `updateCombat` — Combat tracker events
- `getActorSheetHeaderButtons` — Customize sheet header buttons

Always verify hook signatures at: <https://foundryvtt.com/api/>

---

## Pattern E: Weapon Properties System

The weapon property system is the most complex subsystem. Located in `scripts/waffe/`.

### Key Concepts

- **Waffeneigenschaften** (weapon properties) are Items of type `waffeneigenschaft`.
- They contain scripts (`sephrastoScript`, `foundryScript`, `customScript`) and modifiers.
- Properties modify AT, VT, FK, damage, range, fumble/crit thresholds.
- The `eigenschaft-cache` preloads all properties for performance.

### Files

- `scripts/waffe/properties/` — Property evaluation and caching
- `scripts/waffe/properties/utils/eigenschaft-cache.js` — Preload cache
- `scripts/waffe/migrations/` — Data migrations for property changes
- `comp_packs/waffeneigenschaften/_source/` — Property data

### Modifying Properties

1. Edit `_source/` JSON in `comp_packs/waffeneigenschaften/`
2. If schema changes: add migration in `scripts/waffe/migrations/`
3. Run `npm run pack-all`
4. Run `npm test` to verify migration and property logic
