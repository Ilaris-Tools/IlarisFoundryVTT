# Ilaris für FoundryVTT
Ein System für [Ilaris](https://ilarisblog.wordpress.com/)  zur Verwendung mit [FoundryVTT](https://foundryvtt.com/).

**Achtung:** In der vorliegenden Form ist das System nicht für eine allgemeine Nutzung vorgesehen. Es sind noch nicht alle notwendigen Funktionen implementiert und die templates können und werden sich ohne Ankündigung von einem Tag zum anderen ändern. Wer eine VTT Unterstützung für Ilaris sucht, kann und sollte auf das [Roll20 Charakter Sheet für Ilaris](https://github.com/Roll20/roll20-character-sheets/tree/master/Das_Schwarze_Auge_Ilaris) zurück greifen.

### Unterstützung
Wir freuen uns über jegliche Hilfe und Unterstützung. Wer Javascript programmieren kann oder in html und css firm ist, ist jederzeit herzlich willkommen. Aber auch Anregungen und allgemeines Feedback, welches im [DSA-Forum](https://dsaforum.de/viewtopic.php?f=180&t=55746&sid=58516b319511875ce0bc2dc00b379b4d) gepostet werden kann, helfen uns weiter. 


## Roadmap und Versionshistorie
### TODO (in naher Zukunft)
* Freie Fertigkeiten
* Schips
* Waffen und Kampfsystem implementieren
    * Waffensheet
    * Initiative
    * Waffeneigenschaften
    * Manöver
    * Sonderfertigkeiten
    * Kampfvorteile
* Proben erweitern. 3d10, 1d20 und der Einsatz von Schicksalspunkten
* Templates für profante Talente und Fertigkeiten finalisieren => Einen Importer aus der [Sephrasto](https://github.com/Aeolitus/Sephrasto)-Datenbank erstellen 
oder Compedium Packs händisch anlegen.
* Fehlende und abgeleitete Werte erstellen und berechnen. Geschwindigkeit, Durchhaltevermögen, Magieresistenz, ...

### TODO (in ferner Zukunft)
* Formatieren und Aufhübschen (CSS)
* Automatisierung, zB für Zauber und Liturgien
* Helden aus Sephrasto importieren
* Durchsuchbares Kompedium zur Übersicht

### Bisherige Funktionalität
* Wunden und Erschöpfung als einzelne Eingabe und Berechnung der Wundabzüge
* Eingabe der Attribute und Berechnung des Probenwertes. Attributsprobe bei Klick auf den PW
* profane Fertigkeiten und Talente
    * können entweder auf dem HeldenSheet oder als Item erstellt werden
    * automatisch alphabetische Sortierung in der Talentgruppe (Wie bei Sephrasto)
    * Berechnung des PW und PWT
    * Probe auf PW und PWT mit klick auf den entsprechenden Wert.
    * Klick auf den Namen der Fertigkeit öffnet auf dem Sheet eine genauere Beschreibung. Ein klick auf eines der gelisteten Talente würfelt eine Probe direkt auf das Talent.
    * Talente, die nicht einsortiert werden können, erscheinen in einer extra Liste.
* magische und karmale Fertigkeiten und Talente
    * können entweder auf dem HeldenSheet oder als Item erstellt werden
    * alphabetische Sortierung, zuerst Magie, dann Karma
    * Talente haben den Eintrag Fertigkeiten, eine mit Komma abgetrennte Liste der möglichen Fertigkeiten zur Talentnutzung. Zur Berechnung des Probenwertes wird die höchste Fertigkeit auf dem Heldensheet gesucht, die in der Liste aufgeführt ist. Das Verhalten kann im Eintrag "Ausgewählte Fertigkeit" überschrieben werden.
    * Probe auf Fertigkeit und Talent bei klick auf PW
    * Bei einem Klick auf den Namen öffnet sich auf dem Heldensheet eine Beschreibung zur Fertigkeit, beziehungsweise zum Talent
* Rüstungen
    * können entweder auf dem HeldenSheet oder als Item erstellt werden
    * automatische Berechnung der WS*
    * Können getragen oder abgelegt werden, sichtbar am true/false auf dem Heldensheet. Aktuell nur über edit-item möglich und nicht direkt über das Heldensheet.

## Beiträge, Inspirationen und Vorlagen
* Selbstverständlich [Ilaris](https://ilarisblog.wordpress.com/) als Regelgrundlage
* Der Charaktereditor [Sephrasto](https://github.com/Aeolitus/Sephrasto), aus dessen Datenbank wir uns schamlos bedient haben und werden
* Andere Systeme für FoundryVTT, die wir als Vorlage genommen haben, sind unter anderem [Call of Cthulhu](https://github.com/HavlockV/CoC7-FoundryVTT), [Starwars](https://github.com/StarWarsFoundryVTT/StarWarsFFG) und die Arbeiten von [moo-man](https://github.com/moo-man).


## Urheberrecht

[Ilaris](https://ilarisblog.wordpress.com/) ist unter einer [Creative Commons Namensnennung – Nicht kommerziell – Keine Bearbeitungen 4.0 International Lizenz](http://creativecommons.org/licenses/by-nc-nd/4.0/) lizensiert. ![Creative Commons Lizenzvertrag](https://licensebuttons.net/l/by-nc-nd/4.0/80x15.png)

DAS SCHWARZE AUGE, AVENTURIEN, DERE, MYRANOR, THARUN, UTHURIA und RIESLAND sind eingetragene Marken der [Significant Fantasy Medienrechte GbR](http://www.wiki-aventurica.de/wiki/Significant_Fantasy). Ohne vorherige schriftliche Genehmigung der Ulisses Medien und Spiel Distribution GmbH ist eine Verwendung der genannten Markenzeichen nicht gestattet.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.