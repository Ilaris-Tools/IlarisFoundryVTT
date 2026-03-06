# Execution Plan: Feature-Based Restructure

Generated: 2026-02-25  
Reference: [feature_datei_strukur_change.md](feature_datei_strukur_change.md)

## Overview

This plan breaks down the 20 todos into concrete, sequenced tasks with explicit file paths and dependencies.

**Execution Phases:**

1. **Infrastructure Setup** (2 tasks) -- Create core/ and prepare tools
2. **Feature Migrations** (11 tasks) -- Migrate features in dependency order
3. **Integration & Finalization** (2 tasks) -- Update imports and cleanup

**Estimated Effort:** ~40-60 hours (depends on code review accuracy)

---

## Phase 1: Infrastructure Setup

### Task 1.1: Create `scripts/core/` and Bootstrap

**Depends on:** Nothing  
**Required before:** All other tasks  
**Files moved:** ~8-10 files

```
From:
  scripts/config.js
  scripts/config/label.js
  scripts/common/handlebars.js
  scripts/common/utilities.js
  scripts/documents/* (all files)
  (extract Hooks.once('init', ...) from scripts/hooks.js → core/init.js)
  (create core/hooks.js importing features)

To:
  scripts/core/config.js
  scripts/core/config/label.js
  scripts/core/handlebars.js
  scripts/core/utilities.js
  scripts/core/documents/*
  scripts/core/init.js (NEW - extracted init logic)
  scripts/core/hooks.js (NEW - slim orchestrator)
```

**Subtasks:**

- [ ] 1.1.1 Create directory structure: `scripts/core/{config,documents,styles,_spec}/`
- [ ] 1.1.2 Copy `scripts/config.js` → `scripts/core/config.js`
- [ ] 1.1.3 Copy `scripts/config/label.js` → `scripts/core/config/label.js`
- [ ] 1.1.4 Copy `scripts/common/handlebars.js` → `scripts/core/handlebars.js`
- [ ] 1.1.5 Copy `scripts/common/utilities.js` → `scripts/core/utilities.js`
- [ ] 1.1.6 Copy `scripts/documents/*` → `scripts/core/documents/`
- [ ] 1.1.7 Extract `Hooks.once('init', ...)` from `scripts/hooks.js` → **NEW** `scripts/core/init.js`:
    - Include: CONFIG setup, handlebars init, document class registration, settings registration
    - Include: `ready` orchestrator calling `preloadAllEigenschaften()`, `preloadAbgeleiteteWerteDefinitions()`, actor.prepareData(), `runMigrationIfNeeded()`, then feature ready callbacks
    - **Imports from current hooks.js:**
        ```js
        import { preloadAllEigenschaften } from '../waffe/properties/utils/eigenschaft-cache.js'
        import { preloadAbgeleiteteWerteDefinitions } from '../actors/actor.js'
        import { runMigrationIfNeeded } from '../migrations/migrate-waffen-eigenschaften.js'
        import { combatReady } from '../combat/hooks.js'
        import { tokensReady } from '../tokens/hooks.js'
        import { importerReady } from '../importer/hooks.js'
        ```
- [ ] 1.1.8 Create **NEW** `scripts/core/hooks.js` (slim orchestrator):
    ```js
    import './init.js'
    import '../actors/hooks.js'
    import '../items/hooks.js'
    import '../waffe/hooks.js'
    import '../combat/hooks.js'
    import '../dice/hooks.js'
    import '../effects/hooks.js'
    import '../tokens/hooks.js'
    import '../importer/hooks.js'
    import '../settings/hooks.js'
    import '../migrations/hooks.js'
    import '../changelog/hooks.js'
    ```
- [ ] 1.1.9 Update `system.json` `esmodules` entry: `"scripts/hooks.js"` → `"scripts/core/hooks.js"`

---

### Task 1.2: Prepare CSS & Template Path Audit Tools

**Depends on:** Task 1.1 (core structure exists)  
**Required before:** Phase 2 (optional, but helps)

**Subtasks:**

- [ ] 1.2.1 Create regex mapping file: `docs/_specs/2026_2_24_datei_struktur/TEMPLATE_PATHS_MAP.md`
    - Scan `scripts/` for all `"templates/..."` string literals using regex: `"templates/[^"]+"`
    - Document source → target mappings (e.g., `templates/sheets/helden.hbs` → `scripts/actors/templates/helden.hbs`)
    - Group by feature (actors, items, waffe, combat, skills, dice, effects, importer, settings, changelog)

- [ ] 1.2.2 Create CSS class audit spreadsheet: `docs/_specs/2026_2_24_datei_struktur/CSS_CLASS_SPLIT.md`
    - List all CSS selectors from `css/temp.css` and `styles/**/*.css`
    - Assign each class to target feature CSS file
    - Flag ambiguous/shared classes for manual review

- [ ] 1.2.3 Create import path mapping: `docs/_specs/2026_2_24_datei_struktur/IMPORT_PATHS_MAP.md`
    - Scan `scripts/` for import/require statements
    - Document old → new paths

---

## Phase 2: Feature Migrations

Dependencies graph:

