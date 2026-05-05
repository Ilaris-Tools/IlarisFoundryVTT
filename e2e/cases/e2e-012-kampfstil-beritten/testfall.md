# E2E-012: Kampfstil-Auswahl und Berittener Kampf

## Ziel

Prüft, dass die Auswahl eines Kampfstils mit Bedingungen (Berittener Kampf) die Warn-Meldung korrekt ein- und ausblendet, und dass der AT-Modifier des Kampfstils nach Aktivierung (Beritten-Checkbox) in der Waffentabelle des Kampf-Tabs korrekt ausgewiesen wird.

---

## Metadaten

| Feld          | Wert                                                               |
| ------------- | ------------------------------------------------------------------ |
| ID            | E2E-012                                                            |
| Slug          | `e2e-012-kampfstil-beritten`                                       |
| Held          | `HatAlles`                                                         |
| Kampfstil     | `Reiterkampf` (Dropdown-Key; Vorteile: Reiterkampf I/II/III)       |
| Hauptwaffe    | `Ochsenherde` (Basis-AT 25, erwartet 28)                           |
| Nebenwaffe    | `Kriegspferd` (Basis-AT 30, erwartet 33)                           |
| Kampfstil-Mod | +3                                                                 |
| Foundry-URL   | `process.env.E2E_FOUNDRY_URL` (Standard: `http://localhost:30000`) |
| Benutzer      | `Gamemaster`                                                       |
| Welt          | `Vanilla Ilaris`                                                   |
| Passwort      | Kein (offene Welt)                                                 |

---

## Voraussetzungen (Given)

- Foundry VTT läuft und die Welt „Vanilla Ilaris" ist gestartet.
- Der Held **`HatAlles`** existiert in der Welt.
- `HatAlles` besitzt **`Berittener Kampf`** als Vorteil (Kampfstil-Gruppe 3).
- `HatAlles` besitzt die Waffe **`Ochsenherde`** (Nahkampfwaffe, Basis-AT 25) und **`Kriegspferd`** (Nahkampfwaffe, Basis-AT 30).
- Zu Beginn des Tests ist **kein** Kampfstil aktiv (`system.misc.selected_kampfstil = "ohne"`) und `ist_beritten = false`.
- `Ochsenherde` ist als Hauptwaffe gesetzt, `Kriegspferd` als Nebenwaffe (wird per API vor dem Test sichergestellt).
- Standard-Hauptwaffe des Helden (nach Test-Reset) ist `CustomAnderthalbhänder`.

---

## Testschritte (When)

1. Login und Welt beitreten.
2. Chat-Log leeren.
3. Per API sicherstellen: `Ochsenherde` = Hauptwaffe (`hauptwaffe: true`), `Kriegspferd` = Nebenwaffe.
4. Per API sicherstellen: Kampfstil auf `"ohne"` zurücksetzen, `ist_beritten = false`.
5. Actor-Sheet von `HatAlles` öffnen.
6. Kampf-Tab anklicken.
7. Kampfstil-Dropdown auf **`Reiterkampf`** setzen (zusammengeführter Key aus Reiterkampf I/II/III).
8. Warten bis der Held aktualisiert wurde (`system.misc.selected_kampfstil === "Reiterkampf"`).
9. Warn-Banner `.hero-kampf-alert-warning` prüfen (muss sichtbar sein und Text `"Kampfstil inaktiv: Der Charakter ist nicht beritten"` enthalten).
10. Beritten-Checkbox (`input[name="system.misc.ist_beritten"]`) aktivieren.
11. Warten bis der Held aktualisiert wurde (`ist_beritten === true`).
12. Warn-Banner prüfen: muss **unsichtbar/nicht vorhanden** sein.
13. AT-Werte in der Kampf-Tabelle prüfen:
    - `Ochsenherde`-Zeile: effektiver AT über Tooltip `data-tooltip` als `PW:+28`
    - `Kriegspferd`-Zeile: sichtbarer Tabellenwert `33`

---

## Erwartetes Ergebnis (Then)

| Assertion                                                                 | Bedingung |
| ------------------------------------------------------------------------- | --------- |
| `.hero-kampf-alert-warning` ist sichtbar nach Kampfstil-Auswahl           | ✅        |
| Warn-Text enthält `"Kampfstil inaktiv: Der Charakter ist nicht beritten"` | ✅        |
| `.hero-kampf-alert-warning` ist nicht vorhanden nach Beritten-Aktivierung | ✅        |
| Tooltip `PW:+28` in `Ochsenherde`-AT-Zelle                                | ✅        |
| Sichtbarer AT-Wert `33` in `Kriegspferd`-AT-Zelle                         | ✅        |

---

## Negative Checks

- Nach Kampfstil-Auswahl ohne Beritten darf die Warnung **nicht** fehlen.
- Nach Beritten-Aktivierung darf die Warnung **nicht** mehr sichtbar sein.
- Die AT-Werte dürfen **nicht** die Basis-Werte (25 / 30) zeigen, wenn der Kampfstil aktiv ist.

---

## Bekannte Einschränkungen / Pitfalls

- Der AT-Modifier ist **in `baseAT` eingerechnet** — er erscheint nicht als eigene Zeile im Angriffsdialog.
- Nach `selectOption` / `check` muss auf den Foundry-Actor-Update gewartet werden (submitOnChange re-rendert das Sheet).
- Die Kampfstil-Optionen sind dynamisch (nur Stile, die der Held als Vorteil besitzt, erscheinen im Dropdown).
- `.hero-kampf-alert-warning` ist im DOM **nicht vorhanden** (kein `display:none`), wenn inaktiv — `not.toBeVisible()` reicht.
