# Migration zu ItemSheetV2 - Findings

**Status:** V12 → V13 ItemSheetV2 Migration  
**Datum:** 2026-02-10  
**Zielversion:** Foundry VTT v13+

---

## 📋 Executive Summary

Die aktuelle `IlarisItemSheet` basiert auf der **alten ItemSheet (Application V1) API** und muss auf **ItemSheetV2** migriert werden. ItemSheetV2 basiert auf derselben ApplicationV2-Architektur wie ActorSheetV2, ist aber in der Regel einfacher strukturiert.

### Kernunterschiede zu ActorSheet:

- **Einfachere Struktur**: Items haben normalerweise keine komplexen Tab-Systeme
- **Embedded vs Standalone**: Items können sowohl in Actors embedded als auch standalone existieren
- **Weniger PARTS**: Oft ein einzelnes Template ohne Teil-Rendering

---

## 🔴 Critical Breaking Changes

### 1. **Klassendeklaration**

#### ❌ ALTES SYSTEM (V1 - Aktuell)

```javascript
export class IlarisItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
    // Aktueller Code verwendet trotz ItemSheetV2 Import noch V1-Methoden!

    async getData() {
        const data = super.getData()
        // ...
        return data
    }

    async _updateObject(event, formData) {
        // ...
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('.item-delete').click(...)
    }
}
```

**Problem:** Der Code importiert bereits `ItemSheetV2` und `HandlebarsApplicationMixin`, verwendet aber noch veraltete V1-Methoden!

#### ✅ NEUES SYSTEM (V2 - Korrekt)

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
        actions: {
            deleteItem: IlarisItemSheet.onDeleteItem,
        },
        window: {
            icon: 'fas fa-suitcase',
        },
    }

    static PARTS = {
        form: {
            id: 'form',
            template: 'systems/Ilaris/templates/sheets/items/item-sheet.hbs',
        },
    }

    // V2 Methoden
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // Embedded vs. Standalone
        const hasActor = this.item.actor != null
        const isOwner = this.item.actor?.isOwner
        const notInPack = this.item.actor?.pack == null

        context.isEditable = hasActor && isOwner && notInPack

        return context
    }

    _onRender(context, options) {
        super._onRender(context, options)
        // Event Listeners hier (non-click)
    }

    // Actions als static methods
    static async onDeleteItem(event, target) {
        const itemID = this.item.id

        if (this.item.isEmbedded) {
            await this.item.actor.deleteEmbeddedDocuments('Item', [itemID])
        } else {
            await this.item.delete()
        }

        this.close()
    }
}
```

---

### 2. **DEFAULT_OPTIONS Struktur**

#### ❌ ALT (nicht vorhanden in aktuellem Code!)

```javascript
// Keine DEFAULT_OPTIONS definiert -> verwendet nur Defaults
```

#### ✅ NEU (ItemSheetV2 Format)

```javascript
static DEFAULT_OPTIONS = {
    // Basic Configuration
    classes: ["ilaris", "sheet", "item"],

    // Position/Größe
    position: {
        width: 500,
        height: "auto"  // oder fester Wert
    },

    // Form als root element
    tag: "form",

    // Form Handling (NEU!)
    form: {
        handler: IlarisItemSheet.#onSubmitForm,
        submitOnChange: false,
        closeOnSubmit: false
    },

    // Actions (Ersatz für activateListeners)
    actions: {
        deleteItem: IlarisItemSheet.onDeleteItem,
        editDescription: IlarisItemSheet.onEditDescription,
        rollItem: IlarisItemSheet.onRollItem
    },

    // Header Controls (Dropdown Menu)
    window: {
        icon: "fas fa-suitcase",
        title: "ITEM.Title",  // Localization key
        controls: [
            {
                icon: "fa-solid fa-trash",
                label: "ITEM.Delete",
                action: "deleteItem"
            }
        ]
    },

    // Drag/Drop Config (falls benötigt)
    dragDrop: [
        { dragSelector: "[data-item-id]", dropSelector: null }
    ]
}
```

**Wichtig für Items:**

- Oft keine Tabs → simpler als ActorSheet
- `height: "auto"` ist oft sinnvoll für Items
- Embedded Items haben andere Editierbarkeits-Logik

---

### 3. **getData() → \_prepareContext()**

#### ❌ ALT

```javascript
async getData() {
    const data = super.getData()

    // Editierbarkeits-Check
    const hasActor = this.item.actor != null
    const isOwner = this.item.actor?.isOwner
    const notInPack = this.item.actor?.pack == null
    data.hasOwner = hasActor && isOwner && notInPack

    return data
}
```

#### ✅ NEU

```javascript
async _prepareContext(options) {
    const context = await super._prepareContext(options)

    // Super liefert bereits:
    // - context.item (das Item Document)
    // - context.source (item.toObject())
    // - context.fields (schema fields)
    // - context.editable (isEditable)

    // Custom Logic für Embedded Items
    const hasActor = this.item.actor != null
    const isOwner = this.item.actor?.isOwner
    const notInPack = this.item.actor?.pack == null

    context.isEditable = hasActor && isOwner && notInPack
    context.enrichedDescription = await TextEditor.enrichHTML(
        this.item.system.description,
        { async: true }
    )

    // Bei Bedarf: Actor-Daten hinzufügen
    if (hasActor) {
        context.actor = this.item.actor
    }

    return context
}
```

**Unterschiede:**

- `context.item` statt `context.data` oder `context.actor`
- `context.source` für Roh-Daten (wie `toObject()`)
- `context.editable` ist bereits von Super gesetzt
- Muss `async` sein und `await super._prepareContext(options)`

---

### 4. **\_updateObject() → Form Handler**

#### ❌ ALT

```javascript
async _updateObject(event, formData) {
    try {
        const result = await super._updateObject(event, formData)

        if (!result) {
            if (this.item.isEmbedded) {
                return await this.item.actor.updateEmbeddedDocuments('Item', [
                    { _id: this.item.id, ...formData }
                ])
            } else {
                return await this.item.update(formData)
            }
        }

        return result
    } catch (error) {
        console.error('Item update failed:', error)
        throw error
    }
}
```

**Problem:** Diese Methode existiert in V2 nicht mehr!

#### ✅ NEU

```javascript
static DEFAULT_OPTIONS = {
    form: {
        handler: IlarisItemSheet.#onSubmitForm,
        submitOnChange: false,  // true für Auto-Save
        closeOnSubmit: false     // true um Sheet zu schließen
    }
}

