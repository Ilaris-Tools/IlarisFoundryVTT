# Migration Tasks - ItemSheetV2

**Projekt:** Ilaris FVTT System v12 → v13 (ItemSheetV2)  
**Status:** Task Definition  
**Datum:** 2026-02-10  
**Zieldatei:** `scripts/sheets/items/item.js`

---

## 📋 Task Struktur

Tasks sind nach Priorität geordnet:

- **P1 - Kritisch** (🔴) - Zuerst, blockiert alles andere
- **P2 - Wichtig** (🟡) - Danach, für Funktionalität nötig
- **P3 - Optional** (🟢) - Am Ende, Nice-to-have
- **Testing** (🔵) - Parallel zu Implementation

**Geschätzte Gesamt-Zeit:** 2-5 Stunden

---

## 🔴 P1 - Kritische Foundation Tasks

### TASK-ITEM-001: Class Structure Migration

**Datei:** `scripts/sheets/items/item.js`  
**Zeit:** 15 min  
**Status:** ⬜ TODO

**Aufgabe:**
Die Klassenstruktur ist bereits korrekt (verwendet `HandlebarsApplicationMixin(ItemSheetV2)`), aber die Methoden sind noch V1-basiert.

**Sub-Tasks:**

- [ ] Bestätigen: Import von `HandlebarsApplicationMixin` und `ItemSheetV2` ist korrekt
- [ ] `DEFAULT_OPTIONS` Static Property hinzufügen
- [ ] `PARTS` Static Property definieren
- [ ] Sicherstellen: keine `defaultOptions()` Getter-Methode

**Code-Vorlage:**

```javascript
const { HandlebarsApplicationMixin } = foundry.applications.api
const { ItemSheetV2 } = foundry.applications.sheets

export class IlarisItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'sheet', 'item'],
        position: {
            width: 500,
            height: 'auto',
        },
        tag: 'form',
        form: {
            handler: IlarisItemSheet.#onSubmitForm,
            submitOnChange: false,
            closeOnSubmit: false,
        },
        actions: {
            deleteItem: IlarisItemSheet.onDeleteItem,
        },
        window: {
            icon: 'fas fa-suitcase',
        },
    }

    static PARTS = {
        form: {
            template: 'systems/Ilaris/templates/sheets/items/item-sheet.hbs',
        },
    }
}
```

**Akzeptanzkriterien:**

- ✅ DEFAULT_OPTIONS existiert mit mindestens: `classes`, `position`, `tag`, `form`, `actions`
- ✅ PARTS existiert mit mindestens einem `form` Part
- ✅ Keine `defaultOptions()` Getter mehr
- ✅ Code lädt ohne Syntaxfehler

---

### TASK-ITEM-002: getData() → \_prepareContext() Migration

**Datei:** `scripts/sheets/items/item.js`  
**Zeit:** 20 min  
**Status:** ⬜ TODO  
**Abhängig von:** TASK-ITEM-001

**Aufgabe:**
Die `getData()` Methode in `_prepareContext()` umbenennen und an V2-API anpassen.

**Aktueller Code (V1):**

```javascript
async getData() {
    const data = super.getData()
    const hasActor = this.item.actor != null
    const isOwner = this.item.actor?.isOwner
    const notInPack = this.item.actor?.pack == null
    data.hasOwner = hasActor && isOwner && notInPack
    return data
}
```

**Ziel-Code (V2):**

```javascript
async _prepareContext(options) {
    const context = await super._prepareContext(options)

    // Super liefert bereits: item, source, fields, editable

    // Custom: Editierbarkeit für embedded Items
    const hasActor = this.item.actor != null
    const isOwner = this.item.actor?.isOwner
    const notInPack = this.item.actor?.pack == null
    context.isEditable = hasActor && isOwner && notInPack

    // Enriched Description (optional, wenn vorhanden)
    if (this.item.system.description) {
        context.enrichedDescription = await TextEditor.enrichHTML(
            this.item.system.description,
            { async: true }
        )
    }

    return context
}
```

**Sub-Tasks:**

- [ ] `getData()` Methode umbenennen zu `_prepareContext(options)`
- [ ] Parameter `options` hinzufügen
- [ ] `super.getData()` → `await super._prepareContext(options)` ändern
- [ ] `data` Variable → `context` umbenennen
- [ ] `data.hasOwner` → `context.isEditable` umbenennen (semantisch klarer)
- [ ] Optional: Enriched Content hinzufügen (falls Description existiert)

