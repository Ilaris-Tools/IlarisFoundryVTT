# Changelog

## v12

### v12.2.1

#### Fixes

-   Importer speichert zugekaufte und gebundene Energie an der richtigen Stelle
-   Bei geweihten Beispielhelden waren die Liturigen falsch als Zauber geflaggt was dazu geführt hat, dass die Würfeldialoge nicht funktioniert haben.

### v12.2

#### Features

-   Würfeldialog für Fernkampf mit Modifikator-Vorschau
-   Würfeldialog für Übernatürliche Talente mit Modifikator- und Energieverbrauch-Vorschau
-   Würfeldialoge Nahkampf/Fernkampf/Übernatürlich bessere visuelle Trennung der Vorschau
-   Kreaturen-Angriffen können Manöver zugewiesen werden, diese Manöver ignorieren
    dann etwaige Voraussetzungen wie Waffeneigenschaften und Vorteile. Damit können Monster erstellt werden mit unterschiedlichen Manövern pro Angriff
-   Übernatürliche Talente Modifikationen (zB. Adamantquader) werden beim öffnen des Übernatürlichen Dialoges automatisch als Manöver generiert, der Parser rechnet mit dem üblichen Schema aus Sephrasto für Modifikationen
-   Manöver, die mit dem ZERO_DAMAGE Modifikator in Foundry versehen sind, können wie in den Ilaris Regeln nicht miteinander kombiniert werden
-   Im Inventar wird nun die Anzahl eines Elements angezeigt
-   Beim Hinzufügen eines Items kann die Anzahl mit angegeben werden
-   Foundry Kampfstile benutzen das Sephrasto Kampfstile Script, um AT/VT/DMG/RW/BE Boni dynamisch zu handhaben
-   Kampfstil-Manöver sind nur noch aktiv, wenn die Waffenvoraussetungen des Kampfstiles erfüllt sind
-   Kampfstile können Foundry eigenen Scripte erhalten, die folgende Dinge dynamisch handeln:
    -   Nebenhandwaffen-Erschwernis auch für bestimmte Waffeneigenschaften (zb Schildkampf)
    -   Ausgleich von Manövererschwernissen
    -   Berittener Fernkampfmalus ausgelichen
-   Waffenvoraussetzungen für Kampfstile frei definierbar zb sind die folgende Beispiele möglich:
    -   Fertigkeit Hiebwaffen (der Kampfstil setzt Waffe mit der Fertigkeit Hiebwaffen voraus)
    -   Fernkampfwaffe/einzelne Fernkampfwaffe/zwei einhändige Fernkampfwaffen (Der Name ist Programm damit können auch Kampfstile für den Fernkampf angelegt werden)
    -   Nahkampfwaffe/einzelne Nahkampfwaffe/zwei einhändige Nahkampfwaffen (Der Klassiker)
    -   (nicht) beritten (Der Kampfstil setzt beritten oder nicht beritten voraus)
    -   (kein) <beliebige Waffeneigenschaft> (Der Kampfstil benötigt mindestens eine Waffe mit der aufgelisteten Waffeneigenschaft oder verbietet beiden Waffen eine Eigenschaft)
    -   oder beliebige Kombinationen, der oben genannten Voraussetungen getrennt durch Kommas
-   Kampfstile können als Fernkampf-Kampfstile geflaggt werden wodurch der AT-Modifier des Stiles nur auf Fernkampfwaffen zählt
-   Anzeige für optionale Weltregel "Platzbedarf" kompakter
-   Fügt Charakter-Import-Button im Aktorentab für XML-Datein direkt aus Sephrasto (5.1.0) hinzu (man braucht kein Foundry-Plugin mehr)
    -   Spieler müssen die Berechtigung erhalten Dateien Uploaden zu dürfen und Charaktere erstellen zu dürfen, sonst sind die neuen Knöpfe nicht verfügbar
-   Charakter-Sync-Button an jedem Charakter, der einem gehört. Damit kann einfach der Charakter mit der neuen XML-Datei aus Sephrasto geupdatet werden
    -   dabei werden **keine Waffen oder andere Inventargegenstände** in Foundry verändert,
    -   die Notizen werden nicht verändert
    -   Eigenheiten werden vereint
    -   die in Sephrasto hinzugefügten **Waffen/Inventargegenstände/Notizen werden ignoriert** (Bewusste Entscheidung Charakter Verwaltung in Sephrasto, Inventar und Notiz Verwaltung in Foundry)
-   löscht einige überflüssige SVGs und benutzt die Tint Property von Foundry, um diese zu färben, was Assets und Bandbreit einspart
-   Verbotene Pforten freischalten mit Zauber "Blut des Dolches"

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
