# E2E-Testfall E2E-001: Nahkampf-Angriffsdialog

| Feld                     | Wert                                                                            |
| ------------------------ | ------------------------------------------------------------------------------- |
| **ID**                   | E2E-001                                                                         |
| **Name**                 | Held öffnen → Kampf-Tab → Nahkampf-Angriffsdialog öffnen → Würfelwurf ausführen |
| **Kategorie**            | Kampf / Würfelwurf                                                              |
| **Foundry-Version**      | v13                                                                             |
| **Zuletzt aktualisiert** | 2026-03-27                                                                      |

---

## 1. Vorbedingungen (Given)

- [ ] Foundry v13 läuft lokal und ist erreichbar unter `http://localhost:30000`.
- [ ] Ein dedizierter Test-Account mit ausreichenden Rechten existiert, z. B. `e2e-gm`.
- [ ] Das Passwort des Test-Accounts ist dem Tester lokal bekannt und wird dem Browser-Agent beim Lauf bereitgestellt.
- [ ] Die Zielwelt existiert, z. B. `Ilaris E2E`.
- [ ] Actor **`Testlauf-Held`** (Typ: `held`) existiert in der Testwelt.
- [ ] `Testlauf-Held` besitzt mindestens eine Nahkampfwaffe, z. B. **`Kurzschwert`** (Typ: `nahkampfwaffe`) mit einem AT-Wert > 0.
- [ ] Kein anderes Sheet des `Testlauf-Held` ist geöffnet.

---

## 2. Testschritte (When)

> **Browser-Agent-Prompt-Vorlage**  
> Hänge diese Datei als Kontext an und nutze folgenden Prompt:  
> _„Führe die Testschritte aus Abschnitt 2 dieser Testfall-Datei vollständig aus, inklusive Login in Foundry. Nutze den angegebenen Test-Account und validiere anschließend die Abnahmekriterien aus Abschnitt 3."_

### 2.1 Login-Parameter

| Feld        | Wert                                                    |
| ----------- | ------------------------------------------------------- |
| Foundry-URL | `http://localhost:30000`                                |
| Accountname | `Gamemaster`                                            |
| Weltname    | `Vanilla Ilaris`                                        |
| Passwort    | Lokal beim Tester hinterlegt, nicht im Repo gespeichert |

| #   | Schritt                                | Technischer Anker                                                                                                                                                                                                                                                                                                              | Erwarte                                                                                       |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| 1   | Foundry-Seite öffnen                   | URL: `http://localhost:30000`                                                                                                                                                                                                                                                                                                  | Foundry-Login oder Weltübersicht ist sichtbar                                                 |
| 2   | Test-Account auswählen                 | Login-Formular in Foundry, Benutzername `Gamemaster`                                                                                                                                                                                                                                                                           | Benutzer ist ausgewählt oder eingetragen                                                      |
| 3   | Passwort eingeben und Login bestätigen | Passwort-Feld + Login-Button                                                                                                                                                                                                                                                                                                   | Login erfolgreich, Weltliste oder direkte Weltansicht erscheint                               |
| 4   | Zielwelt `Vanilla Ilaris` joinen       | Welt-Auswahl / Join-Button                                                                                                                                                                                                                                                                                                     | Welt lädt vollständig                                                                         |
| 5   | Chat-Log leeren (falls nicht leer)     | Klick auf Papierkorb-Icon im Chat-Bereich → bestätigen                                                                                                                                                                                                                                                                         | Chat ist leer                                                                                 |
| 6   | Held-Sheet öffnen                      | In der Sidebar Actors-Tab öffnen → `Testlauf-Held` doppelklicken **oder** via `game.actors.getName("Testlauf-Held").sheet.render(true)` in der Konsole                                                                                                                                                                         | Ein Sheet-Fenster mit Titel `Held: Testlauf-Held` öffnet sich                                 |
| 7   | Zum Kampf-Tab navigieren               | Klick auf den Navigations-Tab-Button: `nav [data-tab="kampf"]` im Sheet-Fenster                                                                                                                                                                                                                                                | Abschnitt "Nahkampfwaffen" ist sichtbar; `section.tab.kampf` hat Klasse `active`              |
| 8   | Nahkampf-Angriffsdialog öffnen         | Zeile der Nahkampfwaffe mit Name **`Kurzschwert`** finden und darin das Rollable-Icon `[data-action="rollable"][data-rolltype="angriff_diag"]` anklicken. Für Playwright: `locator('section.tab.kampf tbody tr').filter({ hasText: 'Kurzschwert' }).first().locator('[data-action="rollable"][data-rolltype="angriff_diag"]')` | Ein Dialog-Fenster mit CSS-Klasse `angriff-dialog` und Titel `Kampf: Kurzschwert` öffnet sich |
| 9   | Angriffswurf ausführen                 | Klick auf die Angriffs-Zusammenfassung im Dialog: `.modifier-summary.attack-summary.clickable-summary.angreifen`                                                                                                                                                                                                               | Dialog bleibt geöffnet; im Chat-Log erscheint eine neue Nachricht                             |

