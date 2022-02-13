# Development Readme

_Wenn Du **nicht** aktiv an der Weiterentwicklung des Moduls interessiert bist, kannst Du diesen Text vollständiges ignorieren!!_

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
