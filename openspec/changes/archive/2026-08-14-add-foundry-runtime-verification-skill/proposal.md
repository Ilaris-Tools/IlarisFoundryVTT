## Why

Passing unit and E2E tests has not consistently demonstrated the actual Foundry player flow: tests can manipulate data through `page.evaluate`, miss visual controls, or leave runtime state behind. Agents need a repeatable way to turn each OpenSpec change into a focused runtime checklist before declaring a Foundry-facing change complete.

## What Changes

- Add a repository-local `foundry-runtime-verification` skill that derives, executes, and records change-specific runtime verification from an OpenSpec change's proposal, design, specs, and tasks.
- Require UI-driven Playwright coverage of the primary player flow, with constrained, documented use of `page.evaluate` only for fixture setup, inspection, cleanup, or an unavoidable low-level edge case.
- Add a durable `runtime-verification.md` artifact in the active change directory, with traceability to requirements and tasks, evidence, cleanup checks, and manual user confirmation.
- Integrate the skill into `openspec-apply-change` so Foundry-facing changes invoke it during validation.
- This is purely additive to workflow guidance; it does not alter Foundry system runtime behavior.

## Capabilities

### New Capabilities

- `foundry-runtime-verification`: Change-specific runtime validation and evidence recording for OpenSpec changes that affect Foundry behavior.

### Modified Capabilities

- `openspec-testing-integration`: Apply-time testing guidance gains mandatory runtime-checklist derivation for relevant Foundry-facing changes.

## Impact

- Adds `.codex/skills/foundry-runtime-verification/` with the skill, OpenAI metadata, and a reusable checklist template/reference.
- Updates `.codex/skills/openspec-apply-change/SKILL.md` to invoke the new skill during applicable validation.
- Adds a development-workflow spec; no Foundry document classes, Hooks, or `foundry.utils.*` helpers are called or modified. The skill requires consulting the official [Foundry VTT v14 API documentation](https://foundryvtt.com/api/v14/) before a runtime check relies on a Foundry API.

## Testing Impact

- No Foundry unit or Playwright E2E case is introduced: this change supplies the workflow that future changes use to create and run those checks.
- Validate the new skill structurally with `quick_validate.py`, review that its checklist maps requirements to real UI paths and cleanup, and confirm the OpenSpec apply skill delegates to it for Foundry-facing changes.
