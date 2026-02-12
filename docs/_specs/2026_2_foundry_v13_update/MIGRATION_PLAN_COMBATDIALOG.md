# 📋 Migration-Plan: CombatDialog Familie → ApplicationV2

**Basis: Foundry VTT ApplicationV2 API + Conversion Guide**
**Datum: 12. Februar 2026**

---

## 🎯 Scope

- ✅ **CombatDialog** (Basis-Klasse)
- ✅ **AngriffDialog** (erbt CombatDialog)
- ✅ **FernkampfAngriffDialog** (erbt CombatDialog)
- ✅ **UebernatuerlichDialog** (erbt CombatDialog)
- ⏸️ FertigkeitDialog, NahkampfDialog, TargetSelectionDialog → Später
- ❌ Keine Testing-Änderungen
- ❌ Keine Backwards Compatibility

---

## 🔄 Struktur-Übersicht (API-konform)

### Aktuell (V1):

```javascript
export class CombatDialog extends Dialog {
  constructor(actor, item, dialogData, options) {
    super(dialogData, options)
    this.actor = actor
    this.item = item
    // ... State
  }

  async getData() { ... }
  activateListeners(html) { ... }
  _angreifenKlick(html) { ... }
}
```

### Nach Migration (V2):

```javascript
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class CombatDialog extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: 'form',  // ← Nur wenn form submission nötig
    form: { handler: CombatDialog.#onSubmit, closeOnSubmit: false },
    classes: ['ilaris', 'combat-dialog'],
    position: { width: 900, height: 'auto' },
    window: { title: 'Kampf' }
  }

  static PARTS = {
    form: { template: 'systems/Ilaris/templates/sheets/dialogs/angriff.hbs' }
  }

  static DEFAULT_OPTIONS = {
    actions: {
      angreifen: this.#onAngreifen,
      verteidigen: this.#onVerteidigen,
      schaden: this.#onSchaden
    }
  }

  constructor(actor, item, options = {}) {
    super(options)
    this.actor = actor
    this.item = item
  }

  async _prepareContext(options) { ... }
  static #onAngreifen(event, target) { ... }
}
```

---

## 📝 Konkrete Migrations-Schritte pro Datei

### 1. combat_dialog.js

| Schritt                 | V1                                                                           | V2                                                                 | Notizen                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| **Erbe**                | `extends Dialog`                                                             | `extends HandlebarsApplicationMixin(ApplicationV2)`                | Import: `const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api` |
| **defaultOptions()**    | `static get defaultOptions() { return foundry.utils.mergeObject(...) }`      | `static DEFAULT_OPTIONS = { ... }`                                 | Object Literal statt Getter                                                              |
| **Template**            | `template: 'path...'` in getter                                              | `static PARTS = { form: { template: 'path...' } }`                 | Part-basiert                                                                             |
| **Form Tag**            | N/A im Dialog                                                                | `tag: 'form'` in DEFAULT_OPTIONS                                   | Nur wenn form-submission nötig                                                           |
| **getData()**           | `async getData()`                                                            | `async _prepareContext(options)` + `await super._prepareContext()` | Async + super-call                                                                       |
| **Constructor**         | `constructor(actor, item, dialogData, options)` `super(dialogData, options)` | `constructor(actor, item, options = {})` `super(options)`          | Nur ein options-obj                                                                      |
| **activateListeners()** | `activateListeners(html)` mit `html.find()`                                  | Entfernen! → Actions in DEFAULT_OPTIONS + static methods           | Event-Delegation                                                                         |
| **HTML Events**         | `<button class="angreifen">`                                                 | `<button data-action="angreifen">`                                 | data-action Attribut                                                                     |
| **jQuery**              | `html.find()`, `html.addClass()`, `html.html()`                              | `html.querySelector()`, `html.classList.add()`, `html.innerHTML`   | DOM API statt jQuery                                                                     |
| **Event Handler**       | `html.find().click(ev => this._angreifenKlick(html))`                        | `static #onAngreifen(event, target) { }` in actions                | Static private method + (event, target)                                                  |

#### Code-Template:

```javascript
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class CombatDialog extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        classes: ['ilaris', 'combat-dialog'],
        tag: 'form',
        form: {
            handler: CombatDialog.#onSubmitForm,
            closeOnSubmit: false,
            submitOnChange: false,
        },
        position: { width: 900, height: 'auto' },
        window: { resizable: true },
    }

    static PARTS = {
        form: { template: 'systems/Ilaris/templates/sheets/dialogs/angriff.hbs' },
    }

    static DEFAULT_OPTIONS = {
        ...CombatDialog.DEFAULT_OPTIONS,
        actions: {
            angreifen: this.#onAngreifenClick,
            verteidigen: this.#onVerteidigenClick,
            schaden: this.#onSchadenClick,
            manoeverSelect: this.#onManoeverSelect,
        },
    }

    constructor(actor, item, options = {}) {
        super(options)
        this.actor = actor
        this.item = item
        this._initializeState()
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        context.actor = this.actor
        context.item = this.item
        context.config = CONFIG.ILARIS
        context.mod_at = this.mod_at || 0
        // ... weitere context properties
        return context
    }

    // Static action handlers
    static #onAngreifenClick(event, target) {
        event.preventDefault()
        this._angreifenKlick()
    }

    // Instance methods (existierende Logik behalten)
    async _angreifenKlick() {
        // ... bestehende Implementierung
    }

    // Form submission (wenn nötig)
    static async #onSubmitForm(event, form, formData) {
        event.preventDefault()
        // Nur wenn echte Form-Submission nötig ist
    }
}
```

### 2. angriff.js, fernkampf_angriff.js, uebernatuerlich.js

**Übernehmen gleiches Pattern wie CombatDialog:**

```javascript
export class AngriffDialog extends CombatDialog {
    static DEFAULT_OPTIONS = {
        ...super.DEFAULT_OPTIONS,
        position: { width: 900, height: 'auto' },
        window: { title: 'Kampf' },
        actions: {
            ...super.DEFAULT_OPTIONS.actions,
            // Zusätzliche Actions wenn nötig
        },
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        context.isDefenseMode = this.isDefenseMode
        context.attackingActor = this.attackingActor
        return context
    }
}
```

---

## ✅ Template-Änderungen

**Alle .hbs Dateien:**

1. **Form-Tag prüfen:** `<form>` → `<section>` (da outer ist `<form>`)
2. **data-action hinzufügen:** `class="angreifen"` → `data-action="angreifen"`
3. **jQuery-Classes entfernen:** `.angreifen`, `.verteidigen` bleiben nur für CSS

#### Beispiel angriff.hbs:

```handlebars
<!-- FALSCH (Nested Form) -->
<form class='angriff-dialog'>
    <button class='angreifen'>Angriff</button>
</form>

<!-- KORREKT (ApplicationV2 wraps mit form) -->
<section class='angriff-dialog'>
    <button data-action='angreifen'>Angriff</button>
</section>
```

---

## 🧵 State-Handling (Zitterness)

**Aktuell:** Dialog-State in Instance-Properties (`this.mod_at`, etc.)

**Nach Migration:** Gleich!

- State bleibt auf Instance
- `_prepareContext()` gibt State an Template
- Template erhält State bei jedem Rendern
- Vorteil: Einfach zu verstehen, kein Extra-Speicher nötig

```javascript
// State bleibt so:
this.mod_at = 0
this.selectedActors = []

// In _prepareContext einfach exposieren:
context.mod_at = this.mod_at
context.selectedActors = this.selectedActors
```

---

## 🔧 Hooks & Kommunikation (unverändert)

```javascript
// Alte Hooks bleiben gleich:
Hooks.call('Ilaris.fernkampfAngriffClick', rollResult, actor, item)

// Defense-Button-Hook bleibt:
Hooks.on('renderChatMessageHTML', (message, htmlDOM) => { ... })
```

---

## 📋 Implementation Roadmap

```
SCHRITT 1: CombatDialog Kern-Migration (1-2 Tage)
├── Class-Definition + DEFAULT_OPTIONS
├── PARTS Definition
├── _prepareContext() implementieren
├── Constructor anpassen
└── Actions statt activateListeners

SCHRITT 2: SubKlassen (AngriffDialog, etc.) (1 Tag)
├── Pro Klasse: DEFAULT_OPTIONS erben + überschreiben
├── _prepareContext() für eigene Context-Daten
└── Keine activateListeners() mehr

SCHRITT 3: Templates (1 Tag)
├── Form-Tags: <form> → <section>
├── Buttons: class="" → data-action=""
├── HTML-Struktur validieren
└── Keine nested forms!

SCHRITT 4: jQuery → DOM API (1 Tag)
├── activateListeners() Logik → Static Actions
├── html.find() → html.querySelector()
├── html.html() → html.innerHTML
├── html.addClass() → html.classList.add()

SCHRITT 5: Validierung (0.5 Tage)
├── Dialog öffnen & Würfeln
├── Hooks.call() funktioniert
├── Defense-Buttons funktionieren
└── Modifizierer aktualisieren

GESAMT: ~5.5 Tage
```

