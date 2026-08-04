# Changelog

## v14

### v14.1

#### Breaking Change

**BITTE BEACHTEN**, solltet ihr das Beta Feature Pre-Effekte benutzen wollen. Müsst ihr eure Charaktere am besten neuimportieren.

#### ⚠️ Beta-Funktion: Pre-Effekte

Pre-Effekte sind eine **Beta-Funktion**. Sie automatisieren bislang nur einen Teil der benötigten Zauber-, Liturgie- und Anrufungswirkungen und stacken zur Zeit noch. Prüft erzeugte Effekte, Zielwerte, Dauer und Widerstandsproben im Spiel; bei wichtigen Spielsituationen bleibt die Spielleitung für die Regelprüfung verantwortlich.

#### Pre-Effekte

- Zauber, Liturgien und Anrufungen können jetzt bearbeitbare Pre-Effekte enthalten. Ein Pre-Effekt besteht aus Änderungen, einer optionalen Dauer, optionaler Mächtiger Magie/Mächtiger Liturgie und einer optionalen Widerstandsprobe.
- Nach einer erfolgreichen Probe werden Pre-Effekte für alle ausgewählten Ziele automatisch verarbeitet: sofortige Änderungen laufen über die Schadens-/Heilungslogik, zeitlich begrenzte Änderungen werden als ActiveEffects mit Ilaris-Rundendauer angelegt.
- Widerstandsproben können als geflüsterte Chat-Aufforderung an das Ziel gesendet werden. Je nach Ergebnis wird der Effekt vermieden, abgeschwächt oder vollständig angewendet.
- Mächtige Magie/Mächtige Liturgie verstärkt dafür markierte Änderungen pro Qualitätsstufe; Verlängerte Wirkung und Selbstzauber werden bei der Effektdauer berücksichtigt.
- Im Pre-Effekt-Editor schlagen Datenpfade automatisch gültige Actor-Felder vor. Schadenstypen stammen aus den Welteinstellungen und können dort frei verwaltet werden.
- Für GMs gibt es optional eine KI-gestützte Generierung von Pre-Effekten über eine OpenAI-kompatible API. Zugangsdaten werden nur lokal im Browser des GMs gespeichert. Generierte Daten müssen vor der Nutzung geprüft werden.

### v14.0

#### Breaking Change

**BITTE BEACHTEN**, dies ist ein Update von Ilaris auf eine neue Major Version von Foundry VTT, auf Version 14. In diesem Update ist die Foundry Version 14 auch fest im System gesetzt und wir sich weigern mit älteren oder neueren Major Verison von Foundry VTT zu starten. Der Item-Typ `effectItem`/`effect-item` wurde entfernt. ActiveEffects werden ab sofort direkt als native Foundry-ActiveEffect-Dokumente auf Actors angewendet — per Drag & Drop aus beliebigen Kompendien oder über den Effekte-Tab. Bestehende Weltdaten mit diesem Legacy-Typ werden bei der automatischen Migration (Schema 13.2.0) gelöscht. Ein Neuimport von Charakteren ist sehr empfohlen.
Import erforderlich: Ja
Tutorials: @UUID[Compendium.Ilaris.kurzuebersichten.JournalEntry.kurzimport001]{Charakter-Import} | @UUID[Compendium.Ilaris.kurzuebersichten.JournalEntry.hausregel001]{Hausregel-Import}

- Update auf Foundry VTT v14

## v13

### v13.1

#### Breaking Change

**BITTE BEACHTEN**, das System benutzt jetzt statt einer template.json die empfohlenen data-models. Es haben sich sich auch ein paar Propertynames geändert, die Migration dafür passiert im Hintergrund. Falls doch auffällt, dass etwas nicht ganz funktioniert bitte die Charaktere und Hausregeln neuimportieren/updaten und überprüfen, ob die Voraussetzungen bei Manövern stimmen, der AT-WM bei Waffen stimmt

##### Nutzerrelevante Features