**Akzeptanzkriterien:**

- ✅ Keine `getData()` Methode mehr vorhanden
- ✅ `_prepareContext(options)` existiert und ist `async`
- ✅ Ruft `await super._prepareContext(options)` auf
- ✅ Returned ein `context` Objekt mit allen nötigen Properties
- ✅ `context.isEditable` ist korrekt gesetzt

**Test:**

```javascript
// Im Browser Console:
const sheet = Object.values(ui.windows).find((w) => w instanceof IlarisItemSheet)
sheet._prepareContext({}).then((ctx) => {
    console.log('Context:', ctx)
    console.log('Has item:', !!ctx.item)
    console.log('Has source:', !!ctx.source)
    console.log('Has fields:', !!ctx.fields)
    console.log('isEditable:', ctx.isEditable)
})
```

---

### TASK-ITEM-003: \_updateObject() Entfernen + Form Handler

**Datei:** `scripts/sheets/items/item.js`  
**Zeit:** 25 min  
**Status:** ⬜ TODO  
**Abhängig von:** TASK-ITEM-001

**Aufgabe:**
Die `_updateObject()` Methode existiert nicht in V2. Stattdessen Form Handler in DEFAULT_OPTIONS definieren.

**Aktueller Code (V1 - zu entfernen):**

```javascript
async _updateObject(event, formData) {
    try {
        const result = await super._updateObject(event, formData)

        if (!result) {
            let directResult
            if (this.item.isEmbedded) {
                directResult = await this.item.actor.updateEmbeddedDocuments('Item', [
                    { _id: this.item.id, ...formData },
                ])
            } else {
                directResult = await this.item.update(formData)
            }
            return directResult
        }

        return result
    } catch (error) {
        console.error('Item update failed:', error)
        throw error
    }
}
```

**Ziel-Code (V2):**

```javascript
// In DEFAULT_OPTIONS:
static DEFAULT_OPTIONS = {
    // ... andere Options
    form: {
        handler: IlarisItemSheet.#onSubmitForm,
        submitOnChange: false,
        closeOnSubmit: false
    }
}

// Private Static Method für Form Handling
static async #onSubmitForm(event, form, formData) {
    // formData ist FormDataExtended
    const updateData = foundry.utils.expandObject(formData.object)

    // V2 MAGIC: document.update() funktioniert automatisch
    // für embedded UND standalone Items!
    await this.document.update(updateData)
}
```

**Sub-Tasks:**

- [ ] `_updateObject()` Methode komplett entfernen
- [ ] Form Handler `#onSubmitForm` als private static method hinzufügen
- [ ] Form Handler in `DEFAULT_OPTIONS.form.handler` referenzieren
- [ ] `formData.object` expandieren mit `foundry.utils.expandObject()`
- [ ] `this.document.update()` nutzen (funktioniert für embedded & standalone!)
- [ ] Error Handling im Form Handler (optional)

**Akzeptanzkriterien:**

- ✅ Keine `_updateObject()` Methode mehr
- ✅ `#onSubmitForm` static method existiert
- ✅ Form Handler in DEFAULT_OPTIONS korrekt referenziert
- ✅ Nutzt `this.document.update()` (nicht `this.item.update()`)
- ✅ Kein manueller Embedded/Standalone Check mehr!

**Wichtig:**
🎯 **V2-Vorteil:** `this.document.update()` funktioniert automatisch für embedded UND standalone Items - kein `if (this.item.isEmbedded)` mehr nötig!

**Test:**

```javascript
// Embedded Item: Öffne Item Sheet von Item in Actor
// - Ändere einen Wert
// - Speichern funktioniert

// Standalone Item: Öffne Item aus Items Directory
// - Ändere einen Wert
// - Speichern funktioniert
```

---

### TASK-ITEM-004: activateListeners() → Actions Migration

**Datei:** `scripts/sheets/items/item.js`  
**Zeit:** 30 min  
**Status:** ⬜ TODO  
**Abhängig von:** TASK-ITEM-001

**Aufgabe:**
Die `activateListeners()` Methode durch Actions-System ersetzen und `_onRender()` für non-click Events nutzen.

