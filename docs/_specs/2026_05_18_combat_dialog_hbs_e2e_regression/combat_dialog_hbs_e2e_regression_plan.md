# Plan: Kampfdialog-HBS-E2E-Regressionen

## 1. Objective

Den aktuellen Branch-Zustand nach der Auslagerung des HTMLs aus den Kampfdialogen Angriff, Fernkampf und Übernatürlich in eigene HBS-Dateien analysieren und einen belastbaren Arbeitsplan definieren, um die dadurch ausgelösten E2E-Timeouts in den Dialog-Tests zu beheben.

## 2. Assumptions

- Die HBS-Auslagerung ist fachlich gewollt; der primäre Reparaturpfad ist daher zunächst die Anpassung der E2E-Tests an den neuen DOM-Vertrag statt ein Rückbau der Dialog-Refaktorierung.
- Die Hauptursache der Timeouts ist Selektor-Drift: Die Dialoge verwenden für klickbare Summary-Karten jetzt `data-action` statt zusätzlicher CSS-Klassen wie `.angreifen`, `.verteidigen` und `.schaden`.
- Die Action-Bindings der Dialoge funktionieren grundsätzlich weiterhin über Foundry AppV2/ApplicationV2 und sind nicht der primäre Fehlerherd.
- Neben den direkt genannten Dialogtests sind auch weitere E2E-Fälle betroffen, die dieselben veralteten Selektoren verwenden.
- Falls nach der Selektor-Reparatur weitere Fehler verbleiben, liegt der nächstwahrscheinliche Fehler an Timing oder Re-Render-Verhalten im nur teilweise neu gerenderten Summary-Bereich.
- Es ist akzeptabel, im Plan sowohl die Test-Spezifikationen als auch begleitende `testfall.md`-Dokumentation als Pflegeumfang zu führen, wenn dort dieselben veralteten Selektoren dokumentiert sind.

## 3. Steps

1. **What**: Den Ist-Stand der Regressionen konsolidieren: branchbezogene Refaktor-Dateien, gerenderte DOM-Artefakte und alle E2E-Spezifikationen mit Legacy-Selektoren erfassen und priorisieren.
   **Where**: `scripts/combat/dialogs/`, `scripts/combat/templates/dialogs/`, `e2e/cases/`, `test-results/`
   **Who**: code
   **Depends on**: none

2. **What**: Den neuen stabilen DOM-Vertrag für klickbare Summary-Aktionen definieren und als Reparaturziel festschreiben, insbesondere für Angriff, Verteidigung und Schaden via `data-action`.
   **Where**: `scripts/combat/templates/dialogs/summaries.hbs`, `scripts/combat/dialogs/angriff.js`, `scripts/combat/dialogs/fernkampf-angriff.js`, `scripts/combat/dialogs/uebernatuerlich.js`
   **Who**: code
   **Depends on**: 1

3. **What**: Die direkt regressiven Kern-Spezifikationen auf den neuen DOM-Vertrag umstellen, inklusive aller Fallback-Pfade per `dispatchEvent`, damit Timeouts beim Klicken auf Angriff, Verteidigung und Schaden entfallen.
   **Where**: `e2e/cases/e2e-001-nahkampf-angriffsdialog/e2e-001-nahkampf-angriffsdialog.spec.ts`, `e2e/cases/e2e-008-fernkampf-angriffsdialog/e2e-008-fernkampf-angriffsdialog.spec.ts`, `e2e/cases/e2e-009-uebernatuerlich-dialog/e2e-009-uebernatuerlich-dialog.spec.ts`, `e2e/cases/e2e-010-zielauswahl-verteidigung-schaden/e2e-010-zielauswahl-verteidigung-schaden.spec.ts`, `e2e/cases/e2e-011-multiplayer-verteidigung-gegenangriff/e2e-011-multiplayer-verteidigung-gegenangriff.spec.ts`
   **Who**: code
   **Depends on**: 2

4. **What**: Die weiteren bekannten Folgestellen mit denselben Legacy-Selektoren bereinigen, damit die Testbasis konsistent bleibt und keine verdeckten Folgefehler im nächsten Lauf stehen bleiben.
   **Where**: `e2e/cases/e2e-003-manoever-wuchtschlag-gezielter-schlag/e2e-003-manoever-wuchtschlag-gezielter-schlag.spec.ts`, `e2e/cases/e2e-005-nahkampf-patzer-triumph/e2e-005-nahkampf-patzer-triumph.spec.ts`, `e2e/cases/e2e-024-kreaturen-kompendium-belastungstest/e2e-024-kreaturen-kompendium-belastungstest.spec.ts`, optional begleitend betroffene `testfall.md`-Dateien unter denselben Fallordnern
   **Who**: code
   **Depends on**: 3

5. **What**: Falls Selektorreparaturen allein nicht ausreichen, den sekundären Grenzfall verifizieren: Re-Render- und Timing-Verhalten des Summary-Parts prüfen und Tests nur dort robuster machen, wo die UI nachweisbar asynchron nachzieht.
   **Where**: `scripts/combat/dialogs/combat-dialog.js`, betroffene E2E-Spezifikationen aus Schritt 3 und 4
   **Who**: code
   **Depends on**: 3

