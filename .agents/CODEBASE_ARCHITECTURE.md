# Codebase Architecture — Ilaris FoundryVTT System

## Directory Map

```
Ilaris/
├── system.json                    # System manifest
├── template.json                  # Actor/Item data schemas
├── package.json                   # npm scripts, devDependencies
├── jest.config.mjs                # Jest test configuration
├── jest.setup.js                  # Test environment (Foundry mocks)
├── babel.config.cjs               # Babel transforms for Jest
├── .husky/                        # Pre-commit hooks
│
├── scripts/                       # ═══ ALL SYSTEM CODE ═══
│   ├── core/                      # System initialization
│   │   ├── hooks.js               # ★ Entry point (imports all hooks)
│   │   ├── init.js                # ★ Hooks.once('init') — registers everything
│   │   ├── config.js              # CONFIG.ILARIS constants
│   │   ├── config/                # Config sub-modules
│   │   ├── handlebars.js          # Handlebars helpers registration
│   │   ├── documents/             # Base document classes
│   │   │   └── active-effect.js   # IlarisActiveEffect
│   │   ├── styles/                # Core CSS
│   │   ├── templates/             # Core .hbs templates
│   │   └── _spec/                 # Core tests
│   │
│   ├── actors/                    # Actor subsystem
│   │   ├── hooks.js               # Actor-related hooks
│   │   ├── data/                  # Data models
│   │   │   ├── actor.js           # Base actor data + abgeleitete Werte
│   │   │   ├── held.js            # Held-specific model
│   │   │   ├── kreatur.js         # Kreatur-specific model
│   │   │   ├── proxy.js           # ★ IlarisActorProxy (type dispatch)
│   │   │   ├── actor-weapon-utils.js
│   │   │   └── hardcodedvorteile.js
│   │   ├── sheets/                # UI sheets (AppV2)
│   │   │   ├── actor.js           # ★ IlarisActorSheet (base class)
│   │   │   ├── held.js            # HeldenSheet
│   │   │   └── kreatur.js         # KreaturSheet
│   │   ├── templates/             # Handlebars templates
│   │   │   ├── held/              # Hero sheet templates
│   │   │   └── kreatur/           # Creature sheet templates
│   │   ├── styles/                # Actor CSS
│   │   └── _spec/                 # Actor tests
│   │
│   ├── items/                     # Item subsystem (22 types)
│   │   ├── hooks.js               # Item-related hooks
│   │   ├── data/                  # Data models
│   │   │   ├── item.js            # Base item data
│   │   │   ├── proxy.js           # ★ IlarisItemProxy (type dispatch)
│   │   │   ├── angriff.js         # Attack item model
│   │   │   ├── combat-item.js     # Combat item base
│   │   │   ├── effect-item.js     # Effect item model
│   │   │   └── manoever.js        # Maneuver model
│   │   ├── sheets/                # 17+ item sheet classes
│   │   │   ├── item.js            # ★ IlarisItemSheet (base class)
│   │   │   ├── fertigkeit.js      # Skill sheet
│   │   │   ├── talent.js          # Talent sheet
│   │   │   ├── vorteil.js         # Advantage sheet
│   │   │   ├── manoever.js        # Maneuver sheet
│   │   │   ├── eigenschaft.js     # Property sheet
│   │   │   ├── waffeneigenschaft → (in waffe/)
│   │   │   └── ...                # Other item type sheets
│   │   ├── templates/             # Item .hbs templates
│   │   ├── styles/                # Item CSS
│   │   └── _spec/                 # Item tests
│   │
│   ├── waffe/                     # Weapon subsystem
│   │   ├── hooks.js               # Weapon hooks
│   │   ├── data/                  # Weapon data models
│   │   ├── properties/            # ★ Weapon property system
│   │   │   └── utils/             # Property utilities + eigenschaft-cache
│   │   ├── migrations/            # Data migrations for weapon properties
│   │   ├── sheets/                # Weapon sheets
│   │   ├── templates/             # Weapon .hbs templates
│   │   ├── styles/                # Weapon CSS
│   │   └── _spec/                 # Weapon tests
│   │
│   ├── combat/                    # Combat system
│   │   ├── hooks.js               # Combat hooks
│   │   ├── dialogs/               # Combat roll dialogs
│   │   ├── dice/                  # Dice logic for combat
│   │   ├── templates/             # Combat .hbs templates
│   │   ├── styles/                # Combat CSS
│   │   └── _spec/                 # Combat tests
│   │
│   ├── dice/                      # General dice system
│   │   ├── hooks.js               # Dice hooks
│   │   ├── templates/             # Dice .hbs templates
│   │   ├── styles/                # Dice CSS
│   │   └── _spec/                 # Dice tests
│   │
│   ├── effects/                   # Active effects
│   │   ├── hooks.js               # Effect hooks
│   │   ├── templates/             # Effect .hbs templates
│   │   └── styles/                # Effect CSS
│   │
│   ├── skills/                    # Skill check system
│   │   ├── hooks.js               # Skill hooks
│   │   ├── dialogs/               # Skill check dialogs
│   │   ├── dice/                  # Skill check dice logic
│   │   └── templates/             # Skill .hbs templates
│   │
│   ├── tokens/                    # Token system
│   │   ├── hooks.js               # Token hooks
│   │   └── styles/                # Token CSS
│   │
│   ├── importer/                  # Sephrasto XML import
│   │   ├── hooks.js               # Importer hooks
│   │   ├── xml_rule_importer/     # XML parsing and import logic
│   │   ├── templates/             # Importer .hbs templates
│   │   └── styles/                # Importer CSS
│   │
│   ├── settings/                  # System settings
│   │   ├── hooks.js               # Settings hooks
│   │   ├── templates/             # Settings .hbs templates
│   │   └── styles/                # Settings CSS
│   │
│   ├── changelog/                 # Changelog notification
│   │   ├── hooks.js               # Changelog hooks
│   │   ├── templates/             # Changelog .hbs templates
│   │   └── styles/                # Changelog CSS
│   │
│   └── common/                    # Shared utilities
│
├── comp_packs/                    # ═══ COMPENDIUM DATA ═══
│   ├── beispiel-helden/           # Example heroes (Actor documents)
│   ├── fertigkeiten-und-talente/  # Skills & talents
│   ├── fertigkeiten-und-talente-advanced/  # Advanced skills
│   ├── gegenstande/               # Equipment & items
│   ├── kreaturen/                 # Creatures
│   ├── kurzuebersichten/          # Quick reference cards (Journals)
│   ├── liturgien-und-mirakel/     # Liturgies & miracles
│   ├── macro-tools/               # Utility macros
│   ├── manover/                   # Combat maneuvers
│   ├── ubernaturliche-fertigkeiten/  # Supernatural skills
│   ├── vorteile/                  # Advantages
│   ├── waffen/                    # Weapons
│   ├── waffeneigenschaften/       # Weapon properties
│   ├── zauberspruche-und-rituale/ # Spells & rituals
│   └── zaubertricks-advanced/     # Advanced cantrips
│   │   Each pack has:
│   │   ├── _source/               # ★ Authoritative JSON (edit HERE)
│   │   ├── *.ldb                  # LevelDB (generated by pack-all)
│   │   ├── CURRENT, LOCK, LOG, MANIFEST-*
│
├── assets/                        # ═══ STATIC ASSETS ═══
│   ├── fonts/                     # Andada, Aniron, Crimson Text
│   ├── game-icons.net/            # Game icon SVGs
│   └── images/                    # Background, icons, Ilaris branding, skill/token images
│
├── styles/                        # Global CSS files
├── docs/                          # MkDocs documentation
│   ├── index.md, foundry-basics.md, einstellungen.md, hausregeln.md, faq.md
│   ├── develop/                   # Developer docs (tools, bug-fix, release)
│   └── img/                       # Documentation images
│
└── utils/                         # Build & migration scripts
    ├── pack-all.js                # ★ Packs _source/ into LevelDB
    ├── update-compendium-stats.mjs
    ├── migrate-compendium-eigenschaften.mjs
    ├── migrate-waffen-source.mjs
    └── ...
```

