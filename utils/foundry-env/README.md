# Manifest-driven Foundry E2E environment

`utils/foundry-env/remote-lifecycle.mjs` provisions an isolated Foundry server
for web agents, CI, or another machine. It always installs the published
`ilaris-e2e-world-v14363-r1` baseline described by
`e2e/fixtures/baselines/manifest.json`; it never creates `vanilla-ilaris`,
users, actors, or substitute data.

All repository entry points are Node.js programs and work on Windows, macOS,
and Linux. Windows uses PowerShell's `Expand-Archive`; macOS/Linux require
`unzip` to extract release archives.

## Commands

```text
npm run foundry:lifecycle -- Status
npm run foundry:lifecycle -- PackAndRestart
npm run foundry:env                         # remote Setup
npm run foundry:ctl -- Start
npm run foundry:ctl -- Status
npm run foundry:ctl -- Logs --lines 100
npm run foundry:ctl -- Stop
npm run foundry:ctl -- Share                # explicit public tunnel
npm run foundry:ctl -- Unshare
npm run foundry:ctl -- Reset                 # default remote home only
node utils/foundry-lifecycle.mjs Start --mode remote
npm run foundry:cloud -- e2e/cases/e2e-001-nahkampf-angriffsdialog/e2e-001-nahkampf-angriffsdialog.spec.ts
```

The first two commands are local lifecycle commands. They use the configured
official `fvtt` CLI, the local `ilaris-e2e-world-v14363-r1` world, and the
normal browser defaults. Remote commands prepare and run a separate Node
Foundry installation. `npm run test:e2e` remains deliberately external-server
only: set `E2E_FOUNDRY_URL=http://127.0.0.1:30000` after remote startup.

## Disposable cloud VM

`npm run foundry:cloud -- <Playwright paths>` is for a fresh hosted Linux VM,
such as a Claude Web/mobile task. It runs `npm ci`, provisions the canonical
baseline in an isolated local home, starts Foundry, runs the selected paths
headlessly, then stops only the recorded process in a `finally` path. Omitting
paths runs `e2e/cases`. Playwright videos and screenshots remain in
`test-results/` after a failure.

Cloud mode reads Foundry credentials **only** from its inherited process
environment. It intentionally ignores `FOUNDRY_SECRETS_FILE` and
`${HOME}/.foundry-env`; configure the hosting provider's secret mechanism to
inject `FOUNDRY_LICENSE_KEY` and either `FOUNDRY_DOWNLOAD_URL` or
`FOUNDRY_USERNAME` plus `FOUNDRY_PASSWORD`. Those values are passed only to
Foundry provisioning, never to `npm ci` or Playwright.

Set `FOUNDRY_RUN_ID` to a unique, alphanumeric/hyphen/underscore task ID when
multiple tasks share a VM. It derives a separate managed home below the
temporary cloud root and a deterministic port. `FOUNDRY_HOME` may override the
home only when it remains below that root; `FOUNDRY_PORT` may override the port.
Use `FOUNDRY_E2E_PATHS` (space-separated) with `.claude/hooks/foundry-env.mjs`
to select paths for Claude Web. The VM needs Node.js, `unzip`, outbound download
access, and a Foundry-compatible Chromium executable; set `E2E_CHROMIUM_PATH`
when the default browser cannot be used.

## Credentials and configuration

Remote setup needs `FOUNDRY_LICENSE_KEY` and either a direct application
archive URL (`FOUNDRY_DOWNLOAD_URL`) or `FOUNDRY_USERNAME` plus
`FOUNDRY_PASSWORD`. Put them in process environment variables or a private
`${HOME}/.foundry-env` file (override its path with `FOUNDRY_SECRETS_FILE`):

```dotenv
FOUNDRY_LICENSE_KEY=XXXX-XXXX-XXXX-XXXX
FOUNDRY_DOWNLOAD_URL=https://private.example/foundry-v14.zip
E2E_HEADLESS=true
E2E_CHROMIUM_PATH=/path/to/chromium
```

Process environment values override the file. The command never prints their
values. If credentials are absent it exits `3` before downloading, linking, or
launching; this is a soft skip for agent setup, not an E2E success.

`FOUNDRY_HOME` defaults to `${HOME}/.ilaris-foundry-e2e`; it contains `app`,
`cache`, `data`, `foundry.log`, and the managed PID files. The cache contains
the verified baseline archive. `FOUNDRY_PORT` defaults to `30000`.

`Reset` removes only the default managed `FOUNDRY_HOME`; it refuses a custom
path to avoid deleting a developer-owned directory. `Stop` and `Unshare` act
only on the PID files from that home and never terminate an unrelated process
that happens to use the same port.

## Sharing

`Share` is opt-in and requires `cloudflared` on `PATH`. It prints this warning
every time: the test world has an unauthenticated GM, so anyone with its public
URL can join as GM. Share only for a short manual check, then run `Unshare`.
The command stores its tunnel log and owned PID under `FOUNDRY_HOME`.

## Agent adapters

Claude Web may run `.claude/hooks/foundry-env.mjs`; it calls the disposable
cloud bootstrap only when credentials are already configured. GitHub Copilot can use
`.github/workflows/copilot-foundry-env.yml` with secrets in its `copilot`
environment. Other agents and CI should set the same variables and call
`npm run foundry:env` directly.

## Troubleshooting

| Symptom                   | Resolution                                                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Exit code `3`             | Configure the required credentials in the environment or private secrets file.                                                                               |
| Checksum mismatch         | Delete the archive below `FOUNDRY_HOME/cache`, then rerun; verify the release asset and manifest revision.                                                   |
| Chromium cannot start     | Set `E2E_CHROMIUM_PATH` to a Chromium executable, or configure Playwright's normal browser channel.                                                          |
| Server is stale/not ready | Inspect `npm run foundry:ctl -- Logs`, then use `Stop` followed by `Start`.                                                                                  |
| Baseline assertion fails  | Use `Reset` on the default home, re-provision, and confirm the manifest still names `e2e-gm`, `e2e-player`, `HatAlles`, `Testlauf-Held`, and `Testlauf-Npc`. |
