# Implementation Handoff

**Change:** `portable-e2e-test-environment`  
**Recorded:** 2026-07-25  
**Status:** local staging works; live local launch is blocked by Foundry license isolation. Use external-server mode for the next validation.

> **Update (2026-07-25):** External-server mode was verified by passing E2E-001 against `http://127.0.0.1:30000`. The local launcher, temporary data-root helpers, archive staging, and associated tests were removed. `docs/develop/e2e-testing.md` now documents the supported manual baseline-archive installation, configuration, reset, and test workflow.

> **External baseline validation (2026-07-25):** E2E-025 (spell target selection and instant damage), E2E-027 (spell-compendium import and settings-backed pre-effect configuration), and E2E-011 (GM/player ownership and multiplayer routing) pass against the dedicated external world.

## What Is Implemented

- The user supplied a new dedicated world archive. It was moved from the repository root to the ignored local staging path `e2e/fixtures/baselines/ilaris-e2e-world-v14363-r1.zip`.
- The archive is deliberately excluded from Git. Its committed release metadata is:
    - `e2e/fixtures/baselines/manifest.json`
    - `e2e/fixtures/baselines/SHA256SUMS.txt`
    - SHA-256: `83BAC3A8A9A302C4728E86118D203C606DDDC2644A0061CBAA2845E790976A6A`
    - World ID: `ilaris-e2e-world-v14363-r1`
    - Foundry version: `14.363`
    - Baseline revision: `r1`
- The archive is structurally valid: it contains one top-level world directory with `world.json`.
- `scripts/testing/e2e-runtime.js` provides and tests strict local/external runtime selection plus browser channel/headless selection.
- `scripts/testing/e2e-baseline.js` provides and tests baseline manifest and SHA-256 verification.
- `scripts/testing/e2e-local-data.js` creates a fresh ignored Foundry data root under `e2e/.runtime/`, copies the Ilaris system under test, and extracts a verified baseline world into it.
- `e2e/tools/run.mjs` is the `npm run test:e2e` launcher. It has:
    - `E2E_FOUNDRY_EXECUTABLE` local-process mode
    - `E2E_FOUNDRY_URL` external-server mode
    - optional `--prepare-only` staging mode
    - local `e2e/.env` loading from `e2e/.env.example`
    - Playwright path passthrough, for example `npm run test:e2e -- e2e/cases/<case>/<case>.spec.ts`
- `npm run test:e2e:prepare` successfully rebuilt packs, verified the archive, copied the system, and extracted a fresh world without launching Foundry.
- `e2e/shared/baseline.ts` centralizes baseline world, users, actors, weapons, and spells. `e2e-gm` and `e2e-player` are the intended test users.
- `e2e/shared/fixtures/foundry.ts` now runs baseline preflight after login using Foundry V14 `game.world`, `game.system`, `game.users.getName()`, and `game.actors.getName()`.
- `playwright.config.ts` selects Edge on Windows and Chrome elsewhere, honors `PLAYWRIGHT_CHROMIUM_CHANNEL`, and uses `E2E_CI_HEADLESS` for CI mode.
- E2E-011 has been migrated to the shared baseline constants and `E2E_PLAYER_USER`.

## Verified Checks

| Check                                                            | Result                        |
| ---------------------------------------------------------------- | ----------------------------- |
| Baseline ZIP checksum matches manifest                           | Pass                          |
| ZIP is ignored by Git                                            | Pass                          |
| Runtime resolver Jest test                                       | Pass, 8 tests                 |
| Baseline manifest/checksum Jest test                             | Pass, 5 tests                 |
| Disposable data-root Jest test                                   | Pass, 2 tests                 |
| `npm run test:e2e:prepare` with the installed Foundry executable | Pass                          |
| First live local E2E-001 smoke                                   | Blocked before test execution |

## Current Blocker

The local launcher starts Foundry with a new `--dataPath` so it cannot use the contributor's normal worlds. Foundry creates a new `Config/` directory in that data root and logs:

```text
Software license requires signature.
```

The relevant observed log is in the ignored runtime directory:

```text
e2e/.runtime/run-NM5GEk/foundry/Logs/debug.2026-07-25.log
```

Do **not** ask contributors for product keys and do **not** copy, commit, or publish `Config/license.json`. That file is credential/license material.

## Next Safe Step: External Server Mode

The contributor has a licensed Foundry V14 installation. Start it normally using its existing data root, and make the E2E baseline world available there. Then create `e2e/.env` from `e2e/.env.example` using only this mode:

```dotenv
E2E_FOUNDRY_URL=http://127.0.0.1:30000
E2E_FOUNDRY_USER=e2e-gm
E2E_PLAYER_USER=e2e-player
```

Do **not** set `E2E_FOUNDRY_EXECUTABLE` in this mode. The launcher already enforces that exactly one mode is selected.

Before running a test, check that the running instance actually serves the baseline world and includes:

- `e2e-gm` and `e2e-player`
- `HatAlles`, `Testlauf-Held`, and `Testlauf-Npc`
- `Kurzschwert` on `Testlauf-Held`
- the required spells on `HatAlles`
- ownership of `Testlauf-Held` assigned to `e2e-player`

Then run one narrow smoke case:

```powershell
npm run test:e2e -- e2e/cases/e2e-001-nahkampf-angriffsdialog/e2e-001-nahkampf-angriffsdialog.spec.ts
```

At the time this handoff was written, neither `http://127.0.0.1:30000` nor `http://127.0.0.1:30001` was listening, so no external-server smoke test has run yet.

## Outstanding Work

- Verify actual users, ownership, actors, items, settings, and scenes in the new world through a running licensed Foundry instance. The ZIP was inspected only structurally; LevelDB document content was not read directly.
- Expand the baseline manifest/preflight to validate ownership, items/spells, settings, and compendium access.
- Migrate all remaining E2E cases to `e2e/shared/baseline.ts`; only E2E-011 has been migrated.
- Create dedicated local/external/reset/multiplayer smoke cases.
- Replace the placeholder GitHub release URL in `e2e/fixtures/baselines/manifest.json` after publishing the baseline release asset.
- Update `docs/develop/e2e-testing.md` and add CI only after a real external-server smoke test passes.

## Worktree Notes

Do not revert unrelated user work. At last check, `comp_packs/kurzuebersichten/_source/Welteinstellungen_Quick_Reference_welt001abc.json` was modified outside this change.

The generated archive and `e2e/.runtime/` are intentionally ignored. The baseline archive is not visible in `git status` and must be published separately as a release asset, not committed.
