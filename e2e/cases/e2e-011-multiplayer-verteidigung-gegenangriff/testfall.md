<!-- DEPRECATED: The canonical test specification is now in openspec/specs/<capability>/spec.md. This file is retained for reference only. -->

# E2E-011 Multiplayer Verteidigung und Gegenangriff

## Metadaten

- ID: E2E-011
- Slug: e2e-011-multiplayer-verteidigung-gegenangriff
- Kategorie: Kampf / Multiplayer / Verteidigung / Gegenangriff
- Foundry-Version: v13
- Status: Erstellt

## Login-Parameter

| Rolle      | Accountname | Passwort             |
| ---------- | ----------- | -------------------- |
| Gamemaster | Gamemaster  | kein Passwort (leer) |
| Player3    | Player3     | kein Passwort (leer) |

- Foundry-URL: http://localhost:30000
- Weltname: Vanilla Ilaris

## Vorbedingungen (Given)

- Token von HatAlles und Testlauf-Held sind auf der aktiven Szene vorhanden.
- HatAlles besitzt mindestens eine Nahkampfwaffe.
- Testlauf-Held besitzt ein Kurzschwert (Nahkampfwaffe mit Name enthält "Kurzschwert").
- Player3 ist Owner von Testlauf-Held.
- GM ist Owner von HatAlles.
- Einstellung „Zielauswahl" ist aktiv.
- Kein aktiver Combat erforderlich.

## Testschritte (When)

### Phase 1 – GM greift mit HatAlles an

1. Gamemaster und Player3 treten der Welt bei (zwei Browser-Kontexte).
2. Gamemaster leert den Chat.
3. Gamemaster öffnet HatAlles, wählt eine Nahkampfwaffe, startet den Angriffsdialog.
4. Gamemaster öffnet Zielauswahl, wählt Testlauf-Held, bestätigt.
5. Gamemaster klickt Angreifen (Würfel auf niedrig → Treffer sicher).

### Phase 2 – Player3 verteidigt Testlauf-Held

6. Defense-Prompt erscheint auf Player3-Seite.
7. Player3 klickt Verteidigen-Button im Chat.
8. Verteidigungsdialog öffnet sich für Player3.
9. Player3 klickt Verteidigen (Würfel auf hoch → Verteidigung schlägt fehl → GM gewinnt).
10. Kampfergebnis erscheint im Chat (Angreifer durchbricht Verteidigung).

### Phase 3 – GM klickt Schaden, Wunden werden auf Testlauf-Held abgezogen

11. Gamemaster klickt Schaden im Angriffsdialog von HatAlles.
12. Schadenswurf erscheint im Chat.
13. Wunden von Testlauf-Held werden über Owner-Routing (Player3-Client) aktualisiert.

### Phase 4 – Player3 greift mit Testlauf-Held zurück (Kurzschwert + Wuchtschlag 8)

14. Player3 öffnet Testlauf-Held, wählt das Kurzschwert, startet den Angriffsdialog.
15. Player3 öffnet die Manöver-Sektion, setzt Wuchtschlag auf 8.
16. Player3 öffnet Zielauswahl, wählt HatAlles, bestätigt.
17. Player3 klickt Angreifen (Würfel auf niedrig → Treffer sicher).

### Phase 5 – GM verteidigt HatAlles

18. Defense-Prompt erscheint auf GM-Seite.
19. GM klickt Verteidigen-Button im Chat.
20. Verteidigungsdialog öffnet sich für GM.
21. GM klickt Verteidigen (Würfel auf hoch → Verteidigung schlägt fehl → Player3 gewinnt).
22. Kampfergebnis erscheint im Chat.

### Phase 6 – Player3 klickt Schaden auf HatAlles

23. Player3 klickt Schaden im Angriffsdialog von Testlauf-Held.
24. Schadenswurf erscheint im Chat.
25. Wunden von HatAlles werden aktualisiert (Owner = GM, daher via Owner-Routing).

### Phase 7 – Cleanup

26. Beide Charaktere werden auf ihre Ausgangswerte zurückgesetzt.

## Erwartete Ergebnisse (Then)

- Defense-Prompt von HatAlles-Angriff erscheint im Chat von Player3.
- Verteidigungsdialog für Player3 öffnet sich mit Titel „Verteidigung gegen HatAlles".
- Angreifen und Zielauswahl sind im Verteidigungsdialog deaktiviert.
- Kampfergebnis (Phase 2) enthält „durchbricht die Verteidigung".
- Schadenswurf (Phase 3) ist numerisch > 0.
- Wunden von Testlauf-Held sind nach Phase 3 konsistent mit Schadenswurf und WS\*.
- Defense-Prompt von Testlauf-Held-Angriff erscheint im Chat von GM.
- Verteidigungsdialog für GM öffnet sich mit Titel „Verteidigung gegen Testlauf-Held".
- Kampfergebnis (Phase 5) enthält „durchbricht die Verteidigung".
- Schadenswurf (Phase 6) ist numerisch > 0.
- Wunden von HatAlles sind nach Phase 6 konsistent mit Schadenswurf und WS\*.
- Nach dem Test sind Wunden beider Charaktere auf Ausgangswert zurückgesetzt.

## Chat-Validierung

- Defense-Prompt vorhanden (Phase 1): `content` enthält `defense-prompt`.
- Kampfergebnis Phase 2: `content` enthält `Kampfergebnis` und `durchbricht die Verteidigung`.
- Schadensnachricht Phase 3: `flavor` enthält `Schaden (`.
- Defense-Prompt vorhanden (Phase 4): `content` enthält `defense-prompt`.
- Kampfergebnis Phase 5: `content` enthält `Kampfergebnis` und `durchbricht die Verteidigung`.
- Schadensnachricht Phase 6: `flavor` enthält `Schaden (`.

## Negativprüfungen

- Kein Akrobatik-Button im melee-Defense-Prompt.
- Im Verteidigungsdialog (Player3) ist Angreifen deaktiviert.
- Im Verteidigungsdialog (Player3) ist Zielauswahl deaktiviert.
- Im Verteidigungsdialog (GM) ist Angreifen deaktiviert.

## Artefakte

- Spezifikation: e2e/cases/e2e-011-multiplayer-verteidigung-gegenangriff/e2e-011-multiplayer-verteidigung-gegenangriff.spec.ts
- Shared Fixture: e2e/shared/fixtures/foundry.ts
