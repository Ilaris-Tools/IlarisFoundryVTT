# E2E-Tests (Halbautomatisiert)

Dieser Artikel beschreibt Strategie, Ausführungsprotokoll und Testdaten-Setup für halbautomatisierte End-to-End-Tests im Ilaris FoundryVTT System. Der mittelfristige Zielzustand ist ein Agenten-Workflow, der einen Tester schrittweise durch die Testfalldefinition führt, daraus eine Playwright-Testdatei im Repository generiert und diese anschließend ausführbar macht.

---

## Strategie

### Was ist "halbautomatisiert"?

E2E-Tests laufen im **echten Foundry-Browser** (v13) und werden **manuell durch den Tester ausgelöst**. Die gesamte Ausführung, Inspektion und Abnahme erfolgt mit dem **VS Code Browser-Agent** (experimentelles GitHub-Copilot-Feature).

Jeder Testfall enthält einen **vollständigen Login-Flow**. Der Browser-Agent öffnet Foundry selbst, meldet sich mit einem dedizierten Test-Account an und joint die Zielwelt eigenständig.

Diese Tests laufen **nicht** in CI/Pipeline und werden **nicht** über `npm test` gestartet. Sie ergänzen die bestehenden Jest-Unit-Tests um echte UI- und Chat-Interaktion.

Kurzfristig dienen Markdown-Testfälle als Spezifikation und Review-Artefakt. Langfristig soll daraus pro Testfall eine **generierte Playwright-Datei** im Repository entstehen.

| Ebene             | Werkzeug                    | Trigger              | Scope                                     |
| ----------------- | --------------------------- | -------------------- | ----------------------------------------- |
| Unit-Tests        | Jest (`npm test`)           | Entwickler / CI      | Pure Logic, keine Foundry-UI              |
| E2E-Spezifikation | Markdown + Browser-Agent    | Manuell durch Tester | Testdefinition, Explorationslauf, Abnahme |
| E2E-Ausführung    | Generierter Playwright-Test | Manuell durch Tester | Reproduzierbare UI- und Chat-Validierung  |

### Warum (vorerst) kein Quench?

