#!/usr/bin/env bash
# Ilaris deploy script: install deps, build packs, copy to Foundry data dir, restart service.
# Run from repo root. Optional: FOUNDRY_DATA_PATH (default: /data/foundryvtt), FOUNDRY_SERVICE (default: foundryvtt), SKIP_FOUNDRY_RESTART.

set -e

SERVICE="${FOUNDRY_SERVICE:-foundryvtt}"
FOUNDRY_DATA_PATH="${FOUNDRY_DATA_PATH:-/data/foundryvtt}"

echo "Installing dependencies..."
npm ci

echo "Building packs (compiles compendia and removes LOCK files)..."
npm run pack-all

SYSTEM_PATH="${FOUNDRY_DATA_PATH}/Data/systems/Ilaris"
echo "Copying system to ${SYSTEM_PATH}..."
mkdir -p "$(dirname "$SYSTEM_PATH")"
if [ -d "$SYSTEM_PATH" ]; then
  chmod -R u+w "$SYSTEM_PATH" 2>/dev/null || true
  rm -rf "$SYSTEM_PATH"
fi
mkdir -p "$SYSTEM_PATH"
rsync -av --exclude='.git' --exclude='.github' --exclude='README.md' --exclude='*.md' --exclude='.gitignore' . "$SYSTEM_PATH/"
chmod -R 755 "$SYSTEM_PATH"
echo "Copy complete."

if [ "${SKIP_FOUNDRY_RESTART:-0}" = "1" ]; then
  echo "Skipping Foundry restart (SKIP_FOUNDRY_RESTART=1)."
else
  echo "Restarting Foundry service (${SERVICE})..."
  systemctl restart "${SERVICE}" || {
    echo "Warning: could not restart ${SERVICE} (set SKIP_FOUNDRY_RESTART=1 to skip)."
  }
fi

echo "Deploy complete."
