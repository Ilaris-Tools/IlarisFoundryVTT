# Ilaris für FoundryVTT (**BETA**)
Ein System für [Ilaris](https://ilarisblog.wordpress.com/) zur Verwendung mit [FoundryVTT](https://foundryvtt.com/).

## Disclaimer

Dies ist ein nicht kommerzielles Community-Projekt.
Wir stehen in keinem Verhältnis (angestellt oder ähnliches) zu FoundryVTT, Ilaris, Ulisses oder anderen Rechteinhabern. 

## !!Achtung!!

Ilaris für FoundryVTT befindet sich aktuell in der Entwicklung und stellt kein fertiges Produkt dar.
Die zugrunde liegende Datenstruktur kann (und wird) sich ändern. Alle selbst erstellen Actors und Items sind dann im besten Fall nicht mehr nutzbar, im schlimmsten Fall verursachen sie Bugs und Abstürze.
Bevor Bugs gemeldet werden, sollte der entsprechende Actor/Item gelöscht und neu angelegt/importiert werden.
Abfragen zur Berechnung von Fertigkeitn/Vorteilen/etc. basieren rein auf Strings: Ein Leerzeichen an der falschen Stelle kann daher die Berechnung kaputt machen => Item löschen und neu importieren, bevor ein Bug gemeldet wird.  
Vorschläge und Kritik nehmen wir dankend entgegen, aber wir können keine Garantie geben, wann und ob Anmerkungen umgesetzt werden. Wir arbeiten nur in unserer Freizeit an dem Projekt und haben daher nur sehr wenig zeitliche Ressourcen zur verfügung.

Wer ein stabiles und vollständiges System für VTT sucht, sollte daher auf das [Roll20 Charakter Sheet für Ilaris](https://github.com/Roll20/roll20-character-sheets/tree/master/Das_Schwarze_Auge_Ilaris) zurückgreifen. 


### Unterstützung
Wir freuen uns über jegliche Hilfe und Unterstützung.
Wer Javascript programmieren kann oder in html und css firm ist, beziehungsweise bereit ist es sich anzueignen, ist jederzeit herzlich willkommen. Insbesondere eine künstlerische Ader um den Heldenbogen aufzuhübschen wird dringend benötigt.
Keiner von uns hatte vorherige Erfahrung in der Webprogrammierung; Wir eignen uns die notwendigen Fertigkeiten selber erst im Rahmen des Projekts an (Was beim Einblick in den Code auch recht offensichtlich wird).
Aber auch Anregungen und allgemeines Feedback, welches im [DSA-Forum](https://dsaforum.de/viewtopic.php?f=180&t=55746&sid=58516b319511875ce0bc2dc00b379b4d) gepostet werden kann, helfen uns weiter und sind herzlich willkommen.

## Aktueller Entwicklungsstand
### Berechnete Vorteile
* Abgehärtet II (nur dh)
* Flink I
* Flink II (nur gs)
* Gefäß der Sterne
* Geweiht I/II/III/IV
* Glück I
* Glück II
* Kampfreflexe
* Kampfstile Stufe 1 bis 3 (Es werden nur AT, VT und Schaden, sowie entfallender Malus bei Nebenwaffen berechnet)
* Natürliche Rüstung
* Rüstungsgewöhnung
* Unbeugsamkeit (nur mr)
* Unverwüstlich (nur ws)
* Verbesserte Rüstungsgewöhnung
* Willensstark I
* Willensstark II (nur mr)
* Zauberer I/II/III/IV
* hoffentlich alle Vorteile für Manöver im Nah- und Fernkampf

### Zu beachten / FAQ
* Der obige Absatz unter **!!Achtung!!**
* Im Compendium "Beispielhelden" gibt es "Alrik die leere Vorlage", die schon alle typischen Fertigkeiten ausgerüstet hat. "Alrik der Bauer" ist zur Präsentation mit Werten und Ausrüstung ausgestattet.
* Rüstungen werden erst berechnet, wenn sie angelegt werden. Symbol links neben dem Namen anklicken
* Kampfstile werden nur für die ausgerüsteten Haupt- und Nebenwaffen berechnet
* Es kann maximal jeweils eine Haupt- und Nebenwaffe angelegt sein. Zweihändige Waffen müssen gleichzeitig Haupt- und Nebenwaffe sein, sonst werden die Abzüge für einhändige Führung angerechnet
* Falls (Kampf-)manöver nicht ausgewählt werden können, kontrolliert ob die Voraussetzungen erfüllt sind (Waffeneigenschaften, Waffe ausgerüstet, Kampfstil ausgewählt, Sonderfertigkeit vorhanden)
* Die Manöver im Kompedium schalten die Manöver nicht frei: Das passiert über die entsprechenden Vorteile
* Manöver für Magie und Karma sind noch nicht integriert
* Der Einsatz von Schicksalspunkten funktioniert nur, wenn Schicksalspunkte vorhanden sind. Ansonsten wird ohne Meldung eine normale 3W20 Probe geworfen
* Astral- und Karmapunkte werden nur angezeigt, wenn die Vorteile Zauberer oder Geweiht aktiviert sind
* Der Zukauf von AsP und KaP kann durch einen Mausklick auf das Label AsP/KaP eingestellt werden
* Einzelne Boni und Mali können noch nicht verteilt werden!
* Inventar:
    * Zur Traglast werden die Regeln aus [Ilaris Advanced](https://dsaforum.de/viewtopic.php?f=180&t=49412) verwendet. 
    * Tragend: Gegenstände an der Person, deren Gewicht nicht berücksichtigt wird (zB getragene Kleidung)
    * Mitführend: Gegenstände an der Person, deren Gewicht berücksichtigt wird
    * Lagerplatz/Transportmittel: Wenn man bei einem Gegenstand ein negatives Gewicht einträgt, wird er als externer Speicherort gelistet (zB Eselskarren oder eigenes Haus)
    * Wenn das Durchhaltevermögen (dh*) auf 0 oder niedriger fällt, ist man überladen. (Die Behinderung durch die Rüstung wird vor der Behinderung durch die Traglast berechnet; durch Rüstung kann dh nicht unter 1 fallen)
    * Das Gewicht der Waffen im Kompendium ist einfachst automatisch aus der Sephrasto-Datenbank berechnet => Anpassungen werden nötig sein
* ~~Bei einem Import aus *Beispiel Helden* werden eine ganze Menge Fehler angezeigt. Keine Ahnung woher sie kommen. Es scheint aber dennoch zu funktionieren~~

### TO-DO
Viel und eine ganze Menge. 
1. Nachfragen ob wir die Bilder aus dem Ilaris PDF verwenden dürfen (Ohne Ilarishintergrund sehen die Sheets richtig "mau" aus. Also so richtig...)
1. Verzeichnisstruktur überdenken (zB assets nach Urheberrecht sortieren?)
1. MR als Rollable
1. Manöver für Magie und Karma
1. eigene Boni/Mali eintragen (template.json anpassen. Wie viele verschiede mods [item, profan, magie, karma, ...] kann es geben?)
1. Dice-to-Chat: Clickable Rollmessage für Kampf erstellen -> Vom Verteidiger anklickbar und automatisch Gewinner (und Schaden) ausrechnen und Auswahl der Manöver persistent machen (-> Datenstruktur nochmal ansehen)
1. Chatnachrichten überarbeiten (Dice zusammenfassen, etc.)
1. Tab "Effekte" (Statuseffekte und Boni/Mali Übersicht)
1. Kreaturenklasse anlegen + vereinfachtes Sheet für Kreaturen/NPCs mit *deutlich* weniger Automatisierungen erstellen 
1. "Alles schön machen"    
    * Einarbeitung in html, damit wenigstens halbwegs eine Übersicht vorliegt
    * Einarbeitung in css, um es auch optisch ansprechend zu gestalten
1. Schnittstelle überlegen, so dass die Vorteilsberechnung nicht hardcoded ist -> Eigene Vorteile und Manöver (bzw aus Ilaris Advanced) anlegen/importieren
1. Code aufräumen    

Dies ist nur eine ganz grobe Richtlinie. Es gibt keine fest definierte Roadmap. 
> It will be done when it's done.

## Danke!
* Selbstverständlich an das Team von [Ilaris](https://ilarisblog.wordpress.com/), das in seiner Freizeit ein so großartiges System erstellt hat.
* An [Ulisses](https://ulisses-spiele.de), die Ilaris als Fanregeln sogar in gedruckter Form in ihrem Shop [anbieten](https://www.f-shop.de/detail/index/sArticle/1372).
* Der Charaktereditor [Sephrasto](https://github.com/Aeolitus/Sephrasto), aus dessen Datenbank wir uns schamlos bedient haben und werden.
* [Ilaris Advanced](https://dsaforum.de/viewtopic.php?f=180&t=49412&sid=8837ba1ffde6b5396050628f78a92dce), dessen Regelerweiterungen wir sträflichst vernachlässigt haben.
* für den Ilaris Charaktersheet auf Roll20, der uns über zahlreiche Sessions Freude bereitet hat (und immer noch Features aufweist, die wir noch nicht haben^^)


## Urheberrecht

Die nachfolgenden Punkte besitzen ein eigenes Copyright. Sollte ein Rechteinhaber nicht aufgeführt sein, gilt auch ohne Nennung weiterhin die von ihm gewählte Lizenz. 

[Ilaris](https://ilarisblog.wordpress.com/) ist unter einer [Creative Commons Namensnennung – Nicht kommerziell – Keine Bearbeitungen 4.0 International Lizenz](http://creativecommons.org/licenses/by-nc-nd/4.0/) lizensiert. ![Creative Commons Lizenzvertrag](https://licensebuttons.net/l/by-nc-nd/4.0/80x15.png)

Die Rechte vom genutzten Artwork von Ilaris liegen bei den jeweiligen Künstlern.

[Ilaris Advanced](https://dsaforum.de/viewtopic.php?f=180&t=49412) als optionale Erweiterung für Ilaris.

[Sephrasto](https://github.com/Aeolitus/Sephrasto), aus welchem wir alle Daten ("Compendium Packs") importiert haben.

Icons unter assets/game-icons.net von www.game-icons.net.

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
