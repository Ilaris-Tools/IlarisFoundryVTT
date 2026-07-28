## 🧾 Checkliste Major Release

### 📋 Technische Vorbereitung

- [ ] Neue Version in system.json (zB `x.1.x` auf `x.2.x`)
- [ ] Prüfe den dazugehörigen Meilenstein und ob ggf. noch offene Issues auf die nächste version geschoben werden.
- [ ] Updates im Changelog (Blick auf commits seit letztem eintrag und closed issues im Meilenstein)
- [ ] Falls nötig werden Spielwelten automatisch migriert?
- [ ] Sind die migrations getested und gut dokumentiert? Hinweise/Anleitungen?
- [ ] Sind sonstige Anpassungen der Dokumentation nötig?
- [ ] Ist das Update eine Erwähnung im Forum wert?
- [ ] Branch `foundryvtt-v*` vom letzten kompatiblen stand anlegen wenn eine ältere FoundryVTT version nicht mehr supported wird.
-   - [ ] In der system.json, die alte Versionsnummer verwenden und die download url anpassen
-   - [ ] In der Readme die manifest url anpassen und ggf. ein spoiler nach ganz oben setzen, das dies nicht die neuste version ist.

### 🧪 Erweiterte Manuelle Testfälle (für Major Release erforderlich)

#### Charaktererstellung und Import/Export (Umfangreich)

- [ ] **Sephrasto Integration**: Mehrere umfangreiche Charaktere (viele Vorteile, Waffen, Zauber etc.) in Sephrasto erstellen und ex-/importieren. **Automatisiert:** E2E-016; **manuell:** mehrere echte Sephrasto-Exporte.
- [ ] **Foundry Charaktererstellung**: Mindestens 2-3 neue Charaktere verschiedener Archetypen in Foundry anlegen und per Hand "skillen" und bearbeiten. **Manuell:** unterschiedliche Erstellungs- und Bedienflüsse.
- [ ] **Datenintegrität**: Charakterdaten nach Import/Export vollständig und korrekt. **Automatisiert:** E2E-016 und E2E-020; **manuell:** fachliche Vollständigkeit repräsentativer Daten.

#### Charaktersheet-Funktionalität (Vollständig)

- [ ] **Alle Charaktersheet-Tabs**: In jedem Tab des Charaktersheets verschiedene Werte bearbeiten, speichern und wieder löschen. **Automatisiert:** E2E-007, E2E-013 bis E2E-015, E2E-018 und E2E-019; **manuell:** vollständiger Bedienfluss.
- [ ] **Vorteile-Management**: Vorteile hinzufügen, entfernen und bearbeiten. **Automatisiert:** E2E-017; **manuell:** eigene Vorteile bearbeiten und entfernen.
- [ ] **Ausrüstung-Management**: Waffen, Rüstungen und Gegenstände hinzufügen, bearbeiten und entfernen. **Automatisiert:** E2E-013; **manuell:** UI- und Sonderfälle.
- [ ] **Talente und Fertigkeiten**: Talentpunkte verteilen und Fertigkeitswerte ändern. **Automatisiert:** E2E-006 und E2E-019; **manuell:** Verteilung und Grenzwerte.
- [ ] **Werte-Persistierung**: Alle Änderungen bleiben nach Neuladen und Sitzungsende bestehen. **Automatisiert:** E2E-024; **manuell:** alle Bereiche und Sitzungsende.

#### Kreaturenverwaltung (Erweitert)

