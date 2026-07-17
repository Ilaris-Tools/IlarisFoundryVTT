<!-- DEPRECATED: The canonical test specification is now in openspec/specs/<capability>/spec.md. This file is retained for reference only. -->

# E2E-014: Übernatürliche Fertigkeiten-Tab

## Ziel

Prüft die UI-Interaktionen im **Übernatürlich-Tab** des Helden-Sheets:

1. **Stil-Select**: Den aktiven übernatürlichen Stil auf den Angrosch-Traditionsnamen setzen und sicherstellen, dass der Wert persistiert wird.
2. **ausklappView — Fertigkeit**: Eine `uebernatuerliche_fertigkeit`-Zeile aufklappen → Beschreibungstext erscheint.
3. **ausklappView — Liturgie**: Eine `liturgie`-Zeile aufklappen → Beschreibungstext erscheint.
4. **Fertigkeit PW-Klick → Chat-Roll**: PW-Zelle der Fertigkeit klicken → direkter Würfelwurf in den Chat (`data-rolltype="uebernatuerliche_fertigkeit"` öffnet **keinen** Dialog). Negativprüfung: kein `UebernatuerlichDialog` erscheint.
5. **Roll-Dialog öffnen (Liturgie)**: Icon-Zelle `karma_diag` der Liturgie klicken → `UebernatuerlichDialog` öffnet sich → sofort schließen ohne Würfeln.
6. **Cleanup**: `restoreActorFromDefaultSnapshot` stellt `system.misc.selected_uebernatuerlicher_stil` wieder her.

> Dieses Test **dupliziert nicht** E2E-009, das den Dialog-Inhalt und die Würfelmechanik exhaustiv prüft.

---

## Metadaten

| Feld        | Wert                                                               |
| ----------- | ------------------------------------------------------------------ |
| ID          | E2E-014                                                            |
| Slug        | `e2e-014-uebernatuerlich-tab`                                      |
| Held        | `HatAlles`                                                         |
| Tradition   | `Tradition der Angroschgeweihten` (karma-basiert, gruppe 7)        |
| Foundry-URL | `process.env.E2E_FOUNDRY_URL` (Standard: `http://localhost:30000`) |
| Benutzer    | `Gamemaster`                                                       |
| Welt        | `Vanilla Ilaris`                                                   |
| Passwort    | Kein (offene Welt)                                                 |

---

## Voraussetzungen (Given)

- Foundry VTT läuft und die Welt „Vanilla Ilaris" ist gestartet.
- Der Held **`HatAlles`** existiert in der Welt.
- `HatAlles` besitzt mindestens einen Vorteil vom Typ `geweihtentradition` (gruppe 7) mit Namen enthaltend „Angrosch" → der Stil-Select wird im Tab gerendert.
- `HatAlles` besitzt mindestens eine `uebernatuerliche_fertigkeit` und mindestens eine `liturgie`.
- Zu Beginn des Tests ist `system.misc.selected_uebernatuerlicher_stil` auf `"ohne"` (wird per Snapshot-Restore sichergestellt).

---

## Testschritte (When)

### Phase 0 — Login & Setup

1. Login und Welt beitreten (`loginAndJoinWorld`).
2. Snapshot von `HatAlles` für `afterEach`-Restore erstellen.
3. Laufzeit-Discovery via `page.evaluate`:
    - Ersten Item-Namen mit `type === 'uebernatuerliche_fertigkeit'` ermitteln → `FERTIGKEIT_NAME`
    - Erste Item-ID mit `type === 'uebernatuerliche_fertigkeit'` ermitteln → `FERTIGKEIT_ID`
    - Ersten Item-Namen mit `type === 'liturgie'` ermitteln → `LITURGIE_NAME`
    - Erste Item-ID mit `type === 'liturgie'` ermitteln → `LITURGIE_ID`
    - Ersten verfügbaren Stil-Key aus `actor.misc.uebernatuerliche_stile_list` (außer `"ohne"`) ermitteln → `STIL_KEY`
4. Precondition-Guard: `FERTIGKEIT_NAME`, `LITURGIE_NAME`, `STIL_KEY` dürfen nicht leer sein (sonst `test.fail()`).

### Phase 1 — Tab öffnen & Stil-Select setzen

5. Actor-Sheet öffnen (`openActorSheet`).
6. Nav-Tab `[data-tab="uebernatuerlich"]` anklicken.
7. Warten bis `section.tab.uebernatuerlich` sichtbar ist.
8. Stil-Select `select.selected-uebernatuerlicher-stil` per API vorher auf `"ohne"` zurücksetzen (idempotent).
9. Stil-Select auf `STIL_KEY` setzen (`selectOption`).
10. Warten bis `actor.system.misc.selected_uebernatuerlicher_stil === STIL_KEY`.

### Phase 2 — ausklappView Fertigkeit

11. Name-Label der Fertigkeit `label[data-action="ausklappView"]` mit Text `FERTIGKEIT_NAME` klicken.
12. Expandierten Row `#ausklappen-view-{FERTIGKEIT_ID}` hat **nicht** mehr Klasse `hero-expandable-row-hidden`.
13. Beschreibungstext-Container `.hero-expandable-row-cell label.hero-text-preformatted` (innerhalb des Rows) ist sichtbar und nicht leer.
14. Erneutes Klicken klappt die Zeile wieder ein (Klasse `hero-expandable-row-hidden` ist wieder vorhanden).

