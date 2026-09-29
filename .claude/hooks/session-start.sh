#!/bin/bash
# SessionStart hook for Claude Code on the web — thin adapter around the
# agent-agnostic Foundry e2e environment in utils/foundry-env/.
# Installs npm dependencies and (if Foundry secrets are configured in the
# Claude environment or ~/.foundry-env) starts a persistent Foundry server
# with the Ilaris system linked and the baseline e2e world installed, so
# `npm run test:e2e` and manual browser testing work during the session.
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
        echo 'export E2E_FOUNDRY_URL="http://127.0.0.1:30000"'
        echo 'export E2E_HEADLESS=1'
        # Use the pre-installed Chromium instead of a browser channel that is
        # not installed in the container.
        if [ -x /opt/pw-browsers/chromium ]; then
            echo 'export E2E_CHROMIUM_PATH="/opt/pw-browsers/chromium"'
        fi
    } >> "$CLAUDE_ENV_FILE"
fi

# Foundry startup is best-effort: without the license/download secrets the
# session is still fully usable for unit tests and linting (soft skip, exit 3).
echo "[session-start] Starting Foundry VTT test server..."
E2E_CHROMIUM_PATH="${E2E_CHROMIUM_PATH:-/opt/pw-browsers/chromium}" \
    node utils/foundry-env/remote-lifecycle.mjs Start
status=$?
if [ "$status" -eq 0 ]; then
    echo "[session-start] Foundry is ready at http://127.0.0.1:30000"
elif [ "$status" -eq 3 ]; then
    echo "[session-start] Foundry secrets not configured — skipping Foundry server."
    echo "[session-start] See utils/foundry-env/README.md for the variables to set."
else
    echo "[session-start] WARNING: Foundry startup failed (exit $status). E2E tests will not run." >&2
    echo "[session-start] Check \$HOME/.ilaris-foundry-e2e/foundry.log and utils/foundry-env/README.md" >&2
fi

exit 0
