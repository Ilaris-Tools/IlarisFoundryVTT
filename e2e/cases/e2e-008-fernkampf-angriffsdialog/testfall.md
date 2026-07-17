<!-- DEPRECATED: The canonical test specification is now in openspec/specs/<capability>/spec.md. This file is retained for reference only. -->

# E2E-008 Fernkampf-Angriffsdialog

## Metadaten

- ID: E2E-008
- Slug: e2e-008-fernkampf-angriffsdialog
- Kategorie: Kampf / Fernkampf / Dialog / Chat
- Foundry-Version: v13
- Klasse: `FernkampfAngriffDialog` (`scripts/combat/dialogs/fernkampf_angriff.js`) — komplett ungetestet

## Login-Parameter

- Foundry-URL: http://localhost:30000
- Accountname: Gamemaster
- Weltname: Vanilla Ilaris
- Passwortquelle: Kein Passwort erforderlich. Falls benoetigt, ueber `E2E_FOUNDRY_PASSWORD` setzen (nicht im Repo speichern).

## Vorbedingungen (Given)

- Foundry ist erreichbar unter http://localhost:30000.
- Account Gamemaster hat Rechte fuer Login und Weltbeitritt.
- Actor `HatAlles` existiert in der Welt `Vanilla Ilaris`.
- `HatAlles` besitzt mindestens eine Fernkampfwaffe (Item-Typ `fernkampfwaffe`).
- Der Actor hat das Manoever `Scharfschuss` (fm_srfs, NUMBER-Feld) an der ersten Fernkampfwaffe.
- `useTargetSelection` ist in den Ilaris-Einstellungen deaktiviert (Standard-Default), damit Angriffe direkt in den Chat gehen.

## Testszenarien

### Szenario A: Standard-Angriff (alle Selects auf neutralen Werten)

**Schritte (When):**

1. Foundry aufrufen und einloggen.
2. Welt `Vanilla Ilaris` beitreten.
3. Chat leeren.
4. Actor `HatAlles` oeffnen.
5. Kampf-Tab anklicken.
6. Alle Selects explizit auf neutrale Werte setzen: Groessenklasse = mittel (2), Lichtverhaeltnisse = Tag (0), Wetter = still (0), Bewegung = langsam (0), Deckung = keine (0), Kampfgetuemmel = Freistehendes Ziel (0).
7. Ersten `[data-rolltype="fernkampf_diag"]`-Button klicken.
8. Dialog `.application.fernkampf-dialog` ist sichtbar und Titel enthaelt `Fernkampfangriff:`.
9. Modifier-Summary (`.modifier-summary.attack-summary`) ist sichtbar und enthaelt `Basis FK:`.
10. Modifier-Summary enthaelt keine ungewaehlten Strafmodifier (Daemmerung, Wind, schnell, Deckung).
11. Angreifen-Button klicken (`.clickable-summary[data-action="angreifen"]`).
12. Chat: genau eine neue Nachricht erscheint.

**Erwartet (Then):**

- flavor enthaelt `Fernkampf (`.
- flavor enthaelt NICHT `Attacke (` (Nahkampf-Flavor darf nicht erscheinen).
- formula enthaelt `d20`.
- total > 0 und numerisch.
- flavor enthaelt kein `undefined`.
- flavor enthaelt keine ungewaehlten Strafmodifier (Daemmerung, Wind, schnell).

---

### Szenario B: Alle Selects auf erster Stufe → Modifier-Sichtbarkeit und Chat

**Schritte (When):**

1. Login + Chat leeren + `HatAlles` oeffnen wie Szenario A.
2. Kampf-Tab → ersten FK-Dialog oeffnen.
3. Selects setzen: Groessenklasse = gross (1), Lichtverhaeltnisse = Daemmerung (1), Wetter = Wind (1), Bewegung = schnell (1), Deckung = halbe Deckung (-1), Kampfgetuemmel = im offenen Feld (1).
4. Modifier-Summary auf Aktualisierung warten (debounced, max. 10 s).
5. Angreifen klicken.

**Erwartet (Then):**

- Modifier-Summary enthaelt: `Daemmerung`, `Wind`, `schnell`, `Deckung`.
- Chat-Flavor enthaelt `Fernkampf (` und alle gesetzten Modifier-Texte.
- Chat-Flavor enthaelt NICHT `Attacke (`, nicht `Sturm`, nicht `Blind` (hoehere Stufen nicht gesetzt).
- flavor ohne `undefined`.

