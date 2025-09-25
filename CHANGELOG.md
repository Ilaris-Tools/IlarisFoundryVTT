# Changelog

## v12

### v12.2

#### Features

-   Würfeldialog für Fernkampf mit Modifikator-Vorschau
-   Würfeldialog für Übernatürliche Talente mit Modifikator- und Energieverbrauch-Vorschau
-   Würfeldialoge Nahkampf/Fernkampf/Übernatürlich bessere visuelle Trennung der Vorschau
-   Kreaturen-Angriffen können Manöver zugewiesen werden, diese Manöver ignorieren
    dann etwaige Voraussetzungen wie Waffeneigenschaften und Vorteile. Damit können Monster erstellt werden mit unterschiedlichen Manövern pro Angriff
-   Übernatürliche Talente Modifikationen (zB. Adamantquader) werden beim öffnen des Übernatürlichen Dialoges automatisch als Manöver generiert, der Parser rechnet mit dem üblichen Schema aus Sephrasto für Modifikationen
-   Manöver, die mit dem ZERO_DAMAGE Modifikator in Foundry versehen sind, können wie in den Ilaris Regeln nicht mit einander kombiniert werden

### v12.1

#### Features

-   Packs werden als source files getrackt
-   Komplett überarbeitetes Charaktersheet mit neuem Design und verbesserter Benutzeroberfläche
-   Neue farbige Anzeige von Modifikatoren im Kampfdialog (grün/rot je nach Bonus/Malus)
-   Überarbeiteter Kampfdialog mit Echtzeit-Zusammenfassung für Angriffs-, Verteidigungs- und Schadenswürfe
-   Dynamische Manöver-Auswahl in Kampfdialogen (#Hausregelmanöver)
-   Archetypen-Unterstützung hinzugefügt
-   Kreaturen-Kompendium geupdated
-   Fernkampf-Dialog verbessert
-   Kampfstil-Auswahl überarbeitet
-   Platzbedarf als Welteinstellung konfigurierbar
-   Automatisches Öffnen von Items bei Erstellung
-   Waffen-Handhabung (ein-/zweihändig) überarbeitet
-   wiederhergestellte Firefox-Unterstützung
-   SVG-Optimierung für bessere Performance
-   PNG zu WebP konvertiert für geringere Dateigröße
-   Test-Framework hinzugefügt
-   GitHub Actions und CI/CD Pipeline eingerichtet
-   Deployment-Skripte für automatische Veröffentlichung
-   ESLint und Prettier für Codequalität
-   Husky Pre-Commit Hooks hinzugefügt

#### Bugfixes

-   Fix: Notizen werden korrekt gespeichert
-   Fix: Dialoge haben mit IDs, damit sind die Dialoge unabhängig von einander und haben keine Überbleibsel von davor Geöffneten
-   Fix: Angriffseigenschaften löschen und Kurzbeschreibung speichern
-   Fix: Volle Offensive wird nicht mehr bei Passierschlag angewendet

### v12.0

#### v12.0.1

-   Fix #44: Fehlermeldung im Talentsheet
-   Fix #45: Uebernatuerliche Fertigkeiten bearbeiten

#### v12.0.0

-   FoundryVTT v12 Unterstuetzung
-   Projektumzug auf GitHub (neue URL zum Installieren)
-   Neue Versionierung: Die erste Stelle ist die neuste unterstuetzten Foundry Version

## v0.0.20:

Vorteile auf Kreaturensheet ziehen gefixt.

## v0.0.19:

Kreaturen Waffendialog bleibt jetzt nach Verwendung offen.

## v0.0.18:

Manueller Modifikator im Waffendialog wird nicht mehr auf Schaden angerechnet

## v0.0.17:

Modifikatoren der Manöver/Spontanen Mod werden in den entsprechenden Dialogen angezeigt

## v0.0.16:

Manueller Modifikator und Reichweiten Modifikator auf dem Kreaturensheet Waffendialog gefixt

## v0.0.14:

Offensiver Kampfstil jetzt auch auf dem Kreaturensheet Waffendialog gefixt

## v0.0.10

## v0.0.9

## v0.0.8

## v0.0.7

## v0.0.6

## v0.0.5

## v0.0.4

## v0.0.3

## v0.0.2

-   Bei der Auswahl von voller Defensive wurde im Chat volle Offensive angezeigt
-   Bei der Nutzung des Würfelmenüs im Kampf wurde bei einer Verteidigung der AT Wert benutzt
-   Schnellschuss wurde nicht berechnet
-   Icons hinzugefügt

## v0.0.1
