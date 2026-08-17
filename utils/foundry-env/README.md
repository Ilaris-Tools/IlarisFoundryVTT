# Foundry VTT e2e test environment (agent-agnostic)

Scripts to run a real Foundry VTT server inside any ephemeral agent or CI
environment — Claude Code on the web, GitHub Copilot coding agent, Codex,
a plain CI job, or a local Linux box — with the Ilaris system linked from the
working tree and the e2e world **Vanilla Ilaris** prepared, so
`npm run test:e2e` works anywhere.

The approach mirrors the `foundry-hetzner` VM scripts (download release →
license → data dir → background start), adapted to ephemeral containers:
Foundry runs as a plain Node process, the license/EULA/world bootstrap is
automated with headless Chromium, and test actors are seeded on first run.

## Entry points

```bash
npm run foundry:env          # full setup + start (idempotent) — the one command agents need
npm run foundry:ctl status   # is the server up?
npm run foundry:ctl logs     # tail the server log
npm run foundry:ctl restart  # e.g. after changing system code
npm run test:e2e             # run the Playwright suite against it
```

Requirements: Linux, Node >= 18, `unzip`, `curl`, `jq`, and a Chromium
Playwright can use (set `E2E_CHROMIUM_PATH` if a pre-installed one should be
used instead of Playwright's own download).

## Configuration (environment variables / secrets)

| Variable               | Required | Value                                                                 |
| ---------------------- | -------- | --------------------------------------------------------------------- |
| `FOUNDRY_LICENSE_KEY`  | yes      | Your Foundry VTT license key                                          |
| `FOUNDRY_USERNAME`     | yes\*    | Your foundryvtt.com account name (used to download the release)       |
| `FOUNDRY_PASSWORD`     | yes\*    | Your foundryvtt.com account password                                  |
| `FOUNDRY_DOWNLOAD_URL` | yes\*    | Alternative to username/password: direct URL to a Foundry NodeJS zip  |
| `FOUNDRY_VERSION`      | no       | e.g. `14.360` — defaults to `compatibility.verified` from system.json |
| `FOUNDRY_PORT`         | no       | default `30000` (matches `playwright.config.ts`)                      |
| `E2E_HEADLESS`         | no       | set to `1` in environments without a display                          |
| `E2E_CHROMIUM_PATH`    | no       | path to a pre-installed Chromium binary                               |

\* Either `FOUNDRY_USERNAME`+`FOUNDRY_PASSWORD` **or** `FOUNDRY_DOWNLOAD_URL`
must be set. If you already host the release zip yourself (as on the Hetzner
box), a direct URL avoids the foundryvtt.com login flow entirely.

The environment must be able to reach `foundryvtt.com` and its release CDN
(or the host behind `FOUNDRY_DOWNLOAD_URL`); allowlist those domains in
restricted network policies. Exit code 3 means "secrets missing" — wrappers
treat that as a soft skip so unit tests and linting still work.

## What `foundry:env` does

1. downloads the Foundry release (cached in `$HOME/foundry/cache`)
2. extracts it to `$HOME/foundry/app`, writes `license.json` + `options.json`
   (fixed port, no admin password, auto-launch world `vanilla-ilaris`)
3. builds the compendium packs (`npm run pack-all`) if missing
4. symlinks the repo into `Data/systems/Ilaris` — code edits are live after a
   Foundry reload
5. creates the world **Vanilla Ilaris** if missing and starts the server
6. runs `bootstrap-foundry.mjs` (headless Chromium): accepts the license/EULA
   on first launch, launches the world, joins as Gamemaster, and seeds actors

Foundry lives entirely outside the repo: app in `$HOME/foundry/app`, data in
`$HOME/foundry/data`, log at `$HOME/foundry/foundry.log`.

## Seeded test data

The bootstrap seeds two baseline actors if they don't exist:

- **Testlauf-Held** (`held`) with the _Kurzschwert_ from the Waffen compendium
- **Testfall-Npc** (`kreatur`) with a _Breitschwert_ attack (AT 11)

Several e2e cases expect richer actors (e.g. **HatAlles**) that live in the
maintainers' reference world. Export each actor from your real "Vanilla
Ilaris" world (right-click the actor → _Export Data_) and commit the JSON
files to `e2e/fixtures/actors/`. Every JSON file there is imported on
bootstrap if no actor with the same name exists.

## Per-agent wiring

The scripts themselves are agent-neutral; each agent only needs a thin hook
that provides the secrets and calls `npm run foundry:env`:

- **Claude Code (web)** — `.claude/hooks/session-start.sh` (registered in
  `.claude/settings.json`) runs automatically at session start. Configure the
  secrets in the Claude environment settings for this repository.
- **GitHub Copilot coding agent** — `.github/workflows/copilot-setup-steps.yml`
  prepares the runner before Copilot starts. Configure the secrets in the
  repository's **Settings → Environments → `copilot`**.
- **Other agents (Codex, Cursor, local, CI)** — set the environment variables
  and run `npm run foundry:env`; see also the pointer in `AGENTS.md`.
