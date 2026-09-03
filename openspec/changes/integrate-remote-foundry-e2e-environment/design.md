## Context

`develop` already has a versioned E2E world archive, a manifest describing its required users and data, an external-server test runner, and local browser defaults. The four commits on `claude/ilaris-foundry-test-env-sswlsu` add a useful Linux/web-agent Foundry downloader, bootstrap, secret-file support, Claude/Copilot adapters, and optional tunnel, but are based on an older `main` commit. Their standalone `vanilla-ilaris` world, `Gamemaster` login, minimal actor seeding, and browser configuration conflict with the current baseline and runner.

The integration must therefore reuse the portable environment implementation while treating the current E2E manifest and external runtime contract as authoritative.

## Goals / Non-Goals

**Goals:**

- Provide an opt-in cross-platform command that provisions a real Foundry server for the canonical published E2E baseline in local or web-agent environments.
- Keep license material outside the repository and make missing credentials a clear, non-destructive outcome.
- Preserve local contributor E2E behavior and the existing `npm run test:e2e` external-server boundary.
- Let Claude Web, Copilot, CI, and other web-based agents use the same reusable provisioning core through thin adapters.

**Non-Goals:**

- Create, maintain, or test against a new `vanilla-ilaris` world.
- Change any game rule, compendium, E2E case semantics, or published baseline contents.
- Collapse local and remote backend responsibilities into one implementation or require a personal license for ordinary unit/lint work.
- Depend on repository-owned shell-only lifecycle or provisioning entry points. Platform-specific executable/process handling is permitted behind the Node facade.
- Expose a persistent public Foundry server or commit credentials.

## Decisions

### Consume the published baseline manifest instead of synthesizing a world

The provisioning core SHALL read `e2e/fixtures/baselines/manifest.json`, download or use its verified archive, and install it at the manifest's `worldDirectory`/`worldId`. It SHALL not construct a world JSON, create minimal users, or seed substitute actors.

This ensures `e2e-gm`, `e2e-player`, `HatAlles`, `Testlauf-Held`, `Testlauf-Npc`, settings, and scene state are identical to local E2E execution. It also makes a new baseline revision an explicit manifest/archive change rather than a second environment-specific migration.

Alternative considered: retain `vanilla-ilaris` and extend its seeding logic. Rejected because the test suite's baseline is substantially richer and would drift again.

### Separate provisioning from test execution

`npm run foundry:env` will be an explicit, credential-gated setup/start command for remote Linux environments. `npm run test:e2e` continues to invoke the existing E2E runner and requires `E2E_FOUNDRY_URL`; it does not download Foundry, create a data root, or access credentials.

Alternative considered: have `test:e2e` implicitly provision Foundry. Rejected because it weakens the existing runtime safety boundary, makes local failures harder to diagnose, and risks accidental credential use.

### Use the cross-platform lifecycle helper as a shared facade

The existing `utils/foundry-lifecycle.mjs` design, introduced by `ba2c304f8cdfae71560d0eb0288b07cc3e19124a`, becomes the stable Node entry point for lifecycle actions such as `Status`, `Stop`, `Start`, `Restart`, and `PackAndRestart`. It SHALL route an explicit local mode to the configured official Foundry CLI and an explicit remote mode to the credential-gated provisioning backend. Remote-only setup/download and sharing remain explicit remote actions.

The facade owns platform-neutral argument validation, readiness reporting, and action vocabulary. Each backend owns its installation and process details. The remote backend SHALL stop only the PID/process it recorded in its dedicated data root, rather than terminating any arbitrary listener on the requested port.

All repository-owned commands SHALL be Node.js entry points runnable on Windows, macOS, and Linux. Platform-specific details—such as invoking `.cmd` on Windows, discovering a listener, or launching Foundry—belong in narrowly scoped Node adapters. The source branch's Bash scripts are reference material only and SHALL be ported rather than adopted as required entry points.

Alternative considered: duplicate lifecycle handling in shell provisioning scripts. Rejected because it both diverges lifecycle behavior and excludes Windows/macOS contributors.

### Preserve local Playwright defaults while adding remote overrides

