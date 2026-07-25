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

## OpenSpec Workflow

This project uses **OpenSpec** for spec-driven development. All significant changes must go through the OpenSpec workflow.

### CLI

The `openspec` CLI (v1.5.0) manages changes, artifacts, and specs:

- `openspec list --json` — List active changes
- `openspec new change "<name>"` — Create a new change
- `openspec status --change "<name>" --json` — Show artifact status and dependencies
- `openspec instructions <artifact-id> --change "<name>" --json` — Get artifact creation instructions
- `openspec instructions apply --change "<name>" --json` — Get implementation instructions

### Workflow Phases

```
Explore ──▶ Propose ──▶ Apply ──▶ Archive
```

1. **Explore** — Think through the problem, investigate the codebase, clarify requirements. No implementation.
2. **Propose** — Create a change with artifacts: `proposal.md`, `design.md`, `specs/`, `tasks.md`.
3. **Apply** — Implement tasks from the `tasks.md` artifact. Test-first when applicable.
4. **Archive** — Move the completed change to `openspec/changes/archive/YYYY-MM-DD-<name>/` and sync delta specs.

### Artifact Structure

Each change in `openspec/changes/<name>/` contains:

| Artifact      | Purpose                                                  |
| ------------- | -------------------------------------------------------- |
| `proposal.md` | What & why (includes Testing Impact when applicable)     |
| `design.md`   | How (includes API Surface and Testing Strategy)          |
| `specs/`      | Delta specs with ADDED/MODIFIED/REMOVED/RENAMED sections |
| `tasks.md`    | Implementation steps with `- [ ]` / `- [x]` checkboxes   |

### Configuration

- Schema: `spec-driven` (defined in `openspec/config.yaml`)
- Changes: `openspec/changes/<name>/`
- Main specs: `openspec/specs/<capability>/spec.md`
- Archive: `openspec/changes/archive/`

### Spec-Driven Rules

Rules from `openspec/config.yaml` apply to all phases:

- Every proposal must list Foundry VTT API classes, Hooks, and utilities the change touches, with links to API docs
- Designs must include an API Surface section referencing Foundry API docs and `foundry.utils.*` helpers
- Tasks must include subtasks to verify against Foundry API docs (v14) and check the community wiki for helpers
- Compendium data changes must include "Run `npm run pack-all`" as a task
- Dedicated Unit Tests and E2E Tests task groups when the change requires testing

## Working Rules

1. **Consult the Foundry VTT API** (<https://foundryvtt.com/api/>) before making assumptions about Hooks, Documents, utilities, or rendering APIs.
2. **Run `npm install`** before any build or test operation.
3. **Run `npm run pack-all`** after modifying any `_source/` compendium data.
4. **Run `npm test`** to validate changes against the existing test suite.
5. **Run `npm run lint`** to ensure code style compliance.
6. **Never edit LevelDB files directly** — always modify `_source/` JSON files.
7. **Preserve German domain language** in UI labels, data identifiers, and user-facing text.
8. **Use English** for structural code (class names, file names, module systems).
9. **Follow the Foundry v14 API.** Confirm relevant classes, Hooks, settings, data fields, and method signatures in the official API documentation before implementation. Prefer documented Foundry APIs over custom browser or data-layer workarounds.
10. **Reuse Foundry helpers first.** Check `foundry.utils.*`, built-in document collection methods, and existing system helpers before introducing a new utility or manually manipulating document data.
11. **Keep presentation in templates.** Put rendered markup in feature-specific Handlebars (`.hbs`) templates and pass structured context from JavaScript. Use JavaScript for application state, event handling, and data preparation—not large inline HTML strings—unless Foundry requires dynamic HTML at runtime.
12. **Use the appropriate Foundry abstraction.** Prefer Documents and embedded-document APIs for persistent data, AppV2/Handlebars applications for UI, and documented Hooks for lifecycle integration.

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
