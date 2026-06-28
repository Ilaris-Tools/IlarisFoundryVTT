# E2E-015: Effekte-Tab

## Ziel

Prüft die UI-Interaktionen im **Effekte-Tab** des Helden-Sheets:

1. **Vorteil-Effekte sichtbar**: Bestehende Effekte mit `sourceType: "vorteil"` werden im Tab angezeigt — ohne Dauer-Anzeige und **ohne** Löschen-Button.
2. **Testeffekt anlegen**: Einen manuellen ActiveEffect per Foundry-API auf dem Actor anlegen (Name: `E2E-Testeffekt`, Ilaris-Timing: `system.ilarisTiming.durationType: 'ownerTurns'`, `remaining: 2`, `originalValue: 2`).
3. **Dauer-Anzeige**: Der Testeffekt erscheint im Tab mit dem Text „2 Runden".
4. **Löschen**: Trash-Button klicken → Effekt verschwindet sofort (kein Bestätigungsdialog).
5. **Cleanup**: Testeffekt in `afterEach` per API löschen, falls der Test vorher abbricht.

---

## Metadaten

| Feld        | Wert                                                               |
| ----------- | ------------------------------------------------------------------ |
| ID          | E2E-015                                                            |
| Slug        | `e2e-015-effekte-tab`                                              |
| Held        | `HatAlles`                                                         |
| Foundry-URL | `process.env.E2E_FOUNDRY_URL` (Standard: `http://localhost:30000`) |
| Benutzer    | `Gamemaster`                                                       |
| Welt        | `Vanilla Ilaris`                                                   |
| Passwort    | Kein (offene Welt)                                                 |

---

## Voraussetzungen (Given)

- Foundry VTT läuft und die Welt „Vanilla Ilaris" ist gestartet.
- Der Held **`HatAlles`** existiert in der Welt.
- `HatAlles` besitzt mindestens einen Vorteil mit transferiertem ActiveEffect (`flags.ilaris.sourceType === "vorteil"`) — bekannte Effekte: `Geweiht I`, `Geweiht II`, `Zauberer III`.
- `HatAlles` hat zu Beginn des Tests **keinen** manuellen Effekt namens `E2E-Testeffekt` (wird durch Cleanup sichergestellt).

---

## Testschritte (When)

### Phase 0 — Login & Setup

1. Login und Welt beitreten (`loginAndJoinWorld`).
2. Snapshot von `HatAlles` erstellen (für `afterEach`-Restore).
3. Test-Effekt-ID-Variable initialisieren (`testEffectId = null`).

### Phase 1 — Effekte-Tab öffnen & Vorteil-Effekte prüfen

4. Actor-Sheet öffnen (`openActorSheet`).
5. Nav-Tab `[data-tab="effects"]` anklicken.
6. Warten bis `section.tab.effekte` sichtbar ist.
7. Ersten Vorteil-Effekt via `page.evaluate` ermitteln: ersten `appliedEffect` mit `flags.ilaris.sourceType === "vorteil"` → `VORTEIL_EFFECT_ID`, `VORTEIL_EFFECT_NAME`.
8. Vorteil-Effekt-Link `a[data-action="itemEdit"][data-itemid="${VORTEIL_EFFECT_ID}"]` ist sichtbar.
9. **Negativprüfung**: Kein Löschen-Button `a[data-action="itemDelete"][data-itemid="${VORTEIL_EFFECT_ID}"]` vorhanden (`toHaveCount(0)`).
10. Vorteil-Effekt-Link enthält keinen Text „Runden" (keine Dauer-Anzeige — Vorteil-Effekte sind ohne `duration.turns`).

### Phase 2 — Testeffekt anlegen

11. Testeffekt per `page.evaluate` anlegen:
    ```js
    actor.createEmbeddedDocuments('ActiveEffect', [
        {
            name: 'E2E-Testeffekt',
            icon: 'icons/svg/aura.svg',
            disabled: false,
            changes: [],
            flags: { ilaris: { sourceType: 'manual' } },
            system: {
                ilarisTiming: {
                    durationType: 'ownerTurns',
                    remaining: 2,
                    originalValue: 2,
                    expiresOn: 'turnStart',
                },
            },
        },
    ])
    ```