static async #onSubmitForm(event, form, formData) {
    // formData ist FormDataExtended
    const updateData = foundry.utils.expandObject(formData.object)

    // Update wird automatisch behandelt von DocumentSheetV2!
    // Embedded Items werden korrekt durch Parent Actor updated
    await this.document.update(updateData)
}
```

**WICHTIG:**

- ItemSheetV2 (`DocumentSheetV2`) **handled Embedded vs. Standalone automatisch**!
- Kein manueller Check mehr nötig ob `isEmbedded`
- `this.document.update()` funktioniert für beide Fälle
- `formData.object` ist das expandierte Object

---

### 5. **activateListeners() → \_onRender() + Actions**

#### ❌ ALT (jQuery-basiert)

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

#### ✅ NEU (Vanilla DOM + Actions)

```javascript
// In DEFAULT_OPTIONS:
actions: {
    deleteItem: IlarisItemSheet.onDeleteItem
}

// Action als static method:
static async onDeleteItem(event, target) {
    const confirmed = await Dialog.confirm({
        title: game.i18n.localize("ITEM.DeleteTitle"),
        content: `<p>${game.i18n.localize("ITEM.DeleteWarning")}</p>`
    })

    if (!confirmed) return

    // this = Application Instance
    // Kein Check nötig - document.delete() funktioniert immer!
    await this.document.delete()
    this.close()
}