- Neues Actor-DataModel mit Migration weg von Legacy-Strukturen.
- Überarbeitete Kampf- und Würfeldialoge mit einheitlicher Vorschau-Logik.
- Neue Hook-Struktur für Kampf- und Fertigkeitsdialoge für bessere Erweiterbarkeit.
- Ilaris-Systemeinstellungen jetzt direkt als Dialog im System.
- Verbesserte Tastaturbedienung im Charakterbogen, inklusive besserem Autofokus.
- Verbesserter XML-/Charakter-Import, inklusive Tutorialmaterial.

##### Technik und Qualität

- Playwright/E2E-Testsetup mit mehreren neuen Regressionstests.
- Templates stärker von JS nach HBS ausgelagert.
- Aufräumen von Legacy-Code, Ordnerstruktur und Benennungen.
- Anpassungen an Build-/Deploy-Workflows und Agent-/Copilot-Infrastruktur.

### v13.0.5

- Zauberer und Geweither durch Energie, gebundene Energie und Energie zugekauft bestimmen

### v13.0.4

- Notizen über ganze Größe
- Minimieren von Heldensheet

### v13.0.3

- fix Bild in Sheets ändern
- fix Bild defaultet auf Baum Icon
- fix Waffeneigenschaften hinzufügen
- fix andere fehlende Aktionen in Sheets
- fix changelog script und scrollable machen
- fix Schaden auf nicht verlinkte Actors

### v13.0.2

- fix Wundabzuege

### v13.0.1

- fix Effekt in Effekt-Item und Vorteile hinzufügen funktioniert nicht oder sonstige Aktionen
- fix Speicherplatz Bug für Items, die nicht auf Actor liegen

### v13.0.0

#### Breaking Change

**BITTE BEACHTEN**, bitte in den Settings in Foundry das Theme auf Light stellen. Dark Theme wird vom Ilaris System noch nicht unterstützt und kann an manchen Stellen deshalb weniger gut aussehen bis unbrauchbar sein.

#### Foundry v13 update

System-Update auf Foundry v13.

## v12

### v12.3.3

- Löst Bug durch den AT und VT nicht direkt gewürfelt können
- Löst Bug wodurch Manövererleichterung von Parierwaffenkampf auch auf Sicht zählt
- Löst Bug durch den Angepasst Dunkelheit nicht direkt die Sicht verbessert

### v12.3.2

- Ini im Kampf wird nun richtig angezeigt

### v12.3.1

- Kampfstile wurden nicht mehr mit eingerechnet
- nicht gefundener Bug bei Reiterkampf bzw Kampfstilen, die Belastung reduzieren
- Zauber/Liturigen als Teil der Talentpacks

### v12.3

#### Breaking Change

**--------------EXTREM WICHTIG--------------**
**BITTE BEACHTEN**, wenn du das erste mal auf dieses Version migrierst, gehe nochmal ins Setup zurück und deinstalliere und installiere das System nochmals, bevor du weiter machst. Wir entschuldigen uns für die Unannehmlichkeit es ist jedoch wegen Änderungen an den Kompedium packs im System erforderlich.
**--------------EXTREM WICHTIG--------------**

Bitte wie immer die Charaktere neu importieren, bei Charakteren aus neueren Sephrasto-Versionen 5.1.0 über den Import-Knopf, welcher jetzt beim **ersten** Import auch Custom-Waffen richtig importiert. Für die älteren Charaktere steht immer noch der Json-Import und der Aktualisierungs-Knopf im Charakter-Sheet zur Verfügung.

##### Waffeneigenschaften-System komplett überarbeitet

- Waffeneigenschaften werden jetzt als eigenständige Items verwaltet
- Alle Waffen wurden migriert, um das neue Eigenschaften-System zu nutzen
- Eigenschaften können jetzt dynamisch konfiguriert werden mit:
    - Modifikatoren (z.B. AT +1, PA -2)
    - Bedingungen (wann Eigenschaft aktiv ist)
    - Zieleffekte (Effekte auf das Ziel)
    - Führungsarten (Einhand, Zweihand, etc.)