---

## 🚨 Kritische Punkte (nach API)

| Punkt                | API-Anforderung                                  | Lösung                                        |
| -------------------- | ------------------------------------------------ | --------------------------------------------- |
| **Erbe**             | Muss `ApplicationV2` erben                       | `HandlebarsApplicationMixin(ApplicationV2)`   |
| **Form Tag**         | Wenn Form-Submission: `tag: 'form'` erforderlich | Hier wahrscheinlich nicht nötig - nur Actions |
| **HTML in form**     | Keine `<form>` Tags im Template                  | `<section>` verwenden                         |
| **\_prepareContext** | `async` + `await super._prepareContext()`        | Beide notwendig                               |
| **Actions**          | Static Methods, `(event, target)` signature      | Nicht `(event, html)` wie V1!                 |
| **jQuery**           | V13 = DOM Elements, kein jQuery                  | Vollständiger Austausch nötig                 |
| **Events**           | `data-action` (nicht CSS-Klassen)                | Match mit `actions` Object Keys               |

---

## ✅ Checkliste pro Datei

### combat_dialog.js

- [ ] Import: `const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api`
- [ ] Class-Definition: `extends HandlebarsApplicationMixin(ApplicationV2)`
- [ ] `static DEFAULT_OPTIONS = { ... }` (Object, nicht Getter)
- [ ] `static PARTS = { form: { template: '...' } }`
- [ ] `static DEFAULT_OPTIONS.actions = { ... }` (oder in erster DEFAULT_OPTIONS)
- [ ] `constructor(actor, item, options = {})` mit `super(options)`
- [ ] `async _prepareContext(options)` mit `await super._prepareContext(options)`
- [ ] `activateListeners()` entfernen
- [ ] State-Initialisierung anpassen
- [ ] Alle Event-Handler zu Static Methods mit `#` umschreiben
- [ ] Event-Handler `(event, target)` Signature verwenden

### angriff.js

- [ ] `static DEFAULT_OPTIONS` mit Spread von super
- [ ] `async _prepareContext()` mit eigenen Properties
- [ ] Keine neuen `activateListeners()`
- [ ] Sub-spezifische Actions hinzufügen falls nötig

### fernkampf_angriff.js

- [ ] Gleiches wie angriff.js

### uebernatuerlich.js

- [ ] Gleiches wie angriff.js
- [ ] Energie-System State in `_prepareContext()` exposieren

### angriff.hbs

- [ ] Root-Element: `<section>` statt `<form>`
- [ ] Alle Event-Buttons: `data-action="..."` hinzufügen
- [ ] Keine `<form>` Tags im Template

### fernkampf_angriff.hbs

- [ ] Root-Element: `<section>` statt `<form>`
- [ ] Alle Event-Buttons: `data-action="..."` hinzufügen
- [ ] Keine `<form>` Tags im Template

### uebernatuerlich.hbs

- [ ] Root-Element: `<section>` statt `<form>`
- [ ] Alle Event-Buttons: `data-action="..."` hinzufügen
- [ ] Keine `<form>` Tags im Template

---

## 📚 Referenzen (Foundry VTT API)

- **ApplicationV2:** https://foundryvtt.com/api/classes/foundry.applications.api.ApplicationV2.html
- **HandlebarsApplicationMixin:** Mixin für Template-Unterstützung
- **Conversion Guide:** https://foundryvtt.wiki/en/development/guides/applicationV2-conversion-guide
- **Form Configuration:** Tag, handler, submitOnChange, closeOnSubmit
- **Actions:** Static Methods, data-action Attributes, (event, target) Signature
- **\_prepareContext:** Async Method, super-call erforderlich

---

## 🔐 API-Konformität

✅ Alle Anforderungen basieren auf offizieller Foundry VTT ApplicationV2 API  
✅ Keine Spekulation oder privater API-Nutzung  
✅ Hook-Integration unverändert (Public API)  
✅ State-Management nach ApplicationV2-Standard

---

**Plan: Ready for Implementation**
