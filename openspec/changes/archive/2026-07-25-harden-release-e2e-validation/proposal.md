## Why

Release reviewers still need to repeat broad manual checks because the E2E suite can leave mutable baseline state behind and its relationship to the existing release checklist is implicit. A full-suite-only failure that passes in isolation also weakens confidence in a green or red result.

## What Changes

- Keep the distributed E2E world at documented Foundry and Ilaris defaults; make shared fixtures explicitly apply and restore each non-default setting required by a case.
- Make shared E2E fixture cleanup explicit and reusable for mutable actor, chat, setting, scene, and application state used by release-critical cases.
- Strengthen affected E2E cases so their setup and teardown make a sequential full-suite result reproducible.
- Add a maintained mapping from the minor and major release checklist items to their automated E2E or unit-test coverage, and clearly mark the checks that remain manual.
- Document how a reviewer interprets focused versus full-suite validation results.
- **Non-goal:** add PR checks, CI gates, or a smoke-test tier.

## Capabilities

### New Capabilities

- `release-validation-traceability`: Traceable release checklist coverage and reviewer guidance for automated versus manual validation.

### Modified Capabilities

- `e2e-testing`: Sequential E2E cases must restore mutable shared baseline state so full-suite outcomes are reliable.
- `release`: Release checklists must identify their automated coverage and remaining manual checks.

## Impact

- Affected code: Playwright shared fixtures, stateful E2E cases, release documentation, and minor/major PR templates.
- Foundry VTT API: [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html), [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html), [ClientSettings](https://foundryvtt.com/api/v14/classes/foundry.helpers.ClientSettings.html), and scene/token document APIs as required by fixture cleanup. The implementation must verify exact methods and signatures before use.
- Foundry utilities: use documented document update/delete APIs and existing shared snapshot helpers before adding custom cloning or cleanup utilities.

### Testing Impact

- Unit: add tests for any extracted snapshot/restore or coverage-mapping parser helpers.
- E2E: harden stateful release cases, beginning with E2E-003; regression-verify existing E2E-001 through E2E-029 in the dedicated baseline world.
- Environment: the existing externally started E2E Foundry world, GM account, player account, active scene, and baseline compendiums remain required. Its configurable settings use defaults except for Foundry-maintained migration metadata; tests apply non-default preconditions themselves. Shared cleanup belongs in `e2e/shared/` when more than one case needs it.
