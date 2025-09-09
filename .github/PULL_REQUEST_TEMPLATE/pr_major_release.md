## 🧾 Checkliste Major Release

### 📋 Technische Vorbereitung

-   [ ] Neue Version in system.json (zB `x.1.x` auf `x.2.x`)
-   [ ] Prüfe den dazugehörigen Meilenstein und ob ggf. noch offene Issues auf die nächste version geschoben werden.
-   [ ] Updates im Changelog (Blick auf commits seit letztem eintrag und closed issues im Meilenstein)
-   [ ] Falls nötig werden Spielwelten automatisch migriert?
-   [ ] Sind die migrations getested und gut dokumentiert? Hinweise/Anleitungen?
-   [ ] Sind sonstige Anpassungen der Dokumentation nötig?
-   [ ] Ist das Update eine Erwähnung im Forum wert?
-   [ ] Branch `foundryvtt-v*` vom letzten kompatiblen stand anlegen wenn eine ältere FoundryVTT version nicht mehr supported wird.
-   -   [ ] In der system.json, die alte Versionsnummer verwenden und die download url anpassen
-   -   [ ] In der Readme die manifest url anpassen und ggf. ein spoiler nach ganz oben setzen, das dies nicht die neuste version ist.

### 🧪 Erweiterte Manuelle Testfälle (für Major Release erforderlich)

#### Charaktererstellung und Import/Export (Umfangreich)

-   [ ] **Sephrasto Integration**: Mehrere umfangreiche Charaktere (viele Vorteile, Waffen, Zauber etc.) in Sephrasto erstellen und ex-/importieren
-   [ ] **Foundry Charaktererstellung**: Mindestens 2-3 neue Charaktere verschiedener Archetypen in Foundry anlegen und per Hand "skillen" und bearbeiten
-   [ ] **Datenintegrität**: Charakterdaten nach Import/Export vollständig und korrekt

#### Charaktersheet-Funktionalität (Vollständig)

-   [ ] **Alle Charaktersheet-Tabs**: In jedem Tab des Charaktersheets verschiedene Werte bearbeiten, speichern und wieder löschen
-   [ ] **Vorteile-Management**: Vorteile hinzufügen, entfernen und bearbeiten
-   [ ] **Ausrüstung-Management**: Waffen, Rüstungen und Gegenstände hinzufügen, bearbeiten und entfernen
-   [ ] **Talente und Fertigkeiten**: Talentpunkte verteilen und Fertigkeitswerte ändern
-   [ ] **Werte-Persistierung**: Alle Änderungen bleiben nach Neuladen und Sitzungsende bestehen

#### Kreaturenverwaltung (Erweitert)

-   [ ] **Kompendium-Kreaturen**: 5-8 verschiedene Kreaturen aus dem Kompendium in die Szene ziehen
-   [ ] **Verschiedene Kreaturentypen**: Unterschiedliche Kreaturenarten testen (Menschen, Tiere, Magische Wesen etc.)
-   [ ] **Kreaturenproben**: Umfangreiche Probenwürfe mit verschiedenen Kreaturentypen
-   [ ] **Kreaturen-Sheets**: Detaillierte Bearbeitung der Kreaturen-Sheets (Werte, Vorteile, Ausrüstung)

#### Browser-Kompatibilität (Mehrere Browser)

-   [ ] **Chrome/Chromium**: Foundry erfolgreich öffnen und Grundfunktionen testen
-   [ ] **Firefox**: Foundry erfolgreich öffnen und Grundfunktionen testen
-   [ ] **Edge/Safari** (optional): Zusätzliche Browser-Tests wenn verfügbar

#### Kampfsystem (Vollständig)

-   [ ] **Komplexer Kampf**: Mehrere komplexe Kämpfe mit verschiedenen Teilnehmern durchführen
-   [ ] **Manöver-System**: Verschiedene Manöver testen und prüfen, dass alle Modifier beim Manöver mit denen im Chat übereinstimmen
-   [ ] **Zauber-System**: Zauber im Kampf einsetzen und Auswirkungen prüfen
-   [ ] **Energieverwaltung**: Detaillierte Prüfung der Energie-/Ausdauer-/Fokus-Verwaltung
-   [ ] **Schadenssystem**: Schäden korrekt anwenden und Heilung testen
-   [ ] **Initiative und Rundenmanagement**: Initiative-System und Rundenverwaltung testen

#### Kompendien und Datenbanken

-   [ ] **Alle Kompendien**: Zugriff und Funktionalität aller Kompendien prüfen
-   [ ] **Such- und Filterfunktionen**: Suche in Kompendien und Filteroptionen testen
-   [ ] **Daten-Konsistenz**: Stichproben auf Vollständigkeit und Korrektheit der Kompendium-Einträge

#### Systemeinstellungen und Konfiguration

-   [ ] **Welteinstellungen**: Manöver- und Vorteil-Kompendien-Konfiguration testen
-   [ ] **Spieler-Berechtigungen**: Verschiedene Spieler-Berechtigungsstufen testen
-   [ ] **Modul-Kompatibilität**: Kompatibilität mit häufig verwendeten Foundry-Modulen prüfen

### 🏷️ Labels

-   Release relevant: [ ] Ja [ ] Nein