// _onRender für non-click Events (falls benötigt)
_onRender(context, options) {
    super._onRender(context, options)

    // Beispiel: Input Event
    const nameInput = this.element.querySelector('input[name="name"]')
    if (nameInput) {
        nameInput.addEventListener('input', (ev) => this._onNameChange(ev))
    }
}
```

**Merkpunkte:**

- HTML: `<button data-action="deleteItem">Delete</button>`
- Actions sind `static` aber `this` = instance
- **Kein Embedded-Check nötig** - `this.document.delete()` funktioniert immer
- Confirmation Dialogs mit DialogV2

---

### 6. **Template System: PARTS**

#### ❌ ALT (monolithisch)

```
templates/sheets/items/
  item-sheet.hbs  (alles in einer Datei)
```

#### ✅ NEU (Optional: PARTS)

Für einfache Item Sheets oft NICHT nötig:

```javascript
static PARTS = {
    form: {
        template: "systems/Ilaris/templates/sheets/items/item-sheet.hbs"
    }
}
```

Für komplexe Items mit Tabs:

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

**Empfehlung:**

- Einfache Items: Ein einzelnes PART
- Komplexe Items mit Tabs: Mehrere PARTS
- **Weniger komplex als ActorSheet**

---

### 7. **Embedded vs. Standalone Items**

#### V1 Handling (manuell)

```javascript
if (this.item.isEmbedded) {
    await this.item.actor.updateEmbeddedDocuments('Item', [{ _id: this.item.id, ...data }])
} else {
    await this.item.update(data)
}
```

#### V2 Handling (automatisch!)

```javascript
// Funktioniert für BEIDE Fälle automatisch!
await this.document.update(data)
await this.document.delete()
```

**WICHTIG:**

- ItemSheetV2 erbt von `DocumentSheetV2`
- `DocumentSheetV2` kennt den Unterschied embedded/standalone
- **Kein manueller Check mehr nötig!**
- Nutze immer `this.document` statt `this.item` für Operationen

---

### 8. **DragDrop für Items**

#### ❌ ALT (automatisch in V1)

```javascript
// Wurde automatisch gehandhabt
```

#### ✅ NEU (optional konfigurieren)

```javascript
static DEFAULT_OPTIONS = {
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
        return new DragDrop(d)
    })
}

_onRender(context, options) {
    super._onRender(context, options)
    this.#dragDrop.forEach(d => d.bind(this.element))
}

async _onDragStart(event) {
    // Custom drag logic
}

async _onDrop(event) {
    // Custom drop logic
}
```

**Für einfache Item Sheets:**

- Oft nicht benötigt
- Nur wenn Items andere Items/Effects enthalten

---

## 🟡 ItemSheetV2-Spezifische Features

### Accessor Properties

```javascript
// Verfügbar in ItemSheetV2:
this.item // Das Item Document
this.actor // Parent Actor (null wenn standalone)
this.document // Alias für this.item
this.isEditable // Ist editierbar?
```

### Context Properties (von Super)

```javascript
async _prepareContext(options) {
    const context = await super._prepareContext(options)

    // context enthält bereits:
    // - item: this.item
    // - source: this.item.toObject()
    // - fields: this.item.schema.fields
    // - editable: this.isEditable
    // - user: game.user

    return context
}
```

### isEditable Logik

```javascript
// DocumentSheetV2 setzt automatisch:
get isEditable() {
    // Prüft permissions automatisch
    return this.document.isOwner && !this.document.pack
}

// Custom Override möglich:
get isEditable() {
    // Zusätzliche Checks für embedded Items
    if (this.item.actor) {
        return this.item.actor.isOwner && !this.item.actor.pack
    }
    return super.isEditable
}
```

---

## 📦 Aktuelle Dateistruktur

### Ist:

```
scripts/sheets/items/
  item.js         (67 Zeilen, verwendet V1-Methoden trotz V2-Import!)

templates/sheets/items/
  (vermutlich item-sheet.hbs oder ähnlich)
```

### Soll (nach Migration):

```
scripts/sheets/items/
  item.js         (85-120 Zeilen, vollständig auf V2)

  (optional für verschiedene Item-Typen:)
  waffe.js
  fertigkeit.js
  vorteil.js

templates/sheets/items/
  item-sheet.hbs  (falls einfach)

  (oder mit PARTS:)
  parts/
    header.hbs
    description.hbs
    details.hbs
    effects.hbs
