## Context

`utils/foundry-env/remote-lifecycle.mjs` already owns a manifest-driven,
credential-gated Foundry installation in a dedicated home. It is suitable for
web agents and CI, but its current provider adapter only invokes `Setup`; a
fresh cloud VM still needs dependency installation, server startup, E2E
invocation, evidence retention, and owned-process cleanup arranged manually.

The new command is an orchestration layer over that existing core. It is not a
new Foundry gameplay feature and must not make a mutable server shared between
parallel agents. Fable's existing local lifecycle remains the preferred path
for interactive development and old-versus-new test validation.

## Goals / Non-Goals

**Goals:**

- Provide one deterministic command for a disposable cloud VM to install,
  provision, start, test, and clean up a focused E2E run.
- Require Foundry credentials solely from process environment variables in
  cloud mode, keeping provider-specific secret storage outside this repository.
- Give each invocation a managed home and port, retaining Playwright failure
  artifacts while removing only processes/data it owns.
- Keep normal local lifecycle commands and the external-server E2E runner
  unchanged.

**Non-Goals:**

- Operate a permanent or publicly reachable Foundry test server.
- Add Foundry client Documents, Hooks, UI, or `foundry.utils.*` use.
- Replace Fable's local setup or require cloud credentials for unit/lint work.
- Define an account-specific secret API for Claude, Codex, GitHub, or any other
  provider.

## Decisions

### Add a separate cloud bootstrap entry point

Add a dedicated Node.js command below `utils/foundry-env/` and a package-script
alias. The command SHALL run the sequence `npm ci`/dependency check → remote
setup → remote start → focused `npm run test:e2e -- <paths>` → owned stop, with
`finally` cleanup after success or failure. It SHALL pass the managed local URL
and explicit headless/browser settings only to its child test process.

Keeping this separate from `npm run test:e2e` preserves the existing
external-server safety boundary and makes credential use explicit.

Alternative considered: teach `test:e2e` to provision Foundry. Rejected because
ordinary test execution would unexpectedly consume credentials and mutate a
data root.

### Require environment-only secrets in cloud mode

The bootstrap validates `FOUNDRY_LICENSE_KEY` plus either a direct archive URL
or account credentials from its inherited process environment. It SHALL not
read `FOUNDRY_SECRETS_FILE` or the developer-home `.foundry-env` file. The
existing remote lifecycle continues to support its documented local secrets
file for contributors that explicitly invoke it.

Alternative considered: reuse the secrets-file fallback. Rejected because a
fresh hosted VM has no developer-owned home and copying a file would risk
persisting credentials in the workspace or artifacts.

### Derive isolation from one run identity

The bootstrap accepts an optional run identifier and derives the managed
`FOUNDRY_HOME` and port from it, unless the caller explicitly supplies safe
values. It rejects a managed home outside its dedicated cloud-VM root and
reuses the remote lifecycle's recorded-PID behavior. Distinct parallel tasks
therefore use distinct worlds, databases, users, ports, and logs.

Alternative considered: a single permanent remote server. Rejected because
the serial Playwright suite mutates actor, chat, scene, and setting state.

### Preserve evidence, not runtime state

`test-results/` remains outside the managed Foundry home and is never deleted
by cloud cleanup. The command stops the owned server in a `finally` path, while
an explicit reset remains available for a failed provision. Logs report paths
and status only, never credential values.

### Keep provider adapters thin

The Claude adapter only detects injected credentials and invokes the shared
bootstrap. Other providers use the same package script. This keeps VM setup
repository-owned but leaves secret injection and VM lifecycle under the
provider's control.

## API Surface

- **Foundry VTT classes:** none. This operates before a browser client exists;
  it does not extend a class listed in the [Foundry v14 API](https://foundryvtt.com/api/v14/).
- **Foundry Hooks:** none.
- **`foundry.utils.*`:** none. The [Foundry community API wiki](https://foundryvtt.wiki/en/development/api)
  has no client utility applicable to a server-process bootstrap.
- **Process surface:** Node.js `child_process`, filesystem, and environment
  boundaries in the existing remote lifecycle, not Foundry's browser API.

## Risks / Trade-offs

- **Hosted VM lacks network, `unzip`, or a compatible Chromium binary** → fail
  before a test run with a prerequisite-specific message.
- **Credential injection is unavailable** → exit with the existing soft-skip;
  no download, Foundry launch, or Playwright run occurs.
- **Parallel invocations collide** → derive separate managed homes and ports
  from the run identity and reject an unsafe supplied home.
- **A test fails after Foundry starts** → retain Playwright artifacts and stop
  only the recorded process in `finally`.
- **`npm ci` changes the workspace cache** → use it only in the disposable VM
  command; it does not alter contributor lifecycle commands.

## Migration Plan

1. Build the pure option/environment resolver and test it without credentials.
2. Add the orchestration command and thin Claude adapter, retaining the current
   remote lifecycle API as its underlying implementation.
3. Add documentation and a credential-free soft-skip test.
4. In a cloud VM with injected secrets, run a focused baseline E2E smoke case.
5. Roll back by removing the additive command/adapter. Existing local and
   remote lifecycle commands, baseline archive, and E2E runner continue to
   work independently.

## Testing Strategy

- Pure Jest tests cover environment-only secret checks, run-id home/port
  derivation, unsafe home rejection, child command construction, and `finally`
  cleanup decisions.
- Update existing remote-environment unit specs rather than using a running
  Foundry process for parser/orchestration coverage.
- Add a smoke command test with missing credentials to prove it soft-skips
  without starting Foundry or Playwright.
- With a credentialed Linux VM, invoke one known-stable E2E spec through the
  command and verify the canonical baseline fixture; use Playwright's existing
  failure video/screenshot settings.
- Regression-run the ordinary E2E runtime/configuration tests to prove
  `npm run test:e2e` remains external-server-only and local execution remains
  visible by default.

## Open Questions

- Which provider-visible variable should carry an optional run identifier; the
  implementation can use `FOUNDRY_RUN_ID` unless the provider supplies a
  documented standard identifier.
- Whether cloud providers allow `npm ci` network installation per task or
  preinstall repository dependencies. The command must give an actionable
  error for either case.