12. `testEffectId` aus dem Rückgabewert speichern.
13. Sheet neu rendern: `actor.sheet.render()` via `page.evaluate`.
14. Tab `[data-tab="effects"]` erneut anklicken (re-render-Sicherheit).

### Phase 3 — Testeffekt sichtbar & Dauer-Anzeige

15. Testeffekt-Edit-Link `a[data-action="itemEdit"][data-itemid="${testEffectId}"]` ist sichtbar.
16. Testeffekt-Link enthält Text „2 Runden" (Dauer-Anzeige via `{{effect.duration.turns}} Runden`).

### Phase 4 — Testeffekt löschen

17. Löschen-Button `a[data-action="itemDelete"][data-itemid="${testEffectId}"]` ist sichtbar.
18. Löschen-Button klicken.
19. Kein Bestätigungsdialog erwartet — Effekt wird direkt gelöscht.
20. Testeffekt-Edit-Link nicht mehr vorhanden: `toHaveCount(0)`.
21. `testEffectId = null` (Cleanup im `afterEach` nicht mehr nötig).

---

## Erwartetes Ergebnis (Then)

| Assertion                                 | Bedingung |
| ----------------------------------------- | --------- |
| Effekte-Tab ist sichtbar                  | ✅        |
| Vorteil-Effekt-Link ist sichtbar          | ✅        |
| Kein Löschen-Button für Vorteil-Effekt    | ✅        |
| Vorteil-Effekt zeigt keine „Runden"-Dauer | ✅        |
| Testeffekt erscheint nach Anlegen im Tab  | ✅        |
| Testeffekt-Link enthält „2 Runden"        | ✅        |
| Löschen-Button für Testeffekt vorhanden   | ✅        |
| Testeffekt nach Löschen nicht mehr im Tab | ✅        |

---

## Negative Checks

- Kein `a[data-action="itemDelete"]` für Vorteil-Effekte (Condition: `flags.ilaris.sourceType === "vorteil"`).
- Nach dem Klick auf den Löschen-Button erscheint **kein** Bestätigungsdialog.
- Nach dem Löschen ist der Testeffekt-Link **nicht** mehr im DOM vorhanden.

---

## Cleanup-Strategie

`restoreActorFromDefaultSnapshot` stellt nur `system` und `items` wieder her — **keine** `ActiveEffect`-Dokumente. Daher gilt:

- `testEffectId` wird als Variable im Test gehalten.
- Im `afterEach`: Falls `testEffectId !== null` (Test hat abgebrochen vor Phase 4), Effekt per API löschen:
    ```js
    actor.deleteEmbeddedDocuments('ActiveEffect', [testEffectId])
    ```
- Danach `restoreActorFromDefaultSnapshot` aufrufen (für etwaige system-Änderungen).

---

## Bekannte Einschränkungen / Pitfalls

- **`appliedEffects` enthält transferierte Item-Effekte**: Vorteil-Effekte kommen von Vorteil-Items mit `transfer: true`, erscheinen aber mit `flags.ilaris.sourceType === "vorteil"`.
- **Ilaris-Timing**: Effekte verwenden `system.ilarisTiming` mit `durationType: 'ownerTurns'`. Die Dauer-Anzeige im Tab zeigt `ilarisTiming.remaining` (nur wenn truthy und finite).
- **Tab-ID vs. CSS-Klasse**: Navigation per `data-tab="effects"`, Container per `section.tab.effekte`.
- **`data-itemid` nutzt `effect._id`**: Discovery via `page.evaluate` immer `.id` (ohne Underscore).
- **Kein Bestätigungsdialog**: `onItemDelete` im ActorSheet löscht `ActiveEffect` direkt ohne Dialog.
- **AppV2 re-render**: Nach `createEmbeddedDocuments` muss `actor.sheet.render()` aufgerufen werden, damit der Tab die neue Zeile zeigt.