---

### Szenario C: Alle Selects auf hoechster Stufe → starke Erschwernis

**Schritte (When):**

1. Login + Chat leeren + `HatAlles` oeffnen.
2. Kampf-Tab → ersten FK-Dialog oeffnen.
3. Selects auf Maximum: Groessenklasse = winzig (5), Lichtverhaeltnisse = Blind (4), Wetter = Sturm (2), Bewegung = extrem schnell (3), Deckung = Dreivierteldeckung (-2), Kampfgetuemmel = im beengten Raum (2).
4. Modifier-Summary zeigt die gesetzten Faktoren.
5. Angreifen klicken.

**Erwartet (Then):**

- Modifier-Summary enthaelt: `Blind`, `Sturm`, `extrem schnell`, `winzig`.
- Chat-Flavor enthaelt `Fernkampf (`, `Blind`, `Sturm`, `extrem schnell`.
- flavor ohne `Attacke (` und ohne `undefined`.

---

### Szenario D: Scharfschuss NUMBER=4 → Angriff + Schaden

**Schritte (When):**

1. Login + Chat leeren + `HatAlles` oeffnen.
2. Kampf-Tab → ersten FK-Dialog oeffnen.
3. Manoever-Sektion aufklappen (`.maneuver-header` klicken).
4. `.maneuver-item` mit Text `Scharfschuss` → NUMBER-Feld auf `4` setzen.
5. `change`-Event ausloesen.
6. Modifier-Summary enthaelt `Scharfschuss` (nach debounce).
7. Angreifen klicken → Chat-Nachricht pruefen.
8. Schaden-Button klicken (`.clickable-summary[data-action="schaden"]`) → zweite Chat-Nachricht pruefen.

**Erwartet (Then):**

- Angriff: flavor enthaelt `Fernkampf (` und `Scharfschuss`, formula enthaelt `d20`, total > 0.
- Schaden: flavor enthaelt `Schaden (`, total > 0.
- Kein `Attacke (` im Angriffs-Flavor.
- Keine `undefined`-Texte.

---

### Szenario E: Patzer / Triumph (analog E2E-005)

**Schritte (When):**

1. Login + Chat leeren + `HatAlles` oeffnen.
2. Kampf-Tab → ersten FK-Dialog oeffnen.
3. Dialog ist sichtbar und Titel enthaelt `Fernkampfangriff:`.
4. Modifikator-Feld (`input[id^="modifikator-"]`) auf `-(FK + globalermod)` setzen (zur Laufzeit
   aus `actor.system.abgeleitete.globalermod` und `fkWeapon.system.fk` berechnet).
   Begruendung: Damit gilt `1 + 0 < 12` (Patzer bei die=1) und `20 + 0 ≥ 12` (Triumph bei die=20).
   Die normale Spielmechanik (`realFumbleCrits=false`) gilt unveraendert — kein Setting wird geaendert.
5. `renameTriumphWithCrit`-Einstellung lesen (dynamisch).
6. Vier Wuerfdurchgaenge mit `CONFIG.Dice.randomUniform`:
    - `0.99` → W20-Ergebnis 1 → Patzer (weil 1 + FK - 50 < 12)
    - `0.01` → W20-Ergebnis 20 → Triumph/Crit (W20=20 ist stets Triumph, unabhaengig vom Modifikator)
    - `0.95` → W20-Ergebnis 2, kein Patzer (2 > fumble_val=1)
    - `0.05` → W20-Ergebnis 19, kein Triumph (19 < 20)
7. `afterEach`: `delete CONFIG.Dice.randomUniform` (auch bei Fehlschlag). Keine Settings-Bereinigung noetig.

**Erwartet (Then):**

- Durchgang 1 (0.99): dieResult == 1, flavor enthaelt `Patzer`, kein `Triumph`.
- Durchgang 2 (0.01): dieResult == 20, flavor enthaelt `Triumph` (oder `Crit`), kein `Patzer`.
- Durchgang 3 (0.95): flavor enthaelt weder `Patzer` noch `Triumph`.
- Durchgang 4 (0.05): flavor enthaelt weder `Patzer` noch `Triumph`.
- Pro Durchgang: genau eine neue Chat-Nachricht.
- Kein `undefined` in irgendeinem Flavor.

