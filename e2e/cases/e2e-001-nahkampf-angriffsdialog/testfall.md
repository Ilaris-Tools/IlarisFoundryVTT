# E2E-001 Nahkampf-Angriffsdialog

## Metadaten

- ID: E2E-001
- Slug: e2e-001-nahkampf-angriffsdialog
- Kategorie: Kampf / Wuerfelwurf
- Foundry-Version: v13
- Quelle: docs/\_specs/2026_03_27_e2e_halbautomatisch_browser_agent/referenz-testfall-nahkampf.md

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

## Testschritte (When)

1. Foundry aufrufen und einloggen.
2. Zielwelt Vanilla Ilaris beitreten.
3. Chat leeren.
4. Testlauf-Held oeffnen.
5. Zum Kampf-Tab wechseln.
6. Zeile mit Waffenname Kurzschwert finden.
7. In dieser Zeile Rollable-Aktion fuer angriff_diag klicken.
8. Im Angriffsdialog auf angreifen klicken.

## Erwartete Ergebnisse (Then)

- Angriffsdialog ist sichtbar.
- Dialogtitel enthaelt Kampf: Kurzschwert.
- Genau eine neue Chat-Nachricht wird erzeugt.
- Letzte Chat-Nachricht enthaelt Titel Attacke (Kurzschwert).
- Wuerfelformel enthaelt d20.
- dice-total ist numerisch und groesser 0.
- Kein undefined in der letzten Chat-Nachricht.

## Chat-Validierung

- h2 enthaelt Attacke (Kurzschwert).
- .dice-formula enthaelt d20.
- .dice-total ist numerisch.

## Negativpruefungen

- Kein leerer h2-Titel.
- Kein undefined im sichtbaren Flavor.
- Kein zweiter unerwarteter Fehler-Chat.

## Artefakte

- Spezifikation: e2e/cases/e2e-001-nahkampf-angriffsdialog/e2e-001-nahkampf-angriffsdialog.spec.ts
- Shared Fixture: e2e/shared/fixtures/foundry.ts

## Ausfuehrungsstatus

- Stand: PASS (lokal erfolgreich ausgefuehrt).
- Letzter Lauf: `npm run test:e2e:ref` mit Exit Code 0.
- Hinweis: `E2E_FOUNDRY_PASSWORD` nur setzen, wenn die lokale Foundry-Konfiguration ein Passwort verlangt.

## Ausfuehrungsprotokoll (Feuertaufe)

- Playwright-Testdatei wurde erfolgreich erkannt (`--list` zeigt 1 Test).
- Erstlauf blockiert durch fehlendes Browser-Binary, danach behoben mit `npx playwright install chromium`.
- Lauf mit `Gamemaster` blockiert, weil User in der Join-Auswahl als nicht waehlbar markiert war.
- Lauf mit `Player2` startet, bricht aber korrekt und frueh mit klarer Meldung ab, wenn `E2E_FOUNDRY_PASSWORD` fehlt.
- Login-/Join-Flow wurde gehaertet (Weiterleitungen, Join-Button, Overlay-Verhalten).
- Heldensheet-Oeffnung wurde gehaertet (bereits geoeffnetes Sheet und API-Fallback).
- Aktueller Referenzlauf ist gruen (`1 passed`).

Empfohlener Startbefehl fuer den naechsten Lauf:

```powershell
npm run test:e2e:ref
```

Optional (nur falls Passwort erforderlich):

```powershell
$env:E2E_FOUNDRY_USER='Gamemaster'
$env:E2E_FOUNDRY_PASSWORD='*** lokal setzen ***'
npm run test:e2e:ref
```
