# E2E-002 Kreatur Angriff AT editieren

## Metadaten

- ID: E2E-002
- Slug: e2e-002-kreatur-waffe-at-editieren
- Kategorie: Kreatur / Angriff / Inline-Edit
- Foundry-Version: v13

## Login-Parameter

- Foundry-URL: http://localhost:30000
- Accountname: Gamemaster
- Weltname: Vanilla Ilaris
- Passwortquelle: lokal optional. In der lokalen Testumgebung ist kein Passwort erforderlich; falls benoetigt, ueber E2E_FOUNDRY_PASSWORD setzen (nicht im Repo speichern).

## Vorbedingungen (Given)

- Foundry ist erreichbar.
- Test-Account hat ausreichende Rechte fuer Login und Weltbeitritt.
- Actor Testfall-Npc existiert als Kreatur (Typ: kreatur/nsc).
- Testfall-Npc besitzt einen Angriff namens Breitschwert mit AT-Wert 11.
- Hinweis: Kreaturen haben kein Kampf-Tab — alle Angriffe sind auf der Hauptseite des Sheets sichtbar.

## Testschritte (When)

1. Foundry aufrufen und einloggen.
2. Zielwelt Vanilla Ilaris beitreten.
3. Actor Sheet von Testfall-Npc oeffnen.
4. Im Abschnitt Angriffe den Namen Breitschwert anklicken — dadurch oeffnet sich das Angriff-Item-Sheet.
5. Im Angriff-Sheet den Wert im Feld Attacke (system.at) von 11 auf 12 aendern.
6. Feld mit Tab verlassen (loest submitOnChange-Auto-Save aus).
7. Pruefen, dass der AT-Wert im Kreatur-Sheet jetzt 12 anzeigt.
8. Angriff-Sheet schliessen.
9. Vorgang wiederholen: Breitschwert anklicken, Attacke auf 11 zuruecksetzen, Tab druecken.
10. Pruefen, dass der AT-Wert im Kreatur-Sheet wieder 11 anzeigt.
11. Angriff-Sheet schliessen.

## Erwartete Ergebnisse (Then)

- Nach Schritt 7: AT-Label im Kreatur-Sheet zeigt 12.
- Nach Schritt 7: AT-Label zeigt nicht mehr 11 (Negativpruefung).
- Nach Schritt 10: AT-Label zeigt wieder 11 (Ausgangszustand wiederhergestellt).

## Chat-Validierung

- Keine Chat-Nachricht erwartet. Chat-Pruefung entfaellt.

## Negativpruefungen

- Nach erstem Edit darf der AT-Wert nicht mehr 11 zeigen.

## Technische Selektoren

| Element                        | Selektor                                                         |
| ------------------------------ | ---------------------------------------------------------------- |
| Kreatur-Sheet Window           | `.application.kreaturen` gefiltert auf Akteur-Name               |
| Edit-Link Angriff              | `.angriffe a[data-action="itemEdit"]` gefiltert auf Angriffsname |
| AT-Eingabefeld (Angriff-Sheet) | `input[name="system.at"]`                                        |
| Angriff-Sheet Window           | `.application.sheet.item.angriff`                                |
| AT-Anzeige im Kreatur-Sheet    | `label.onhover[data-rolltype="at"][data-item="Breitschwert"]`    |
| Schliessen-Button              | `button[data-action="close"]` im Angriff-Sheet                   |

## Artefakte

- Spezifikation: e2e/cases/e2e-002-kreatur-waffe-at-editieren/e2e-002-kreatur-waffe-at-editieren.spec.ts
- Shared Fixture: e2e/shared/fixtures/foundry.ts (loginAndJoinWorld, openActorSheet wiederverwendet)

## Ausfuehrungsstatus

- Stand: ausstehend (noch nicht lokal ausgefuehrt).

## Ausfuehrungsprotokoll

Empfohlener Startbefehl:

```powershell
npm run test:e2e
```

Optional (nur falls Passwort erforderlich):

```powershell
$env:E2E_FOUNDRY_USER='Gamemaster'
$env:E2E_FOUNDRY_PASSWORD='*** lokal setzen ***'
npm run test:e2e
```
