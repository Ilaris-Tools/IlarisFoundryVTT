# Hausregeln

Das System unterstützt Hausregeln bisher nur sehr begrenzt. Bei der Entwicklung
werden Hausregeln bei Design-Entscheidungen zwar berücksichtigt, ein direkter
Import von einer Hausregeldatenbank ist allerdings noch nicht direkt möglich.
Einige Komponenten des Systems sind allerdings modular genug aufgebaut, dass
sie bereits in Foundry angepasst oder erweitert werden können.
Was möglich ist und wie es funktioniert ist im Folgendem beschrieben.

> Als SL können die mitinstallierten System-Kompendien zwar entsperrt und
> bearbeitet werden, aber diese werden bei Updates möglicherweise wieder
> überschrieben. Es empfiehlt sich eigene Kompendien anzulegen.


## Vorteile

Ilaris-Vorteile stehen als [Kompendium](foundry-basics.md) zur Verfügung
und können einem Charakter-[Akteur](foundry-basics.md) (neben dem
[Sephrasto-Import](faq.md#Wie-kann-ich-meinen-mit-Sephrasto-generierten-Charakter in-Foundry-nutzen))
per drag'n'drop zugewiesen werden. Dies funktioniert ebenso aus selbst erstellten
Kompendien (typ "item"), die mit eigenen Inhalten (item-typ: "Vorteil") befüllt
sind. Die Vorteile selbst erscheinen auf dem Charakterblatt aber haben (noch)
keinen direkten Einfluss auf Regelmechaniken. Sie eignen sich aber als
Vorraussetzung für eigene Manöver, die dann im Würfeldialog zur Auswahl stehen
und Proben beeinflussen können.


## Manöver

In einem eigenen Spielwelt-Kompendium können auch eigene Manöver erstellt
werden. Die Eingabemaske für Manöver ist etwas komkplizierter erlaubt dafür
aber diese mit anpassbaren Eingabefeldern in den Würfeldialog zu integrieren.
Für ein Manöver, dass im Nahkampf nur einzelne Werte anpasst reicht in der
Regel eine Checkbox und ein oder mehrere Modifikatoren.
Falls die Möglichkeiten nicht ausreichen oder unklar sind, nimm gerne direkt
[Kontakt](index.md#kontakt). Wir hoffen die Manöver in Zukunft noch
vielseitiger machen zu können. Vorteile (auch eigene) können als Vorraussetzung
gewählt werden um ein Manöver nur bestimmten Akteuren zugängig zu machen.
Um selbsterstellte Manöver im Würfeldialog zu verwenden muss das entsprechende
Kompendium vom Spielleiter in den [Welteinstellungen](einstellungen.md) aktiviert werden.