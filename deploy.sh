#!/usr/bin/env bash
# Ilaris deploy script: install deps, build packs, copy to Foundry data dir, restart container.
# Run from repo root. Requires FOUNDRY_DATA_PATH. Optional: FOUNDRY_CONTAINER (default: fvtt-internal), SKIP_FOUNDRY_RESTART.

set -e

CONTAINER="${FOUNDRY_CONTAINER:-fvtt-internal}"

echo "Installing dependencies..."
npm ci

echo "Building packs (compiles compendia and removes LOCK files)..."
npm run pack-all

if [ -z "${FOUNDRY_DATA_PATH}" ]; then
  echo "Error: FOUNDRY_DATA_PATH is not set. Set it to the Foundry data directory (e.g. /root/foundry-dev/foundry/data)."
  exit 1
fi

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
  echo "Restarting Foundry container (${CONTAINER})..."
  docker restart "${CONTAINER}" || {
    echo "Warning: could not restart ${CONTAINER} (e.g. permission denied; set SKIP_FOUNDRY_RESTART=1 to skip)."
  }
fi

echo "Deploy complete."
