# Halbautomatisierte E2E-Tests (Foundry v13) - Plan

### 1. Objective

Einen umsetzbaren Plan für halbautomatisierte End-to-End-Tests definieren, bei dem ein Agent den Nutzer schrittweise durch die Testfallerhebung führt, daraus eine robuste Testdefinition ableitet, eine Playwright-Testdatei im Repository generiert und diese manuell ausführbar macht. Der VS Code Browser-Agent bleibt Werkzeug für Exploration, Erstabnahme und Debugging; die wiederholbare Testausführung soll über generierten Playwright-Code erfolgen. Der Referenzfall "Held öffnen -> Kampf-Tab -> Nahkampfwaffendialog -> Würfelwurf" bleibt der erste konkrete Durchstich.

### 2. Assumptions

- Foundry-Version ist verbindlich v13.
- E2E-Tests werden absichtlich nicht in CI/Pipeline ausgeführt, sondern manuell durch Tester/Entwickler gestartet.
- Der VS Code Browser-Agent wird als Werkzeug für Exploration, Erstabnahme und Selektorerhebung akzeptiert, trotz experimentellem Status.
- Das wiederholt ausführbare Zielartefakt ist eine versionierte Playwright-Datei im Repository.
- Chat-Validierung bedeutet: Test muss den erzeugten ChatMessage-Inhalt (Struktur + zentrale Textmarker + Ergebniswerte) prüfen.
- Testfälle müssen robuste fachliche Anker verwenden; positionsbasierte Selektoren in dynamischen Listen sind nicht ausreichend.
- Quench ist nicht zwingend erforderlich für den Start: Der Zielprozess kann ohne Quench mit Agenten-Workflow + Playwright umgesetzt werden.
- Quench bleibt optional als Phase-2-Erweiterung für robuste In-Foundry-Testbatches und standardisierte Reports.
- E2E-Artefakte liegen im Root-Ordner `e2e/`.
- Für jeden Testfall wird unter `e2e/cases/` ein eigener Ordner mit Testfallnamen angelegt.
- Pro Testfallordner werden mindestens zwei Dateien erzeugt: `testfall.md` (Beschreibung + Ausführung) und `[testfallname].spec.ts` (Playwright-Test).
- Wiederverwendbare Hilfsdateien (z. B. Fixtures, gemeinsame Helper) liegen zentral unter `e2e/shared/`.
- Der zu erstellende Agent unter `.github/agents/` stellt fehlende Informationen immer über direkte Rückfragen im Chat klar, bevor er Artefakte erzeugt.

### 3. Steps

1. **What**: Teststrategie "ohne Quench als MVP" formalisieren (manuell, halbautomatisiert, Agenten-Workflow + Playwright-Zielbild) und Quench als optionale Erweiterung dokumentieren.
   **Where**: docs/develop, docs/\_specs/2026_03_27_e2e_halbautomatisch_browser_agent
   **Who**: docs
   **Depends on**: none

2. **What**: Ausführungs- und Abnahmeprotokoll für den VS Code Browser-Agent definieren (Startbedingung, stabile Schrittfolge, Evidenz-Screenshots/Logs, Abnahmekriterien) und dessen Rolle gegenüber Playwright klar eingrenzen.
   **Where**: docs/develop
   **Who**: setup
   **Depends on**: 1

3. **What**: Test-Datenvoraussetzungen festlegen (Held existiert, besitzt mindestens eine Nahkampfwaffe, reproduzierbarer Weltzustand).
   **Where**: docs/develop, optional comp_packs/beispiel-helden/\_source
   **Who**: setup
   **Depends on**: 1

4. **What**: Referenz-Testfall als normierte Testdefinition modellieren (Given/When/Then + robuste technische Anker + erwartete Chat-Aussagen). Für dynamische Listen müssen fachliche Textanker statt Positionsselektoren verwendet werden.
   **Where**: scripts/actors/templates/held/tabs/kampf.hbs, scripts/actors/sheets/actor.js, scripts/combat/dialogs/angriff.js, docs/develop
   **Who**: code
   **Depends on**: 2, 3

5. **What**: Chat-Inhaltsvalidierung spezifizieren (Pflichtfelder, Textfragmente, Roll-Ergebnis-Konsistenz, Fehlerfälle).
   **Where**: scripts/combat/dialogs/angriff.js, scripts/dice/wuerfel_misc.js, docs/develop
   **Who**: code
   **Depends on**: 4

6. **What**: "Tester beschreibt Testfall -> Test entsteht"-Template bereitstellen (Eingabetext, Mapping-Regeln, Output-Skelett, Review-Checkliste) und den Zielzustand "Playwright-Datei generieren" verbindlich machen.
   **Where**: docs/develop
   **Who**: docs
   **Depends on**: 4, 5