- **Migration erforderlich:** Bestehende Waffen werden automatisch migriert

##### Effekt-System Grundlage gelegt

- Einführung eines Active Effect Systems
- Vorbereitung für zukünftige dauerhafte Effekte und Buffs/Debuffs
- Neue Effekt-Items als Basis für das System

---

#### 🟢 Major Features

##### 1. Rule Importer - XML Import System (**Sephrasto 5.1.0**)

- sagen wir mal das ist die erste Beta des XML-Regelimporters. Bitte **immer** überprüfen ob alles stimmt und sich nicht einfach darauf verlassen
- Komplettes Import-System für Regeldaten aus XML-Dateien
- Automatischer Import von:
    - Fertigkeiten & Talenten
    - Manövern
    - Vorteilen
    - Waffen & Waffeneigenschaften
    - Abgeleiteten Werten
    - Rüstungen
- Intelligente Update-Funktion mit Bestätigungsdialog
- Vollständige Compendium-Verwaltung
- Fehlerbehandlung und Validierung
- Man kann es gerne mit Hausregeln aus älteren Sephrasto Versionen versuchen, aber dafür übernehmen wir keine Garantie

##### 2. Zielauswahl-System

- Neue Zielauswahl für Kampf und Zauber
- Automatische Erfassung anvisierter Tokens
- Anzeige von Zielinformationen im Kampfdialog
- Verbesserte taktische Übersicht
- Integration in alle Kampfdialoge

##### 3. Kurzübersichten Journal Pack

- Neue Compendium mit Referenzkarten
- Quick Reference Cards für schnellen Zugriff
- Wichtige Regelübersichten im Journal-Format

##### 4. Licht- & Wetter-Config in Fernkampf- und Nahkampf-Dialog

- Scene Config Integration
- Automatische Übernahme in Fernkampf-Dialog
- World-Setting für automatisches Pullen der Werte
- Dokumentation in einstellungen.md

##### 5. Hexagonale Token-Formen

- Token-Clipping für Hex-Grids
- Sechseckige Token-Masken für Hex-Grids
- Performance-optimiert mit Caching
- Optional aktivierbar per World-Setting
- Farbige Borders je nach Token-Typ (Foundry Color System)

---

#### 🟡 Minor Features & Improvements

##### Kampfsystem

- Gildenmagier II Bonus implementiert (Basis-Manöver zählen doppelt)
- Tooltips für Manöver-Namen in Kampfdialogen
- Würfelformeln werden jetzt in benutzerfreundlicher deutscher Notation angezeigt
- Kritische Treffer und Patzer werden im Chat hervorgehoben
- Umgebungslicht-Modifikator im Nahkampf-Dialog

##### Manöver-System

- Manöver-Checks akzeptieren jetzt Strings UND Zahlen
- Waffeneigenschaften-Verbesserungen für Manöver

##### Datenstruktur & Technisches

- "Tiergeister" Kategorie für Vorteile hinzugefügt (Sephrasto-Kompatibilität)
- Fertigkeiten zu getRollData hinzugefügt (für Roll-Formeln zugänglich)
- Deprecated Files entfernt
- Diverse kleinere Verbesserungen

---

#### 📦 Compendium Updates

##### Massives Waffen-Update

- **Alle Waffen** (150+ Items) auf neues Eigenschaften-System migriert
- Binäre Pack-Dateien vollständig neu generiert
- Source JSON-Dateien für alle Waffen aktualisiert

##### Neue Waffeneigenschaften Items

17 neue Waffeneigenschaften-Items erstellt:

- Kopflastig
- Magazin
- Niederwerfen
- Parierwaffe
- Rüstungsbrechend
- Reittier
- Schild
- Schwer
- Stumpf
- Umklammern
- Unberechenbar
- Unzerstörbar
- Wendig
- Zerbrechlich
- Zweihändig
- kein Malus als Nebenwaffe
- kein Reiter
- stationär

