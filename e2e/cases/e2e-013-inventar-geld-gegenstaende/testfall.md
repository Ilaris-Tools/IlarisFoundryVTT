# E2E-013: Inventar-Tab — Geld und Gegenstände

## Ziel

Prüft den vollständigen Inventar-Tab eines Helden:

1. **Geld-Normalisierung**: Dukaten- und Silbertaler-Felder befüllen, „zusammenrechnen"-Button klicken, Anzeige normalisiert sich korrekt (10 Dukaten + 25 Silbertaler → 12 Dukaten + 5 Silbertaler, da 1 Dukaten = 10 Silbertaler).
2. **Gegenstand anlegen und löschen**: Neuen Gegenstand über „+" erstellen, umbenennen, in Liste verifizieren, löschen.
3. **Behälter mit negativem Platzbedarf**: Gegenstand mit `gewicht = -5` anlegen (wird zum Handkarren-Container), in der Handkarren-Sektion verifizieren.
4. **Inhalt in Behälter legen**: Weiteren Gegenstand anlegen, Aufbewahrungsort auf den Behälter setzen, Verortung im Behälter verifizieren.
5. **Löschen in umgekehrter Reihenfolge**: Zuerst den Inhalt löschen, dann den Behälter.
6. **Zustand wiederherstellen**: Alle Geld-Werte und Items werden per `restoreActorFromDefaultSnapshot` auf den Ausgangszustand zurückgesetzt.

---

## Metadaten

| Feld        | Wert                                                               |
| ----------- | ------------------------------------------------------------------ |
| ID          | E2E-013                                                            |
| Slug        | `e2e-013-inventar-geld-gegenstaende`                               |
| Held        | `HatAlles`                                                         |
| Foundry-URL | `process.env.E2E_FOUNDRY_URL` (Standard: `http://localhost:30000`) |
| Benutzer    | `Gamemaster`                                                       |
| Welt        | `Vanilla Ilaris`                                                   |
| Passwort    | Kein (offene Welt)                                                 |

---

## Voraussetzungen (Given)

- Foundry VTT läuft und die Welt „Vanilla Ilaris" ist gestartet.
- Der Held **`HatAlles`** existiert in der Welt.
- `HatAlles` hat Geld-Felder (`system.geld.dukaten`, `system.geld.silbertaler` etc.).
- Zum Testzeitpunkt sind **keine** Items mit dem Namen `E2E-Testgegenstand`, `E2E-Behälter` oder `E2E-Inhalt` auf dem Helden vorhanden (sichergestellt durch `restoreActorFromDefaultSnapshot` in `afterEach`).

---

## Testschritte (When)

### Phase 1 — Geld normalisieren

1. Login und Welt beitreten (`loginAndJoinWorld`).
2. Snapshot von `HatAlles` für `afterEach`-Restore erstellen.
3. Actor-Sheet öffnen, zum **Inventar-Tab** navigieren.
4. Werte per API setzen: `actor.update({ 'system.geld.dukaten': 10, 'system.geld.silbertaler': 25 })` (AppV2 `submitOnChange` ist für fill+Tab unzuverlässig, siehe Pitfalls).
5. Sheet explizit re-rendern: `actor.sheet.render()` via `page.evaluate()`.
6. Warten bis Akteur im Spiel gespeichert ist (Dukaten=10, Silbertaler=25) und UI-Inputs die gesetzten Werte zeigen.
7. Button `button[data-action="clickable"][data-clicktype="shorten_money"]` klicken.
8. Warten bis `system.geld.dukaten === 12` und `system.geld.silbertaler === 5`.
9. UI prüfen: Dukaten-Feld zeigt **12**, Silbertaler-Feld zeigt **5**.

### Phase 2 — Normalen Gegenstand anlegen und löschen

10. Link `a[data-action="itemCreate"][data-itemclass="gegenstand"]` klicken.
11. Neu geöffnetes Gegenstand-Sheet (`page.locator('.application.sheet.item.gegenstand').last()`) abwarten.
12. Name-Feld (`input[name="name"]`) auf **E2E-Testgegenstand** setzen, Tab drücken.
13. Warten bis Item mit Name `E2E-Testgegenstand` auf Akteur vorhanden ist.
14. Gegenstand-Sheet schließen (`button[data-action="close"]`).
15. Zeile mit Text **E2E-Testgegenstand** in `section.tab.inventar div.twokindrow div.flexrow` ist sichtbar.
16. Delete-Button `a[data-action="itemDelete"]` in der Zeile klicken.
17. Warten bis Item nicht mehr auf Akteur vorhanden ist.
18. **Negativprüfung**: Zeile **nicht** sichtbar.

