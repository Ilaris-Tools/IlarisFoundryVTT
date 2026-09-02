## Context

> **Scope revision (2026-07-25):** The external-server workflow is the only supported contributor mode. The earlier local-process and disposable-data-root decisions are retained below as historical investigation notes, but are superseded: Foundry requires a license signature in a new data root, and copying that signature is prohibited. Contributors install the sanitized baseline archive in a dedicated world, start their own licensed Foundry instance, and configure `E2E_FOUNDRY_URL`.

The current Playwright configuration accepts a Foundry URL, but the shared fixture defaults to a local server, a `Gamemaster` user, and a `Vanilla Ilaris` world. Existing cases further assume a personal world contains named actors, spells, weapons, player ownership, configured system settings, and an initially clean state. Actor snapshot restoration reduces some mutations but does not create a reproducible starting world or protect against incomplete cleanup.

Foundry VTT is licensed software. The Ilaris repository must not include a Foundry executable, automate its public distribution, or require access to a contributor's normal Foundry data directory. The supplied baseline world uses Foundry V14.363. The E2E specification requires sequential execution and Chrome/Edge browser-channel support, while the checked-in Playwright configuration currently has no channel selection or CI-specific headless mode.

The implementation therefore needs a local process/data lifecycle, a baseline-world lifecycle, shared test-data identities, Playwright configuration changes, and contributor documentation. It must also preserve an external-server mode for contributors who already operate a suitable isolated Foundry installation.

## Goals / Non-Goals

**Goals:**

- Let a contributor run the E2E suite from a clean clone after supplying their own licensed, compatible Foundry runtime and baseline-world artifact.
- Ensure local E2E execution does not read, change, or delete the contributor's normal Foundry data.
- Establish a reproducible world baseline containing the users, ownership, documents, settings, and compendium access required by current E2E cases.
- Make local and CI browser behavior explicit, deterministic, and observable through failure artifacts.
- Retain support for an externally managed isolated Foundry server.

**Non-Goals:**

- Distributing, downloading, containerizing for redistribution, or licensing Foundry VTT through this repository.
- Migrating the full current E2E suite to parallel execution.
- Rewriting feature E2E cases beyond replacing environment dependencies with shared canonical test-data references.
- Replacing Foundry's world storage format or writing LevelDB/Foundry database files directly.
- Provisioning the final CI runner, private image, or Foundry license secret. This change defines its contract and prepares the project-side workflow only.

## Decisions

### Decision 1: Two mutually exclusive runtime modes

**Chosen:** An E2E run MUST use exactly one source of server lifecycle configuration:

- **Local process mode:** `E2E_FOUNDRY_EXECUTABLE` points to the contributor's locally licensed Foundry executable. The E2E launcher creates a temporary data root, installs the system under test there, initializes the world clone, starts Foundry, waits for readiness, runs Playwright, and stops the process.
- **External server mode:** `E2E_FOUNDRY_URL` points to a server the contributor has already started with an isolated E2E data root. The launcher does not start or stop that server, but validates the expected world and baseline marker before tests proceed.

Setting both variables or neither variable is a configuration error. Credential variables remain separate from runtime selection and are never committed.

**Alternatives considered:**

- _Always require a local executable_: Rejected because contributors may use a server or Docker-hosted Foundry installation.
- _Prefer URL when both are set_: Rejected because silently choosing a mode could direct mutations at an unintended server.
- _Reuse `PATH_TO_FOUNDRY` and `FILE_TO_START_FOUNDRY`_: Rejected because those general development-task variables are split and ambiguous for E2E ownership. A single E2E-specific executable variable is clearer.

### Decision 2: Clone a sanitized baseline world into disposable data

**Chosen:** The first implementation accepts an immutable, sanitized baseline-world source located outside normal contributor data. A launcher copies that source into a temporary E2E data root for every local run. The copied world is the only world E2E cases may mutate.