- **waffe** ← (none, independent)
- **items** ← (none, will import from waffe)
- **actors** ← (waffe - for weapon-utils)
- **dice** ← (none, independent)
- **combat** ← (items, waffe, actors, dice)
- **skills** ← (dice, combat dependencies)
- **effects** ← (none, independent)
- **tokens** ← (none, independent)
- **importer** ← (none - standalone)
- **settings** ← (none, independent)
- **migrations** ← (waffe - for waffen-migration files)
- **changelog** ← (none, independent)

### Task 2.1: Migrate `waffe/` Feature

**Depends on:** Task 1.1  
**Required before:** items, actors, combat, migrations

```
From:
  scripts/items/waffe.js
  scripts/sheets/items/waffe-base.js, nahkampfwaffe.js, fernkampfwaffe.js, waffeneigenschaft.js
  scripts/items/eigenschaft-processors/*
  scripts/items/utils/eigenschaft-*.js
  scripts/migrations/migrate-waffen-eigenschaften.js
  scripts/common/waffen-migration.js
  scripts/hooks/waffen-migration.js
  templates/sheets/items/nahkampfwaffe.hbs, fernkampfwaffe.hbs, waffeneigenschaft.hbs
  (extract weapon-specific CSS from css/temp.css)

To:
  scripts/waffe/data/waffe.js
  scripts/waffe/sheets/{waffe.js, nahkampfwaffe.js, fernkampfwaffe.js, waffeneigenschaft.js}
  scripts/waffe/properties/processors/*
  scripts/waffe/properties/utils/*
  scripts/waffe/migrations/{migrate-waffen-eigenschaften.js, waffen-migration.js, waffen-migration-hook.js}
  scripts/waffe/templates/{nahkampfwaffe.hbs, fernkampfwaffe.hbs, waffeneigenschaft.hbs}
  scripts/waffe/styles/waffe.css
  scripts/waffe/hooks.js (NEW)
  scripts/waffe/_spec/*
```

**Subtasks:**

- [ ] 2.1.1 Create directory structure: `scripts/waffe/{data,sheets,properties/{processors,utils},migrations,templates,styles,_spec}/`
- [ ] 2.1.2 Copy data model: `scripts/items/waffe.js` → `scripts/waffe/data/waffe.js`
- [ ] 2.1.3 Copy sheet classes: `scripts/sheets/items/{waffe-base.js→waffe.js, nahkampfwaffe.js, fernkampfwaffe.js, waffeneigenschaft.js}` → `scripts/waffe/sheets/`
- [ ] 2.1.4 Copy eigenschaft processors: `scripts/items/eigenschaft-processors/*` → `scripts/waffe/properties/processors/`
- [ ] 2.1.5 Copy eigenschaft utils: `scripts/items/utils/eigenschaft-*.js` → `scripts/waffe/properties/utils/`
- [ ] 2.1.6 Copy migrations: `{scripts/migrations/migrate-waffen-eigenschaften.js, scripts/common/waffen-migration.js, scripts/hooks/waffen-migration.js}` → `scripts/waffe/migrations/`
- [ ] 2.1.7 Copy weapon templates: `templates/sheets/items/{nahkampfwaffe.hbs, fernkampfwaffe.hbs, waffeneigenschaft.hbs}` → `scripts/waffe/templates/`
- [ ] 2.1.8 Extract weapon CSS from `css/temp.css` → **NEW** `scripts/waffe/styles/waffe.css`
    - Classes: weapon sheet styles, eigenschaft displays, weapon property indicators
- [ ] 2.1.9 Copy weapon tests: `scripts/items/_spec/waffe.spec.js, eigenschaft-*.spec.js` → `scripts/waffe/_spec/`
- [ ] 2.1.10 Create **NEW** `scripts/waffe/hooks.js`:
    ```js
    Hooks.once('init', () => {
        Items.unregisterSheet('core', CONFIG.Item.sheetClasses['waffe']?.default)
        Items.registerSheet('Ilaris', 'waffe', WaffeSheet, { makeDefault: true })
        Items.registerSheet('Ilaris', 'nahkampfwaffe', NahkampfwaffeSheet, { makeDefault: true })
        Items.registerSheet('Ilaris', 'fernkampfwaffe', FernkampfwaffeSheet, { makeDefault: true })
        Items.registerSheet('Ilaris', 'waffeneigenschaft', WaffeneigenschaftSheet, {
            makeDefault: true,
        })
    })
    ```
- [ ] 2.1.11 Update all imports within `waffe/` to reflect new paths

---

### Task 2.2: Migrate `items/` Feature

**Depends on:** Task 1.1, Task 2.1 (waffe extracted)  
**Required before:** actors, combat

```
From:
  scripts/items/{item.js, angriff.js, combat.js, effect-item.js, manoever.js, proxy.js}
  scripts/sheets/items/item.js, ruestung.js, fertigkeit.js, ... (non-weapon)
  templates/sheets/items/{ruestung.hbs, fertigkeit.hbs, ...} (non-weapon)
  styles/sheets/manoever.css

To:
  scripts/items/data/{item.js, angriff.js, combat-item.js, effect-item.js, manoever.js, proxy.js}
  scripts/items/sheets/{item.js, ruestung.js, fertigkeit.js, ...}
  scripts/items/templates/{ruestung.hbs, fertigkeit.hbs, ...}
  scripts/items/styles/{manoever.css, items.css (new)}
  scripts/items/hooks.js (NEW)
  scripts/items/_spec/*
```

