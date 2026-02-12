# Migration Requirements - ApplicationV2

**Projekt:** Ilaris FVTT System v12 → v13 (ApplicationV2)  
**Status:** Requirements Definition  
**Datum:** 2026-02-08

---

## 📋 Struktur der Requirements

Requirements sind in 5 Kategorien eingeteilt:

- **MUST** (🔴 Kritisch) - Nicht optional, Blockers
- **SHOULD** (🟡 Wichtig) - Sollte implementiert werden
- **COULD** (🟢 Optional) - Kann implementiert werden
- **MUST NOT** (🔴 Forbidden) - Unbedingt vermeiden
- **Cross-File** (🔵) - Betrifft mehrere Dateien

---

## 🔴 MUST - Kritische Requirements

### Base Class Migration

#### REQ-BASE-001: Class Declaration Konvertierung

- **File:** `scripts/sheets/actor.js`
- **Status:** MUST
- **Beschreibung:** Die `IlarisActorSheet` Klasse muss von `ActorSheet` auf `HandlebarsApplicationMixin(ActorSheetV2)` migriert werden
- **Akzeptanzkriterien:**
    - [ ] Import der neuen API: `const { HandlebarsApplicationMixin, ActorSheetV2 } = foundry.applications.api`
    - [ ] Keine Vererbung von `ActorSheet` mehr
    - [ ] Mixin korrekt angewendet
    - [ ] Klasse wird geladen ohne Fehler
- **Test-Case:**
    ```javascript
    const sheet = new IlarisActorSheet({ actor: testActor })
    expect(sheet instanceof ActorSheetV2).toBe(true)
    ```

#### REQ-BASE-002: DEFAULT_OPTIONS Static Property

- **File:** `scripts/sheets/actor.js`
- **Status:** MUST
- **Beschreibung:** Die `defaultOptions()` Getter-Methode muss in ein `static DEFAULT_OPTIONS` Objekt konvertiert werden
- **Akzeptanzkriterien:**
    - [ ] Keine `static get defaultOptions()` Methode mehr
    - [ ] Neues `static DEFAULT_OPTIONS = {}` Objekt vorhanden
    - [ ] Struktur folgt AppV2 Format (nicht `mergeObject` nötig)
    - [ ] Window-Konfiguration in `window` Objekt
    - [ ] Position-Konfiguration in `position` Objekt
    - [ ] Form-Handling in `form` Objekt mit `handler`, `submitOnChange`, `closeOnSubmit`
    - [ ] Actions in `actions` Objekt
- **Details der Felder:**
    ```javascript
    static DEFAULT_OPTIONS = {
        window: {
            icon: "fa-solid fa-scroll",
            title: "ILARIS.sheet.label",
            controls: [/* buttons */]
        },
        position: { width: 850, height: 750 },
        tag: "form",
        form: {
            handler: ClassName.#onSubmitForm,
            submitOnChange: false,
            closeOnSubmit: false
        },
        actions: { /* action methods */ }
    }
    ```

#### REQ-BASE-003: PARTS Static Property Hinzufügen

- **File:** `scripts/sheets/actor.js`
- **Status:** MUST
- **Beschreibung:** Ein `static PARTS` Objekt für Template-Teile definieren
- **Akzeptanzkriterien:**
    - [ ] PARTS Objekt vorhanden (minimal mit einem `form` Part)
    - [ ] Jeder Part hat `template` Property
    - [ ] Template-Pfade sind korrekt
    - [ ] Keine Template-Duplikate in PARTS
- **Minimal-Beispiel:**
    ```javascript
    static PARTS = {
        form: { template: "systems/Ilaris/templates/sheets/helden.hbs" }
    }
    ```

---

### Context & Data Preparation

#### REQ-CONTEXT-001: getData() → \_prepareContext()

