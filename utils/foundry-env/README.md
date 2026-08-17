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

### Where to put the secrets (developer-owned, not repo-owned)

These are personal credentials (your license, your foundryvtt.com account), so
they should live with the developer, not as central repository secrets. Two
equivalent options for Claude Code on the web — both are stored in **your**
environment configuration, which belongs to your Claude account, not to the
GitHub repository:

1. **Environment variables** in the Claude environment settings — add the
   `FOUNDRY_*` variables directly. Simplest, recommended.
2. **The environment's setup script** — paste a snippet like this into the
   script field; `setup-foundry.sh` reads `~/.foundry-env` automatically
   (override the path with `FOUNDRY_SECRETS_FILE`):

    ```bash
    cat > ~/.foundry-env <<'EOF'
    FOUNDRY_LICENSE_KEY=XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
    FOUNDRY_USERNAME=your-foundry-account
    FOUNDRY_PASSWORD=your-foundry-password
    EOF
    chmod 600 ~/.foundry-env
    ```

    Note: a plain `export` in the setup script would only affect the setup
    script's own process — that's why the snippet writes the file that the
    Foundry scripts read later.

The scripts never write this file, they only read it. If a variable is set
both ways, the real environment variable (option 1) wins; the file only fills
in variables that are missing.

The `~/.foundry-env` file works for any agent that lets you run a bootstrap
command, so other agents can use the same mechanism. The Copilot coding agent
is the exception: it only injects secrets via the repository's `copilot`
environment (see `copilot-setup-steps.yml`), which is repo-level by design.

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

## Sharing the server on the internet (manual testing)

Agent containers have no public inbound IP, so `http://<ip>:30000` is not
possible. Instead, `npm run foundry:share` opens a Cloudflare quick tunnel
(outbound-only) and prints a random public URL like
`https://<name>.trycloudflare.com` that works in any browser, WebSockets
included. `npm run foundry:share -- unshare` kills it; the tunnel also dies
with the container.

**Security**: the test server has no admin password and the Gamemaster user
has no password — anyone who has the URL can join as GM. The URL is random
and short-lived, but only share while actively testing, and unshare after.
Whether exposing a personally licensed server this way is acceptable is the
license holder's call.

**Network policy**: the tunnel needs these hosts allowlisted in the
environment's network settings (the download of `cloudflared` itself comes
from `github.com`, which most policies already allow):

- `api.trycloudflare.com` (tunnel provisioning)
- `*.argotunnel.com` (the tunnel's edge connection; uses port 7844, so a
  policy that only permits port 443 will still block it)
- `*.trycloudflare.com`

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
