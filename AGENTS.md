# AGENTS.md — Ilaris FoundryVTT System

This file provides tool-agnostic working rules for any AI agent operating on this repository, including GitHub Copilot, Claude, and other LLM-based tools.

## Orchestrator Model

This project uses an **orchestrator-based** agent workflow with three core roles:

### Planner

- Decomposes user intent into executable task graphs.
- Produces: scoped objective, assumptions, step sequence, validation plan, delegation map.
- **Never implements code directly.**

### Specialist (Executor)

- Receives a scoped task from the Planner.
- Locates context → implements minimal change → validates → reports back.
- Types: code specialist, compendium specialist, setup specialist.

### Reviewer

- Final quality gate before completion.
- Risk-based evaluation: correctness, regression risk, missing tests, doc updates.
- Gate decision: `PASS`, `PASS_WITH_NOTES`, or `BLOCK`.
- **Only blocks on high-confidence functional/security/regression risk.**

## Handoff Contract

Every handoff between roles must include:

| Field        | Description                                 |
| ------------ | ------------------------------------------- |
| `objective`  | What needs to be accomplished               |
| `context`    | Relevant files, prior findings, constraints |
| `artifacts`  | Files created or modified, with paths       |
| `validation` | How to verify the work is correct           |
| `status`     | `completed`, `blocked`, `needs-review`      |

## Working Rules

1. **Consult the Foundry VTT API** (<https://foundryvtt.com/api/>) before making assumptions about Hooks, Documents, utilities, or rendering APIs.
2. **Run `npm install`** before any build or test operation.
3. **Run `npm run pack-all`** after modifying any `_source/` compendium data.
4. **Run `npm test`** to validate changes against the existing test suite.
5. **Run `npm run lint`** to ensure code style compliance.
6. **Never edit LevelDB files directly** — always modify `_source/` JSON files.
7. **Preserve German domain language** in UI labels, data identifiers, and user-facing text.
8. **Use English** for structural code (class names, file names, module systems).

## Precedence

Instruction precedence (highest to lowest):

1. `.github/instructions/*.instructions.md` — path-specific, scoped by `applyTo`
2. `.github/copilot-instructions.md` — repository-wide baseline
3. This file (`AGENTS.md`) — tool-agnostic orchestration rules
4. `.agents/` documentation — detailed project knowledge base

In case of conflict, higher-precedence rules win. This precedence is documented in exactly one place: `.github/copilot-instructions.md`.

## Key Documentation

| Document                           | Purpose                                    |
| ---------------------------------- | ------------------------------------------ |
| `.agents/README.md`                | Navigation hub for all agent documentation |
| `.agents/AGENT_CONTEXT.md`         | Project overview and getting started       |
| `.agents/GLOSSARY.md`              | Foundry VTT + Ilaris domain terminology    |
| `.agents/CODEBASE_ARCHITECTURE.md` | Directory map, key files, design patterns  |
| `.agents/CODE_CONVENTIONS.md`      | Naming, style, and structural conventions  |
| `.agents/PATTERNS_AND_EXAMPLES.md` | Step-by-step implementation patterns       |
| `.agents/BUILD_AND_DEVELOPMENT.md` | npm scripts, dev workflows, testing        |
