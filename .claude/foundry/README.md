# Foundry VTT test server for Claude Code on the web

This directory contains everything needed to run a real Foundry VTT server
inside the Claude Code cloud container, with the Ilaris system linked from the
working tree and the e2e world **Vanilla Ilaris** prepared, so `npm run test:e2e`
works in remote sessions.

It mirrors the approach of the `foundry-hetzner` VM scripts (download release →
license → data dir → systemd-like background start), adapted to an ephemeral
container: Foundry runs as a plain Node process, the license/EULA/world
bootstrap is automated with Playwright, and test actors are seeded on first run.

## One-time configuration in the Claude app

Open your Claude environment settings for this repository and add these
**environment variables** (use secrets where offered):

| Variable               | Required | Value                                                                 |
| ---------------------- | -------- | --------------------------------------------------------------------- |
| `FOUNDRY_LICENSE_KEY`  | yes      | Your Foundry VTT license key                                          |
| `FOUNDRY_USERNAME`     | yes\*    | Your foundryvtt.com account name (used to download the release)       |
| `FOUNDRY_PASSWORD`     | yes\*    | Your foundryvtt.com account password                                  |
| `FOUNDRY_DOWNLOAD_URL` | yes\*    | Alternative to username/password: direct URL to a Foundry NodeJS zip  |
| `FOUNDRY_VERSION`      | no       | e.g. `14.360` — defaults to `compatibility.verified` from system.json |

\* Either `FOUNDRY_USERNAME`+`FOUNDRY_PASSWORD` **or** `FOUNDRY_DOWNLOAD_URL`
must be set. If you already host the release zip yourself (as on the Hetzner
box), a direct URL avoids the foundryvtt.com login flow entirely.

**Network policy**: the environment must be able to reach `foundryvtt.com` and
its release CDN. If you use a restricted network policy, allowlist
`foundryvtt.com` and `*.foundryvtt.com` (or use `FOUNDRY_DOWNLOAD_URL` pointing
to an allowlisted host).

No further setup script is needed in the app: the `SessionStart` hook in
`.claude/settings.json` runs automatically at the start of every web session
once this branch is merged (or when working on a branch that contains it).

## What happens at session start

`.claude/hooks/session-start.sh`:

1. `npm install` (cached between sessions by the container snapshot)
2. exports `E2E_FOUNDRY_URL`, `E2E_HEADLESS=1`, `E2E_CHROMIUM_PATH` for Playwright
3. runs `setup-foundry.sh`, which:
    - downloads the Foundry release (cached in `$HOME/foundry/cache`)
    - extracts it to `$HOME/foundry/app`, writes `license.json` + `options.json`
      (port 30000, no admin password, auto-launch world `vanilla-ilaris`)
    - builds the compendium packs (`npm run pack-all`) if missing
    - symlinks the repo into `Data/systems/Ilaris` — code edits are live after
      a Foundry reload
    - creates the world **Vanilla Ilaris** if missing and starts the server
    - runs `bootstrap-foundry.mjs` (headless Chromium): accepts the license/EULA
      on first launch, launches the world, joins as Gamemaster, and seeds actors

If the secrets are missing, the hook prints a notice and skips Foundry — unit
tests (`npm test`) and linting still work.

## Seeded test data

The bootstrap seeds two baseline actors if they don't exist:

- **Testlauf-Held** (`held`) with the _Kurzschwert_ from the Waffen compendium
- **Testfall-Npc** (`kreatur`) with a _Breitschwert_ attack (AT 11)

Several e2e cases expect richer actors (e.g. **HatAlles**) that live in the
maintainers' reference world. To make those tests pass in the container, export
each actor from your real "Vanilla Ilaris" world (right-click the actor →
_Export Data_) and commit the JSON files to `e2e/fixtures/actors/`. Every JSON
file there is imported on bootstrap if no actor with the same name exists.

## Day-to-day commands (inside a session)

```bash
.claude/foundry/foundry.sh status     # is the server up?
.claude/foundry/foundry.sh logs 100   # tail the server log
.claude/foundry/foundry.sh restart    # e.g. after changing system code
npm run test:e2e                      # run the Playwright suite
npx playwright test e2e/cases/e2e-001-nahkampf-angriffsdialog  # single case
```

Foundry lives entirely outside the repo: app in `$HOME/foundry/app`, data in
`$HOME/foundry/data`, log at `$HOME/foundry/foundry.log`.
