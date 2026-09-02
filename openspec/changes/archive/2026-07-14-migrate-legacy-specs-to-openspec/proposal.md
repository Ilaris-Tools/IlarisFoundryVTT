## Why

The Ilaris system has accumulated ~26 spec directories in `docs/_specs/` over 7 months of development (January–June 2026). These specs follow no consistent format — some are single planning documents, others are multi-file structured inventories, and two are empty folders. Several specs are outdated relative to the actual code. The project has adopted the OpenSpec structure (`openspec/`) with `config.yaml` already configured, but `openspec/specs/` and `openspec/changes/` remain empty. This migration brings the spec corpus into the OpenSpec framework with **code as ground truth**, creating clean, maintainable capability specs that reflect the current state of the system.

## What Changes

- **Create 11 capability specs** in `openspec/specs/` derived from code analysis and distilled from legacy spec content
- **Create 1 change proposal** (`add-supernatural-pre-effects`) for the planned-but-unimplemented übernatürlich pre-effects feature
- **Delete** `docs/_specs/` and all 26 legacy spec directories after migration is verified
- **No code changes** — this is a pure documentation/spec migration. No application behavior is modified, added, or removed.

## Capabilities

### New Capabilities

Each capability spec documents requirements extracted from the actual codebase, with data model sections (Option A — self-contained per capability):

- `active-effects`: IlarisActiveEffect document class, IlarisActiveEffectConfig (AppV2 tab), owner-scoped turn timing (two-phase: combatTurn + updateCombat), DOT effects via `change.type === "dot"`, formula resolution
- `combat`: CombatDialog base class, AngriffDialog (melee), FernkampfAngriffDialog (ranged), UebernatuerlichDialog (supernatural), TargetSelectionDialog, defense prompts, damage application, maneuver integration, 10 mirrored global hooks (`Ilaris.global.*`), multiplayer socket routing
- `dice`: Würfelwurf dispatch, crit/fumble evaluation (real/generous modes), FertigkeitDialog with live preview, postRollToChat, status effect checks
- `weapons`: WaffeItem base class with TP computation, processor-based Eigenschaft system (5 processor types: modifier, wielding, target_effect, passive, actor_modifier), Eigenschaft cache, parameterized property parsing, migration from boolean to array format, weapon sheets
- `actor-sheets`: Held sheet (AppV2), Kreatur sheet (AppV2), NSC sheet (AppV2), actor data models with `defineSchema()`, template parts and tabs
- `item-sheets`: All 22 item type sheets (AppV2), item data models, TypeDataModel registration in `type-data-models.js`
- `settings`: IlarisSettingsDialog (AppV2, 3 tabs: compendiums, general, automation), all registered game settings, save/reset workflow
- `importer`: XML character import from Sephrasto, XML rule import into compendiums, Sephrasto database import, progress overlay, legacy type aliases
- `e2e-testing`: Playwright test infrastructure, 21 test cases, shared fixtures/helpers, browser channel configuration (Edge on Windows, Chrome elsewhere), sequential execution model
- `release`: Breaking changes notification dialog, changelog display, version comparison
- `architecture`: File structure conventions, build system (`npm run pack-all`, `npm test`, `npm run lint`), agent instructions (`.github/`), CSS organization, ES module entry points, AppV2 migration status (V13→V14 complete)

### Modified Capabilities

None — all existing `openspec/specs/` are empty, so there are no existing requirements to modify.

## Impact

- **Affected directories**: `openspec/specs/` (11 new capability directories created), `openspec/changes/add-supernatural-pre-effects/` (new change), `docs/_specs/` (deleted)
- **No runtime impact**: No JavaScript, Handlebars, CSS, or compendium files are modified
- **No API impact**: No Foundry VTT API classes, hooks, or utilities are touched
- **Build impact**: None — `npm test`, `npm run lint`, `npm run pack-all` are unaffected
- **Future workflow impact**: All future changes will reference capability specs in `openspec/specs/` as their baseline. The `add-supernatural-pre-effects` change becomes the first change to use the new spec structure as its foundation.