7. **What**: Agenten-Dialogfluss definieren und als Profil unter `.github/agents/` ablegen; der Agent muss dem Nutzer direkte Rückfragen im Chat stellen (Vorbedingungen, Login, UI-Schritte, Assertions, Locator-Strategie), bevor er `testfall.md` und `*.spec.ts` erzeugt.
   **Where**: .github/agents, docs/\_specs/2026_03_27_e2e_halbautomatisch_browser_agent, docs/develop
   **Who**: docs
   **Depends on**: 6

8. **What**: Zielkonvention für generierte Playwright-Dateien und E2E-Ordnerstruktur festlegen (Root `e2e/`, pro Testfall eigener Ordner, `testfall.md` + `*.spec.ts`, gemeinsamer `e2e/shared/fixtures/` Bereich, Ausführungskommando).
   **Where**: docs/\_specs/2026_03_27_e2e_halbautomatisch_browser_agent, Root-Struktur `e2e/`
   **Who**: code
   **Depends on**: 7

9. **What**: Entscheidungspunkt Phase-2 vorbereiten: Quench evaluieren nur anhand klarer Metriken (Wartbarkeit, Stabilität, Report-Qualität, Aufwand) und nur ergänzend zum Playwright-Zielbild.
   **Where**: docs/\_specs/2026_03_27_e2e_halbautomatisch_browser_agent
   **Who**: setup
   **Depends on**: 8

### 4. Validation Plan

- Prozessvalidierung (manuell):
    - Browser-Agent kann den Referenzfall explorativ ohne manuellen Zwischeneingriff im UI durchlaufen.
    - Erwartetes Ergebnis: Kampf-Tab aktiv, Nahkampf-Angriffsdialog geöffnet, Angriffswurf ausgeführt.
- Artefaktvalidierung:
    - Aus einer Testfallbeschreibung kann ein Agent eine eindeutige Playwright-Datei erzeugen.
    - Der Agent stellt bei fehlenden Angaben zuerst direkte Rückfragen im Chat und erzeugt Artefakte erst nach Klärung.
    - Erwartetes Ergebnis: pro Testfall ein Ordner unter `e2e/cases/[testfallname]/` mit `testfall.md` und `*.spec.ts`.
    - Erwartetes Ergebnis: wiederverwendbare Hilfsdateien liegen unter `e2e/shared/` (insbesondere Fixtures unter `e2e/shared/fixtures/`) und sind nicht pro Testfall dupliziert.
- Chat-Validierung:
    - Es existiert nach dem Wurf eine neue ChatMessage.
    - Erwartete Inhalte: korrekter Kontext (z. B. Angriff/Kampf-Bezug), vorhandener Rollwert, plausibles Success/Fail-Signal laut Systemlogik.
    - Negativcheck: kein stiller Fehler in Console/UI während Dialogöffnung oder Würfelwurf.
- Regression-Sicherheit im Code:
    - npm test
    - npm run lint
    - Erwartung: bestehende Unit-Tests und Linting bleiben grün.
- Abnahme:
    - Testprotokoll enthält ausgeführte Schritte, Ergebnis pro Schritt, Chat-Nachweis und finalen PASS/FAIL-Status.
    - Für den Zielzustand zusätzlich: Pfad der generierten Playwright-Datei und Ausführungsergebnis des generierten Tests.

### 5. Delegation Map

| Step | Specialist | Input                                                                           | Expected Output                                                                           |
| ---- | ---------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1    | docs       | Zielvorgaben (halbautomatisch, manuell, Agenten-Workflow + Playwright-Zielbild) | Verbindliche MVP-Strategie ohne Quench-Pflicht                                            |
| 2    | setup      | Browser-Agent als Exploration/Abnahme gesetzt                                   | Standardablauf für reproduzierbare Testläufe                                              |
| 3    | setup      | Referenz-Testfall und Foundry v13                                               | Definierte Testdaten-Vorbedingungen                                                       |
| 4    | code       | UI-Flow "Held -> Kampf -> Nahkampfdialog -> Wurf"                               | Präzise Testdefinition mit robusten technischen Ankern                                    |
| 5    | code       | Anforderung "Chat-Inhalt validieren"                                            | Prüfkatalog + Assertions für ChatMessage-Inhalte                                          |
| 6    | docs       | Wiederverwendbares Vorgehen für Tester                                          | Template "Beschreibung -> Test" inkl. Checkliste und Playwright-Zielbild                  |
| 7    | docs       | Template + Referenzfall + Nutzerziel                                            | Agentenprofil in `.github/agents/` mit verpflichtenden Chat-Rückfragen und Artefaktregeln |
| 8    | code       | Dialogfluss + Referenzfall                                                      | Konvention für generierte Playwright-Dateien                                              |
| 9    | setup      | MVP-Ergebnisse aus 1-8                                                          | Entscheidungsgrundlage, ob Quench als Phase-2 sinnvoll ist                                |

## Need Input Points

Keine offenen Punkte mehr.
