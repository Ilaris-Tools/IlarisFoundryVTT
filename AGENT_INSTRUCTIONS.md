# Agent Instructions — Ilaris FoundryVTT System

> **Wichtigste Regel**: Für alle Foundry VTT API-Fragen **immer zuerst** die offizielle Doku konsultieren: <https://foundryvtt.com/api/> — Niemals raten!

## Dokumentationsstruktur

Die vollständige Agent-Dokumentation ist auf mehrere Dateien aufgeteilt:

| Dokument                                                               | Zweck                                                 |
| ---------------------------------------------------------------------- | ----------------------------------------------------- |
| [`.agents/README.md`](.agents/README.md)                               | **Einstiegspunkt** — Navigation aller Agent-Dokumente |
| [`.agents/AGENT_CONTEXT.md`](.agents/AGENT_CONTEXT.md)                 | Projektüberblick, Key Files, Common Tasks             |
| [`.agents/GLOSSARY.md`](.agents/GLOSSARY.md)                           | Foundry VTT + Ilaris Fachbegriffe                     |
| [`.agents/CODEBASE_ARCHITECTURE.md`](.agents/CODEBASE_ARCHITECTURE.md) | Verzeichnisstruktur, Schlüsseldateien, Patterns       |
| [`.agents/CODE_CONVENTIONS.md`](.agents/CODE_CONVENTIONS.md)           | Code-Stil, Namenskonventionen, Beispiele              |
| [`.agents/PATTERNS_AND_EXAMPLES.md`](.agents/PATTERNS_AND_EXAMPLES.md) | Step-by-Step Implementierungsmuster                   |
| [`.agents/BUILD_AND_DEVELOPMENT.md`](.agents/BUILD_AND_DEVELOPMENT.md) | npm Scripts, Entwicklungs-Workflows, Tests            |
| [`AGENTS.md`](AGENTS.md)                                               | Tool-agnostische Orchestrierungsregeln                |

### GitHub Copilot spezifisch

| Dokument                                 | Zweck                                                      |
| ---------------------------------------- | ---------------------------------------------------------- |
| `.github/copilot-instructions.md`        | Repository-weite Baseline-Instruktionen                    |
| `.github/instructions/*.instructions.md` | Pfad-spezifische Instruktionen (JS, Compendium, Docs)      |
| `.github/agents/`                        | Agent-Profile (Planner, Researcher, Reviewer, Setup)       |
| `.github/skills/`                        | Wiederverwendbare Skills (Planning, Review, Foundry-Setup) |

### Verbindliche Agent-Profil-Zuordnung

Für Delegation an Subagents ist `.github/agents/` die kanonische Quelle.

- `Planner` -> `.github/agents/planner.md`
- `Researcher` -> `.github/agents/researcher.md`
- `Reviewer` -> `.github/agents/reviewer.md`
- `Setup Specialist` -> `.github/agents/setup-specialist.md`

Pflichtregeln:

1. Vor jeder Delegation das zugeordnete Agent-Profil konsultieren.
2. `name` und `description` aus der YAML-Frontmatter als kanonische Identitaet verwenden.
3. Keine Rollenverantwortungen erfinden, die nicht im Profil stehen.
4. Falls ein Profil fehlt, auf `AGENTS.md` zurueckfallen und den Fallback explizit nennen.

## Instrukions-Rangfolge

1. **Pfad-spezifisch** (`.github/instructions/`) — höchste Priorität
2. **Repository-weit** (`.github/copilot-instructions.md`)
3. **Tool-agnostisch** (`AGENTS.md`)
4. **Wissensbasis** (`.agents/`)