- **File:** `scripts/sheets/actor.js`, `scripts/sheets/helden.js`, `scripts/sheets/kreatur.js`
- **Status:** MUST
- **Beschreibung:** Alle `getData()` Methoden müssen in `_prepareContext()` konvertiert werden
- **Akzeptanzkriterien:**
    - [ ] `getData()` Methode existiert nicht mehr
    - [ ] `_prepareContext(options)` Methode vorhanden
    - [ ] Methode ist `async`
    - [ ] Ruft `await super._prepareContext(options)` auf, falls Parent-Kontext nötig
    - [ ] Alle notwendigen Context-Eigenschaften werden gesetzt
    - [ ] Text-Enrichment weiterhin in dieser Methode
    - [ ] Keine `console.log()` Debug-Statements
- **Beispiel-Transformation:**

    ```javascript
    // ALT:
    async getData() {
        const context = super.getData()
        context.enrichedBiography = await TextEditor.enrichHTML(...)
        return context
    }

    // NEU:
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        context.enrichedBiography = await TextEditor.enrichHTML(...)
        return context
    }
    ```

#### REQ-CONTEXT-002: Actor Reference in Context

- **File:** `scripts/sheets/actor.js`, `scripts/sheets/helden.js`, `scripts/sheets/kreatur.js`
- **Status:** MUST
- **Beschreibung:** Der Actor/Document muss explizit in den Context aufgenommen werden
- **Akzeptanzkriterien:**
    - [ ] In `_prepareContext()` wird `context.actor = this.actor` gesetzt (für ActorSheetV2)
    - [ ] Alle Daten werden von `this.actor` gelesen
    - [ ] Keine direkten `this.data` Zugriffe mehr
- **Beispiel:**
    ```javascript
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        context.actor = this.actor
        context.effects = this.actor.appliedEffects
        return context
    }
    ```

#### REQ-CONTEXT-003: Config Variablen in Context

- **File:** `scripts/sheets/actor.js`, `scripts/sheets/helden.js`, `scripts/sheets/kreatur.js`
- **Status:** MUST
- **Beschreibung:** CONFIG und Settings müssen in Context verfügbar sein
- **Akzeptanzkriterien:**
    - [ ] `CONFIG.ILARIS` wird in `_prepareContext()` hinzugefügt
    - [ ] Game Settings werden in `_prepareContext()` aufgelöst
    - [ ] Keine dynamischen CONFIG-Zugriffe in Templates
- **Beispiel:**
    ```javascript
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        context.config = CONFIG.ILARIS
        context.isWeaponSpaceRequirementActive = game.settings.get(...)
        return context
    }
    ```

---

### Event Handling & Actions

#### REQ-EVENTS-001: activateListeners() → \_onRender()

- **File:** `scripts/sheets/actor.js`, `scripts/sheets/helden.js`, `scripts/sheets/kreatur.js`
- **Status:** MUST
- **Beschreibung:** Die `activateListeners()` Methode muss in `_onRender()` konvertiert werden
- **Akzeptanzkriterien:**
    - [ ] `activateListeners()` Methode wird entfernt
    - [ ] `_onRender(context, options)` Methode existiert
    - [ ] Ruft `super._onRender(context, options)` auf
    - [ ] Click-Events sind nicht in `_onRender()` - via Actions stattdessen
    - [ ] Non-click Event Listener (input, change, etc.) werden hier registriert
    - [ ] Keine jQuery selectors mehr
    - [ ] Element-Zugriff via `this.element.querySelector()` oder `.querySelectorAll()`
- **Erlaubte Listener in \_onRender():**
    - ✅ `addEventListener('input', ...)`
    - ✅ `addEventListener('change', ...)`
    - ✅ `addEventListener('dragstart', ...)`
    - ✅ `addEventListener('submit', ...)`
- **Nicht erlaubte in \_onRender():**
    - ❌ `addEventListener('click', ...)` → muss Action sein
- **Beispiel:**

    ```javascript
    _onRender(context, options) {
        super._onRender(context, options)

        const woundsInput = this.element.querySelector('input[name="system.gesundheit.wunden"]')
        if (woundsInput) {
            woundsInput.addEventListener('input', (ev) => this._onHealthValueChange(ev))
        }
    }
    ```

#### REQ-EVENTS-002: Click-Events → Actions System

