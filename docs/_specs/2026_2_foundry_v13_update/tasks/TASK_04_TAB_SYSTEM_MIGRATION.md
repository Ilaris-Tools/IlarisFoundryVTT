# TASK 04: Tab System Migration - helden.js & kreatur.js

**Priorität:** 🔴 CRITICAL  
**Estimated Time:** 3 hours  
**Dependencies:** TASK 01, TASK 02  
**Files Affected:** `scripts/sheets/helden.js`, `scripts/sheets/kreatur.js`

---

## Objective

Migriere das Tab-System von V1 (navSelector/contentSelector) zu V2 (PARTS-basiert) mit Actions für Tab-Wechsel.

---

## Requirements Covered

- REQ-TABS-001: Tab PARTS Struktur
- REQ-TABS-002: Tab Navigation in \_prepareContext()
- REQ-TABS-003: Tab Change Action

---

## Implementation Steps

### Step 1: HeldenSheet - DEFAULT_OPTIONS aktualisieren

**Current (Lines 5-19):**

```javascript
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['ilaris'],
            template: 'systems/Ilaris/templates/sheets/helden.hbs',
            tabs: [
                {
                    navSelector: '.sheet-tabs',
                    contentSelector: '.sheet-body',
                    initial: 'fertigkeiten',
                },
            ],
        })
    }
```

**Replace with:**

```javascript
    static DEFAULT_OPTIONS = {
        position: {
            width: 850,
            height: 750
        },
        window: {
            title: "ILARIS.sheets.helden"
        },
        actions: {
            changeTab: HeldenSheet.changeTab
        }
    }

    static PARTS = {
        header: { template: "systems/Ilaris/templates/sheets/helden/header.hbs" },
        tabs: { template: "systems/Ilaris/templates/sheets/helden/tabs.hbs" },
        kampf: { template: "systems/Ilaris/templates/sheets/helden/parts/kampf.hbs" },
        inventar: { template: "systems/Ilaris/templates/sheets/helden/parts/inventar.hbs" },
        fertigkeiten: { template: "systems/Ilaris/templates/sheets/helden/parts/fertigkeiten.hbs" },
        uebernatuerlich: { template: "systems/Ilaris/templates/sheets/helden/parts/uebernatuerlich.hbs" },
        notes: { template: "systems/Ilaris/templates/sheets/helden/parts/notes.hbs" },
        effects: { template: "systems/Ilaris/templates/sheets/helden/parts/effects.hbs" }
    }
```

### Step 2: HeldenSheet - \_prepareContext() mit Tab-Daten erweitern

**Add after existing \_prepareContext() (basierend auf TASK 02):**

```javascript
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // ... existing context setup from TASK 02 ...

        // Tab management
        const activeTab = this.tabGroups.primary || "fertigkeiten"

        context.tabs = {
            kampf: {
                id: "kampf",
                group: "primary",
                icon: "fa-solid fa-sword",
                label: "ILARIS.tabs.kampf",
                active: activeTab === "kampf",
                cssClass: activeTab === "kampf" ? "active" : ""
            },
            inventar: {
                id: "inventar",
                group: "primary",
                icon: "fa-solid fa-backpack",
                label: "ILARIS.tabs.inventar",
                active: activeTab === "inventar",
                cssClass: activeTab === "inventar" ? "active" : ""
            },
            fertigkeiten: {
                id: "fertigkeiten",
                group: "primary",
                icon: "fa-solid fa-wrench",
                label: "ILARIS.tabs.fertigkeiten",
                active: activeTab === "fertigkeiten",
                cssClass: activeTab === "fertigkeiten" ? "active" : ""
            },
            uebernatuerlich: {
                id: "uebernatuerlich",
                group: "primary",
                icon: "fa-solid fa-wand-magic-sparkles",
                label: "ILARIS.tabs.uebernatuerlich",
                active: activeTab === "uebernatuerlich",
                cssClass: activeTab === "uebernatuerlich" ? "active" : ""
            },
            notes: {
                id: "notes",
                group: "primary",
                icon: "fa-solid fa-note-sticky",
                label: "ILARIS.tabs.notes",
                active: activeTab === "notes",
                cssClass: activeTab === "notes" ? "active" : ""
            },
            effects: {
                id: "effects",
                group: "primary",
                icon: "fa-solid fa-sparkles",
                label: "ILARIS.tabs.effects",
                active: activeTab === "effects",
                cssClass: activeTab === "effects" ? "active" : ""
            }
        }

        return context
    }
```

### Step 3: HeldenSheet - changeTab Action hinzufügen

**Add after DEFAULT_OPTIONS/PARTS:**

