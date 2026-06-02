# E2E-024 Kreaturen-Kompendium Belastungstest

## Metadaten

- ID: E2E-024
- Slug: e2e-024-kreaturen-kompendium-belastungstest
- Kategorie: Kreatur / Kompendium / Belastung / Proben / Sheet-Edit
- Foundry-Version: v13

## Login-Parameter

- Foundry-URL: http://localhost:30000
- Accountname: Gamemaster
- Weltname: Vanilla Ilaris
- Passwortquelle: kein Passwort erforderlich in der lokalen Umgebung.

## Vorbedingungen (Given)

- Foundry ist erreichbar.
- Account Gamemaster kann der Welt Vanilla Ilaris beitreten.
- Es existiert ein Kreaturen-Kompendium mit Actor-Eintraegen.
- Es gibt eine aktive Szene fuer Token-Platzierung.
- Scope-Hinweis: Dieser Fall nutzt final 3 Kreaturen (angepasst gegenueber dem urspruenglichen Vorschlag 5-8).

## Testschritte (When)

1. Foundry aufrufen und einloggen.
2. Zielwelt Vanilla Ilaris beitreten.
3. Kompendium-Sidebar oeffnen und Kreaturen-Pack oeffnen.
4. Erste 3 Kreaturen aus dem Kreaturen-Kompendium in die Welt importieren.
5. Die 3 importierten Kreaturen als Token auf die aktive Szene platzieren.
6. Fuer jede Kreatur wiederholen:
    - Kreatur-Sheet oeffnen.
    - Ersten Angriffsdialog oeffnen und wuerfeln.
    - Attribut-Probedialog oeffnen und wuerfeln.
    - Wunden setzen.
    - Wundschwelle aendern.
7. Chat-Ausgaben validieren.
8. Importierte Kreaturen und ihre Token wieder loeschen.

## Erwartete Ergebnisse (Then)

- Jede der 3 Kreaturen erzeugt 2 erfolgreiche Wuerfelaktionen.
- Insgesamt entstehen mindestens 6 neue Wuerfel-Chatnachrichten.
- Wunden und Wundschwelle werden pro Kreatur gespeichert.
- Nach Loeschen bleiben keine importierten Testfall-Kreaturen und keine zugehoerigen Token auf der aktiven Szene.
- Es erscheinen keine UI-Fehlerbenachrichtigungen.

## Chat-Validierung

- Baseline vor den Wuerfeln erfassen.
- Nach den Wuerfeln mindestens 6 neue Chatnachrichten vorhanden.

## Negativpruefungen

- Keine UI-Fehlerbenachrichtigungen waehrend des Ablaufs.
- Nach dem Cleanup existiert keine der importierten Testfall-Kreaturen mehr.
- Nach dem Cleanup existiert kein Testfall-Token mehr auf der aktiven Szene.

## Technische Selektoren

| Element                 | Selektor                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Kompendium-Sidebar-Tab  | [data-tab="compendium"]                                                                                                              |
| Kreatur-Sheet-Window    | .application.kreaturen (gefiltert auf Kreaturname)                                                                                   |
| Angriffsdialog-Button   | .angriffe [data-action="rollable"][data-rolltype="angriff_diag"], .angriffe [data-action="rollable"][data-rolltype="fernkampf_diag"] |
| Angriff ausfuehren      | .modifier-summary.attack-summary.clickable-summary[data-action="angreifen"]                                                          |
| Attribut-Dialog starten | [data-action="rollable"][data-rolltype="fertigkeit_diag"][data-probetype="attribut"]                                                 |
| Fertigkeitsdialog       | .application.ilaris.fertigkeit-dialog                                                                                                |
| Probe ausfuehren        | [data-action="previewClick"]                                                                                                         |
| Wunden-Feld             | input[name="system.gesundheit.wunden"]                                                                                               |
| Wundschwelle-Feld       | input[name="system.kampfwerte.ws"]                                                                                                   |

## Artefakte

- Spezifikation: e2e/cases/e2e-024-kreaturen-kompendium-belastungstest/e2e-024-kreaturen-kompendium-belastungstest.spec.ts

## Ausfuehrungsstatus

- Stand: erstellt, lokale Ausfuehrung folgt.

## Ausfuehrungsprotokoll

Empfohlener Startbefehl:

```powershell
npm run test:e2e -- e2e/cases/e2e-024-kreaturen-kompendium-belastungstest
```

Referenzfall (Regression):

```powershell
npm run test:e2e -- e2e/cases/e2e-002-kreatur-waffe-at-editieren
```