- **File:** `scripts/sheets/actor.js`, `scripts/sheets/helden.js`, `scripts/sheets/kreatur.js`
- **Status:** MUST
- **Beschreibung:** Alle Click-Event Listener müssen in das Actions-System konvertiert werden
- **Akzeptanzkriterien:**
    - [ ] Alle Click-Handler sind `static` Methoden
    - [ ] Actions sind im `DEFAULT_OPTIONS.actions` registriert
    - [ ] Action-Namen folgen Namenskonvention (camelCase, z.B. `toggleBool`, `onRollable`)
    - [ ] Alle Action-Methoden haben Signature: `static methodName(event, target)`
    - [ ] HTML Elements haben `data-action="actionName"` Attribute
    - [ ] Action-Handler greifen auf `this` zu (verweist auf Application-Instanz)
- **Kritische Actions in actor.js:**
    - `ausklappView` (ehemals `.ausklappen-trigger` click)
    - `rollable` (ehemals `.rollable` click)
    - `clickable` (ehemals `.clickable` click)
    - `itemCreate` (ehemals `.item-create` click)
    - `itemEdit` (ehemals `.item-edit` click)
    - `itemDelete` (ehemals `.item-delete` click)
    - `toggleItem` (ehemals `.item-toggle` click)
    - `toggleBool` (ehemals `.toggle-bool` click)
    - `syncItems` (ehemals `.sync-items` click)
- **Beispiel-Transformation:**

    ```javascript
    // ALT:
    activateListeners(html) {
        html.find('.ausklappen-trigger').click((ev) => this._ausklappView(ev))
    }
    _ausklappView(event) {
        const targetkey = $(event.currentTarget).data('ausklappentarget')
        // ...
    }

    // NEU:
    static DEFAULT_OPTIONS = {
        actions: { ausklappView: IlarisActorSheet.ausklappView }
    }
    static ausklappView(event, target) {
        const targetkey = target.dataset.ausklappentarget
        // ...
    }

    // Im Template:
    <button data-action="ausklappView" data-ausklappentarget="aspzugekauft">
        Open
    </button>
    ```

#### REQ-EVENTS-003: jQuery entfernen

- **File:** `scripts/sheets/actor.js`, `scripts/sheets/helden.js`, `scripts/sheets/kreatur.js`
- **Status:** MUST NOT (jQuery-Code)
- **Beschreibung:** Kein jQuery in Action/Event-Methoden verwenden
- **Akzeptanzkriterien:**
    - [ ] Keine `html.find()` Aufrufe
    - [ ] Keine `$(selector).on()` oder `.click()` Aufrufe
    - [ ] Keine `$()` Wrapper
    - [ ] Keine `.addClass()`, `.removeClass()`, `.toggleClass()` von jQuery
    - [ ] Native DOM Methoden verwenden:
        - `element.querySelector()` statt `$('.selector')`
        - `element.classList.add()` statt `$(el).addClass()`
        - `element.addEventListener()` statt `$(el).on()`
        - `element.setAttribute()` statt `$(el).attr()`
- **Exceptions:**
    - Wenn jQuery WIRKLICH nötig: `const html = $(this.element)` - aber nur in speziellen Fällen

#### REQ-EVENTS-004: Event Handler Binding

- **File:** `scripts/sheets/actor.js`, `scripts/sheets/helden.js`, `scripts/sheets/kreatur.js`
- **Status:** MUST
- **Beschreibung:** Event Handler müssen korrekt mit `this` Context binden
- **Akzeptanzkriterien:**
    - [ ] Arrow-Funktionen in `addEventListener()` verwenden für korrektes `this`
    - [ ] `.bind(this)` für normale Funktionen verwenden
    - [ ] Keine ungebundenen Funktionen
- **Beispiel:**

    ```javascript
    // ✅ KORREKT:
    input.addEventListener('input', (ev) => this._onHealthValueChange(ev))
    input.addEventListener('input', this._onHealthValueChange.bind(this))

    // ❌ FALSCH:
    input.addEventListener('input', this._onHealthValueChange)
    ```

---

### Form Handling

#### REQ-FORM-001: Form Submission Handler

