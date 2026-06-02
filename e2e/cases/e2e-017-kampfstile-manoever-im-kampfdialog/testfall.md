# E2E-017: Kampfstile und Stil-Manöver im Kampfdialog

## Ziel

Prüft für den Held-Actor `HatAlles`, dass im Kampf-Tab alle sechs vorhandenen Kampfstile nacheinander ausgewählt werden können, die Stil-Voraussetzungen per Haupt-/Nebenwaffe beziehungsweise Beritten-Status erfüllt sind und im Nahkampf-Angriffsdialog genau das stilgebundene Manöver aktiv ist.

Geprüfte Stil-Manöver:

- `Beidhändiger Kampf` -> `Doppelangriff`
- `Kraftvoller Kampf` -> `Befreiungsschlag`
- `Parierwaffenkampf` -> `Riposte`
- `Reiterkampf` -> `Überrennen`
- `Schildkampf` -> `Schildwall`
- `Schneller Kampf` -> `Unterlaufen`

---

## Metadaten

| Feld        | Wert                                                               |
| ----------- | ------------------------------------------------------------------ |
| ID          | E2E-017                                                            |
| Slug        | `e2e-017-kampfstile-manoever-im-kampfdialog`                       |
| Held        | `HatAlles`                                                         |
| Foundry-URL | `process.env.E2E_FOUNDRY_URL` (Standard: `http://localhost:30000`) |
| Benutzer    | `Gamemaster`                                                       |
| Welt        | `Vanilla Ilaris`                                                   |
| Passwort    | Kein (offene Welt)                                                 |
| Dialog      | Nahkampfangriff mit Hauptwaffe                                     |

---

## Voraussetzungen (Given)

- Foundry VTT läuft und die Welt `Vanilla Ilaris` ist gestartet.
- Der Held `HatAlles` existiert in der Welt und besitzt alle sechs Stilreihen bis Stufe III.
- Der Kampf-Tab zeigt im Kampfstil-Dropdown die Einträge `Beidhändiger Kampf`, `Kraftvoller Kampf`, `Parierwaffenkampf`, `Reiterkampf`, `Schildkampf` und `Schneller Kampf`.
- Der Test setzt vor jedem Stil-Lauf die nötigen Waffenflags per API deterministisch und stellt nach dem Test den Actor-Zustand wieder her.

---

## Testschritte (When)

1. Login und Welt beitreten.
2. Chat-Log leeren.
3. Snapshot des Actors `HatAlles` aufnehmen.
4. Actor-Sheet von `HatAlles` öffnen und den Kampf-Tab aktivieren.
5. Für jeden der sechs Kampfstile:
    - per API passende Haupt-/Nebenwaffe und `ist_beritten` setzen,
    - Kampfstil im Dropdown auswählen,
    - auf den persistierten Actor-State warten,
    - prüfen, dass kein Warnbanner `.hero-kampf-alert-warning` sichtbar ist,
    - mit der gesetzten Hauptwaffe den Nahkampf-Angriffsdialog öffnen,
    - die Manöver-Sektion ausklappen,
    - das erwartete Stil-Manöver als vorhanden und aktiv prüfen,
    - alle anderen Stil-Manöver als inaktiv prüfen,
    - Dialog schließen.
6. Actor nach dem Test wieder aus dem Snapshot restaurieren.

---

## Erwartetes Ergebnis (Then)

| Assertion                                                            | Bedingung |
| -------------------------------------------------------------------- | --------- |
| Kein `.hero-kampf-alert-warning` nach erfüllten Stil-Voraussetzungen | ✅        |
| Erwartetes Stil-Manöver pro Stil vorhanden                           | ✅        |
| Erwartetes Stil-Manöver pro Stil aktiv / auswählbar                  | ✅        |
| Andere Stil-Manöver sind nicht aktiv                                 | ✅        |
| Dialog lässt sich für jede Stil-Konfiguration mit Hauptwaffe öffnen  | ✅        |

---

## Chat-Validierung

- Keine zusätzliche Chat-Validierung erforderlich.
- Es wird kein Angriff ausgewürfelt; geprüft wird ausschließlich der Zustand des Kampfdialogs.

---

## Negative Checks

- Das freigeschaltete Stil-Manöver darf im Dialog nicht fehlen.
- Die Stil-Manöver der anderen Kampfstile dürfen im jeweiligen Lauf nicht aktiv sein (entweder ausgeblendet oder sichtbar, aber deaktiviert).
- Bei korrekt gesetzten Voraussetzungen darf kein Warnbanner für einen inaktiven Kampfstil sichtbar bleiben.

---

## Bekannte Einschränkungen / Pitfalls

- AppV2 generiert instabile DOM-IDs; die Manöver werden deshalb textbasiert über `.maneuver-item` gesucht.
- Der Kampf-Tab re-rendert nach `selectOption`; nach jeder Stil-Auswahl wird auf den persistierten Actor-State gewartet.
- Für die Waffenwahl werden die vorhandenen Nahkampfwaffen des Actors zur Laufzeit anhand von `eigenschaften`, Handanzahl und Schild-/Parierwaffen-Merkmalen ausgewählt.
- `Reiterkampf` wird mit `ist_beritten = true` geprüft; alle anderen Stile mit `ist_beritten = false`.