```javascript
    /**
     * Handle tab changes
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The tab button element
     */
    static changeTab(event, target) {
        const tab = target.dataset.tab
        const group = target.dataset.group || "primary"
        this.tabGroups[group] = tab
        return this.render({ parts: ["tabs", tab] })
    }
```

### Step 4: KreaturSheet - DEFAULT_OPTIONS aktualisieren

**Current (Lines 5-17):**

```javascript
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['ilaris'],
            template: 'systems/Ilaris/templates/sheets/kreatur.hbs',
            tabs: [
                {
                    navSelector: '.sheet-tabs',
                    contentSelector: '.sheet-body',
                    initial: 'profan',
                },
            ],
        })
    }
```

**Replace with:**

```javascript
    static DEFAULT_OPTIONS = {
        position: {
            width: 850,
            height: 750
        },
        window: {
            title: "ILARIS.sheets.kreatur"
        },
        actions: {
            changeTab: KreaturSheet.changeTab
        }
    }

    static PARTS = {
        header: { template: "systems/Ilaris/templates/sheets/kreatur/header.hbs" },
        tabs: { template: "systems/Ilaris/templates/sheets/kreatur/tabs.hbs" },
        profan: { template: "systems/Ilaris/templates/sheets/kreatur/parts/profan.hbs" },
        uebernatuerlich: { template: "systems/Ilaris/templates/sheets/kreatur/parts/uebernatuerlich.hbs" }
    }
```

### Step 5: KreaturSheet - \_prepareContext() mit Tab-Daten erweitern

**Add to \_prepareContext():**

```javascript
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // ... existing context setup from TASK 02 ...

        // Tab management
        const activeTab = this.tabGroups.primary || "profan"

        context.tabs = {
            profan: {
                id: "profan",
                group: "primary",
                icon: "fa-solid fa-book",
                label: "ILARIS.tabs.profan",
                active: activeTab === "profan",
                cssClass: activeTab === "profan" ? "active" : ""
            },
            uebernatuerlich: {
                id: "uebernatuerlich",
                group: "primary",
                icon: "fa-solid fa-wand-magic-sparkles",
                label: "ILARIS.tabs.uebernatuerlich",
                active: activeTab === "uebernatuerlich",
                cssClass: activeTab === "uebernatuerlich" ? "active" : ""
            }
        }

        return context
    }
```

### Step 6: KreaturSheet - changeTab Action hinzufügen

**Add after DEFAULT_OPTIONS/PARTS:**

```javascript
    /**
     * Handle tab changes
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The tab button element
     */
    static changeTab(event, target) {
        const tab = target.dataset.tab
        const group = target.dataset.group || "primary"
        this.tabGroups[group] = tab
        return this.render({ parts: ["tabs", tab] })
    }
```

### Step 7: Entferne alte Tab-Methoden

Falls in helden.js oder kreatur.js noch `_onSelectedKampfstil()` oder `_onSelectedUebernatuerlichenStil()` existieren, die auf Tabs reagieren:

- Überprüfen ob nötig
- Ggf. zur changeTab Action portieren

---

## Key Points

✅ **PARTS Struktur:**

- Jeder Tab ist ein separater PART
- `header` und `tabs` sind separate PARTS (Navigation)
- Initial Tab ist in `this.tabGroups.primary`

✅ **Tab Navigation:**

- Alle Tab-Informationen in `context.tabs`
- `active` und `cssClass` für Rendering
- Labels sind i18n Keys

✅ **Tab Change:**

- Action speichert in `this.tabGroups`
- Partial Rendering mit `parts: ["tabs", tabName]`

❌ **MUST NOT:**

- `navSelector` oder `contentSelector` verwenden
- Alte Tab-Struktur beibehalten

---

## Validation Checklist

**helden.js:**

- [ ] `static get defaultOptions()` ist gelöscht
- [ ] `static DEFAULT_OPTIONS = {}` existiert
- [ ] `static PARTS = {}` mit allen 8 Tabs existiert
- [ ] `_prepareContext()` setzt `context.tabs` Object
- [ ] Jeder Tab hat alle 6 Properties (id, group, icon, label, active, cssClass)
- [ ] `changeTab` Action existiert
- [ ] Action speichert in `this.tabGroups.primary`

**kreatur.js:**

- [ ] `static DEFAULT_OPTIONS = {}` existiert
- [ ] `static PARTS = {}` mit 2 Tabs existiert
- [ ] `_prepareContext()` setzt `context.tabs` Object
- [ ] `changeTab` Action existiert

---

## Next Task

→ **TASK 05: Template Structure - Setup PARTS** (template migration starts)