```

---

## ⚠️ Migration Komplexität (für ItemSheet)

### Einfach (1-2 Stunden):

- ✅ DEFAULT_OPTIONS hinzufügen
- ✅ `getData()` → `_prepareContext()` umbenennen
- ✅ `_updateObject()` durch Form Handler ersetzen
- ✅ Embedded/Standalone Checks entfernen

### Mittel (2-3 Stunden):

- ✅ `activateListeners()` → `_onRender()` + Actions
- ✅ jQuery entfernen wo verwendet
- ✅ Event Listeners umbauen
- ✅ Tests für embedded & standalone Items

### Optional/Komplex (3-5 Stunden):

- ⚠️ Template in PARTS aufteilen (nur wenn nötig)
- ⚠️ Tab System implementieren (nur für komplexe Items)
- ⚠️ DragDrop für Effects/Nested Items
- ⚠️ Subklassen für verschiedene Item-Typen

---

## 🔧 Compatibility Matrix

| Feature                | V1 (Aktuell)               | V2 (Target)           | ItemSheet-Spezifik           |
| ---------------------- | -------------------------- | --------------------- | ---------------------------- |
| getData()              | ✅                         | ❌ → \_prepareContext | **Breaking**                 |
| \_updateObject()       | ✅                         | ❌ → Form Handler     | **Breaking**                 |
| activateListeners()    | ✅                         | ❌ → \_onRender()     | **Breaking**                 |
| Embedded Item Handling | ⚠️ Manuell                 | ✅ Automatisch        | **Großer Vorteil!**          |
| defaultOptions         | ✅ Getter                  | ❌ → DEFAULT_OPTIONS  | **Breaking**                 |
| jQuery                 | ✅ Auto                    | ⚠️ Manual             | Mit `const html = $(...)`    |
| PARTS                  | ❌ Nicht vorhanden         | ✅ Optional           | Oft nicht nötig              |
| Tabs                   | ❌ Meist nicht nötig       | ⚠️ Optional           | Nur für komplexe Items       |
| DragDrop               | ✅ Auto (basic)            | ⚠️ Manual             | Nur wenn Items Effects haben |
| this.document.update() | ❌ Manuelle Unterscheidung | ✅ Funktioniert immer | **Großer Vorteil!**          |

---

## 📚 Offizielle Ressourcen

1. **ItemSheetV2 API**: https://foundryvtt.com/api/v13/classes/foundry.applications.sheets.ItemSheetV2.html
2. **DocumentSheetV2 API**: https://foundryvtt.com/api/v13/classes/foundry.applications.api.DocumentSheetV2.html
3. **ApplicationV2 API**: https://foundryvtt.com/api/v13/classes/foundry.applications.api.ApplicationV2.html
4. **Migration Guide**: https://foundryvtt.wiki/en/development/guides/converting-to-appv2
5. **HandlebarsApplicationMixin**: Für Template-Rendering mit PARTS

---

## ✅ Vergleich: ActorSheetV2 vs ItemSheetV2

| Aspekt                 | ActorSheetV2                      | ItemSheetV2                   | Unterschied                          |
| ---------------------- | --------------------------------- | ----------------------------- | ------------------------------------ |
| Komplexität            | Hoch (Tabs, PARTS, viele Actions) | Meist niedrig                 | Items sind einfacher                 |
| PARTS                  | Fast immer empfohlen              | Optional, oft 1 PART reicht   | Weniger Teil-Rendering nötig         |
| Tabs                   | Häufig                            | Selten                        | Items haben selten Tabs              |
| Embedded Handling      | Nicht relevant                    | **Großes Thema!**             | Items können embedded sein           |
| Form Handling          | Identisch                         | Identisch                     | Gleiche V2-Mechanismen               |
| Actions                | Viele                             | Wenige (oft nur Delete/Roll)  | Weniger Interaktion                  |
| DragDrop               | Oft (Items in Actor)              | Selten (nur für nested Items) | Items haben selten DragDrop          |
| Migration Aufwand      | Hoch (8-12h+)                     | Mittel (2-5h)                 | ItemSheet ist schneller zu migrieren |
| this.document.update() | Standard                          | **Super wichtig!**            | Ersetzt embedded/standalone Checks   |

---

## 🎯 Critical Success Factors (ItemSheet-spezifisch)

1. **Nutze `this.document` statt `this.item`** für Updates/Deletes
2. **Kein manuelles Embedded-Handling** - V2 macht das automatisch
3. **Minimalistisch starten** - oft reicht ein einzelnes PART
4. **Actions für Click-Events** nutzen
5. **Form Handler korrekt implementieren** mit `FormDataExtended`
6. **Tests für beide Fälle:** embedded Items UND standalone Items

---

## 🚀 Quick Migration Checklist

- [ ] `getData()` → `_prepareContext(options)` umbenennen
- [ ] `await super._prepareContext(options)` statt `super.getData()`
- [ ] `_updateObject()` entfernen, Form Handler hinzufügen
- [ ] `activateListeners()` → `_onRender()` + Actions
- [ ] DEFAULT_OPTIONS mit `form`, `actions`, `window` definieren
- [ ] Embedded/Standalone Checks durch `this.document.method()` ersetzen
- [ ] jQuery entfernen (oder bewusst beibehalten mit `$(this.element)`)
- [ ] PARTS definieren (minimal: ein Part)
- [ ] `this.item` → `this.document` wo nötig
- [ ] Testen mit embedded Items (in Actor)
- [ ] Testen mit standalone Items (in World)
- [ ] Testen mit Items im Compendium (read-only)

---

## 💡 Code-Beispiel: Vollständige Migration

### Vorher (V1-Methoden trotz V2-Import):

```javascript
const { HandlebarsApplicationMixin } = foundry.applications.api
const { ItemSheetV2 } = foundry.applications.sheets

