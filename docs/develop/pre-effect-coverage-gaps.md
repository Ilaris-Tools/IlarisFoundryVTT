# Pre-Effect-Lücken für die vollständige Zauberabdeckung

Dieses Dokument erfasst die offenen Unterschiede zwischen dem gegenwärtigen
Pre-Effect-System und der vollständigen Regelwirkung der im August 2026
überprüften Zauber. Es ist die Arbeitsgrundlage für spätere OpenSpec-Änderungen;
es nimmt keine Vorentscheidung über ihre Reihenfolge vor.

## Geltungsbereich

Nicht enthalten sind die ausdrücklich als Platzhalter behandelten Zauber:
_Destructibo Arcanitas_, _Memorans Gedächtniskraft_, _Respondami
Wahrheitszwang_, _Krötensprung_, _Spinnenlauf_ und _Granit und Marmor_. Für sie
reicht ein sichtbarer, regelneutraler Hinweis-Effekt.

„Teilweise“ bedeutet hier: Der verwendbare Pre-Effect- oder Zone-Baustein
existiert bereits, aber mindestens eine regelrelevante Wirkung des konkreten
Zaubers fehlt. Eine sichtbare Markierung zählt nicht als erzwungene
Regelwirkung.

_Krabbelnder Schrecken_ ist vollständig im vereinbarten Umfang: Bei
misslungener Willenskraft-Probe erzeugt er den sichtbaren, zeitlich begrenzten
Marker _Handlungsunfähig_. Das System verwaltet noch keine Kampfhandlungen und
leitet aus diesem Marker daher keine Aktionssperre ab; das ist keine offene
Pre-Effect-Lücke.

## Offene Zauberwirkungen – priorisiert

Die Reihenfolge nimmt an, dass sichtbare, vollständige Zauber möglichst früh
geliefert werden sollen und wiederverwendbare Bausteine vor ihren einzelnen
Verbrauchern entstehen. P0 ist reines Quell-Autoring; P1/P2 sind die Quick
Wins bzw. kompakten, mehrfach nutzbaren Erweiterungen. P5 ist bewusst zuletzt.