**Aktueller Code (V1 - zu ändern):**

```javascript
activateListeners(html) {
    super.activateListeners(html)
    html.find('.item-delete').click((ev) => this._onItemDelete(ev))
}

_onItemDelete(event) {
    const itemID = event.currentTarget.dataset.itemid
    if (!itemID) {
        ui.notifications?.warn('Cannot delete item: No item ID found')
        return
    }

    if (this.actor) {
        this.actor.deleteEmbeddedDocuments('Item', [itemID])
    } else {
        this.item.delete()
    }
}
```

**Ziel-Code (V2):**

```javascript
// In DEFAULT_OPTIONS:
static DEFAULT_OPTIONS = {
    // ... andere Options
    actions: {
        deleteItem: IlarisItemSheet.onDeleteItem
    }
}

// Action als static method
static async onDeleteItem(event, target) {
    // Confirmation Dialog
    const confirmed = await foundry.applications.api.DialogV2.confirm({
        window: { title: game.i18n.localize("ITEM.DeleteTitle") },
        content: `<p>${game.i18n.localize("ITEM.DeleteWarning")}</p>`,
        yes: { label: game.i18n.localize("Yes") },
        no: { label: game.i18n.localize("No") }
    })

    if (!confirmed) return

    // V2 MAGIC: document.delete() funktioniert automatisch!
    await this.document.delete()
    this.close()
}

// _onRender für non-click Events (falls nötig)
_onRender(context, options) {
    super._onRender(context, options)

    // Beispiel für zusätzliche Event Listener
    const nameInput = this.element.querySelector('input[name="name"]')
    if (nameInput) {
        nameInput.addEventListener('input', (ev) => this._onNameChange(ev))
    }
}
```

**Sub-Tasks:**

- [ ] `activateListeners()` Methode entfernen oder nur `super._onRender()` aufrufen
- [ ] `_onItemDelete()` in static `onDeleteItem()` Action umwandeln
- [ ] Action in `DEFAULT_OPTIONS.actions` registrieren
- [ ] Confirmation Dialog mit DialogV2 hinzufügen
- [ ] `this.document.delete()` statt manueller Embedded-Check nutzen
- [ ] `_onRender()` hinzufügen für non-click Events (falls benötigt)
- [ ] jQuery-Calls entfernen (`.find()`, `.click()`)

**Template Änderung (falls vorhanden):**

```handlebars
<!-- ALT: -->
<button class='item-delete' data-itemid='{{item._id}}'>Delete</button>

<!-- NEU: -->
<button type='button' data-action='deleteItem'>
    <i class='fas fa-trash'></i>
    {{localize 'ITEM.Delete'}}
</button>
```

**Akzeptanzkriterien:**

- ✅ Keine jQuery `.find()` oder `.click()` Aufrufe mehr
- ✅ `onDeleteItem` als static method existiert
- ✅ Action in DEFAULT_OPTIONS registriert
- ✅ Confirmation Dialog funktioniert
- ✅ `this.document.delete()` wird genutzt
- ✅ Kein manueller Embedded/Standalone Check mehr
- ✅ `data-action="deleteItem"` im Template (falls HTML existiert)

**Test:**

```javascript
// Embedded Item:
// - Öffne Item Sheet von Item in Actor
// - Click Delete Button
// - Confirmation erscheint
// - After Confirm: Item wird gelöscht, Sheet schließt sich

// Standalone Item:
// - Öffne Item aus Items Directory
// - Click Delete Button
// - Confirmation erscheint
// - After Confirm: Item wird gelöscht, Sheet schließt sich
```

---

## 🟡 P2 - Wichtige Functional Tasks

### TASK-ITEM-005: Template PARTS Strukturieren

**Datei:** `scripts/sheets/items/item.js` + Templates  
**Zeit:** 30 min  
**Status:** ⬜ TODO  
**Abhängig von:** TASK-ITEM-001

**Aufgabe:**
Template-Struktur analysieren und ggf. in PARTS aufteilen (optional für einfache Items).

**Analysekriterien:**

- Wie viele Tabs hat das Item Sheet? (0-1 → ein PART, 2+ → mehrere PARTS)
- Gibt es wiederverwendbare Sections? (dann PARTS sinnvoll)
- Ist partiales Rendering gewünscht? (dann PARTS erforderlich)

