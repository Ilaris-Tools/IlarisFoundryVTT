# Tasks zur Umsetzung von `agent_instructions_plan.md`

Quelle: [agent_instructions_plan.md](./agent_instructions_plan.md)

Ziel: Den Plan in konkrete, überprüfbare Arbeitspakete überführen und dabei die referenzierten Best Practices (GitHub Custom Agents, Skills, Instructions Layering) direkt in den Tasks verankern.

---

## 0) Arbeitsmodus & Qualitätskriterien

- [ ] **T0.1 — Single Source of Truth festlegen**
    - Plan als führende Spezifikation behandeln: [agent_instructions_plan.md](./agent_instructions_plan.md)
    - Bei Konflikten: Reihenfolge **Plan-Refinement > ursprüngliche Planphasen** dokumentieren.
    - **DoD:** Kurze Notiz im PR/Commit-Text: „Konfliktauflösung gemäß Plan-Refinement“.

- [ ] **T0.2 — Abnahme-Matrix vorbereiten**
    - Acceptance-Kriterien aus Plan in Checkliste übertragen (`PASS`, `PASS_WITH_NOTES`, `BLOCK`, Rollen-Trennung, Skills nutzbar).
    - **DoD:** Eine Abnahme-Tabelle liegt in der neuen Doku vor (oder im PR-Template).

**Best-Practice-Referenzen:**

- GitHub: Custom instructions support matrix  
  https://docs.github.com/en/copilot/reference/custom-instructions-support
- GitHub: About custom agents  
  https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-custom-agents

---

## 1) Control Plane aufbauen (Instructions & Precedence)

- [ ] **T1.1 — Repository-Baseline anlegen**
    - Datei: `.github/copilot-instructions.md`
    - Inhalt: stabile, kurze, nicht task-spezifische Repo-Regeln.
    - **DoD:** Baseline-Datei vorhanden, keine widersprüchlichen Regeln zu anderen Instruktionen.

- [ ] **T1.2 — Path-spezifische Instruktionen erstellen**
    - Dateien:
        - `.github/instructions/foundry-js.instructions.md` (`applyTo: "scripts/**/*.js"`)
        - `.github/instructions/compendium.instructions.md` (`applyTo` für `comp_packs/**` und `_source/**`)
        - `.github/instructions/docs.instructions.md` (`applyTo: "docs/**/*.md"`)
    - **DoD:** Frontmatter + klarer Scope vorhanden; keine Scope-Überlappung ohne Prioritätsregel.

- [ ] **T1.3 — Multi-Tool-Kompatibilität ergänzen**
    - Datei: `AGENTS.md` im Repo-Root.
    - Inhalt: tool-agnostische Arbeitsregeln + Handoff-Vertrag.
    - **DoD:** Enthält explizit Orchestrator-Fluss (Planner → Specialist → Reviewer).

- [ ] **T1.4 — Präzedenzregeln dokumentieren**
    - In genau **einer** Datei die Konflikt-/Precedence-Regeln dokumentieren.
    - **DoD:** Verweis von allen relevanten Dateien auf diese zentrale Stelle.

**Best-Practice-Referenzen:**

- GitHub: Using custom instructions (Tutorial)  
  https://docs.github.com/en/copilot/tutorials/use-custom-instructions
- GitHub: Custom instructions support matrix  
  https://docs.github.com/en/copilot/reference/custom-instructions-support

---

## 2) Agent-Profile definieren (rollenrein + output contracts)

- [ ] **T2.1 — `planner.md` erstellen**
    - Datei: `.github/agents/planner.md`
    - Muss enthalten: Ziel, Grenzen, Pflichtausgabe (Objective, Assumptions, Steps, Validation, Delegation).
    - **DoD:** Ausgabe ist deterministisch und schablonenbasiert.

- [ ] **T2.2 — `researcher.md` erstellen**
    - Datei: `.github/agents/researcher.md`
    - Muss enthalten: Recherchefokus, Quellenpriorität, kein Implementieren ohne Auftrag.
    - **DoD:** Standardisiertes Research-Report-Format vorhanden.

- [ ] **T2.3 — `reviewer.md` erstellen**
    - Datei: `.github/agents/reviewer.md`
    - Muss enthalten: risikobasierte Prüfung + Gate-Entscheidung `PASS|PASS_WITH_NOTES|BLOCK`.
    - **DoD:** Gate-Regeln eindeutig, reproduzierbar und testbar.

