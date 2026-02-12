# 📋 Migration-Plan: FertigkeitDialog → ApplicationV2

**Basis: Foundry VTT ApplicationV2 API + CombatDialog Migration Pattern**
**Datum: 12. Februar 2026**

---

## 🎯 Scope

- ✅ **FertigkeitDialog** (scripts/sheets/dialogs/fertigkeit.js)
- ✅ **fertigkeit.hbs** Template (templates/sheets/dialogs/fertigkeit.hbs)
- ❌ Keine Testing-Änderungen
- ❌ Keine Backwards Compatibility

---

## 📊 Aktuelle Implementierung (V1)

```javascript
export class FertigkeitDialog extends Dialog {
    constructor(actor, options = {}) {
        const probeType = options.probeType || 'fertigkeit'
        const title = FertigkeitDialog._getDialogTitle(probeType, options)

        const dialogData = {
            title,
            buttons: {
                roll: { icon: '...', label: 'Würfeln', callback: (html) => this._onRoll(html) },
                cancel: { icon: '...', label: 'Abbrechen' }
            },
            default: 'roll'
        }

        const dialogOptions = {
            template: 'systems/Ilaris/templates/sheets/dialogs/fertigkeit.hbs',
            width: 900,
            height: 'auto',
            resizable: true,
            classes: ['fertigkeit-dialog', 'ilaris'],
            jQuery: true
        }

        super(dialogData, dialogOptions)

        this.actor = actor
        this.probeType = probeType
        this.fertigkeitKey = options.fertigkeitKey || null
        // ... weitere state properties
    }

    async getData() {
        const hasSchips = this.actor.system.schips.schips_stern > 0
        return {
            actor: this.actor,
            probeType: this.probeType,
            // ... context data
        }
    }

    activateListeners(html) {
        super.activateListeners(html)
        html.find('input, select').on('change input', () => { ... })
        html.find('#modifier-summary').on('click', '.clickable-summary', (ev) => { ... })
        setTimeout(() => this._updateModifierDisplay(html), 100)
    }

    _updateModifierDisplay(html) {
        // jQuery: html.find()
        const { diceFormula, totalMod, ... } = this._calculateModifiers(html)
        // jQuery: html.find(), .html(), .show(), .hide()
    }

    async _onRoll(html) {
        // jQuery: html.find()
        await roll_crit_message(...)
    }

    _getDiceFormula(diceCount, schipsChoice) { ... }
    _calculateModifiers(html) { ... }
    static _getDialogTitle(probeType, options) { ... }
}
```

**Key Observations:**

- Dialog V1 mit `dialogData` (title, buttons)
- Template in `dialogOptions`
- jQuery überall (`html.find()`, `.on()`, `.val()`, `.html()`, `.show()/.hide()`)
- State als Instance Properties
- `activateListeners()` für Event-Handling
- `getData()` für Context

---

## 🔄 Ziel-Implementierung (V2)

### 1. Class Definition & Imports

```javascript
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class FertigkeitDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    // ...
}
```

### 2. DEFAULT_OPTIONS (Static Object)

```javascript
static DEFAULT_OPTIONS = {
    classes: ['ilaris', 'fertigkeit-dialog'],
    position: { width: 900, height: 'auto' },
    window: {
        title: 'Fertigkeitsprobe',
        resizable: true
    },
    actions: {
        roll: FertigkeitDialog.#onRollAction,
        previewClick: FertigkeitDialog.#onPreviewClick
    }
}
```

**Änderungen:**

- ❌ Kein `buttons` Objekt mehr (V1 Dialog-spezifisch)
- ✅ `actions` statt `buttons` (data-action binding)
- ✅ `window.title` statt `title` in dialogData
- ✅ Object Literal, kein Getter

### 3. PARTS (Static Object)

```javascript
static PARTS = {
    form: {
        template: 'systems/Ilaris/templates/sheets/dialogs/fertigkeit.hbs'
    }
}
```

### 4. Constructor