| Priorität | Zauber                             | Stand heute                                                                                                                                                                          | Für vollständige Abdeckung fehlt                                                                                                                                                                                                                                                                                                                                                                               |
| --------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0        | _Dämonenbann — Magie unterdrücken_ | Der vorhandene `ilarisModifiers.selector.fertigkeit` kann einen Malus auf die Fertigkeit `Dämonisch` begrenzen; eine passive Zone erhält ihn nur für Wesen im Bereich.               | Ausschließlich Autoring der konkreten Zone: Geometrie, Dauer und regeldefinierter Malus. Dafür ist keine neue Modifikator-Funktion erforderlich.                                                                                                                                                                                                                                                               |
| P1        | _Blitz dich find_                  | Der globale Probenmalus von `-2` ist als Pre-Effect ausdrückbar; ein eigener Blindheitsstatus ist dafür nicht erforderlich.                                                          | Ziel-eigene Magieresistenz-Schwierigkeit.                                                                                                                                                                                                                                                                                                                                                                      |
| P2        | _Krähenruf_                        | Die Kreaturquelle kann aus dem Compendium stammen.                                                                                                                                   | Ein schlanker `summonActor`-Pre-Effect für den definierten Krähenschwarm, einschließlich Platzierung und der Mächtige-Magie-Werte.                                                                                                                                                                                                                                                                             |
| P2        | _Skelettarius Totenherr_           | Die Kreaturquelle kann aus dem Compendium stammen.                                                                                                                                   | Derselbe `summonActor`-Pre-Effect für den ausgewählten Untoten als Token. Die zwei Initiativphasen Verzögerung gehören zur Auslösung.                                                                                                                                                                                                                                                                          |
| P2        | _Ignifaxius Flammenstrahl_         | Direkter 4W6-Feuerschaden mit Skalierung ist umgesetzt.                                                                                                                              | Zwei getrennte Bausteine: ballistische Auflösung nach erfolgreicher Zauberprobe (`add-ballistic-spell-resolution`) und der regelwirksame, zeitlich begrenzte Zustand _Nachbrennen_ (`add-nachbrennen-effect`).                                                                                                                                                                                                 |
| P2        | _Wand aus Flammen_                 | Der Zonenmechanismus unterstützt bereits persistente Wände und `onTraverse`; _Wand aus Dornen_ ist der geprüfte Verbraucher.                                                         | Eine rechteckige, persistente Zonenquelle für diese konkrete Wand, 4W6 SP beim Durchqueren, KO-12 beim Annähern mit _Nachbrennen_ bei Misserfolg sowie Größen-Skalierung. Die Zone muss keine Tokenbewegung verhindern.                                                                                                                                                                                        |
| P3        | _Bannschwert_                      | Nicht abgedeckt                                                                                                                                                                      | Auswahl einer Waffe, zeitlich begrenzte oder permanente Verzauberung und die Kennzeichnung als magisch mit dem Bannungsbonus `+2`.                                                                                                                                                                                                                                                                             |
| P3        | _Pandämonium_                      | Persistente passive Zone, Schaden über Zeit und GE-16-Bewegungswiderstand sind umgesetzt.                                                                                            | Filter für Wesen mit _Unheilig_. Eine misslungene Bewegungsprobe bleibt absichtlich ein sichtbarer Hinweis mit manueller Spielleitungsentscheidung; sie soll kein automatisches Zurücksetzen des Tokens verlangen.                                                                                                                                                                                             |
| P3        | _Schutzkreis gegen Daimonide_      | Die vorhandenen Zonen- und Bewegungswiderstandsabläufe sind ausreichend: Ein Grenzübertritt löst eine Probe aus und Erfolg bzw. Misserfolg wird als Spielleitungs-Hinweis behandelt. | Autoring der Zone und ein datengetriebener Kreaturenfilter: Der im Zauber angegebene Textwert (hier `Daimonide`) wird mit `system.kreaturentyp` des Ziel-Actors verglichen; zusätzlich Beschwörungsschwierigkeit prüfen. Die _Bannkreis_-Modifikation verwendet denselben Hinweis-Ablauf für Heranziehen, MR-Befreiungsversuch alle zwei Stunden und Immunität; sie benötigt keine automatische Tokenbewegung. |
| P3        | _Armatrutz_                        | Nicht abgedeckt.                                                                                                                                                                     | Zeitlich begrenzte Änderung des abgeleiteten RS einschließlich der Skalierung von `+1 RS` je zwei Stufen Mächtige Magie.                                                                                                                                                                                                                                                                                       |
| P3        | _Corpofrigo Kälteschock_           | Der Athletik-Malus kann über den vorhandenen Situations-Selektor auf Bewegungsproben begrenzt werden.                                                                                | Ziel-eigene Magieresistenz-Schwierigkeit und die stufenweise GS-Teilung (½, ¼, ⅛ …).                                                                                                                                                                                                                                                                                                                           |
| P4        | _Fesselranken_                     | Die Basiswirkung verwendet denselben Pre-Effect wie das Manöver _Umklammern_ und benötigt keine neue Fesselmechanik.                                                                 | Nur die optionale _Dornenfessel_: Schaden nach einer misslungenen Befreiungsprobe.                                                                                                                                                                                                                                                                                                                             |
| P4        | _Ignisphaero_                      | Nicht abgedeckt.                                                                                                                                                                     | Beschwören eines caster-eigenen Sphären-Actors mit Token und einer Aktion `Detonieren`. Der Zauber benötigt den unten beschriebenen Konzentrations-Lebenszyklus; Blickkontakt bleibt eine Spieler-/Spielleitungsentscheidung. `Detonieren` löst wie _Tlalucs Odem_ eine sofortige kreisförmige Zone aus, reduziert den Schaden pro Schritt Abstand zum Zentrum und wendet _Nachbrennen_ an.                    |
| P5        | _Corpofesso Gliederschmerz_        | Nicht abgedeckt; dies ist die weitreichendste verbleibende Regelwirkung.                                                                                                             | Eine Kategorie `körperlich` an Fertigkeiten, damit abgeschlossene körperliche Fertigkeitsproben als Anstrengung erkannt werden. Jeder Kampfdialog zählt ebenfalls als körperliche Anstrengung. Der Active Effect muss diese Ereignisse und das DH\*-Intervall des betroffenen Actors selbst festhalten und beim erreichten Intervall 1 Punkt Erschöpfung auslösen.                                             |

### Lieferreihenfolge der Bausteine