- [ ] **T2.4 — `setup-specialist.md` erstellen**
    - Datei: `.github/agents/setup-specialist.md`
    - Muss enthalten: Environment-Erkennung, Bootstrap-Sequenz, Recovery, Verify-Output.
    - **DoD:** Klare Setup-Runbooks und Ergebnisformat definiert.

**Best-Practice-Referenzen:**

- GitHub: About custom agents  
  https://docs.github.com/en/copilot/concepts/agents/coding-agent/about-custom-agents
- Awesome Copilot (Agent patterns)  
  https://github.com/github/awesome-copilot

---

## 3) Skills als wiederverwendbare Bausteine

- [ ] **T3.1 — Skill `planning/` anlegen**
    - Pfad: `.github/skills/planning/`
    - Mindestinhalt: `SKILL.md` mit Frontmatter (`name`, `description`) + Schrittfolge.
    - **DoD:** Skill ohne Reprompting für Standard-Planungsfälle nutzbar.

- [ ] **T3.2 — Skill `review/` anlegen**
    - Pfad: `.github/skills/review/`
    - Mindestinhalt: Review-Checkliste + Gate-Entscheidungslogik.
    - **DoD:** Skill produziert konsistente Verdicts über mehrere Runs.

- [ ] **T3.3 — Skill `foundry-setup/` anlegen**
    - Pfad: `.github/skills/foundry-setup/`
    - Mindestinhalt: Foundry-Setup-Schritte, Fehlerpfade, Verifikation.
    - **DoD:** Setup-Prozess ist als reproduzierbarer Ablauf dokumentiert.

- [ ] **T3.4 — Optionale Skill-Assets ergänzen**
    - Optional: `scripts/`, `references/`, `assets/` je Skill.
    - **DoD:** Nur hinzufügen, wenn direkt im Skill referenziert und genutzt.

**Best-Practice-Referenzen:**

- GitHub: About agent skills  
  https://docs.github.com/en/copilot/concepts/agents/about-agent-skills
- Agent Skills Spec  
  https://agentskills.io/specification
- Agent Skills Repo  
  https://github.com/agentskills/agentskills
- Skill-Beispiele  
  https://github.com/anthropics/skills

---

## 4) Allgemeine Agent-Doku (.agents) erstellen/aktualisieren

- [ ] **T4.1 — `.agents/README.md` erstellen**
    - Überblick über alle agentenrelevanten Dokumente + Navigationspfade.
    - **DoD:** Einstiegsdoku vollständig und verlinkt.

- [ ] **T4.2 — `.agents/AGENT_CONTEXT.md` erstellen**
    - Projektüberblick, Einstieg, Key-Files, Common Tasks.
    - **DoD:** Enthält konkrete Pfade (`scripts/`, `styles/`, `comp_packs/`, `system.json`, `template.json`).

- [ ] **T4.3 — `.agents/GLOSSARY.md` erstellen**
    - ≥20 Begriffe aus Foundry + Ilaris-Domain.
    - **DoD:** Begriffe sind kurz definiert und konsistent benannt.

- [ ] **T4.4 — `.agents/CODEBASE_ARCHITECTURE.md` erstellen**
    - Directory-Map, Schlüsseldateien, Hook-/Sheet-/Migration-Patterns.
    - **DoD:** Referenziert reale Pfade und Implementierungsorte.

- [ ] **T4.5 — `.agents/CODE_CONVENTIONS.md` erstellen**
    - Basierend auf realen Codebeispielen (mind. 3).
    - **DoD:** Benennungs-, Struktur- und Kommentar-Konventionen dokumentiert.

- [ ] **T4.6 — `.agents/PATTERNS_AND_EXAMPLES.md` erstellen**
    - Neue Actor-Typen, Sheets, Hooks, Compendium-Flow.
    - **DoD:** Schritt-für-Schritt mit konkreten Dateireferenzen.

- [ ] **T4.7 — `.agents/BUILD_AND_DEVELOPMENT.md` erstellen**
    - npm-Skripte, lokale Dev-Workflows, Tests/Debug.
    - **DoD:** Build-/Testpfade mit vorhandenen Tooling-Dateien abgestimmt.