export class IlarisItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
    async getData() {
        const data = super.getData()
        const hasActor = this.item.actor != null
        const isOwner = this.item.actor?.isOwner
        const notInPack = this.item.actor?.pack == null
        data.hasOwner = hasActor && isOwner && notInPack
        return data
    }

    async _updateObject(event, formData) {
        if (this.item.isEmbedded) {
            await this.item.actor.updateEmbeddedDocuments('Item', [
                { _id: this.item.id, ...formData },
            ])
        } else {
            await this.item.update(formData)
        }
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('.item-delete').click((ev) => this._onItemDelete(ev))
    }

    _onItemDelete(event) {
        const itemID = event.currentTarget.dataset.itemid
        if (this.actor) {
            this.actor.deleteEmbeddedDocuments('Item', [itemID])
        } else {
            this.item.delete()
        }
    }
}
```

### Nachher (Korrekte V2-Implementierung):

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
            controls: [
                {
                    icon: 'fa-solid fa-trash',
                    label: 'ITEM.Delete',
                    action: 'deleteItem',
                },
            ],
        },
    }

    static PARTS = {
        form: {
            template: 'systems/Ilaris/templates/sheets/items/item-sheet.hbs',
        },
    }

    // Context Preparation
    async _prepareContext(options) {
        const context = await super._prepareContext(options)

        // Super liefert bereits: item, source, fields, editable

        // Custom: Embedded Check für Editierbarkeit
        const hasActor = this.item.actor != null
        const isOwner = this.item.actor?.isOwner
        const notInPack = this.item.actor?.pack == null
        context.isEditable = hasActor && isOwner && notInPack

        // Enriched Content
        context.enrichedDescription = await TextEditor.enrichHTML(this.item.system.description, {
            async: true,
        })

        return context
    }

    // Render Lifecycle
    _onRender(context, options) {
        super._onRender(context, options)
        // Additional event listeners (non-click) hier
    }

    // Form Submission Handler
    static async #onSubmitForm(event, form, formData) {
        const updateData = foundry.utils.expandObject(formData.object)
        // Funktioniert automatisch für embedded & standalone!
        await this.document.update(updateData)
    }

    // Action: Delete Item
    static async onDeleteItem(event, target) {
        const confirmed = await Dialog.confirm({
            title: game.i18n.localize('ITEM.DeleteTitle'),
            content: `<p>${game.i18n.localize('ITEM.DeleteWarning')}</p>`,
        })

        if (!confirmed) return

        // Funktioniert automatisch für embedded & standalone!
        await this.document.delete()
        this.close()
    }

    // Optional: Override isEditable
    get isEditable() {
        // Custom Logic für embedded Items
        if (this.item.actor) {
            return this.item.actor.isOwner && !this.item.actor.pack
        }
        return super.isEditable
    }
}
```

