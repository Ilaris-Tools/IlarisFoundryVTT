# Repository-Wide Copilot Instructions — Ilaris FoundryVTT System

## Project Summary

Ilaris is a **Foundry VTT game system** implementing the Ilaris tabletop RPG ruleset (German P&P). It provides character sheets (Helden, Kreaturen), combat mechanics, skill checks, spells/liturgies, weapon properties, and compendium data management.

- **Repository**: <https://github.com/Ilaris-Tools/IlarisFoundryVTT>
- **Runtime**: Foundry VTT (browser-based, ES modules)
- **Language**: JavaScript (ES modules), HTML (Handlebars `.hbs`), CSS
- **Domain language**: German (labels, identifiers, comments, compendium data). Code structure and documentation use a mix of German and English.

## Architecture at a Glance

| Directory            | Purpose                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `scripts/core/`      | Entry point (`hooks.js` → `init.js`), config, Handlebars helpers, base documents |
| `scripts/actors/`    | Actor data models (`held`, `kreatur`, `nsc`), sheets (AppV2), hooks              |
| `scripts/items/`     | 22 item types, data models, sheets, hooks                                        |
| `scripts/waffe/`     | Weapon subsystem (properties, migrations, computed values)                       |
| `scripts/combat/`    | Combat tracker, dialogs, dice logic                                              |
| `scripts/dice/`      | Dice rolling UI and logic                                                        |
| `scripts/effects/`   | Active effects system                                                            |
| `scripts/skills/`    | Skill check dialogs and dice                                                     |
| `scripts/tokens/`    | Token configuration and rendering                                                |
| `scripts/importer/`  | XML import from Sephrasto                                                        |
| `scripts/settings/`  | System settings UI                                                               |
| `scripts/changelog/` | In-app changelog notification                                                    |
| `comp_packs/`        | LevelDB compendium packs with `_source/` JSON                                    |
| `assets/`            | Images, fonts, icons                                                             |
| `styles/`            | Global CSS                                                                       |
| `docs/`              | User and developer documentation (MkDocs)                                        |
| `utils/`             | Build/migration scripts (pack-all, compendium tools)                             |

## Key Files

- `system.json` — System manifest (id, version, compatibility, esmodules, styles)
- `template.json` — Data model schemas for all Actor and Item types
- `scripts/core/hooks.js` — ES module entry point (imports all feature hooks)
- `scripts/core/init.js` — `Hooks.once('init', ...)` registration of sheets, document classes, config
- `scripts/core/config.js` — `CONFIG.ILARIS` constants

## Build & Development

- **Install**: `npm install`
- **Test**: `npm test` (Jest, config in `jest.config.mjs`, setup in `jest.setup.js`)
- **Lint**: `npm run lint` (ESLint + Prettier)
- **Format**: `npm run prettier`
- **Pack compendiums**: `npm run pack-all` (packs `_source/` JSON into LevelDB)
- **Start Foundry**: `npm run start-foundry` (runs pack-all, then `fvtt launch`)
- **Optimize SVGs**: `npm run optimize-svgs`
- **Pre-commit**: Husky + lint-staged runs ESLint and Prettier on staged files

Always run `npm install` before building or testing. Always run `npm run pack-all` after modifying compendium `_source/` data.

## Code Conventions

- **ES Modules** throughout (`import`/`export`, declared in `system.json` `esmodules`)
- **Foundry AppV2** for sheets: `HandlebarsApplicationMixin(ActorSheetV2)` / `HandlebarsApplicationMixin(ItemSheetV2)`
- **Static class properties**: `DEFAULT_OPTIONS`, `PARTS`, `TABS` on sheet classes
- **Handlebars templates**: `.hbs` files in per-feature `templates/` directories
- **Tests**: `_spec/` directories colocated with feature code, Jest with Babel transforms
- **Naming**: German domain terms in data/UI (Fertigkeiten, Zauber, Waffen), English in structural code (hooks, sheets, utils)
- **No TypeScript** — pure JavaScript with JSDoc where present

## Foundry VTT API

**Always consult**: <https://foundryvtt.com/api/>

Never guess about Hooks, utility methods (`foundry.utils.*`), Document classes, data models, socket communication, or Canvas/rendering APIs. If the API docs are unclear, ask the user.

## Precedence Rules

Instruction precedence (highest to lowest):

1. **Path-specific instructions** (`.github/instructions/*.instructions.md`) — scoped by `applyTo` glob
2. **This file** (`.github/copilot-instructions.md`) — repository-wide baseline
3. **`AGENTS.md`** (root) — tool-agnostic agent behavior and orchestration contracts
4. **`.agents/` documentation** — detailed project knowledge base

In case of conflict, higher-precedence instructions override lower ones. See `.agents/README.md` for the full documentation map.

## Agent Profile Resolution (Mandatory)

When delegating work to a subagent, use `.github/agents/*.md` as the canonical source for that subagent's role, scope, boundaries, and output format.

Canonical mapping:

- `Planner` -> `.github/agents/planner.md`
- `Researcher` -> `.github/agents/researcher.md`
- `Reviewer` -> `.github/agents/reviewer.md`
- `Setup Specialist` -> `.github/agents/setup-specialist.md`

Operational rules:

- Before using one of these subagents, consult the mapped profile file in the current workspace.
- Use the YAML frontmatter `name` and `description` as the canonical identity metadata.
- Do not invent responsibilities that are not present in the mapped profile.
- If a mapped profile is missing, fall back to `AGENTS.md` and clearly state this fallback in the handoff/report.
