# Agent Context — Ilaris FoundryVTT System

## Project Overview

**Ilaris** is a Foundry VTT game system implementing the Ilaris tabletop RPG ruleset — a streamlined alternative ruleset for the German P&P setting "Das Schwarze Auge" (The Dark Eye).

- **What**: A browser-based virtual tabletop system providing character sheets, combat mechanics, skill checks, spells, weapons, and compendium data.
- **Why**: Allows players and game masters to manage Ilaris campaigns digitally with automated rules support.
- **Who**: Community-maintained open source project. Contributors include German P&P enthusiasts and FoundryVTT developers.
- **Where**: <https://github.com/Ilaris-Tools/IlarisFoundryVTT>

### Tech Stack

- **Runtime**: Foundry VTT (browser-based application server)
- **Language**: JavaScript (ES Modules), HTML (Handlebars `.hbs`), CSS
- **Testing**: Jest + Babel
- **Build**: npm scripts, `@foundryvtt/foundryvtt-cli`
- **Domain Language**: German in UI/data, mixed German/English in code

## Getting Started

### Key Entry Points

1. **`system.json`** — System manifest. Defines `esmodules: ["scripts/core/hooks.js"]` as the JavaScript entry point and lists all CSS files.
2. **`scripts/core/model-data/type-data-models.js`** — Registers TypeDataModels used by Actor and Item system data.
3. **`scripts/core/hooks.js`** — ES module entry point that imports `init.js` and all feature `hooks.js` files.
4. **`scripts/core/init.js`** — Registers all sheet classes, document classes, and `CONFIG.ILARIS` constants via `Hooks.once('init', ...)`.

### Workspace Structure

```
Ilaris/
├── system.json              # System manifest
├── package.json             # npm scripts & dependencies
├── AGENTS.md                # Tool-agnostic agent rules
├── CONTRIBUTING.md          # Contribution guide
├── scripts/                 # All JavaScript + templates + styles
│   ├── core/                # Entry point, config, Handlebars helpers, documents
│   ├── actors/              # Actor models (held, kreatur), sheets, hooks
│   ├── items/               # 22 item types, models, sheets, hooks
│   ├── waffe/               # Weapon subsystem (properties, migrations, computed)
│   ├── combat/              # Combat tracker, dialogs, dice logic
│   ├── dice/                # Dice rolling UI and logic
│   ├── effects/             # Active effects system
│   ├── skills/              # Skill check dialogs and dice
│   ├── tokens/              # Token configuration and rendering
│   ├── importer/            # XML import from Sephrasto
│   ├── settings/            # System settings UI
│   ├── changelog/           # In-app changelog notification
│   └── common/              # Shared utilities
├── comp_packs/              # Compendium packs (LevelDB + _source/ JSON)
├── assets/                  # Images, fonts, game-icons
├── styles/                  # Global CSS
├── docs/                    # User & developer documentation (MkDocs)
└── utils/                   # Build/migration scripts
```

### Common Development Tasks

| Task                   | Command                 | Notes                                  |
| ---------------------- | ----------------------- | -------------------------------------- |
| Install dependencies   | `npm install`           | Always run first after cloning         |
| Run tests              | `npm test`              | Jest, tests in `_spec/` dirs           |
| Run linter             | `npm run lint`          | ESLint + auto-fix                      |
| Format code            | `npm run prettier`      | Prettier for all file types            |
| Build compendium packs | `npm run pack-all`      | Required after editing `_source/` JSON |
| Start Foundry          | `npm run start-foundry` | Runs pack-all, then launches Foundry   |
| Optimize SVGs          | `npm run optimize-svgs` | Removes unnecessary SVG metadata       |

### Feature Module Pattern

Every feature follows this consistent structure:

```
scripts/<feature>/
├── hooks.js         # Foundry hook registrations
├── data/            # Data models and business logic
├── sheets/          # UI sheet classes (Foundry AppV2)
├── templates/       # Handlebars .hbs templates
├── styles/          # CSS files
└── _spec/           # Jest tests
```

Hooks from each feature are imported in `scripts/core/hooks.js`, forming a centralized entry point.

## Key Files Quick Reference

| File                             | What to Look At                                         |
| -------------------------------- | ------------------------------------------------------- |
| `scripts/core/init.js`           | All registered sheets, document classes, config setup   |
| `scripts/core/config.js`         | `CONFIG.ILARIS` constants used throughout               |
| `scripts/actors/sheets/actor.js` | Base actor sheet class (AppV2 pattern)                  |
| `scripts/actors/sheets/held.js`  | Hero sheet — `DEFAULT_OPTIONS`, `PARTS`, `TABS` example |
| `scripts/items/sheets/item.js`   | Base item sheet class (AppV2 pattern)                   |
| `scripts/actors/data/proxy.js`   | `IlarisActorProxy` — data model dispatch                |
| `scripts/items/data/proxy.js`    | `IlarisItemProxy` — data model dispatch                 |
| `scripts/waffe/properties/`      | Weapon property system (scripting, modifiers)           |
| `comp_packs/*/`                  | Compendium packs — edit `_source/` only                 |
| `jest.setup.js`                  | Test environment mocks for Foundry globals              |
