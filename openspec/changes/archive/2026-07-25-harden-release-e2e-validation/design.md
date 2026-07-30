## Context

The serial Playwright suite shares one mutable Foundry world. Existing actor snapshots cover some cases, but cleanup is not consistently applied to chat, client/world settings, scenes, open applications, or temporary documents. The distributed world also contains configuration that cases implicitly rely on. The release PR templates list broad manual checks without stating which current automated tests already prove them.

## Goals / Non-Goals

**Goals:**

- Make stateful E2E cases independent enough that a full serial run has a clear result.
- Reuse shared fixtures for snapshot, restoration, and teardown rather than duplicating cleanup in cases.
- Give release reviewers a concise mapping from checklist item to automated coverage or remaining manual verification.

**Non-Goals:**

- Add PR gates, CI jobs, a smoke suite, parallel E2E execution, or an automatically managed Foundry server.
- Change Ilaris game rules or production UI behavior.

## Decisions

- Extend `e2e/shared/fixtures/` with narrowly scoped helpers for each mutable resource type needed by more than one test. Cases explicitly opt into snapshots, so cleanup stays understandable.
- Treat the published world as a defaults-only baseline. A case that requires a non-default setting declares it through a setting fixture; the fixture snapshots the current value, sets the required value before the assertion, and restores it in teardown. Foundry migration metadata is excluded because it is system-maintained and deliberately exercised by migration tests.
- Prefer Foundry document APIs to direct source mutation: `Actor.update`, embedded-document operations, `ChatMessage.deleteDocuments`, `game.settings.get/set`, and documented scene/token APIs. Verify exact v14 signatures before implementation.
- Make E2E-003 the first full-suite reliability target because it has demonstrated an order-dependent failure; extend isolation to other cases only where the audit identifies shared mutation.
- Add checklist coverage annotations to the existing release documentation and PR templates. An annotation names a test ID/path or declares the item manual with a short reason. This is documentation traceability, not a CI gate.

## API Surface

- [Actor](https://foundryvtt.com/api/v14/classes/foundry.documents.Actor.html): update and embedded-document cleanup for actor snapshots.
- [ChatMessage](https://foundryvtt.com/api/v14/classes/foundry.documents.ChatMessage.html): delete temporary chat messages.
- [ClientSettings](https://foundryvtt.com/api/v14/classes/foundry.helpers.ClientSettings.html): read and restore test-modified settings through `game.settings`.
- [Scene](https://foundryvtt.com/api/v14/classes/foundry.documents.Scene.html) and [TokenDocument](https://foundryvtt.com/api/v14/classes/foundry.documents.TokenDocument.html): only if the audit finds scene/token state not already restored by an owning test.
- Hooks: none are planned. Any hook added during implementation must be documented with its verified v14 signature.
- Utilities: use existing fixture cloning and Foundry document methods first; evaluate `foundry.utils.deepClone` only if it is available and appropriate in the runtime under test.

## Testing Strategy

- Unit-test any new pure mapping parser or snapshot-normalization helper in a colocated `_spec/` directory using existing Jest patterns.
- E2E-test a deliberately stateful case by running it after a prior mutating case and asserting the fixture restores its precondition; include settings such as target selection where a case needs a non-default value. Regression-run E2E-003 in isolation and within the full suite.
- Verify release-template annotations against the actual E2E/Unit test IDs and retain manual checks for browser diversity, module compatibility, and human usability judgement.

## Risks / Trade-offs

- [Risk] broad snapshots hide test intent or slow every case → Mitigation: helpers are opt-in and scoped to the resource each case mutates.
- [Risk] restoring world settings interferes with a concurrently open manual session → Mitigation: retain the dedicated E2E-world requirement and restore only settings explicitly changed by the test.
- [Risk] an older archive retains a non-default setting → Mitigation: document the exact world-reset values and make affected tests set their own values, so an archive refresh is mechanical rather than behavioral.
- [Risk] checklist annotations become stale → Mitigation: include a validation task that checks every annotation points to an existing test or is explicitly marked manual.