### Phase 3 — ausklappView Liturgie

15. Name-Label der Liturgie `label[data-action="ausklappView"]` mit Text `LITURGIE_NAME` klicken.
16. Expandierten Row `#ausklappen-view-{LITURGIE_ID}` hat **nicht** mehr Klasse `hero-expandable-row-hidden`.
17. Beschreibungstext-Container `.hero-expandable-row-cell .hero-text-preformatted` (innerhalb des Rows) ist sichtbar und nicht leer.
18. Erneutes Klicken klappt die Zeile wieder ein.

### Phase 4 — Fertigkeit PW-Zelle → direkter Chat-Würfelwurf

> **Hinweis**: `data-rolltype="uebernatuerliche_fertigkeit"` öffnet **keinen** Dialog (im Gegensatz zu `karma_diag`/`magie_diag`). Der Klick auf die PW-Zelle löst einen direkten Würfelwurf in den Chat aus.

19. Chat-Message-Zähler vor dem Klick merken.
20. PW-Zelle `td[data-action="rollable"][data-rolltype="uebernatuerliche_fertigkeit"][data-fertigkeit="${FERTIGKEIT_NAME}"]` klicken.
21. Warten bis eine neue Chat-Nachricht erscheint (`game.messages.contents.length` gestiegen).
22. Negativprüfung: kein `.application.uebernatuerlich-dialog` im DOM (`toHaveCount(0)`).

### Phase 5 — Roll-Dialog Liturgie öffnen

23. Negativprüfung vor Klick: kein Dialog sichtbar (`toHaveCount(0)`).
24. Icon-Zelle `td[data-action="rollable"][data-rolltype="karma_diag"][data-itemid="${LITURGIE_ID}"]` klicken.
25. Dialog `.application.uebernatuerlich-dialog` ist sichtbar.
26. Dialog sofort schließen.
27. Dialog nicht mehr sichtbar.

---

## Erwartetes Ergebnis (Then)

| Assertion                                                          | Bedingung |
| ------------------------------------------------------------------ | --------- |
| Stil-Select zeigt `STIL_KEY` nach Setzen                           | ✅        |
| `actor.system.misc.selected_uebernatuerlicher_stil === STIL_KEY`   | ✅        |
| Fertigkeit-Row expandiert (keine `hero-expandable-row-hidden`)     | ✅        |
| Fertigkeit-Beschreibungstext sichtbar und nicht leer               | ✅        |
| Fertigkeit-Row kollabiert nach zweitem Klick                       | ✅        |
| Liturgie-Row expandiert                                            | ✅        |
| Liturgie-Beschreibungstext sichtbar und nicht leer                 | ✅        |
| Liturgie-Row kollabiert nach zweitem Klick                         | ✅        |
| Übernatürlich-Dialog nach Liturgie-Roll-Click sichtbar             | ✅        |
| Übernatürlich-Dialog nach Schließen nicht mehr sichtbar            | ✅        |
| Neue Chat-Nachricht nach Fertigkeit-PW-Klick (direkter Würfelwurf) | ✅        |

---

## Negative Checks

- Vor dem ausklappView-Klick darf `#ausklappen-view-{FERTIGKEIT_ID}` **nicht** sichtbar sein (Klasse `hero-expandable-row-hidden` vorhanden).
- Nach dem zweiten Klick (Einklappen) muss die Klasse wieder da sein.
- Dialog darf **nicht** sichtbar sein bevor der Liturgie-Roll-Click erfolgt.
- Nach dem Fertigkeit-PW-Klick darf **kein** Dialog erscheinen (es ist ein direkter Roll).

---

## Bekannte Einschränkungen / Pitfalls

- **Laufzeit-Discovery ist zwingend**: HatAlles-Items sind nur im laufenden Foundry verfügbar, nicht in `_source/` JSON. Fertigkeit- und Liturgie-Namen sowie IDs werden via `page.evaluate` ermittelt.
- **`ausklappView` auf `<tr>` vs. `<label>`**: Bei Fertigkeiten ist der `<tr class="main-row">` selbst klickbar, bei Liturgien **nur** die Name-`<label>`. Beide Tests klicken auf die Name-`<label>` (uniformer Ansatz).
- **Klassen-basierte Visibility**: Die Zeilen werden per CSS-Klasse `hero-expandable-row-hidden` ausgeblendet (kein `display:none`). Playwright `toBeVisible()` funktioniert hier nicht direkt — stattdessen `not.toHaveClass('hero-expandable-row-hidden')` verwenden.
- **Stil-Select**: `selectOption` setzt den Wert und triggert `_onSelectedUebernatuerlichenStil` → `actor.update()`. Anschließend `waitForFunction` gegen `game.actors`.
- **Dialog-Close**: Der `X`-Button in AppV2 ist `button[data-action="close"]`. Nach dem Klick auf `waitFor({state:'hidden'})` warten.
- **Kein Snapshot für Items nötig**: Der Test löscht keine Items und ändert nur `system.misc.selected_uebernatuerlicher_stil` — der Snapshot-Restore stellt das zurück.