6. **What**: Die Reparatur mit fokussierten E2E-Läufen absichern, anschließend Lint und die verbleibenden betroffenen Dialogfälle erneut ausführen; dabei unterscheiden, ob Restfehler testseitig oder dialogseitig kontrolliert werden.
   **Where**: Repo-Root über `package.json`, betroffene `e2e/cases/`
   **Who**: setup
   **Depends on**: 4, 5

7. **What**: Eine abschließende Review auf Regressionsrisiko durchführen: Sind die Selektoren jetzt an den stabilsten verfügbaren Vertrag gekoppelt, und gibt es noch Altlasten in Spezifikationen oder Dokumentation.
   **Where**: geänderte Dateien aus Schritt 3 bis 5
   **Who**: docs
   **Depends on**: 6

## 4. Validation Plan

- Für Schritt 1 und 2:
    - Manuelle Prüfung der aktuellen Dialog-Implementierungen und Testartefakte.
    - Erwartetes Ergebnis: Für jede betroffene Klickaktion ist eindeutig dokumentiert, welcher `data-action`-Wert künftig die stabile Selektorbasis bildet.

- Für Schritt 3:
    - Fokussierte Playwright-Läufe der primär betroffenen Fälle, bevorzugt einzeln oder in kleiner Gruppe.
    - Mögliche Kommandos:
        - `npx playwright test e2e/cases/e2e-001-nahkampf-angriffsdialog`
        - `npx playwright test e2e/cases/e2e-008-fernkampf-angriffsdialog`
        - `npx playwright test e2e/cases/e2e-009-uebernatuerlich-dialog`
        - `npx playwright test e2e/cases/e2e-010-zielauswahl-verteidigung-schaden`
        - `npx playwright test e2e/cases/e2e-011-multiplayer-verteidigung-gegenangriff`
    - Erwartetes Ergebnis: Die vorherigen Timeout-Stellen beim Klick auf Angriff, Verteidigung oder Schaden werden reproduzierbar überwunden.

- Für Schritt 4:
    - Zusätzliche fokussierte Playwright-Läufe für die sekundär betroffenen Fälle.
    - Mögliche Kommandos:
        - `npx playwright test e2e/cases/e2e-003-manoever-wuchtschlag-gezielter-schlag`
        - `npx playwright test e2e/cases/e2e-005-nahkampf-patzer-triumph`
        - `npx playwright test e2e/cases/e2e-024-kreaturen-kompendium-belastungstest`
    - Erwartetes Ergebnis: Keine verbleibenden Klick-Timeoutes durch Legacy-Selektoren in den Kampfdialogen.

- Für Schritt 5:
    - Nur falls nötig gezielte Reproduktion des Restfehlers mit DOM-Inspektion oder Artefaktanalyse.
    - Erwartetes Ergebnis: Entweder wird bestätigt, dass kein weiterer UI-Fehler existiert, oder ein klarer zweiter Defekt wird vom Selektorproblem getrennt identifiziert.

- Für Schritt 6:
    - Gesamtlauf der E2E-Tests oder mindestens des relevanten Dialog-Clusters über das vorhandene Repo-Skript `npm run test:e2e`.
    - `npm run lint`
    - Erwartetes Ergebnis: Der betroffene Dialog-Cluster läuft ohne Timeout-Regressionsfehler, und der geänderte Testcode ist lint-konform.

- Für Schritt 7:
    - Review-Checkliste:
        - Alle Klickpfade verwenden konsistente, wartbare Selektoren.
        - Keine Fallback-Pfade referenzieren mehr `.angreifen`, `.verteidigen` oder `.schaden` als CSS-Klassen, sofern diese im DOM nicht garantiert sind.
        - Dokumentation der Testfälle ist, falls angepasst, konsistent mit dem tatsächlichen DOM-Vertrag.
    - Erwartetes Ergebnis: `PASS` oder `PASS_WITH_NOTES`, aber kein offener Hochrisiko-Regressionspunkt mehr in den betroffenen Dialogtests.

## 5. Delegation Map

| Step | Specialist | Input                                                                      | Expected Output                                                                           |
| ---- | ---------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1    | code       | Branch-Kontext, Research-Fundstellen, bestehende `test-results/`-Artefakte | Priorisierte Liste betroffener Dialog- und E2E-Dateien mit bestätigtem Fehlerbild         |
| 2    | code       | Aktuelle Dialogklassen und `summaries.hbs`                                 | Definierter Zielvertrag für stabile Klick-Selektoren pro Aktion                           |
| 3    | code       | Kern-Spezifikationen der Dialogflüsse                                      | Angepasste E2E-Tests ohne Legacy-Selektoren in Primärpfaden                               |
| 4    | code       | Restliche Trefferliste der Legacy-Selektoren                               | Bereinigte Sekundärtests und optional aktualisierte `testfall.md`-Dateien                 |
| 5    | code       | Ergebnisse aus Schritt 3 und 4                                             | Entscheidung, ob nur Test-Fix genügt oder eine zusätzliche Timing-/UI-Anpassung nötig ist |
| 6    | setup      | Geänderte Tests, verfügbare npm-/Playwright-Skripte                        | Validierungsprotokoll mit fokussierten E2E-Ergebnissen und Lint-Status                    |
| 7    | docs       | Geänderte Test- und ggf. Testfall-Dateien                                  | Review-Einschätzung zu Wartbarkeit, Regressionsrisiko und Restpunkten                     |
