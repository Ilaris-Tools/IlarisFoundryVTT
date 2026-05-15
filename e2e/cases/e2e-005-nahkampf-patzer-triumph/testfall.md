# E2E-005 Nahkampf-Angriffsdialog: Patzer, Triumph und Normalwurf

## Metadaten

- ID: E2E-005
- Slug: e2e-005-nahkampf-patzer-triumph
- Kategorie: Kampf / Wuerfelwurf / Crit-Fumble
- Foundry-Version: v13
- Basiert auf: E2E-001

## Login-Parameter

- Foundry-URL: http://localhost:30000
- Accountname: Gamemaster
- Weltname: Vanilla Ilaris
- Passwortquelle: lokal optional. In der lokalen Testumgebung ist kein Passwort erforderlich; falls benoetigt, ueber E2E_FOUNDRY_PASSWORD setzen (nicht im Repo speichern).

## Vorbedingungen (Given)

- Foundry ist erreichbar.
- Test-Account hat ausreichende Rechte fuer Login und Weltbeitritt.
- Actor Testlauf-Held existiert.
- Testlauf-Held besitzt eine Nahkampfwaffe Kurzschwert.
- Waffeneigenschaft Patzer-Schwelle ist auf 1 (Standardwert).

## Testschritte (When)

1. Foundry aufrufen und einloggen.
2. Zielwelt Vanilla Ilaris beitreten.
3. Chat leeren.
4. Testlauf-Held oeffnen.
5. Zum Kampf-Tab wechseln.
6. Zeile mit Waffenname Kurzschwert finden.
7. Rollable-Aktion fuer angriff_diag klicken.
8. Im Angriffsdialog Dialog sichtbar und Titel pruefen.

**Wuerfeldurchgang 1 – Patzer:** 9. `CONFIG.Dice.randomUniform = () => 0.99` setzen (W20 liefert Ergebnis 1). 10. Angreifen klicken. 11. Chat: neues Nachricht enthält W20-Ergebnis = 1 und Text "Patzer". 12. Chat: kein "Triumph".

**Wuerfeldurchgang 2 – Triumph (Kritischer Treffer):** 13. `CONFIG.Dice.randomUniform = () => 0.01` setzen (W20 liefert Ergebnis 20). 14. Angreifen klicken. 15. Chat: neue Nachricht enthält Text "Triumph". 16. Chat: kein "Patzer".

**Wuerfeldurchgang 3 – Normalwurf (nahe Patzer, aber kein Patzer):** 17. `CONFIG.Dice.randomUniform = () => 0.95` setzen (W20 liefert Ergebnis nahe 1, aber > 1). 18. Angreifen klicken. 19. Chat: neue Nachricht enthält weder "Patzer" noch "Triumph".

**Wuerfeldurchgang 4 – Normalwurf (nahe Triumph, aber kein Triumph):** 20. `CONFIG.Dice.randomUniform = () => 0.05` setzen (W20 liefert Ergebnis nahe 20, aber < 20). 21. Angreifen klicken. 22. Chat: neue Nachricht enthält weder "Patzer" noch "Triumph". 23. `CONFIG.Dice.randomUniform` zuruecksetzen (delete).

## Erwartete Ergebnisse (Then)

- Angriffsdialog ist sichtbar und Titel enthaelt "Kampf: Kurzschwert".
- **Durchgang 1 (0.99):** dieResult == 1, flavor enthaelt "Patzer", kein "Triumph".
- **Durchgang 2 (0.01):** flavor enthaelt "Triumph", kein "Patzer".
- **Durchgang 3 (0.95):** flavor enthaelt weder "Patzer" noch "Triumph".
- **Durchgang 4 (0.05):** flavor enthaelt weder "Patzer" noch "Triumph".
- Nach jedem Durchgang: genau eine neue Chat-Nachricht erzeugt.
- Kein undefined im sichtbaren Flavor.

## Chat-Validierung

- flavor von Durchgang 1: enthaelt `Patzer` (via formatCritFumble-Helper, color:#aa0200).
- flavor von Durchgang 2: enthaelt `Triumph` (via formatCritFumble-Helper, color:#18520b).
- flavor von Durchgang 3 und 4: enthaelt weder `Patzer` noch `Triumph`.

## Negativpruefungen

- Durchgang 1: kein "Triumph".
- Durchgang 2: kein "Patzer".
- Kein undefined im sichtbaren Flavor.
- Kein leerer h2-Titel.

## Technische Hintergrundinformation

Die `CONFIG.Dice.randomUniform`-Funktion wird von Foundry VTT als Zufallsquelle fuer alle Wuerfelergebnisse verwendet.
Die Werte werden gemaess Foundry-Interna auf W20-Ergebnisse abgebildet:

- `0.99` → W20-Ergebnis 1 (Patzer, wenn <= fumble_val = 1)
- `0.01` → W20-Ergebnis 20 (Triumph/Crit)
- `0.95` → W20-Ergebnis nahe 1 (z.B. 2), kein Patzer
- `0.05` → W20-Ergebnis nahe 20 (z.B. 19), kein Triumph

Der `formatCritFumble`-Handlebars-Helper in `scripts/core/handlebars.js` rendert:

- Patzer: `<h3><strong style="color:#aa0200;">Patzer</strong></h3>`
- Triumph: `<h3><strong style="color:#18520b;">Triumph</strong></h3>` (oder "Crit" je nach Einstellung)

## Artefakte

- Spezifikation: e2e/cases/e2e-005-nahkampf-patzer-triumph/e2e-005-nahkampf-patzer-triumph.spec.ts
- Shared Fixtures: e2e/shared/fixtures/foundry.ts
- Shared Types: e2e/shared/foundry-globals.d.ts (CONFIG mit optionaler randomUniform hinzugefuegt)

## Ausfuehrungsstatus

- Stand: Erstellt, noch nicht ausgefuehrt.
- Empfohlener Startbefehl: `npx playwright test e2e/cases/e2e-005-nahkampf-patzer-triumph`