**Option A: Einfaches Item (ein PART):**

```javascript
static PARTS = {
    form: {
        template: "systems/Ilaris/templates/sheets/items/item-sheet.hbs"
    }
}
```

**Option B: Komplexes Item (mehrere PARTS):**

```javascript
static PARTS = {
    header: {
        template: "systems/Ilaris/templates/sheets/items/parts/header.hbs"
    },
    tabs: {
        template: "systems/Ilaris/templates/sheets/items/parts/tabs.hbs"
    },
    description: {
        template: "systems/Ilaris/templates/sheets/items/parts/description.hbs"
    },
    details: {
        template: "systems/Ilaris/templates/sheets/items/parts/details.hbs"
    },
    effects: {
        template: "systems/Ilaris/templates/sheets/items/parts/effects.hbs"
    }
}
```

**Sub-Tasks:**

- [ ] Aktuelles Template analysieren (welches Template wird genutzt?)
- [ ] Entscheidung: Ein PART oder mehrere PARTS?
- [ ] Falls mehrere PARTS: Template in Teile aufsplitten
- [ ] Template-Pfade in `PARTS` definieren
- [ ] Testen: Sheet rendert korrekt mit neuer PARTS-Struktur

**Akzeptanzkriterien:**

- ✅ PARTS ist vollständig definiert
- ✅ Alle Template-Pfade sind korrekt
- ✅ Sheet rendert ohne Fehler
- ✅ Alle Sections sind sichtbar

**Empfehlung:**
Für einfache Item Sheets **OHNE Tabs** → Ein PART reicht!

---

### TASK-ITEM-006: isEditable Override (Optional)

**Datei:** `scripts/sheets/items/item.js`  
**Zeit:** 15 min  
**Status:** ⬜ TODO  
**Abhängig von:** TASK-ITEM-002

**Aufgabe:**
Optional: Custom `isEditable` Getter für spezielle Editierbarkeits-Logik bei embedded Items.

**Hintergrund:**

- `DocumentSheetV2` hat bereits einen `isEditable` Getter
- Dieser prüft: `this.document.isOwner && !this.document.pack`
- Für embedded Items in Actors möchte man evtl. Actor-Ownership prüfen

**Ziel-Code (optional):**

```javascript
get isEditable() {
    // Für embedded Items: Prüfe Actor-Ownership
    if (this.item.actor) {
        return this.item.actor.isOwner && !this.item.actor.pack
    }

    // Für standalone Items: Default Logic
    return super.isEditable
}
```

**Sub-Tasks:**

- [ ] Evaluieren: Ist custom `isEditable` nötig?
- [ ] Falls ja: Getter implementieren
- [ ] Testen mit embedded Items in fremden Actors (sollte read-only sein)
- [ ] Testen mit eigenen embedded Items (sollte editable sein)

**Akzeptanzkriterien:**

- ✅ Embedded Items in fremden Actors sind read-only
- ✅ Embedded Items in eigenen Actors sind editable
- ✅ Standalone Items folgen normaler Ownership-Logic

**Test:**

```javascript
// Test 1: Eigener Actor
const myActor = game.actors.find((a) => a.isOwner)
const myItem = myActor.items.contents[0]
myItem.sheet.render(true)
// Sheet sollte editable sein

// Test 2: Fremder Actor (falls vorhanden)
const otherActor = game.actors.find((a) => !a.isOwner)
if (otherActor) {
    const theirItem = otherActor.items.contents[0]
    theirItem.sheet.render(true)
    // Sheet sollte read-only sein
}
```

---

### TASK-ITEM-007: Window Controls / Header Buttons

**Datei:** `scripts/sheets/items/item.js`  
**Zeit:** 20 min  
**Status:** ⬜ TODO  
**Abhängig von:** TASK-ITEM-001

**Aufgabe:**
Header Buttons (z.B. Delete, Duplicate) in Window Controls migrieren.

**Ziel-Code:**