##### Vorteile Update

- Neue Vorteile hinzugefügt
- Bestehende Vorteile aktualisiert für Kampfstil-System
- Tiergeister-Kategorie integriert

##### Zauber & Rituale

- Über 300 Zauber mit Tiergeist-Varianten aktualisiert
- Source-Dateien für bessere Wartbarkeit

##### Kreaturen, Helden, Manöver

- Beispiel-Helden aktualisiert
- Kreaturen-Pack überarbeitet
- Manöver-Compendium erweitert

---

#### 🧪 Tests & Qualität

##### Neue Test-Suites

- `weapon-utils.test.js` - Umfangreiche Waffen-Utility-Tests (685 Zeilen)
- `waffe.spec.js` - Waffen-Item-Tests (382 Zeilen)
- `uebernatuerlich.spec.js` - Tests für übernatürliche Fertigkeiten
- `eigenschaft-cache.spec.js` - Eigenschaften-Cache-Tests (315 Zeilen)
- `eigenschaft-parser.test.js` - Parser-Tests (221 Zeilen)
- `eigenschaft-utils.spec.js` - Utility-Tests (161 Zeilen)
- `modifier-processor.spec.js` - Modifikator-Tests
- `processor-factory.spec.js` - Factory-Pattern-Tests
- `wuerfel_misc.spec.js` - Erweiterte Würfel-Tests (391 Zeilen)

##### Code-Qualität

- Jest Setup erweitert (87 Zeilen)
- Jest Config optimiert
- Prettier Code-Formatting

---

#### 📊 Statistik-Zusammenfassung

| Kategorie                          | Anzahl      |
| ---------------------------------- | ----------- |
| **Commits**                        | 29          |
| **Pull Requests**                  | ~20         |
| **Geänderte Dateien**              | 2.247       |
| **Neue JavaScript-Dateien**        | 40+         |
| **Neue Test-Dateien**              | 15+         |
| **Neue Templates**                 | 11          |
| **Neue Dokumentation**             | 4 Dokumente |
| **Aktualisierte Compendium-Items** | 500+        |
| **Code-Zeilen hinzugefügt**        | ~23.281     |
| **Code-Zeilen entfernt**           | ~2.028      |

---

#### 🚀 Migration

- Waffen werden automatisch auf neues Eigenschaften-System migriert
- Compendium-Packs werden automatisch aktualisiert
- Die Charaktere bitte neu importieren, dass löst einiges an Problemen

### v12.2.8

- Fix: Kreaturen/NPCs haben keine übernatürlichen Manöver

### v12.2.7

- Fix: Ruhige Hand Bonus für Zielen nicht eingerechnet

### v12.2.6

- Fix: Attribute roll dialog now correctly reads modifier and high quality fields
- Fix: Energie im Chat einheitlich benennen
- Fix: Kreaturensheet Fernkampfangriff: AT-Wert wird jetzt zum Würfelergebnis addiert

### v12.2.5

- Kampfstil-Sync-Button auf dem Charaktersheet wurde ausgebaut, dafür wurde ein Sync-Button auf dem Charaktersheet eingeführt, der alle Vorteile und alle Übernatürlichen Talente mit den Kompendium-Counterparts synct
- auskommentiere Setting wieder reingenommen, hat zu einem Problem geführt, dass man die Dialoge nicht mehr öffnen kann

### v12.2.4

- fixes breaking change dialog

### v12.2.3

- Importer speichert zugekaufte und gebundene Energie an der richtigen Stelle

### v12.2.2

- Breaking changes dialog

### v12.2.1

- Bei geweihten Beispielhelden waren die Liturigen falsch als Zauber geflaggt was dazu geführt hat, dass die Würfeldialoge nicht funktioniert haben.

### v12.2

#### Breaking Change

