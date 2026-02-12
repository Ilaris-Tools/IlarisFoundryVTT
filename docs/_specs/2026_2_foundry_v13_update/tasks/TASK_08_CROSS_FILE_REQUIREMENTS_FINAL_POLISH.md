# TASK 08: Cross-File Requirements & Final Polish

**Priorität:** 🟡 IMPORTANT  
**Estimated Time:** 4 hours  
**Dependencies:** TASK 01-07 (All migration tasks)  
**Files Affected:** Alle Sheet-Dateien + i18n + Config

---

## Objective

Implementiere globale, dateiübergreifende Requirements und führe Final-Polish durch.

---

## Requirements Covered

- REQ-CROSS-001: Konsistenter Namenskonvention für Actions
- REQ-CROSS-002: Konsistente Error Handling
- REQ-CROSS-003: Dialog/Prompt Migration (Validierung)
- REQ-CROSS-004: DragDrop Implementierung (Validierung)
- REQ-CROSS-005: Lokalisierung (i18n)

---

## Implementation Steps

### Step 1: Überprüfe Action-Namenskonvention

**In `scripts/sheets/actor.js`, `scripts/sheets/helden.js`, `scripts/sheets/kreatur.js`:**

Stelle sicher, dass ALLE Actions folgende Konvention erfüllen:

- camelCase Namen (z.B. `toggleBool` nicht `toggle-bool`)
- Englische Namen (German logic, English Actions)
- Verben-basiert wenn möglich
- Präfix wenn nötig (z.B. `itemCreate` nicht nur `create`)

**Vollständige Action-Liste (sollte überall gleich sein):**

```javascript
actions: {
    // Universal (in actor.js)
    ausklappView: ...,
    rollable: ...,
    clickable: ...,
    itemCreate: ...,
    itemEdit: ...,
    itemDelete: ...,
    toggleItem: ...,
    toggleBool: ...,
    syncItems: ...,

    // HeldenSheet specific
    changeTab: ...,
    schipsClick: ...,
    triStateClick: ...,

    // KreaturSheet specific
    addVorteilInfo: ...,
    addAnyItem: ...
}
```

### Step 2: Implementiere globales Error Handling

**In allen async Actions, wrap mit Try-Catch:**

**Pattern für alle Async Actions:**

```javascript
static async actionName(event, target) {
    try {
        // Action logic here
        const result = await this.actor.update({ /* ... */ })
        return result
    } catch (err) {
        console.error('Error in actionName:', err)
        ui.notifications.error(`ILARIS.error.actionNameFailed`)
        return false
    }
}
```

**Actions die Error Handling brauchen:**

- `toggleBool()` - Actor Update
- `onToggleItem()` - Item Updates
- `schipsClick()` - Actor Update
- `triStateClick()` - Actor Update
- `itemCreate()` - Item Creation
- `itemEdit()` - Dialog Handling
- `itemDelete()` - Item Deletion
- `syncItems()` - Batch Updates
- Alle DragDrop Callbacks - Drop Handling

### Step 3: Validiere Dialog/Prompt Handling

**Überprüfe `scripts/sheets/kreatur.js`:**

- [ ] `Dialog.prompt()` Aufrufe funktionieren weiterhin
- [ ] Keine neuen V1-FormApplications erstellt
- [ ] Dialoge sind einfach und nicht komplex

**Falls Dialoge zu komplex sind (mehr als ein Button):**
→ Migriere zu ApplicationV2 (nicht in diesem Task, aber notieren)

### Step 4: Validiere DragDrop für alle Sheets

**Überprüfe:**

- [ ] `scripts/sheets/actor.js` - Hat DragDrop wenn Items gezogen werden
- [ ] `scripts/sheets/helden.js` - DragDrop vom Parent geerbt
- [ ] `scripts/sheets/kreatur.js` - DragDrop implementiert

**Für Sheets ohne explizites DragDrop:**

- Überprüfen ob es notwendig ist (können Items gezogen werden?)
- Falls nein, ist OK

### Step 5: Aktualisiere i18n Keys

**Überprüfe/Ergänze in `lang/de.json` und `lang/en.json`:**

```json
{
    "ILARIS": {
        "sheets": {
            "actor": "Akteur",
            "helden": "Held",
            "kreatur": "Kreatur"
        },
        "tabs": {
            "kampf": "Kampf",
            "inventar": "Inventar",
            "fertigkeiten": "Fertigkeiten",
            "uebernatuerlich": "Übernatürlich",
            "notes": "Notizen",
            "effects": "Effekte",
            "profan": "Profan",
            "attribute": "Attribute"
        },
        "actions": {
            "syncItems": "Mit Kompendium synchronisieren",
            "addVorteil": "Vorteil hinzufügen",
            "addVorteilInfo": "Vorteil-Info"
        },
        "error": {
            "syncItemsFailed": "Fehler beim Synchronisieren der Items",
            "updateActorFailed": "Fehler beim Aktualisieren des Akteurs",
            "createItemFailed": "Fehler beim Erstellen des Items",
            "deleteItemFailed": "Fehler beim Löschen des Items",
            "dropItemFailed": "Fehler beim Hinzufügen des Items"
        }
    }
}
```