```javascript
static DEFAULT_OPTIONS = {
    // ... andere Options
    window: {
        icon: "fas fa-suitcase",
        title: "ITEM.Title",
        controls: [
            {
                icon: "fa-solid fa-trash",
                label: "ITEM.Delete",
                action: "deleteItem",
                ownership: "OWNER"  // nur für Owners sichtbar
            },
            {
                icon: "fa-solid fa-copy",
                label: "ITEM.Duplicate",
                action: "duplicateItem",
                ownership: "OWNER"
            }
        ]
    }
}

// Optional: Duplicate Action
static async onDuplicateItem(event, target) {
    const copy = await this.document.clone({
        name: game.i18n.format("DOCUMENT.CopyOf", { name: this.document.name })
    })

    if (this.document.isEmbedded) {
        await this.document.actor.createEmbeddedDocuments('Item', [copy.toObject()])
    } else {
        await copy.constructor.create(copy.toObject())
    }

    ui.notifications.info(game.i18n.format("ITEM.Duplicated", { name: copy.name }))
}
```

**Sub-Tasks:**

- [ ] Window controls in DEFAULT_OPTIONS definieren
- [ ] Icons und Labels mit Localization Keys versehen
- [ ] Ownership-Level konfigurieren (`OWNER`, `LIMITED`, `OBSERVER`)
- [ ] Actions für Buttons implementieren (z.B. duplicate)
- [ ] Falls vorhanden: Custom Header Buttons aus Template entfernen

**Akzeptanzkriterien:**

- ✅ Controls erscheinen im Sheet Header Dropdown
- ✅ Icons und Labels sind korrekt
- ✅ Actions funktionieren
- ✅ Visibility basiert auf Ownership

---

## 🟢 P3 - Optional Enhancement Tasks

### TASK-ITEM-008: DragDrop für Effects (Optional)

**Datei:** `scripts/sheets/items/item.js`  
**Zeit:** 45 min  
**Status:** ⬜ TODO  
**Abhängig von:** TASK-ITEM-004

**Aufgabe:**
Falls Items ActiveEffects enthalten können, DragDrop-Funktionalität implementieren.

**Nur relevant wenn:**

- Items können ActiveEffects haben
- Man möchte Effects per Drag & Drop hinzufügen/umsortieren

**Ziel-Code:**

```javascript
static DEFAULT_OPTIONS = {
    // ... andere Options
    dragDrop: [
        {
            dragSelector: "[data-effect-id]",
            dropSelector: ".effects-list"
        }
    ]
}

constructor(options = {}) {
    super(options)
    this.#dragDrop = this.#createDragDropHandlers()
}

#dragDrop;

#createDragDropHandlers() {
    return this.options.dragDrop.map(d => {
        d.permissions = {
            dragstart: this._canDragStart.bind(this),
            drop: this._canDragDrop.bind(this)
        }
        d.callbacks = {
            dragstart: this._onDragStart.bind(this),
            drop: this._onDrop.bind(this)
        }
        return new foundry.applications.ux.DragDrop(d)
    })
}

_onRender(context, options) {
    super._onRender(context, options)
    this.#dragDrop.forEach(d => d.bind(this.element))
}

_canDragStart(selector) {
    return this.isEditable
}

_canDragDrop(selector) {
    return this.isEditable
}

async _onDragStart(event) {
    const effectId = event.currentTarget.dataset.effectId
    const effect = this.item.effects.get(effectId)
    event.dataTransfer.setData("text/plain", JSON.stringify(effect.toDragData()))
}

async _onDrop(event) {
    const data = TextEditor.getDragEventData(event)

    if (data.type === "ActiveEffect") {
        // Effect drop logic
        return this._onDropActiveEffect(event, data)
    }
}

async _onDropActiveEffect(event, data) {
    // Implement effect drop handling
    const effect = await ActiveEffect.implementation.fromDropData(data)
    await this.item.createEmbeddedDocuments("ActiveEffect", [effect.toObject()])
}
```

**Sub-Tasks:**

- [ ] DragDrop Config in DEFAULT_OPTIONS
- [ ] Constructor mit DragDrop Handler Setup
- [ ] `#dragDrop` private field
- [ ] `#createDragDropHandlers()` method
- [ ] Binding in `_onRender()`
- [ ] `_onDragStart()` implementieren
- [ ] `_onDrop()` implementieren
- [ ] Permission Checks (`_canDragStart`, `_canDragDrop`)

**Akzeptanzkriterien:**

- ✅ Effects können gedraggt werden
- ✅ Effects können gedropt werden
- ✅ Nur wenn editable
- ✅ DragDrop nicht möglich wenn read-only

