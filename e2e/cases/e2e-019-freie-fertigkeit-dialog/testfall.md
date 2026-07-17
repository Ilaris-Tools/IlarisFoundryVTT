<!-- DEPRECATED: The canonical test specification is now in openspec/specs/<capability>/spec.md. This file is retained for reference only. -->

# E2E-019: Freie Fertigkeit Würfeldialog

## Ziel

Prüft, dass **Freie Fertigkeiten** im Fertigkeiten-Tab korrekt gerendert werden und der zugehörige **Würfeldialog** (`FertigkeitDialog`) per Klick auf das Würfel-Icon geöffnet werden kann. Sichert das Typ-String-Refactoring (`freie_fertigkeit` → `freieFertigkeit`, PR-F) als Baseline ab:

1. **Laufzeit-Discovery**: Erstes Item mit `i.type === 'freie_fertigkeit'` aus `HatAlles.items` ermitteln.
2. **Fertigkeiten-Tab**: Freie Fertigkeit wird im Tab gerendert.
3. **Würfeldialog öffnen**: Klick auf `[data-rolltype="fertigkeit_diag"][data-probetype="freie_fertigkeit"]` öffnet den `FertigkeitDialog`.
4. **Dialog schließen**: Dialog schließt korrekt (kein JS-Fehler).
5. **Cleanup**: `restoreActorFromDefaultSnapshot`.

> Dieser Test ist ein **Canary für PR-F**: Nach der Migration von `freie_fertigkeit` → `freieFertigkeit` muss der `page.evaluate`-Discovery-Block auf `i.type === 'freieFertigkeit'` aktualisiert werden. Solange die Migration aussteht, schlägt der Discovery-Block fehl → `test.fail()` zeigt den Migrationsstatus an.

---

## Metadaten

| Feld        | Wert                                                               |
| ----------- | ------------------------------------------------------------------ |
| ID          | E2E-019                                                            |
| Slug        | `e2e-019-freie-fertigkeit-dialog`                                  |
| Held        | `HatAlles`                                                         |
| Foundry-URL | `process.env.E2E_FOUNDRY_URL` (Standard: `http://localhost:30000`) |
| Benutzer    | `Gamemaster`                                                       |
| Welt        | `Vanilla Ilaris`                                                   |
| Passwort    | Kein (offene Welt)                                                 |

---

## Voraussetzungen (Given)

- Foundry VTT läuft und die Welt „Vanilla Ilaris" ist gestartet.
- Der Held **`HatAlles`** existiert in der Welt.
- `HatAlles` besitzt mindestens ein Item vom Typ `freie_fertigkeit` (vor PR-F) bzw. `freieFertigkeit` (nach PR-F).
- Der Fertigkeiten-Tab rendert Freie Fertigkeiten in `section.tab.fertigkeiten tbody` mit `data-rolltype="fertigkeit_diag"` und `data-probetype="freie_fertigkeit"`.

---

## Testschritte (When)

### Phase 0 — Login & Setup

1. Login und Welt beitreten (`loginAndJoinWorld`).
2. Snapshot von `HatAlles` für `afterEach`-Restore erstellen.

### Phase 1 — Laufzeit-Discovery

3. `page.evaluate` → erstes Item mit `i.type === 'freie_fertigkeit'` aus `actor.items` ermitteln:
    - `freieFertigkeitName` (Itemname)
    - `freieFertigkeitId` (Item-ID)
4. Precondition-Guard: Beide Werte dürfen nicht `null` sein (sonst `test.fail()`).

> **Canary-Kommentar im Code**: Dieser Block trägt einen expliziten Kommentar, dass er nach PR-F auf `freieFertigkeit` aktualisiert werden muss.

### Phase 2 — HeldenSheet & Fertigkeiten-Tab

5. Actor-Sheet öffnen (`openActorSheet`).
6. Nav-Tab `[data-tab="fertigkeiten"]` anklicken.
7. `section.tab.fertigkeiten` sichtbar warten.

### Phase 3 — Würfel-Icon klicken

8. Würfel-Icon `td[data-action="rollable"][data-rolltype="fertigkeit_diag"][data-probetype="freie_fertigkeit"][data-fertigkeit="${freieFertigkeitName}"]` sichtbar warten.
9. Icon anklicken.

### Phase 4 — Dialog prüfen

10. `.application.ilaris.fertigkeit-dialog` (letztes) sichtbar warten.
11. Dialog enthält Text „Fertigkeitsprobe:".

### Phase 5 — Dialog schließen

12. `button[data-action="close"]` innerhalb des Dialogs klicken.
13. Dialog wechselt in State `hidden`.

---

## Erwartetes Ergebnis (Then)

| #   | Erwartung                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------- |
| 1   | Discovery liefert `freieFertigkeitName` und `freieFertigkeitId` (nicht null).                        |
| 2   | `section.tab.fertigkeiten` wird nach Tab-Klick sichtbar.                                             |
| 3   | Das Würfel-Icon `[data-rolltype="fertigkeit_diag"][data-probetype="freie_fertigkeit"]` ist sichtbar. |
| 4   | Klick öffnet `.application.ilaris.fertigkeit-dialog` mit Text „Fertigkeitsprobe:".                   |
| 5   | Dialog schließt sich nach Klick auf `button[data-action="close"]` ohne Fehler.                       |
| 6   | `afterEach` stellt `HatAlles` per Snapshot-Restore wieder her.                                       |

---

## Negativprüfungen

- Kein `console.error` während der Interaktion.
- Nach Schließen: `.application.ilaris.fertigkeit-dialog` ist nicht mehr sichtbar (state: hidden).
