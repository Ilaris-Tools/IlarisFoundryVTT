## Context

The repository has a portable Foundry lifecycle helper and Playwright E2E infrastructure, but they do not require an agent to prove that a test followed the player-visible UI path or to keep a change-specific record of runtime evidence. This change adds workflow guidance, not a Foundry system feature.

## Goals / Non-Goals

**Goals:**

- Derive a durable runtime checklist from the active change's OpenSpec artifacts.
- Make UI-first Playwright verification, lifecycle hygiene, evidence, and failure cleanup explicit.
- Preserve manual tester feedback as recorded verification instead of silently treating it as automated proof.
- Invoke the same process from the OpenSpec apply workflow for relevant changes.

**Non-Goals:**

- Replace unit tests, normal E2E specs, or the existing Foundry lifecycle helper.
- Require runtime checks for documentation-only or pure internal refactors.
- Add a generic script that guesses how every game feature must be tested.

## Decisions

### Store a checklist in the change directory

The skill creates `openspec/changes/<change>/runtime-verification.md` before runtime validation. It keeps a requirement/task trace, environment, UI steps, expected result, evidence, cleanup, and outcome in the same reviewable unit as the change.

Alternative: keep only a static skill checklist. Rejected because it cannot demonstrate what a particular change actually tested.

### Use a template plus feature-specific derivation instead of a generator script

The skill ships a compact template and workflow references. The agent reads the active proposal, design, delta specs, and tasks, then fills only applicable checks. This preserves judgment for varied Foundry features while preventing static, irrelevant checklists.

Alternative: script the derivation. Rejected because OpenSpec language and Foundry user flows are intentionally varied; a parser would produce shallow or misleading checks.

### Require the player path before internal inspection

The primary assertion must use visible Playwright interaction. `page.evaluate` remains available only for isolated fixture setup, state inspection, cleanup, or a documented low-level edge case that cannot be reached through the UI. The checklist records the exception and its reason.

### Keep runtime verification separate from API research

The skill requires agents to consult the official Foundry v14 API documentation before depending on a Foundry API, and the community wiki before adding custom utility behavior. It does not prescribe particular API classes because they vary by change.

## API Surface

- Foundry classes: none are extended or called by this workflow change.
- Hook events: none are listened to or triggered.
- `foundry.utils.*`: none are used.
- Runtime checks that interact with Foundry APIs must identify the exact documented API in their own OpenSpec change and verify it against the [Foundry VTT v14 API](https://foundryvtt.com/api/v14/) and relevant [community wiki guidance](https://foundryvtt.wiki/en/development/api).

## Risks / Trade-offs

- [A checklist becomes generic boilerplate] → Require traceability to the current change's scenarios/tasks and omit inapplicable sections.
- [UI automation is slower than direct evaluation] → Keep setup/inspection/cleanup narrow and run only feature-relevant cases.
- [Manual verification lacks artifacts] → Record tester identity/source, exact behavior checked, and any unverified boundaries.
- [Stateful Foundry checks pollute the shared world] → Require idempotent setup and teardown, including on failure or termination.

## Migration Plan

1. Add the repository-local skill and references.
2. Update the apply skill to invoke it for Foundry-facing changes.
3. Future qualifying changes create their own runtime-verification artifact; existing completed changes are not retroactively rewritten.

Rollback is deletion of the new skill and the one integration paragraph; no world data or Foundry configuration changes are involved.

## Testing Strategy

- Structurally validate the generated skill with `quick_validate.py`.
- Review the checklist template against a previously implemented region/zone change to ensure it captures UI placement, document state, effect state, expiry, cleanup, and user confirmation.
- No production code changes require unit tests or a new Playwright case; future changes will use this workflow to select their own E2E coverage.

## Open Questions

None.
