# Ilaris für FoundryVTT

Ein System für [Ilaris](https://ilarisblog.wordpress.com/) zur Verwendung mit [FoundryVTT](https://foundryvtt.com/).

## Disclaimer

> Dies ist ein nicht kommerzielles Community-Projekt.
> Wir stehen in keinem Verhältnis (angestellt oder ähnliches) zu FoundryVTT, Ilaris, Ulisses oder anderen Rechteinhabern.
> Das Projekt wurde von Feorg gestartet und das ursprüngliche Repository (kompatibel bis Foundry v9) befindet sich auf [GitLab](https://gitlab.com/Feorg/ilaris-foundryvtt).
> Verwaltet wird das Projekt aktuell von KleinerIrrer. Bei Fragen und Problemen eröffne gern ein Issue oder schreib uns im [Forum](https://dsaforum.de/viewtopic.php?f=180&t=55746) oder im [Discord](https://discord.gg/qEKBnjsspX).
> Wir warten dort um zu Helfen :).


## Unterstützung

Wir freuen uns über jegliche Hilfe. Auch Vorschläge und Kritik werden im [Forum](https://dsaforum.de/viewtopic.php?f=180&t=55746) oder [Discord](https://discord.gg/qEKBnjsspX) dankend entgegen genommen. Die Community von FoundryVTT-Ilaris Spielerinnen ist klein, daher hilft jedes Feedback insbesondere Tests und Erfahrungen mit neuen Versionen. Du hast einen Bug gefunden? Das ist toll! Her damit!

Wir suchen auch Verstärkung im Entwicklerteam. JS-Programmierer und Webdesigner (oder welche die es lernen wollen) sind besonders Wilkommen. Auch eine künstlerische Ader um den Heldenbogen aufzuhübschen und einige assets zu erstellen fehlt bisher. Hier gehts lang um direkt durchzustarten: [CONTRIBUTING.md](./CONTRIBUTING.md)


## Installation

In Foundry unter "Game Systems" -> "Install System" -> "Manifest URL" einfügen und installieren.
```
https://raw.githubusercontent.com/Ilaris-Tools/IlarisFoundryVTT/refs/heads/main/system.json
```
<img src="/utils/screen_install.png"  width="250">

> Für ältere nicht mehr kompatible Foundry versionen schaue in die jeweiligen `foundryvtt-v*` Branches oder folge der Anleitung auf [GitLab](https://gitlab.com/Feorg/ilaris-foundryvtt) für die legacy version bis FoundryVTT v9.


## Aktueller Entwicklungsstand
Für nicht allzu anspruchsvolle Spieler/innen ist das System ausgereift genug um die ein oder andere Session spielen zu können. 
Es ist noch nicht jede kleine Regel implementiert und kleinere Fehler können immer wieder auftreten.
Um einen Überblick zu bekommen, woran gerade gearbeitet wird kannst du einen Blick auf die [offenen Issues](https://github.com/Ilaris-Tools/IlarisFoundryVTT/issues?q=is%3Aissue%20state%3Aopen%20-label%3Awontfix) werfen.
Es gibt ausserdem (nicht sehr aktuelle, aber dafür praxisorientierte) [Screencasts auf YouTube](https://www.youtube.com/playlist?list=PLgv_FQFVPJ-6vOKI3jrfy9d2xfqzQSE-X).



## Bekannte Probleme

- Abfragen zur Berechnung von Fertigkeitn/Vorteilen/etc. basieren rein auf Strings: Ein Leerzeichen an der falschen Stelle kann daher die Berechnung kaputt machen => Item löschen und neu importieren, bevor ein Bug gemeldet wird.
- Bereits gemeldete Probleme werden [hier als Issues](https://github.com/Ilaris-Tools/IlarisFoundryVTT/issues?q=is%3Aissue%20state%3Aopen%20label%3Abug) gesammelt
- In der Dokumentation finden sich auch noch ein paar [nützliche Hinweise zur Benutzung](docs/faq.md)


## Danke!

-   Selbstverständlich an das Team von [Ilaris](https://ilarisblog.wordpress.com/), das in seiner Freizeit ein so großartiges System erstellt hat.
-   An [Ulisses](https://ulisses-spiele.de), die Ilaris als Fanregeln sogar in gedruckter Form in ihrem Shop [anbieten](https://www.f-shop.de/detail/index/sArticle/1372).
-   Der Charaktereditor [Sephrasto](https://github.com/Aeolitus/Sephrasto), aus dessen Datenbank wir uns schamlos bedient haben und werden.
-   [Ilaris Advanced](https://dsaforum.de/viewtopic.php?f=180&t=49412&sid=8837ba1ffde6b5396050628f78a92dce), dessen Regelerweiterungen wir sträflichst vernachlässigt haben.
-   für den Ilaris Charaktersheet auf Roll20, der uns über zahlreiche Sessions Freude bereitet hat (und immer noch Features aufweist, die wir noch nicht haben^^)


## Lizenz und Rechtliches

Der Quellcode dieses Projekts steht unter der [MIT License](./LICENSE).

Die nachfolgenden Punkte besitzen ein eigenes Copyright.
Sollte ein Rechteinhaber nicht aufgeführt sein, gilt auch ohne Nennung weiterhin die von ihm gewählte Lizenz.

[Ilaris](https://ilarisblog.wordpress.com/) ist unter einer [Creative Commons Namensnennung – Nicht kommerziell – Keine Bearbeitungen 4.0 International Lizenz](http://creativecommons.org/licenses/by-nc-nd/4.0/) lizensiert. ![Creative Commons Lizenzvertrag](https://licensebuttons.net/l/by-nc-nd/4.0/80x15.png)

Die Rechte vom genutzten Artwork von Ilaris liegen bei [Bernhard Eisner](https://www.instagram.com/bernhard_eisner/).

[Ilaris Advanced](https://dsaforum.de/viewtopic.php?f=180&t=49412) als optionale Erweiterung für Ilaris.

[Sephrasto](https://github.com/Aeolitus/Sephrasto), aus welchem wir alle Daten ("Compendium Packs") importiert haben.

Weitere Icons von www.game-icons.net.

Foundry VTT: [Limited License Agreement for module development](https://foundryvtt.com/article/license/).

Die genutzten Schriftarten unterliegen dem jeweils bei der Schrift genannten Copyright.

DAS SCHWARZE AUGE, AVENTURIEN, DERE, MYRANOR, THARUN, UTHURIA und RIESLAND sind eingetragene Marken der [Significant Fantasy Medienrechte GbR](http://www.wiki-aventurica.de/wiki/Significant_Fantasy). Ohne vorherige schriftliche Genehmigung der Ulisses Medien und Spiel Distribution GmbH ist eine Verwendung der genannten Markenzeichen nicht gestattet.
