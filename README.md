# Ilaris für FoundryVTT (**BETA**)

Ein System für [Ilaris](https://ilarisblog.wordpress.com/) zur Verwendung mit [FoundryVTT](https://foundryvtt.com/).
> Beta: Ilaris für FoundryVTT befindet sich aktuell in der Entwicklung. Grobe Änderungen am Code stehen aus und können neue Bugs mitbringen. Es sind bisher nicht alle Ilaris-Regeln vollständig umgesetzt. Für erstellte Inhalte (Helden, Kreaturen, eigene Zauber usw..) sollten gelegentlich Backups (Kopie der Spielwelt) erstellt werden insbesondere vor dem Update dieses Systems. Bei Fragen und Problemen warten wir im [Forum](https://dsaforum.de/viewtopic.php?f=180&t=55746) und im [Discord](https://discord.gg/qEKBnjsspX) um zu Helfen. Wer ein stabiles und vollständiges System für VTT sucht, kann auf das [Roll20 Charakter Sheet für Ilaris](https://github.com/Roll20/roll20-character-sheets/tree/master/Das_Schwarze_Auge_Ilaris) zurückgreifen.


## Disclaimer

Dies ist ein nicht kommerzielles Community-Projekt.
Wir stehen in keinem Verhältnis (angestellt oder ähnliches) zu FoundryVTT, Ilaris, Ulisses oder anderen Rechteinhabern.


## Installation

In Foundry unter "Game Systems" -> "Install System" -> "Manifest URL": 
```
https://gitlab.com/Feorg/ilaris-foundryvtt/raw/master/system.json
```
einfügen und installieren.
![Screenshot](utils/screenshot_install.png)

## Bekannte Probleme

- Abfragen zur Berechnung von Fertigkeitn/Vorteilen/etc. basieren rein auf Strings: Ein Leerzeichen an der falschen Stelle kann daher die Berechnung kaputt machen => Item löschen und neu importieren, bevor ein Bug gemeldet wird.  



### Unterstützung

Wir freuen uns über jegliche Hilfe. Auch Vorschläge und Kritik werden im [Forum](https://dsaforum.de/viewtopic.php?f=180&t=55746) oder [Discord](https://discord.gg/qEKBnjsspX) dankend entgegen genommen. Die Community von FoundryVTT-Ilaris Spielerinnen ist klein, daher hilft jedes Feedback insbesondere Tests und Erfahrungen mit neuen Versionen. Du hast einen Bug gefunden? Das ist toll! Her damit!

Wir suchen auch Verstärkung im Entwicklerteam. JS-Programmierer und Webdesigner (oder welche die es lernen wollen) sind besonders Wilkommen. Auch eine künstlerische Ader um den Heldenbogen aufzuhübschen und einige assets zu erstellen fehlt bisher. Hier gehts lang um direkt durchzustarten: [CONTRIBUTIONS.md]

## Aktueller Entwicklungsstand
Für nicht allzu anspruchsvolle Spieler/innen ist das System ausgereift genug um die ein oder andere Session spielen zu können. Kleinere Fehler können immer wieder auftreten. Es sind [noch nicht alle Vorteile](https://gitlab.com/Feorg/ilaris-foundryvtt/-/issues/37) vollständig implementiert. Wir arbeiten gerade an der Einbindung einer großen Datenbank von Kreaturen für Ilaris. Ein grober Überblick kann anhand der [Meilensteinen](https://gitlab.com/Feorg/ilaris-foundryvtt/-/milestones) gewonnen werden. Mehr Details gibt es auf unserem [TODO-Board](https://gitlab.com/Feorg/ilaris-foundryvtt/-/boards). Etwas weniger aktuell, aber wesentlich praxisorientierter sind die Screencasts von [TODO YOUTUBELINK]


### Zu beachten / FAQ

-   Im Compendium "Beispielhelden" gibt es "Alrik die leere Vorlage", die schon alle typischen Fertigkeiten ausgerüstet hat. "Alrik der Bauer" ist zur Präsentation mit Werten und Ausrüstung ausgestattet.
-   Rüstungen werden erst berechnet, wenn sie angelegt werden. Symbol links neben dem Namen anklicken
-   Kampfstile werden nur für die ausgerüsteten Haupt- und Nebenwaffen berechnet
-   Es kann maximal jeweils eine Haupt- und Nebenwaffe angelegt sein. Zweihändige Waffen müssen gleichzeitig Haupt- und Nebenwaffe sein, sonst werden die Abzüge für einhändige Führung angerechnet
-   Falls (Kampf-)manöver nicht ausgewählt werden können, kontrolliert ob die Voraussetzungen erfüllt sind (Waffeneigenschaften, Waffe ausgerüstet, Kampfstil ausgewählt, Sonderfertigkeit vorhanden)
-   Die Manöver im Kompedium schalten die Manöver nicht frei: Das passiert über die entsprechenden Vorteile
-   Manöver für Magie und Karma sind noch nicht integriert
-   Der Einsatz von Schicksalspunkten funktioniert nur, wenn Schicksalspunkte vorhanden sind. Ansonsten wird ohne Meldung eine normale 3W20 Probe geworfen
-   Astral- und Karmapunkte werden nur angezeigt, wenn die Vorteile Zauberer oder Geweiht aktiviert sind
-   Der Zukauf von AsP und KaP kann durch einen Mausklick auf das Label AsP/KaP eingestellt werden
-   Einzelne Boni und Mali können noch nicht verteilt werden!
-   Inventar:
    -   Zur Traglast werden die Regeln aus [Ilaris Advanced](https://dsaforum.de/viewtopic.php?f=180&t=49412) verwendet.
    -   Tragend: Gegenstände an der Person, deren Gewicht nicht berücksichtigt wird (zB getragene Kleidung)
    -   Mitführend: Gegenstände an der Person, deren Gewicht berücksichtigt wird
    -   Lagerplatz/Transportmittel: Wenn man bei einem Gegenstand ein negatives Gewicht einträgt, wird er als externer Speicherort gelistet (zB Eselskarren oder eigenes Haus)
    -   Wenn das Durchhaltevermögen (dh\*) auf 0 oder niedriger fällt, ist man überladen. (Die Behinderung durch die Rüstung wird vor der Behinderung durch die Traglast berechnet; durch Rüstung kann dh nicht unter 1 fallen)
    -   Das Gewicht der Waffen im Kompendium ist einfachst automatisch aus der Sephrasto-Datenbank berechnet => Anpassungen werden nötig sein
-   ~~Bei einem Import aus _Beispiel Helden_ werden eine ganze Menge Fehler angezeigt. Keine Ahnung woher sie kommen. Es scheint aber dennoch zu funktionieren~~


## Danke!

-   Selbstverständlich an das Team von [Ilaris](https://ilarisblog.wordpress.com/), das in seiner Freizeit ein so großartiges System erstellt hat.
-   An [Ulisses](https://ulisses-spiele.de), die Ilaris als Fanregeln sogar in gedruckter Form in ihrem Shop [anbieten](https://www.f-shop.de/detail/index/sArticle/1372).
-   Der Charaktereditor [Sephrasto](https://github.com/Aeolitus/Sephrasto), aus dessen Datenbank wir uns schamlos bedient haben und werden.
-   [Ilaris Advanced](https://dsaforum.de/viewtopic.php?f=180&t=49412&sid=8837ba1ffde6b5396050628f78a92dce), dessen Regelerweiterungen wir sträflichst vernachlässigt haben.
-   für den Ilaris Charaktersheet auf Roll20, der uns über zahlreiche Sessions Freude bereitet hat (und immer noch Features aufweist, die wir noch nicht haben^^)

## Urheberrecht

Die nachfolgenden Punkte besitzen ein eigenes Copyright. Sollte ein Rechteinhaber nicht aufgeführt sein, gilt auch ohne Nennung weiterhin die von ihm gewählte Lizenz.

[Ilaris](https://ilarisblog.wordpress.com/) ist unter einer [Creative Commons Namensnennung – Nicht kommerziell – Keine Bearbeitungen 4.0 International Lizenz](http://creativecommons.org/licenses/by-nc-nd/4.0/) lizensiert. ![Creative Commons Lizenzvertrag](https://licensebuttons.net/l/by-nc-nd/4.0/80x15.png)

Die Rechte vom genutzten Artwork von Ilaris liegen bei [Bernhard Eisner](https://www.instagram.com/bernhard_eisner/).

[Ilaris Advanced](https://dsaforum.de/viewtopic.php?f=180&t=49412) als optionale Erweiterung für Ilaris.

[Sephrasto](https://github.com/Aeolitus/Sephrasto), aus welchem wir alle Daten ("Compendium Packs") importiert haben.

Weitere Icons von www.game-icons.net.

Foundry VTT: [Limited License Agreement for module development](https://foundryvtt.com/article/license/).

Die genutzten Schriftarten unterliegen dem jeweils bei der Schrift genannten Copyright.

DAS SCHWARZE AUGE, AVENTURIEN, DERE, MYRANOR, THARUN, UTHURIA und RIESLAND sind eingetragene Marken der [Significant Fantasy Medienrechte GbR](http://www.wiki-aventurica.de/wiki/Significant_Fantasy). Ohne vorherige schriftliche Genehmigung der Ulisses Medien und Spiel Distribution GmbH ist eine Verwendung der genannten Markenzeichen nicht gestattet.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
