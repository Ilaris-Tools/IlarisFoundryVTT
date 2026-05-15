# E2E-Test-Vorschläge — Ilaris FoundryVTT

> **Temporäre Datei** — kann nach Verwendung gelöscht werden.

---

## Neue Vorschläge

### Fertigkeiten — Spezialfälle

#### E2E-015: Profane Fertigkeit mit Talent (PWT-Würfeldialog)

- E2E-006 testet `fertigkeit_diag`, aber `profan_fertigkeit_pwt` (Talent-PW-Spalte) ist ungetestet
- **Testschritte**: Fertigkeit mit mindestens einem Talent öffnen → PW(T)-Wert anklicken → Dialog erscheint mit Talent-Modifier → würfeln → Formel enthält PWT-Wert

#### E2E-016: Freie Fertigkeit / Freies Talent

- **Sheets**: `freie_fertigkeit.js`, `freies_talent.js` — kein E2E
- **Testschritte**: „Neue Fertigkeit"-Button im Fertigkeiten-Tab klicken → Sheet öffnet sich → Name und FW eintragen → speichern → Fertigkeit erscheint in der Tabelle → Roll-Icon funktioniert

---

### Systemeinstellungen

#### E2E-018: LEP-System umschalten

- **Setting**: `lepSystem` (`IlarisGameSettingNames.lepSystem`)
- **Testschritte**: Setting per `game.settings.set(...)` aktivieren → Heldensheet öffnen → Wundabzüge-Anzeige zeigt LEP-Formel → Setting wieder deaktivieren → Anzeige kehrt zur Standardformel zurück

#### E2E-019: `realFumbleCrits` / `renameTriumphWithCrit`

- Baut auf E2E-005 auf (Patzer/Triumph)
- **Testschritte**: `renameTriumphWithCrit` aktivieren → Triumph-Würfeldurchgang aus E2E-005 wiederholen → Chat enthält „Kritischer Treffer" statt „Triumph" → Setting rücksetzen

---

### Kreatur-Sheet

#### E2E-020: Kreatur-Sheet Smoke-Test

- E2E-002 testet nur Waffe editieren — kein vollständiger Sheet-Test
- **Testschritte**: Kreatur-Sheet öffnen → Attribute-Tab: Werte prüfen → Kampf-Tab: Waffe vorhanden → Angriffsdialog starten → Dialog-Titel enthält Waffenname → Dialog schließen

---

## Priorisierung

| Prio    | IDs                                                  | Begründung                                              |
| ------- | ---------------------------------------------------- | ------------------------------------------------------- |
| Hoch    | E2E-008, E2E-009                                     | Kernfeatures (Fernkampf, Magie) komplett ohne Abdeckung |
| Mittel  | E2E-015, E2E-011, E2E-017                            | Häufig genutzt, Regressions-Risiko hoch                 |
| Niedrig | E2E-012, E2E-013, E2E-014, E2E-018, E2E-019, E2E-020 | Wichtig, aber stabiler                                  |
| Komplex | E2E-010                                              | Canvas-Targeting erschwert Playwright-Umsetzung         |

---

## Offene Fragen / Unknowns

- Besitzen die Testcharaktere in „Vanilla Ilaris" bereits Fernkampfwaffen und übernatürliche Fertigkeiten?
- Ist `defense_button_hook.js` per E2E testbar ohne echte Canvas-Interaktion?
- Welches minimale XML-Format akzeptiert der Sephrasto-Importer (für E2E-017-Fixture)?
