# TASK 03: Event Handling Refactor - actor.js

**Priorität:** 🔴 CRITICAL  
**Estimated Time:** 4 hours  
**Dependencies:** TASK 01, TASK 02  
**Files Affected:** `scripts/sheets/actor.js`

---

## Objective

Konvertiere alle `activateListeners()` Click-Events zu Actions und nicht-Click Event Listener zu `_onRender()`.

---

## Requirements Covered

- REQ-EVENTS-001: activateListeners() → \_onRender()
- REQ-EVENTS-002: Click-Events → Actions System
- REQ-EVENTS-003: jQuery entfernen
- REQ-EVENTS-004: Event Handler Binding

---

## Implementation Steps

### Step 1: Identifiziere alle Click-Events aus activateListeners()

**Current (Lines 33-54):**

```javascript
    activateListeners(html) {
        super.activateListeners(html)
        html.find('.ausklappen-trigger').click((ev) => this._ausklappView(ev))
        html.find('.rollable').click((ev) => this._onRollable(ev))
        html.find('.clickable').click((ev) => this._onClickable(ev))
        html.find('.item-create').click((ev) => this._onItemCreate(ev))
        html.find('.item-edit').click((ev) => this._onItemEdit(ev))
        html.find('.item-delete').click((ev) => this._onItemDelete(ev))
        html.find('.item-toggle').click((ev) => this._onToggleItem(ev))
        html.find('.toggle-bool').click((ev) => this._onToggleBool(ev))
        html.find('.hp-update').on('input change', (ev) => this._onHpUpdate(ev))

        // Input listeners
        html.find('input[name="system.gesundheit.wunden"]').on('input', (ev) =>
            this._onHealthValueChange(ev),
        )
        html.find('input[name="system.gesundheit.erschoepfung"]').on('input', (ev) =>
            this._onHealthValueChange(ev),
        )

        // Sync items button
        html.find('.sync-items').click((ev) => this._onSyncItems(ev))
    }
```

**Zu migrierende Click-Events:**

1. `.ausklappen-trigger` → Action: `ausklappView`
2. `.rollable` → Action: `rollable`
3. `.clickable` → Action: `clickable`
4. `.item-create` → Action: `itemCreate`
5. `.item-edit` → Action: `itemEdit`
6. `.item-delete` → Action: `itemDelete`
7. `.item-toggle` → Action: `toggleItem`
8. `.toggle-bool` → Action: `toggleBool`
9. `.sync-items` → Action: `syncItems`

**Non-Click Events (für \_onRender()):**

- `input` auf `.hp-update`
- `input` auf `input[name="system.gesundheit.wunden"]`
- `input` auf `input[name="system.gesundheit.erschoepfung"]`

### Step 2: Konvertiere Click-Handler zu Static Action-Methoden

**Add actions to DEFAULT_OPTIONS (aktualisiere Step 2 aus TASK 01):**

```javascript
    static DEFAULT_OPTIONS = {
        // ... existing configuration
        actions: {
            ausklappView: IlarisActorSheet.ausklappView,
            rollable: IlarisActorSheet.onRollable,
            clickable: IlarisActorSheet.onClickable,
            itemCreate: IlarisActorSheet.onItemCreate,
            itemEdit: IlarisActorSheet.onItemEdit,
            itemDelete: IlarisActorSheet.onItemDelete,
            toggleItem: IlarisActorSheet.onToggleItem,
            toggleBool: IlarisActorSheet.onToggleBool,
            syncItems: IlarisActorSheet.onSyncItems
        }
    }
```

### Step 3: Konvertiere \_ausklappView() zu Static Action

**Current (Lines 56-65):**

```javascript
    _ausklappView(event) {
        const targetkey = $(event.currentTarget).data('ausklappentarget')
        const targetId = 'ausklappen-view-'.concat(targetkey)
        var toggleView = document.getElementById(targetId)
        if (toggleView.style.display === 'none') {
            toggleView.style.display = 'table-row'
        } else {
            toggleView.style.display = 'none'
        }
    }
```

**Replace with:**