1. **P0:** _Dämonenbann_ lediglich mit den vorhandenen Zone- und
   Fertigkeitsmodifikatoren als Quelle auszeichnen.
2. **P1:** Ziel-eigene Magieresistenz implementieren und damit _Blitz dich
   find_ vollständig machen.
3. **P2:** Zuerst `add-ballistic-spell-resolution`, danach unabhängig
   `add-nachbrennen-effect` liefern. _Ignifaxius_ verwendet beide Bausteine;
   _Wand aus Flammen_ und _Ignisphaero_ können später den Nachbrennen-Baustein
   wiederverwenden.
4. **P3:** Gefilterte Zonen, Waffenverzauberung sowie abgeleitete RS/GS
   angehen; daraus folgen _Pandämonium_, _Schutzkreis_, _Bannschwert_,
   _Armatrutz_ und _Corpofrigo_.
5. **P4:** Optionale _Dornenfessel_ und den Konzentrations-Lebenszyklus für
   _Ignisphaero_ ergänzen.
6. **P5:** _Corpofesso_ zuletzt, weil dafür Fertigkeitsdaten und zwei
   unterschiedliche Wurfeldialoge gemeinsam Instrumentierung brauchen.

## Gemeinsame Erweiterungspunkte

- **Magieresistenz:** Bei der Zielauswahl würfelt das Ziel `1W20`. Seine MR
  zuzüglich dieses Wurfs ist die Schwierigkeit der Zauberprobe. Dieser
  ziel-eigene Schwierigkeitswurf fehlt für _Blitz dich find_, _Corpofrigo
  Kälteschock_ und weitere Zauber mit Magieresistenz.
- **Gefilterte Zonen:** _Pandämonium_ und _Schutzkreis gegen Daimonide_
  benötigen Filter auf Actor- bzw. Kreatureneigenschaften. Für einen
  _Schutzkreis_ soll der Textwert der Zauberquelle (etwa `Daimonide`) als
  konfigurierbarer String gegen `system.kreaturentyp` des Kreatur-Actors
  verglichen werden. Damit kann derselbe Mechanismus auch andere Schutzkreise
  abbilden, ohne eine feste Liste von Kreaturenkategorien im Code zu pflegen.
  Die Filter dürfen nicht die bestehende Regionsgeometrie duplizieren.
  _Dämonenbann_ verwendet dagegen den vorhandenen Fertigkeits-Selektor.
- **Zonengeometrie:** Nicht-runde Zonen brauchen eine gespeicherte Rotation.
  Mächtige Magie muss außerdem die in der Quelle definierten Abmessungen einer
  Zone (zum Beispiel Länge und Höhe einer Wand) vergrößern können. Beide
  Angaben gehören in den allgemeinen Zonenpfad und nicht in die einzelne
  Zauberwirkung.
- **Zustände und abgeleitete Werte:** RS, prozentuale GS und
  aktivitätsabhängige Erschöpfung brauchen jeweils eine Regelgrenze, damit ein
  Active Effect nicht nur einen irreführenden Marker erzeugt.
- **Körperliche Anstrengung:** _Corpofesso_ braucht eine Fertigkeitskategorie
  `körperlich` und einen gemeinsamen Abschluss-Hook für Fertigkeits- und
  Kampfproben. Der verursachende Active Effect führt dabei seinen eigenen
  Ereignis- und DH\*-Stand.
- **Kreaturenbeschwörung:** _Krähenruf_ und _Skelettarius Totenherr_ brauchen
  keinen neuen Kreaturenbestand: Ihre Quellen liegen im Compendium. Es fehlt
  nur ein schlanker `summonActor`-Pre-Effect zum Auflösen der Quelle und zum
  Platzieren eines Tokens; `summonItem` erstellt absichtlich nur
  Actor-eigene Gegenstände.

## Konzentration

Konzentration ist ein eigener, wiederverwendbarer Lebenszyklus für jede
Wirkung mit `requiresConcentration`. Die Anwendung wird mit der zaubernden
Person und einer gemeinsamen Anwendungs-ID verbunden.

Die vollständige Aktion _Konzentration (voll)_ wird nicht nachgebildet: Das
System verwaltet derzeit weder die Wahl dieser Aktion in jeder
Initiativphase noch ihre Einschränkung für Freie Aktionen und Reaktionen.
Als ausreichende Ergänzung für konzentrierte Pre-Effects endet die
Konzentration, wenn die zaubernde Person einen neuen Zauber beginnt oder eine
andere Fertigkeitsprobe ablegt.

