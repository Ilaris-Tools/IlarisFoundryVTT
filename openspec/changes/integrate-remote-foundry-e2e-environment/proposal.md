## Why

The existing Claude-Web test-environment branch provides valuable portable Foundry setup work, but it was authored from an older `main` revision and creates a separate, minimal `vanilla-ilaris` world. That world cannot satisfy the current Playwright contract on `develop`, which requires the versioned `ilaris-e2e-world-v14363-r1` baseline, its users, actors, settings, and scene.

## What Changes

- Integrate the reusable ideas from the remote Foundry environment at `claude/ilaris-foundry-test-env-sswlsu` and the cross-platform lifecycle helper introduced by `ba2c304f8cdfae71560d0eb0288b07cc3e19124a`, onto a branch based on `develop`.
- Make `e2e/fixtures/baselines/manifest.json` the single source of truth for the remote environment's world identity, Foundry version, baseline archive, required users, and test data; do not create or seed a parallel minimal world.
- Add thin Claude Web and Copilot setup adapters, while documenting a manual entry point for other web-based agents, CI, and contributors on Windows, macOS, and Linux.
- Integrate the existing cross-platform `utils/foundry-lifecycle.mjs` design as the common lifecycle facade, with separate local CLI and remote provisioning backends rather than duplicated start/stop/readiness logic.
- Implement every repository-owned lifecycle/provisioning entry point in cross-platform Node.js; platform-specific process discovery or executable invocation SHALL be isolated behind the facade rather than exposed as shell-only commands.
- Extend Playwright configuration to support the current local/headed flow and an opt-in headless remote flow with an explicitly supplied Chromium executable.
- Preserve the external-server E2E contract for ordinary contributors: `npm run test:e2e` continues to require an explicit `E2E_FOUNDRY_URL` and never accesses license material by itself.
- Document secret handling, optional short-lived public sharing, cleanup, and the incompatibilities resolved from the source branch.

The change is additive for remote execution and modifies existing E2E configuration and runtime documentation. It does not change game rules, compendium data, or Foundry gameplay behavior.

## Capabilities

### New Capabilities

- `remote-e2e-environment`: A reproducible, credential-gated Foundry VTT runtime for remote/web-based agents that prepares the repository's canonical E2E baseline.

### Modified Capabilities

- `e2e-testing`: Playwright supports an opt-in remote headless browser and optional explicit Chromium executable while retaining the local browser-channel defaults.
- `e2e-world-baseline`: Remote setup consumes the published baseline manifest/archive instead of creating an independent world or synthetic baseline data.
- `portable-e2e-runtime`: A credential-gated setup command may prepare a dedicated canonical E2E server; normal E2E execution remains external-server-only.

## Impact

- Affected areas: `utils/foundry-lifecycle.mjs`, `utils/foundry-env/`, `.claude/`, `.github/`, `package.json`, `playwright.config.ts`, E2E documentation, and agent instructions.
- Source material: commits `55c5f4e7`, `33671d42`, `8e8eaa21`, and `18fbd835` from `claude/ilaris-foundry-test-env-sswlsu`, plus lifecycle-helper introduction `ba2c304f8cdfae71560d0eb0288b07cc3e19124a` from the later zone-work branch.
- Foundry-facing surface: no new Foundry client `Document`, `Application`, or Hook API is introduced. The setup invokes the Foundry server and uses the published baseline world; runtime browser tests continue to use the existing Playwright fixture and its documented Foundry UI flow.
- Sensitive inputs: Foundry license/download credentials remain developer-owned environment variables or a developer-owned secrets file; they are never committed or emitted in logs.

## Testing Impact

- Unit tests: add coverage for manifest-driven environment resolution, credentials precedence, and safe no-secret/cleanup behavior; update `scripts/testing/_spec/e2e-runtime.test.js` only where the runtime contract gains an explicit setup mode.
- Existing E2E: regression-run the canonical Playwright suite against the provisioned `ilaris-e2e-world-v14363-r1` world with `e2e-gm` and `e2e-player`; its required actors include `HatAlles`, `Testlauf-Held`, and `Testlauf-Npc`.
- New E2E/environment checks: prove that remote headless mode and `E2E_CHROMIUM_PATH` work without changing local headed defaults, and that a missing credential exits as an actionable soft skip without invoking Playwright.
- Shared code candidates: baseline manifest parsing and server readiness/reset handling belong in reusable `utils/` or `e2e/shared/` helpers rather than provider-specific hooks.

## Proposal Self-Review

**Decision: PASS_WITH_NOTES**

- **Scope:** Focused on integrating and adapting the remote test environment and its shared lifecycle facade; it explicitly excludes the source branch's separate minimal world and shell-only repository entry points.
- **Requirements:** Covers the three affected existing E2E capabilities plus the new remote setup capability.
- **API evidence:** No new Foundry client API/Hooks are planned; implementation must still verify the supported Foundry v14 server/configuration behavior before coding.
- **Testing:** Includes unit, remote runtime, and full canonical-baseline E2E validation.
- **Migration/rollback:** Additive scripts and adapters can be removed without changing the published baseline archive; no data migration is involved.
- **UI ordering:** Not applicable; this change adds no in-game UI.

**Note:** A real remote validation needs developer-owned Foundry credentials and a compatible Linux/web-agent environment. The proposal remains apply-ready because implementation can validate all credential-free paths locally and treat unavailable credentials as a documented runtime prerequisite.
