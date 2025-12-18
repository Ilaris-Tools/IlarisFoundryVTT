# Foundry Basics

FoundryVTT wird als Webapp, auf einem Server (oder Home-PC) ausgeführt, dafür muss eine Lizenz erworben werden. Das Ilaris als `System` für FoundryVTT (dieses Projekt), kann über eine url direkt aus der Weboberfläche als Erweiterung installiert werden. Oder auf dem Server direkt nach `foundrydata/systems/` oder `foundrydata/Data/systems` geklont werden siehe [Entwicklerinstallation](CONTRIBUTING.md).

## Geführte Touren

Das Ilaris-System bietet geführte Touren an, die dir helfen, dich mit den wichtigsten Funktionen vertraut zu machen:

-   **Welteinstellungen und Systemoptionen**: Eine Tour durch die wichtigsten Welteinstellungen und globalen Optionen des Ilaris-Systems. Du findest diese Tour im Foundry VTT Tour-Manager (erreichbar über das Fragezeichen-Symbol in der rechten Seitenleiste oder über Einstellungen → Tour-Manager).

Die Touren sind besonders hilfreich für neue Benutzer:innen, um die Besonderheiten des Ilaris-Systems kennenzulernen.

Einige Begriffe aus dem FoundryVTT-Jargon kurz erklärt:

-   **module**: Eigenständiges Plugin, das optional zu beliebigen oder bestimmten Systemen installiert werden kann. zB: [Dice so Nice](https://foundryvtt.com/packages/dice-so-nice/) für animierte 3D Würfel.
-   **system**: Das Regelsystem von dem als Kernkomponente nur eins geladen wird. Enthält Datenstrukturen, Spiellogik, Heldenbögen, Würfeldialoge usw.. zB: Ilaris
-   **world**: Spielwelten gehören idR zu einem bestimmten system und beinhalten Karten, Helden, Kreaturen, Notizen usw.. Spielleiter können bei laufendem Betrieb zwischen Spielwelten (auch mit versch. systems) wechseln. zB: Mittwochrunde
-   **actor**: Figuren, die von Spielerinnen/SL verkörpert werden können. Standardmäßig können sie ein oder mehrere tokens und items besitzen. Aktuell verfügt Ilaris über zwei typen von actors: Helden und Kreaturen.
-   **items**: Auch innerweltliche Gegenstände, aber bei weitem nicht nur: In FoundryVTT ist ein item, eigentlich nur ein container für beliebige Entitäten des systems. Dies schließt zB Zauber, Vorteile, Waffen, Manöver usw. mit ein. Items können in ihrer Datenstruktur definiert und mit zugeordneten Formularen verknüpft werden (ItemSheets). Items stellen viel Funktionalität zur Verfügung: zB: Drag'n'drop auf neue Besitzer, automatische Dialoge zum Bearbeiten, automatische Instanzierung usw..
-   **token**: Die Spielfigur ist die visuelle/"physische" Verkörperung eines Actors auf einer Karte. Wenn der Actor, dem Heldenbogen entspricht, wäre ein token dessen Miniatur auf der Battlemap. Tokens haben eine Reihe von zusätzlichen Eigenschaften, wie zB Lichtlevel, Sicht, Freund/Feind/Neutral, können Encountern beitreten. Ein wichtiges Konzept ist die Verlinkung von Token und Actor: Bei aktivem Link, werden Änderungen am Token direkt auf den Actor (und auf dessen andere Tokens) übertragen. Dies ist üblich für Helden oder NSCs die zB parallel auf Karten in verschiedenen Szenen präsent sind. Und deren Wunden zB auch die Proben auf dem Heldenbogen beeinflussen sollen. Ohne diesen Link, ist die Figur eine Kopie des Actors zum Zeitpunkt der Erstellung. Dies ist zum Beispiel praktisch um aus einer Kreatur "Wolf" (Actor) ein ganzes Rudel zu erstellen (Tokens), bei dem einzelne von der SL oder von Spielerinnen im Kampf bearbeitet werden können.
-   **sheets**: Der Heldenbogen oder Statblock für Kreaturen. Ein html-Formular und eine .js-Datei für die Interaktion. Was wird angezeigt, welche Werte können von wem Verändert werden, was passiert beim Klick auf einen Button usw.. Frontendlogik. Die Sheets werden direkt mit den Items/Actors verknüpft, so dass dessen Daten im html-Template direkt angezeigt und/oder formularfeldern zugewiesen werden können.
-   **packs**: Kompendien oder Sammlungen bestimmter Entitäten. zB Zauber, Liturgien, Kreaturen, Archetypen usw.. Können zB per Drag'n'Drop als Kopie direkt ins Spiel geladen werden. Sie liegen als einzelne .db-Dateien vor, in der jede Zeile die JSON-representation einer Entität ist (wie im template.json definiert). Packs können von SL selbst erstellt/bearbeitet werden oder durch Module (zB für Abenteuer) bezogen werden. Das Ilaris-System stellt auch einige Kernkompendien bereit, die grob dem Entsprechen, was in den Ilaris-Regeln zu finden ist. Dies schließt unteranderem ein:
    -   Zauber, Vorteile, Fertigkeiten, Liturgien ... (aus Sephrasto importiert)
    -   Kreaturen und Kreatureigenschaften (aus ilaris-online.de/api generiert)
    -   Beispielhelden (von Hand erstellt)
