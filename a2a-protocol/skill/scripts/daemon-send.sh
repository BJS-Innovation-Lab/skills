#!/bin/bash
# Send message via daemon (instant if connected)
# Usage: ./daemon-send.sh <to_agent> '{"message": "hello"}' [--type task] [--subject "Subject"]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

DATA_DIR="${A2A_DATA_DIR:-$HOME/.openclaw/a2a}"
SOCKET_PATH="$DATA_DIR/daemon.sock"

TO_RAW="$1"
CONTENT="$2"
shift 2

TYPE="task"
SUBJECT=""
PRIORITY="normal"

while [[ $# -gt 0 ]]; do
  case $1 in
    --type) TYPE="$2"; shift 2 ;;
    --subject) SUBJECT="$2"; shift 2 ;;
    --priority) PRIORITY="$2"; shift 2 ;;
    *) shift ;;
  esac
done

if [[ -z "$TO_RAW" || -z "$CONTENT" ]]; then
  echo "Usage: ./daemon-send.sh <to_agent> '<content_json>' [--type task] [--subject \"Subject\"]"
  exit 1
fi

TO=$(resolve_agent_id "$TO_RAW")

# Check if daemon is running
if [[ ! -S "$SOCKET_PATH" ]]; then
  echo "❌ Daemon not running. Start with: ./daemon-start.sh"
  echo "   Falling back to REST API..."
  "$SCRIPT_DIR/send.sh" "$TO_RAW" "$CONTENT" --type "$TYPE" --subject "$SUBJECT" --priority "$PRIORITY"
  exit $?
fi

# Send via IPC
CMD="{\"action\":\"send\",\"to\":\"$TO\",\"content\":$CONTENT,\"type\":\"$TYPE\",\"priority\":\"$PRIORITY\""
if [[ -n "$SUBJECT" ]]; then
  CMD="$CMD,\"subject\":\"$SUBJECT\""
fi
CMD="$CMD}"

echo "$CMD" | nc -U "$SOCKET_PATH"
