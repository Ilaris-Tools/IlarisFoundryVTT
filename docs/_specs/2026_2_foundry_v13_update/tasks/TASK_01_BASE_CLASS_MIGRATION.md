# TASK 01: Base Class Migration - actor.js

**Priorität:** 🔴 CRITICAL  
**Estimated Time:** 2 hours  
**Dependencies:** None  
**Files Affected:** `scripts/sheets/actor.js`

---

## Objective

Migriere die `IlarisActorSheet` Klasse von Application V1 zu ApplicationV2 mit Mixin-Basierter Struktur.

---

## Requirements Covered

- REQ-BASE-001: Class Declaration Konvertierung
- REQ-BASE-002: DEFAULT_OPTIONS Static Property
- REQ-BASE-003: PARTS Static Property Hinzufügen

---

## Implementation Steps

### Step 1: Imports aktualisieren

**Current (Lines 1-3):**

```javascript
import { wuerfelwurf } from '../common/wuerfel.js'
import { ILARIS } from '../config.js'

export class IlarisActorSheet extends ActorSheet {
```

**Change to:**

```javascript
import { wuerfelwurf } from '../common/wuerfel.js'
import { ILARIS } from '../config.js'

const { HandlebarsApplicationMixin, ActorSheetV2 } = foundry.applications.api

export class IlarisActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
```

### Step 2: defaultOptions() Getter → DEFAULT_OPTIONS

**Current (Lines 6-22):**

```javascript
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['ilaris', 'sheet', 'actor'],
            width: 850,
            height: 750,
            tabs: [
                { navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'kampf' },
            ],
            scrollY: ['.herotab'],
        })
    }
```

**Replace with:**

```javascript
    static DEFAULT_OPTIONS = {
        window: {
            icon: "fa-solid fa-scroll",
            title: "ILARIS.sheets.actor"
        },
        position: {
            width: 850,
            height: 750
        },
        tag: "form",
        form: {
            handler: IlarisActorSheet.#onSubmitForm,
            submitOnChange: false,
            closeOnSubmit: false
        },
        actions: {
            // Placeholder - wird in TASK 04 gefüllt
        }
    }

    static PARTS = {
        form: {
            template: "systems/Ilaris/templates/sheets/helden.hbs"
        }
    }
```

### Step 3: Form Handler Methode hinzufügen

**Add after DEFAULT_OPTIONS/PARTS (nach Line 50):**

```javascript
    /**
     * Handle form submission
     * @param {SubmitEvent} event - The form submission event
     * @param {HTMLFormElement} form - The form element
     * @param {FormDataExtended} formData - The processed form data
     * @protected
     */
    static async #onSubmitForm(event, form, formData) {
        const updateData = foundry.utils.expandObject(formData.object)
        await this.actor.update(updateData)
    }
```

### Step 4: Struktur validieren

Nach Step 3 sollte die Klasse folgende Struktur haben:

```javascript
export class IlarisActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
    static DEFAULT_OPTIONS = { ... }
    static PARTS = { ... }
    static async #onSubmitForm(...) { ... }
    async getData() { ... }  // NOCH VORHANDEN - wird in TASK 02 geändert
    activateListeners(html) { ... }  // NOCH VORHANDEN - wird in TASK 04 geändert
    // ... andere Methoden
}
```

---

## Validation Checklist

- [ ] `HandlebarsApplicationMixin` und `ActorSheetV2` sind importiert
- [ ] Keine `static get defaultOptions()` Methode vorhanden
- [ ] `static DEFAULT_OPTIONS = {}` Objekt vorhanden
- [ ] `static PARTS = {}` Objekt vorhanden
- [ ] `static async #onSubmitForm()` Methode vorhanden
- [ ] Keine `mergeObject()` Aufrufe in DEFAULT_OPTIONS
- [ ] `tag: "form"` in DEFAULT_OPTIONS
- [ ] `form.handler` verweist auf `IlarisActorSheet.#onSubmitForm`
- [ ] Datei hat keine Syntax-Fehler

---

## Next Task

→ **TASK 02: Context Preparation** (after this task is complete)
