<!-- DEPRECATED: The canonical test specification is now in openspec/specs/<capability>/spec.md. This file is retained for reference only. -->

# E2E-018: Notizen-Tab

## Ziel

Prüft die UI-Interaktionen im **Notizen-Tab** des Helden-Sheets und sichert das Tab-ID-Refactoring (`notes` → `notizen`, PR-A) als Baseline ab:

1. **Tab-ID-Discovery**: Tab-ID wird per DOM-Discovery aus `nav a[data-tab]` (Text "Notizen") ermittelt — kein Hardcode der ID.
2. **Tab öffnen**: Der Notizen-Tab öffnet sich korrekt und rendert die `prose-mirror`-Komponente.
3. **Daten setzen**: Testtext wird per Foundry-API gesetzt und Persistenz in der Datenbank bestätigt.
4. **Tab-Wechsel und Rückkehr**: Nach Wechsel auf den Attribute-Tab und Rückkehr zum Notizen-Tab ist der Text weiterhin sichtbar (DOM-Persistenz).
5. **Cleanup**: `restoreActorFromDefaultSnapshot` stellt `system.notes` wieder her.

> Dieser Test ist ein **Canary für PR-A**: Wenn die Tab-ID von `notes` auf `notizen` umbenannt wird, verändert sich `notesTabId` in der Discovery automatisch — ohne Testanpassung. Die Spec bleibt grün, solange der Tab `nav a[data-tab]` mit Text "Notizen" existiert und `section[data-tab="<entdeckte-ID>"]` korrekt rendert.

---

## Metadaten

| Feld        | Wert                                                               |
| ----------- | ------------------------------------------------------------------ |
| ID          | E2E-018                                                            |
| Slug        | `e2e-018-notizen-tab`                                              |
| Held        | `HatAlles`                                                         |
| Foundry-URL | `process.env.E2E_FOUNDRY_URL` (Standard: `http://localhost:30000`) |
| Benutzer    | `Gamemaster`                                                       |
| Welt        | `Vanilla Ilaris`                                                   |
| Passwort    | Kein (offene Welt)                                                 |

---

## Voraussetzungen (Given)

- Foundry VTT läuft und die Welt „Vanilla Ilaris" ist gestartet.
- Der Held **`HatAlles`** existiert in der Welt.
- Der Notizen-Tab ist im Helden-Sheet per `nav a[data-tab]` mit Text „Notizen" erreichbar.
- `system.notes` ist ein schreibbares Stringfeld im Actor-Datenmodell.

---

## Testschritte (When)

### Phase 0 — Login & Setup

1. Login und Welt beitreten (`loginAndJoinWorld`).
2. Snapshot von `HatAlles` für `afterEach`-Restore erstellen.

### Phase 1 — HeldenSheet öffnen

3. Actor-Sheet öffnen (`openActorSheet`).

### Phase 2 — Tab-ID-Discovery

4. `nav a[data-tab]` mit Text „Notizen" per Locator-Filter finden.
5. `data-tab`-Attribut auslesen → `notesTabId`.
6. Precondition-Guard: `notesTabId` darf nicht `null` sein (sonst `test.fail()`).

### Phase 3 — Notizen-Tab aktivieren

7. Den Tab-Link anklicken.
8. `section[data-group="primary"][data-tab="${notesTabId}"]` muss sichtbar werden.

### Phase 4 — Testtext setzen

9. Per `page.evaluate` → `actor.update({ 'system.notes': 'Testtext E2E-018' })`.
10. Warten bis `actor.system.notes === 'Testtext E2E-018'` (Foundry-Runtime-Check).

### Phase 5 — Tab-Wechsel und Rückkehr

11. Attribute-Tab `[data-tab="attribute"]` anklicken.
12. Attribute-Section sichtbar warten.
13. Notizen-Tab-Link erneut anklicken.
14. Notes-Section wieder sichtbar warten.

### Phase 6 — Persistenz prüfen

15. `notesSection.toContainText('Testtext E2E-018')` — Text muss nach Rückkehr sichtbar sein.

---

## Erwartetes Ergebnis (Then)

| #   | Erwartung                                                                                |
| --- | ---------------------------------------------------------------------------------------- |
| 1   | `nav a[data-tab]` mit Text „Notizen" ist sichtbar und liefert eine nicht-leere Tab-ID.   |
| 2   | `section[data-tab="${notesTabId}"]` wird nach Tab-Klick sichtbar.                        |
| 3   | `system.notes` wird nach `actor.update` korrekt in der Foundry-Runtime gespeichert.      |
| 4   | Nach Tab-Wechsel und Rückkehr zeigt die Notes-Section den Testtext „Testtext E2E-018".   |
| 5   | `afterEach` stellt `system.notes` auf den ursprünglichen Wert zurück (Snapshot-Restore). |

---

## Negativprüfungen

- Kein `console.error` während der Interaktion.
- Kein sichtbarer Fehlerdialog (`.notification.error`, `.dialog.error`).