**Subtasks:**

- [ ] 2.2.1 Create directory structure: `scripts/items/{data,sheets,templates,styles,_spec}/`
- [ ] 2.2.2 Copy non-weapon item data: `scripts/items/{item.js, angriff.js, combat.js, effect-item.js, manoever.js, proxy.js}` → `scripts/items/data/`
    - Rename: `combat.js` → `combat-item.js`
- [ ] 2.2.3 Copy item sheets: `scripts/sheets/items/item.js, ruestung.js, fertigkeit.js, talent.js, ...` (all non-weapon) → `scripts/items/sheets/`
- [ ] 2.2.4 Copy non-weapon templates: `templates/sheets/items/{ruestung.hbs, fertigkeit.hbs, talent.hbs, ...}` (non-weapon only) → `scripts/items/templates/`
    - Keep in `items/`, do NOT include weapon templates (those go to `waffe/`)
- [ ] 2.2.5 Copy existing manoever CSS: `styles/sheets/manoever.css` → `scripts/items/styles/manoever.css`
- [ ] 2.2.6 Extract non-weapon item CSS from `css/temp.css` → supplement `scripts/items/styles/items.css` (NEW)
    - Classes: `.ilaris` form groups, `.manoever-voraussetzungen`, `.maneuver-chip`, general item UI
- [ ] 2.2.7 Copy item tests: `scripts/items/_spec/{item.spec.js, manoever.spec.js, combat.spec.js}` → `scripts/items/_spec/`
- [ ] 2.2.8 Create **NEW** `scripts/items/hooks.js`:
    ```js
    Hooks.once('init', () => {
        Items.unregisterSheet('core', CONFIG.Item.sheetClasses.item?.default)
        // Register each non-weapon item type
        Items.registerSheet('Ilaris', 'ruestung', RuestungSheet, { makeDefault: true })
        Items.registerSheet('Ilaris', 'fertigkeit', FertigkeitSheet, { makeDefault: true })
        // ... etc for all non-weapon types
    })
    ```
- [ ] 2.2.9 Update all imports within `items/` to reflect new paths, especially `scripts/items/data/waffe.js` imports (now `../waffe/data/waffe.js`)

---

### Task 2.3: Migrate `actors/` Feature

**Depends on:** Task 1.1, Task 2.1 (waffe), Task 2.2 (items)  
**Required before:** combat

```
From:
  scripts/actors/{actor.js, held.js, kreatur.js, proxy.js, hardcodedvorteile.js, weapon-utils.js}
  scripts/sheets/{actor.js, helden.js, kreatur.js}
  templates/sheets/{kreatur.hbs, tabs/*}
  (extract actor CSS from css/temp.css)

To:
  scripts/actors/data/{actor.js, held.js, kreatur.js, proxy.js, hardcodedvorteile.js, actor-weapon-utils.js}
  scripts/actors/sheets/{actor.js, held.js (renamed from helden.js), kreatur.js}
  scripts/actors/templates/{kreatur.hbs, held/header.hbs, ...}
  scripts/actors/styles/{actors.css, sidebar.css}
  scripts/actors/hooks.js (NEW)
  scripts/actors/_spec/*
```

**Subtasks:**

- [ ] 2.3.1 Create directory structure: `scripts/actors/{data,sheets,templates/{held},styles,_spec}/`
- [ ] 2.3.2 Copy actor data models: `scripts/actors/{actor.js, held.js, kreatur.js, proxy.js, hardcodedvorteile.js, weapon-utils.js}` → `scripts/actors/data/`
    - Rename: `weapon-utils.js` → `actor-weapon-utils.js`
- [ ] 2.3.3 Copy actor sheets: `scripts/sheets/{actor.js, helden.js, kreatur.js}` → `scripts/actors/sheets/`
    - Rename: `helden.js` → `held.js`
- [ ] 2.3.4 Copy actor templates: `templates/sheets/{kreatur.hbs}` + `templates/sheets/tabs/*.*` → `scripts/actors/templates/held/`
- [ ] 2.3.5 Extract actor CSS from `css/temp.css` → **NEW** `scripts/actors/styles/actors.css`
    - Classes: hero sheet (`.herosheet`, `.heroheader`, `.herotabnavigation`, etc.), creature sheet (`.kreatur-sheet`, etc.), general actor styles
- [ ] 2.3.6 Extract sidebar/table CSS from `css/temp.css` → **NEW** `scripts/actors/styles/sidebar.css`
    - Classes: `.twokindrow`, `tr:nth-child`, `.icon-overlay-container`, `.item-toggle`, `.sync-items`, `#lebensleiste`, `.triStateBtn`
