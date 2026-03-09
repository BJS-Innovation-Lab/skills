#!/usr/bin/env bash
# Start the A2A server
# Usage: server.sh [--port 8001] [--host 0.0.0.0]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

PORT="$MY_AGENT_PORT"
HOST="$MY_AGENT_HOST"
NAME="$(get_agent_name "$MY_AGENT_ID")"
CAPABILITIES="communication,tasks"

while [[ $# -gt 0 ]]; do
  case $1 in
    --port) PORT="$2"; shift 2 ;;
    --host) HOST="$2"; shift 2 ;;
    --name) NAME="$2"; shift 2 ;;
    --capabilities) CAPABILITIES="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$MY_AGENT_ID" ]]; then
  echo "Error: A2A_AGENT_ID not set" >&2
  echo "Set it with: export A2A_AGENT_ID='your-agent-uuid'" >&2
  exit 1
fi

echo "Starting A2A server..."
python3 "$SCRIPT_DIR/server.py" \
  --port "$PORT" \
  --host "$HOST" \
  --agent-id "$MY_AGENT_ID" \
  --name "$NAME" \
  --capabilities "$CAPABILITIES"