---

## 3. Erwartete Ergebnisse / Abnahmekriterien (Then)

### 3.1 UI-Zustand

- [ ] **Dialog offen**: Ein Fenster mit CSS-Klasse `angriff-dialog` ist im DOM vorhanden und sichtbar (`display` ≠ `none`).
- [ ] **Login erfolgreich**: Nach den Schritten 1-4 ist die Zielwelt geladen und der Test-Account ist aktiv.
- [ ] **Kein JS-Fehler**: Browser-Konsole zeigt keinen Eintrag der Form `ILARIS | Error` oder ungefangenen `TypeError`/`ReferenceError` während der Schritte 1-9.
- [ ] **Kampf-Tab aktiv**: `section.tab.kampf` hat Klasse `active` (oder keine Klasse `hidden`).

### 3.2 Chat-Validierung

Nach Ausführung von Schritt 9 muss im Chat-Log **exakt eine neue Nachricht** erscheinen und folgende Eigenschaften haben:

#### Struktur

| Eigenschaft      | Erwarteter Wert                             | Selektor / Quelle                                                   |
| ---------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| Flavor vorhanden | Nicht leer                                  | `.chat-message .message-content .flavor-text` enthält Inhalt        |
| Titel            | Enthält `Attacke (` gefolgt vom Waffennamen | `h2` im Flavor-HTML                                                 |
| Rollwert         | Numerisch, ≥ 1                              | `.dice-total` oder Roll-Ergebnis im Foundry Roll-API                |
| Würfelformel     | Enthält `d20`                               | `.dice-formula`                                                     |
| Modifier-Text    | Nicht leer (zeigt Modifikatoren)            | `div[style*="white-space: pre-wrap"]` im Flavor wo `text` vorhanden |

#### Zustandsmerkmale (mindestens eines davon muss sichtbar sein)

| Signal            | HTML-Marker                                                                                                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Triumph / Crit    | `h3` (Standard) oder `h2` (wenn Einstellung `realFumbleCrits` aktiv) mit Text `Triumph` (Standard) oder `Crit` (wenn Einstellung `renameTriumphWithCrit` aktiv), via `formatCritFumble`-Helper |
| Patzer            | `h3` mit Text `Patzer`                                                                                                                                                                         |
| Keines der obigen | Kein spezieller `h3` — Normalwurf                                                                                                                                                              |

#### Negativprüfungen

- [ ] Flavor enthält **nicht** den Text `undefined`.
- [ ] Flavor enthält **nicht** leeren `<h2></h2>` (Titel muss vorhanden sein).
- [ ] Es existiert kein zweiter unerwarteter Chat-Eintrag mit Fehlerinhalt.

### 3.3 Konsolenprüfung

```
Erwartete Konsolen-Ausgaben (ILARIS-intern, nicht fehlerrelevant):
  ILARIS | wuerfelwurf triggered ... angriff_diag
  ILARIS | onRollable triggered ...

Nicht-Erwartete (= Testfehler):
  ILARIS | Error ...
  Uncaught TypeError ...
  Uncaught ReferenceError ...
```

---

## 4. Technische Referenz

### 4.1 Relevante Quelldateien