```javascript
    /**
     * Toggle visibility of expandable sections
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The target element with data-action
     */
    static ausklappView(event, target) {
        const targetkey = target.dataset.ausklappentarget
        const targetId = `ausklappen-view-${targetkey}`
        const toggleView = this.element.querySelector(`#${targetId}`)
        if (toggleView) {
            toggleView.style.display = toggleView.style.display === 'none' ? 'table-row' : 'none'
        }
    }
```

### Step 4: Konvertiere andere Click-Handler

**Pattern für alle Click-Handler:**

- Entferne `this._methodName()` Aufrufe
- Mache Handler `static` Methoden
- Ersetze `$(event.currentTarget).data(...)` mit `target.dataset.*`
- Ersetze alle jQuery-Selektoren mit `this.element.querySelector()`
- Signatur: `static methodName(event, target)`

**Zu konvertieren:**

- `_onRollable()` → `static onRollable(event, target)`
- `_onClickable()` → `static onClickable(event, target)`
- `_onItemCreate()` → `static onItemCreate(event, target)`
- `_onItemEdit()` → `static onItemEdit(event, target)`
- `_onItemDelete()` → `static onItemDelete(event, target)`
- `_onToggleItem()` → `static onToggleItem(event, target)`
- `_onToggleBool()` → `static onToggleBool(event, target)`
- `_onSyncItems()` → `static onSyncItems(event, target)`

### Step 5: Erstelle \_onRender() für Non-Click Events

**Add new method (nach #onSubmitForm):**

```javascript
    /**
     * Bind event listeners that are not click events
     * @param {ApplicationRenderContext} context - The render context
     * @param {RenderOptions} options - Render options
     * @protected
     */
    _onRender(context, options) {
        super._onRender(context, options)

        // Bind input listeners for real-time health updates
        const woundsInput = this.element.querySelector('input[name="system.gesundheit.wunden"]')
        if (woundsInput) {
            woundsInput.addEventListener('input', (ev) => this._onHealthValueChange(ev))
        }

        const exhaustionInput = this.element.querySelector('input[name="system.gesundheit.erschoepfung"]')
        if (exhaustionInput) {
            exhaustionInput.addEventListener('input', (ev) => this._onHealthValueChange(ev))
        }

        // Bind input listener for hp updates
        const hpUpdates = this.element.querySelectorAll('.hp-update')
        for (const elem of hpUpdates) {
            elem.addEventListener('input', (ev) => this._onHpUpdate(ev))
        }
    }
```

### Step 6: Lösche alte activateListeners()

**Delete completely (Lines 33-54)** - wird durch \_onRender() und Actions ersetzt.

### Step 7: Überprüfe Methoden-Signaturen

Stelle sicher, dass diese Instance-Methoden NICHT static sind (da sie `this.actor` und weitere Properties nutzen):

- `_ausklappView()` → WIRD zu Static Action, aber muss `this.element` verwenden können
- `_onHealthValueChange()` → Bleibt Instance-Methode (wird in \_onRender() aufgerufen)
- `_onHpUpdate()` → Bleibt Instance-Methode
- `_updateOpenCombatDialogs()` → Bleibt Instance-Methode

---

## Key Points

✅ **Click-Events müssen:**

- Static sein
- Im DEFAULT_OPTIONS.actions registriert sein
- Signatur haben: `static name(event, target)`
- Mit `target.dataset.*` auf Daten zugreifen

✅ **Non-Click Events müssen:**

- In `_onRender()` mit `addEventListener()` registriert sein
- Arrow-Funktionen nutzen für korrekten `this` Context
- Mit `this.element.querySelector()` Elemente finden

❌ **MUST NOT:**

- jQuery `html.find()` verwenden
- Ungebundene Funktionen
- Click-Handler in `_onRender()` registrieren

---

## Validation Checklist

- [ ] `activateListeners()` Methode ist komplett gelöscht
- [ ] `_onRender(context, options)` Methode existiert
- [ ] `DEFAULT_OPTIONS.actions` hat alle 9 Actions
- [ ] Alle Action-Methoden sind `static`
- [ ] Keine jQuery-Selektoren mehr in Action-Methoden
- [ ] Input-Listener sind in `_onRender()`
- [ ] `this.element.querySelector()` wird überall verwendet
- [ ] Arrow-Funktionen in `addEventListener()` calls

---

## Next Task

→ **TASK 04: Form Handling & Submission** (after event handling is done)
