# E2E-003 Manoever-Kombination: Wuchtschlag + Gezielter Schlag (Schildarm) + Schildspalter

## Metadaten

- ID: E2E-003
- Slug: e2e-003-manoever-wuchtschlag-gezielter-schlag
- Kategorie: Kampf / Manoever / Wuerfelwurf
- Foundry-Version: v13
- Quelle: Benutzeranforderung 2026-04-14

## Login-Parameter

- Foundry-URL: http://localhost:30000
- Accountname: Gamemaster
- Weltname: Vanilla Ilaris
- Passwortquelle: lokal optional. In der lokalen Testumgebung ist kein Passwort erforderlich; falls benoetigt, ueber E2E_FOUNDRY_PASSWORD setzen (nicht im Repo speichern).

## Vorbedingungen (Given)

- Foundry ist erreichbar.
- Test-Account hat ausreichende Rechte fuer Login und Weltbeitritt.
- Actor Testlauf-Held existiert.
- Testlauf-Held besitzt mindestens eine Nahkampfwaffe.
- Die Manoever Wuchtschlag (km_wusl), Gezielter Schlag (km_gzsl) und Schildspalter (km_shsp) sind fuer die erste Waffe verfuegbar.

## Testschritte (When)

1. Foundry aufrufen und einloggen.
2. Zielwelt Vanilla Ilaris beitreten.
3. Chat leeren.
4. Testlauf-Held oeffnen.
5. Zum Kampf-Tab wechseln.
6. Angriffsdialog der ersten Waffe oeffnen (data-rolltype="angriff_diag").
7. Manoever-Sektion ausklappen (maneuver-header klicken).
8. Wuchtschlag auf 3 setzen (NUMBER-Eingabe).
9. Gezielter Schlag — Schildarm auswaehlen (TREFFER_ZONE-Select, Wert 2).
10. Schildspalter aktivieren (CHECKBOX ankreuzen).
11. Modifier-Anzeige auf erwartete Werte pruefen.
12. Angriff wuerfeln (Attack-Summary klicken).
13. Angriffs-Chat-Nachricht pruefen.
14. Schaden-Zusammenfassung im Dialog pruefen.
15. Schaden wuerfeln (Damage-Summary klicken).
16. Schaden-Chat-Nachricht pruefen.

## Erwartete Ergebnisse (Then)

### AT-Modifier-Anzeige im Dialog

- Modifier-Zeile "Gezielter Schlag (Schildarm): -2" ist sichtbar.
- Modifier-Zeile "Schildspalter: +2" ist sichtbar.
- Modifier-Zeile "Wuchtschlag: -3" ist sichtbar.
- Gesamtmodifikator-Zeile enthaelt "Addierte Modifikatoren: -3".

### Angriffs-Chat-Nachricht (Bild 1)

- Genau eine neue Chat-Nachricht erscheint.
- Flavor enthaelt "Attacke (" (Waffenname in Klammern).
- Flavor enthaelt "Gezielter Schlag (Schildarm): -2".
- Flavor enthaelt "Schildspalter: +2".
- Flavor enthaelt "Wuchtschlag: -3".
- Wuerfelformel enthaelt d20.
- Wuerfelergebnis (dice-total) ist numerisch und groesser 0.
- Kein "undefined" im Flavor.

### Schaden-Zusammenfassung im Dialog (Bild 2)

- Damage-Summary (.modifier-summary.damage-summary) ist sichtbar.
- Basis-Schaden-Zeile (.modifier-item.base-value) enthaelt "Basis Schaden:".
- Modifier-Zeile "Wuchtschlag: +3" ist sichtbar und gruen markiert.

### Schaden-Chat-Nachricht (Bild 3)

- Genau eine neue Chat-Nachricht erscheint.
- Flavor enthaelt "Schaden (" (Waffenname in Klammern).
- Flavor enthaelt "Wuchtschlag: +3".
- Wuerfelergebnis ist numerisch und groesser 0.
- Kein "undefined" im Flavor.

## Chat-Validierung

- Angriff: game.messages letzter Eintrag — flavor enthaelt Titel und alle drei Modifier-Zeilen; rolls[0].formula enthaelt "d20"; rolls[0].total ist numerisch.
- Schaden: game.messages letzter Eintrag — flavor enthaelt Schaden-Titel und Wuchtschlag +3; rolls[0].total ist numerisch.

## Negativpruefungen

- Kein "undefined" im Flavor beider Chat-Nachrichten.
- Kein leerer h2-Titel.
- Keine fehlenden Modifier-Zeilen in der AT-Anzeige.
- Kein zweiter unerwarteter Chat-Eintrag nach einem Einzelwurf.

## Selektoren

| Element          | Selektor                                                          |
| ---------------- | ----------------------------------------------------------------- |
| Angriffsdialog   | `.application.angriff-dialog` (last)                              |
| Manoever-Header  | `.maneuver-header`                                                |
| Manoever-Grid    | `.maneuver-grid`                                                  |
| Wuchtschlag      | `.maneuver-item:has-text("Wuchtschlag") input[type="number"]`     |
| Gezielter Schlag | `.maneuver-item:has-text("Gezielter Schlag") select`              |
| Schildspalter    | `.maneuver-item:has-text("Schildspalter") input[type="checkbox"]` |
| AT-Summary       | `.modifier-summary.attack-summary`                                |
| Angreifen-Button | `.modifier-summary.attack-summary.clickable-summary.angreifen`    |
| DM-Summary       | `.modifier-summary.damage-summary`                                |
| Schaden-Button   | `.modifier-summary.damage-summary.clickable-summary.schaden`      |

## Artefakte

- Spezifikation: e2e/cases/e2e-003-manoever-wuchtschlag-gezielter-schlag/e2e-003-manoever-wuchtschlag-gezielter-schlag.spec.ts
- Shared Fixture (unveraendert): e2e/shared/fixtures/foundry.ts

## Ausfuehrungsstatus

- Stand: Ausstehend — wird nach Generierung gestartet.
- Empfohlener Testbefehl: `npm run test:e2e`
- Referenztest: `npm run test:e2e:ref` (E2E-001 muss weiterhin gruen sein)
