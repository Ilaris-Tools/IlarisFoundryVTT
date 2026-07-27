## 1. Audit and API verification

- [x] 1.1 Inventory mutable state and implicit non-default setting dependencies in release-critical E2E cases; map each minor and major release checklist item to existing automated coverage or an explicit manual check.
- [x] 1.2 Verify the Foundry VTT v14 `Actor`, `ChatMessage`, `ClientSettings`, `Scene`, and `TokenDocument` APIs before selecting snapshot and restore operations.
- [x] 1.3 Check the Foundry community wiki and existing project helpers for document cleanup, cloning, and test-fixture utilities before adding a custom helper.

## 2. Shared E2E isolation

- [x] 2.1 Extend the shared E2E fixtures with opt-in snapshot, restoration, and teardown helpers for each audited mutable resource type that is used by more than one case, including declared non-default setting preconditions.
- [x] 2.2 Refactor E2E-003 and any other audited stateful cases to use the shared helpers and to leave their baseline state unchanged.
- [x] 2.3 Ensure temporary applications and documents created by an affected case are closed or deleted through documented Foundry APIs.
- [ ] 2.4 Reset the published world archive to documented setting defaults (excluding migration metadata) and update its revision, checksum, and baseline manifest.

## 3. Unit Tests

- [x] 3.1 Add Jest coverage for any new pure snapshot-normalization or release-coverage mapping helper, following the repository's colocated `_spec/` convention. (No new pure helper was extracted; the setting fixture is browser-runtime integration code covered by E2E.)
- [x] 3.2 Run the affected Jest suites and `npm test`.

## 4. E2E Tests

- [x] 4.1 Add or strengthen an E2E regression that proves E2E-003's required baseline state is restored after a prior mutating case.
- [ ] 4.2 Run affected cases in isolation and in their serial full-suite order using the dedicated E2E Foundry world.
- [ ] 4.3 Run the full E2E suite and record any failure that remains reproducible after baseline restoration.

## 5. Release validation traceability

- [x] 5.1 Annotate the existing minor and major release checklists and release documentation with the covered test ID/path or an explicit manual-check reason.
- [x] 5.2 Document how reviewers should interpret focused and full-suite validation results, including how to report order-dependent failures.
- [x] 5.3 Verify each automated-coverage annotation references an existing test and each uncovered checklist item is intentionally marked manual.

## 6. Final validation

- [x] 6.1 Run `npm install`, then lint the changed files without applying unrelated auto-fixes.
- [x] 6.2 Run `openspec validate harden-release-e2e-validation --strict`.
- [x] 6.3 Confirm the change adds no PR gate, CI job, smoke-test tier, or Foundry launcher behavior.
