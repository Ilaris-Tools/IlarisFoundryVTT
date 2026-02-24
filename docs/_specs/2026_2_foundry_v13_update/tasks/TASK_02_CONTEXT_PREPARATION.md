# TASK 02: Context Preparation - actor.js

**Priorität:** 🔴 CRITICAL  
**Estimated Time:** 3 hours  
**Dependencies:** TASK 01  
**Files Affected:** `scripts/sheets/actor.js`, `scripts/sheets/helden.js`, `scripts/sheets/kreatur.js`

---

## Objective

Konvertiere alle `getData()` Methoden zu `_prepareContext()` und stelle sicher, dass alle notwendigen Context-Daten korrekt vorbereitet werden.

---

## Requirements Covered

- REQ-CONTEXT-001: getData() → \_prepareContext()
- REQ-CONTEXT-002: Actor Reference in Context
- REQ-CONTEXT-003: Config Variablen in Context

---

## Implementation Steps

### Step 1: IlarisActorSheet.\_prepareContext() in actor.js

**Current (Lines 24-31):**

```javascript
    async getData() {
        const context = super.getData()
        console.log(context)

        context.enrichedBiography = await TextEditor.enrichHTML(this.actor.system.notes, {
            async: true,
        })
        return context
    }
```

**Replace with:**

```javascript
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // Add actor reference
        context.actor = this.actor

        // Add configuration
        context.config = CONFIG.ILARIS

        // Enrich biography text
        context.enrichedBiography = await TextEditor.enrichHTML(
            this.actor.system.notes,
            { async: true }
        )

        return context
    }
```

### Step 2: HeldenSheet.\_prepareContext() in helden.js

**Current (Lines 22-32):**

```javascript
    async getData() {
        return {
            ...(await super.getData()),
            isWeaponSpaceRequirementActive: game.settings.get(
                settings.ConfigureGameSettingsCategories.Ilaris,
                settings.IlarisGameSettingNames.weaponSpaceRequirement,
            ),
            effects: this.actor.appliedEffects,
        }
    }
```

**Replace with:**

```javascript
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // Add weapon space requirement setting
        context.isWeaponSpaceRequirementActive = game.settings.get(
            settings.ConfigureGameSettingsCategories.Ilaris,
            settings.IlarisGameSettingNames.weaponSpaceRequirement,
        )

        // Add applied effects
        context.effects = this.actor.appliedEffects

        return context
    }
```

### Step 3: KreaturSheet.\_prepareContext() in kreatur.js

**Current (Lines 19-23):**

```javascript
    async getData() {
        const context = await super.getData()
        context.kreaturItemOptions = foundry.utils.duplicate(CONFIG.ILARIS.kreatur_item_options)
        return context
    }
```

**Replace with:**

```javascript
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        context.kreaturItemOptions = foundry.utils.duplicate(CONFIG.ILARIS.kreatur_item_options)
        return context
    }
```

### Step 4: Überprüfe alle Lokalisierungen

Stelle sicher, dass in den Templates (werden später migriert) folgende i18n Keys verfügbar sind:

- `ILARIS.sheets.actor`
- `ILARIS.sheets.helden`
- `ILARIS.sheets.kreatur`
- `ILARIS.tabs.*` (für alle Tabs)

Falls fehlend, müssen diese zu `en.json` und `de.json` hinzugefügt werden (nicht in dieser Task, aber notieren).

---

## Key Points

✅ **MUST:**

- `getData()` wird komplett entfernt
- Alle Context-Daten werden in `_prepareContext()` vorbereitet
- `this.actor` wird explizit in Context gesetzt
- `CONFIG.ILARIS` wird in Context gesetzt
- Enriched Text ist in Context verfügbar

❌ **MUST NOT:**

- Keine `super.getData()` Aufrufe
- Keine `console.log()` Debug-Statements
- Keine direkten `this.data` Zugriffe mehr

---

## Validation Checklist

**actor.js:**

- [ ] `getData()` Methode ist gelöscht
- [ ] `_prepareContext(options)` Methode existiert
- [ ] Methode ist `async`
- [ ] Ruft `await super._prepareContext(options)` auf
- [ ] `context.actor = this.actor` wird gesetzt
- [ ] `context.config = CONFIG.ILARIS` wird gesetzt
- [ ] `context.enrichedBiography` wird mit TextEditor.enrichHTML() gesetzt

**helden.js:**

- [ ] `getData()` Methode ist gelöscht
- [ ] `_prepareContext(options)` Methode existiert
- [ ] `context.isWeaponSpaceRequirementActive` wird gesetzt
- [ ] `context.effects` wird gesetzt

**kreatur.js:**

- [ ] `getData()` Methode ist gelöscht
- [ ] `_prepareContext(options)` Methode existiert
- [ ] `context.kreaturItemOptions` wird gesetzt

---

## Next Task

→ **TASK 03: Prepare Data Structure for PARTS** (after context is prepared)