```javascript
constructor(actor, options = {}) {
    super(options)

    this.actor = actor
    this.probeType = options.probeType || 'fertigkeit'
    this.fertigkeitKey = options.fertigkeitKey || null
    this.fertigkeitName = options.fertigkeitName || ''
    this.pw = options.pw || 0
    this.talentList = options.talentList || {}
    this.speaker = ChatMessage.getSpeaker({ actor: this.actor })
    this.dialogId = `dialog-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

    // Dynamic title override
    const title = FertigkeitDialog._getDialogTitle(this.probeType, options)
    this.options.window.title = title
}
```

**Änderungen:**

- ❌ Kein `dialogData` Parameter mehr
- ✅ Nur `options` an super übergeben
- ✅ Title dynamisch in `this.options.window.title` setzen

### 5. \_prepareContext (statt getData)

```javascript
async _prepareContext(options) {
    const context = await super._prepareContext(options)

    const hasSchips = this.actor.system.schips.schips_stern > 0

    return {
        ...context,
        actor: this.actor,
        probeType: this.probeType,
        fertigkeitKey: this.fertigkeitKey,
        fertigkeitName: this.fertigkeitName,
        pw: this.pw,
        talentList: this.talentList,
        hasTalents: Object.keys(this.talentList).length > 0,
        choices_xd20: CONFIG.ILARIS.xd20_choice,
        checked_xd20: '1',
        choices_schips: CONFIG.ILARIS.schips_choice,
        checked_schips: '0',
        hasSchips,
        rollModes: CONFIG.Dice.rollModes,
        defaultRollMode: game.settings.get('core', 'rollMode'),
        dialogId: this.dialogId
    }
}
```

**Änderungen:**

- ✅ `async _prepareContext(options)` statt `async getData()`
- ✅ `await super._prepareContext(options)` erforderlich!
- ✅ Context als merged object zurückgeben

### 6. Actions & Event Handling

#### Alte Methode (activateListeners):

```javascript
activateListeners(html) {
    super.activateListeners(html)

    // Store modifier element reference
    this._modifierElement = html.find('#modifier-summary')

    // Add listeners for real-time preview updates
    html.find('input, select').on('change input', () => {
        if (this._updateTimeout) {
            clearTimeout(this._updateTimeout)
        }
        this._updateTimeout = setTimeout(() => {
            this._updateModifierDisplay(html)
        }, 150)
    })

    // Make preview clickable to roll
    html.find('#modifier-summary').on('click', '.clickable-summary', (ev) => {
        ev.preventDefault()
        this._onRoll(html)
    })

    // Initial preview update
    setTimeout(() => this._updateModifierDisplay(html), 100)
}
```

#### Neue Methode (Actions + \_onRender):

```javascript
// In DEFAULT_OPTIONS.actions:
static DEFAULT_OPTIONS = {
    // ...
    actions: {
        roll: FertigkeitDialog.#onRollAction,
        previewClick: FertigkeitDialog.#onPreviewClick
    }
}

// Static action methods (Private)
static #onRollAction(event, target) {
    event.preventDefault()
    // `this` ist die Dialog-Instanz
    this.#executeRoll()
}

static #onPreviewClick(event, target) {
    event.preventDefault()
    this.#executeRoll()
}