- [ ] 2.3.7 Copy actor tests: `scripts/actors/_spec/{hardcodedvorteile.test.js, weapon-utils.test.js}` → `scripts/actors/_spec/`
- [ ] 2.3.8 Create **NEW** `scripts/actors/hooks.js`:

    ```js
    Hooks.once('init', () => {
        Actors.unregisterSheet('core', CONFIG.Actor.sheetClasses.character?.default)
        Actors.registerSheet('Ilaris', 'held', HeldSheet, { makeDefault: true })
        Actors.registerSheet('Ilaris', 'kreatur', KreaturSheet, { makeDefault: true })
    })

    export function actorsReady() {
        // If any actor-specific ready logic is needed
    }
    ```

- [ ] 2.3.9 Update all imports within `actors/` to reflect new paths, especially imports from `waffe/`, `items/`, and `dice/`

---

### Task 2.4: Migrate `dice/` Feature

**Depends on:** Task 1.1  
**Required before:** combat, skills

```
From:
  scripts/common/wuerfel/{chatutilities.js, wuerfel_misc.js}
  templates/chat/{dreid20.hbs, spell_cost.hbs, spell_result.hbs, yesno.hbs}
  (extract dice CSS from css/temp.css)

To:
  scripts/dice/{chatutilities.js, wuerfel_misc.js}
  scripts/dice/templates/{dreid20.hbs, spell_cost.hbs, spell_result.hbs}
  scripts/dice/styles/dice.css
  scripts/dice/hooks.js (NEW)
  scripts/dice/_spec/*
```

**Subtasks:**

- [ ] 2.4.1 Create directory structure: `scripts/dice/{templates,styles,_spec}/`
- [ ] 2.4.2 Copy dice utilities: `scripts/common/wuerfel/{chatutilities.js, wuerfel_misc.js}` → `scripts/dice/`
- [ ] 2.4.3 Copy dice templates: `templates/chat/{dreid20.hbs, spell_cost.hbs, spell_result.hbs}` → `scripts/dice/templates/`
    - **Delete:** `yesno.hbs` (no longer used)
- [ ] 2.4.4 Extract dice CSS from `css/temp.css` → **NEW** `scripts/dice/styles/dice.css`
    - Classes: `.chat-message` styling, dice roll display
- [ ] 2.4.5 Copy dice tests: `scripts/common/wuerfel/_spec/wuerfel_misc.spec.js` → `scripts/dice/_spec/`
- [ ] 2.4.6 Create **NEW** `scripts/dice/hooks.js`:
    ```js
    Hooks.on('renderChatMessage', (app, html, data) => {
        // Dice formula formatting (from current hooks.js)
    })
    ```
- [ ] 2.4.7 Update all imports within `dice/` files

---

### Task 2.5: Migrate `combat/` Feature

**Depends on:** Task 1.1, Task 2.2 (items), Task 2.3 (actors), Task 2.4 (dice)  
**Required before:** skills

```
From:
  scripts/items/combat.js (moved to items as combat-item.js)
  scripts/actors/weapon-utils.js (moved to actors as actor-weapon-utils.js)
  scripts/sheets/dialogs/{angriff.js, ...}
  scripts/common/wuerfel/{nahkampf_prepare.js, fernkampf_prepare.js}
  templates/sheets/dialogs/{angriff.hbs, ...}
  templates/chat/probendiag_*.hbs (some)
  styles/chat/defense-prompt.css

To:
  scripts/combat/dialogs/{angriff.js, combat_dialog.js, ...}
  scripts/combat/dice/{nahkampf_prepare.js, fernkampf_prepare.js}
  scripts/combat/templates/dialogs/{angriff.hbs, ...}
  scripts/combat/templates/chat/ (new combat-specific chat templates)
  scripts/combat/styles/{defense-prompt.css, combat.css}
  scripts/combat/hooks.js (NEW)
  scripts/combat/_spec/*
```

**Subtasks:**

- [ ] 2.5.1 Create directory structure: `scripts/combat/{dialogs,dice,templates/{dialogs,chat},styles,_spec}/`
- [ ] 2.5.2 Copy combat dialogs: `scripts/sheets/dialogs/{angriff.js, combat_dialog.js, dialog_nahkampf.js, fernkampf_angriff.js, defense_button_hook.js, target_selection.js, shared_dialog_helpers.js, uebernatuerlich.js}` → `scripts/combat/dialogs/`
- [ ] 2.5.3 Copy combat dice: `scripts/common/wuerfel/{nahkampf_prepare.js, fernkampf_prepare.js}` → `scripts/combat/dice/`
- [ ] 2.5.4 Copy combat dialog templates: `templates/sheets/dialogs/{angriff.hbs, fernkampf_angriff.hbs, target_selection.hbs, uebernatuerlich.hbs}` → `scripts/combat/templates/dialogs/`
    - **Delete:** `probendiag_at.hbs`, `probendiag_nahkampf.hbs`, `probendiag_fernkampf.hbs`, `probendiag_attribut.hbs` (deprecated)
- [ ] 2.5.5 Copy + consolidate combat chat templates → `scripts/combat/templates/chat/` (new)
    - May need to update references in combat JS files
- [ ] 2.5.6 Copy existing defense-prompt CSS: `styles/chat/defense-prompt.css` → `scripts/combat/styles/defense-prompt.css`
- [ ] 2.5.7 Extract combat CSS from `css/temp.css` → supplement `scripts/combat/styles/combat.css` (NEW)
    - Classes: `.clickable-summary`, `.button-icon-nahkampf`, combat UI