[Quench](https://foundryvtt.com/packages/quench/) ist ein FoundryVTT-Modul für In-Browser-Testbatches (Mocha/Chai). Es wird vorerst **nicht** eingesetzt, weil:

- Der VS Code Browser-Agent direkten UI-Zugriff, DOM-Inspektion und Chat-Validierung ohne Zusatzmodul ermöglicht.
- Kein Modul-Installationsaufwand beim Tester.
- Testfälle können zunächst als Markdown-Dateien versioniert und reviewed werden.
- Der Browser-Agent eignet sich gut, um aus einer dialogischen Testfallerhebung robuste Playwright-Locators und Assertions abzuleiten.

Quench wird als **Phase-2-Option** evaluiert, sobald der MVP läuft — mit klaren Metriken:
Wartbarkeit, Stabilität der automatischen Reports, Aufwand gegenüber Browser-Agent. Details: [Phase-2-Entscheidungspunkt](../_specs/2026_03_27_e2e_halbautomatisch_browser_agent/e2e_halbautomatisch_plan.md).

---

## VS Code Browser-Agent

### Was kann er?

Der Browser-Agent ist ein experimentelles Feature von GitHub Copilot in VS Code (Agent-Modus). Er kann:

- Eine Browser-Seite zu einer URL öffnen.
- Elemente im DOM per CSS-Selektor finden und anklicken.
- Text eingeben.
- Den DOM-Zustand und Chat-Inhalte lesen.
- Screenshot-ähnliche Evidenz erzeugen (Seitenbeobachtung).

### Wie wird er gestartet?

1. VS Code öffnen.
2. GitHub Copilot Chat öffnen (Standard-Shortcut `Ctrl+Alt+I`).
3. Auf **Agent-Modus** wechseln (experimentell, muss in VS Code aktiviert sein).
4. Sicherstellen, dass die VS-Code-Einstellung `workbench.browser.enableChatTools` aktiviert ist.
5. Die Testfall-Datei als Kontext anhängen (Büroklammer-Symbol oder Drag & Drop).
6. Prompt eingeben: z. B. `Führe den E2E-Testfall aus der angehängten Datei aus.`

### Technische Voraussetzung in VS Code

Für echte Browser-Interaktion reicht es **nicht**, dass der integrierte Browser die Foundry-URL öffnen kann. Der Browser-Agent benötigt zusätzlich die VS-Code-Einstellung:

`workbench.browser.enableChatTools = true`

Ohne diese Einstellung kann der Agent zwar unter Umständen eine Seite öffnen, aber **keine Seiteninhalte lesen, keine Elemente anklicken und keine Eingaben ausführen**. Ein vollständiger E2E-Testlauf ist dann nicht möglich.

### Zielarchitektur

Der gewünschte Zielprozess besteht aus vier Schritten:

1. Ein Agent führt den Nutzer dialogisch durch den Testfall.
2. Aus den Antworten erzeugt der Agent eine normierte Testfallspezifikation.
3. Der Agent generiert daraus eine Playwright-Datei im Repository.
4. Der generierte Test wird manuell ausgeführt und das Ergebnis wird abgenommen.

Der Browser-Agent bleibt dabei wichtig, aber primär für Exploration, Selektorfindung, Erstabnahme und Debugging. Die wiederholbare Ausführung soll über Playwright-Code erfolgen.

### Wichtige Einschränkungen

| Einschränkung                  | Auswirkung                                                 | Umgang                                                                                          |
| ------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Experimenteller Status         | API-Änderungen möglich                                     | Tests als robuste Markdown-Definitionen versionieren, nicht Agent-Prompts                       |
| Kein persistenter Zustand      | Jede Session startet "frisch"                              | Vorbedingungen vollständig in der Testdatei dokumentieren                                       |
| Foundry-Auth required          | Browser-Agent muss Login und Welteintritt selbst ausführen | Jeder Testfall beschreibt Login-Seite, Benutzerwahl, Passwort-Eingabe und Join-Schritt explizit |
| Zufälliges Würfelergebnis      | Rollwert nicht deterministisch                             | Chat-Validierung prüft **Struktur** und **Plausibilität**, nicht den exakten Wert               |
| Browser-Chat-Tools deaktiviert | Nur URL-Öffnen möglich, keine Interaktion mit DOM          | Vor Testlauf `workbench.browser.enableChatTools` aktivieren und VS Code neu laden               |

### Login-Regel

E2E-Testfälle dürfen **keinen bereits eingeloggten Browserzustand voraussetzen**. Ein Testfall ist nur dann vollständig, wenn er:

1. die Foundry-URL selbst öffnet,
2. den Login-Dialog erkennt,
3. den vorgesehenen Test-Account auswählt,
4. das Passwort eingibt,
5. die Zielwelt joint,
6. erst danach mit der eigentlichen Fachaktion beginnt.

Die Zugangsdaten selbst gehören **nicht** in versionierte Markdown-Dateien. Stattdessen wird mit einem fest definierten Test-Account gearbeitet, dessen Passwort dem Tester lokal bekannt ist.

---

## Ausführungsprotokoll: Ablauf eines Testlaufs

### Schritt 1 — Foundry starten

Über den VS Code Task `Start Foundry` (Terminal → Run Task → Start Foundry).  
Foundry ist danach erreichbar unter `http://localhost:30000` (Standard-Port).

### Schritt 2 — Login und Testwelt aktivieren

1. Im Browser Foundry-URL öffnen.
2. Den definierten Test-Account auswählen.
3. Passwort eingeben.
4. Die **Testwelt** auswählen und joinen (siehe [Testdaten einrichten](#testdaten-einrichten)).

### Schritt 3 — Browser-Agent starten

VS Code öffnen → Copilot Chat → Agent-Modus → `workbench.browser.enableChatTools` prüfen → Testfall-Datei anhängen → Prompt abschicken.

### Schritt 4 — Ausführung beobachten

Der Agent führt die Schritte aus dem Testfall aus und meldet Ergebnis pro Schritt.

Wenn der Agent nur melden kann, dass eine Browser-Seite geöffnet wurde, aber keine DOM-Interaktion verfügbar ist, gilt der Testlauf als **technisch blockiert** und nicht als `FAIL` des eigentlichen Features.

### Schritt 5 — Abnahme dokumentieren

Nach dem Lauf wird das Ergebnis als Abnahme-Protokoll festgehalten (manuell oder durch den Agenten generiert). Format: `PASS` / `FAIL` pro Testfall, mit Evidenz (DOM-Zustand, Chat-Nachweis, Fehler-Log falls vorhanden).

---

## Testdaten einrichten

Damit E2E-Tests reproduzierbar sind, muss die Testwelt einen definierten Ausgangszustand haben.

### Minimale Anforderungen

| Anforderung              | Beschreibung                                                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| **Testheld**             | Ein Actor vom Typ `held` (Name: `Testlauf-Held` oder konfigurierbar im Testfall)               |
| **Nahkampfwaffe**        | Mindestens eine `nahkampfwaffe`-Item am Held, z. B. `Kurzschwert` mit AT-Wert                  |
| **Test-Account**         | Dedizierter Login für E2E, idealerweise GM-Rechte, z. B. `e2e-gm`                              |
| **Lokale Credentials**   | Passwort des Test-Accounts ist dem Tester lokal bekannt, wird aber nicht im Repo gespeichert   |
| **Kein laufender Kampf** | Kein aktiver Combat-Tracker beim Teststart (verhindert unerwünschte Kampfphasen-Dialoge)       |
| **Leerer Chat**          | Chat-Log sollte zu Beginn leer oder bekannt sein (erleichtert Validierung der neuen Nachricht) |

### Vorbereitungsschritte (einmalig)

1. Testwelt anlegen (oder eine existierende "Entwicklungswelt" verwenden).
2. Held `Testlauf-Held` anlegen: Actor-Typ `held`, Name exakt `Testlauf-Held`.
3. Nahkampfwaffe hinzufügen: Weapon-Typ `nahkampfwaffe`, Name `Kurzschwert`, AT-Wert z. B. `12`.
4. Dedizierten Test-Account anlegen, z. B. `e2e-gm`, mit den benötigten Rechten.
5. Weltname und Accountname im Team dokumentieren.

### Login-Parameter für Testfälle

Jeder Testfall soll diese Werte explizit benennen:

| Feld           | Beispiel                     | Hinweis                                        |
| -------------- | ---------------------------- | ---------------------------------------------- |
| Foundry-URL    | `http://localhost:30000`     | Kann je nach lokaler Installation abweichen    |
| Accountname    | `e2e-gm`                     | Kein Personen-Account verwenden                |
| Weltname       | `Ilaris E2E`                 | Muss exakt mit der Foundry-Welt übereinstimmen |
| Passwortquelle | Lokal beim Tester hinterlegt | Nie im Markdown oder Repo speichern            |

### Wiederherstellung des Ausgangszustands

Vor jedem Testlauf:

```
1. Chat-Log leeren: Chatbereich → "Chat leeren" (GM-Reiter)
2. Alle offenen Sheets schließen
3. Seite neu laden (damit kein Dirty-State aus vorherigem Testlauf verbleibt)
```

---

## Repository-Struktur für E2E-Artefakte

Alle generierten und gepflegten E2E-Artefakte liegen unter dem Root-Ordner `e2e/`.

```text
e2e/
	cases/
		e2e-001-nahkampf-angriff/
			testfall.md
			e2e-001-nahkampf-angriff.spec.ts
		e2e-002-.../
			testfall.md
			e2e-002-....spec.ts
	shared/
		fixtures/
			auth.fixture.ts
			foundry-world.fixture.ts
		helpers/
			chat-assertions.ts
			locator-utils.ts
```

Regeln:

- Pro Testfall genau ein eigener Ordner in `e2e/cases/`.
- In jedem Testfallordner liegt eine `testfall.md` mit Beschreibung, getroffenen Annahmen, ausgeführten Schritten und Ergebnis.
- In demselben Ordner liegt die passende Playwright-Spec-Datei `*.spec.ts`.
- Wiederverwendbare Dateien kommen nicht in den Testfallordner, sondern nach `e2e/shared/`.
- Reusable Fixtures liegen unter `e2e/shared/fixtures/`, wenn sie auch für andere Testfälle nutzbar sind.

### Inhalt der testfall.md im Testfallordner

Die `testfall.md` pro Fall dokumentiert:

- Ausgangsbeschreibung durch den Nutzer
- Vom Agenten normalisierte Testschritte
- Login-Parameter (ohne Passwort im Repo)
- Durchgeführten Lauf inkl. PASS/FAIL/BLOCKED
- Abweichungen zwischen Erwartung und Beobachtung
- Verweis auf die zugehörige `*.spec.ts`

---

## Abnahmekriterien

Ein E2E-Test gilt als `PASS`, wenn **alle** Punkte erfüllt sind:

- [ ] Alle UI-Schritte des Testfalls laufen ohne JavaScript-Fehler in der Browser-Konsole.
- [ ] Der beschriebene Dialog öffnet sich korrekt (sichtbar, korrekte Klasse/Titel).
- [ ] Der Würfelwurf wird ausgeführt (kein Absturz, kein leerer Fehler).
- [ ] Eine neue ChatMessage erscheint im Chat-Log.
- [ ] Die ChatMessage enthält die gesetzten Pflichtinhalte (Titel, Rollwert, kein leerer Flavor).
- [ ] Kein `ILARIS | Error` in der Browser-Konsole während des Tests.

Ein E2E-Test gilt als `FAIL`, sobald **ein** Punkt nicht erfüllt ist.

Ein E2E-Testlauf gilt als **blockiert**, wenn die Browser-Agent-Werkzeuge in VS Code nicht aktiv sind und deshalb keine Interaktion mit dem Foundry-DOM möglich ist.

---

## Bekannter Ausführungs-Blocker

Beim dokumentierten Ausführungsversuch konnte der integrierte Browser `http://localhost:30000` erfolgreich öffnen. Die weitere Ausführung des Referenz-Testfalls war jedoch blockiert, weil in der VS-Code-Session die Browser-Chat-Tools nicht aktiviert waren.

Beobachtetes Verhalten:

- Foundry-URL erreichbar und im integrierten Browser geöffnet.
- Kein Lesen von Seiteninhalten durch den Agent.
- Kein Klicken, Tippen oder DOM-Inspektion möglich.

Folgerung:

- Foundry-Erreichbarkeit allein reicht nicht für einen E2E-Testlauf.
- Für Login, Weltbeitritt, Sheet-Interaktion und Chat-Validierung muss `workbench.browser.enableChatTools` aktiv sein.

---

## Referenzfälle

| ID      | Name                                                        | Datei                                                                                                                 |
| ------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| E2E-001 | Nahkampf-Angriffsdialog: Held öffnen, Kampf-Tab, Würfelwurf | [referenz-testfall-nahkampf.md](../_specs/2026_03_27_e2e_halbautomatisch_browser_agent/referenz-testfall-nahkampf.md) |

---

## Neuen Testfall erstellen

Jeder Tester kann einen Testfall beschreiben ohne tiefe Codekenntnis. Das Template dafür:
[testfall-template.md](../_specs/2026_03_27_e2e_halbautomatisch_browser_agent/testfall-template.md).

Zielbild:

1. Tester beschreibt den Ablauf gemeinsam mit einem Agenten.
2. Agent schärft Vorbedingungen, Login-Daten, UI-Schritte, Chat-Erwartungen und robuste Locator-Strategien.
3. Agent erzeugt eine versionierte Playwright-Datei im Repo.
4. Tester führt den generierten Test manuell aus.

Konkretes Zielartefakt pro Testfall:

1. Neuer Ordner unter `e2e/cases/[testfallname]/`
2. `testfall.md` mit Beschreibung und Ausführungsprotokoll
3. `[testfallname].spec.ts` mit Playwright-Testcode
4. Optional: Nutzung von `e2e/shared/fixtures/` für wiederverwendbare Fixtures

---

## Phase 2: Quench-Evaluation

Nach dem MVP-Betrieb wird Quench anhand folgender Metriken bewertet:

| Metrik              | Frage                                                                     |
| ------------------- | ------------------------------------------------------------------------- |
| Wartbarkeit         | Wie aufwändig ist die Pflege von Quench-Batches vs. Markdown-Testfällen?  |
| Stabilität          | Schlagen Quench-Tests durch Foundry-Updates regelmäßig fehl?              |
| Report-Qualität     | Liefert Quench bessere PASS/FAIL-Nachweise als der Browser-Agent?         |
| Integrationsaufwand | Wie teuer ist die Quench-Installation und -Konfiguration in der Testwelt? |
| Komplement          | Können Quench und Browser-Agent parallel sinnvoll koexistieren?           |

Entscheidung durch das Team nach ≥ 3 abgeschlossenen MVP-Testläufen.
