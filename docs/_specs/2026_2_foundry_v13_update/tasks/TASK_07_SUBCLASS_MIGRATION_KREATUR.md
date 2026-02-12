# TASK 07: SubClass Migration - KreaturSheet

**Priorität:** 🔴 CRITICAL  
**Estimated Time:** 3 hours  
**Dependencies:** TASK 03, TASK 04, TASK 05  
**Files Affected:** `scripts/sheets/kreatur.js`

---

## Objective

Migriere KreaturSheet zu ApplicationV2 mit Action-basiertem Event Handling, Dialog-Unterstützung und DragDrop neu implementiert.

---

## Requirements Covered

- REQ-EVENTS-002: Click-Events → Actions System
- REQ-EVENTS-003: jQuery entfernen
- REQ-CROSS-003: Dialog/Prompt Migration
- REQ-CROSS-004: DragDrop Implementierung

---

## Implementation Steps

### Step 1: Aktualisiere DEFAULT_OPTIONS & PARTS

**Replace existing defaultOptions (Lines 5-17):**

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
            changeTab: KreaturSheet.changeTab,
            clickable: KreaturSheet.clickable,
            addVorteilInfo: KreaturSheet.addVorteilInfo
        },
        dragDrop: [
            { dragSelector: '[data-drag]', dropSelector: null }
        ]
    }

    static PARTS = {
        header: { template: "systems/Ilaris/templates/sheets/kreatur/header.hbs" },
        tabs: { template: "systems/Ilaris/templates/sheets/kreatur/tabs.hbs" },
        profan: { template: "systems/Ilaris/templates/sheets/kreatur/parts/profan.hbs" },
        uebernatuerlich: { template: "systems/Ilaris/templates/sheets/kreatur/parts/uebernatuerlich.hbs" }
    }
```

### Step 2: Implementiere Konstruktor mit DragDrop

**Add constructor before DEFAULT_OPTIONS:**

```javascript
    constructor(options = {}) {
        super(options)
        this.#dragDrop = this.#createDragDropHandlers()
    }

    #createDragDropHandlers() {
        return this.options.dragDrop.map((d) => {
            d.permissions = {
                dragstart: this._canDragStart.bind(this),
                drop: this._canDragDrop.bind(this),
            }
            d.callbacks = {
                dragstart: this._onDragStart.bind(this),
                dragover: this._onDragOver.bind(this),
                drop: this._onDrop.bind(this),
            }
            return new DragDrop(d)
        })
    }

    #dragDrop

    get dragDrop() {
        return this.#dragDrop
    }
```

### Step 3: Konvertiere \_onClickable() zu Action

**Current (Lines 25-55):**

```javascript
    async _onClickable(event) {
        super._onClickable(event)
        let clicktype = $(event.currentTarget).data('clicktype')
        if (clicktype == 'addvorteilinfo') {
            // ... Dialog code ...
        } else if (clicktype == 'addanyitem') {
            // ... Dialog code ...
        }
    }
```

**Replace with:**

```javascript
    /**
     * Handle clickable actions specific to creature sheets
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The target element
     */
    static async clickable(event, target) {
        const clicktype = target.dataset.clicktype

        if (clicktype === 'addvorteilinfo') {
            return KreaturSheet.addVorteilInfo.call(this, event, target)
        } else if (clicktype === 'addanyitem') {
            return KreaturSheet.addAnyItem.call(this, event, target)
        }
    }

    /**
     * Show info about adding advantages
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The target element
     */
    static addVorteilInfo(event, target) {
        game.packs.get('Ilaris.vorteile').render(true)
        Dialog.prompt({
            content: 'Du kannst Vorteile direkt aus den Kompendium Packs auf den Statblock ziehen. Für eigene Vor/Nachteile zu erstellen, die nicht im Regelwerk enthalten sind, benutze die Eigenschaften.',
            callback: () => {}
        })
    }

    /**
     * Show dialog to add new creature item
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The target element
     */
    static async addAnyItem(event, target) {
        const html = await renderTemplate(
            'systems/Ilaris/templates/sheets/dialogs/addkreaturitem.hbs',
            {}
        )
        const dialog = new Dialog({
            title: 'Item Hinzufügen:',
            content: html,
            buttons: {
                one: {
                    label: 'Zauber',
                    callback: () => {
                        // Call parent itemCreate action
                        return this.onItemCreate(event, target)
                    }
                }
            }
        })
        return dialog.render(true)
    }
