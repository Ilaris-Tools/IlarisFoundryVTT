#!/bin/bash
# SessionStart hook for Claude Code on the web.
# Installs npm dependencies and (if Foundry secrets are configured in the
# Claude environment) downloads, licenses, and starts a Foundry VTT server
# with the Ilaris system linked and the "Vanilla Ilaris" e2e world prepared.
set -uo pipefail

# Only relevant for remote (web) sessions — local devs manage Foundry themselves.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
    exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

echo "[session-start] Installing npm dependencies..."
if ! npm install --no-audit --no-fund; then
    echo "[session-start] ERROR: npm install failed" >&2
    exit 1
fi

# Environment for Playwright e2e runs inside the container.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
    {
        echo 'export E2E_FOUNDRY_URL="http://localhost:30000"'
        echo 'export E2E_HEADLESS=1'
        # Use the pre-installed Chromium instead of downloading one at runtime.
        if [ -x /opt/pw-browsers/chromium ]; then
            echo 'export E2E_CHROMIUM_PATH="/opt/pw-browsers/chromium"'
        fi
    } >> "$CLAUDE_ENV_FILE"
fi

# Foundry setup is best-effort: without the license/download secrets the
# session is still fully usable for unit tests and linting.
echo "[session-start] Setting up Foundry VTT test server..."
if bash .claude/foundry/setup-foundry.sh; then
    echo "[session-start] Foundry is ready at http://localhost:30000"
else
    status=$?
    if [ "$status" -eq 3 ]; then
        echo "[session-start] Foundry secrets not configured — skipping Foundry server."
        echo "[session-start] See .claude/foundry/README.md for the environment variables to set."
    else
        echo "[session-start] WARNING: Foundry setup failed (exit $status). E2E tests will not run." >&2
        echo "[session-start] Check $HOME/foundry/foundry.log and .claude/foundry/README.md" >&2
    fi
fi

exit 0
