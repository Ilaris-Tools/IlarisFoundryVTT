# Code Conventions — Ilaris FoundryVTT System

These conventions are derived from actual code in the repository. Follow them when writing or modifying code.

## Module System

- **ES Modules only** — `import`/`export` everywhere. Declared in `system.json` via `esmodules: ["scripts/core/hooks.js"]`.
- No CommonJS (`require`/`module.exports`) except in build tool config (`babel.config.cjs`).

## Naming Conventions

### JavaScript

| Element           | Convention                | Examples                                                    |
| ----------------- | ------------------------- | ----------------------------------------------------------- |
| Classes           | PascalCase                | `HeldenSheet`, `IlarisActorSheet`, `IlarisItemProxy`        |
| Methods/Functions | camelCase                 | `_prepareContext`, `schipsClick`, `preloadAllEigenschaften` |
| Variables         | camelCase                 | `hasActor`, `isOwner`, `speicherplatz_list`                 |
| Constants/Config  | UPPER_SNAKE or PascalCase | `DEFAULT_OPTIONS`, `PARTS`, `TABS`, `ILARIS`                |
| File names        | kebab-case or domain-name | `active-effect.js`, `held.js`, `actor-weapon-utils.js`      |
| Template paths    | kebab-case                | `held-header.hbs`, `held-sidebar.hbs`                       |
| CSS classes       | kebab-case                | `ilaris`, `sheet`, `item`, `helden`                         |

### German vs. English

- **German**: UI labels, data identifiers, template variable names, domain terms
    - `Fertigkeiten`, `Zauber`, `Waffen`, `Helden`, `Kreaturen`, `Vorteile`, `schipsClick`
- **English**: Structural/technical code
    - `hooks`, `sheets`, `data`, `proxy`, `init`, `config`, `_prepareContext`

## Sheet Class Pattern

**Example 1: Actor Sheet** (from `scripts/actors/sheets/held.js`)

```js
import { IlarisActorSheet } from './actor.js'

export class HeldenSheet extends IlarisActorSheet {
    static DEFAULT_OPTIONS = {
        classes: ['helden'],
        position: { width: 950, height: 750 },
        window: { icon: 'fa-solid fa-person' },
        actions: {
            schipsClick: HeldenSheet.schipsClick,
            triStateClick: HeldenSheet.triStateClick,
            toggleItem: HeldenSheet.onToggleItem,
        },
    }

    get title() {
        return `Held: ${this.actor.name}`
    }

    static PARTS = {
        header: { template: 'systems/Ilaris/scripts/actors/templates/held/held-header.hbs' },
        sidebar: { template: 'systems/Ilaris/scripts/actors/templates/held/held-sidebar.hbs' },
        tabs: { template: 'systems/Ilaris/scripts/actors/templates/held/held-navigation.hbs' },
        fertigkeiten: { template: '...held/tabs/fertigkeiten.hbs', scrollable: [''] },
        // ... more parts
    }

    static TABS = {
        primary: {
            initial: 'fertigkeiten',
            tabs: [
                { id: 'attribute', label: 'Attribute' },
                { id: 'fertigkeiten', label: 'Fertigkeiten' },
                { id: 'uebernatuerlich', label: 'Übernatürlich' },
                { id: 'kampf', label: 'Kampf' },
                { id: 'inventar', label: 'Inventar' },
                { id: 'notes', label: 'Notizen' },
                { id: 'effects', label: 'Effekte' },
            ],
        },
    }
}
```

**Example 2: Item Sheet** (from `scripts/items/sheets/item.js`)

```js
const { HandlebarsApplicationMixin } = foundry.applications.api
const { ItemSheetV2 } = foundry.applications.sheets

export class IlarisItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item'],
        position: { width: 600, height: 'auto' },
        tag: 'form',
        actions: {
            deleteItem: IlarisItemSheet.#onDeleteItem,
        },
        form: {
            handler: IlarisItemSheet.#onSubmitForm,
            submitOnChange: true,
            closeOnSubmit: false,
        },
        window: { icon: 'fas fa-suitcase', controls: [] },
    }

    get title() {
        return `${this.item.type}: ${this.item.name}`
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        context.item = this.item
        context.config = CONFIG.ILARIS
        context.CONFIG = CONFIG
        return context
    }
}
```

**Example 3: Hook Registration** (from `scripts/core/hooks.js`)

```js
// Core initialization
import './init.js'

// Feature hooks — each feature self-registers
import '../actors/hooks.js'
import '../items/hooks.js'
import '../waffe/hooks.js'
import '../combat/hooks.js'
import '../dice/hooks.js'
import '../effects/hooks.js'
import '../tokens/hooks.js'
import '../importer/hooks.js'
import '../settings/hooks.js'
import '../changelog/hooks.js'
import '../skills/hooks.js'
```

## Template Paths

Always use the full system path for Handlebars templates:

```js
template: 'systems/Ilaris/scripts/actors/templates/held/held-header.hbs'
```

## Config Usage

System constants go through `CONFIG.ILARIS`:

```js
context.config = CONFIG.ILARIS // In _prepareContext
```

## Action Handlers

Actions are defined as **static methods** on sheet classes and referenced in `DEFAULT_OPTIONS.actions`:

```js
static DEFAULT_OPTIONS = {
    actions: {
        schipsClick: HeldenSheet.schipsClick,   // public static
        deleteItem: MySheet.#onDeleteItem,       // private static (with #)
    },
}
```

## Testing Conventions

- Tests live in `_spec/` directories colocated with feature code.
- Test files named `*.spec.js` or `*.test.js`.
- Foundry globals (`game`, `CONFIG`, `Hooks`, etc.) are mocked in `jest.setup.js`.
- Use Jest assertions (`expect`, `toBe`, `toEqual`, etc.).

## CSS Conventions

- Each feature's CSS is in its own `styles/` directory.
- CSS files declared in `system.json` `styles` array.
- Use `ilaris` as the base CSS class.
- Feature-specific classes: `helden`, `sheet`, `item`, etc.

## Comment Style

- No strict JSDoc enforcement, but encouraged on public methods.
- Inline comments in German or English as appropriate.
- File-level doc comments for module purpose.

## Import Organization

1. Foundry API imports (destructuring from `foundry.*`)
2. Local module imports (relative paths)
3. Feature imports (other `scripts/` modules)
