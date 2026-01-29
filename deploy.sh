#!/usr/bin/env bash
# Ilaris deploy script: install deps, build packs (and remove LOCK files), restart Foundry.
# Run from repo root. Optional env: FOUNDRY_SERVICE (default: foundry), FOUNDRY_DATA_PATH.

set -e

SERVICE="${FOUNDRY_SERVICE:-foundry}"

echo "Installing dependencies..."
npm ci

echo "Building packs (compiles compendia and removes LOCK files)..."
npm run pack-all

echo "Restarting Foundry service (${SERVICE})..."
systemctl --user restart "${SERVICE}" || {
    echo "Warning: could not restart ${SERVICE} (service may not exist or not be user-managed)"
}

echo "Deploy complete."