Eingetretener Schaden eröffnet dagegen die besondere Willenskraft-Probe der
Aktion Konzentration: Schwierigkeit 16, erhöht um `+4` je gerade erlittener
Wunde. Diese Probe zählt nicht als unterbrechende Fertigkeitsprobe; nur ihr
Misslingen beendet die Konzentration.

Beim Ende entfernt der Lebenszyklus alle zur Anwendungs-ID gehörenden
Artefakte: Active Effects, beschworene Gegenstände, beschworene Actors/Tokens
und Zonen. Damit endet zum Beispiel eine nicht detonierte _Ignisphaero_
vollständig und ohne verwaiste Dokumente.

## Ballistische Zauber

Ein Zauber braucht eine explizite Ballistik-Kennung in seinen Quelldaten. Nach
einer erfolgreichen Zauberprobe gegen ein Ziel führt die Auflösung, vor jedem
Pre-Effect, dieselben Schritte wie ein Fernkampfangriff aus:

1. Direkte Sichtlinie zum Ziel prüfen.
2. Dem Ziel die Abwehr eines Fernkampfangriffs ermöglichen, einschließlich
   vorhandener Abwehrmodifikatoren.
3. Nur bei nicht abgewehrtem Zauber Schaden, elementare Nebeneffekte und
   weitere Pre-Effects auf das Ziel anwenden.

Damit verwendet _Ignifaxius Flammenstrahl_ keinen Sonderweg. Derselbe Ablauf
steht allen als ballistisch markierten Zaubern offen.

## Elementare Nebeneffekte

Elementare Nebeneffekte werden an den vom Spielleiter konfigurierten
Schadenstyp gebunden. Ein Schadenstyp erhält dazu optional eine
`elementalSideEffect`-Kennung; die sechs Standardzuordnungen sind:

| Schadenstyp | Nebeneffekt        | Regelwirkung                                                                                                                       |
| ----------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Eis         | _Erfrieren_        | KO 20: 1 Erschöpfung; bei drei Wunden aus einem Angriff KO 24, um 1 Erschöpfung zu vermeiden.                                      |
| Wasser      | _Ertränken_        | GE 20: bis zur übernächsten Initiativephase handlungsunfähig.                                                                      |
| Humus       | _Fesseln_          | GE 20: für vier Initiativephasen bewegungsunfähig.                                                                                 |
| Feuer       | _Nachbrennen_      | KO 20: nach vier Initiativephasen einmalig 1 Wunde, sofern nicht gelöscht.                                                         |
| Erz         | _Niederschmettern_ | KK 20: stürzen.                                                                                                                    |
| Luft        | _Zurückstoßen_     | KK 20: vier Schritt zurück; wie bestehende Zurückstoßen-Effekte als Spielleitungs-Hinweis, nicht durch automatische Tokenbewegung. |

Bei Schaden löst die konfigurierte Kennung die passende Regelwirkung aus.
Verursacht ein Zauber nur den Nebeneffekt, aber keinen Schaden, wird stattdessen
eine Konterprobe abgelegt; bei Misserfolg tritt der konfigurierte Nebeneffekt
ein. Damit können Zauber wie _Ignifaxius_, _Ignisphaero_ und _Wand aus
Flammen_ _Nachbrennen_ über ihren Schadenstyp bzw. über einen expliziten
nebeneffekt-auslösenden Pre-Effect verwenden, ohne Feuer fest in der
Pre-Effect-Logik zu verdrahten.

## Bereits vorhandene Bausteine

- Persistente Regionen mit Eintritts-, Runden- und
  Durchquerungsauslösern, einschließlich der bewussten Entscheidung, Bewegung
  nicht selbst zurückzusetzen.
- Direktschaden, Schaden über Zeit, zeitlich begrenzte regelbewusste
  Probenmodifikatoren, Widerstands-Ergebniszweige und sichtbare Marker.
- Temporäre Beschwörung von Actor-eigenen Gegenständen, zum Beispiel für
  _Hexenkrallen_.

Siehe auch die [aktive Wirkungsinventur](spell-liturgy-effect-inventory.md)
und die [allgemein zurückgestellten Mechaniken](pre-effect-deferred-mechanics.md).
