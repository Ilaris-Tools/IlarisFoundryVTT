## 1. Runtime contract and API research

- [x] 1.1 Verify the Foundry VTT v14 server startup/configuration boundary against the official API documentation and record that no Foundry client class, Hook, or Document API is used by the cloud bootstrap.
- [x] 1.2 Check foundryvtt.wiki for relevant `foundry.utils.*` helpers and record why no client utility applies to process provisioning.
- [x] 1.3 Inventory `utils/foundry-env/remote-lifecycle.mjs`, `runtime.js`, and the Claude adapter; define the reusable orchestration seam without changing local lifecycle or `npm run test:e2e` behavior.

## 2. Unit Tests

- [x] 2.1 Extend `utils/foundry-env/_spec/runtime.test.js` with failing coverage for environment-only credential validation, run-id home/port derivation, and unsafe-home rejection.
- [x] 2.2 Add a focused `utils/foundry-env/_spec/cloud-bootstrap.test.js` covering dependency/start/test command ordering, credential-free soft skip, child environment construction, and owned-process cleanup after success or failure.
- [x] 2.3 Update `scripts/testing/_spec/e2e-runtime.test.js` only as needed to prove the ordinary runner remains external-server-only when the cloud bootstrap exists.

## 3. Disposable cloud-VM bootstrap

- [x] 3.1 Add a provider-neutral Node.js cloud bootstrap command under `utils/foundry-env/` that accepts selected E2E paths and delegates provisioning/start/stop to the existing remote lifecycle core.
- [x] 3.2 Implement environment-only credential resolution for the cloud command; do not read `FOUNDRY_SECRETS_FILE` or a developer-home secrets file, and preserve secret-safe output.
- [x] 3.3 Implement deterministic per-run managed-home and port isolation, including validation that cleanup cannot remove an arbitrary caller-owned directory or process.
- [x] 3.4 Implement `finally` cleanup that retains `test-results/` while stopping only the recorded Foundry process after success, a failed Playwright run, or an orchestration error.
- [x] 3.5 Add the explicit package script without modifying the external-server-only semantics of `npm run test:e2e`.

## 4. Provider adapters and documentation

- [x] 4.1 Update `.claude/hooks/foundry-env.mjs` to invoke the shared cloud bootstrap only when required process-environment credentials are present; preserve its credential-free skip.
- [x] 4.2 Document the cloud-VM command, injected environment variables, Linux prerequisites, run isolation, artifact retention, and cleanup in `utils/foundry-env/README.md` and `docs/develop/e2e-testing.md`.
- [x] 4.3 Update agent instructions to distinguish Fable's local lifecycle from the disposable cloud-VM bootstrap used by web/mobile agents.

## 5. E2E Tests

- [x] 5.1 Add a command-level smoke test proving missing credentials soft-skip before Foundry or Playwright can start.
- [ ] 5.2 With a supported credentialed Linux cloud VM, run one stable focused Playwright case through the cloud bootstrap against `ilaris-e2e-world-v14363-r1` as `e2e-gm`; preserve videos/screenshots on failure.
- [x] 5.3 Verify local E2E still follows the documented visible-browser external-server flow and does not invoke the cloud bootstrap.

## 6. Validation and handoff

- [x] 6.1 Run `npm install`, the new focused unit suites, `npm test`, and `npm run lint`.
- [x] 6.2 Run `openspec validate add-cloud-vm-foundry-test-bootstrap --strict` and resolve all change-local failures.
- [x] 6.3 Review the final diff for secret exposure, accidental Foundry data mutations, changes to normal local E2E behavior, and stale generated artifacts.
- [ ] 6.4 Complete the proposal self-review record, commit only this change's scoped files after required validation passes, and report any hosted-provider capability that still requires manual developer configuration.