---

### TASK-ITEM-009: Tab System (Optional)

**Datei:** `scripts/sheets/items/item.js` + Templates  
**Zeit:** 60 min  
**Status:** ⬜ TODO  
**Abhängig von:** TASK-ITEM-005

**Aufgabe:**
Falls Item Sheet Tabs hat, Tab-System auf V2 migrieren.

**Nur relevant wenn:**

- Item Sheet hat 2+ Tabs (z.B. Description, Details, Effects)

**Ziel-Code:**

```javascript
static PARTS = {
    header: { template: "..." },
    tabs: { template: "systems/Ilaris/templates/sheets/items/parts/tabs.hbs" },
    description: { template: "..." },
    details: { template: "..." },
    effects: { template: "..." }
}

tabGroups = {
    primary: "description"  // default active tab
}

async _prepareContext(options) {
    const context = await super._prepareContext(options)

    // Tabs Configuration
    context.tabs = {
        description: {
            id: "description",
            group: "primary",
            label: "ITEM.Tabs.Description",
            icon: "fas fa-book",
            active: this.tabGroups.primary === "description"
        },
        details: {
            id: "details",
            group: "primary",
            label: "ITEM.Tabs.Details",
            icon: "fas fa-list",
            active: this.tabGroups.primary === "details"
        },
        effects: {
            id: "effects",
            group: "primary",
            label: "ITEM.Tabs.Effects",
            icon: "fas fa-star",
            active: this.tabGroups.primary === "effects"
        }
    }

    return context
}
```

**Template (tabs.hbs):**

```handlebars
<nav class="sheet-tabs tabs" data-group="primary">
    {{#each tabs}}
        <a class="item {{#if active}}active{{/if}}" data-tab="{{id}}">
            {{#if icon}}<i class="{{icon}}"></i>{{/if}}
            {{localize label}}
        </a>
    {{/each}}
</nav>
```

**Sub-Tasks:**

- [ ] PARTS für jeden Tab definieren
- [ ] `tabGroups` Property initialisieren
- [ ] Tab Context in `_prepareContext()` vorbereiten
- [ ] Tab Navigation Template erstellen
- [ ] Tab Content Templates erstellen
- [ ] `changeTab()` funktioniert (wird von ApplicationV2 gehandhabt)

**Akzeptanzkriterien:**

- ✅ Tabs sind sichtbar
- ✅ Click auf Tab wechselt Content
- ✅ Active Tab wird gespeichert
- ✅ Korrekter Tab ist nach Re-Render aktiv

---

## 🔵 Testing Tasks

### TASK-ITEM-TEST-001: Embedded Item Testing

**Zeit:** 30 min  
**Status:** ⬜ TODO  
**Abhängig von:** TASK-ITEM-001, TASK-ITEM-002, TASK-ITEM-003, TASK-ITEM-004

**Test-Cases:**

#### TC-001: Embedded Item - View

- [ ] Actor öffnen der Items hat
- [ ] Item Sheet von embedded Item öffnen
- [ ] Sheet rendert korrekt
- [ ] Alle Felder sind sichtbar
- [ ] Owner: Felder sind editable
- [ ] Nicht-Owner: Felder sind read-only

#### TC-002: Embedded Item - Edit

- [ ] Embedded Item Sheet öffnen (als Owner)
- [ ] Wert in Feld ändern (z.B. Name)
- [ ] Änderung speichern
- [ ] Sheet schließen und neu öffnen
- [ ] Änderung ist persistiert

#### TC-003: Embedded Item - Delete

- [ ] Embedded Item Sheet öffnen
- [ ] Delete Button klicken
- [ ] Confirmation Dialog erscheint
- [ ] "Yes" klicken
- [ ] Item wird aus Actor entfernt
- [ ] Sheet schließt sich automatisch

---

### TASK-ITEM-TEST-002: Standalone Item Testing

**Zeit:** 20 min  
**Status:** ⬜ TODO  
**Abhängig von:** TASK-ITEM-001, TASK-ITEM-002, TASK-ITEM-003, TASK-ITEM-004

**Test-Cases:**

#### TC-004: Standalone Item - View