**Best-Practice-Referenzen:**

- Planabschnitt „Comprehensive Coverage“ in [agent_instructions_plan.md](./agent_instructions_plan.md)

---

## 5) Integration in bestehende Repo-Dokumente

- [ ] **T5.1 — `AGENT_INSTRUCTIONS.md` verschlanken**
    - Als Router auf neue Struktur (`.agents/README.md`, `.github/...`) umbauen.
    - **DoD:** Keine redundante Doppelpflege.

- [ ] **T5.2 — `CONTRIBUTING.md` erweitern**
    - Abschnitt „For Developers Using AI Agents“ ergänzen.
    - **DoD:** Enthält Setup, Grenzen, Review-Hinweise für Agent-Einsatz.

- [ ] **T5.3 — Agent-Callouts in Doku ergänzen**
    - Zielorte: `docs/foundry-basics.md`, ggf. `docs/develop/tools.md`.
    - **DoD:** Kurze „For AI Agents“-Callouts mit Verweisen auf zentrale Agent-Doku.

**Best-Practice-Referenzen:**

- GitHub: Using custom instructions tutorial  
  https://docs.github.com/en/copilot/tutorials/use-custom-instructions

---

## 6) Orchestrator-Handoffs & Output-Standards

- [ ] **T6.1 — Handoff-Verträge dokumentieren**
    - Für Übergaben Planner → Specialist → Reviewer:
        - erwartete Inputs
        - erzeugte Artefakte
        - Rückgabeformat an Orchestrator
    - **DoD:** Jede Rolle hat ein verbindliches Übergabeformat.

- [ ] **T6.2 — Output-Templates standardisieren**
    - Templates für Research Report, Implementation Plan, Final Review Verdict.
    - **DoD:** Einheitliche Struktur über alle Rollen.

- [ ] **T6.3 — QA-Checkliste für Agent-Definitionen**
    - Kriterien: klarer Scope, minimale Tools, eindeutige Instruktionen, testbarer Erfolg.
    - **DoD:** Checkliste liegt als wiederverwendbares Artefakt vor.

**Best-Practice-Referenzen:**

- Awesome Copilot orchestration examples  
  https://github.com/github/awesome-copilot

---

## 7) Validierung & Evaluation

- [ ] **T7.1 — Struktur-Checks ausführen**
    - Dateien/Links/Vollständigkeit validieren (inkl. Cross-Link-Test).
    - **DoD:** Keine toten Links, alle Pflichtdateien vorhanden.

- [ ] **T7.2 — Agent-Prompts pro Rolle testen (mind. 3 je Agent)**
    - Prüfen: Rollenreinheit, Handoff-Qualität, Artefakt-Vollständigkeit.
    - **DoD:** Testprotokoll mit Ergebnissen und Abweichungen vorhanden.

- [ ] **T7.3 — Reviewer-Gate-Konsistenz prüfen**
    - Mehrfachläufe auf gleichartige Fälle; Entscheidungskonsistenz messen.
    - **DoD:** Nachweis über konsistente `PASS|PASS_WITH_NOTES|BLOCK`-Ausgaben.

- [ ] **T7.4 — Abschlussbewertung gegen Acceptance Criteria**
    - Finale Prüfung gegen Refinement-Kriterien aus Plan.
    - **DoD:** Abschlussstatus je Kriterium dokumentiert.

**Best-Practice-Referenzen:**

- Planabschnitt „Acceptance Criteria (refined)“ in [agent_instructions_plan.md](./agent_instructions_plan.md)

---

## Empfohlene Ausführungsreihenfolge

1. **T1 → T2 → T6** (Control Plane, Rollen, Handoffs)
2. **T3** (Skills MVP)
3. **T4 + T5** (allgemeine Doku + Integration)
4. **T7** (Validierung)

---

## Traceability (Plan → Tasks)

- **Phase A (Control Plane)** → T1.x
- **Phase B (Dedicated Agents)** → T2.x
- **Phase C (Templates)** → T6.x
- **Mandatory Additions A-F** → T2.x, T6.x, T3.x, T1.x, T6.2/T6.3, T7.x
- **Original Phases 1–5** → T4.x, T5.x, T7.x
