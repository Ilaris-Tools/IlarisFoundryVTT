## Major Release Bedarfe aus Abgleich: Checkliste vs vorhandene E2E

Stand: 2026-05-08
Quelle Checkliste: `.github/PULL_REQUEST_TEMPLATE/pr_major_release.md`
Abgleich gegen: `e2e/cases/e2e-001` bis `e2e/cases/e2e-020`

### 1) Bereits gut per E2E abgedeckt

- Kampfdialoge Nahkampf/Fernkampf inkl. Patzer/Triumph und Modifier
    - E2E-001, E2E-003, E2E-004, E2E-005, E2E-008, E2E-017
- Zielauswahl, Verteidigung, Schaden, Multiplayer-Gegenangriff
    - E2E-010, E2E-011
- Kampfstile/Beritten
    - E2E-012, E2E-017
- Uebernatuerlich-Dialog, Energie-/AsP-Logik, Sonderfaelle
    - E2E-009
- Heldenblatt-Teilbereiche und Persistenz in einzelnen Tabs
    - E2E-007, E2E-013, E2E-014, E2E-015, E2E-018, E2E-019
- Sephrasto XML-Import
    - E2E-016
- Startup-Migration Legacy-Types
    - E2E-020

### 2) Teilweise abgedeckt (fuer Major Release noch erweitern)

- Charakterdatenintegritaet nach Import/Export
    - Import wird getestet (E2E-016), aber kein End-to-End Export+Reimport Vergleichstest.
- Vollstaendigkeit "alle Charaktersheet-Tabs"
    - Viele Tabs sind einzeln getestet, aber kein durchgaengiger "alles einmal anfassen" Regressionstest fuer 2-3 Archetypen.
- Kreaturenverwaltung umfangreich
    - Kreatur-AT-Edit ist getestet (E2E-002), aber nicht 5-8 Kompendium-Kreaturen inkl. unterschiedlicher Typen in Szene und Proben-Serien.

### 3) Klare Luecken (neu noetig)

- Browser-Kompatibilitaet
    - Playwright ist aktuell nur auf Chromium konfiguriert.
    - Es fehlen mindestens Firefox-Laeufe (optional Edge/Safari separat).
- Systemeinstellungen/Weltkonfiguration
    - Keine E2E-Abdeckung fuer Manoever-/Vorteil-Kompendium-Konfiguration in Welteinstellungen.
- Spieler-Berechtigungen
    - Multiplayer-Kampffluss existiert (E2E-011), aber keine matrixartige Rechtepruefung pro Rolle/Funktion.
- Modul-Kompatibilitaet
    - Keine E2E-Smoketests mit haeufig genutzten Foundry-Modulen.
- Kompendium-Suche/Filter
    - Kein dedizierter E2E-Test fuer Such- und Filterfunktionen ueber mehrere Kompendien.
- Doku-Luecke im E2E-Bestand
    - Fuer E2E-020 fehlt `testfall.md` (die anderen Faelle sind weitgehend dokumentiert).

### 4) Nicht-E2E, aber fuer Major-Release-PR noetige Artefakte

- `system.json` Version bump auf neue Major/Minor Zielversion
- Changelog-Eintrag aus Commits + Milestone-Issues
- Migrationshinweise (falls World-/Data-Migration relevant)
- Dokumentationsupdate (falls Verhalten/UI geaendert)
- Entscheidung/Notiz: Forum-Erwaehnung ja/nein
- Falls Foundry-Kompatibilitaet endet: Legacy-Branch `foundryvtt-v*` mit angepasster `system.json` und README-Manifest-URL

### 5) Vorschlag: konkrete neue E2E-Faelle

- E2E-021 Browser Smoke Matrix (Chromium + Firefox)
    - Login, Weltbeitritt, Actor oeffnen, 1 Probe, 1 Angriff, 1 Chat-Validierung.
- E2E-022 Charakter-Neuanlage in Foundry (Archetyp A/B/C)
    - Neuer Actor, Kernattribute/Fertigkeiten setzen, speichern, reload, persistiert.
- E2E-023 Import-Export-Roundtrip
    - Import (Sephrasto) -> Export -> Reimport -> Feldvergleich kritischer Daten.
- E2E-024 Kreaturen-Kompendium Belastungstest
    - 5-8 Kreaturen verschiedener Typen auf Szene, Proben + Sheet-Edits.
- E2E-025 Kompendium Suche/Filter
    - Mehrere Packs, Suchbegriffe, Filterkriterien, Ergebnisvalidierung.
- E2E-026 Welteinstellungen (Manoever-/Vorteil-Packs)
    - Konfig setzen, UI/Kampfdialog reflektiert Auswahl korrekt.
- E2E-027 Rechte-Matrix
    - GM/Spielerrollen: erlaubte/verbotene Aktionen gezielt pruefen.
- E2E-028 Modul-Kompatibilitaet Smoke
    - 2-3 priorisierte Module aktiv, Kernflows ohne Fehler.

### 6) Priorisierung fuer den naechsten Major Release

- P0 (vor Release): E2E-021, E2E-022, E2E-026, E2E-027
- P1 (sehr sinnvoll): E2E-023, E2E-024, E2E-025
- P2 (wenn Zeit): E2E-028

### 7) Akute naechste Schritte

- Playwright `projects` um Firefox erweitern und in CI/lokal ausfuehrbar machen.
- Fehlende Spezifikationsdatei fuer E2E-020 (`testfall.md`) nachziehen.
- 3 neue P0-Faelle als erste Tranche anlegen (021/022/026), danach Rechte-Matrix (027).
