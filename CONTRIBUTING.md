Ein technischer Überblick und Hinweise zur Mitarbeit am Projekt. 
Die Dokumentation der FoundryVTT-API alleine macht es nicht gerade einfach direkt in den chaotischen Code dieses Projekts einzusteigen. 
Diese Hinweise und Anleitungen sollen etwas Hilfestellung geben.
Wenn du noch nicht mit Foundry gearbeitet hast lohnt sich vielleicht ein Blick auf die Zusammenfassung von Konzepten und Begriffen in [Foundry Basics](docs/foundry-basics.md).


## Installation für Entwickler

- [Foundry für node.js installieren (dedicated server)](https://foundryvtt.com/article/installation/)
- `foundrydata`-Ordner ausserhalb des Installationsordners anlegen
- Einmal foundry starten `node resources/app/main.js --dataPath=../foundrydata`, Token eingeben, Adminpasswort setzen etc.
- Dieses Repository in den `foundrydata/Data/systems` Ordner clonen. (ggf. in "Ilaris" umbenennen?)
- Branch auschecken und foundry neu starten

### Visual Studio Code

TODO: workspace file anlegen mit run tasks für foundry und tests?


#### Empfohlene Plugins
- [Unit Tests: Jest Runner](https://marketplace.visualstudio.com/items?itemName=Orta.vscode-jest)
- [Code Formatting: Prettier](https://marketplace.visualstudio.com/items/?itemName=esbenp.prettier-vscode)


## Code Struktur
In der template.json steht die grobe Datenstruktur für Actors und Items. Es können darin auch templates zum wiederverwenden erstellt werden um zB Nahkampfwaffen, Fernkampfwaffen und Rüstungen alle Eigenschaften eines Gegenstandes zu geben (gewicht, platz, härte, wert ...)

Actor: (types: Held, Kreatur) haben jeweils eigene html Templates zum ansehen und bearbeiten (ActorSheets). In den (zwei) actor.js files stehen hooks und methoden für die actors und das UI

Items: Zauber, Fertigkeiten, Gegenstände, Eigenheiten, Waffen, Vorteile usw.. sind Items mit jeweiligem type. Auch hier gibt es einzelne html snippets als formular um individuelle Items zu bearbeiten.

TODO: Dateistruktur und wichtige Dateien erklären



## Import Datenbank.xml aus Sephrasto

- ~~Aktuelle `datenbank.xml` nach `./local_db/org/datenbank.xml` kopieren.~~  
- ~~Änderungen oder neue Einträge in der jeweiligen `./local_db/json_user/` eintragen~~  
    ~~Wichtig: Beachte die korrekte Struktur! (siehe template.json)~~
- ~~`node create_database.js & node import_database`~~  
    ~~Es wird (zur Kontrolle) eine json in `./local_db/db/` erstellt, sowie ein fertiges Kompendium in `./packs`~~.
-  ~~Damit ist hoffentlich alles fertig und bereit.~~  
- Alles Quark: Import V3 direkt als Plugin für Sephrasto schreiben

### Anmerkungen:

-   Dateipfade sind fest. Die in einer configdatei abzulegen wäre wohl deutlich klüger (falls man die Dateien umbenennt, etc.)
-   Root-directory ist blöd. Sollten in ein einzelnes Verzeichnes, das nicht in die zip für Foundry gepackt wird. Mache ich später sobald:
-   package.json updaten und sinnvoll nutzen. Statt per Hand gibt es dann einen update_db Befehl oder so. Und meine persönlichen Pythonskripts zum starten können auch gleich integriert werden.
-   Eigenes Pack für freie Fertigkeiten und/oder Sprachen, oder mit in fertigkeiten-und-talente.db?




## Nützliche Links
Existierende CSS Helper
https://foundryvtt.wiki/en/development/guides/builtin-css
und HTML Vorlagen benutzen:
https://foundryvtt.wiki/en/development/guides/SD-tutorial/SD08-Creating-HTML-templates-for-your-actor-sheets
(feel free to edit)


Weitere Open-Source Foundry-Module als Beispiele:
https://github.com/foundryvtt/dnd5e/
https://git.f3l.de/dungeonslayers/ds4/