// _onRender für Live-Update-Listeners
async _onRender(context, options) {
    await super._onRender(context, options)

    const html = this.element

    // Store modifier element reference
    this._modifierElement = html.querySelector('#modifier-summary')

    // Add listeners for real-time preview updates
    const inputs = html.querySelectorAll('input, select')
    inputs.forEach(input => {
        input.addEventListener('change', () => this.#handleInputChange())
        input.addEventListener('input', () => this.#handleInputChange())
    })

    // Initial preview update
    setTimeout(() => this._updateModifierDisplay(), 100)
}

#handleInputChange() {
    if (this._updateTimeout) {
        clearTimeout(this._updateTimeout)
    }
    this._updateTimeout = setTimeout(() => {
        this._updateModifierDisplay()
    }, 150)
}

#executeRoll() {
    const html = this.element
    const { diceFormula, effectivePW, ... } = this._calculateModifiers()
    // ... roll execution logic
}
```

**Änderungen:**

- ❌ `activateListeners()` entfernen
- ✅ Static action methods für `data-action` Buttons
- ✅ `_onRender()` für andere Event-Listeners (Live-Updates)
- ✅ DOM API statt jQuery
- ✅ `this.element` statt `html` Parameter

### 7. jQuery → DOM API Konvertierung

#### jQuery Patterns → DOM API

| jQuery                                      | DOM API                                                     | Notizen                            |
| ------------------------------------------- | ----------------------------------------------------------- | ---------------------------------- | --- | --- |
| `html.find('#id')`                          | `html.querySelector('#id')`                                 | Ein Element                        |
| `html.find('.class')`                       | `html.querySelectorAll('.class')`                           | NodeList (iterable)                |
| `html.find('input[name="x"]')`              | `html.querySelector('input[name="x"]')`                     |                                    |
| `html.find('input').val()`                  | `html.querySelector('input').value`                         |                                    |
| `html.find('input').val('new')`             | `html.querySelector('input').value = 'new'`                 |                                    |
| `html.find('input:checked').val()`          | `html.querySelector('input:checked')?.value`                | Optional chaining                  |
| `html.find('.elem').html()`                 | `html.querySelector('.elem').innerHTML`                     |                                    |
| `html.find('.elem').html('<div>...</div>')` | `html.querySelector('.elem').innerHTML = '<div>...</div>'`  |                                    |
| `html.find('.elem').show()`                 | `html.querySelector('.elem').style.display = ''`            | oder `.classList.remove('hidden')` |
| `html.find('.elem').hide()`                 | `html.querySelector('.elem').style.display = 'none'`        | oder `.classList.add('hidden')`    |
| `html.find('.elem').on('click', fn)`        | `html.querySelector('.elem').addEventListener('click', fn)` |                                    |
| `html.find('.elem').addClass('active')`     | `html.querySelector('.elem').classList.add('active')`       |                                    |
| `html.find('.elem').removeClass('active')`  | `html.querySelector('.elem').classList.remove('active')`    |                                    |
| `html.find('.elem').toggleClass('active')`  | `html.querySelector('.elem').classList.toggle('active')`    |                                    |
| `Number(html.find('#id').val()) \|\| 0`     | `Number(html.querySelector('#id').value)                    |                                    | 0`  |     |

#### Konkrete Änderungen in FertigkeitDialog

**1. \_updateModifierDisplay()**

```javascript
// VORHER (jQuery)
_updateModifierDisplay(html) {
    if (!this._modifierElement || this._modifierElement.length === 0) {
        return
    }

    const { diceFormula, totalMod, ... } = this._calculateModifiers(html)

    let summary = '<div class="all-summaries">...'

    const talentWarning = html.find('.talent-warning')
    if (talentWarning.length > 0) {
        if (noTalentSelected) {
            talentWarning.show()
        } else {
            talentWarning.hide()
        }
    }

    this._modifierElement.html(summary)
}

// NACHHER (DOM API)
_updateModifierDisplay() {
    if (!this._modifierElement) {
        return
    }

    const { diceFormula, totalMod, ... } = this._calculateModifiers()

    let summary = '<div class="all-summaries">...'

    const talentWarning = this.element.querySelector('.talent-warning')
    if (talentWarning) {
        if (noTalentSelected) {
            talentWarning.style.display = ''
        } else {
            talentWarning.style.display = 'none'
        }
    }

    this._modifierElement.innerHTML = summary
}
```

**2. \_calculateModifiers()**

```javascript
// VORHER (jQuery)
_calculateModifiers(html) {
    const globalermod = this.actor.system.abgeleitete.globalermod || 0
    const modLines = []

    const xd20Choice =
        Number(html.find(`input[name="xd20-${this.dialogId}"]:checked`).val()) || 0

    let selectedSchipsChoice =
        Number(html.find(`input[name="schips-${this.dialogId}"]:checked`).val()) || 0

    let hoheQualitaet = Number(html.find(`#hohequalitaet-${this.dialogId}`).val()) || 0

    let modifikator = Number(html.find(`#modifikator-${this.dialogId}`).val()) || 0

    const talentChoice = Number(html.find(`#talent-${this.dialogId}`).val())

    // ... rest of logic
}

// NACHHER (DOM API)
_calculateModifiers() {
    const html = this.element
    const globalermod = this.actor.system.abgeleitete.globalermod || 0
    const modLines = []

    const xd20Choice =
        Number(html.querySelector(`input[name="xd20-${this.dialogId}"]:checked`)?.value) || 0

    let selectedSchipsChoice =
        Number(html.querySelector(`input[name="schips-${this.dialogId}"]:checked`)?.value) || 0

    let hoheQualitaet = Number(html.querySelector(`#hohequalitaet-${this.dialogId}`)?.value) || 0

    let modifikator = Number(html.querySelector(`#modifikator-${this.dialogId}`)?.value) || 0

    const talentChoice = Number(html.querySelector(`#talent-${this.dialogId}`)?.value)

    // ... rest of logic
}
```

**3. \_onRoll() → #executeRoll()**

```javascript
// VORHER (jQuery)
async _onRoll(html) {
    const { diceFormula, effectivePW, ... } = this._calculateModifiers(html)

    const rollmode =
        html.find(`#rollMode-${this.dialogId}`).val() || game.settings.get('core', 'rollMode')

    // ... roll logic
}