The configuration SHALL retain platform channel selection and headed local execution. It SHALL accept both the established `E2E_CI_HEADLESS` and the remote adapter's `E2E_HEADLESS` as explicit headless opt-ins. When `E2E_CHROMIUM_PATH` is supplied, it SHALL use that executable and avoid a conflicting Playwright channel selection; otherwise the current channel behavior remains unchanged.

Alternative considered: replace the configuration with the source branch's simpler `E2E_HEADLESS` implementation. Rejected because it would discard the current Edge/Chrome channel compatibility policy.

### Use a provider-neutral shell core with thin adapters

`utils/foundry-env/` owns download, configuration, baseline installation, server control, cleanup, and documentation. Claude and Copilot files may only inject configured secrets and call the shared command. Other agents receive the same documented manual command.

### Keep secrets and sharing opt-in

Environment variables override a developer-owned secrets file. The core never writes secrets to the repository or logs values. Missing credentials return a documented soft-skip status before downloading or launching. Public sharing is a separate manual command with its security warning and teardown command.

## API Surface

- **Foundry VTT classes:** none are added or extended. Provisioning operates outside a running Foundry client and installs the published world archive rather than creating `Actor`, `User`, or other documents.
- **Foundry Hooks:** none are registered or triggered.
- **`foundry.utils.*`:** none are used.
- **Foundry API verification:** implementation must verify the supported v14 server configuration/startup behavior against the [Foundry VTT v14 API documentation](https://foundryvtt.com/api/v14/) before relying on undocumented setup endpoints. The [Foundry community API wiki](https://foundryvtt.wiki/en/development/api) must also be checked for an existing supported startup/configuration pattern before adding a custom workaround.

## Risks / Trade-offs

- **Remote Foundry credentials are unavailable** → Provisioning exits with a clear soft-skip; lint and unit tests remain usable.
- **Baseline archive URL or checksum changes** → Read only the manifest and verify the checksum before extraction; publish a new manifest/archive revision together.
- **Remote Chromium differs from local browser channels** → Use `E2E_CHROMIUM_PATH` only when explicitly supplied and regression-test local defaults separately.
- **Tunnel exposes an unauthenticated test GM** → Keep sharing manual, clearly warn in documentation, and provide an unshare/cleanup command.
- **Platform process management differs** → Unit-test command selection/parsing per platform and report an actionable prerequisite when a platform lacks a required external executable.

## Migration Plan

1. Start from `develop` and add the cross-platform lifecycle facade plus selectively copy/adapt the source branch's portable files; do not merge its world model or overwrite current E2E configuration wholesale.
2. Port the required provisioning/control behavior into Node.js, add it as a cross-platform remote lifecycle backend, and connect command/adapters to the facade.
3. Validate credential-free paths, unit tests, lint, and strict specs.
4. With developer-provided remote credentials, provision a disposable data root and run the canonical suite.
5. Roll back by removing the additive remote commands/adapters and `utils/foundry-env/`; the baseline archive and normal E2E runner remain unchanged.

## Testing Strategy

- Unit-test environment parsing, manifest resolution/checksum validation, secrets precedence, unsupported platform handling, and no-secret soft skip. Use existing pure-function Jest patterns in `scripts/testing/_spec/` or create a focused utility spec beside the new code.
- Regression-test `playwright.config.ts` decisions through a pure configuration helper or dynamic-import test: local default headed/channel behavior, `E2E_CI_HEADLESS`, `E2E_HEADLESS`, and executable-path precedence.
- Add an environment smoke scenario that validates the provisioned server against `assertE2EBaseline` before the full suite.
- Run the existing serial Playwright suite against the manifest world with `e2e-gm` and `e2e-player` only after credentials are available. No game UI flow changes require a new gameplay test case.

## Open Questions

- Whether the baseline archive should be fetched from its release asset on every empty remote data root or accepted from an explicitly mounted local archive cache. The implementation should support the release asset first and may add a documented cache override if needed.
- Whether a Cloudflare quick tunnel is permitted in every hosted agent environment. It remains optional and is not a prerequisite for automated tests.