### Step 6: Überprüfe Config.ILARIS Zugriff

**In `scripts/config.js` oder Startup:**

Stelle sicher, dass `CONFIG.ILARIS` folgende Properties hat (die in Context verwendet werden):

```javascript
CONFIG.ILARIS = {
    kreatur_item_options: {...},
    // ... andere Config ...
}
```

### Step 7: Konsistenz-Check aller Methoden-Signaturen

**In allen Sheet-Dateien:**

Überprüfe dass:

- [ ] Alle Static Actions haben Signatur: `static async name(event, target)`
- [ ] Alle \_onRender-Methoden haben Signatur: `_onRender(context, options)`
- [ ] Alle \_prepareContext-Methoden sind `async` und haben `options` Parameter
- [ ] Alle Form Handler sind `static async #onSubmitForm(event, form, formData)`

### Step 8: Validiere Template-Struktur

**Überprüfe in allen .hbs Dateien:**

- [ ] Root Element ist `<form>`
- [ ] Keine jQuery-Selektoren in Handlebars
- [ ] Alle Buttons/Links haben `data-action`
- [ ] Alle `data-*` Attributes verwenden camelCase (z.B. `data-item-id` nicht `data-itemid`)
- [ ] Triple braces für HTML: `{{{enrichedText}}}`
- [ ] Editor Helper korrekt: `{{editor field target="path" editable=editable}}`

### Step 9: Entferne alle console.log() Statements

**Search und entferne überall:**

```javascript
console.log(...)
console.error(...)
```

Nur behalten wenn Debug-Modus oder sehr wichtig.

### Step 10: Dokumentiere Migrationen in Code

**Add JSDoc Comments zu kritischen Methoden:**

```javascript
/**
 * APPLICATION V2 MIGRATION NOTE:
 * This method was migrated from Application V1 activateListeners()
 * to ApplicationV2 _onRender(). Event listeners are now registered
 * via Actions system for click events and addEventListener() for others.
 */
_onRender(context, options) {
    // ...
}
```

---

## Final Validation Checklist

### Action System

- [ ] Alle Actions sind `static`
- [ ] Alle Actions sind in `DEFAULT_OPTIONS.actions` registriert
- [ ] Alle Actions haben Signatur: `static name(event, target)`
- [ ] Keine jQuery in Actions
- [ ] Error Handling mit Try-Catch
- [ ] Keine `console.log()` in Production Code

### Event Binding

- [ ] `_onRender()` existiert in allen Sheets
- [ ] Non-Click Events in `_onRender()` gebunden
- [ ] `addEventListener()` statt jQuery `.on()`
- [ ] Arrow-Funktionen oder `.bind(this)` für Context

### Context & Data

- [ ] `_prepareContext()` existiert überall
- [ ] `async` und mit `options` Parameter
- [ ] `this.actor` oder `this.document` in Context
- [ ] `CONFIG.ILARIS` in Context
- [ ] Alle benötigten Daten verfügbar

### Form Handling

- [ ] `#onSubmitForm()` Static Method
- [ ] `DEFAULT_OPTIONS.form.handler` gesetzt
- [ ] `tag: "form"` in DEFAULT_OPTIONS
- [ ] Templates haben `<form>` Root Element

### Tab System

- [ ] PARTS haben alle Tabs
- [ ] `context.tabs` in \_prepareContext()
- [ ] `changeTab` Action existiert
- [ ] Tab Navigation Template
- [ ] Partial Rendering möglich

### Templates

- [ ] Root Element `<form>`
- [ ] `autocomplete="off"` auf Form
- [ ] Alle Buttons/Links haben `data-action`
- [ ] Keine jQuery-Selektoren
- [ ] Keine `class="clickable"` reliance
- [ ] Triple braces für HTML

### DragDrop (falls verwendet)

- [ ] Konstruktor initialisiert DragDrop
- [ ] `#dragDrop` Private Field
- [ ] Binding in `_onRender()`
- [ ] Alle Callbacks implementiert

### i18n

- [ ] Alle String-Labels sind i18n Keys
- [ ] Lokalisierungen in en.json + de.json
- [ ] Keine hardcoded Strings in Sheets
- [ ] Window Titles sind Keys

### Code Quality

- [ ] Keine jQuery außer in Exceptions
- [ ] Keine console.log() in Production
- [ ] Try-Catch in Async Methods
- [ ] JSDoc Comments wo nötig
- [ ] Keine `scrollY` Configuration

---

## Next Task

→ **VERIFICATION & TESTING** (nach diesem Task)

Manuelles Testen in Foundry:

- [ ] Sheets rendern ohne Fehler
- [ ] Alle Tabs funktionieren
- [ ] Form speichert Daten
- [ ] Actions reagieren auf Klicks
- [ ] Event Listener funktionieren
- [ ] DragDrop funktioniert
- [ ] Keine Browser Console Errors
- [ ] Lokalisierung funktioniert
