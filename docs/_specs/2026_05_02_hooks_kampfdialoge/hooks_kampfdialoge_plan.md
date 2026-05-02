# Plan: Hooks in Kampfdialogen verwenden

_Erstellt: 2026-05-02_

---

## 1. Objective

Hooks in das Kampfdialog-System (Nahkampf, Fernkampf, Übernatürlich) integrieren, sodass externe Module/Systeme den Dialog-Lebenszyklus, Zielauswahl, Würfelwürfe und State-Änderungen abfangen und erweitern können – und der Dialog direkt programmatisch geöffnet werden kann.

---

## 2. Assumptions

- **[BESTÄTIGT]** Foundry VTT `Hooks.call` / `Hooks.callAll` wird für nicht-blockierende Hooks verwendet; `Hooks.call` (mit `false`-Rückgabe-Semantik) für cancellable Hooks.
- **[BESTÄTIGT]** Alle drei Dialog-Klassen (`AngriffDialog`, `FernkampfAngriffDialog`, `UebernatuerlichDialog`) erben von `CombatDialog` (AppV2). Hook-Punkte in der Basisklasse decken alle Subklassen ab.
- **[BESTÄTIGT]** Einziger bestehender Hook: `Hooks.call('Ilaris.fernkampfAngriffClick', ...)` in `fernkampf_angriff.js` – wird beibehalten und ggf. in den neuen Namensraum migriert.
- **[ANNAHME]** Module sollen nicht direkt `new AngriffDialog()` aufrufen müssen.
- **[ANNAHME]** combat API - Eine cancelable Hook-Konvention (`return false` stoppt die Aktion) folgt dem FoundryVTT-Standard.
- **[ENTSCHIEDEN]** `Ilaris.fernkampfAngriffClick` wird durch `Ilaris.postFernkampfAngriff` ersetzt (kein Alias, Breaking Change akzeptiert).
- **[ENTSCHIEDEN]** Cancelable Pre-Hooks geben `null` zurück wenn blockiert – kein Override-Mechanismus.

---

## 3. Steps

### Phase 1 – Analyse & Namensraum-Konvention

#### Schritt 1 — Hook-Namensraum und Konvention dokumentieren

- **Was**: Definiere den offiziellen Namensraum `Ilaris.<hookName>` und die Calling Convention (Parameterliste, Cancelable vs. Callall) für alle neuen Hooks. Erstelle eine Referenztabelle.
- **Wo**: `docs/_specs/2026_05_02_hooks_kampfdialoge/hook-reference.md` (neu), später nach `docs/develop/hooks.md` überführen.
- **Wer**: Docs Specialist
- **Depends on**: none

---

### Phase 2 – Public Combat API

#### Schritt 2 — `combat-api.js` erstellen

- **Was**: Neues Modul `scripts/combat/combat-api.js` m ```js
  /\*\*
    - @param {Actor} actor
    - @param {Item} item
    - @param {'melee'|'ranged'|'supernatural'} type
    - @param {object} [options]
    - @returns {Promise<CombatDialog>}
      \*/
      export async function openCombatDialog(actor, item, type, options = {}) { … }

    ```

    Intern ruft sie – nach dem Pre-Hook – `new AngriffDialog / FernkampfAngriffDialog / UebernatuerlichDialog` auf und rendert den Dialog. Bei `return false` im Pre-Hook gibt die Funktion `null` zurück.

    ```

- **Wo**: `scripts/combat/combat-api.js` (neu)
- **Wer**: Code Specialist
- **Depends on**: Schritt 1 (Namensraum)

#### Schritt 3 — `wuerfel.js` auf `openCombatDialog` umstellen

- **Was**: Die drei direkten `new …Dialog(); d.render(true)`-Aufrufe in `scripts/dice/wuerfel.js` (Zeilen 21–31) durch `openCombatDialog(actor, item, type)` ersetzen.
- **Wo**: `scripts/dice/wuerfel.js`
- **Wer**: Code Specialist
- **Depends on**: Schritt 2

#### Schritt 4 — `defense_button_hook.js` auf `openCombatDialog` umstellen

- **Was**: Den `new AngriffDialog(..., { isDefenseMode: true, ... }); d.render(true)`-Aufruf in `scripts/combat/dialogs/defense_button_hook.js` (Zeile 350) durch `openCombatDialog(actor, weapon, 'melee', { isDefenseMode: true, … })` ersetzen.
- **Wo**: `scripts/combat/dialogs/defense_button_hook.js`
- **Wer**: Code Specialist
- **Depends on**: Schritt 2

---

### Phase 3 – Dialog-Lifecycle-Hooks

#### Schritt 5 — `Ilaris.preCombatDialog` (cancelable)

- **Was**: In `openCombatDialog()` (combat-api.js) vor dem Instanziieren des Dialogs einfügen:

    ```js
    if (Hooks.call('Ilaris.preCombatDialog', actor, item, type, options) === false) return null
    ```

    Ermöglicht Modulen, das Öffnen zu verhindern oder `options` zu mutieren.

- **Wo**: `scripts/combat/combat-api.js`
- **Wer**: Code Specialist
- **Depends on**: Schritt 2

#### Schritt 6 — `Ilaris.combatDialogRendered`

- **Was**: In `CombatDialog._onRender()` am Ende des Basis-`_onRender`-Aufrufs einfügen:

    ```js
    Hooks.callAll('Ilaris.combatDialogRendered', this)
    ```

- **Wo**: `scripts/combat/dialogs/combat_dialog.js`
- **Wer**: Code Specialist
- **Depends on**: none

---

### Phase 4 – Zielauswahl-Hooks

#### Schritt 7 — `Ilaris.preTargetSelection` (cancelable)

- **Was**: In `CombatDialog._showNearbyActors()` (Button-Handler `#onShowNearby`) und in `_initializeSelectedActorsFromTargets()` vor dem Schreiben von `this.selectedActors` einfügen:

    ```js
    if (Hooks.call('Ilaris.preTargetSelection', this, candidates) === false) return
    ```

    `candidates` ist das Array von Token-Kandidaten (pre-set oder aus `game.user.targets`).