| Komponente                   | Datei                                                        |
| ---------------------------- | ------------------------------------------------------------ |
| Rollable-Action (Held-Sheet) | `scripts/actors/sheets/actor.js` – `onRollable()`            |
| Dispatcher `angriff_diag`    | `scripts/dice/wuerfel.js` – `wuerfelwurf()`                  |
| Dialog-Klasse                | `scripts/combat/dialogs/angriff.js` – `AngriffDialog`        |
| Dialog-Template              | `scripts/combat/templates/dialogs/angriff.hbs`               |
| Helden-Kampf-Tab-Template    | `scripts/actors/templates/held/tabs/kampf.hbs`               |
| Chat-Flavor-Template         | `scripts/skills/templates/chat/probenchat_profan.hbs`        |
| Roll-Auswertung              | `scripts/dice/wuerfel_misc.js` – `evaluate_roll_with_crit()` |

### 4.2 CSS-Selektoren Quick-Reference

```css
/* Helden-Sheet-Fenster */
.window-app.application /* AppV2 Window */

/* Login-Formular */
form

/* Welt-Auswahl / Join-Ansicht */
.world-list, .worlds-list, .app

/* Kampf-Tab Button (Nav-Element) */
nav [data-tab="kampf"]

/* Kampf-Tab Inhalt */
section.tab.kampf

/* Nahkampfwaffe "Kurzschwert": Rollable-Icon (öffnet Angriffsdialog)
  Für generisches CSS allein gibt es keinen robusten Text-Selektor.
  Deshalb in Browser-Agent/Playwright immer erst die Zeile über den Waffennamen finden. */
section.tab.kampf tbody tr

/* AngriffDialog-Fenster */
.application.angriff-dialog

/* Angriff-Button im Dialog (klickbare Zusammenfassung) */
.modifier-summary.attack-summary.clickable-summary.angreifen

/* Chat-Log */
#chat-log

/* Chat-Nachrichten */
#chat-log .chat-message

/* Flavor-Titel in Chat */
#chat-log .chat-message h2

/* Würfelergebnis */
#chat-log .chat-message .dice-total
```

### 4.3 Konsolen-Schnelltest (optional, manuell im Browser)

```js
// Held-Sheet programmatisch öffnen:
game.actors.getName('Testlauf-Held').sheet.render(true)

// Zeile der Waffe "Kurzschwert" im Kampf-Tab finden:
Array.from(document.querySelectorAll('section.tab.kampf tbody tr')).find(
    (row) =>
        row.querySelector('td[data-action="ausklappView"]')?.textContent?.trim() === 'Kurzschwert',
)

// Anzahl Chat-Nachrichten vor dem Testlauf prüfen:
game.messages.contents.length

// Letzten Chat-Eintrag nach dem Wurf prüfen:
const last = game.messages.contents.at(-1)
console.log(last.flavor, last.rolls[0].total)
```

---

## 5. Fehlerfälle & Triage

| Symptom                                                | Wahrscheinliche Ursache                                                      | Aktion                                                                              |
| ------------------------------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------- |
| Dialog öffnet sich nicht                               | Zeile mit Waffenname `Kurzschwert` nicht gefunden oder Kampf-Tab nicht aktiv | Schritt 7 wiederholen; prüfen, ob `Kurzschwert` wirklich am Held existiert          |
| Dialog öffnet sich, aber kein Angriffs-Button sichtbar | `setupModifierDisplay()` nicht ausgeführt                                    | Dialog schließen, neu öffnen; Konsole auf Fehler prüfen                             |
| Chat bleibt leer nach Klick                            | Roll-Fehler in `_angreifenKlick()`                                           | Konsole prüfen auf `ILARIS                                                          | Error`; `evaluate_roll_with_crit`-Stack-Trace |
| Favor-Titel zeigt `undefined`                          | Waffenname nicht korrekt übergeben                                           | Item-Daten des Testhelds prüfen                                                     |
| Mehrere Chat-Nachrichten auf einmal                    | Ziel-Selektion aktiv (Target)                                                | Sicherstellen, dass kein Token anvisiert ist; Schritt "Kein laufender Kampf" prüfen |