---

## 📝 Template Anpassungen

### HTML mit Actions:

```handlebars
<form class='{{cssClass}}' autocomplete='off'>
    <header class='sheet-header'>
        <img src='{{item.img}}' data-edit='img' title='{{item.name}}' />
        <div class='header-fields'>
            <h1>
                <input
                    name='name'
                    type='text'
                    value='{{item.name}}'
                    placeholder='{{localize "ITEM.Name"}}'
                />
            </h1>
        </div>
    </header>

    <section class='sheet-body'>
        <div class='tab description' data-group='primary' data-tab='description'>
            <div class='editor'>
                {{editor
                    enrichedDescription
                    target='system.description'
                    button=true
                    editable=editable
                    engine='prosemirror'
                }}
            </div>
        </div>

        <div class='tab details' data-group='primary' data-tab='details'>
            <!-- Item Details -->
        </div>
    </section>

    <footer class='sheet-footer'>
        {{#if isEditable}}
            <button type='button' data-action='deleteItem'>
                <i class='fas fa-trash'></i>
                {{localize 'ITEM.Delete'}}
            </button>
        {{/if}}
    </footer>
</form>
```

---

## 🎯 Next Steps

1. **Analyse Complete** ✓ (dieses Dokument)
2. **Migration Start** → IlarisItemSheet auf V2 anpassen
3. **Template Update** → HTML mit Actions versehen
4. **Testing** → Embedded & Standalone & Compendium
5. **Subklassen** → Falls verschiedene Item-Typen existieren

---

## 🔍 Debugging Tipps

### Console Checks:

```javascript
// Im Browser Console:
const sheet = Object.values(ui.windows).find((w) => w instanceof IlarisItemSheet)

// Prüfe ob V2:
console.log(sheet instanceof foundry.applications.sheets.ItemSheetV2) // true
console.log(sheet.constructor.DEFAULT_OPTIONS) // sollte existieren
console.log(sheet.constructor.PARTS) // sollte existieren

// Prüfe Context:
sheet._prepareContext({}).then((ctx) => console.log(ctx))

// Prüfe Embedded Status:
console.log(sheet.item.isEmbedded) // true/false
console.log(sheet.item.actor) // parent actor oder null
console.log(sheet.document === sheet.item) // true
```

### Häufige Fehler:

1. **"getData is not a function"** → Vergessen auf `_prepareContext` umzustellen
2. **"\_updateObject is not a function"** → Form Handler fehlt
3. **Update funktioniert nicht** → `formData.object` vergessen zu expanden
4. **Embedded Items nicht editierbar** → `isEditable` Logic falsch
5. **Actions funktionieren nicht** → `data-action` Attribut fehlt im HTML

---

## 📊 Migration Impact Score

| Kategorie           | Impact  | Effort | Risiko | Priorität |
| ------------------- | ------- | ------ | ------ | --------- |
| Class Structure     | 🔴 High | 🟢 Low | 🟡 Med | 1         |
| getData → Context   | 🔴 High | 🟢 Low | 🟢 Low | 1         |
| Form Handling       | 🔴 High | 🟡 Med | 🟡 Med | 2         |
| Event Listeners     | 🟡 Med  | 🟡 Med | 🟢 Low | 3         |
| Embedded Handling   | 🟢 Low  | 🟢 Low | 🟢 Low | 1         |
| Template Changes    | 🟡 Med  | 🟢 Low | 🟢 Low | 3         |
| PARTS System        | 🟢 Low  | 🟢 Low | 🟢 Low | 4         |
| Testing (all types) | 🟡 Med  | 🟡 Med | 🟡 Med | 2         |

**Gesamt-Aufwand:** ~2-5 Stunden (deutlich weniger als ActorSheet!)

---

**Ende des Dokuments**
