# Agent Documentation — Ilaris FoundryVTT System

This directory contains comprehensive, AI-tool-agnostic documentation for agents working on the Ilaris FoundryVTT system.

## Navigation

### Getting Started

- [AGENT_CONTEXT.md](AGENT_CONTEXT.md) — Project overview, entry points, key files, common tasks

### Domain Knowledge

- [GLOSSARY.md](GLOSSARY.md) — Foundry VTT + Ilaris domain terminology (≥20 terms)

### Architecture & Code

- [CODEBASE_ARCHITECTURE.md](CODEBASE_ARCHITECTURE.md) — Directory map, key files, design patterns
- [CODE_CONVENTIONS.md](CODE_CONVENTIONS.md) — Naming, style, and structural conventions (with code examples)
- [PATTERNS_AND_EXAMPLES.md](PATTERNS_AND_EXAMPLES.md) — Step-by-step implementation patterns

### Development

- [BUILD_AND_DEVELOPMENT.md](BUILD_AND_DEVELOPMENT.md) — npm scripts, local dev workflows, testing, debugging

### Orchestration

- [HANDOFFS_AND_STANDARDS.md](HANDOFFS_AND_STANDARDS.md) — Handoff contracts, output templates, QA checklists

## Related Documentation

### GitHub-Specific (Copilot)

| File                                              | Purpose                                                   |
| ------------------------------------------------- | --------------------------------------------------------- |
| `.github/copilot-instructions.md`                 | Repository-wide Copilot baseline instructions             |
| `.github/instructions/foundry-js.instructions.md` | JS/Foundry code conventions (scoped to `scripts/**/*.js`) |
| `.github/instructions/compendium.instructions.md` | Compendium data conventions (scoped to `comp_packs/**`)   |
| `.github/instructions/docs.instructions.md`       | Documentation conventions (scoped to `docs/**/*.md`)      |

### Agent Profiles

| File                                 | Role                              |
| ------------------------------------ | --------------------------------- |
| `.github/agents/planner.md`          | Task decomposition and planning   |
| `.github/agents/researcher.md`       | Context gathering and research    |
| `.github/agents/reviewer.md`         | Risk-based quality gate           |
| `.github/agents/setup-specialist.md` | Environment bootstrap and tooling |

### Agent Skills

| Directory                       | Purpose                            |
| ------------------------------- | ---------------------------------- |
| `.github/skills/planning/`      | Structured task decomposition      |
| `.github/skills/review/`        | Code review with gate decisions    |
| `.github/skills/foundry-setup/` | Environment setup and verification |

### Root-Level

| File              | Purpose                                          |
| ----------------- | ------------------------------------------------ |
| `AGENTS.md`       | Tool-agnostic orchestration rules and precedence |
| `CONTRIBUTING.md` | Human developer contribution guide               |

## Precedence Rules

Instruction precedence (highest to lowest):

1. `.github/instructions/*.instructions.md` — path-specific
2. `.github/copilot-instructions.md` — repository-wide baseline
3. `AGENTS.md` — tool-agnostic orchestration
4. This directory (`.agents/`) — detailed knowledge base