## Design Patterns

### Hook Registration Pattern

Each feature module has a `hooks.js` that registers Foundry hooks. All are imported centrally:

```js
// scripts/core/hooks.js — central import
import './init.js'
import '../actors/hooks.js'
import '../items/hooks.js'
import '../waffe/hooks.js'
// ... all other feature hooks
```

### Sheet Class Pattern (AppV2)

All sheets follow the Foundry v2 Application pattern:

```js
// Base: HandlebarsApplicationMixin + SheetV2
export class IlarisActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
    static DEFAULT_OPTIONS = {
        /* classes, position, actions, form */
    }
    static PARTS = {
        /* named template parts with scroll management */
    }
    static TABS = {
        /* tab groups with initial selection */
    }

    async _prepareContext(options) {
        /* data for templates */
    }
    // Static action handlers: MySheet.actionName
}
```

### Proxy / Type Dispatch Pattern

`IlarisActorProxy` and `IlarisItemProxy` dispatch to type-specific classes:

- `scripts/actors/data/proxy.js` → routes `held` to `HeldenData`, `kreatur` to `KreaturData`
- `scripts/items/data/proxy.js` → routes each of the 22 item types to its specific class

### Compendium Data Flow

```
1. Edit JSON in comp_packs/<pack>/_source/*.json
2. Run `npm run pack-all`
3. LevelDB files regenerated in comp_packs/<pack>/
4. Foundry reads LevelDB at runtime
```

### Feature Module Structure

Every feature follows the same directory pattern:

```
scripts/<feature>/
├── hooks.js       # Hook registrations
├── data/          # Data models (business logic)
├── sheets/        # UI sheet classes
├── templates/     # Handlebars .hbs
├── styles/        # CSS
└── _spec/         # Jest tests
```

## CI/CD Workflows

Located in `.github/workflows/`:

| Workflow                  | Purpose                                                |
| ------------------------- | ------------------------------------------------------ |
| `build-packs.yml`         | Builds and releases packages, publishes to Foundry VTT |
| `codestyle.yml`           | Runs ESLint + Prettier checks                          |
| `test.yml`                | Runs Jest tests                                        |
| `deploy.yml`              | Deployment workflow                                    |
| `test-foundry-deploy.yml` | Tests Foundry deployment                               |
