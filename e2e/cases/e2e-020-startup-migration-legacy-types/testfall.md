# E2E-020: Startup Migration Legacy Types

## Ziel

Prüft, dass beim Starten einer Welt mit einer veralteten `worldSchemaVersion` die Legacy-Typen automatisch migriert werden:

1. Die Welt startet mit einem künstlich auf eine alte Version gesetzten Schema-Stand.
2. Ein Actor mit eingebettetem Legacy-Item wird vor dem Reload angelegt.
3. Ein Welt-Item mit Legacy-Typ wird vor dem Reload angelegt.
4. Nach dem Reload und dem Foundry-Startup läuft die Migration im `ready`-Hook.
5. Sowohl Actor-Item als auch Welt-Item haben danach wieder den modernen Typ `freieFertigkeit`.
6. Die relevanten Feldtypen wurden von String auf Number normalisiert.

---

## Metadaten

| Feld          | Wert                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| ID            | E2E-020                                                                                                     |
| Slug          | `e2e-020-startup-migration-legacy-types`                                                                    |
| Testfall-Name | `startup-migration-legacy-types`                                                                            |
| Zielpfad      | `e2e/cases/e2e-020-startup-migration-legacy-types/`                                                         |
| Foundry-URL   | `process.env.E2E_FOUNDRY_URL` (Standard: `http://localhost:30000`)                                          |
| Benutzer      | `Gamemaster`                                                                                                |
| Welt          | `Vanilla Ilaris`                                                                                            |
| Passwort      | `E2E_FOUNDRY_PASSWORD` über die gemeinsame Foundry-Fixture, falls die Welt einen Login verlangt; sonst leer |

---

## Voraussetzungen (Given)

- Foundry VTT läuft und die Welt „Vanilla Ilaris“ ist verfügbar.
- Ein Login als `Gamemaster` ist möglich.
- Vor dem Test existieren keine Artefakte mit den Namen `E2E Migration Legacy Actor` und `E2E Migration Legacy World Item`.
- Die gemeinsame Foundry-Fixture `loginAndJoinWorld` kann die Welt laden und wartet auf den vollständigen Foundry-Start.

---

## Testschritte (When)

### Phase 0 — Login & Setup

1. Login und Welt beitreten (`loginAndJoinWorld`).
2. Bestehende Artefakte mit den Testnamen entfernen, falls ein vorheriger Lauf sie hinterlassen hat.

### Phase 1 — Legacy-Daten vorbereiten

3. Einen neuen Actor vom Typ `held` anlegen.
4. Ein eingebettetes Item mit dem modernen Typ `freieFertigkeit` erzeugen.
5. Dieses Embedded Item absichtlich auf den Legacy-Typ `freie_fertigkeit` zurücksetzen.
6. Ein Welt-Item mit dem modernen Typ `freieFertigkeit` erzeugen.
7. Dieses Welt-Item absichtlich auf den Legacy-Typ `freie_fertigkeit` zurücksetzen.
8. Die aktuelle `worldSchemaVersion` sichern und anschließend auf `13.1.0` setzen.

### Phase 2 — Neustart & Migration

9. Seite neu laden.
10. Warten, bis Foundry vollständig im Spiel (`/game`) angekommen ist.
11. Warten, bis `game.ready` und die relevanten UI-Elemente sichtbar sind.
12. Warten, bis die `worldSchemaVersion` nicht mehr auf `13.1.0` steht.

### Phase 3 — Verifikation

13. Den Actor aus `game.actors` laden.
14. Das eingebettete Item mit dem Namen `Legacy Freie Fertigkeit` suchen.
15. Das Welt-Item aus `game.items` laden.
16. Prüfen, dass beide Objekte den Typ `freieFertigkeit` haben.
17. Prüfen, dass `system.stufe` und `system.gruppe` bei beiden Objekten den Typ `number` haben.

### Phase 4 — Cleanup

18. Actor, Welt-Item und ursprüngliche `worldSchemaVersion` im `afterEach` wiederherstellen.

---

## Erwartetes Ergebnis (Then)

| Assertion                                                           | Erwartung |
| ------------------------------------------------------------------- | --------- |
| Foundry erreicht den Spielmodus erneut                              | ✅        |
| `game.ready` wird nach dem Reload erreicht                          | ✅        |
| `worldSchemaVersion` wechselt von `13.1.0` auf einen aktuellen Wert | ✅        |
| Eingebettetes Item heißt weiter `Legacy Freie Fertigkeit`           | ✅        |
| Eingebettetes Item hat Typ `freieFertigkeit`                        | ✅        |
| Welt-Item hat Typ `freieFertigkeit`                                 | ✅        |
| `system.stufe` ist bei beiden Objekten ein `number`                 | ✅        |
| `system.gruppe` ist bei beiden Objekten ein `number`                | ✅        |

---

## Negative Checks

- Vor dem Reload darf kein Objekt mit den Testnamen existieren.
- Nach der Migration dürfen weder Actor-Item noch Welt-Item den Legacy-Typ `freie_fertigkeit` behalten.
- Die Schema-Version darf nach dem Reload nicht dauerhaft auf `13.1.0` stehen bleiben.

---

## Cleanup-Strategie

- Actor und Welt-Item werden nach dem Test per API gelöscht.
- Die ursprüngliche `worldSchemaVersion` wird nach dem Test wiederhergestellt.
- Falls ein vorheriger Lauf Artefakte hinterlassen hat, werden diese vor dem eigentlichen Testlauf entfernt, damit der Test idempotent bleibt.

---

## Bekannte Pitfalls

1. Die Migration läuft asynchron im `ready`-Hook. Darum reicht ein einfacher Reload nicht aus; der Test muss explizit auf die geänderte Schema-Version warten.
2. Legacy-Typen werden absichtlich nur für den Test erzeugt. Die eigentliche Verifikation muss auf der persistenten Welt- und Actor-State-Ebene stattfinden, nicht nur auf UI-Text.
3. Die Login- und Startlogik wird über die gemeinsame Foundry-Fixture abgewickelt. Der Test sollte dort keine eigene Session-Logik duplizieren.