- die Kampfstile und die Übernatürlichen Talente können nur richtig verwendet werden, wenn sie auch in ihrer aktuellsten Form auf dem Charakter liegen. Dafür muss entweder der Sync/Update-Button verwendet werden (bitte auf die nötigen Nutzer Berechtigungen achten ("Upload File", ggf "Create Actor")) oder die Vorteile/Übernatürlichen Talente müssen neu auf das Charaktersheet gezogen werden
- für Charaktere mit 5.1.0 und neuer sollte der XML-Import oder der Sync-Button im Actortab verwendet werden. Bei älteren Sephrasto XMLs kommt es zu Fehlern, da sich die Datenstruktur maßgeblich unterscheidet
- für Charaktere, die mit älteren Sephrasto-Versionen erstellt wurden, muss weiterhin das Sephrasto-Plugin für Foundry verwendet werden und ein manuelles Update der Charakterdaten erfolgen. Dafür wie oben beschrieben den Sync-Button für den Charakterbogen aktivieren und einfach drauf drücken, den Rest erledigt Foundry
- Bei der neuen Variante (Sephrasto 5.1.0 + XML-Import/Actortab-Sync-Button) können auch Hausregeln verwendet werden, wenn die Hausregeln mit exakt gleichem Namen auch in Foundry vorhanden sind!

#### Features

- Würfeldialog für Fernkampf mit Modifikator-Vorschau
- Würfeldialog für Übernatürliche Talente mit Modifikator- und Energieverbrauch-Vorschau
- Würfeldialoge Nahkampf/Fernkampf/Übernatürlich bessere visuelle Trennung der Vorschau
- Kreaturen-Angriffen können Manöver zugewiesen werden, diese Manöver ignorieren
  dann etwaige Voraussetzungen wie Waffeneigenschaften und Vorteile. Damit können Monster erstellt werden mit unterschiedlichen Manövern pro Angriff
- Übernatürliche Talente Modifikationen (zB. Adamantquader) werden beim öffnen des Übernatürlichen Dialoges automatisch als Manöver generiert, der Parser rechnet mit dem üblichen Schema aus Sephrasto für Modifikationen
- Manöver, die mit dem ZERO_DAMAGE Modifikator in Foundry versehen sind, können wie in den Ilaris Regeln nicht miteinander kombiniert werden
- Im Inventar wird nun die Anzahl eines Elements angezeigt
- Beim Hinzufügen eines Items kann die Anzahl mit angegeben werden
- Foundry Kampfstile benutzen das Sephrasto Kampfstile Script, um AT/VT/DMG/RW/BE Boni dynamisch zu handhaben
- Kampfstil-Manöver sind nur noch aktiv, wenn die Waffenvoraussetungen des Kampfstiles erfüllt sind
- Kampfstile können Foundry eigenen Scripte erhalten, die folgende Dinge dynamisch handeln:
    - Nebenhandwaffen-Erschwernis auch für bestimmte Waffeneigenschaften (zb Schildkampf)
    - Ausgleich von Manövererschwernissen
    - Berittener Fernkampfmalus ausgelichen
- Waffenvoraussetzungen für Kampfstile frei definierbar zb sind die folgende Beispiele möglich:
    - Fertigkeit Hiebwaffen (der Kampfstil setzt Waffe mit der Fertigkeit Hiebwaffen voraus)
    - Fernkampfwaffe/einzelne Fernkampfwaffe/zwei einhändige Fernkampfwaffen (Der Name ist Programm damit können auch Kampfstile für den Fernkampf angelegt werden)
    - Nahkampfwaffe/einzelne Nahkampfwaffe/zwei einhändige Nahkampfwaffen (Der Klassiker)
    - (nicht) beritten (Der Kampfstil setzt beritten oder nicht beritten voraus)
    - (kein) <beliebige Waffeneigenschaft> (Der Kampfstil benötigt mindestens eine Waffe mit der aufgelisteten Waffeneigenschaft oder verbietet beiden Waffen eine Eigenschaft)
    - oder beliebige Kombinationen, der oben genannten Voraussetungen getrennt durch Kommas
