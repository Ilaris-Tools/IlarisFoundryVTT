## Why

Übernatürliche Ilaris-Zauber können derzeit Gegenstände, aber keine Kreaturen aus dem Kreaturen-Kompendium beschwören. Dadurch fehlen für Tier-, Elementar-, Dämonen- und andere Beschwörungen sowohl eine regelkonforme Auswahl im Zauberdialog als auch die direkte Platzierung der beschworenen Kreatur auf der aktuellen Szene.

Die bestehende Pre-Effect- und strukturierte Zauberform-Architektur bietet bereits den passenden Erfolgs-Hook. Die Erweiterung macht Beschwörungen für Spielleiter konfigurierbar, ohne einen zweiten Zaubermechanismus einzuführen.

## What Changes

- Ein neuer `summonCreature`-Pre-Effect erlaubt die Beschwörung eines Kreaturen-Actors aus konfigurierten Actor-Kompendien.
- Kreaturen-Kompendien werden als GM-editierbares World-Setting mit `Ilaris.kreaturen` als Standard hinterlegt und in die bestehende Kompendienverwaltung aufgenommen.
- Kreaturen-Actors erhalten `summoningDifficulty` und `summoningCost`, jeweils mit dem Default `12` auch für fehlende Alt-Daten.
- Der Zauber-Editor kann erlaubte `kreaturentyp`-Werte konfigurieren.
- Die Handlebars-Templates für normale und strukturierte übernatürliche Talente zeigen abhängig vom aktivierten Pre-Effect nur die zugehörigen Felder; irrelevante Felder werden ausgeblendet, damit die Konfiguration verständlich bleibt.
- Der Zauberdialog zeigt zuerst den Kreaturentyp und anschließend alle passenden Kreaturen aus den aktivierten Kompendien.
- Bei erfolgreicher Probe ersetzen die Werte des ausgewählten Kreaturen-Actors die normalen Zauberschwierigkeit und Zauberkosten; fehlende Werte verwenden `12`.
- Die Kreatur wird als unlinked Token auf der aktuellen Szene erzeugt. Die Platzierung beginnt direkt neben dem Beschwörer und sucht bei belegten Feldern ringweise weiter.
- Ein Zauber kann mit einem globalen Schalter und pro Kreaturentyp konfigurierten Einträgen eine Beherrschungsprobe des Beschwörers aktivieren. Sie verwendet eine Attribut- oder Fertigkeit/Talent-Probe gegen eine feste Schwierigkeit und wird erst nach der Token-Erzeugung gewürfelt.
- Das Ergebnis der Beherrschungsprobe wird nur als erfolgreich oder nicht erfolgreich angezeigt. Ist die globale Funktion deaktiviert oder für den ausgewählten Kreaturentyp kein Eintrag konfiguriert, wird keine Probe verlangt; ein Fehlschlag verhindert die Beschwörung nicht.
- Der beschworene Token bleibt bestehen, bis der Spielleiter ihn löscht. Nach der Erzeugung wird das Kreaturenblatt geöffnet.
- Ein Zauber kann für die beschworene Kreatur eine zusätzliche `boundResourceCost` aus gAsP oder gKaP mit einem festen Betrag definieren. Der gehaltene Beschwörer zahlt diese Bindung beim Erzeugen des Tokens; beim Löschen des Tokens wird sie wieder freigegeben.
- Ein Tutorial-Eintrag im passenden Tutorial-/Kurzübersichten-Kompendium erklärt die Einrichtung der Kreaturen-Kompendien, des `summonCreature`-Pre-Effects und der optionalen Beherrschungsprobe.
- Die Erweiterung ist additiv, verändert aber den bestehenden Pre-Effect-Erfolgspfad um einen neuen beschwörbaren Effekt-Typ. Bestehende Gegenstands-Beschwörungen bleiben unverändert.

## Capabilities

### New Capabilities

- `creature-summoning`: Konfiguration, Auswahl, Erzeugung, Platzierung und Blattöffnung beschworener Kreaturen.

### Modified Capabilities

- `supernatural-pre-effects`: Unterstützt `summonCreature` als erfolgreichen Pre-Effect und reicht Auswahl- sowie Profilkontext bis zur Ausführung weiter.
- `settings`: Verwaltet die Auswahl der Actor-Kompendien, die für Kreaturenbeschwörungen verwendet werden.

## Impact

- Betroffene Runtime-Dateien: `scripts/effects/pre-effects/`, `scripts/combat/dialogs/uebernatuerlich.js` und die Actor-/Token-Erzeugung.
- Betroffene Datenmodelle: `scripts/actors/model-data/kreatur.js` sowie gemeinsame Pre-Effect- und übernatürliche Item-Modelle.
- Betroffene UI: Pre-Effect- und strukturierte Zauber-Templates, der übernatürliche Zauberdialog sowie die GM-Kompendien-Einstellungen.
- Betroffene Daten: geprüfte Beschwörungszauber in `comp_packs/zauberspruche-und-rituale/_source/`; nach Änderungen ist `npm run pack-all` erforderlich.
- Foundry VTT API v14: [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html), [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html), [Scene](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html), [ActiveEffect](https://foundryvtt.com/api/v14/classes/foundry.documents.ActiveEffect.html), `fromUuid`, `game.settings`, `game.packs`, `canvas.tokens`, `Actor#getTokenDocument`, `Scene#createEmbeddedDocuments`, `Actor#sheet.render` sowie [foundry.utils.deepClone](https://foundryvtt.com/api/v14/functions/foundry.utils.deepClone.html).
- Der vorhandene erfolgreiche Pre-Effect-Dispatch wird erweitert; für die Freigabe gebundener Ressourcen wird zusätzlich der dokumentierte Token-Lösch-Lifecycle verwendet.

## Testing Impact

- Neue Unit-Tests für Kreaturentyp-/Actor-Filterung, Kompendienauflösung, Defaultwerte `12`, benachbarte bzw. ringweise Tokenpositionen und Token-Erzeugungsdaten.
- Bestehende Pre-Effect- und Zauberdialog-Tests müssen den neuen `summonCreature`-Branch sowie die Übergabe des ausgewählten Actors abdecken.
- Neue E2E-Fälle sollen einen GM, einen Spieler als Zauberer, einen konfigurierten Kreaturen-Pack, einen Beschwörungszauber und eine aktive Szene mit kontrolliertem Beschwörer-Token verwenden.
- Der E2E-Fall soll die Kompendien-Einstellung, beide Selector-Stufen, eine erfolgreiche Probe, den erzeugten benachbarten Token und das geöffnete Kreaturenblatt verifizieren. Bestehende Gegenstands-Beschwörungsfälle dienen als Regression.
- Gemeinsame E2E-Helfer für aktiven Scene-Token, Pack-Konfiguration und das Auslesen von Token-Dokumenten können unter `e2e/shared/` wiederverwendet werden.
