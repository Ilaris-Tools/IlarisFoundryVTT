# Testfall-Template (E2E)

Dieses Template dient als Grundlage für neue E2E-Testfälle im Ilaris FoundryVTT System.  
Es führt den Tester von einer freien Beschreibung zu einer technisch vollständigen, vom VS Code Browser-Agent ausführbaren Testfall-Datei.

Jeder Testfall muss den **Login nach Foundry selbst ausführen**. Ein bereits eingeloggter Zustand ist nie Teil der Vorbedingungen.

**Hinweis**: Der Referenz-Testfall [E2E-001 Nahkampf-Angriffsdialog](./referenz-testfall-nahkampf.md) zeigt, wie ein ausgefülltes Ergebnis aussieht.  
Die Strategie und das Ausführungsprotokoll sind in [docs/develop/e2e-testing.md](../../develop/e2e-testing.md) beschrieben.

---

## Schritt 1: Tester-Beschreibung (Freitext)

Beschreibe den zu testenden Ablauf in natürlicher Sprache. Folgende Leitfragen helfen:

1. Welches UI-Element öffnet der Benutzer? (z. B. `Held-Sheet`, `Zauber-Dialog`, `Kampf-Tab`)
2. Welche Aktion führt der Benutzer aus? (z. B. `Zauber wirken`, `Fertigkeit würfeln`, `Waffe ausrüsten`)
3. Mit welchem Test-Account und welcher Welt soll der Login erfolgen?
4. Was sollte danach im UI zu sehen sein? (z. B. `Dialog öffnet sich`, `Ein Wert ändert sich`)
5. Was sollte im Chat erscheinen? (z. B. `Würfelergebnis für Zauber X`, `Schadensnachricht`)
6. Welche Fehlerfälle sollen explizit geprüft werden? (z. B. `Kein JS-Fehler`, `Kein leerer Titel`)

**Beispiel-Freitext:**

> Ein Tester öffnet den Held, geht zum Fertigkeiten-Tab, klickt auf die Fertigkeit "Klettern" und erwartet, dass ein Probendialog erscheint und nach Bestätigung ein Chat-Ergebnis mit dem Titel "Probe: Klettern" gepostet wird.

---

## Schritt 2: Mapping-Regeln (Freitext → Technische Schritte)

Für jeden Schritt aus der Freitext-Beschreibung die folgenden Felder bestimmen. Die technischen Anker können CSS-Selektoren, Playwright-Locators oder gezielte Konsolen-Befehle im Foundry-Browser sein.

Für Listen, Tabellen und wiederholte UI-Elemente gilt: **Keine positionsbasierten Selektoren** wie `first-child`, wenn stattdessen ein fachlicher Textanker existiert. Bevorzuge Auswahl über sichtbaren Namen, Label oder eindeutige `data-*`-Attribute. Für generierten Playwright-Code bedeutet das in der Regel `locator(...).filter({ hasText: '...' })` statt reinem Positionszugriff.

### Wie finde ich den richtigen CSS-Selektor?

1. Foundry starten und die Szene manuell aufrufen.
2. Rechtsklick → Element untersuchen (Browser DevTools).
3. Das relevante HTML-Element identifizieren und `data-*`-Attribute notieren.
4. Selektor so konkret wie nötig, so generisch wie möglich formulieren.

### Mapping-Tabelle (Vorlage)

| Schritt-Nr. | Freie Beschreibung    | CSS-Selektor / Konsolen-Befehl | Erwarteter Zustand nach dem Schritt |
| ----------- | --------------------- | ------------------------------ | ----------------------------------- |
| 1           | [Schritt beschreiben] | `[Selektor]`                   | [Was DOM-Zustand danach sein soll]  |
| 2           | [Schritt beschreiben] | `[Selektor]`                   | [Was DOM-Zustand danach sein soll]  |
| …           | …                     | …                              | …                                   |

### Hilfreiche Selektoren für wiederkehrende Muster

