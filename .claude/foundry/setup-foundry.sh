#!/usr/bin/env bash
# Download, install, license, and start a Foundry VTT server for e2e testing.
#
# Idempotent: safe to run repeatedly; skips work already done (cached download,
# extracted app, running server). Designed for the Claude Code web container but
# works on any Linux box with node >= 18, unzip, curl, and jq.
#
# Required environment variables (set them in the Claude environment settings):
#   FOUNDRY_LICENSE_KEY   Foundry license key (with or without dashes)
#   and ONE of:
#     FOUNDRY_USERNAME + FOUNDRY_PASSWORD   foundryvtt.com account (downloads the
#                                           release like the Hetzner setup does)
#     FOUNDRY_DOWNLOAD_URL                  direct URL to a Foundry Linux/NodeJS zip
#
# Optional:
#   FOUNDRY_VERSION   e.g. "14.360" (default: compatibility.verified from system.json)
#   FOUNDRY_PORT      default 30000 (matches playwright.config.ts)
#   FOUNDRY_HOME      install/data root, default $HOME/foundry
#
# Exit codes: 0 = ready, 3 = secrets missing (soft skip), 1 = real failure.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="${CLAUDE_PROJECT_DIR:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

FOUNDRY_HOME="${FOUNDRY_HOME:-$HOME/foundry}"
APP_DIR="$FOUNDRY_HOME/app"
DATA_DIR="$FOUNDRY_HOME/data"
CACHE_DIR="$FOUNDRY_HOME/cache"
LOG_FILE="$FOUNDRY_HOME/foundry.log"
PID_FILE="$FOUNDRY_HOME/foundry.pid"
PORT="${FOUNDRY_PORT:-30000}"
WORLD_ID="vanilla-ilaris"
WORLD_TITLE="Vanilla Ilaris"

log() { echo "[foundry-setup] $*"; }

# ---------------------------------------------------------------- secrets check
if [ -z "${FOUNDRY_LICENSE_KEY:-}" ]; then
    log "FOUNDRY_LICENSE_KEY is not set."
    exit 3
fi
if [ -z "${FOUNDRY_DOWNLOAD_URL:-}" ] && { [ -z "${FOUNDRY_USERNAME:-}" ] || [ -z "${FOUNDRY_PASSWORD:-}" ]; }; then
    log "Neither FOUNDRY_DOWNLOAD_URL nor FOUNDRY_USERNAME/FOUNDRY_PASSWORD are set."
    exit 3
fi

mkdir -p "$APP_DIR" "$DATA_DIR" "$CACHE_DIR"

# ---------------------------------------------------------------- version
FOUNDRY_VERSION="${FOUNDRY_VERSION:-$(jq -r '.compatibility.verified' "$REPO/system.json")}"
if [ -z "$FOUNDRY_VERSION" ] || [ "$FOUNDRY_VERSION" = "null" ]; then
    log "Could not determine Foundry version; set FOUNDRY_VERSION explicitly." >&2
    exit 1
fi
log "Target Foundry version: $FOUNDRY_VERSION"

# ---------------------------------------------------------------- download
ZIP_FILE="$CACHE_DIR/foundryvtt-$FOUNDRY_VERSION.zip"
if [ ! -s "$ZIP_FILE" ]; then
    log "Downloading Foundry VTT $FOUNDRY_VERSION..."
    node "$SCRIPT_DIR/download-foundry.mjs" "$FOUNDRY_VERSION" "$ZIP_FILE"
else
    log "Using cached release zip: $ZIP_FILE"
fi

# ---------------------------------------------------------------- extract
VERSION_MARKER="$APP_DIR/.installed-version"
if [ ! -f "$VERSION_MARKER" ] || [ "$(cat "$VERSION_MARKER")" != "$FOUNDRY_VERSION" ]; then
    log "Extracting Foundry app to $APP_DIR..."
    rm -rf "$APP_DIR"
    mkdir -p "$APP_DIR"
    unzip -q "$ZIP_FILE" -d "$APP_DIR"
    echo "$FOUNDRY_VERSION" > "$VERSION_MARKER"
fi

# Entry point moved across Foundry generations; find whichever exists.
MAIN_JS=""
for candidate in \
    "$APP_DIR/main.mjs" \
    "$APP_DIR/main.js" \
    "$APP_DIR/resources/app/main.mjs" \
    "$APP_DIR/resources/app/main.js"; do
    if [ -f "$candidate" ]; then
        MAIN_JS="$candidate"
        break
    fi
