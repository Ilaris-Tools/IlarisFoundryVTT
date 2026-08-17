#!/usr/bin/env bash
# Convenience wrapper for the Foundry e2e server inside the Claude container.
# Usage: .claude/foundry/foundry.sh {start|stop|restart|status|logs}
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FOUNDRY_HOME="${FOUNDRY_HOME:-$HOME/foundry}"
PID_FILE="$FOUNDRY_HOME/foundry.pid"
LOG_FILE="$FOUNDRY_HOME/foundry.log"
PORT="${FOUNDRY_PORT:-30000}"

case "${1:-status}" in
    start)
        exec bash "$SCRIPT_DIR/setup-foundry.sh"
        ;;
    stop)
        if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
            kill "$(cat "$PID_FILE")"
            echo "Stopped Foundry (pid $(cat "$PID_FILE"))."
            rm -f "$PID_FILE"
        else
            pkill -f "main\.(mjs|js) --dataPath=$FOUNDRY_HOME/data" 2>/dev/null \
                && echo "Stopped Foundry." || echo "Foundry is not running."
        fi
        ;;
    restart)
        "$0" stop
        sleep 1
        exec bash "$SCRIPT_DIR/setup-foundry.sh"
        ;;
    status)
        if curl -sf -o /dev/null "http://localhost:$PORT"; then
            echo "Foundry is running on http://localhost:$PORT"
        else
            echo "Foundry is NOT running on port $PORT."
            exit 1
        fi
        ;;
    logs)
        exec tail -n "${2:-50}" "$LOG_FILE"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs [lines]}" >&2
        exit 2
        ;;
esac
