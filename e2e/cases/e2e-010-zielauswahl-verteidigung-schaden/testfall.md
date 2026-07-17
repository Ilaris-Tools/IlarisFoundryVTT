<!-- DEPRECATED: The canonical test specification is now in openspec/specs/<capability>/spec.md. This file is retained for reference only. -->

# E2E-010 Zielauswahl Verteidigung Schaden

## Metadaten

- ID: E2E-010
- Slug: e2e-010-zielauswahl-verteidigung-schaden
- Kategorie: Kampf / Zielauswahl / Verteidigung / Schaden
- Foundry-Version: v13
- Status: Erstellt

## Login-Parameter

- Foundry-URL: http://localhost:30000
- Accountname: Gamemaster
- Weltname: Vanilla Ilaris
- Passwortquelle: kein Passwort (leer)

## Vorbedingungen (Given)

- Token von HatAlles und Testlauf-Held sind auf der aktiven Szene vorhanden.
- Distanz ist egal.
- Kein aktiver Combat erforderlich.
- HatAlles besitzt mindestens eine Nahkampfwaffe.

## Testschritte (When)

1. Foundry aufrufen und als Gamemaster der Welt Vanilla Ilaris beitreten.
2. Chat leeren.
3. HatAlles oeffnen, Nahkampfangriffsdialog mit einer Nahkampfwaffe starten.
4. Im Angriffsdialog Zielauswahl oeffnen und Testlauf-Held auswaehlen.
5. Auf Angreifen klicken.
6. Im Chat den Defense-Prompt fuer Testlauf-Held finden und Verteidigen klicken.
7. Im Verteidigungsdialog pruefen, dass nur Verteidigung moeglich ist, dann Verteidigung ausfuehren.
8. Im Chat das Kampfergebnis pruefen.
9. Im Angreiferdialog Schaden klicken.
10. Die Wundzahl (bzw. bei stumpfem Schaden Erschoepfung) von Testlauf-Held gegen den erwarteten numerischen Wert aus dem Schadenswurf vergleichen.

## Erwartete Ergebnisse (Then)

- Defense-Prompt wird im Chat erzeugt und enthaelt Verteidigen-Button(s) fuer den Verteidiger.
- Verteidigungsdialog oeffnet mit Titel Verteidigung gegen HatAlles.
- Im Verteidigungsdialog sind Angreifen und Zielauswahl deaktiviert.
- Nach Verteidigung erscheint im Chat ein Kampfergebnis mit Angreifer/Verteidiger-Ausgabe.
- Nach Schaden wird ein Schadenswurf erzeugt und die Gesundheitswerte des Verteidigers werden konsistent und numerisch korrekt aktualisiert.
- Am Testende werden die Wunden des Verteidigers auf den Ausgangswert zurueckgesetzt.

## Chat-Validierung

- Defense-Prompt vorhanden: content enthaelt defense-prompt.
- Kampfergebnis vorhanden: content enthaelt Kampfergebnis.
- Schaden-Nachricht vorhanden: flavor enthaelt Schaden (.

## Negativpruefungen

- Kein Akrobatik-Button im melee-Defense-Prompt.
- Im Verteidigungsdialog ist Angreifen deaktiviert.
- Im Verteidigungsdialog ist Andere Akteure deaktiviert.

## Artefakte

- Spezifikation: e2e/cases/e2e-010-zielauswahl-verteidigung-schaden/e2e-010-zielauswahl-verteidigung-schaden.spec.ts
- Shared Fixture: e2e/shared/fixtures/foundry.ts
