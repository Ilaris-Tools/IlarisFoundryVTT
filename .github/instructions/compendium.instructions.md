---
applyTo: 'comp_packs/**,**/comp_packs/**'
---

# Compendium Data Conventions — Ilaris

## Structure

Compendium packs are stored in `comp_packs/` as LevelDB databases. Each pack has a `_source/` directory containing the authoritative JSON source files.

### Available Packs

| Pack Directory                       | Content                         |
| ------------------------------------ | ------------------------------- |
| `beispiel-helden/`                   | Example hero actors             |
| `fertigkeiten-und-talente/`          | Skills and talents              |
| `fertigkeiten-und-talente-advanced/` | Advanced skills and talents     |
| `gegenstande/`                       | Equipment and items             |
| `kreaturen/`                         | Creatures                       |
| `kurzuebersichten/`                  | Quick reference journal entries |
| `liturgien-und-mirakel/`             | Liturgies and miracles          |
| `macro-tools/`                       | Utility macros                  |
| `manover/`                           | Combat maneuvers                |
| `ubernaturliche-fertigkeiten/`       | Supernatural skills             |
| `vorteile/`                          | Advantages                      |
| `waffen/`                            | Weapons                         |
| `waffeneigenschaften/`               | Weapon properties               |
| `zauberspruche-und-rituale/`         | Spells and rituals              |
| `zaubertricks-advanced/`             | Advanced cantrips               |

## Editing Workflow

1. **Always edit the `_source/` JSON files** — never modify LevelDB files directly.
2. Run `npm run pack-all` to rebuild LevelDB packs from `_source/` data.
3. Pack names in `system.json` must match their directory names in `comp_packs/`.

## JSON Format

Each `_source/` JSON file represents a single Foundry Document. Common fields:

```json
{
    "_id": "unique-id-string",
    "name": "Entitätsname",
    "type": "item-type",
    "system": {
        // type-specific data matching template.json schemas
    },
    "img": "systems/Ilaris/assets/images/...",
    "flags": {},
    "effects": [],
    "_key": "!items!unique-id-string"
}
```

## Domain Data

- Item/Actor structures follow `template.json` schemas exactly.
- German names and descriptions are standard.
- Image paths use `systems/Ilaris/assets/...` prefix.

## Build Tools

- `utils/pack-all.js` — Packs all `_source/` JSON into LevelDB
- `utils/update-compendium-stats.mjs` — Updates creature statistics
- `utils/migrate-compendium-eigenschaften.mjs` — Migrates weapon property data
- `utils/migrate-waffen-source.mjs` — Migrates weapon source data