- Kampfstile können als Fernkampf-Kampfstile geflaggt werden wodurch der AT-Modifier des Stiles nur auf Fernkampfwaffen zählt
- Anzeige für optionale Weltregel "Platzbedarf" kompakter
- Fügt Charakter-Import-Button im Aktorentab für XML-Datein direkt aus Sephrasto (5.1.0) hinzu (man braucht kein Foundry-Plugin mehr)
    - Spieler müssen die Berechtigung erhalten Dateien Uploaden zu dürfen und Charaktere erstellen zu dürfen, sonst sind die neuen Knöpfe nicht verfügbar
- Charakter-Sync-Button an jedem Charakter, der einem gehört. Damit kann einfach der Charakter mit der neuen XML-Datei aus Sephrasto geupdatet werden
    - dabei werden **keine Waffen oder andere Inventargegenstände** in Foundry verändert,
    - die Notizen werden nicht verändert
    - Eigenheiten werden vereint
    - die in Sephrasto hinzugefügten **Waffen/Inventargegenstände/Notizen werden ignoriert** (Bewusste Entscheidung Charakter Verwaltung in Sephrasto, Inventar und Notiz Verwaltung in Foundry)
- löscht einige überflüssige SVGs und benutzt die Tint Property von Foundry, um diese zu färben, was Assets und Bandbreit einspart
- Verbotene Pforten freischalten mit Zauber "Blut des Dolches"

### v12.1

#### Features

- Packs werden als source files getrackt
- Komplett überarbeitetes Charaktersheet mit neuem Design und verbesserter Benutzeroberfläche
- Neue farbige Anzeige von Modifikatoren im Kampfdialog (grün/rot je nach Bonus/Malus)
- Überarbeiteter Kampfdialog mit Echtzeit-Zusammenfassung für Angriffs-, Verteidigungs- und Schadenswürfe
- Dynamische Manöver-Auswahl in Kampfdialogen (#Hausregelmanöver)
- Archetypen-Unterstützung hinzugefügt
- Kreaturen-Kompendium geupdated
- Fernkampf-Dialog verbessert
- Kampfstil-Auswahl überarbeitet
- Platzbedarf als Welteinstellung konfigurierbar
- Automatisches Öffnen von Items bei Erstellung
- Waffen-Handhabung (ein-/zweihändig) überarbeitet
- wiederhergestellte Firefox-Unterstützung
- SVG-Optimierung für bessere Performance
- PNG zu WebP konvertiert für geringere Dateigröße
- Test-Framework hinzugefügt
- GitHub Actions und CI/CD Pipeline eingerichtet
- Deployment-Skripte für automatische Veröffentlichung
- ESLint und Prettier für Codequalität
- Husky Pre-Commit Hooks hinzugefügt

#### Bugfixes

- Fix: Notizen werden korrekt gespeichert
- Fix: Dialoge haben mit IDs, damit sind die Dialoge unabhängig von einander und haben keine Überbleibsel von davor Geöffneten
- Fix: Angriffseigenschaften löschen und Kurzbeschreibung speichern
- Fix: Volle Offensive wird nicht mehr bei Passierschlag angewendet

### v12.0

#### v12.0.1

- Fix #44: Fehlermeldung im Talentsheet
- Fix #45: Uebernatuerliche Fertigkeiten bearbeiten

#### v12.0.0

- FoundryVTT v12 Unterstuetzung
- Projektumzug auf GitHub (neue URL zum Installieren)
- Neue Versionierung: Die erste Stelle ist die neuste unterstuetzten Foundry Version

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

- Bei der Auswahl von voller Defensive wurde im Chat volle Offensive angezeigt
- Bei der Nutzung des Würfelmenüs im Kampf wurde bei einer Verteidigung der AT Wert benutzt
- Schnellschuss wurde nicht berechnet
- Icons hinzugefügt

## v0.0.1
