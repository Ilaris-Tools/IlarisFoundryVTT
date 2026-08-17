#!/usr/bin/env bash
# Expose the local Foundry test server to the internet via a Cloudflare quick
# tunnel and print the public URL.
#
# Agent containers have no public inbound IP, so "an IP + port 30000" is not
# possible; instead cloudflared opens an outbound connection to Cloudflare and
# relays traffic back, yielding a random https://<name>.trycloudflare.com URL
# (WebSockets included, which Foundry needs).
#
# SECURITY: the test server has no admin password and the Gamemaster user has
# no password either — anyone with the URL can join the world as GM. The URL is
# random and the tunnel dies with the container, but only share it while you
# actively need it, and stop it afterwards ("unshare").
#
# Usage: share-foundry.sh [share|unshare|url]
set -euo pipefail

FOUNDRY_HOME="${FOUNDRY_HOME:-$HOME/foundry}"
PORT="${FOUNDRY_PORT:-30000}"
BIN_DIR="$FOUNDRY_HOME/bin"
CLOUDFLARED="$BIN_DIR/cloudflared"
TUNNEL_LOG="$FOUNDRY_HOME/tunnel.log"
TUNNEL_PID="$FOUNDRY_HOME/tunnel.pid"

log() { echo "[foundry-share] $*"; }

get_url() {
    grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1
}

tunnel_running() {
    [ -f "$TUNNEL_PID" ] && kill -0 "$(cat "$TUNNEL_PID")" 2>/dev/null
}

case "${1:-share}" in
    share)
        if ! curl -sf -o /dev/null "http://localhost:$PORT"; then
            log "Foundry is not running on port $PORT — start it first (npm run foundry:env)." >&2
            exit 1
        fi

        if tunnel_running && [ -n "$(get_url)" ]; then
            log "Tunnel already active: $(get_url)"
            exit 0
        fi

        if [ ! -x "$CLOUDFLARED" ]; then
            log "Downloading cloudflared..."
            mkdir -p "$BIN_DIR"
            curl -fsSL -o "$CLOUDFLARED" \
                "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
            chmod +x "$CLOUDFLARED"
        fi

        log "Starting Cloudflare quick tunnel to http://localhost:$PORT ..."
        : > "$TUNNEL_LOG"
        nohup "$CLOUDFLARED" tunnel --url "http://localhost:$PORT" \
            --no-autoupdate --protocol http2 \
            > "$TUNNEL_LOG" 2>&1 &
        echo $! > "$TUNNEL_PID"

        for _ in $(seq 1 30); do
            URL="$(get_url)"
            if [ -n "$URL" ]; then
                log "PUBLIC URL: $URL"
                log "Anyone with this URL can join the world as Gamemaster."
                log "Stop sharing with: npm run foundry:share -- unshare"
                exit 0
            fi
            if ! tunnel_running; then
                log "cloudflared exited during startup. Log:" >&2
                tail -n 20 "$TUNNEL_LOG" >&2 || true
                exit 1
            fi
            sleep 1
        done
        log "Tunnel did not come up within 30s. Log:" >&2
        tail -n 20 "$TUNNEL_LOG" >&2 || true
        exit 1
        ;;
    unshare)
        if tunnel_running; then
            kill "$(cat "$TUNNEL_PID")"
            rm -f "$TUNNEL_PID"
            log "Tunnel stopped — the public URL is dead."
        else
            log "No tunnel is running."
        fi
        ;;
    url)
        if tunnel_running && [ -n "$(get_url)" ]; then
            get_url
        else
            log "No active tunnel." >&2
            exit 1
        fi
        ;;
    *)
        echo "Usage: $0 {share|unshare|url}" >&2
        exit 2
        ;;
esac
