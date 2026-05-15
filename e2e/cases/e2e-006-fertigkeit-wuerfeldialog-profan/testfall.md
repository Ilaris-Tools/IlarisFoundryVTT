# E2E-006 Fertigkeit Wuerfeldialog Profan

## Metadaten

- ID: E2E-006
- Slug: e2e-006-fertigkeit-wuerfeldialog-profan
- Kategorie: Fertigkeiten / Wuerfelwurf
- Foundry-Version: v13
- Quelle: Benutzeranforderung (Chat, April 2026)

## Login-Parameter

- Foundry-URL: http://localhost:30000
- Accountname: Gamemaster
- Weltname: Vanilla Ilaris
- Passwortquelle: Kein Passwort erforderlich. Falls benoetigt, ueber E2E_FOUNDRY_PASSWORD setzen (nicht im Repo speichern).

## Vorbedingungen (Given)

- Foundry ist erreichbar.
- Gamemaster-Account hat ausreichende Rechte fuer Login und Weltbeitritt.
- Actor HatAlles existiert und ist ein Held (type: held).
- HatAlles besitzt mindestens eine profane Fertigkeit (erscheint im Fertigkeiten-Tab).
- HatAlles hat mindestens 4 Schips Stern (Schips werden bei jedem Schips-Wurf verbraucht; der Test fuehrt 4 Schips-Wuerfe durch: 3d20-ohne, 3d20-mit, 1d20-ohne, 1d20-mit).
- Der globalermod des Helden kann 0 oder ein beliebiger Wert sein; der Test liest ihn dynamisch aus dem Actor.

## Testschritte (When)

1. Foundry aufrufen und als Gamemaster einloggen.
2. Zielwelt Vanilla Ilaris beitreten.
3. Chat leeren.
4. globalermod des Helden HatAlles per page.evaluate auslesen.
5. HatAlles-Heldensheet oeffnen.
6. Zum Fertigkeiten-Tab wechseln.
7. Erste Fertigkeit in der Tabelle (tr.main-row) finden.
8. Wuerfel-Icon der ersten Fertigkeit (td[data-rolltype="fertigkeit_diag"]) klicken.
9. Warten bis FertigkeitDialog (.application.ilaris.fertigkeit-dialog) sichtbar ist.
10. Hohe Qualitaet auf 3 setzen.
11. Modifikator auf 5 setzen.
12. Modifier-Vorschau validieren (siehe Erwartete Ergebnisse / Vorschau).
13. Fuer jede der 6 Wuerfelkombinationen:
    a. xd20-Radio (1W20 / 3W20) waehlen.
    b. Schips-Radio (Kein / ohne Eigenheit / mit Eigenheit) waehlen.
    c. Wuerfel-Button ([data-action="previewClick"]) klicken.
    d. Neue Chat-Nachricht abwarten.
    e. Wuerfelformel validieren.

## Erwartete Ergebnisse (Then)

### Vorschau (nach Setzen von HoheQualitaet=3 und Modifikator=5)

- Modifier-Item "Hohe Qualitaet" enthaelt "-12" (3 x -4).
- Modifier-Item "Modifikator" enthaelt "+5".
- Wenn globalermod != 0: Modifier-Item "Status (Wunden/Furcht)" ist sichtbar.

### Wuerfelkombinationen und erwartete Formeln

Die Formel in chat (msg.rolls[0].formula) soll nach dem Muster aufgebaut sein:
`<WuerfelFormel> + <effectivePW> + <globalermod> + -12 + 5`

Foundry normalisiert `+ -12` zu `- 12`. Der Test prueft daher auf einen negativen 12er-Term.

| Wuerfelmodus                | Wuerfelformel (laut Code) | Hinweis zur Benutzer-Angabe          |
| --------------------------- | ------------------------- | ------------------------------------ |
| 3d20, kein Schips           | 3d20dl1dh1                | Korrekt                              |
| 3d20, Schips ohne Eigenheit | 4d20dl2dh1                | Korrekt                              |
| 3d20, Schips mit Eigenheit  | 5d20dl3dh1                | Korrekt                              |
| 1d20, kein Schips           | 1d20                      | Korrekt                              |
| 1d20, Schips ohne Eigenheit | 2d20dl1dh0                | KORREKTUR: Benutzer sagte 1d20dl1dh0 |
| 1d20, Schips mit Eigenheit  | 3d20dl2dh0                | KORREKTUR: Benutzer best. 2d20dl2dh0 |