- [ ] Items Directory öffnen
- [ ] Item Sheet von standalone Item öffnen
- [ ] Sheet rendert korrekt
- [ ] Alle Felder sind sichtbar
- [ ] Owner: Felder sind editable

#### TC-005: Standalone Item - Edit

- [ ] Standalone Item Sheet öffnen
- [ ] Wert in Feld ändern
- [ ] Änderung speichern
- [ ] Sheet schließen und neu öffnen
- [ ] Änderung ist persistiert

#### TC-006: Standalone Item - Delete

- [ ] Standalone Item Sheet öffnen
- [ ] Delete Button klicken
- [ ] Confirmation Dialog erscheint
- [ ] "Yes" klicken
- [ ] Item wird aus World entfernt
- [ ] Sheet schließt sich automatisch

---

### TASK-ITEM-TEST-003: Compendium Item Testing

**Zeit:** 15 min  
**Status:** ⬜ TODO  
**Abhängig von:** TASK-ITEM-001, TASK-ITEM-002

**Test-Cases:**

#### TC-007: Compendium Item - Read-Only

- [ ] Compendium öffnen mit Items
- [ ] Item Sheet aus Compendium öffnen
- [ ] Sheet rendert korrekt
- [ ] Alle Felder sind READ-ONLY
- [ ] Keine Edit-Buttons sichtbar
- [ ] Kein Delete-Button sichtbar

#### TC-008: Compendium Item - Import

- [ ] Item aus Compendium in World importieren
- [ ] Importiertes Item Sheet öffnen
- [ ] Jetzt ist es editable
- [ ] Änderungen funktionieren

---

### TASK-ITEM-TEST-004: Form Handling Testing

**Zeit:** 20 min  
**Status:** ⬜ TODO  
**Abhängig von:** TASK-ITEM-003

**Test-Cases:**

#### TC-009: Form Submit - Manual

- [ ] Item Sheet öffnen (embedded oder standalone)
- [ ] Feld ändern
- [ ] Sheet NICHT schließen
- [ ] Prüfen: Änderung ist im Document (via entity lookup)

#### TC-010: Form Submit - Auto-Save (falls aktiviert)

- [ ] Falls `submitOnChange: true` in DEFAULT_OPTIONS:
- [ ] Item Sheet öffnen
- [ ] Feld ändern
- [ ] Warten 1-2 Sekunden
- [ ] Änderung wird automatisch gespeichert

#### TC-011: Form Submit - Error Handling

- [ ] Item Sheet öffnen
- [ ] Ungültigen Wert eingeben (z.B. Text in Number-Field)
- [ ] Speichern
- [ ] Error wird abgefangen
- [ ] User-Feedback erscheint (Notification)

---

### TASK-ITEM-TEST-005: Console Error Check

**Zeit:** 10 min  
**Status:** ⬜ TODO  
**Abhängig von:** Alle Implementation Tasks

**Test-Cases:**

#### TC-012: No Console Errors

- [ ] Browser Console öffnen (F12)
- [ ] Item Sheet öffnen (embedded)
- [ ] Keine Errors in Console
- [ ] Keine Warnings bezüglich deprecated APIs
- [ ] Item Sheet öffnen (standalone)
- [ ] Keine Errors in Console

#### TC-013: V2 API Validation

```javascript
// Im Browser Console ausführen:
const sheet = Object.values(ui.windows).find((w) => w.constructor.name === 'IlarisItemSheet')

console.log('instanceof ItemSheetV2:', sheet instanceof foundry.applications.sheets.ItemSheetV2)
console.log('Has DEFAULT_OPTIONS:', !!sheet.constructor.DEFAULT_OPTIONS)
console.log('Has PARTS:', !!sheet.constructor.PARTS)
console.log('Has _prepareContext:', typeof sheet._prepareContext === 'function')
console.log('Has _onRender:', typeof sheet._onRender === 'function')
console.log('NO getData:', typeof sheet.getData === 'undefined')
console.log('NO _updateObject:', typeof sheet._updateObject === 'undefined')
console.log('NO activateListeners:', typeof sheet.activateListeners === 'undefined')

// Alle sollten true/undefined wie erwartet sein
```

---

## 📊 Progress Tracking

### Übersicht

