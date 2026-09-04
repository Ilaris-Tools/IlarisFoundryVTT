# foundry-runtime-verification Specification

## Purpose

Canonical requirements synchronized from completed OpenSpec changes.

## Requirements

### Requirement: Runtime verification is derived from the active OpenSpec change

For each Foundry-facing change, the workflow SHALL read the active change's proposal, design, delta specs, and tasks before runtime validation and SHALL create or update `runtime-verification.md` in that change directory. The artifact SHALL trace every runtime case to one or more requirement scenarios or implementation tasks.

#### Scenario: Change-specific checklist is created

- **WHEN** an agent begins runtime validation for a Foundry-facing OpenSpec change
- **THEN** it SHALL create a checklist containing only applicable setup, player-visible behavior, expected results, evidence, cleanup, and unverified boundaries for that change

#### Scenario: Documentation-only change does not receive a forced runtime checklist

- **WHEN** a change has no Foundry runtime, UI, compendium, data-lifecycle, or settings behavior
- **THEN** the workflow SHALL record why runtime verification is not applicable and SHALL NOT create irrelevant runtime cases

### Requirement: Primary runtime checks use the visible player path

Runtime verification SHALL exercise the primary player-facing flow with Playwright-visible interaction before inspecting internal state. `page.evaluate` SHALL NOT substitute for the central user action or user-visible assertion; it MAY be used only for isolated fixture setup, inspection, cleanup, or a documented low-level edge case unavailable through the UI.

#### Scenario: Dialog behavior is verified through the UI

- **WHEN** a change affects a dialog, sheet, combat flow, or map interaction
- **THEN** the checklist SHALL identify the visible controls and expected UI result, and the Playwright check SHALL use those controls for the primary flow

#### Scenario: Evaluation exception is recorded

- **WHEN** a runtime check uses `page.evaluate` outside fixture setup, inspection, or cleanup
- **THEN** the checklist SHALL name the unavailable UI path, explain why it is unavoidable, and retain a UI-driven assertion for the player-visible outcome

### Requirement: Runtime evidence preserves isolation and diagnostics

Every runtime case SHALL state its world/settings/fixture prerequisites, capture the observed result, inspect relevant chat, map, document, or Active Effect state, and restore state idempotently on success, failure, or termination. Unexpected browser console errors or warnings SHALL block a pass until investigated or explicitly documented as an accepted upstream compatibility issue.

#### Scenario: Stateful zone or effect behavior is checked

- **WHEN** a change affects Regions, zone placement, Active Effects, durations, tokens, or other persistent Foundry state
- **THEN** the checklist SHALL include creation, primary behavior, relevant state transitions, reload or expiry where applicable, and cleanup without affecting unrelated documents

#### Scenario: Manual confirmation is recorded accurately

- **WHEN** a user manually verifies a runtime behavior
- **THEN** the checklist SHALL record the exact verified behavior as user-confirmed and SHALL identify any remaining automated or unverified boundaries