### Phase 3 — Behälter mit negativem Platzbedarf anlegen

19. Neuen Gegenstand anlegen (s. Schritt 10–11).
20. Name auf **E2E-Behälter** setzen, Tab drücken.
21. Feld `input[name="system.gewicht"]` auf **-5** setzen, Tab drücken.
22. Warten bis Item mit `system.gewicht < 0` auf Akteur vorhanden ist.
23. Sheet schließen.
24. Überschrift `h2` mit Text **E2E-Behälter** im Inventar-Tab ist sichtbar (Handkarren-Sektion).

### Phase 4 — Inhalt in Behälter legen

25. Neuen Gegenstand anlegen (s. Schritt 10–11).
26. Name auf **E2E-Inhalt** setzen, Tab drücken.
27. Dropdown `select[name="system.aufbewahrungs_ort"]` auf **E2E-Behälter** setzen (Aufbewahrungsort).
28. Warten bis `item.system.aufbewahrungs_ort === 'E2E-Behälter'`.
29. Sheet schließen.
30. Zeile mit Text **E2E-Inhalt** in `section.tab.inventar div.twokindrow div.flexrow` ist sichtbar (innerhalb Behälter-Sektion).

### Phase 5 — Umgekehrt löschen

31. Delete-Button der Zeile **E2E-Inhalt** klicken.
32. Warten bis Item nicht mehr auf Akteur ist. **Negativprüfung**: Zeile weg.
33. Item-ID von **E2E-Behälter** ermitteln, zugehörigen `a[data-action="itemDelete"][data-itemid="<id>"]` klicken.
34. Warten bis Item nicht mehr auf Akteur ist.
35. **Negativprüfung**: `h2` mit Text **E2E-Behälter** nicht mehr sichtbar.

---

## Erwartetes Ergebnis (Then)

| Assertion                                                           | Bedingung |
| ------------------------------------------------------------------- | --------- |
| Dukaten-Feld zeigt `12` nach zusammenrechnen                        | ✅        |
| Silbertaler-Feld zeigt `5` nach zusammenrechnen                     | ✅        |
| E2E-Testgegenstand erscheint in Inventarliste                       | ✅        |
| E2E-Testgegenstand nach Löschen nicht mehr sichtbar                 | ✅        |
| `h2` mit Text E2E-Behälter sichtbar nach Anlage                     | ✅        |
| E2E-Inhalt in Inventarliste sichtbar nach Zuweisung zu E2E-Behälter | ✅        |
| E2E-Inhalt nach Löschen nicht mehr sichtbar                         | ✅        |
| `h2` E2E-Behälter nach Löschen nicht mehr sichtbar                  | ✅        |

---

## Negative Checks

- Nach dem Löschen von E2E-Testgegenstand darf kein Item gleichen Namens in der Liste erscheinen.
- Nach dem Löschen von E2E-Inhalt darf es nicht mehr im Behälter auftauchen.
- Nach dem Löschen von E2E-Behälter darf die `h2`-Überschrift nicht mehr sichtbar sein.
- Vor dem zusammenrechnen dürfen die normalisierten Werte (12/5) **nicht** bereits angezeigt werden.

---

## Bekannte Einschränkungen / Pitfalls

- **submitOnChange**: Geldeingaben persistieren erst nach Tab/Blur, nicht nach Enter. Nach dem Befüllen immer `press('Tab')` und anschließend `waitForFunction` gegen `game.actors` verwenden.
- **zusammenrechnen** ruft direkt `actor.update()` auf — kein explizites Sheet-Rerender nötig, aber `waitForFunction` ist erforderlich.
- **Kein Bestätigungsdialog** beim Löschen von Gegenständen: `itemDelete` löscht sofort.
- **Kein Name-Dialog** beim Erstellen: `itemCreate` legt sofort ein Item an und öffnet dessen Sheet. Name muss im Sheet gesetzt werden.
- **Aufbewahrungsort-Dropdown** erscheint nur wenn `system.gewicht >= 0`. Bei negativem Gewicht (Behälter) wird das Dropdown ausgeblendet.
- **item_list vs. tragend/mitführend**: Gegenstände mit `gewicht < 0` landen in `actor.inventar.item_list` (Handkarren-Sektion); alle anderen nach `aufbewahrungs_ort` in `tragend` oder `mitführend`.
- **Gegenstand-Sheet CSS**: `.application.sheet.item.gegenstand` — Foundry AppV2-Klasse (analog zu `.application.sheet.item.angriff` in E2E-002).
- **Cleanup**: `restoreActorFromDefaultSnapshot` in `afterEach` stellt alle Items und Geld-Werte wieder her.