```

### Step 4: Implementiere DragDrop Callbacks

**Add after dragDrop getter:**

```javascript
    /**
     * Check if user can drag from selector
     * @param {string} selector - The drag selector
     * @returns {boolean}
     * @protected
     */
    _canDragStart(selector) {
        return this.isEditable
    }

    /**
     * Check if user can drop on selector
     * @param {string} selector - The drop selector
     * @returns {boolean}
     * @protected
     */
    _canDragDrop(selector) {
        return this.isEditable
    }

    /**
     * Handle drag start
     * @param {DragEvent} event - The drag event
     * @protected
     */
    _onDragStart(event) {
        const li = event.currentTarget.closest('.item')
        if (!li) return
        if (li.classList.contains('inventory-header')) return

        const dragData = {
            type: 'Item',
            uuid: li.dataset.itemId ? `Actor.${this.actor.id}.Item.${li.dataset.itemId}` : null
        }

        event.dataTransfer.setData('text/plain', JSON.stringify(dragData))
    }

    /**
     * Handle drag over
     * @param {DragEvent} event - The drag event
     * @protected
     */
    _onDragOver(event) {
        event.preventDefault()
    }

    /**
     * Handle drop
     * @param {DragEvent} event - The drag event
     * @protected
     */
    async _onDrop(event) {
        event.preventDefault()

        const data = TextEditor.getDragEventData(event)
        if (data.type !== 'Item') return

        const item = await Item.implementation.fromDropData(data)
        if (!item) return

        // Convert dropped item based on type
        return this._onDropItemCreate(item)
    }
```

### Step 5: Aktualisiere \_onDropItemCreate()

**Current (Lines 67-100):**

```javascript
    _onDropItemCreate(item) {
        console.log('Item gedroppt!')
        console.log(item)
        // ... existing logic ...
    }
```

**Make sure it still works - may need minimal changes:**

```javascript
    _onDropItemCreate(item) {
        // Existing logic should work unchanged
        // Just ensure it handles the item correctly
    }
```

### Step 6: Implementiere \_onRender() für DragDrop

**Add after \_onDrop():**

```javascript
    /**
     * Bind event listeners after render
     * @param {ApplicationRenderContext} context - The render context
     * @param {RenderOptions} options - Render options
     * @protected
     */
    _onRender(context, options) {
        super._onRender(context, options)

        // Bind DragDrop handlers
        this.dragDrop.forEach((d) => d.bind(this.element))
    }
```

### Step 7: Entferne alte Methods

**Delete these methods completely:**

- `activateListeners()` - wird durch `_onRender()` ersetzt
- Alte `_onClickable()` Instance-Methode
- Alle anderen jQuery-basierten Event-Handler

### Step 8: Update Templates - data-action Attributes

**In `templates/sheets/kreatur/header.hbs` oder wherever buttons are:**

```handlebars
<!-- ALT -->
<button class='clickable' data-clicktype='addvorteilinfo'>Info</button>

<!-- NEU -->
<button data-action='clickable' data-clicktype='addvorteilinfo'>Info</button>
```

**For draggable items:**

```handlebars
<div class='item' data-item-id='{{item.id}}' data-drag='true'>
    {{item.name}}
</div>
```

---

## Key Points

✅ **DragDrop:**

- Konstruktor initialisiert DragDrop
- Private field `#dragDrop` mit Getter
- Binding in `_onRender()`
- Alle Callbacks implementiert

✅ **Dialog Handling:**

- `Dialog.prompt()` weiterhin unterstützt
- V2-ready für neue Dialoge später

✅ **Event Actions:**

- Clickable und Sub-Actions sind static
- Können nested sein (clickable → addVorteilInfo)

❌ **MUST NOT:**

- jQuery in Actions
- activateListeners() verwenden
- DragDrop nicht in Konstruktor initialisieren

---

## Validation Checklist

- [ ] Konstruktor existiert mit DragDrop-Init
- [ ] `#dragDrop` Private Field vorhanden
- [ ] `dragDrop` Getter vorhanden
- [ ] `_canDragStart()`, `_canDragDrop()`, `_onDragStart()`, `_onDragOver()`, `_onDrop()` implementiert
- [ ] `clickable()` Action existiert
- [ ] `addVorteilInfo()` Action existiert
- [ ] `addAnyItem()` Action existiert
- [ ] `_onRender()` bindet DragDrop
- [ ] Keine jQuery-Selektoren
- [ ] `activateListeners()` ist gelöscht

---

## Next Task

→ **TASK 08: Cross-File Requirements - Final Polish** (after all classes are migrated)