- **Wo**: `scripts/combat/dialogs/combat_dialog.js`
- **Wer**: Code Specialist
- **Depends on**: none

#### Schritt 8 — `Ilaris.targetSelectionComplete`

- **Was**: Am Ende von `TargetSelectionDialog` (nach Bestätigung) und nach dem Schreiben von `this.selectedActors` im Dialog:

    ```js
    Hooks.callAll('Ilaris.targetSelectionComplete', dialog, dialog.selectedActors)
    ```

    Wird auch nach `_initializeSelectedActorsFromTargets()` in `CombatDialog` gefeuert, wenn Ziele aus `game.user.targets` übernommen wurden.

- **Wo**: `scripts/combat/dialogs/target_selection.js`, `scripts/combat/dialogs/combat_dialog.js`
- **Wer**: Code Specialist
- **Depends on**: Schritt 7

---

### Phase 5 – Würfelwurf-Hooks

#### Schritt 9 — `Ilaris.preAngriff` (cancelable)

- **Was**: Zu Beginn von `_angreifenKlick()` in **allen drei Dialog-Klassen** einfügen:

    ```js
    if (Hooks.call('Ilaris.preAngriff', this) === false) return
    ```

- **Wo**: `scripts/combat/dialogs/angriff.js`, `scripts/combat/dialogs/fernkampf_angriff.js`, `scripts/combat/dialogs/uebernatuerlich.js`
- **Wer**: Code Specialist
- **Depends on**: none

#### Schritt 10 — `Ilaris.postAngriff` (Umbenennung `fernkampfAngriffClick`)

- **Was**: Nach `evaluate_roll_with_crit()` in allen drei `_angreifenKlick()`-Methoden:

    ```js
    Hooks.callAll('Ilaris.postAngriff', rollResult, this)
    ```

    Bestehenden `Hooks.call('Ilaris.fernkampfAngriffClick', ...)` in `fernkampf_angriff.js` direkt durch `Hooks.callAll('Ilaris.postAngriff', ...)` ersetzen (Breaking Change, kein Alias).

- **Wo**: `scripts/combat/dialogs/angriff.js`, `scripts/combat/dialogs/fernkampf_angriff.js`, `scripts/combat/dialogs/uebernatuerlich.js`
- **Wer**: Code Specialist
- **Depends on**: Schritt 9

#### Schritt 11 — `Ilaris.preVerteidigung` / `Ilaris.postVerteidigung`

- **Was**: In `AngriffDialog._verteidigenKlick()`:

    ```js
    // before roll
    if (Hooks.call('Ilaris.preVerteidigung', this) === false) return
    // after roll
    Hooks.callAll('Ilaris.postVerteidigung', rollResult, this)
    ```

- **Wo**: `scripts/combat/dialogs/angriff.js`
- **Wer**: Code Specialist
- **Depends on**: Schritt 9

#### Schritt 12 — `Ilaris.preSchaden` / `Ilaris.postSchaden`

- **Was**: In `_schadenKlick()` aller relevanten Dialog-Klassen:

    ```js
    if (Hooks.call('Ilaris.preSchaden', this) === false) return
    // after roll
    Hooks.callAll('Ilaris.postSchaden', rollResult, this)
    ```

- **Wo**: `scripts/combat/dialogs/angriff.js`, `scripts/combat/dialogs/fernkampf_angriff.js`
- **Wer**: Code Specialist
- **Depends on**: none

---

### Phase 6 – Dokumentation

#### Schritt 13 — Hook-Referenz finalisieren

- **Was**: `hook-reference.md` vervollständigen mit: Hook-Name, Aufrufstelle, Parameter-Typen, Cancelable ja/nein, Beispiel-Snippet.
- **Wo**: `docs/develop/hooks.md` (neu, oder existierende Develop-Doku erweitern)
- **Wer**: Docs Specialist
- **Depends on**: Schritte 5–12

#### Schritt 14 — Debug-Beispieldatei erstellen

