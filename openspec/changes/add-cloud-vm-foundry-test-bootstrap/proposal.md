## Why

Web and mobile coding agents receive a fresh Linux VM for a task. They need a
real Foundry runtime to validate focused new Playwright coverage, but manually
reconstructing the Foundry installation and canonical E2E world in every
session is slow and drifts from the repository's local test contract.

The existing remote-environment work provides a credential-gated provisioning
core, but its Claude adapter only prepares that core. It does not provide the
complete, disposable VM workflow of installing dependencies, starting Foundry,
running selected tests, preserving failure evidence, and reliably cleaning up.

## What Changes

- Add one provider-neutral cloud-VM bootstrap command that installs project
  dependencies, provisions the canonical E2E baseline, starts an isolated local
  Foundry server, runs selected Playwright paths headlessly, and tears down the
  managed process afterwards.
- Make cloud bootstrap credentials environment-only. It SHALL not read a local
  secrets file, print secrets, or require provider-specific secret APIs; Claude
  Web/mobile, CI, and other hosted agents inject the existing `FOUNDRY_*`
  values themselves.
- Add explicit per-run `FOUNDRY_HOME` and port isolation, with an actionable
  failure when the requested process or port cannot be safely owned. This keeps
  local Fable development and old-versus-new test validation independent.
- Update the Claude adapter to invoke the complete bootstrap only when its
  required environment variables are present, while retaining the current
  credential-free soft skip.
- Document the disposable-VM flow, its required host prerequisites, test-result
  retention, and the distinction from contributor-managed local Foundry.

This is additive. It does not replace local lifecycle commands, the
external-server contract of `npm run test:e2e`, or the canonical E2E baseline.

## Capabilities

### New Capabilities

- `cloud-vm-foundry-test-bootstrap`: A provider-neutral, environment-secret
  bootstrap for an isolated Linux cloud VM to run focused Foundry E2E checks.

### Modified Capabilities

- `portable-e2e-runtime`: Add the explicit disposable-VM entry point while
  retaining the normal external-server E2E runner boundary.
- `e2e-testing`: Document and verify the cloud headless execution path without
  changing local visible-browser defaults.

## Impact

- Affected areas: `utils/foundry-env/`, `.claude/hooks/`, `package.json`, E2E
  documentation, agent instructions, and focused utility/Playwright tests.
- Prerequisite: the active `integrate-remote-foundry-e2e-environment` change
  supplies the reusable remote provisioning core; this change extends it rather
  than duplicating it.
- Foundry VTT API surface: no Foundry client classes, Hooks, Documents, or
  `foundry.utils.*` utilities are added or changed. The bootstrap starts the
  Foundry v14 server process and uses the existing Playwright fixture only;
  implementation must verify the supported server/configuration surface against
  the [Foundry VTT v14 API documentation](https://foundryvtt.com/api/v14/).
- Sensitive inputs: `FOUNDRY_LICENSE_KEY` plus either `FOUNDRY_DOWNLOAD_URL`
  or `FOUNDRY_USERNAME`/`FOUNDRY_PASSWORD` are injected by the VM environment
  and never committed, logged, or copied into a workspace file.

## Testing Impact

- Unit tests: command parsing, environment-only credential validation, required
  install/start/test/teardown ordering, owned-home cleanup, and failure paths
  that preserve Playwright artifacts.
- Existing E2E: run at least one focused case against the disposable canonical
  `ilaris-e2e-world-v14363-r1` baseline using `e2e-gm`; retain videos and
  screenshots when it fails.
- Regression coverage: prove the ordinary `npm run test:e2e` runner remains
  external-server-only, and local lifecycle/browser defaults remain unchanged.
- E2E environment: hosted Linux VM with Node.js, `unzip`, a compatible Chromium
  executable, Foundry credentials injected as environment variables, and no
  shared mutable Foundry process.

## Proposal Self-Review

**Decision: PASS_WITH_NOTES**

- **Scope:** Focused on the missing disposable cloud-VM orchestration layer;
  it deliberately leaves Fable's local workflow and any persistent/public test
  server unchanged.
- **Requirements:** Separates the new bootstrap capability from the existing
  external-server E2E runner to avoid accidental credential use.
- **API evidence:** No new Foundry client API, Hook, or utility is proposed;
  the implementation will document and verify the Foundry v14 server startup
  boundary before changing the lifecycle core.
- **Testing:** Covers pure orchestration logic, a focused runtime smoke test,
  and regression protection for local E2E execution.
- **Migration/rollback:** Additive commands/adapters can be removed without
  changing the published baseline or normal local test scripts.
- **UI ordering:** Not applicable; this change adds no Foundry UI.

**Note:** A real cloud-run validation needs provider support for injected
environment secrets, outbound downloads, a Linux-compatible Foundry archive,
and a compatible browser. Credential-free validation remains mandatory and
does not require those external capabilities.