## Chat-Validierung (uebergreifend)

- Flavor von Angriff: `Fernkampf (<WaffenName>)` (nicht `Attacke`).
- Flavor von Schaden: `Schaden (<WaffenName>)`.
- Patzer: `<strong style="color:#aa0200;">Patzer</strong>`.
- Triumph: `<strong style="color:#18520b;">Triumph</strong>` (oder `Crit` je Einstellung).

## Negativpruefungen (uebergreifend)

- `Attacke (` darf in keinem FK-Chat erscheinen.
- `undefined` darf in keinem sichtbaren Flavor erscheinen.
- Modifier-Texte von nicht gesetzten Selects duerfern nicht im Chat erscheinen.
- Bei Patzer kein `Triumph`, bei Triumph kein `Patzer`.

## Technische Hintergrundinformation

### Dialog-Selektoren

- Dialog-Root: `.application.fernkampf-dialog` (CSS-Klasse in `FernkampfAngriffDialog.DEFAULT_OPTIONS.classes`)
- Fenster-Titel: `Fernkampfangriff: ${item.name}`
- Angreifen-Button: `.modifier-summary.attack-summary.clickable-summary[data-action="angreifen"]`
- Schaden-Button: `.modifier-summary.damage-summary.clickable-summary[data-action="schaden"]`

### Selects mit ID-Suffix-Pattern (AppV2 `dialogId`)

- `select[id^="gzkl-"]` — Groessenklasse
- `select[id^="lcht-"]` — Lichtverhaeltnisse
- `select[id^="wttr-"]` — Wetter
- `select[id^="bwng-"]` — Bewegung
- `select[id^="dckg-"]` — Deckung
- `select[id^="kgtl-"]` — Kampfgetuemmel

### Select-Optionswerte

| Key | Groessenklasse | Licht        | Wetter | Bewegung       | Deckung            | Kampfgetuemmel     |
| --- | -------------- | ------------ | ------ | -------------- | ------------------ | ------------------ |
| 0   | sehr gross     | Tag          | still  | langsam        | keine              | Freistehendes Ziel |
| 1   | gross          | Daemmerung   | Wind   | schnell        | —                  | im offenen Feld    |
| 2   | mittel         | Mondlicht    | Sturm  | sehr schnell   | —                  | im beengten Raum   |
| 3   | klein          | Sternenlicht | —      | extrem schnell | —                  | —                  |
| 4   | sehr klein     | Blind        | —      | —              | —                  | —                  |
| 5   | winzig         | —            | —      | —              | —                  | —                  |
| -1  | —              | —            | —      | —              | halbe Deckung      | —                  |
| -2  | —              | —            | —      | —              | Dreivierteldeckung | —                  |

### Manoever-Selektor

- Scharfschuss NUMBER-Feld: `.maneuver-item:has-text("Scharfschuss") input[type="number"]`
- Manoever-Sektion aufklappen: `.maneuver-header` klicken → `.maneuver-grid` verliert Klasse `collapsed`

### Chat-Formel-Aufbau

Angriff: `${diceFormula} ${signed(fk)} ${signed(at_abzuege_mod)} ${signed(mod_at)}`
Label: `Fernkampf (${item.name})`

### Patzer/Triumph-Mechanik

`CONFIG.Dice.randomUniform = () => 0.99` → W20 = 1 (Patzer, weil `1 + 0 < 12`)
`CONFIG.Dice.randomUniform = () => 0.01` → W20 = 20 (Triumph, weil `20 + 0 >= 12`)
Modifikator wird zur Laufzeit als `-(FK + globalermod)` berechnet, sodass reine W20-Augenzahl entscheidet.

## Artefakte

- Testfall: `e2e/cases/e2e-008-fernkampf-angriffsdialog/testfall.md`
- Spezifikation: `e2e/cases/e2e-008-fernkampf-angriffsdialog/e2e-008-fernkampf-angriffsdialog.spec.ts`
- Shared Fixture (neu): `openRangedAttackDialogForWeapon` in `e2e/shared/fixtures/foundry.ts`

## Ausfuehrungsstatus

- Stand: Erstellt, noch nicht ausgefuehrt.
- Empfohlener Startbefehl: `npx playwright test e2e/cases/e2e-008-fernkampf-angriffsdialog`
