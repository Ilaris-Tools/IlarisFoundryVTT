# E2E-016: Sephrasto XML-Import

## Ziel

Prüft den vollständigen Import-Flow für einen Charakter aus einer Sephrasto-XML-Datei:

1. **Import-Button**: In der Akteure-Sidebar erscheint `button.import-xml-character`.
2. **Dateiauswahl**: Klick öffnet einen OS-Dateiauswahldialog (unsichtbares `<input type="file">`).
3. **Bestätigungs-Dialog**: Foundry-Dialog zeigt Charaktername und Import-Statistiken.
4. **Import ausführen**: „Charakter importieren"-Button bestätigen.
5. **Verifikation**: Importierter Actor ist in `game.actors` vorhanden — Attribute, Fertigkeit und Waffe werden geprüft.
6. **Cleanup**: Actor nach dem Test per API löschen (`actor.delete()`).

---

## Metadaten

| Feld        | Wert                                                               |
| ----------- | ------------------------------------------------------------------ |
| ID          | E2E-016                                                            |
| Slug        | `e2e-016-xml-import`                                               |
| XML-Fixture | `e2e/cases/e2e-016-xml-import/testcharakter.xml`                   |
| Actor-Name  | `HatAllesXMLIMPORTTEST` (aus XML `<Name>`)                         |
| Foundry-URL | `process.env.E2E_FOUNDRY_URL` (Standard: `http://localhost:30000`) |
| Benutzer    | `Gamemaster`                                                       |
| Welt        | `Vanilla Ilaris`                                                   |
| Passwort    | Kein (offene Welt)                                                 |

---

## XML-Fixture

Die Datei `testcharakter.xml` liegt im selben Verzeichnis wie dieser Testfall (`e2e/cases/e2e-016-xml-import/testcharakter.xml`). Sie ist eine vollständige Sephrasto-Export-Datei und enthält u.a.:

- **Attribute**: MU 16, GE 23, KK 12, KO 15, IN 22, KL 12, CH 14, FF 16
- **Fertigkeiten**: Klingenwaffen 10, Handgemenge 12, …
- **Waffen**: Langbogen (fernkampfwaffe), Sonnenszepter, …
- **Übernatürliche Fertigkeiten**: Kraft 18, Feuer 15, …

---

## Voraussetzungen (Given)

- Foundry VTT läuft und die Welt „Vanilla Ilaris" ist gestartet.
- Eingeloggt als `Gamemaster` (hat `ACTOR_CREATE` + `FILES_UPLOAD` Berechtigung).
- Kein Actor namens `HatAllesXMLIMPORTTEST` existiert (wird in `beforeEach` sichergestellt).

---

## Testschritte (When)

### Phase 0 — Login & Cleanup

1. Login und Welt beitreten (`loginAndJoinWorld`).
2. Guard: Falls `HatAllesXMLIMPORTTEST` bereits existiert (vorheriger fehlgeschlagener Lauf), per `actor.delete()` entfernen.

### Phase 1 — Akteure-Sidebar öffnen

3. Sidebar-Tab `[data-tab="actors"]` anklicken.
4. Warten bis `button.import-xml-character` sichtbar ist.

### Phase 2 — Datei hochladen

5. `page.waitForEvent('filechooser')` VOR dem Klick registrieren (Promise.all — kritisch, da `<input>` sofort nach Klick aus DOM entfernt wird).
6. `button.import-xml-character` klicken.
7. `fileChooser.setFiles(XML_FIXTURE_PATH)` aufrufen.

### Phase 3 — Bestätigungs-Dialog prüfen

8. Warten bis Button `button:has-text("Charakter importieren")` sichtbar ist (Dialog erscheint).
9. Dialog-Content enthält Text `HatAllesXMLIMPORTTEST` (Charaktername aus XML).
10. „Charakter importieren"-Button klicken.

### Phase 4 — Post-Import-Verifikation

11. Warten bis `game.actors.getName('HatAllesXMLIMPORTTEST')` nicht `null` ist (`waitForFunction`, timeout 30 s).
12. Via `page.evaluate` Actor-Daten lesen:
    - `actor.system.attribute.MU.wert === 16`
    - `actor.system.attribute.GE.wert === 23`
    - Fertigkeit `Klingenwaffen` (type `'fertigkeit'`) hat `system.wert === 10`
    - Mindestens eine `fernkampfwaffe` (Langbogen) vorhanden
13. `importedActorId` aus `actor.id` merken (für Cleanup).

---

## Erwartetes Ergebnis (Then)

| Assertion                                                  | Bedingung |
| ---------------------------------------------------------- | --------- |
| `button.import-xml-character` in Akteure-Sidebar sichtbar  | ✅        |
| Bestätigungs-Dialog erscheint mit Charaktername            | ✅        |
| Actor `HatAllesXMLIMPORTTEST` nach Import in `game.actors` | ✅        |
| `actor.system.attribute.MU.wert === 16`                    | ✅        |
| `actor.system.attribute.GE.wert === 23`                    | ✅        |
| Fertigkeit `Klingenwaffen` mit `wert === 10` vorhanden     | ✅        |
| Mindestens eine `fernkampfwaffe` (Langbogen) vorhanden     | ✅        |
| Actor nach Testende nicht mehr in `game.actors`            | ✅        |

---

## Negative Checks

- Vor dem Import existiert kein Actor `HatAllesXMLIMPORTTEST`.
- Nach dem Cleanup-Delete ist der Actor nicht mehr via `game.actors.getName(...)` auffindbar.

---

## Cleanup-Strategie

- `importedActorId` wird nach erfolgreichem Import gesetzt.
- In `afterEach`: falls `importedActorId` gesetzt → `actor.delete()` per API.
- In `beforeEach` (Phase 0): Guard-Delete für stale Actors aus vorherigen Läufen (Idempotenz für CI).

---

## Bekannte Einschränkungen / Pitfalls

1. **`<input type="file">` wird sofort aus DOM entfernt**: `Promise.all([page.waitForEvent('filechooser'), button.click()])` ist zwingend — kein `await button.click()` danach.
2. **Bestätigungs-Dialog ist Standard-Foundry-Dialog** (`.app.dialog` oder `.window-app.dialog`, nicht AppV2): Selektor über Button-Text `"Charakter importieren"` ist robuster als Container-Selektor.
3. **Items aus Kompendium**: Fertigkeiten, Talente, Vorteile werden per Name aus Kompendien gesucht — nicht gefundene werden übersprungen (kein Fehler). Nur Attribute und Waffen sind immer garantiert.
4. **Import-Button nur für GM**: `ACTOR_CREATE + FILES_UPLOAD` Berechtigung erforderlich. Test schlägt fehl wenn als Spieler eingeloggt.
5. **XML-Fixture im Repo**: Die Datei `testcharakter.xml` liegt im gleichen Ordner wie der Test → headless CI kann den Pfad via `__dirname` auflösen.