// NACHHER (DOM API)
async #executeRoll() {
    const html = this.element
    const { diceFormula, effectivePW, ... } = this._calculateModifiers()

    const rollmode =
        html.querySelector(`#rollMode-${this.dialogId}`)?.value || game.settings.get('core', 'rollMode')

    // ... roll logic
}
```

### 8. Template-Änderungen (fertigkeit.hbs)

#### Root Element: `<form>` → `<section>`

**VORHER:**

```handlebars
<form class='fertigkeit-dialog'>
    <!-- content -->
</form>
```

**NACHHER:**

```handlebars
<section class='fertigkeit-dialog'>
    <!-- content -->
</section>
```

**Grund:** ApplicationV2 wrappt automatisch mit `<form>` wenn `tag: 'form'` gesetzt ist. Nested forms sind invalid.

#### Buttons: CSS-Klassen → `data-action`

**VORHER:**

```handlebars
<button class='roll-button'>Würfeln</button>
<div class='clickable-summary'>...</div>
```

**NACHHER:**

```handlebars
<button data-action='roll' class='roll-button'>Würfeln</button>
<div data-action='previewClick' class='clickable-summary'>...</div>
```

**Hinweis:** CSS-Klassen bleiben für Styling, `data-action` für Event-Binding.

### 9. Dialog Rendering (Aufruf)

**VORHER (V1):**

```javascript
const dialog = new FertigkeitDialog(actor, {
    probeType: 'fertigkeit',
    fertigkeitKey: 'schwerter',
    fertigkeitName: 'Schwerter',
    pw: 12,
    talentList: { 0: 'Langschwert', 1: 'Säbel' },
})
dialog.render(true)
```

**NACHHER (V2):**

```javascript
const dialog = new FertigkeitDialog(actor, {
    probeType: 'fertigkeit',
    fertigkeitKey: 'schwerter',
    fertigkeitName: 'Schwerter',
    pw: 12,
    talentList: { 0: 'Langschwert', 1: 'Säbel' },
})
await dialog.render({ force: true })
```

**Änderungen:**

- ✅ `render()` gibt Promise zurück (kann/sollte awaited werden)
- ✅ `{ force: true }` statt `true`

---

## 📋 Implementierungs-Checkliste

### Phase 1: Kern-Struktur (2h)

- [ ] **1.1** Import `ApplicationV2` und `HandlebarsApplicationMixin`
- [ ] **1.2** Class-Definition: `extends HandlebarsApplicationMixin(ApplicationV2)`
- [ ] **1.3** `static DEFAULT_OPTIONS` definieren
    - [ ] `classes`, `position`, `window`
    - [ ] ❌ NICHT: `buttons` (V1-spezifisch)
    - [ ] ✅ `actions` Objekt (leer, später befüllen)
- [ ] **1.4** `static PARTS` definieren
    - [ ] Template-Pfad in `form` part
- [ ] **1.5** Constructor anpassen
    - [ ] ❌ Kein `dialogData` mehr
    - [ ] ✅ `super(options)` statt `super(dialogData, options)`
    - [ ] ✅ Dynamic title: `this.options.window.title = ...`
- [ ] **1.6** `getData()` → `_prepareContext()`
    - [ ] Signature: `async _prepareContext(options)`
    - [ ] `await super._prepareContext(options)` aufrufen
    - [ ] Context-Objekt zurückgeben

### Phase 2: Event-Handling (2h)

- [ ] **2.1** `activateListeners()` analysieren
    - [ ] Button-Actions identifizieren → `data-action`
    - [ ] Live-Update-Listeners → `_onRender()`
- [ ] **2.2** Static action methods definieren
    - [ ] `static #onRollAction(event, target)`
    - [ ] `static #onPreviewClick(event, target)`
    - [ ] In `DEFAULT_OPTIONS.actions` registrieren
- [ ] **2.3** `_onRender()` implementieren
    - [ ] Live-Update-Listeners (input/select change/input events)
    - [ ] DOM API: `addEventListener()` statt `.on()`
- [ ] **2.4** `activateListeners()` entfernen

### Phase 3: jQuery → DOM API (3h)

- [ ] **3.1** `_updateModifierDisplay()` konvertieren
    - [ ] Kein `html` Parameter mehr (use `this.element`)
    - [ ] `html.find()` → `html.querySelector()`
    - [ ] `.html()` → `.innerHTML`
    - [ ] `.show()/.hide()` → `.style.display`
- [ ] **3.2** `_calculateModifiers()` konvertieren
    - [ ] Kein `html` Parameter mehr (use `this.element`)
    - [ ] `html.find().val()` → `html.querySelector().value`
    - [ ] Optional chaining für `:checked` selectors