| Task ID  | Name                  | Priority | Zeit  | Status  | Abhängig von |
| -------- | --------------------- | -------- | ----- | ------- | ------------ |
| ITEM-001 | Class Structure       | P1       | 15min | ⬜ TODO | -            |
| ITEM-002 | getData → Context     | P1       | 20min | ⬜ TODO | ITEM-001     |
| ITEM-003 | Form Handler          | P1       | 25min | ⬜ TODO | ITEM-001     |
| ITEM-004 | Actions Migration     | P1       | 30min | ⬜ TODO | ITEM-001     |
| ITEM-005 | Template PARTS        | P2       | 30min | ⬜ TODO | ITEM-001     |
| ITEM-006 | isEditable Override   | P2       | 15min | ⬜ TODO | ITEM-002     |
| ITEM-007 | Window Controls       | P2       | 20min | ⬜ TODO | ITEM-001     |
| ITEM-008 | DragDrop (Optional)   | P3       | 45min | ⬜ TODO | ITEM-004     |
| ITEM-009 | Tab System (Optional) | P3       | 60min | ⬜ TODO | ITEM-005     |
| TEST-001 | Embedded Testing      | Test     | 30min | ⬜ TODO | ITEM-001-004 |
| TEST-002 | Standalone Testing    | Test     | 20min | ⬜ TODO | ITEM-001-004 |
| TEST-003 | Compendium Testing    | Test     | 15min | ⬜ TODO | ITEM-001-002 |
| TEST-004 | Form Testing          | Test     | 20min | ⬜ TODO | ITEM-003     |
| TEST-005 | Console Check         | Test     | 10min | ⬜ TODO | All          |

**Total Time (Core - P1+P2):** ~2.5-3 Stunden  
**Total Time (mit Optional - P3):** ~4-5 Stunden  
**Total Time (mit Testing):** ~5-6.5 Stunden

---

## 🎯 Definition of Done

Ein Task ist "Done" wenn:

- ✅ Code ist implementiert und committet
- ✅ Keine Console Errors beim Laden
- ✅ Keine Console Errors beim Öffnen des Sheets
- ✅ Alle relevanten Test-Cases sind passed
- ✅ Code folgt V2-Best-Practices (kein getData, kein \_updateObject, etc.)
- ✅ Embedded UND Standalone Items funktionieren
- ✅ Documentation/Comments im Code (falls komplex)

---

## 🚀 Quick Start Guide

### Reihenfolge (Empfohlen):

1. **Phase 1 - Foundation (P1):**
    - ITEM-001 (Class Structure) → 15min
    - ITEM-002 (getData → Context) → 20min
    - ITEM-003 (Form Handler) → 25min
    - ITEM-004 (Actions) → 30min
    - **Zwischentest:** Sheet öffnen, keine Errors

2. **Phase 2 - Enhancement (P2):**
    - ITEM-005 (Template PARTS) → 30min
    - ITEM-006 (isEditable) → 15min
    - ITEM-007 (Window Controls) → 20min
    - **Zwischentest:** Alle Features funktionieren

3. **Phase 3 - Testing:**
    - TEST-001 (Embedded) → 30min
    - TEST-002 (Standalone) → 20min
    - TEST-003 (Compendium) → 15min
    - TEST-004 (Form) → 20min
    - TEST-005 (Console) → 10min

4. **Phase 4 - Optional (P3):** Nur wenn benötigt
    - ITEM-008 (DragDrop) → 45min
    - ITEM-009 (Tab System) → 60min

### Minimal Viable Migration (MVP):

Für ein funktionierendes Item Sheet **ohne** optionale Features:

1. ITEM-001 (Class) - 15min
2. ITEM-002 (Context) - 20min
3. ITEM-003 (Form) - 25min
4. ITEM-004 (Actions) - 30min
5. TEST-001-003 (Basic Tests) - 1h

**Total MVP Time: ~2-2.5h**

---

## 🔗 Referenzen

- **Findings Dokument:** `MIGRATION_FINDINGS_ITEMSHEET.md`
- **Foundry API Docs:** https://foundryvtt.com/api/v13/classes/foundry.applications.sheets.ItemSheetV2.html
- **Migration Guide:** https://foundryvtt.wiki/en/development/guides/converting-to-appv2
- **Actor Migration:** `MIGRATION_FINDINGS_APPV2.md` (für Vergleich)

---

**Ende des Task-Dokuments**