The baseline source is a sanitized public GitHub Release asset, identified by a committed manifest and SHA-256 checksum. The opaque LevelDB archive remains excluded from Git history; the launcher downloads it automatically on first use, verifies its checksum, caches it locally, and clones it into a new disposable E2E data root for each local run. It MUST be compatible with the pinned Foundry version and documented with a baseline revision marker.

**Alternatives considered:**

- _Commit the baseline archive directly_: Rejected because it is an opaque LevelDB artifact that would add binary history and make reviews difficult. A versioned release asset plus manifest keeps contributor setup simple without polluting repository history.
- _Build every document through browser `game.*` API calls_: Rejected for the first slice because the existing comprehensive `HatAlles` dataset is large and document schemas are Foundry-version dependent. A later structured seed migration remains valuable.
- _Reset the shared source world after each test_: Rejected because failed cleanup can contaminate later tests and could modify a contributor's own world.

### Decision 3: Verify runtime invocation before implementation

**Chosen:** The first implementation task is a documented compatibility spike against Foundry V14.363 and the contributor-provided installation. It MUST confirm the supported executable invocation, data-directory override, system-directory placement, startup readiness signal, and controlled shutdown behavior before the launcher is written.

The launcher will use only documented command-line/process behavior. It will not infer or modify a contributor's regular Foundry data location. The existing `@foundryvtt/foundryvtt-cli` dependency may be used only after its supported operations and license implications are verified.

**Alternatives considered:**

- _Assume desktop executable command-line flags_: Rejected because platform-specific Foundry packaging and launch semantics must be verified.
- _Write world database files directly_: Rejected because Foundry owns that persistence format and the repository instructions prohibit direct LevelDB edits.

### Decision 4: Canonical test-data contract and validation marker

**Chosen:** The baseline includes a documented marker/version and a canonical data manifest. Shared E2E code exports the required world/user/actor/item identities; cases reference those shared identifiers instead of duplicating names such as `HatAlles` and `Ignifaxius`.

Startup validation fails before browser interactions if the selected world lacks the baseline marker, expected system ID/version, required users, required ownership, or required documents. The manifest starts with the dependencies of current E2E cases and expands deliberately as new cases are added.

**Alternatives considered:**

- _Continue relying on names embedded in individual cases_: Rejected because it makes the baseline implicit and prevents useful preflight errors.
- _Give every test an entirely unique generated world_: Rejected initially because it substantially increases start time and complicates startup migration coverage. The suite remains one serial run per disposable clone.

### Decision 5: Local and CI Playwright modes are explicit

**Chosen:** The default contributor mode remains headed for diagnosis. A dedicated environment-controlled CI mode enables headless execution. Browser channel selection follows the existing E2E spec: Edge on Windows, Chrome on macOS/Linux, with an explicit channel override. The Playwright configuration remains sequential with one worker.

Every failed run preserves Playwright video, screenshots, report data, launcher logs, and Foundry server output. CI may upload those paths as job artifacts; local runs retain them until the contributor cleans the E2E output directory.

**Alternatives considered:**

- _Run headed browsers in CI under a virtual display_: Rejected as the default because it adds platform machinery without improving the suite's behavioral contract.
- _Run the whole suite on every PR immediately_: Rejected. A smoke subset on trusted PRs and the full serial suite on `develop`/scheduled runs give a faster, safer adoption path.

## API Surface

### Foundry Classes and Utilities

No new Foundry VTT classes, Hooks, or `foundry.utils.*` helpers are introduced by the launcher or file-cloning design. The design deliberately avoids direct database manipulation and browser-side document creation.

The existing browser fixture's `game`, `Actor`, `Item`, `ChatMessage`, and settings usage remains existing test code, not a new API surface of this change. If implementation adds or changes any browser-side Foundry API calls, the implementer MUST verify exact names and signatures against the Foundry V14 API before editing.

### Hook Events

No Hook events are listened to or triggered.

## Risks / Trade-offs