- [ ] 2.5.8 Copy combat tests: `scripts/sheets/_spec/{shared_dialog_helpers.test.js, uebernatuerlich.spec.js, verbotene_pforten.spec.js}` → `scripts/combat/_spec/`
- [ ] 2.5.9 Create **NEW** `scripts/combat/hooks.js`:

    ```js
    Hooks.once('init', () => {
      CONFIG.statusEffects = [ ... ] // from current hooks.js
    })

    Hooks.on('renderChatMessage', (app, html, data) => {
      // Defense prompt in chat (from current hooks.js)
    })

    Hooks.on('renderTokenHUD', (app, html, data) => {
      // Token HUD tinting logic
    })

    export function combatReady() {
      registerDefenseButtonHook()
      setupIlarisSocket()
    }
    ```

- [ ] 2.5.10 Update all imports within `combat/` to reflect new paths

---

### Task 2.6: Migrate `skills/` Feature

**Depends on:** Task 1.1, Task 2.4 (dice), Task 2.5 (combat)  
**Required before:** None (but depends on above)

```
From:
  scripts/sheets/dialogs/{fertigkeit.js, uebernatuerlich dialog logic}
  scripts/common/wuerfel/{magie_prepare.js, karma_prepare.js}
  templates/sheets/dialogs/fertigkeit.hbs
  templates/chat/{probenchat_profan.hbs, probendiag_profan.hbs, ...}

To:
  scripts/skills/dialogs/{fertigkeit.js, uebernatuerlich.js}
  scripts/skills/dice/{magie_prepare.js, karma_prepare.js}
  scripts/skills/templates/dialogs/fertigkeit.hbs
  scripts/skills/templates/chat/{probenchat_profan.hbs, ...}
  scripts/skills/hooks.js (if needed)
  scripts/skills/_spec/*
```

**Subtasks:**

- [ ] 2.6.1 Create directory structure: `scripts/skills/{dialogs,dice,templates/{dialogs,chat},_spec}/`
- [ ] 2.6.2 Copy skill dialogs: `scripts/sheets/dialogs/fertigkeit.js` + uebernatuerlich skill logic → `scripts/skills/dialogs/{fertigkeit.js, uebernatuerlich.js}`
- [ ] 2.6.3 Copy skill dice: `scripts/common/wuerfel/{magie_prepare.js, karma_prepare.js}` → `scripts/skills/dice/`
- [ ] 2.6.4 Copy skill templates: `templates/sheets/dialogs/fertigkeit.hbs` → `scripts/skills/templates/dialogs/`
- [ ] 2.6.5 Copy skill chat templates: `templates/chat/probenchat_profan.hbs` → `scripts/skills/templates/chat/`
    - **Delete:** `probendiag_profan.hbs`, `probendiag_magie.hbs`, `probendiag_karma.hbs`, `probendiag_simpleformula.hbs` (deprecated)
- [ ] 2.6.6 Copy skill tests (if any) → `scripts/skills/_spec/`
- [ ] 2.6.7 Create `scripts/skills/hooks.js` if needed (likely empty or just imports)
- [ ] 2.6.8 Update all imports within `skills/` to reflect new paths

---

### Task 2.7: Migrate `effects/` Feature

**Depends on:** Task 1.1  
**Required before:** None (but relatively independent)

```
From:
  scripts/hooks/active-effects.js
  scripts/hooks/dot-effects.js
  scripts/sheets/common/effects-manager.js
  templates/helper/effects-section.hbs
  (extract effects CSS from css/temp.css)

To:
  scripts/effects/{active-effects.js, dot-effects.js, effects-manager.js}
  scripts/effects/templates/effects-section.hbs
  scripts/effects/styles/effects.css
  scripts/effects/hooks.js
```

**Subtasks:**

- [ ] 2.7.1 Create directory structure: `scripts/effects/{templates,styles,_spec}/`
- [ ] 2.7.2 Copy effects files: `{scripts/hooks/active-effects.js, scripts/hooks/dot-effects.js, scripts/sheets/common/effects-manager.js}` → `scripts/effects/`
- [ ] 2.7.3 Copy effects template: `templates/helper/effects-section.hbs` → `scripts/effects/templates/`
- [ ] 2.7.4 Extract effects CSS from `css/temp.css` → **NEW** `scripts/effects/styles/effects.css`
    - Classes: `.effects-section`, `.effects-list`, `.effect-item`, `.no-effects`
- [ ] 2.7.5 Create **NEW** `scripts/effects/hooks.js`:
    ```js
    // Combine hooks from active-effects.js and dot-effects.js
    Hooks.on('preCreateActiveEffect', (effect, data, options, userId) => { ... })
    // ... etc
    ```
- [ ] 2.7.6 Update all imports within `effects/`

---

### Task 2.8: Migrate `tokens/` Feature

**Depends on:** Task 1.1  
**Required before:** None (independent)

```
From:
  (extract hex token logic from scripts/hooks.js)
  (extract token CSS from css/temp.css)

To:
  scripts/tokens/hooks.js (NEW - contains all hex token logic)
  scripts/tokens/styles/tokens.css
```