Herleitung der korrigierten 1d20-Schips-Formeln aus FertigkeitDialog.\_getDiceFormula():

- diceCount=1 => dropLow=0, dropHigh=0 (Basiswerte fuer 1W20)
- Schips ohne Eigenheit: baseDice=1+1=2, dropLow=0+1=1 => 2d20dl1dh0
- Schips mit Eigenheit: baseDice=1+2=3, dropLow=0+2=2 => 3d20dl2dh0

### Pro Kombination

- Formula startet mit der erwarteten Wuerfelformel.
- Formula enthaelt einen Term `- 12` oder `-12` (Hohe Qualitaet = 3 \* -4).
- Formula endet mit `+ 5` (Modifikator ist letztes Glied in der Formel-Template).
- msg.flavor enthaelt kein "undefined".

## Chat-Validierung

- msg.rolls[0].formula enthaelt die korrekte Wuerfelformel als Praefix.
- msg.rolls[0].formula matcht /-\s\*12/ (Hohe Qualitaet -12).
- msg.rolls[0].formula matcht /\+\s*5\s*$/ (Modifikator +5 am Ende).
- msg.flavor enthaelt keinen "undefined"-String.

## Negativpruefungen

Keine expliziten Negativpruefungen beauftragt.

## Technische Selektoren

| Element                         | Selektor                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | ------------------------------------------- |
| Fertigkeiten-Tab (Nav)          | nav [data-tab="fertigkeiten"]                                                                                |
| Fertigkeiten-Tab-Content        | section.tab.fertigkeiten                                                                                     |
| Erste Fertigkeit - Wuerfel-Icon | section.tab.fertigkeiten tbody tr.main-row td[data-action="rollable"][data-rolltype="fertigkeit_diag"]:first |
| FertigkeitDialog-Fenster        | .application.ilaris.fertigkeit-dialog (last())                                                               |
| Hohe Qualitaet Input            | input[id^="hohequalitaet-"] (ID enthaelt Runtime-dialogId-Suffix)                                            |
| Modifikator Input               | input[id^="modifikator-"] (ID enthaelt Runtime-dialogId-Suffix)                                              |
| xd20 Radio                      | input[name^="xd20-"]value="0                                                                                 | 1"] (name enthaelt Runtime-dialogId-Suffix) |
| Schips Radio                    | input[name^="schips-"]value="0                                                                               | 1                                           | 2"] (name enthaelt Runtime-dialogId-Suffix) |
| Wuerfel-/Roll-Button (Preview)  | [data-action="previewClick"]                                                                                 |
| Modifier-Item (allgemein)       | .modifier-item                                                                                               |
| Status-Modifier-Item            | .modifier-item:has-text("Status (Wunden/Furcht)")                                                            |

## Artefakte

- Spezifikation: e2e/cases/e2e-006-fertigkeit-wuerfeldialog-profan/e2e-006-fertigkeit-wuerfeldialog-profan.spec.ts
- Shared Fixture: e2e/shared/fixtures/foundry.ts (loginAndJoinWorld, clearChatLog, openActorSheet)

## Ausfuehrungsstatus

- Stand: PASS (lokal erfolgreich ausgefuehrt, April 2026).
- Letzter Lauf: Regression mit E2E-001, Exit Code 0, 2 passed in 22.4s.

## Ausfuehrungsprotokoll

Empfohlener Startbefehl:

```
npx playwright test e2e/cases/e2e-006-fertigkeit-wuerfeldialog-profan/e2e-006-fertigkeit-wuerfeldialog-profan.spec.ts --headed
```

Regression (Referenzfall gleichzeitig):

```
npx playwright test e2e/cases/e2e-001-nahkampf-angriffsdialog/e2e-001-nahkampf-angriffsdialog.spec.ts e2e/cases/e2e-006-fertigkeit-wuerfeldialog-profan/e2e-006-fertigkeit-wuerfeldialog-profan.spec.ts --headed
```