- **[Risk] Baseline world contains private or license-sensitive content** -> Require a sanitized copy, a reviewed inventory, removal of credentials/user-specific data, and a private distribution location when it cannot be public.
- **[Risk] Foundry desktop/server launch semantics differ by platform** -> Complete the V14.360 invocation spike before committing to the launcher shape; document supported platforms and fail clearly on unsupported configurations.
- **[Risk] Baseline storage is not portable across Foundry versions** -> Pin the baseline to a Foundry version and make version validation part of preflight; recreate or migrate the baseline intentionally for runtime upgrades.
- **[Risk] Existing cleanup suppresses errors and masks state leakage** -> Use fresh data per run and make lifecycle/preflight failures visible; progressively remove best-effort cleanup where the reset contract supersedes it.
- **[Risk] External server mode points at a non-disposable world** -> Require an explicit marker validation and document that external mode is permitted only for isolated E2E data.
- **[Risk] E2E suite duration becomes too high** -> Keep one server and one cloned world per serial run; introduce a tagged smoke subset before enabling a full CI gate.

## Migration Plan

1. Inventory the current `Vanilla Ilaris` test-world dependencies and obtain a sanitized baseline copy from the maintainer.
2. Verify the documented Foundry V14.360 launch/data-root behavior on Windows and record the supported command contract.
3. Add launcher, baseline validation, and local configuration documentation without changing existing case behavior.
4. Migrate shared fixture defaults and each case's hardcoded world identities to canonical test-data references.
5. Run the complete suite against a freshly cloned baseline repeatedly; resolve state leaks and declare the baseline revision stable.
6. Add the optional CI smoke workflow only after local reproducibility is demonstrated. Roll back by disabling the new E2E entrypoint/workflow; no contributor's normal Foundry data is ever in scope for rollback.

## Open Questions

- The initial public release asset is `ilaris-e2e-world-v14363-r1.zip`. Before the first contributor release, does its manifest URL need a version-tag naming adjustment?
- Which platforms need supported local process mode in the first release: Windows only, or Windows/macOS/Linux?
- Does the supplied Foundry V14.360 runtime support an isolated data-root override through the desktop executable, or is the installed Foundry CLI/server entrypoint required?
- Which current test-only users, documents, items, settings, scenes, and modules are intentionally part of the baseline versus accidental personal-world state?
- Is the first supported local process mode Windows only, or should macOS/Linux runtime discovery be completed before release?

## Testing Strategy

### Testable Units

| Unit                          | Scope                     | Test approach                                                                  |
| ----------------------------- | ------------------------- | ------------------------------------------------------------------------------ |
| Runtime mode resolver         | Launcher configuration    | Pure function with environment-object inputs and explicit error cases          |
| Baseline source validator     | Launcher configuration    | Filesystem fixture directories with valid/missing/incompatible metadata        |
| Temporary data-root lifecycle | Launcher                  | Focused integration test using temporary directories and no Foundry runtime    |
| Canonical baseline preflight  | Playwright shared fixture | Playwright smoke test against the cloned world                                 |
| Reset guarantee               | Playwright shared fixture | Mutate actor/chat/settings, create a new clone, then assert the baseline state |

Existing Jest patterns use pure functions and mocks; the implementation should keep parsing/resolution modules independent from process launch so they can be tested without Foundry. Process lifecycle and browser readiness require focused integration/E2E checks rather than mocks.

### E2E Coverage

- Local executable smoke: clone baseline, start Foundry, join as GM, and assert the baseline marker and `game.ready`.
- External URL smoke: refuse a server without the isolation marker and accept an isolated baseline world.
- Multiplier smoke: GM and player join independently and verify the player owns the expected actor.
- Reset smoke: mutation from a previous run is absent after a new baseline clone.
- Regression run: execute all existing cases, including `e2e-011` multiplayer, `e2e-016` XML import, `e2e-020` startup migration, and `e2e-024` compendium stress, against the supplied baseline.