**Subtasks:**

- [ ] 2.8.1 Create directory structure: `scripts/tokens/{styles,_spec}/` (minimal)
- [ ] 2.8.2 Extract hex token shapes logic from `scripts/hooks.js`:
    - Extract `drawToken`, `refreshToken` hook handlers
    - Extract `applyHexMaskToToken`, related utilities (~150 lines)
    - Extract `applyHexTokenSetting` logic
- [ ] 2.8.3 Create **NEW** `scripts/tokens/hooks.js`:

    ```js
    Hooks.on('drawToken', (token, context) => { ... })
    Hooks.on('refreshToken', (token) => { ... })
    Hooks.on('updateSetting', (setting, value) => { ... })
    // Hex token utility functions
    function applyHexMaskToToken(canvas, tokenId) { ... }

    export function tokensReady() {
      applyHexTokenSetting()
    }
    ```

- [ ] 2.8.4 Extract token CSS from `css/temp.css` → **NEW** `scripts/tokens/styles/tokens.css`
    - Classes: `.ilaris-hex-tokens-enabled` (main token styling)

---

### Task 2.9: Migrate `importer/` Feature

**Depends on:** Task 1.1  
**Required before:** None (independent)

```
From:
  scripts/common/sephrasto_importer.js
  scripts/importer/xml-character-import-dialogs.js
  scripts/importer/xml_character_importer.js
  scripts/importer/xml_rule_importer/
  templates/importer/rule-import-dialog.hbs
  (duplicate getSceneControlButtons hook in scripts/hooks.js)

To:
  scripts/importer/{sephrasto_importer.js, xml-character-import-dialogs.js, xml_character_importer.js, xml_rule_importer/*}
  scripts/importer/templates/rule-import-dialog.hbs
  scripts/importer/hooks.js (NEW - consolidates hooks, removes duplicate)
  scripts/importer/styles/importer.css
```

**Subtasks:**

- [ ] 2.9.1 Create directory structure: `scripts/importer/{xml_rule_importer,templates,styles,_spec}/`
- [ ] 2.9.2 Copy importer files: `scripts/common/sephrasto_importer.js`, + current `scripts/importer/*` → `scripts/importer/`
- [ ] 2.9.3 Copy importer template: `templates/importer/rule-import-dialog.hbs` → `scripts/importer/templates/`
- [ ] 2.9.4 Extract importer CSS from `css/temp.css` → **NEW** `scripts/importer/styles/importer.css`
    - Classes: `.import-xml-character`, `.sync-xml-character`, `.directory-item-controls`, `.rule-button`
- [ ] 2.9.5 Create **NEW** `scripts/importer/hooks.js`:

    ```js
    Hooks.on('getSceneControlButtons', (buttons) => { ... }) // deduplicated from current hooks.js
    Hooks.on('renderActorDirectory', (app, html, data) => { ... })
    Hooks.on('renderCompendiumDirectory', (app, html, data) => { ... })

    export function importerReady() {
      // Any import-specific ready logic
    }
    ```

    - **IMPORTANT:** Remove duplicate `getSceneControlButtons` hook (appears at lines 359-371 and 490-502 in current hooks.js)

---

### Task 2.10: Migrate `settings/` Feature

**Depends on:** Task 1.1  
**Required before:** None (independent)

```
From:
  scripts/settings/
  templates/settings/*.hbs

To:
  scripts/settings/{templates,styles,_spec}/
  scripts/settings/hooks.js (NEW)
```

**Subtasks:**

- [ ] 2.10.1 Create directory structure: `scripts/settings/{templates,styles,_spec}/`
- [ ] 2.10.2 Move settings JS files (if they already exist in `scripts/settings/`) → keep in `scripts/settings/`
- [ ] 2.10.3 Copy settings templates: `templates/settings/*.hbs` → `scripts/settings/templates/`
    - Including: `abgeleitete-werte-packs.hbs`, `fertigkeiten-packs.hbs`, `maneuver-packs.hbs`, `talente-packs.hbs`, `vorteile-packs.hbs`, `waffen-packs.hbs`, `waffeneigenschaften-packs.hbs`, `scene_environment_fields.hbs`
- [ ] 2.10.4 Extract settings CSS from `css/temp.css` → **NEW** `scripts/settings/styles/settings.css`
    - Classes: `.system-pack`, `.pack-entry`, `.pack-row`, `.checkbox`, `.disabled-reason`
- [ ] 2.10.5 Create **NEW** `scripts/settings/hooks.js`:
    ```js
    Hooks.on('renderSettingsConfig', (app, html, data) => { ... })
    Hooks.on('renderSceneConfig', (app, html, data) => { ... })
    ```

---

### Task 2.11: Migrate `migrations/` Feature

**Depends on:** Task 1.1, Task 2.1 (waffe - waffen-migration files moved there)  
**Required before:** None (but should be before cleanup)

```
From:
  scripts/migrations/migrate-waffen-eigenschaften.js (→ moves to waffe/)
  (general migration utilities if any)

To:
  scripts/migrations/{general migration utilities}
  scripts/migrations/hooks.js (NEW - handles worldSchemaVersion + runMigrationIfNeeded)
```

