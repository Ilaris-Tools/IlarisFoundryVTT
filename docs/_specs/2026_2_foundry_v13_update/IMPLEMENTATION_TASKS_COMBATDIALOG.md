# 🎯 Implementation Tasks - CombatDialog → ApplicationV2 Migration

**Status:** Ready for Implementation  
**Priority:** High  
**Estimated Total Duration:** 5-6 days  
**Foundry VTT Target:** v13+

---

## 📋 Übersicht der Tasks

Alle Tasks müssen aus der [Foundry VTT ApplicationV2 API Dokumentation](https://foundryvtt.com/api/classes/foundry.applications.api.ApplicationV2.html) konsultiert werden.

---

## PHASE 1: Basis-Refactoring (CombatDialog Kern-Klasse)

### TASK-1.1: Class-Definition und Imports aktualisieren

**Dateien:** `scripts/sheets/dialogs/combat_dialog.js`

**Beschreibung:**
Migriere die CombatDialog-Klasse von `Dialog` zu `HandlebarsApplicationMixin(ApplicationV2)`. Dies ist die grundlegende Strukturänderung für die neue API.

**Acceptance Criteria:**

- [ ] Import hinzufügen: `const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api`
- [ ] Class-Definition wechselt von `extends Dialog` zu `extends HandlebarsApplicationMixin(ApplicationV2)`
- [ ] **Validierung:** Code kompiliert, keine Import-Fehler
- [ ] **API-Referenz:** https://foundryvtt.com/api/classes/foundry.applications.api.ApplicationV2.html

**Dependencies:** Keine

**Estimated Duration:** 0.5h

---

### TASK-1.2: DEFAULT_OPTIONS Struktur definieren

**Dateien:** `scripts/sheets/dialogs/combat_dialog.js`

**Beschreibung:**
Ersetze den bisherigen `static get defaultOptions()` Getter durch `static DEFAULT_OPTIONS` Object Literal mit allen notwendigen Konfigurationen für ApplicationV2.

**Details:**

- `classes`: ['ilaris', 'combat-dialog']
- `position`: { width: 900, height: 'auto' }
- `window`: { resizable: true, title: "Kampf Dialog" }
- `tag`: 'form' (falls Form-Submission erforderlich ist)
- `form`: { handler: CombatDialog.#onSubmitForm, closeOnSubmit: false } (falls benötigt)

**Acceptance Criteria:**

- [ ] `static DEFAULT_OPTIONS` ist definiert (nicht `static get defaultOptions()`)
- [ ] Alle Window-Position-Einstellungen sind portiert
- [ ] CSS-Klassen sind enthalten
- [ ] **Validierung:** Dialog-Fenster öffnet sich mit korrekten Dimensionen
- [ ] **API-Referenz:** Default Options bei https://foundryvtt.com/api/classes/foundry.applications.api.ApplicationV2.html

**Dependencies:** TASK-1.1

**Estimated Duration:** 0.5h

---

### TASK-1.3: PARTS Definition für Templates

**Dateien:** `scripts/sheets/dialogs/combat_dialog.js`

**Beschreibung:**
Definiere die `static PARTS` Property, die angibt, welches Template für den Dialog verwendet wird. Dies ersetzt die bisherige `template` Property im Optionen-Getter.

**Acceptance Criteria:**

- [ ] `static PARTS = { form: { template: 'systems/Ilaris/templates/sheets/dialogs/angriff.hbs' } }` ist definiert
- [ ] Das Template wird korrekt geladen
- [ ] **Validierung:** Template wird in Dialog angezeigt
- [ ] **API-Referenz:** PARTS Struktur in ApplicationV2 Dokumentation

**Dependencies:** TASK-1.2

**Estimated Duration:** 0.5h

---

### TASK-1.4: Constructor refaktorieren

**Dateien:** `scripts/sheets/dialogs/combat_dialog.js`

**Beschreibung:**
Passe den Constructor an die neue API an:

- Entferne `dialogData` Parameter (nicht mehr nötig)
- Ändere `super(dialogData, options)` zu `super(options)`
- Erhalte Instance-Properties wie `actor`, `item`, `text_at`, `text_dm`, etc.
- Initializer Methods müssen gleich bleiben

**Acceptance Criteria:**

- [ ] Constructor hat Signatur: `constructor(actor, item, options = {})`
- [ ] `super(options)` wird korrekt aufgerufen
- [ ] Alle Instance-Properties (`this.actor`, `this.item`, etc.) werden initialisiert
- [ ] `_initializeSelectedActorsFromTargets()` wird aus Constructor aufgerufen
- [ ] **Validierung:** Dialog instanziiert sich ohne Fehler
- [ ] **API-Referenz:** ApplicationV2 Constructor Pattern

**Dependencies:** TASK-1.1, TASK-1.2

**Estimated Duration:** 0.5h

---

### TASK-1.5: getData() → \_prepareContext() migrieren

**Dateien:** `scripts/sheets/dialogs/combat_dialog.js`

**Beschreibung:**
Convertiere die `async getData()` Methode zu `async _prepareContext(options)`:

- Muss `async` sein
- Muss mit `await super._prepareContext(options)` beginnen
- Muss alle Kontext-Properties aus dem Template bereitstellen

**Acceptance Criteria:**

- [ ] Methode ist `async`
- [ ] `await super._prepareContext(options)` wird aufgerufen
- [ ] Alle bisherigen getData() Properties sind in context vorhanden
- [ ] Return-Wert ist ein Object mit allen Template-Properties
- [ ] **Validierung:** Dialog rendert mit korrekten Daten
- [ ] **API-Referenz:** \_prepareContext in HandlebarsApplicationMixin Dokumentation

**Dependencies:** TASK-1.2, TASK-1.4

**Estimated Duration:** 0.5h

---

### TASK-1.6: Actions definieren und Static Event Handler erstellen

**Dateien:** `scripts/sheets/dialogs/combat_dialog.js`

**Beschreibung:**
Konvertiere alle Event-Handler von `activateListeners()` zu statischen Private Methods in der `DEFAULT_OPTIONS.actions` Property.

**Details:**

- Alle bisherigen Event-Handler (z.B. `_angreifenKlick`, `_verteidigenKlick`) → Static Private Methods
- Jede Action-Methode bekommt Signatur: `static #onActionName(event, target) { }`
- Actions in DEFAULT_OPTIONS registrieren: `actions: { angreifen: this.#onAngreifenKlick, ... }`
- Im Template: HTML-Buttons bekommen `data-action="angreifen"` statt `class="angreifen"`

**Acceptance Criteria:**

- [ ] Alle Event-Handler sind zu Static Private Methods konvertiert
- [ ] `actions` Property in DEFAULT_OPTIONS
- [ ] Jeder Static Handler hat Signatur `(event, target)`
- [ ] Keine `activateListeners()` Methode mehr
- [ ] **Validierung:** Dialog-Buttons triggern Aktionen
- [ ] **API-Referenz:** Actions in ApplicationV2 unter https://foundryvtt.com/api/classes/foundry.applications.api.ApplicationV2.html

**Dependencies:** TASK-1.2

**Estimated Duration:** 1h

---

### TASK-1.7: activateListeners() Methode entfernen

**Dateien:** `scripts/sheets/dialogs/combat_dialog.js`

**Beschreibung:**
Entferne die bisherige `activateListeners(html)` Methode komplett. Die Event-Delegation erfolgt jetzt über die `actions` in DEFAULT_OPTIONS und HTML `data-action` Attribute.

**Acceptance Criteria:**

- [ ] `activateListeners()` Methode ist gelöscht
- [ ] Keine jQuery-basierte Event-Bindung mehr (z.B. `html.find().click()`)
- [ ] **Validierung:** Code kompiliert und linter-frei
- [ ] **API-Referenz:** ApplicationV2 übernimmt Event-Delegation

**Dependencies:** TASK-1.6

**Estimated Duration:** 0.25h

---

### TASK-1.8: jQuery → DOM API konvertieren

**Dateien:** `scripts/sheets/dialogs/combat_dialog.js`

**Beschreibung:**
Ersetze alle jQuery-Aufrufe durch native DOM API:

- `html.find(selector)` → `html.querySelector(selector)`
- `html.find(selector).each()` → `html.querySelectorAll(selector)` mit Loop
- `html.html()` → `html.innerHTML`
- `html.val()` → `element.value`
- `html.addClass()` → `html.classList.add()`
- `html.removeClass()` → `html.classList.remove()`
- `html.attr()` → `html.getAttribute()` / `html.setAttribute()`

**Acceptance Criteria:**

- [ ] Keine jQuery-Aufrufe mehr in JavaScript-Code
- [ ] Alle DOM-Manipulationen verwenden native DOM API
- [ ] `_prepareContext()` und Static Action-Handler verwenden DOM API
- [ ] **Validierung:** Dialog funktioniert, keine Console-Fehler
- [ ] **API-Referenz:** MDN DOM API Dokumentation

**Dependencies:** TASK-1.6

**Estimated Duration:** 1h

---

## PHASE 2: SubKlassen-Migration

### TASK-2.1: AngriffDialog migrieren

**Dateien:** `scripts/sheets/dialogs/angriff.js`

**Beschreibung:**
Aktualisiere AngriffDialog, die von CombatDialog erbt:

1. Erbt jetzt von migriertem CombatDialog (wird automatisch von ApplicationV2 erben)
2. `static DEFAULT_OPTIONS` mit Spread von Super: `...super.DEFAULT_OPTIONS`
3. Weitere Actions überschreiben falls nötig
4. `_prepareContext()` mit eigenen Context-Properties implementieren

**Acceptance Criteria:**

- [ ] AngriffDialog erbt von migriertem CombatDialog
- [ ] `static DEFAULT_OPTIONS` spreadt Super: `...super.DEFAULT_OPTIONS`
- [ ] Eigene Context-Properties in `_prepareContext()` gestellt
- [ ] Keine neuen `activateListeners()` hinzufügen
- [ ] **Validierung:** AngriffDialog öffnet sich, zeigt Kampfdaten, Action-Buttons funktionieren
- [ ] **API-Referenz:** Vererbung in ApplicationV2

**Dependencies:** TASK-1 komplett

**Estimated Duration:** 0.5h

---

### TASK-2.2: FernkampfAngriffDialog migrieren

**Dateien:** `scripts/sheets/dialogs/fernkampf_angriff.js`

**Beschreibung:**
Identisch mit TASK-2.1, aber für FernkampfAngriffDialog. Achte auf Fernkampf-spezifische Context-Properties.

**Acceptance Criteria:**

- [ ] FernkampfAngriffDialog erbt von migriertem CombatDialog
- [ ] `static DEFAULT_OPTIONS` spreadt Super
- [ ] Fernkampf-spezifische Context-Properties in `_prepareContext()` gestellt
- [ ] **Validierung:** FernkampfAngriffDialog öffnet sich, zeigt Fernkampf-Daten, Action-Buttons funktionieren
- [ ] **API-Referenz:** Vererbung in ApplicationV2

**Dependencies:** TASK-1 komplett

**Estimated Duration:** 0.5h

---

### TASK-2.3: UebernatuerlichDialog migrieren

**Dateien:** `scripts/sheets/dialogs/uebernatuerlich.js`

**Beschreibung:**
Identisch mit TASK-2.1, aber für UebernatuerlichDialog. Achte auf Energie-System State (z.B. `this.mod_at` Power-Modifizierer).

**Acceptance Criteria:**

- [ ] UebernatuerlichDialog erbt von migriertem CombatDialog
- [ ] `static DEFAULT_OPTIONS` spreadt Super
- [ ] Energie/Power-State in `_prepareContext()` gestellt
- [ ] **Validierung:** UebernatuerlichDialog öffnet sich, zeigt Übernatürliche-Daten, Action-Buttons funktionieren

**Dependencies:** TASK-1 komplett

**Estimated Duration:** 0.5h

---

## PHASE 3: Template-Refactoring

### TASK-3.1: angriff.hbs Template aktualisieren

**Dateien:** `templates/sheets/dialogs/angriff.hbs`

**Beschreibung:**
Aktualisiere das Angriff-Template für ApplicationV2:

1. Äußerstes Element: `<form>` → `<section>` (ApplicationV2 wrappet mit `<form>`)
2. Alle Event-Buttons: `class="angreifen"` → `data-action="angreifen"`
3. Keine nested `<form>` Tags im Template
4. CSS-Klassen bleiben für Styling (z.B. `.angreifen { color: red }`)

**Acceptance Criteria:**

- [ ] Root-Element ist `<section>` statt `<form>`
- [ ] Alle Action-Buttons haben `data-action="..."` Attribute
- [ ] Keine nested `<form>` Tags vorhanden
- [ ] CSS-Klassen sind entfernt aus Button-Selektoren in HTML (bleiben aber im CSS)
- [ ] **Validierung:** Template rendert, Buttons sind clickbar, Style bleibt erhalten
- [ ] **API-Referenz:** ApplicationV2 Template-Struktur

**Dependencies:** TASK-1.3

**Estimated Duration:** 0.5h

---

### TASK-3.2: fernkampf_angriff.hbs Template aktualisieren

**Dateien:** `templates/sheets/dialogs/fernkampf_angriff.hbs`

**Beschreibung:**
Identisch mit TASK-3.1, aber für Fernkampf-Template.

**Acceptance Criteria:**

- [ ] Root-Element ist `<section>`
- [ ] Alle Action-Buttons haben `data-action="..."` Attribute
- [ ] Keine nested `<form>` Tags
- [ ] **Validierung:** Template rendert, Buttons sind clickbar

**Dependencies:** TASK-1.3

**Estimated Duration:** 0.5h

---

### TASK-3.3: uebernatuerlich.hbs Template aktualisieren

**Dateien:** `templates/sheets/dialogs/uebernatuerlich.hbs`

**Beschreibung:**
Identisch mit TASK-3.1, aber für Übernatürlich-Template.

**Acceptance Criteria:**

- [ ] Root-Element ist `<section>`
- [ ] Alle Action-Buttons haben `data-action="..."` Attribute
- [ ] Keine nested `<form>` Tags
- [ ] **Validierung:** Template rendert, Buttons sind clickbar

**Dependencies:** TASK-1.3

**Estimated Duration:** 0.5h

---

## PHASE 4: State Management & Kontext

### TASK-4.1: State-Handling überprüfen und dokumentieren

**Dateien:** `scripts/sheets/dialogs/combat_dialog.js` und Subklassen

**Beschreibung:**
Stelle sicher, dass all State (Instance-Properties wie `this.mod_at`, `this.selectedActors`, etc.) korrekt in `_prepareContext()` an das Template übergeben wird.

**Details:**

- State bleibt auf Instance-Eigenschaften
- `_prepareContext()` exponiert den State zum Template
- Template erhält State bei jedem Rendern
- Keine zusätzliche State-Management Library nötig

**Acceptance Criteria:**

- [ ] Alle Instance-State-Properties sind dokumentiert
- [ ] `_prepareContext()` gibt alle State-Properties an context
- [ ] State-Änderungen werden beim nächsten Rendern sichtbar
- [ ] **Validierung:** Modifizierer werden aktualisiert, wenn State sich ändert

**Dependencies:** TASK-1.5

**Estimated Duration:** 0.5h

---

## PHASE 5: Hooks & externe Integration

### TASK-5.1: Hooks überprüfen und dokumentieren

**Dateien:** `scripts/sheets/dialogs/combat_dialog.js`, `scripts/sheets/dialogs/defense_button_hook.js`

**Beschreibung:**
Stelle sicher, dass alle `Hooks.call()` und `Hooks.on()` aufrufe noch funktionieren nach der Migration. Die Hook-API bleibt unverändert.

**Details:**

- Überprüfe alle Hooks.call() Aufrufe (z.B. `Hooks.call('Ilaris.fernkampfAngriffClick', rollResult, actor, item)`)
- Überprüfe alle Hooks.on() Listener (z.B. in defense_button_hook.js)
- Stelle sicher, dass Hook-Parameter noch valide sind

**Acceptance Criteria:**

- [ ] Alle `Hooks.call()` funktionieren noch
- [ ] Alle `Hooks.on()` Listener werden noch getriggert
- [ ] Defense-Buttons Hook funktioniert noch (renderChatMessageHTML Hook)
- [ ] **Validierung:** Hooks werden in Browser-Konsole getriggert
- [ ] **API-Referenz:** https://foundryvtt.com/api/namespaces/foundry.Hooks.html

**Dependencies:** TASK-1 komplett

**Estimated Duration:** 0.5h

---

## PHASE 6: Validierung & Testing

### TASK-6.1: Integrationstest durchführen

**Dateien:** Alle Dialog-Dateien

**Beschreibung:**
Öffne jeden migrierten Dialog in Foundry VTT und überprüfe:

1. Dialog öffnet sich mit korrektem Titel und Größe
2. Alle Buttons sind clickbar
3. Action-Handler werden getriggert
4. Template-Daten zeigen korrekte Werte
5. Hooks werden aufgerufen
6. Defense-Buttons funktionieren noch

**Acceptance Criteria:**

- [ ] CombatDialog, AngriffDialog, FernkampfAngriffDialog, UebernatuerlichDialog öffnen sich alle
- [ ] Dialog-Buttons sind alle noch clickbar
- [ ] Keine JavaScript-Fehler in Browser-Konsole
- [ ] Modifizierer-System funktioniert noch (mod_at, etc.)
- [ ] Würfe werden korrekt gerollt
- [ ] Defense-Buttons erscheinen noch in Chat-Nachrichten
- [ ] **Validierung:** Browser-Konsole zeigt keine Fehler, Dialog funktioniert wie vorher

**Dependencies:** TASK-1-5 komplett

**Estimated Duration:** 1h

---

### TASK-6.2: Browser Developer Tools überprüfen

**Dateien:** Alle

**Beschreibung:**
Überprüfe auf Deprecation Warnings in der Foundry VTT Konsole und Browser-Konsole.

**Acceptance Criteria:**

- [ ] Keine "Dialog is deprecated" Warnings
- [ ] Keine jQuery Deprecation Warnings
- [ ] Keine anderen API-Deprecation Warnings
- [ ] **Validierung:** Console ist sauber bei Dialog-Verwendung

**Dependencies:** TASK-6.1

**Estimated Duration:** 0.25h

---

## PHASE 7: Dokumentation & Cleanup

### TASK-7.1: Code-Dokumentation aktualisieren

**Dateien:** Alle Dialog-Dateien, Comments und JSDoc

**Beschreibung:**
Aktualisiere JSDoc Comments und Inline-Comments, um zu dokumentieren:

- Dass die Klasse jetzt ApplicationV2-basiert ist
- Neue Constructor-Signature
- Neue \_prepareContext() Methode
- Action-Handler sind jetzt static

**Acceptance Criteria:**

- [ ] JSDoc für alle Public Methods aktualisiert
- [ ] Constructor dokumentiert neue Signatur
- [ ] \_prepareContext() ist dokumentiert
- [ ] Action-Handler dokumentiert
- [ ] **Validierung:** Dokumentation ist akkurat

**Dependencies:** TASK-1-6 komplett

**Estimated Duration:** 0.5h

---

### TASK-7.2: Aufräumen: unused imports und code

**Dateien:** Alle Dialog-Dateien

**Beschreibung:**
Entferne:

- Unused Imports (z.B. alte Dialog-Utils, falls nicht mehr gebraucht)
- Dead Code, der nur für alte Dialog API nötig war
- Alte Comments, die auf alte API verweisen

**Acceptance Criteria:**

- [ ] ESLint gibt keine unused variable/import Warnings
- [ ] Dead Code ist entfernt
- [ ] Code ist sauber und lesbar
- [ ] **Validierung:** Linter läuft ohne Warnings

**Dependencies:** TASK-1-6 komplett

**Estimated Duration:** 0.25h

---

## 📚 API Referenzen (MÜSSEN KONSULTIERT WERDEN)

Bevor angenommen wird, wie etwas funktioniert, bitte in der Foundry VTT Dokumentation nachschlagen:

### ApplicationV2 Core API

- **Hauptklasse:** https://foundryvtt.com/api/classes/foundry.applications.api.ApplicationV2.html
- **Alle Properties und Methoden finden Sie dort**

### HandlebarsApplicationMixin

- **Template-Support für ApplicationV2**
- **\_prepareContext() Dokumentation**

### Event System (Actions)

- **data-action Attribute Dokumentation**
- **Static Action Handler Signatur: (event, target)**

### Hooks (Unverändert)

- **https://foundryvtt.com/api/namespaces/foundry.Hooks.html**

### Legacy Dialog API (für Referenz, was alles zu ändern ist)

- **Alte Dialog-Dokumentation** (wird verwendet, um zu sehen, was portiert werden muss)

---

## ⚠️ KRITISCHE PUNKTE (NICHT SPEKULIEREN!)

| Punkt                           | MUSS AUS API DOKU ÜBERPRÜFT WERDEN                                  |
| ------------------------------- | ------------------------------------------------------------------- |
| **Form vs Section**             | Muss man `tag: 'form'` setzen? Oder nur bei echter form submission? |
| **\_prepareContext() Signatur** | Genau welche Parameter? Was genau ist das `options` Argument?       |
| **Action Handler Signatur**     | Ist es `(event, target)` oder `(event, element)` oder `(event)`?    |
| **PARTS Structure**             | Exakt welche Struktur? Ein oder mehrere Parts möglich?              |
| **Close-Handling**              | Wie wird Dialog geschlossen? Über `form.handler`? Über Method-Call? |
| **RenderContent**               | Gibt es noch ein render-Event? Oder muss man anders rerender?       |

---

## 🔄 Task Abhängigkeiten (Dependency Graph)

```
TASK-1.1 (Imports & Class)
    ↓
TASK-1.2 (DEFAULT_OPTIONS)
    ↓
TASK-1.3 (PARTS)
    ↓
TASK-1.4 (Constructor)
    ↓
TASK-1.5 (_prepareContext)
    ↓
TASK-1.6 (Actions)
    ↓
TASK-1.7 (Remove activateListeners)
    ↓
TASK-1.8 (jQuery → DOM API)
    ↓
TASK-2.1-2.3 (SubKlassen) ← parallel möglich
    ↓
TASK-3.1-3.3 (Templates) ← parallel möglich
    ↓
TASK-4.1 (State Management)
    ↓
TASK-5.1 (Hooks)
    ↓
TASK-6.1 (Integration Test)
    ↓
TASK-6.2 (Dev Tools Check)
    ↓
TASK-7.1-7.2 (Docs & Cleanup) ← parallel möglich
```

---

## 📊 Task Summary

| Phase                    | Task Count   | Duration | Status |
| ------------------------ | ------------ | -------- | ------ |
| **1: Basis-Refactoring** | 8 Tasks      | 5h       | Ready  |
| **2: SubKlassen**        | 3 Tasks      | 1.5h     | Ready  |
| **3: Templates**         | 3 Tasks      | 1.5h     | Ready  |
| **4: State Management**  | 1 Task       | 0.5h     | Ready  |
| **5: Hooks**             | 1 Task       | 0.5h     | Ready  |
| **6: Validierung**       | 2 Tasks      | 1.25h    | Ready  |
| **7: Dokumentation**     | 2 Tasks      | 0.75h    | Ready  |
| **TOTAL**                | **20 Tasks** | **~11h** | Ready  |

**Note:** Mit parallelen Task-Durchführungen (Templates, SubKlassen, Docs/Cleanup) kann die Zeit auf **5-6 Tage** reduziert werden.

---

## ✅ Fertigstellungs-Checkliste

- [ ] Alle 20 Tasks sind implementiert
- [ ] TASK-6.1 Integration Test ist bestanden
- [ ] TASK-6.2 Browser Console ist sauber
- [ ] TASK-7.1 Dokumentation ist aktuell
- [ ] TASK-7.2 Code ist sauber
- [ ] Kein JavaScript-Fehler mehr beim Dialog-Öffnen
- [ ] Alle ursprünglichen Features funktionieren noch
- [ ] Defense-Buttons funktionieren noch
- [ ] Hooks.call() triggert noch korrekt
- [ ] Modifizierer-System funktioniert noch

---

**Erstellt:** 12. Februar 2026  
**Basierend auf:** MIGRATION_PLAN_COMBATDIALOG.md  
**Foundry VTT Version:** v13+