- **File:** `scripts/sheets/actor.js`, `scripts/sheets/helden.js`, `scripts/sheets/kreatur.js`
- **Status:** MUST
- **Beschreibung:** Die `_updateObject()` Methode muss in einen Form Handler konvertiert werden
- **Akzeptanzkriterien:**
    - [ ] Keine `_updateObject()` Methode existiert
    - [ ] Form Handler ist `static` Methode mit Private-Syntax (#)
    - [ ] Handler referenziert in `DEFAULT_OPTIONS.form.handler`
    - [ ] Signatur: `static async #onSubmitForm(event, form, formData)`
    - [ ] Verwendet `formData.object` oder `foundry.utils.expandObject(formData.object)`
    - [ ] Ruft `this.document.update()` oder `this.actor.update()` auf
    - [ ] Tag ist `"form"` in DEFAULT_OPTIONS
- **Beispiel:**

    ```javascript
    static DEFAULT_OPTIONS = {
        tag: "form",
        form: {
            handler: IlarisActorSheet.#onSubmitForm,
            submitOnChange: false,
            closeOnSubmit: false
        }
    }

    static async #onSubmitForm(event, form, formData) {
        const updateData = foundry.utils.expandObject(formData.object)
        await this.actor.update(updateData)
    }
    ```

#### REQ-FORM-002: Form Tag in HTML

- **File:** Templates `helden.hbs`, `kreatur.hbs`
- **Status:** MUST
- **Beschreibung:** Root Element muss `<form>` sein für Form Handling
- **Akzeptanzkriterien:**
    - [ ] Outer Element ist `<form class="...">` nicht `<div>`
    - [ ] `autocomplete="off"` Attribute vorhanden
    - [ ] Nur EINE Form im Template (nicht verschachtelt)
    - [ ] Input Fields haben `name="system.path.to.field"` Attribute
    - [ ] Submit Button kann hinzugefügt werden oder via generic form-footer.hbs

---

### Tabs System

#### REQ-TABS-001: Tab PARTS Struktur

- **File:** `scripts/sheets/helden.js`, `scripts/sheets/kreatur.js`
- **Status:** MUST
- **Beschreibung:** Tab-System muss neu strukturiert werden mit PARTS
- **Akzeptanzkriterien:**
    - [ ] Jeder Tab hat einen eigenen PART
    - [ ] PARTS Namen entsprechen Tab-IDs
    - [ ] Header/Navigation ist separater PART
    - [ ] Tab-Content ist nur der Inhalt, nicht Navigation
- **Beispiel für helden.js:**
    ```javascript
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

#### REQ-TABS-002: Tab Navigation in \_prepareContext()

- **File:** `scripts/sheets/helden.js`, `scripts/sheets/kreatur.js`
- **Status:** MUST
- **Beschreibung:** Tab-Informationen müssen in \_prepareContext() vorbereitet werden
- **Akzeptanzkriterien:**
    - [ ] `context.tabs` Objekt enthält alle Tabs
    - [ ] Jeder Tab hat `id`, `group`, `label`, `active`, `icon`, `cssClass`
    - [ ] Labels sind Localization Keys (z.B. "ILARIS.tabs.kampf")
    - [ ] `active` ist nur für einen Tab true
    - [ ] `cssClass` ist "active" oder ""
- **Beispiel:**

    ```javascript
    async _prepareContext(options) {
        const context = await super._prepareContext(options)
        const activeTab = this.tabGroups.primary || "kampf"

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
                label: "ILARIS.tabs.inventar",
                active: activeTab === "inventar",
                cssClass: activeTab === "inventar" ? "active" : ""
            },
            // ...
        }
        return context
    }
    ```

#### REQ-TABS-003: Tab Change Action

- **File:** `scripts/sheets/helden.js`, `scripts/sheets/kreatur.js`
- **Status:** MUST
- **Beschreibung:** Tab-Wechsel muss via Action realisiert sein
- **Akzeptanzkriterien:**
    - [ ] `changeTab` Action registriert
    - [ ] Action speichert Tab-ID in `this.tabGroups`
    - [ ] Action rendert nur die neuen Tab-PARTS (oder alle)
    - [ ] Klasse `.active` wird korrekt gesetzt
- **Beispiel:**

    ```javascript
    static DEFAULT_OPTIONS = {
        actions: {
            changeTab: HeldenSheet.changeTab
        }
    }

    static changeTab(event, target) {
        const tab = target.dataset.tab
        const group = target.dataset.group || "primary"
        this.tabGroups[group] = tab
        // this.render() - komplett rendern oder nur Tab-PARTS?
        return this.render()
    }
    ```

---

### Template Files

#### REQ-TEMPLATE-001: Template in PARTS aufteilen

- **File:** `templates/sheets/helden.hbs`, `templates/sheets/kreatur.hbs`
- **Status:** MUST
- **Beschreibung:** Monolithische Templates müssen in PARTS-Struktur aufgeteilt werden
- **Akzeptanzkriterien:**
    - [ ] Separate Header-Datei erstellt
    - [ ] Separate Tab-Navigation-Datei erstellt
    - [ ] Separate Dateien für jeden Tab-Content
    - [ ] Alle Teile werden referenziert in PARTS Objekt
    - [ ] Keine Duplikation von Content
    - [ ] Jeder Part hat nur EINEN root Element
    - [ ] Partials (z.B. `{{> path/to/partial}}`) weiterhin funktional

#### REQ-TEMPLATE-002: Form Tag Struktur

- **File:** `templates/sheets/helden.hbs`, `templates/sheets/kreatur.hbs`
- **Status:** MUST
- **Beschreibung:** Root Tag muss `<form>` sein, nicht `<div>`
- **Akzeptanzkriterien:**
    - [ ] `<form class="herosheet" autocomplete="off">` ist root Element
    - [ ] Innere `<div>` tags können bleiben
    - [ ] `name="system.path"` Attribute auf Inputs

#### REQ-TEMPLATE-003: Keine jQuery Selektoren in Templates

- **File:** Templates
- **Status:** MUST NOT
- **Beschreibung:** Templates dürfen keine jQuery-Abhängigkeiten haben
- **Akzeptanzkriterien:**
    - [ ] Keine `data-toggle`, `data-trigger` die jQuery erfordern
    - [ ] Alle Interaktionen via `data-action` oder normales HTML
    - [ ] Keine Inline-Skripte mit jQuery

#### REQ-TEMPLATE-004: data-action Attribute

- **File:** Templates
- **Status:** MUST
- **Beschreibung:** Click-basierte Elemente müssen `data-action` Attribute haben
- **Akzeptanzkriterien:**
    - [ ] Alle Buttons/Links haben `data-action="actionName"`
    - [ ] Keine `class="clickable"` reliance für Clicks
    - [ ] Action-Namen folgen camelCase Konvention
    - [ ] Zusätzliche Daten in `data-*` Attributes speichern
- **Beispiel:**

    ```handlebars
    <!-- ALT: -->
    <button class='item-create' data-itemclass='waffe'>Waffe</button>

    <!-- NEU: -->
    <button data-action='itemCreate' data-item-class='waffe'>Waffe</button>
    ```

#### REQ-TEMPLATE-005: TextEditor Helpers

- **File:** Templates
- **Status:** MUST
- **Beschreibung:** Text Enrichment muss korrekt im Template angewendet werden
- **Akzeptanzkriterien:**
    - [ ] Enriched Text wird mit triple-braces `{{{enrichedBiography}}}` gerendert
    - [ ] Editor Helper wird korrekt verwendet: `{{editor enrichedDescription target="system.description" editable=editable}}`
    - [ ] Keine HTML-Escape Probleme

---

## 🟡 SHOULD - Wichtige Requirements

### Performance & Optimization

#### REQ-PERF-001: Partial Rendering nutzen

- **File:** `scripts/sheets/helden.js`, `scripts/sheets/kreatur.js`
- **Status:** SHOULD (nice-to-have, aber empfohlen)
- **Beschreibung:** Tab-Wechsel sollte nur das Tab-PART rendern, nicht alles
- **Akzeptanzkriterien:**
    - [ ] Tab-Wechsel rendert nur den neuen Tab (mit `parts: ['tabs', 'tabName']`)
    - [ ] Große Listen (Items, Zauber) werden nur geladen wenn nötig
    - [ ] Performance-Tests zeigen Verbesserung
- **Beispiel:**
    ```javascript
    static changeTab(event, target) {
        const tab = target.dataset.tab
        this.tabGroups.primary = tab
        return this.render({
            parts: ["tabs", tab]
        })
    }
    ```

#### REQ-PERF-002: SearchFilter für Item-Listen

- **File:** `scripts/sheets/helden.js`, `scripts/sheets/kreatur.js`
- **Status:** SHOULD (wenn vorhanden, dann korrekt)
- **Beschreibung:** Such-Filterung sollte AppV2-kompatibel sein
- **Akzeptanzkriterien:**
    - [ ] SearchFilter wird im Konstruktor initialisiert (falls vorhanden)
    - [ ] Binding in `_onRender()`
    - [ ] Callback hat korrekte Signatur

---

### Documentation & Comments

#### REQ-DOC-001: JSDoc für alle Public Methods

- **File:** `scripts/sheets/actor.js`, `scripts/sheets/helden.js`, `scripts/sheets/kreatur.js`
- **Status:** SHOULD
- **Beschreibung:** Alle öffentlichen Methoden sollen JSDoc haben
- **Akzeptanzkriterien:**
    - [ ] Jede Action hat JSDoc mit `@param` und `@returns`
    - [ ] `_prepareContext()` ist dokumentiert
    - [ ] `_onRender()` ist dokumentiert
    - [ ] Komplexe Logik hat Inline-Kommentare

#### REQ-DOC-002: Migration Notes

- **File:** Migration-Dokument
- **Status:** SHOULD
- **Beschreibung:** Migration-Schritte dokumentieren
- **Akzeptanzkriterien:**
    - [ ] Jede Breaking Change ist dokumentiert
    - [ ] Vorher-Nachher Beispiele vorhanden
    - [ ] Potential Pitfalls erwähnt

---

### Testing

#### REQ-TEST-001: Unit Tests für Actions

- **File:** Test-Dateien (neu)
- **Status:** SHOULD
- **Beschreibung:** Actions sollten getestet werden
- **Akzeptanzkriterien:**
    - [ ] Mindestens Tests für kritische Actions (toggleBool, itemCreate, etc.)
    - [ ] Mocks für Actor/Document Updates
    - [ ] Tests validieren Context-Änderungen

#### REQ-TEST-002: Integration Tests

- **File:** Test-Dateien (neu)
- **Status:** SHOULD
- **Beschreibung:** Sheet-Funktionalität sollte getestet werden
- **Akzeptanzkriterien:**
    - [ ] Tab-Wechsel funktioniert
    - [ ] Form-Submission funktioniert
    - [ ] Dialoge/Prompts funktionieren
    - [ ] DragDrop funktioniert

---

## 🟢 COULD - Optionale Requirements

#### REQ-OPT-001: Datepicker/Colorpicker Input Types

- **File:** Templates
- **Status:** COULD (wenn erwünscht)
- **Beschreibung:** Modern HTML5 Input Types statt Custom Solutions
- **Akzeptanzkriterien:**
    - [ ] Farb-Felder: `<input type="color">`
    - [ ] Datum-Felder: `<input type="date">`

#### REQ-OPT-002: Keyboard Shortcuts für Actions

- **File:** `scripts/sheets/actor.js`
- **Status:** COULD
- **Beschreibung:** Tastaturgänge für häufige Actions
- **Akzeptanzkriterien:**
    - [ ] `Ctrl+S` speichert Sheet
    - [ ] `Escape` schließt Sheet (optional)

#### REQ-OPT-003: LocalStorage für UI State

- **File:** `scripts/sheets/helden.js`
- **Status:** COULD
- **Beschreibung:** Tab-Position speichern über Sessions
- **Akzeptanzkriterien:**
    - [ ] Aktiver Tab wird gespeichert
    - [ ] Beim Öffnen wird Tab wiederhergestellt

---

## 🔴 MUST NOT - Verbotene Praktiken

#### REQ-AVOID-001: Kein jQuery in neue Methoden

- **Status:** MUST NOT
- **Beschreibung:** jQuery sollte NICHT in neuen/migrierten Methoden verwendet werden
- **Ausnahmen:** Legacy-Dialoge von Foundry V1, die jQuery verwenden

#### REQ-AVOID-002: Keine `static get defaultOptions()`

- **Status:** MUST NOT
- **Beschreibung:** Das alte Getter-Pattern darf NICHT verwendet werden
- **Nur:** `static DEFAULT_OPTIONS = {}`

#### REQ-AVOID-003: Keine `activateListeners()`

- **Status:** MUST NOT
- **Beschreibung:** Gibt es nur in V1 Applications
- **Verwende:** `_onRender()` stattdessen

#### REQ-AVOID-004: Keine `getData()`

- **Status:** MUST NOT
- **Beschreibung:** Gibt es nur in V1 Applications
- **Verwende:** `_prepareContext()` stattdessen

#### REQ-AVOID-005: Kein HTML-Rohbau in activateListeners

- **Status:** MUST NOT
- **Beschreibung:** DOM-Manipulation sollte nicht auf ad-hoc Basis passieren
- **Verwende:** Templates + Actions + \_onRender() für komplexe Listener

#### REQ-AVOID-006: Keine `scrollY` Konfiguration

- **Status:** MUST NOT
- **Beschreibung:** Ist deprecated in AppV2
- **Verwende:** CSS `overflow` und `max-height` Properties stattdessen

#### REQ-AVOID-007: Keine Element-ID-Duplikate

- **Status:** MUST NOT
- **Beschreibung:** IDs müssen unique sein
- **Konvention:** `{appId}-{partId}-{elementName}`

---

## 🔵 Cross-File Requirements

#### REQ-CROSS-001: Konsistenter Namenskonvention für Actions

- **Files:** Alle Sheet-Dateien
- **Status:** MUST
- **Beschreibung:** Action-Namen sollen überall gleich sein
- **Akzeptanzkriterien:**
    - [ ] camelCase (z.B. `toggleBool`, `itemDelete`, `changeTab`)
    - [ ] Präfix wenn nötig (z.B. `itemCreate` nicht nur `create`)
    - [ ] Deutsche Logik → Englische Action-Namen

#### REQ-CROSS-002: Konsistente Error Handling

- **Files:** Alle Sheet-Dateien
- **Status:** MUST
- **Beschreibung:** Fehlerbehandlung soll standardisiert sein
- **Akzeptanzkriterien:**
    - [ ] Try-Catch in Async Actions
    - [ ] User-freundliche Fehler-Meldungen
    - [ ] Keine Konsolen-Error-Dumps

#### REQ-CROSS-003: Dialog/Prompt Migration

- **Files:** `scripts/sheets/kreatur.js` (und andere)
- **Status:** MUST
- **Beschreibung:** Alte Dialog-Aufrufe müssen erhalten bleiben oder zu ApplicationV2 migriert sein
- **Akzeptanzkriterien:**
    - [ ] `Dialog.prompt()` Aufrufe funktionieren weiterhin
    - [ ] Neue Dialoge verwenden ApplicationV2 API
    - [ ] Keine `FormApplication` für neue Dialoge

#### REQ-CROSS-004: DragDrop Implementierung

- **Files:** Alle Sheet-Dateien mit Item-Drag
- **Status:** MUST
- **Beschreibung:** DragDrop muss neu implementiert werden
- **Akzeptanzkriterien:**
    - [ ] Konstruktor initialisiert DragDrop
    - [ ] Binding in `_onRender()`
    - [ ] Callbacks sind definiert: `_canDragStart()`, `_onDragStart()`, `_canDragDrop()`, `_onDrop()`
    - [ ] Items können in Actor gezogen werden

#### REQ-CROSS-005: Lokalisierung (i18n)

- **Files:** Alle Templates + Sheets
- **Status:** MUST
- **Beschreibung:** Alle Strings sollen lokalisiert sein
- **Akzeptanzkriterien:**
    - [ ] Button-Labels verwenden i18n keys
    - [ ] Window-Title verwendet i18n key
    - [ ] Keine hardcoded deutschen Strings in Sheets
    - [ ] Alle i18n keys dokumentiert

---

## 📊 Tracking & Validation

### Validation Checklist

#### actor.js Migration

- [ ] Class Declaration konvertiert (REQ-BASE-001)
- [ ] DEFAULT_OPTIONS vorhanden (REQ-BASE-002)
- [ ] PARTS definiert (REQ-BASE-003)
- [ ] \_prepareContext() implementiert (REQ-CONTEXT-001)
- [ ] Actor in Context (REQ-CONTEXT-002)
- [ ] CONFIG in Context (REQ-CONTEXT-003)
- [ ] \_onRender() statt activateListeners() (REQ-EVENTS-001)
- [ ] Alle Actions definiert (REQ-EVENTS-002)
- [ ] Keine jQuery (REQ-EVENTS-003)
- [ ] Form Handler implementiert (REQ-FORM-001)
- [ ] Keine `_updateObject()` (REQ-AVOID-002)

#### helden.js Migration

- [ ] Class Declaration konvertiert
- [ ] DEFAULT_OPTIONS erbt korrekt
- [ ] PARTS mit allen Tabs (REQ-TABS-001)
- [ ] Tab Context in \_prepareContext() (REQ-TABS-002)
- [ ] changeTab Action (REQ-TABS-003)
- [ ] \_schipsClick und \_triStateClick als Actions

#### kreatur.js Migration

- [ ] Class Declaration konvertiert
- [ ] \_onClickable Dialog-Aufrufe funktionieren
- [ ] DragDrop implementiert
- [ ] Keine jQuery selectors

#### Templates Migration

- [ ] helden.hbs aufgeteilt in PARTS (REQ-TEMPLATE-001)
- [ ] kreatur.hbs aufgeteilt in PARTS
- [ ] Root Element ist `<form>` (REQ-TEMPLATE-002)
- [ ] data-action Attributes (REQ-TEMPLATE-004)
- [ ] Keine jQuery Abhängigkeiten (REQ-TEMPLATE-003)

### Testing Checklist

- [ ] Application rendert ohne Fehler
- [ ] Alle Tabs funktionieren
- [ ] Form-Submission speichert Daten
- [ ] Actions reagieren auf Klicks
- [ ] Event Listener (input, change) funktionieren
- [ ] Dialoge funktionieren
- [ ] DragDrop funktioniert
- [ ] Keine Browser Console Errors
- [ ] Lokalisierung funktioniert

---

## 🚀 Implementierungsreihenfolge

### Phase 1: Base Class (8 Stunden)

1. `actor.js` - Class Declaration + DEFAULT_OPTIONS + PARTS
2. `actor.js` - \_prepareContext() + Context Properties
3. `actor.js` - \_onRender() ohne Click-Events
4. `actor.js` - Form Handler

### Phase 2: Event System (12 Stunden)

5. `actor.js` - Alle Actions definieren + DEFAULT_OPTIONS.actions
6. `actor.js` - Non-Click Listener in \_onRender()
7. Templates - `data-action` Attributes hinzufügen
8. Templates - jQuery Selektoren entfernen

### Phase 3: Subclasses (8 Stunden)

9. `helden.js` - Class Migration + PARTS + Tab-System
10. `helden.js` - Actions (\_schipsClick → Action, \_triStateClick → Action)
11. `kreatur.js` - Class Migration + DragDrop
12. `kreatur.js` - Dialog-Handling überprüfen

### Phase 4: Templates (12 Stunden)

13. `helden.hbs` - In PARTS aufteilen
14. `kreatur.hbs` - In PARTS aufteilen
15. Tab-Navigation Templates erstellen
16. Form-Footer Template (generic)

### Phase 5: Testing & Fixes (8 Stunden)

17. Manual Testing aller Funktionen
18. Bug Fixes
19. Performance Tests
20. Lokalisierung überprüfen

**Total: ~48 Stunden Entwicklung**

---

## 📝 Notes

- **Backwards Compatibility:** V1 Applications funktionieren bis v15, aber sollten früher migriert werden
- **jQuery Fallback:** Falls jQuery nötig, `const html = $(this.element)` verwenden
- **Performance:** Partial Rendering mit PARTS kann Rendering um 50-70% verbessern
- **Testing:** Automated Tests empfohlen für kritische Funktionen
- **Debugging:** DevTools Application Tab zeigt AppV2 Structure