**Subtasks:**

- [ ] 2.11.1 Create directory structure: `scripts/migrations/`
- [ ] 2.11.2 Check for general migration utilities in current `scripts/migrations/` folder
    - Keep general utils (not waffen-specific) in `scripts/migrations/`
- [ ] 2.11.3 Create **NEW** `scripts/migrations/hooks.js`:

    ```js
    Hooks.once('init', () => {
        game.settings.register('Ilaris', 'worldSchemaVersion', {
            name: 'World Schema Version',
            hint: '...',
            scope: 'world',
            config: false,
            type: Number,
            default: 13.0,
        })
    })

    // Note: runMigrationIfNeeded() is called from core/init.js ready hook
    ```

---

### Task 2.12: Migrate `changelog/` Feature

**Depends on:** Task 1.1  
**Required before:** None (independent)

```
From:
  scripts/hooks/changelog-notification.js
  templates/changes/breaking-changes-*.hbs
  styles/dialogs/changelog-notification.css

To:
  scripts/changelog/{hooks.js, templates, styles}
```

**Subtasks:**

- [ ] 2.12.1 Create directory structure: `scripts/changelog/{templates,styles}/`
- [ ] 2.12.2 Copy changelog files: `scripts/hooks/changelog-notification.js` → `scripts/changelog/changelog-notification.js`
- [ ] 2.12.3 Copy changelog templates: `templates/changes/breaking-changes-*.hbs` → `scripts/changelog/templates/`
- [ ] 2.12.4 Copy changelog CSS: `styles/dialogs/changelog-notification.css` → `scripts/changelog/styles/`
- [ ] 2.12.5 Move hook registration from standalone file → **NEW** `scripts/changelog/hooks.js`
    ```js
    // Copy entire changelog-notification.js hook logic into hooks.js
    ```

---

## Phase 3: Integration & Finalization

### Task 3.1: Update All Import Paths

**Depends on:** All of Phase 2  
**Required before:** Task 3.2

**Subtasks:**

- [ ] 3.1.1 Use template path mapping from Task 1.2.1 to find all `"templates/..."` string literals in JS files
    - Search pattern: `"templates/[^"]+"`
    - Tool: VS Code Find & Replace with Regex (or custom script)
- [ ] 3.1.2 Update import statements for moved modules
    - Use import path mapping from Task 1.2.3
    - Examples:
        - `import Actor from './actors/actor.js'` → `import Actor from './actors/data/actor.js'`
        - `import { preloadAllEigenschaften } from './items/utils/eigenschaft-cache.js'` → `import { preloadAllEigenschaften } from './waffe/properties/utils/eigenschaft-cache.js'`
        - `import dialogClass from './sheets/dialogs/angriff.js'` → `import dialogClass from './combat/dialogs/angriff.js'`

- [ ] 3.1.3 Update template path references in JS files
    - Examples:
        - `"templates/sheets/helden.hbs"` → `"scripts/actors/templates/helden.hbs"`
        - `"templates/dialogs/angriff.hbs"` → `"scripts/combat/templates/dialogs/angriff.hbs"`
        - `"templates/chat/dreid20.hbs"` → `"scripts/dice/templates/dreid20.hbs"`
    - **Note:** Some templates may be dynamically referenced; manual review required

- [ ] 3.1.4 Update template paths within Handlebars files (nested includes)
    - Search for `{{>` includes and `{{#*inline` definitions
    - Update partial paths accordingly

- [ ] 3.1.5 Update CSS `url()` references in CSS files
    - Adjust relative paths for fonts and images
    - Example: `url("../../assets/fonts/...")` adjustments based on new CSS file locations

- [ ] 3.1.6 Update `jest.config.mjs` if it has hardcoded test discovery patterns
    - Ensure test file globs match new `_spec/` locations

- [ ] 3.1.7 Verify no remaining old import paths remain
    - Search for patterns like `scripts/sheets/` (should now be `scripts/*/sheets/`)
    - Search for `templates/` references (should now be `scripts/*/templates/`)

---

### Task 3.2: Split CSS & Update system.json

**Depends on:** Task 2.1 - 2.12 (all features migrated), Task 3.1 (imports updated)  
**Required before:** Cleanup

**Note:** CSS files may have already been created during feature migrations (Tasks 2.1-2.12). This task ensures completeness and system.json updates.

**Subtasks:**

- [ ] 3.2.1 Verify all per-feature CSS files exist and are complete:
    - `scripts/core/styles/core.css` (fonts, variables, utilities)
    - `scripts/actors/styles/{actors.css, sidebar.css}`
    - `scripts/items/styles/items.css`
    - `scripts/waffe/styles/waffe.css`
    - `scripts/combat/styles/combat.css`
    - `scripts/effects/styles/effects.css`
    - `scripts/tokens/styles/tokens.css`
    - `scripts/importer/styles/importer.css`
    - `scripts/settings/styles/settings.css`
    - `scripts/dice/styles/dice.css`
    - `scripts/changelog/styles/changelog-notification.css`