- [ ] **Kompendium-Kreaturen**: 5-8 verschiedene Kreaturen aus dem Kompendium in die Szene ziehen. **Automatisiert:** E2E-024 (3 Kreaturen); **manuell:** größere Stichprobe.
- [ ] **Verschiedene Kreaturentypen**: Unterschiedliche Kreaturenarten testen (Menschen, Tiere, Magische Wesen etc.). **Manuell:** repräsentative Auswahl über den Belastungstest hinaus.
- [ ] **Kreaturenproben**: Umfangreiche Probenwürfe mit verschiedenen Kreaturentypen. **Automatisiert:** E2E-024; **manuell:** weitere Typen und Sonderregeln.
- [ ] **Kreaturen-Sheets**: Detaillierte Bearbeitung der Kreaturen-Sheets (Werte, Vorteile, Ausrüstung). **Automatisiert:** E2E-002 und E2E-024; **manuell:** Vorteile und Ausrüstung.

#### Browser-Kompatibilität (Mehrere Browser)

- [ ] **Chrome/Chromium**: Foundry erfolgreich öffnen und Grundfunktionen testen. **Automatisiert:** Playwright-E2E im konfigurierten Chromium-Kanal; **manuell:** installierten Zielbrowser prüfen.
- [ ] **Firefox**: Foundry erfolgreich öffnen und Grundfunktionen testen. **Manuell:** kein Firefox-E2E-Kanal konfiguriert.
- [ ] **Edge/Safari** (optional): Zusätzliche Browser-Tests wenn verfügbar. **Manuell:** browser- und plattformspezifische Prüfung.

#### Kampfsystem (Vollständig)

- [ ] **Komplexer Kampf**: Mehrere komplexe Kämpfe mit verschiedenen Teilnehmern durchführen. **Automatisiert:** E2E-010 und E2E-011; **manuell:** weitere Gruppenkonstellationen.
- [ ] **Manöver-System**: Verschiedene Manöver testen und prüfen, dass alle Modifier beim Manöver mit denen im Chat übereinstimmen. **Automatisiert:** E2E-003, E2E-012 und E2E-017.
- [ ] **Zauber-System**: Zauber im Kampf einsetzen und Auswirkungen prüfen. **Automatisiert:** E2E-009, E2E-025 bis E2E-028 und E2E-030 (Heilung); **manuell:** weitere Zauberarten.
- [ ] **Energieverwaltung**: Detaillierte Prüfung der Energie-/Ausdauer-/Fokus-Verwaltung. **Automatisiert:** E2E-009; **manuell:** Kombinationen der Energiearten.
- [ ] **Schadenssystem**: Schäden korrekt anwenden und Heilung testen. **Automatisiert:** E2E-004, E2E-010, E2E-011, E2E-025 und E2E-030; **manuell:** weitere Heilungsarten und Sonderfälle.
- [ ] **Initiative und Rundenmanagement**: Initiative-System und Rundenverwaltung testen. **Manuell:** keine E2E-Abdeckung.

#### Kompendien und Datenbanken

- [ ] **Alle Kompendien**: Zugriff und Funktionalität aller Kompendien prüfen. **Automatisiert:** E2E-017 und E2E-024; **manuell:** vollständige Pack-Abdeckung.
- [ ] **Such- und Filterfunktionen**: Suche in Kompendien und Filteroptionen testen. **Manuell:** keine E2E-Abdeckung.
- [ ] **Daten-Konsistenz**: Stichproben auf Vollständigkeit und Korrektheit der Kompendium-Einträge. **Manuell:** fachliche Datenprüfung.

#### Systemeinstellungen und Konfiguration

- [ ] **Welteinstellungen**: Manöver- und Vorteil-Kompendien-Konfiguration sowie Schadenstypen testen. **Automatisiert:** E2E-017 und E2E-031 (Schadenstypen); **manuell:** übrige Konfiguration.
- [ ] **Spieler-Berechtigungen**: Verschiedene Spieler-Berechtigungsstufen testen. **Automatisiert:** E2E-011 deckt Besitzerrechte ab; **manuell:** weitere Rollen.
- [ ] **Modul-Kompatibilität**: Kompatibilität mit häufig verwendeten Foundry-Modulen prüfen. **Manuell:** die E2E-Baseline verwendet keine Drittmodule.

### 🏷️ Labels

- Release relevant: [ ] Ja [ ] Nein