- **Was**: Neue Datei `scripts/combat/hooks-debug-example.js`, die **alle** Ilaris-Kampfdialog-Hooks registriert und deren Parameter per `console.log` ausgibt. Cancellable Hooks enthalten einen auskommentierten `return false`-Block. Die Datei wird **nicht** in `system.json` eingetragen und dient ausschließlich als Entwicklungsreferenz.
- **Wo**: `scripts/combat/hooks-debug-example.js` (neu)
- **Wer**: Code Specialist
- **Depends on**: Schritte 5–12

---

## 4. Validation Plan

| Schritt | Prüfung                                                                                                          | Erwartetes Ergebnis                                 |
| ------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 2–4     | `npm test`                                                                                                       | Alle bisherigen Unit-Tests grün                     |
| 2–4     | E2E: `e2e-001`, `e2e-005`, `e2e-008`, `e2e-009`                                                                  | Alle grün – kein Regressionsbruch                   |
| 5       | Manuell: `Hooks.on('Ilaris.preCombatDialog', () => false)` in Browser-Console registrieren, dann Angriff klicken | Dialog öffnet **nicht**                             |
| 6       | Manuell: `Hooks.on('Ilaris.combatDialogRendered', d => console.log(d))`                                          | Dialog-Instanz erscheint in Console beim Öffnen     |
| 7–8     | Manuell: `Hooks.on('Ilaris.targetSelectionComplete', (d, t) => console.log(t))`                                  | Array der ausgewählten Ziele erscheint nach Auswahl |
| 9–10    | Manuell: `Hooks.on('Ilaris.preAngriff', () => false)`                                                            | Würfelwurf wird nicht ausgeführt                    |
| 10      | Manuell: `Hooks.on('Ilaris.postAngriff', (r) => console.log(r.roll.total))`                                      | Roll-Ergebnis erscheint in Console                  |
| 11–12   | Manuell analog zu 9–10                                                                                           | VT und Schaden blockier-/beobachtbar                |
| 14      | `hooks-debug-example.js` in Browser-Console importieren, alle Hooks feuern lassen                                | Alle Parameter erscheinen strukturiert in Console   |
| Alle    | `npm run lint`                                                                                                   | Keine neuen ESLint-Fehler                           |

---

## 5. Delegation Map

| Schritt       | Specialist                                          | Input                                                      | Expected Output                                         |
| ------------- | --------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| 1             | Docs                                                | Hook-Namensraum-Konvention                                 | `docs/_specs/.../hook-reference.md`                     |
| 2             | Code                                                | Analyse Schritte 1–4                                       | `scripts/combat/combat-api.js` (neu)                    |
| 3             | Code                                                | `scripts/dice/wuerfel.js`                                  | Aufrufe auf `openCombatDialog` umgestellt               |
| 4             | Code                                                | `scripts/combat/dialogs/defense_button_hook.js`            | Aufruf auf `openCombatDialog` umgestellt                |
| 5             | Code                                                | `scripts/combat/combat-api.js`                             | `Ilaris.preCombatDialog` Hook eingefügt                 |
| 6             | Code                                                | `scripts/combat/dialogs/combat_dialog.js`                  | `Ilaris.combatDialogRendered` Hook in `_onRender`       |
| 7             | Code                                                | `scripts/combat/dialogs/combat_dialog.js`                  | `Ilaris.preTargetSelection` Hook                        |
| 8             | Code                                                | `target_selection.js`, `combat_dialog.js`                  | `Ilaris.targetSelectionComplete` Hook                   |
| 9             | Code                                                | `angriff.js`, `fernkampf_angriff.js`, `uebernatuerlich.js` | `Ilaris.preAngriff` in alle `_angreifenKlick()`         |
| 10            | Code                                                | Gleiche Dateien                                            | `Ilaris.postAngriff`; Migration `fernkampfAngriffClick` |
| 11            | Code                                                | `scripts/combat/dialogs/angriff.js`                        | `Ilaris.preVerteidigung`, `Ilaris.postVerteidigung`     |
| 12            | Code                                                | `angriff.js`, `fernkampf_angriff.js`                       | `Ilaris.preSchaden`, `Ilaris.postSchaden`               |
| 13            | Docs                                                | Alle Hooks aus Schritte 5–12                               | `docs/develop/hooks.md`                                 |
| 14            | Code                                                | Alle Hooks aus Schritte 5–12                               | `scripts/combat/hooks-debug-example.js` (neu)           |
| s/angriff.js` | `Ilaris.preVerteidigung`, `Ilaris.postVerteidigung` |
| 12            | Code                                                | `angriff.js`, `fernkampf_angriff.js`                       | `Ilaris.preSchaden`, `Ilaris.postSchaden`               |
| 13            | Docs                                                | Alle Hooks aus Schritte 5–12                               | `docs/develop/hooks.md`                                 |

---

## 6. Entschiedene Fragen

1. **`Ilaris.fernkampfAngriffClick` Migration**: Direkte Umbenennung zu `Ilaris.postAngriff` (Breaking Change, kein Alias).
2. **Cancelable Pre-Hooks Semantik**: Bei `return false` gibt `openCombatDialog` `null` zurück – kein Override-Mechanismus.
