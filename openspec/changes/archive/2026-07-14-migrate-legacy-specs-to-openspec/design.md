## Context

The Ilaris system currently has ~26 spec directories under `docs/_specs/` created between January and June 2026. These specs use inconsistent formats — some are single planning documents, some are multi-file structured inventories (e.g., `inventarisierung_datenmodell` with 12 files), and two are empty folders. Several specs are outdated relative to the code.

The OpenSpec structure at `openspec/` is initialized with `config.yaml` (schema: `spec-driven`) but `specs/` and `changes/` are empty. The goal is to migrate all knowledge into OpenSpec capability specs with **code as ground truth**, then delete `docs/_specs/`.

This is a **documentation-only change** — no application code is modified.

## Goals / Non-Goals

**Goals:**

- Create 11 capability specs in `openspec/specs/` that accurately reflect the current codebase
- Each capability spec includes a "Data Model" section (Option A: self-contained per capability)
- Create 1 OpenSpec change (`add-supernatural-pre-effects`) for the planned-but-unimplemented feature
- Delete `docs/_specs/` after all specs are created and verified
- Establish conventions for the OpenSpec spec format within this project

**Non-Goals:**

- Modifying any application code (JavaScript, Handlebars, CSS, compendium data)
- Creating a change for `active-effects-compendium-migration` (left as-is, deleted with old specs)
- Creating a comprehensive data model reference separate from capability specs (Option A, not Option B)
- Changing the OpenSpec schema or config.yaml

## Decisions

### Decision 1: Capability granularity — 11 specs

**Chosen**: 11 separate capability specs rather than fewer broader ones.

| Capability       | Scope                                             |
| ---------------- | ------------------------------------------------- |
| `active-effects` | Effect document, config UI, turn timing, DOT      |
| `combat`         | Combat dialogs, targeting, defense, damage, hooks |
| `dice`           | Roll dispatch, crit/fumble, skill checks          |
| `weapons`        | Weapon subsystem, processors, TP, eigenschaften   |
| `actor-sheets`   | Held, Kreatur, NSC sheets + data models           |
| `item-sheets`    | 22 item type sheets + data models                 |
| `settings`       | IlarisSettingsDialog, registered settings         |
| `importer`       | XML/Sephrasto import                              |
| `e2e-testing`    | Playwright infrastructure, test cases             |
| `release`        | Changelog, breaking changes                       |
| `architecture`   | File structure, build system, conventions         |

**Alternatives considered**:

- **Fewer broad specs** (e.g., `ui` covering all sheets + settings): Rejected — too coarse, loses clarity when working on a specific area.
- **More granular** (e.g., separate spec per dialog type): Rejected — excessive fragmentation, `combat` already covers 3 dialogs + targeting + damage as cohesive concerns.

**Rationale**: Combat and dice are separate because combat will grow (multiplayer, maneuvers, environment) while dice mechanics are stable. Cross-references between specs handle coupling (e.g., combat → dice for roll dispatch).

### Decision 2: Data model documentation — Option A

**Chosen**: Each capability spec includes a "Data Model" section listing its schema fields.

**Alternatives considered**:

- **Option B** (single `docs/data-model-reference.md`): Rejected — less convenient when working on a specific feature, higher risk of getting out of sync when only one capability changes.

**Rationale**: Since data models were already migrated from `template.json` into per-feature directories (`scripts/actors/data/`, `scripts/items/data/`, etc.), keeping their documentation with the corresponding capability spec is natural and maintainable.

### Decision 3: Spec format conventions

Each capability spec follows this structure:

```markdown
# <Capability Name>

## Overview

Brief description of what this capability covers and its place in the system.

## Requirements

### Requirement: <name>

The system SHALL/MUST ...

#### Scenario: <name>

- **WHEN** ...
- **THEN** ...

## Data Model

Key schema fields and their purposes. ...

## Cross-References

- [dice](../dice/spec.md) — Roll dispatch contract
- ...
```

### Decision 4: Migration workflow

```
For each of 11 capabilities:
  1. Read all relevant legacy specs from docs/_specs/
  2. Read all relevant source code from scripts/
  3. Write capability spec with code as ground truth
  4. Cross-reference other capability specs where there's coupling

After all 11 capability specs are created:
  1. Verify against openspec validate
  2. Delete docs/_specs/
  3. Create add-supernatural-pre-effects change
```

### Decision 5: Legacy spec disposition

| Legacy Spec                                                                                 | Disposition                                            |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Active effect turn timing, DOT, config                                                      | → `active-effects/spec.md`                             |
| Combat hooks, dialogs, HBS migration                                                        | → `combat/spec.md`                                     |
| Dice & preview, FertigkeitDialog hooks                                                      | → `dice/spec.md`                                       |
| Waffeneigenschaften (3 files)                                                               | → `weapons/spec.md`                                    |
| Actor CSS restructure                                                                       | → `actor-sheets/spec.md`                               |
| (No dedicated spec)                                                                         | → `item-sheets/spec.md`                                |
| Ilaris settings dialog                                                                      | → `settings/spec.md`                                   |
| Character import tutorial                                                                   | → `importer/spec.md`                                   |
| E2E halbautomatisch                                                                         | → `e2e-testing/spec.md`                                |
| Release dialog + improvement                                                                | → `release/spec.md`                                    |
| File structure, V13/V14 migration, agent instructions, variable refactoring, UI entkopplung | → `architecture/spec.md`                               |
| Inventarisierung datenmodell                                                                | → Distributed across all 11 specs' Data Model sections |
| Übernatürlich pre-effect                                                                    | → `openspec/changes/add-supernatural-pre-effects/`     |
| Active effects compendium migration                                                         | → Deleted (plan exists, not executing now)             |
| Empty folders (trefferabhängige ziel, angriff nach waffe)                                   | → Deleted                                              |

## Risks / Trade-offs

- **[Risk] Capability specs may miss edge cases** → Mitigation: Each spec lists its source code files; future developers can trace back to ground truth.
- **[Risk] Coupling between combat/dice/weapons may cause duplication** → Mitigation: Cross-reference section in each spec; DRY is less important than clarity per capability.
- **[Risk] Data model sections may drift from code** → Mitigation: Specs document the schema as it exists at migration time. Future changes go through the OpenSpec change workflow, which updates specs.
- **[Trade-off] 11 specs vs. fewer** → More maintenance overhead but better discoverability. Acceptable for a system of this size.

## Open Questions

None. All design decisions have been resolved through exploration with the user.