| Muster                                  | CSS-Selektor                                     |
| --------------------------------------- | ------------------------------------------------ |
| Login-Formular                          | `form`                                           |
| Welt-Auswahl / Join-Ansicht             | `.world-list`, `.worlds-list`                    |
| Held-Sheet öffnen (Konsole)             | `game.actors.getName("NAME").sheet.render(true)` |
| Tab aktivieren (AppV2)                  | `nav [data-tab="TAB-ID"]`                        |
| Rollable-Aktion                         | `[data-action="rollable"][data-rolltype="TYP"]`  |
| Tabellenzeile per Fachtext (Playwright) | `locator('tr').filter({ hasText: 'TEXT' })`      |
| Angriffsdialog öffnen                   | `[data-rolltype="angriff_diag"]`                 |
| Dialog nach Klasse finden               | `.angriff-dialog`, `.zauber-dialog`, etc.        |
| Chat-Log neue Nachricht                 | `#chat-log .chat-message:last-child`             |
| Würfelergebnis im Chat                  | `#chat-log .chat-message:last-child .dice-total` |
| Chat-Nachrichtentitel                   | `#chat-log .chat-message:last-child h2`          |
| Erfolgsstatus im Chat                   | `#chat-log .chat-message:last-child h3`          |

---

## Schritt 3: Testfall-Skelett (zum Ausfüllen)

Dieses Skelett direkt kopieren und befüllen. Dateinamen-Konvention: `TESTFALL-ID-[kurzname].md`, z. B. `E2E-002-fertigkeit-probe.md`.

### Zielablage im Repository

Jeder Testfall erzeugt einen eigenen Ordner in `e2e/cases/`.

Beispiel:

```text
e2e/cases/e2e-001-nahkampf-angriff/
	testfall.md
	e2e-001-nahkampf-angriff.spec.ts
```

Wenn zusätzliche Dateien für mehrere Testfälle wiederverwendbar sind, kommen sie nach `e2e/shared/`, z. B.:

```text
e2e/shared/fixtures/
e2e/shared/helpers/
```

````markdown
# E2E-Testfall [TESTFALL-ID]: [Name des Testfalls]

| Feld                     | Wert                                              |
| ------------------------ | ------------------------------------------------- |
| **ID**                   | [TESTFALL-ID]                                     |
| **Name**                 | [Beschreibender Name, z. B. "Fertigkeit würfeln"] |
| **Kategorie**            | [z. B. Kampf / Zauber / Fertigkeit / UI]          |
| **Foundry-Version**      | v13                                               |
| **Zuletzt aktualisiert** | [YYYY-MM-DD]                                      |

---

## 1. Vorbedingungen (Given)

- [ ] Foundry v13 läuft lokal und ist erreichbar unter `http://localhost:30000`.
- [ ] Ein dedizierter Test-Account existiert und hat die benötigten Rechte.
- [ ] Passwort des Test-Accounts ist lokal verfügbar, aber nicht im Repo gespeichert.
- [ ] Zielwelt existiert und ist für den Test-Account erreichbar.
- [ ] [Welcher Actor / welche Daten werden gebraucht?]
- [ ] [Weitere spezifische Vorbedingungen]

### 1.1 Login-Parameter

| Feld        | Wert                                                    |
| ----------- | ------------------------------------------------------- |
| Foundry-URL | `http://localhost:30000`                                |
| Accountname | `[z. B. e2e-gm]`                                        |
| Weltname    | `[Exakter Weltname]`                                    |
| Passwort    | Lokal beim Tester hinterlegt, nicht im Repo gespeichert |

---

## 2. Testschritte (When)

> **Browser-Agent-Prompt-Vorlage**
> Hänge diese Datei als Kontext an und nutze folgenden Prompt:
> _„Führe die Testschritte aus Abschnitt 2 dieser Testfall-Datei vollständig aus, inklusive Login in Foundry. Nutze die Login-Parameter aus Abschnitt 1.1 und validiere anschließend die Abnahmekriterien aus Abschnitt 3."_

