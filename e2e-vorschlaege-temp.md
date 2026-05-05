# E2E-Test-Vorschläge — Ilaris FoundryVTT

> **Temporäre Datei** — kann nach Verwendung gelöscht werden.

---

## Bereits vorhandene Tests (E2E-001 bis E2E-007)

| ID      | Bereich                                                              |
| ------- | -------------------------------------------------------------------- |
| E2E-001 | Nahkampf-Angriffsdialog, Basis-Würfelwurf                            |
| E2E-002 | Kreatur-Waffe AT editieren                                           |
| E2E-003 | Manöver-Kombination (Wuchtschlag + Gezielter Schlag + Schildspalter) |
| E2E-004 | Wunden-Modifier im Kampfdialog (inkl. Kalte Wut)                     |
| E2E-005 | Patzer / Triumph / Normalwurf                                        |
| E2E-006 | Fertigkeit-Würfeldialog (6 Würfelkombinationen mit Schips)           |
| E2E-007 | Heldensheet Header + Sidebar (Schips, Wunden, Attribut-PWs, Energie) |

---

## Neue Vorschläge

### Kampfsystem — fehlende Pfade

#### E2E-008: Fernkampf-Angriffsdialog

- **Klasse**: `FernkampfAngriffDialog` (`scripts/combat/dialogs/fernkampf_angriff.js`) — komplett ungetestet
- **Vorbedingungen**: Testlauf-Held besitzt eine Fernkampfwaffe
- **Testschritte**: Fernkampfwaffe im Kampf-Tab wählen → Dialog öffnen → Reichweite, Gelände-Selects ausfüllen → angreifen → Chat-Nachricht prüfen (Flavor, Würfelformel, dice-total) → Schaden würfeln → Schaden-Chat prüfen
- **Spezialfälle**: Patzer/Triumph analog E2E-005, Sichtbarkeit der Fernkampf-Modifier

#### E2E-009: Übernatürliche Fertigkeit — Zauber/Liturgie-Würfelwurf

- **Klasse**: `UebernatuerlichDialog` (`scripts/combat/dialogs/uebernatuerlich.js`) — komplett ungetestet
- **Vorbedingungen**: HatAlles besitzt mindestens eine übernatürliche Fertigkeit (Zauber oder Liturgie)
- **Testschritte**: Übernatürliche Fertigkeiten-Tab öffnen → Roll-Icon klicken → Dialog erscheint → AsP-Kosten anzeigen prüfen → würfeln → Energie-Abrechnung: „Erfolg" und „Misserfolg" je einmal testen → Chat-Nachricht je prüfen
- **Spezialfall**: Blutmagie / Verbotene Pforten als Manöver (falls Testcharakter entsprechende Vorteile hat)

#### E2E-010: Verteidigungsdialog (Parade / Ausweichen)

- **Hook**: `defense_button_hook.js` — kein Test vorhanden
- **Vorbedingungen**: Zwei Akteure auf der Szene; `useTargetSelection`-Setting aktiv
- **Testschritte**: Gegner targeten → Angriff auslösen → Verteidigungs-Button im Chat anklicken → Dialog erscheint → Parade würfeln → Chat-Nachricht prüfen
- **Hinweis**: Canvas-Interaktion (Targeting) ist mit Playwright komplex; ggf. per `page.evaluate` erledigen

---

### Heldensheet-Tabs — ungetestet

#### E2E-011: Kampfstil-Auswahl und Berittener Kampf

- **Template**: `scripts/actors/templates/held/tabs/kampf.hbs`
- **Testschritte**: Kampfstil-Dropdown auf einen Stil mit Bedingungen setzen → Warnung (`.hero-kampf-alert-warning`) erscheint → Beritten-Checkbox aktivieren → Angriffsdialog öffnen → AT-Modifier aus Kampfstil im Dialog prüfen

#### E2E-012: Inventar-Tab — Geld und Gegenstände

- **Template**: `scripts/actors/templates/held/tabs/inventar.hbs`
- **Testschritte**: Dukaten- und Silbertaler-Felder befüllen → „zusammenrechnen"-Button klicken → Anzeige normalisiert sich → Neuen Gegenstand über „+" anlegen → Name eingeben → Gegenstand in Liste erscheint → Gegenstand löschen

#### E2E-013: Übernatürliche Fertigkeiten-Tab

- **Template**: `scripts/actors/templates/held/tabs/uebernatuerlich.hbs`
- **Testschritte**: Übernatürlichen Stil-Select befüllen (falls Vorteil vorhanden) → Fertigkeit-Zeile aufklappen (ausklappView) → Beschreibungstext erscheint → Roll-Icon klicken → Dialog öffnet sich (Abbruch ohne Würfeln)

#### E2E-014: Effekte-Tab

- **Template**: `scripts/actors/templates/held/tabs/effekte.hbs`
- **Testschritte**: Aktiven Effekt per Foundry-API anlegen (Dauer = 2 Runden) → Effekte-Tab öffnen → Effekt erscheint mit Dauer → Löschen-Button klicken → Effekt verschwindet
- **Negativprüfung**: Effekte mit `sourceType: vorteil` haben keinen Löschen-Button

---

### Fertigkeiten — Spezialfälle

#### E2E-015: Profane Fertigkeit mit Talent (PWT-Würfeldialog)

- E2E-006 testet `fertigkeit_diag`, aber `profan_fertigkeit_pwt` (Talent-PW-Spalte) ist ungetestet
- **Testschritte**: Fertigkeit mit mindestens einem Talent öffnen → PW(T)-Wert anklicken → Dialog erscheint mit Talent-Modifier → würfeln → Formel enthält PWT-Wert

#### E2E-016: Freie Fertigkeit / Freies Talent

- **Sheets**: `freie_fertigkeit.js`, `freies_talent.js` — kein E2E
- **Testschritte**: „Neue Fertigkeit"-Button im Fertigkeiten-Tab klicken → Sheet öffnet sich → Name und FW eintragen → speichern → Fertigkeit erscheint in der Tabelle → Roll-Icon funktioniert

---

### Importer

#### E2E-017: Sephrasto XML-Import

- **Klasse**: `XmlCharacterImporter` (`scripts/importer/xml_character_importer.js`) — komplett ungetestet im E2E
- **Vorbedingungen**: Test-XML-Datei als Fixture anlegen (`e2e/shared/fixtures/test-character.xml`)
- **Testschritte**: Import-Button aufrufen → XML-Datei hochladen → Bestätigungs-Dialog mit Importdetails prüfen → Bestätigen → Actor erscheint in der Akteursliste → Attribute, eine Fertigkeit und eine Waffe verifizieren → Actor per API wieder löschen (Teardown)
- **Hinweis**: Minimales XML empfohlen (nur Pflichtfelder), um Fixture-Pflege gering zu halten

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
