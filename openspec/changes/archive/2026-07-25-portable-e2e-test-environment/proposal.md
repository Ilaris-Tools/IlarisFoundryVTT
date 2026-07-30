## Why

> **Scope revision (2026-07-25):** The local Foundry process/data-root launcher is not supported. A valid Foundry installation cannot start from a new data root without license material, which this repository must never copy or request. The supported contributor workflow is an externally started, dedicated Foundry E2E world installed from the published baseline archive.

The current Playwright suite connects to a manually started Foundry instance and assumes a developer's personal `Vanilla Ilaris` world already contains named users, actors, items, settings, and an appropriate clean state. This prevents other contributors from running the suite reliably and makes failures dependent on local, mutable data.

This change defines a contributor-runnable E2E environment without distributing Foundry VTT itself. Contributors retain responsibility for providing their own licensed Foundry VTT v14 installation; the repository supplies an isolated test-data lifecycle and a documented baseline world contract.

## What Changes

- Add an E2E launcher contract that starts a contributor-provided Foundry executable through a local-only environment variable, or connects to an already isolated Foundry URL.
- Create an isolated temporary Foundry data directory for E2E runs so normal contributor worlds and settings are never modified.
- Introduce a sanitized baseline-world release asset and reset process that supplies the accounts, ownership, actors, items, compendium access, settings, and clean state required by the existing Playwright cases.
- Centralize E2E environment configuration and canonical test-data identities instead of scattering personal-world defaults across test cases.
- Add contributor documentation describing the Foundry runtime prerequisite, local configuration, baseline-world acquisition, startup, reset, and failure artifacts.
- Update E2E execution for CI compatibility, including a supported browser channel, an explicit headless mode, sequential isolation, readiness checks, and diagnostic artifacts. The CI runtime distribution itself is out of scope; it must use a separately licensed private image or trusted runner.

## Capabilities

### New Capabilities

- `portable-e2e-runtime`: Local E2E launcher configuration for a contributor-provided Foundry runtime or externally managed isolated server.
- `e2e-world-baseline`: Sanitized baseline world acquisition, validation, cloning, and reset behavior for deterministic E2E data.

### Modified Capabilities

- `e2e-testing`: E2E execution requirements change from a manually prepared personal world to an isolated, documented, reproducible environment with an explicit browser mode and test-data contract.

## Impact

| Area               | Impact                                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| E2E tooling        | New launcher/reset scripts, environment template, Playwright configuration, and shared fixtures under `e2e/`                              |
| Test data          | A sanitized, public GitHub Release asset with a committed checksum and manifest; temporary cloned data is created per run                 |
| Existing E2E cases | Migrate hardcoded personal-world assumptions to shared canonical test-data constants and validate every current case against the baseline |
| Documentation      | Contributor E2E setup and troubleshooting documentation                                                                                   |
| CI                 | Future workflow job and artifact upload contract; provisioning a licensed Foundry runtime is explicitly external to this repository       |

### Foundry VTT API Surface

The launcher and world-cloning process use filesystem and process control only and introduce no direct Foundry VTT client API calls, Hook events, document classes, or Foundry utility methods. Existing Playwright cases continue to use Foundry client APIs inside browser evaluation; any new runtime API use discovered during implementation must be verified against the Foundry V14 API before it is added.

### Testing Impact

**New unit-test scenarios:**

- Resolve E2E launch mode from environment variables, including a clear failure when neither a runtime executable nor external URL is configured.
- Reject a missing, incompatible, or incomplete baseline world before Playwright starts.
- Verify that the temporary E2E data directory is created from the baseline and that the contributor's normal Foundry data path is never selected.

**Existing tests to update:**

- Update E2E shared fixture tests or add focused tests for configuration parsing and baseline validation where the selected implementation permits it.
- Update all current Playwright cases to use centralized canonical actor, item, user, and world references rather than personal-world assumptions.

**New E2E coverage:**

- Launcher smoke flow: start an isolated local Foundry process, join the baseline world as GM, and verify `game.ready`.
- Reset flow: mutate actor/chat/settings state, reset the world, and verify the next run receives the baseline state.
- Multiplayer smoke flow: join as GM and test player, verify ownership and socket connectivity.

**Environment context:**

- Players: one GM account and one player account with ownership of the actor used by multiplayer cases.
- World: an isolated `Ilaris E2E` world initialized from a sanitized baseline and compatible with Foundry V14.360.
- Shared code candidates: a launch configuration resolver, world lifecycle helper, canonical test-data identifiers, and readiness/assertion helpers in `e2e/shared/`.
