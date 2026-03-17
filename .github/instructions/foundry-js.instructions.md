---
applyTo: 'scripts/**/*.js'
---

# Foundry VTT JavaScript Conventions — Ilaris

## API Reference

Always consult the official Foundry VTT API documentation: <https://foundryvtt.com/api/>

Never assume Hook signatures, Document methods, or utility functions. Verify against the API docs.

## Module System

- All JavaScript uses **ES Modules** (`import`/`export`).
- Entry point: `scripts/core/hooks.js` → imports all feature `hooks.js` files.
- Each feature area (`actors/`, `items/`, `waffe/`, `combat/`, etc.) has its own `hooks.js` that registers Foundry hooks.

## Sheet Pattern (AppV2)

Sheets extend `HandlebarsApplicationMixin(ActorSheetV2)` or `HandlebarsApplicationMixin(ItemSheetV2)`:

```js
const { HandlebarsApplicationMixin } = foundry.applications.api
const { ItemSheetV2 } = foundry.applications.sheets

export class MySheet extends HandlebarsApplicationMixin(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item'],
        position: { width: 600, height: 'auto' },
        actions: {
            /* action handlers */
        },
        form: { handler: MySheet.#onSubmitForm, submitOnChange: true, closeOnSubmit: false },
    }

    static PARTS = {
        main: { template: 'systems/Ilaris/scripts/.../template.hbs' },
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        context.config = CONFIG.ILARIS
        return context
    }
}
```

## Data Models

- Actor types: `held`, `kreatur`, `nsc` — defined in `template.json` with shared templates (`gesundheit`, `attribute`, `energien`, etc.)
- Item types (22): `nahkampfwaffe`, `fernkampfwaffe`, `ruestung`, `fertigkeit`, `talent`, `zauber`, `liturgie`, `vorteil`, `manoever`, `eigenschaft`, `waffeneigenschaft`, etc.
- Proxy classes: `IlarisActorProxy` (`scripts/actors/data/proxy.js`), `IlarisItemProxy` (`scripts/items/data/proxy.js`)

## Naming Conventions

- **German** for domain terms: `Fertigkeiten`, `Zauber`, `Waffen`, `Helden`, `Kreaturen`, `Vorteile`, `Manöver`
- **camelCase** for JS variables and methods
- **PascalCase** for class names (e.g., `HeldenSheet`, `IlarisItemSheet`)
- **kebab-case** for CSS classes and file names where appropriate
- Template paths use the full system path: `systems/Ilaris/scripts/.../template.hbs`

## Hook Registration

Each feature module exports hooks via its own `hooks.js`:

```js
Hooks.once('init', () => {
    /* register sheets, config */
})
Hooks.on('renderActorSheet', (sheet, html) => {
    /* modify rendered sheet */
})
```

## Testing

- Tests live in `_spec/` directories colocated with the feature code.
- Framework: Jest with Babel transforms (`jest.config.mjs`, `babel.config.cjs`).
- Run: `npm test`
- Foundry globals are mocked in `jest.setup.js`.

## File Organization

Each feature follows this structure:

```
scripts/<feature>/
  hooks.js          — Foundry hook registrations
  data/             — Data models and logic
  sheets/           — Sheet classes (AppV2)
  templates/        — Handlebars .hbs templates
  styles/           — CSS files
  _spec/            — Jest tests
```
