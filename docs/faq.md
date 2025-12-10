# Zu beachten

-   Im Kompendium "Beispielhelden" gibt es "Alrik die leere Vorlage", die schon alle typischen Fertigkeiten ausgerüstet
    hat. "Alrik der Bauer" ist zur Präsentation mit Werten und Ausrüstung ausgestattet.
-   Rüstungen werden erst berechnet, wenn sie angelegt werden. Symbol links neben dem Namen anklicken
-   Kampfstile werden nur für die ausgerüsteten Haupt- und Nebenwaffen berechnet
-   Es kann maximal jeweils eine Haupt- und Nebenwaffe angelegt sein. Zweihändige Waffen müssen gleichzeitig Haupt- und
    Nebenwaffe sein, sonst werden die Abzüge für einhändige Führung angerechnet
-   Falls (Kampf-)manöver nicht ausgewählt werden können, kontrolliert ob die Voraussetzungen erfüllt sind
    (Waffeneigenschaften, Waffe ausgerüstet, Kampfstil ausgewählt, Sonderfertigkeit vorhanden)
-   Die Manöver im Kompedium schalten die Manöver nicht frei: Das passiert über die entsprechenden Vorteile #40
-   Manöver für Magie und Karma sind noch nicht integriert
-   Der Einsatz von Schicksalspunkten funktioniert nur, wenn Schicksalspunkte vorhanden sind. Ansonsten wird ohne
    Meldung eine normale 3W20 Probe geworfen
-   Astral- und Karmapunkte werden nur angezeigt, wenn die Vorteile Zauberer oder Geweiht aktiviert sind
-   Der Zukauf von AsP und KaP kann durch einen Mausklick auf das Label AsP/KaP eingestellt werden
-   Einzelne Boni und Mali können noch nicht verteilt werden!

# Häufige Fragen

## Wie kann ich meinen mit Sephrasto generierten Charakter in Foundry nutzen?

Aktiviere in den Einstellungen von Sephrasto das FoundryVTT Plugin.
Im Heldeneditor besteht nun neben dem Speichern und Exportieren als PDF auch
die Möglichkeit eines Exports für Foundry. Die dabei gespeicherte .json-Datei
kannst du einfach in eine Szene oder ein Kompendium in Foundry ziehen.

> Nach jedem Steigern werden aktuell alle Felder überschrieben, das schließt
> leider auch das Inventar oder aktuelle Ressourcen mit ein. Wir arbeiten an
> einem "intelligenteren" Update.

**Warum bekomme ich Abzüge wenn ich eine Zweihandwaffe ausrüste?**
Es kann maximal jeweils eine Haupt- und Nebenwaffe angelegt sein.
Zweihändige Waffen müssen gleichzeitig Haupt- und Nebenwaffe sein, sonst werden die Abzüge für
einhändige Führung angerechnet

**Was hat es mit dem Gewicht im Inventar auf sich?**

-   Zur Traglast werden die Regeln aus [Ilaris Advanced](https://dsaforum.de/viewtopic.php?f=180&t=49412) verwendet.
-   Tragend: Gegenstände an der Person, deren Gewicht nicht berücksichtigt wird (zB getragene Kleidung)
-   Mitführend: Gegenstände an der Person, deren Gewicht berücksichtigt wird
-   Lagerplatz/Transportmittel: Wenn man bei einem Gegenstand ein negatives Gewicht einträgt, wird er als externer Speicherort gelistet (zB Eselskarren oder eigenes Haus)
-   Wenn das Durchhaltevermögen (dh\*) auf 0 oder niedriger fällt, ist man überladen. (Die Behinderung durch die Rüstung wird vor der Behinderung durch die Traglast berechnet; durch Rüstung kann dh nicht unter 1 fallen)
-   Das Gewicht der Waffen im Kompendium ist einfachst automatisch aus der Sephrasto-Datenbank berechnet => Anpassungen werden nötig sein

**Wie kann ich Fertigkeiten in Würfelformeln verwenden?**

Fertigkeiten können jetzt in Würfelformeln über das `@`-Symbol referenziert werden, ähnlich wie Attribute. Dies ist besonders nützlich für Spielleiter, die bestimmte Würfe über Chat oder Journal von Spielern verlangen möchten.

Syntax:

-   `@fertigkeiten.Name.pw` - Probewert der Fertigkeit
-   `@fertigkeiten.Name.pwt` - Probewert mit Talenten
-   `@fertigkeiten.Name.fw` - Fertigkeitswert

Beispiele:

-   `@fertigkeiten.Athletik.pw` - Gibt den Probewert von Athletik zurück
-   `@fertigkeiten.Klettern.pwt` - Gibt den Probewert mit Talenten von Klettern zurück
-   `1d20 + @fertigkeiten.Athletik.pw` - Würfelt 1d20 und addiert den Athletik-Probewert

Dies funktioniert sowohl für profane Fertigkeiten als auch für übernatürliche Fertigkeiten.