| #   | Schritt                                | Technischer Anker                                         | Erwarte                                  |
| --- | -------------------------------------- | --------------------------------------------------------- | ---------------------------------------- |
| 1   | Foundry-Seite öffnen                   | `http://localhost:30000`                                  | Login-Dialog oder Weltliste ist sichtbar |
| 2   | Test-Account auswählen                 | `[Login-Selektor oder Benutzerauswahl]`                   | Richtiger Account ist ausgewählt         |
| 3   | Passwort eingeben und Login bestätigen | `[Passwortfeld / Login-Button]`                           | Login erfolgreich                        |
| 4   | Zielwelt joinen                        | `[Welt-Auswahl / Join-Button]`                            | Zielwelt ist geladen                     |
| 5   | [Schritt beschreiben]                  | `[CSS-Selektor, Playwright-Locator oder Konsolen-Befehl]` | [Erwarteter DOM-Zustand]                 |
| 6   | [Schritt beschreiben]                  | `[CSS-Selektor, Playwright-Locator oder Konsolen-Befehl]` | [Erwarteter DOM-Zustand]                 |
| …   | …                                      | …                                                         | …                                        |

---

## 3. Erwartete Ergebnisse / Abnahmekriterien (Then)

### 3.1 UI-Zustand

- [ ] Login erfolgreich, Welt geladen, richtiger Test-Account aktiv.
- [ ] [Welches Element ist sichtbar?]
- [ ] Kein JS-Fehler in der Browser-Konsole (`ILARIS | Error`, `TypeError`, `ReferenceError`).
- [ ] [Weiterer UI-Zustand]

### 3.2 Chat-Validierung

Nach Ausführung des letzten Schritts erscheint **eine neue Nachricht** im Chat mit folgenden Eigenschaften:

#### Struktur

| Eigenschaft           | Erwarteter Wert                         | Selektor                                           |
| --------------------- | --------------------------------------- | -------------------------------------------------- |
| Titel (`h2`)          | Enthält `[erwarteter Titel-Text]`       | `#chat-log .chat-message:last-child h2`            |
| Würfelergebnis        | Numerischer Wert (1–20 + Modifikatoren) | `#chat-log .chat-message:last-child .dice-total`   |
| Formel                | Enthält `d20`                           | `#chat-log .chat-message:last-child .dice-formula` |
| [Weitere Eigenschaft] | [Erwarteter Wert]                       | `[Selektor]`                                       |

#### Zustandsmarker (optional, bei Krit/Patzer)

| Zustand        | Bedingung                                 | Selektor                                                                                              |
| -------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Triumph / Crit | Würfelergebnis ≥ [Grenzwert]              | `h3` (oder `h2` wenn `realFumbleCrits`) mit Text `Triumph` (oder `Crit` wenn `renameTriumphWithCrit`) |
| Patzer         | Würfelergebnis = 1 oder ≥ [Fumble-Grenze] | `h3` mit Text `Patzer`                                                                                |

#### Negativprüfungen

- [ ] Kein `undefined` oder `null` in irgendeinem sichtbaren Chat-Textinhalt.
- [ ] `h2`-Element nicht leer.
- [ ] Keine Chat-Nachrichten mit CSS-Klasse `error-message`.
- [ ] [Weitere Negativprüfungen]

---

## 4. Schnellreferenz (für Browser-Agent)

```javascript
// Held per Konsole öffnen
game.actors.getName('[NAME]').sheet.render(true)

// Letzte Chat-Nachricht inspizieren
document.querySelector('#chat-log .chat-message:last-child')?.innerHTML

// Titel der letzten Nachricht prüfen
document.querySelector('#chat-log .chat-message:last-child h2')?.textContent

// Würfelergebnis prüfen
document.querySelector('#chat-log .chat-message:last-child .dice-total')?.textContent
```
````

### 4.1 Ziel-Artefakt für die Automatisierung

Langfristig endet jeder Testfall nicht nur als Markdown-Beschreibung, sondern zusätzlich als generierte Playwright-Datei im Repository.

Mindestinhalt des generierten Artefakts:

- Login-Flow in Foundry
- Robuste Locator-Strategie mit Text- oder `data-*`-Ankern
- Assertions für UI-Zustand und Chat-Inhalt
- Ablage nach Konvention, z. B. `e2e/cases/e2e-001-nahkampf-angriff/e2e-001-nahkampf-angriff.spec.ts`
- Testfalldokumentation im selben Ordner, z. B. `e2e/cases/e2e-001-nahkampf-angriff/testfall.md`
- Wiederverwendbare Fixtures in `e2e/shared/fixtures/` statt dupliziert pro Testfallordner

---

## 5. Fehlertriage

| Symptom                  | Wahrscheinliche Ursache                           | Nächster Schritt                                     |
| ------------------------ | ------------------------------------------------- | ---------------------------------------------------- | ------------- |
| Dialog öffnet sich nicht | Rollable-Selektor nicht gefunden / Item-ID falsch | DevTools: Element-Inspektor auf Kampf-Tab-Inhalt     |
| Kein Chat-Eintrag        | `postRollToChat()` läuft nicht durch              | Konsole auf `ILARIS                                  | Error` prüfen |
| Titel ist `undefined`    | `templateData.title` nicht gesetzt                | `wuerfel_misc.js` → `prepareRollTemplate()` debuggen |
| [Weiteres Symptom]       | [Ursache]                                         | [Schritt]                                            |

```

---

## Schritt 4: Review-Checkliste

Vor dem Einchecken eines neuen Testfalls diese Checkliste durchgehen:

### Vollständigkeit

- [ ] **Given**: Alle Vorbedingungen vollständig und eindeutig — kein "und so weiter"?
- [ ] **Given**: Login ist nicht als bereits erfüllte Vorbedingung formuliert, sondern als ausführbarer Schritt beschrieben?
- [ ] **When**: Jeder Schritt hat genau einen technischen Anker (CSS-Selektor oder Konsolen-Befehl)?
- [ ] **When**: Bei Listen oder Tabellen werden fachliche Textanker oder stabile `data-*`-Attribute statt Positionsselektoren verwendet?
- [ ] **Then**: Mindestens ein struktureller Chat-Check vorhanden?
- [ ] **Then**: Negativprüfungen definiert (kein `undefined`, kein leerer Titel, kein JS-Fehler)?
- [ ] **Fehlertriage**: Mindestens zwei Fehlerfälle mit Triage-Hilfe dokumentiert?

### Qualität der technischen Anker

- [ ] Selektoren sind konkret und eindeutig (id, data-attribute, Kombination)?
- [ ] Selektoren wurden am laufenden Foundry manuell verifiziert?
- [ ] Keine brittle Selektoren (z. B. `:nth-child(3)` ohne Kontext)?

### Sprachkonvention

- [ ] Gesamtes Dokument auf Deutsch (außer technischen Code-Snippets)?
- [ ] Konsistente Terminologie mit [Glossar](../../../.agents/GLOSSARY.md)?

### Testdaten

- [ ] Testfall-ID eindeutig (keine Doppelung mit bestehenden IDs)?
- [ ] Referenzierte Testdaten (Held-Name, Waffen-Name) stimmen mit [Testdaten-Setup](../../develop/e2e-testing.md#testdaten-einrichten) überein?
- [ ] Ein dedizierter Test-Account und der exakte Weltname sind dokumentiert?

### Playwright-Zielzustand

- [ ] Der Testfall lässt sich ohne Bedeutungsverlust in Playwright-Locators übersetzen?
- [ ] Das Zielartefakt und der vorgesehene Dateiname für die generierte Testdatei sind klar?
- [ ] Der Zielordner `e2e/cases/[testfallname]/` ist festgelegt und enthält `testfall.md` + `*.spec.ts`?
- [ ] Potenziell wiederverwendbare Fixtures wurden in `e2e/shared/fixtures/` eingeordnet?

---

## Testfall-ID-Vergabe

IDs werden sequenziell vergeben. Aktuelle Übersicht:

| ID | Testfall | Datei |
| -- | -------- | ----- |
| E2E-001 | Nahkampf-Angriffsdialog (Referenzfall) | [referenz-testfall-nahkampf.md](./referenz-testfall-nahkampf.md) |
| E2E-002 | _[nächster Testfall]_ | _[noch nicht angelegt]_ |
```
