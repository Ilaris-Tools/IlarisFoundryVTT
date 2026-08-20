## 1. Source-branch adaptation and API research

- [ ] 1.1 Inventory the reusable files from source commits `55c5f4e7`, `33671d42`, `8e8eaa21`, and `18fbd835` and the cross-platform lifecycle helper introduced by `ba2c304f8cdfae71560d0eb0288b07cc3e19124a`; add/adapt them selectively from a branch based on `develop` without merging the source branch's `vanilla-ilaris` world model.
- [ ] 1.2 Verify against the Foundry VTT API docs (v14) the supported server configuration/startup surface used by the remote setup; remove or isolate any undocumented browser/setup endpoint workaround.
- [ ] 1.3 Check foundryvtt.wiki for relevant Foundry server/configuration or `foundry.utils.*` patterns and record why no Foundry client utility is needed for baseline installation.
- [ ] 1.4 Compare the remote setup's defaults with `e2e/fixtures/baselines/manifest.json`, `e2e/shared/baseline.ts`, and the E2E fixture; document every replaced stale assumption (world, users, actors, version, browser configuration).

## 2. Manifest-driven remote environment

- [ ] 2.1 Add `utils/foundry-lifecycle.mjs` from its source commit as a cross-platform Node lifecycle facade with validated actions/options and explicit local versus remote backend selection.
- [ ] 2.2 Route local lifecycle actions through the configured official Foundry CLI and retain the existing local E2E-world/pack behavior.
- [ ] 2.3 Route remote lifecycle actions through a dedicated remote process/data root; record and stop only its owned process rather than any arbitrary listener on the selected port.
- [ ] 2.4 Port the provider-neutral `utils/foundry-env/` remote provisioning, cleanup, and optional sharing backend from source-branch Bash into cross-platform Node.js, without requiring Bash, `lsof`, or Linux-only paths from repository entry points.
- [ ] 2.5 Read the baseline manifest for archive URL, SHA-256 checksum, world ID/directory, Foundry version, and system ID; download/verify/extract the canonical baseline into a dedicated data root outside the repository.
- [ ] 2.6 Link the working-tree Ilaris system, start the prepared world, expose its URL through documented environment configuration, and verify readiness without creating users, actors, or a second world.
- [ ] 2.7 Implement developer-owned credential-file loading with process-environment precedence, secret-safe logging, actionable missing-credential soft skip, and cleanup of only the dedicated remote data root/processes.
- [ ] 2.8 Keep the tunnel/manual sharing command opt-in, add unshare cleanup, and make its unauthenticated-GM security warning unavoidable in the command output and documentation.

## 3. E2E runner and browser compatibility

- [ ] 3.1 Add explicit package scripts for remote provisioning/control/sharing without changing `npm run test:e2e` into a provisioning command.
- [ ] 3.2 Update `playwright.config.ts` to preserve local platform channel and headed defaults, accept both `E2E_CI_HEADLESS` and `E2E_HEADLESS`, and use `E2E_CHROMIUM_PATH` without a conflicting channel.
- [ ] 3.3 Keep `scripts/testing/e2e-runtime.js` external-server-only: it must validate `E2E_FOUNDRY_URL` and never read credentials, create data, or launch Foundry.
- [ ] 3.4 Add thin Claude Web and GitHub Copilot setup adapters that call the shared command only when remote credentials are configured; document the generic manual entry point for other agents and CI.

## 4. Documentation and instruction integration

- [ ] 4.1 Update `AGENTS.md`, `CLAUDE.md`/Claude adapter instructions as appropriate, and developer E2E documentation to distinguish local lifecycle validation from opt-in remote Linux provisioning.
- [ ] 4.2 Document required variables, credential precedence, baseline identity, Windows/macOS/Linux support, cache/data-root locations, reset/cleanup, log access, and sharing security in `utils/foundry-env/README.md`.
- [ ] 4.3 Add a concise troubleshooting path for missing credentials, checksum mismatch, unavailable Chromium, stale remote server, and baseline assertion failure.

## 5. Unit Tests

- [ ] 5.1 Add or update a focused Jest spec for manifest parsing, required baseline fields, archive checksum validation, and rejection of the obsolete `vanilla-ilaris`/synthetic-world path.
- [ ] 5.2 Add or update a focused Jest spec for secret-file/environment precedence, no-secret soft skip, cleanup target scoping, and cross-platform command/process adapter selection.
- [ ] 5.3 Add a configuration-level test for local headed/channel defaults, `E2E_CI_HEADLESS`, `E2E_HEADLESS`, and `E2E_CHROMIUM_PATH` executable precedence.
- [ ] 5.4 Update `scripts/testing/_spec/e2e-runtime.test.js` only as needed to prove the normal runner remains external-server-only.

## 6. E2E Tests

- [ ] 6.1 Add an environment smoke test or reusable setup assertion that verifies a provisioned remote server satisfies `assertE2EBaseline` with `ilaris-e2e-world-v14363-r1`, `e2e-gm`, `e2e-player`, `HatAlles`, `Testlauf-Held`, and `Testlauf-Npc` before gameplay tests run.
- [ ] 6.2 With developer-provided credentials in a supported remote/Linux environment, run the complete serial Playwright suite against the provisioned canonical baseline; preserve videos/screenshots on failure and investigate regressions.
- [ ] 6.3 Confirm that local E2E execution still uses the documented lifecycle/external-server path and retains a visible browser by default.

## 7. Validation and handoff

- [ ] 7.1 Run `npm install`, focused unit tests, `npm test`, and `npm run lint`.
- [ ] 7.2 Run `openspec validate integrate-remote-foundry-e2e-environment --strict` and resolve all change-local failures.
- [ ] 7.3 Review the final diff for credentials, baseline duplication, and accidental source-branch-only behavior; verify no compendium `_source/` data changed, so `npm run pack-all` is not required unless implementation introduces such a change.
- [ ] 7.4 Complete the proposal self-review record, commit only this change's scoped files after required validation passes, and report any credentialed remote E2E step that requires manual developer action.