done
if [ -z "$MAIN_JS" ]; then
    log "Could not find Foundry main entry point under $APP_DIR" >&2
    find "$APP_DIR" -maxdepth 2 -name "main.*" >&2 || true
    exit 1
fi
log "Foundry entry point: $MAIN_JS"

# ---------------------------------------------------------------- data config
mkdir -p "$DATA_DIR/Config" "$DATA_DIR/Data/systems" "$DATA_DIR/Data/worlds" "$DATA_DIR/Logs"

# License key (Foundry stores it without separators; the online signature is
# fetched automatically on first launch).
LICENSE_CLEAN="$(echo "$FOUNDRY_LICENSE_KEY" | tr -cd '[:alnum:]')"
if [ ! -f "$DATA_DIR/Config/license.json" ]; then
    printf '{"license": "%s"}\n' "$LICENSE_CLEAN" > "$DATA_DIR/Config/license.json"
fi

# Minimal server options: fixed port, no UPnP, auto-launch the e2e world.
# No admin password: /setup and /join stay open, matching the e2e fixtures.
cat > "$DATA_DIR/Config/options.json" <<EOF
{
  "port": $PORT,
  "upnp": false,
  "fullscreen": false,
  "hostname": null,
  "routePrefix": null,
  "proxySSL": false,
  "proxyPort": null,
  "world": "$WORLD_ID",
  "language": "en.core"
}
EOF

# ---------------------------------------------------------------- system link
# Build compendium packs once (LevelDB output is gitignored).
if [ ! -f "$REPO/comp_packs/waffen/CURRENT" ]; then
    log "Building compendium packs (npm run pack-all)..."
    (cd "$REPO" && npm run pack-all)
fi

# Link the working tree into the Foundry data dir so code edits are live.
ln -sfn "$REPO" "$DATA_DIR/Data/systems/Ilaris"
log "Linked $REPO -> Data/systems/Ilaris"

# ---------------------------------------------------------------- world
WORLD_DIR="$DATA_DIR/Data/worlds/$WORLD_ID"
if [ ! -f "$WORLD_DIR/world.json" ]; then
    log "Creating world '$WORLD_TITLE'..."
    mkdir -p "$WORLD_DIR"
    SYSTEM_VERSION="$(jq -r '.version' "$REPO/system.json")"
    cat > "$WORLD_DIR/world.json" <<EOF
{
  "id": "$WORLD_ID",
  "title": "$WORLD_TITLE",
  "system": "Ilaris",
  "coreVersion": "$FOUNDRY_VERSION",
  "systemVersion": "$SYSTEM_VERSION",
  "description": "Automatically created world for Ilaris e2e tests.",
  "background": null,
  "nextSession": null,
  "resetKeys": false,
  "safeMode": false
}
EOF
fi

# ---------------------------------------------------------------- start server
is_up() { curl -sf -o /dev/null "http://localhost:$PORT"; }

if is_up; then
    log "Foundry already running on port $PORT."
else
    log "Starting Foundry server (log: $LOG_FILE)..."
    nohup node "$MAIN_JS" --dataPath="$DATA_DIR" --port="$PORT" --noupnp \
        > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"

    for _ in $(seq 1 60); do
        if is_up; then break; fi
        if ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
            log "Foundry process died during startup. Last log lines:" >&2
            tail -n 30 "$LOG_FILE" >&2 || true
            exit 1
        fi
        sleep 1
    done
    if ! is_up; then
        log "Foundry did not respond on port $PORT within 60s. Last log lines:" >&2
        tail -n 30 "$LOG_FILE" >&2 || true
        exit 1
    fi
    log "Foundry is up on http://localhost:$PORT"
fi

# ---------------------------------------------------------------- bootstrap
# Accept license/EULA if prompted, make sure the world is live, and seed the
# baseline test actors. Uses the repo's Playwright + pre-installed Chromium.
log "Running browser bootstrap (license/EULA/world/seed)..."
(cd "$REPO" && node "$SCRIPT_DIR/bootstrap-foundry.mjs")

log "Foundry test environment ready: http://localhost:$PORT (world: $WORLD_TITLE)"