- [ ] 3.2.2 Consolidate any remaining CSS rules from `css/temp.css` that weren't captured
    - Use CSS class audit from Task 1.2.2 to verify coverage
    - Balance between features (avoid moving shared classes unnecessarily)

- [ ] 3.2.3 Update `system.json` `styles` array to list all new CSS files:

    ```json
    "styles": [
      "scripts/core/styles/core.css",
      "scripts/actors/styles/actors.css",
      "scripts/actors/styles/sidebar.css",
      "scripts/items/styles/items.css",
      "scripts/waffe/styles/waffe.css",
      "scripts/combat/styles/combat.css",
      "scripts/effects/styles/effects.css",
      "scripts/tokens/styles/tokens.css",
      "scripts/importer/styles/importer.css",
      "scripts/settings/styles/settings.css",
      "scripts/dice/styles/dice.css",
      "scripts/changelog/styles/changelog-notification.css"
    ]
    ```

- [ ] 3.2.4 Verify `system.json` `esmodules` is set to `"scripts/core/hooks.js"`

- [ ] 3.2.5 Test CSS loading in browser dev tools
    - Ensure no 404s for CSS files
    - Verify styles apply correctly

---

### Task 3.3: Cleanup & Verification

**Depends on:** Task 3.1, Task 3.2  
\*\*Final cleanup task

**Subtasks:**

- [ ] 3.3.1 Delete old top-level directories:
    - `templates/` (all templates now in `scripts/*/templates/`)
    - `styles/` (all styles now in `scripts/*/styles/`)
    - `css/` (splits into per-feature CSS)
    - `scripts/hooks/` (hooks redistributed to features)
    - `scripts/hooks.js` (moved to `scripts/core/hooks.js`)

- [ ] 3.3.2 Delete old script files that were moved:
    - `scripts/config.js` (moved to core)
    - `scripts/common/` (moved to core, combat, skills, dice)
    - `scripts/actors/` (moved to actors/data, actors/sheets)
    - `scripts/sheets/` (distributed to features)
    - `scripts/items/` (items data redistributed)
    - `scripts/migrations/migrate-waffen-*.js` (moved to waffe/migrations)

- [ ] 3.3.3 Verify directory cleanup:
    - `scripts/` should now contain only feature folders: `{core, actors, items, waffe, combat, skills, dice, effects, tokens, importer, settings, migrations, changelog}`
    - No lingering `config/`, `common/`, `sheets/`, `hooks/`, or `items/` folders (or they're empty)

- [ ] 3.3.4 Full codebase validation:
    - Run linter: `npm run lint` (ESLint should catch import errors)
    - Run tests: `npm run test` (Jest should work with new paths)
    - Check for any `console.errors` or "Module not found" warnings

- [ ] 3.3.5 Browser testing:
    - Clear browser cache
    - Start FoundryVTT and load the system
    - Check browser console for any JS errors
    - Open several sheets (actor, item, weapon) to verify templates load
    - Test a combat round to verify combat logic works

- [ ] 3.3.6 Documentation updates:
    - Update any README or CONTRIBUTING docs that reference old file locations
    - Update Jest config if needed

- [ ] 3.3.7 Commit all changes to git with clear message:

    ```
    feat: refactor system structure from type-based to feature-based layout

    - Reorganize scripts/, templates/, styles/ into feature modules
    - Decompose monolithic hooks.js into per-feature hook files
    - Orchestrate ready hook sequentially in core/init.js
    - Move weapon system into dedicated waffe/ feature
    - Update system.json esmodules and styles paths

    This refactoring improves code organization, maintainability, and
    reduces cognitive load when working with related features.
    ```

---

## Summary

| Phase | Task               | Est. Hours | Status  |
| ----- | ------------------ | ---------- | ------- |
| 1     | 1.1 Core Setup     | 3-4h       | pending |
| 1     | 1.2 Audit Tools    | 1-2h       | pending |
| 2     | 2.1 waffe/         | 4-5h       | pending |
| 2     | 2.2 items/         | 2-3h       | pending |
| 2     | 2.3 actors/        | 3-4h       | pending |
| 2     | 2.4 dice/          | 1-2h       | pending |
| 2     | 2.5 combat/        | 4-5h       | pending |
| 2     | 2.6 skills/        | 1-2h       | pending |
| 2     | 2.7 effects/       | 1-2h       | pending |
| 2     | 2.8 tokens/        | 1-2h       | pending |
| 2     | 2.9 importer/      | 1-2h       | pending |
| 2     | 2.10 settings/     | 1-2h       | pending |
| 2     | 2.11 migrations/   | 1h         | pending |
| 2     | 2.12 changelog/    | 1h         | pending |
| 3     | 3.1 Update Imports | 6-8h       | pending |
| 3     | 3.2 Split CSS      | 3-4h       | pending |
| 3     | 3.3 Cleanup & Test | 4-6h       | pending |
|       | **TOTAL**          | **40-58h** |         |

---

## Notes

- **Execution is sequential within phases** but can be parallelized where there are no dependencies
- **Each subtask includes concrete file paths** for clarity
- **Manual code review is required** for import/template path updates (automatable but needs human verification)
- **Testing at each feature boundary** is encouraged (e.g., after Task 2.5, run tests to ensure combat still works)
