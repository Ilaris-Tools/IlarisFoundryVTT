# TASK 06: SubClass Actions - HeldenSheet

**Priorität:** 🔴 CRITICAL  
**Estimated Time:** 2 hours  
**Dependencies:** TASK 03, TASK 05  
**Files Affected:** `scripts/sheets/helden.js`

---

## Objective

Konvertiere die `_schipsClick()` und `_triStateClick()` Methoden zu Actions und ergänze das Actions-System in HeldenSheet.

---

## Requirements Covered

- REQ-EVENTS-002: Click-Events → Actions System
- REQ-EVENTS-003: jQuery entfernen

---

## Implementation Steps

### Step 1: Aktualisiere DEFAULT_OPTIONS mit Actions

**Update existing DEFAULT_OPTIONS from TASK 04:**

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
            changeTab: HeldenSheet.changeTab,
            schipsClick: HeldenSheet.schipsClick,
            triStateClick: HeldenSheet.triStateClick
        }
    }
```

### Step 2: Konvertiere \_schipsClick() zu Action

**Current (Lines 37-48):**

```javascript
    async _schipsClick(ev) {
        console.log(ev)
        if (ev.currentTarget.className.includes('filled')) {
            await this.actor.update({
                'system.schips.schips_stern': this.actor.system.schips.schips_stern - 1,
            })
        } else {
            await this.actor.update({
                'system.schips.schips_stern': this.actor.system.schips.schips_stern + 1,
            })
        }
        this.render()
    }
```

**Replace with:**

```javascript
    /**
     * Handle schicksalspunkt (fate point) button clicks
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The button element
     */
    static async schipsClick(event, target) {
        const isFilled = target.classList.contains('filled')
        const currentValue = this.actor.system.schips.schips_stern
        const newValue = isFilled ? currentValue - 1 : currentValue + 1

        await this.actor.update({
            'system.schips.schips_stern': newValue
        })
        return this.render()
    }
```

### Step 3: Konvertiere \_triStateClick() zu Action

**Current (Lines 50-77):**

```javascript
    async _triStateClick(ev) {
        console.log('tristate click')
        const button = ev.currentTarget
        let state = parseInt(button.dataset.state)

        // Cycle through states: 0 -> 1 -> 2 -> 0
        state = (state + 1) % 3
        button.dataset.state = state

        // Update the actor's data
        const buttons = Array.from(ev.currentTarget.parentElement.querySelectorAll('.triStateBtn'))
        const wunden = buttons.filter((btn) => btn.dataset.state == 1).length
        const erschoepfung = buttons.filter((btn) => btn.dataset.state == 2).length

        await this.actor.update({
            'system.gesundheit.wunden': wunden,
            'system.gesundheit.erschoepfung': erschoepfung,
        })

        console.log(`Updated states: Wunden = ${wunden}, Erschöpfung = ${erschöpfung}`)

        // Update open combat dialogs when wounds or exhaustion change (with debouncing)
        if (this._triStateUpdateTimeout) {
            clearTimeout(this._triStateUpdateTimeout)
        }

        this._triStateUpdateTimeout = setTimeout(() => {
            this._updateOpenCombatDialogs()
        }, 300)

        this.render()
    }
```

**Replace with:**

```javascript
    /**
     * Handle tri-state button clicks for health conditions (wounds/exhaustion)
     * @param {PointerEvent} event - The click event
     * @param {HTMLElement} target - The button element
     */
    static async triStateClick(event, target) {
        let state = parseInt(target.dataset.state) || 0

        // Cycle through states: 0 -> 1 -> 2 -> 0
        state = (state + 1) % 3
        target.dataset.state = state

        // Find all tri-state buttons in the same container
        const parentContainer = target.closest('.lebensleiste')
        if (!parentContainer) return

        const buttons = Array.from(parentContainer.querySelectorAll('[data-action="triStateClick"]'))
        const wunden = buttons.filter((btn) => parseInt(btn.dataset.state) === 1).length
        const erschoepfung = buttons.filter((btn) => parseInt(btn.dataset.state) === 2).length

        await this.actor.update({
            'system.gesundheit.wunden': wunden,
            'system.gesundheit.erschoepfung': erschoepfung
        })

        // Update open combat dialogs with debouncing
        if (this._triStateUpdateTimeout) {
            clearTimeout(this._triStateUpdateTimeout)
        }

        this._triStateUpdateTimeout = setTimeout(() => {
            this._updateOpenCombatDialogs()
        }, 300)

        return this.render()
    }
```

### Step 4: Ergänze \_onRender() für spezielle Listener (falls nötig)

**Check if additional listeners needed (from old activateListeners):**

```javascript
    _onRender(context, options) {
        super._onRender(context, options)

        // Add any non-click listeners here if needed
        // Most listeners should now be handled via Actions
    }
```

### Step 5: Entferne alte Listener-Methode

**If helden.js has activateListeners(), delete it completely:**

```javascript
    // DELETE THIS ENTIRE METHOD:
    activateListeners(html) {
        super.activateListeners(html)
        html.find('.schips-button').click((ev) => this._schipsClick(ev))
        html.find('.triStateBtn').click((ev) => this._triStateClick(ev))
    }
```

### Step 6: Update Templates - data-action Attributes

**In `templates/sheets/helden/header.hbs`:**

```handlebars
<!-- Schips Buttons -->
<span class='schips-button filled' data-action='schipsClick' title='Schicksalspunkt'></span>
<span class='schips-button' data-action='schipsClick' title='verbrauchter Schicksalspunkt'></span>
```

**In `templates/sheets/helden/parts/kampf.hbs` (or whereever health is):**

```handlebars
<button type="button"
    class="triStateBtn state-{{getButtonState index ../actor.system.gesundheit.wunden ../actor.system.gesundheit.erschoepfung}}"
    data-action="triStateClick"
    data-state="{{getButtonState index ../actor.system.gesundheit.wunden ../actor.system.gesundheit.erschoepfung}}">
</button>
```

---

## Key Points

✅ **Static Actions:**

- `schipsClick` und `triStateClick` sind now static
- Signatur: `static async methodName(event, target)`
- Greifen auf `this.actor` mit korrektem Context zu

✅ **Event Handling:**

- Keine jQuery mehr
- `target.classList` statt jQuery Classes
- `target.closest()` statt jQuery traversal

✅ **Debouncing:**

- `_triStateUpdateTimeout` Property bleibt
- Wird in Static Action über `this` zugegriffen

❌ **MUST NOT:**

- jQuery `$(ev.currentTarget)`
- Nicht-static Methoden für Actions
- `console.log()` Debug Statements

---

## Validation Checklist

- [ ] `DEFAULT_OPTIONS.actions` hat `schipsClick` und `triStateClick`
- [ ] `schipsClick()` ist `static async`
- [ ] `triStateClick()` ist `static async`
- [ ] Keine jQuery Selektoren in Actions
- [ ] `this.actor` wird korrekt zugegriffen
- [ ] `_updateOpenCombatDialogs()` wird aufgerufen
- [ ] Debouncing mit `_triStateUpdateTimeout` funktioniert
- [ ] `activateListeners()` ist gelöscht

---

## Next Task

→ **TASK 07: SubClass Migration - KreaturSheet** (after HeldenSheet is done)
