# Ilaris für FoundryVTT
Ein System für [Ilaris](https://ilarisblog.wordpress.com/) zur Verwendung mit [FoundryVTT](https://foundryvtt.com/).

## Disclaimer

Dies ist ein nicht kommerzielles Community-Projekt.
Wir stehen in keinem Verhältnis (angestellt oder ähnliches) zu FoundryVTT, Ilaris, Ulisses oder anderen Rechteinhabern. 

## !!Achtung!!

Ilaris für FoundryVTT befindet sich aktuell in der Entwicklung und stellt kein fertiges Produkt dar.
Die zugrunde liegende Datenstruktur kann (und wird) sich ändern. Alle selbst erstellen Actors und Items sind dann im besten Fall nicht mehr nutzbar, im schlimmsten Fall verursachen sie Bugs und Abstürze.
Bevor Bugs gemeldet werden, sollte der entsprechende Actor/Item gelöscht und neu angelegt/import werden.
Abfragen zur Berechnung basieren noch rein auf Strings: Ein Leerzeichen an der falschen Stelle kann daher die Berechnung kaputt machen => Item löschen und neu importieren, bevor ein Bug gemeldet wird.  

Wer ein stabiles und vollständiges System für VTT sucht, sollte daher auf das [Roll20 Charakter Sheet für Ilaris](https://github.com/Roll20/roll20-character-sheets/tree/master/Das_Schwarze_Auge_Ilaris) zurückgreifen. 


### Unterstützung
Wir freuen uns über jegliche Hilfe und Unterstützung.
Wer Javascript programmieren kann oder in html und css firm ist, beziehungsweise bereit ist es sich anzueignen, ist jederzeit herzlich willkommen.
Keiner von uns hatte vorherige Erfahrung in der Webprogrammierung; Wir eignen uns die notwendigen Fertigkeiten selber erst im Rahmen des Projekts an.
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

### Zu beachten
* Der obige Absatz unter **!!Achtung!!**
* Rüstungen werden erst berechnet, wenn sie angelegt werden. Symbol links neben dem Namen anklicken
* Kampfstile werden nur für die ausgerüsteten Haupt- und Nebenwaffen berechnet
* Es kann maximal jeweils eine Haupt- und Nebenwaffe angelegt sein. Zweihändige Waffen müssen gleichzeitig Haupt- und Nebenwaffe sein, sonst werden die Abzüge für einhändige Führung angerechnet
* Der Einsatz von Schicksalspunkten (Bei profanen Fertigkeiten) funktioniert nur, wenn Schicksalspunkte vorhanden sind. Ansonsten wird ohne Meldung eine normale 3W20 Probe geworfen
* Astral- und Karmapunkte werden nur angezeigt, wenn die Vorteile Zauberer oder Geweiht aktiviert sind
* Der Zukauf von AsP und KaP kann durch einen Mausklick auf das Label AsP/KaP eingestellt werden
* Bei einem Import aus *Beispiel Helden* werden eine ganze Menge Fehler angezeigt. Keine Ahnung woher sie kommen. Es scheint aber dennoch zu funktionieren

### TO-DO
Viel und eine ganze Menge. 
1. Helden vervollständigen    
Berechnunungen und Probenwürfe ergänzen, so dass ein nutzbares Heldensheet vorliegt
2. Vereinfachtes Sheet für Kreaturen/NPCs mit *deutlich* weniger Automatisierungen erstellen 
3. "Alles schön machen"    
    * Einarbeitung in html, damit wenigstens halbwegs eine Übersicht vorliegt
    * Einarbeitung in css, um es auch optisch ansprechend zu gestalten
4. Code aufräumen    
Die oben genannten String-Hacks entfernen, Datenstruktur finalisieren, Berechnungen und Variablen-/Funktionsnamen vereinheitlichen, etc.

Dies ist nur eine ganz grobe Richtlinie. Es gibt keine fest definierte Roadmap. 
> It will be done when it's done.

## Beiträge, Inspirationen und Vorlagen
* Selbstverständlich [Ilaris](https://ilarisblog.wordpress.com/) als Regelgrundlage
* Der Charaktereditor [Sephrasto](https://github.com/Aeolitus/Sephrasto), aus dessen Datenbank wir uns schamlos bedient haben und werden
* Andere Systeme für FoundryVTT, die wir als Vorlage genommen haben, sind unter anderem [Call of Cthulhu](https://github.com/HavlockV/CoC7-FoundryVTT), [Starwars](https://github.com/StarWarsFoundryVTT/StarWarsFFG) und die Arbeiten von [moo-man](https://github.com/moo-man).


## Urheberrecht

Sofern keine anderen Rechte vorliegen, ist der Sourcecode unter der [MPL 2.0](https://www.mozilla.org/en-US/MPL/2.0/) veröffentlicht. Insbesondere die "Compendium Packs" und die nachfolgenden Punkte besitzen ein eigenes Copyright und stehen daher ausdrücklich nicht unter der MPL 2.0. Sollte ein Rechteinhaber nicht aufgeführt sein, gilt auch ohne Nennung weiterhin die von ihm gewählte Lizenz. 

[Ilaris](https://ilarisblog.wordpress.com/) ist unter einer [Creative Commons Namensnennung – Nicht kommerziell – Keine Bearbeitungen 4.0 International Lizenz](http://creativecommons.org/licenses/by-nc-nd/4.0/) lizensiert. ![Creative Commons Lizenzvertrag](https://licensebuttons.net/l/by-nc-nd/4.0/80x15.png)

Die Rechte vom genutzten Artwork von Ilaris liegen bei den jeweiligen Künstlern.

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