- [ ] **3.3** `_onRoll()` → `#executeRoll()` konvertieren
    - [ ] Private method: `#executeRoll()`
    - [ ] Kein `html` Parameter
    - [ ] DOM API für Form-Werte
- [ ] **3.4** Helper-Methoden prüfen
    - [ ] `_getDiceFormula()` - kein HTML-Zugriff, OK
    - [ ] `_getDialogTitle()` - static, OK

### Phase 4: Template-Änderungen (1h)

- [ ] **4.1** Root-Element: `<form>` → `<section>`
- [ ] **4.2** Buttons mit `data-action` ergänzen
    - [ ] Roll-Button: `data-action="roll"`
    - [ ] Preview (clickable-summary): `data-action="previewClick"`
- [ ] **4.3** Keine `<form>` Tags verschachtelt im Template

### Phase 5: Validierung (1h)

- [ ] **5.1** Dialog öffnen & rendern
    - [ ] Title korrekt (dynamisch)
    - [ ] Inputs/Selects sichtbar
- [ ] **5.2** Live-Updates testen
    - [ ] Modifikator-Änderung aktualisiert Preview
    - [ ] Schips-Auswahl aktualisiert Würfelformel
- [ ] **5.3** Roll-Button testen
    - [ ] Würfelwurf wird ausgeführt
    - [ ] Chat-Nachricht erscheint
    - [ ] Schips werden abgezogen (wenn verwendet)
- [ ] **5.4** Preview-Click testen
    - [ ] Click auf Summary führt Wurf aus
- [ ] **5.5** Cancel funktioniert
    - [ ] Dialog schließt ohne Fehler

---

## 🚨 Kritische Punkte (API-konform)

| Punkt                   | API-Anforderung                                        | Lösung in FertigkeitDialog                                         |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------------------------------ |
| **Erbe**                | Muss `ApplicationV2` erben                             | `HandlebarsApplicationMixin(ApplicationV2)`                        |
| **DEFAULT_OPTIONS**     | Static Object Literal, kein Getter                     | `static DEFAULT_OPTIONS = { ... }`                                 |
| **PARTS**               | Static Object mit Template-Pfad                        | `static PARTS = { form: { template: '...' } }`                     |
| **Constructor**         | Nur `options`, kein `dialogData`                       | `super(options)` - State als Instance Properties                   |
| **\_prepareContext**    | `async` + `await super._prepareContext()`              | Beide erforderlich                                                 |
| **Actions**             | Static Methods, `(event, target)` signature            | Private static methods: `static #onRollAction(event, target)`      |
| **Event Delegation**    | `data-action` (nicht CSS-Klassen)                      | Template: `data-action="roll"`, `data-action="previewClick"`       |
| **Form Tag**            | ApplicationV2 wrappt, keine nested `<form>`            | Template: `<section>` statt `<form>`                               |
| **jQuery**              | V13 = DOM Elements, kein jQuery                        | Vollständiger Austausch: `querySelector`, `addEventListener`, etc. |
| **html Parameter**      | Nicht mehr verfügbar in V2                             | `this.element` verwenden                                           |
| **Buttons (Dialog V1)** | Gibt es in ApplicationV2 nicht                         | ❌ Entfernen, ✅ Buttons im Template mit `data-action`             |
| **Live-Updates**        | Listener in `_onRender()`, nicht `activateListeners()` | Input/Select-Listener in `_onRender()`, nicht in actions           |

---

## 📚 Referenzen

- **ApplicationV2 API:** https://foundryvtt.com/api/classes/foundry.applications.api.ApplicationV2.html
- **HandlebarsApplication API:** https://foundryvtt.com/api/classes/foundry.HandlebarsApplication.html
- **HandlebarsApplicationMixin:** https://foundryvtt.com/api/functions/foundry.applications.api.HandlebarsApplicationMixin.html
- **CombatDialog Migration Plan:** `MIGRATION_PLAN_COMBATDIALOG.md`
- **Foundry VTT Conversion Guide:** https://foundryvtt.wiki/en/development/guides/applicationV2-conversion-guide

---

## 🔐 API-Konformität

✅ Alle Anforderungen basieren auf offizieller Foundry VTT ApplicationV2 API  
✅ Keine Spekulation oder privater API-Nutzung  
✅ State-Management nach ApplicationV2-Standard  
✅ Event-Handling via Actions + `_onRender()`  
✅ Live-Updates bleiben funktional (Input-Listener in `_onRender()`)

---

**Geschätzte Implementierungszeit: 9 Stunden**

**Status:** Ready for Implementation
