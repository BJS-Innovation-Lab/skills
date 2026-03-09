#!/bin/bash
# Send message via daemon (instant if connected)
# Usage: ./daemon-send.sh <to_agent> '{"message": "hello"}' [--type task] [--subject "Subject"]
# 
# For large messages, use --file to read content from a file:
#   ./daemon-send.sh <to_agent> --file /path/to/content.json [--type task]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

DATA_DIR="${A2A_DATA_DIR:-$HOME/.openclaw/a2a}"
SOCKET_PATH="$DATA_DIR/daemon.sock"

TO_RAW="$1"
shift

# Check for --file mode
CONTENT=""
FILE_MODE=false
if [[ "$1" == "--file" ]]; then
  FILE_MODE=true
  FILE_PATH="$2"
  shift 2
  if [[ ! -f "$FILE_PATH" ]]; then
    echo "❌ File not found: $FILE_PATH"
    exit 1
  fi
  CONTENT=$(cat "$FILE_PATH")
else
  CONTENT="$1"
  shift
fi

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
  echo "       ./daemon-send.sh <to_agent> --file /path/to/content.json [--type task]"
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

# Build JSON properly using python/node to avoid shell interpolation issues
# This handles special chars, newlines, and large payloads safely
if command -v python3 &>/dev/null; then
  CMD=$(python3 -c "
import json, sys
msg = {
    'action': 'send',
    'to': sys.argv[1],
    'content': json.loads(sys.argv[2]),
    'type': sys.argv[3],
    'priority': sys.argv[4]
}
subject = sys.argv[5] if len(sys.argv) > 5 and sys.argv[5] else None
if subject:
    msg['subject'] = subject
print(json.dumps(msg))
" "$TO" "$CONTENT" "$TYPE" "$PRIORITY" "$SUBJECT" 2>/dev/null)

  if [[ $? -ne 0 || -z "$CMD" ]]; then
    # Fallback: try wrapping content as string if it's not valid JSON
    CMD=$(python3 -c "
import json, sys
msg = {
    'action': 'send',
    'to': sys.argv[1],
    'content': {'message': sys.argv[2]},
    'type': sys.argv[3],
    'priority': sys.argv[4]
}
subject = sys.argv[5] if len(sys.argv) > 5 and sys.argv[5] else None
if subject:
    msg['subject'] = subject
print(json.dumps(msg))
" "$TO" "$CONTENT" "$TYPE" "$PRIORITY" "$SUBJECT")
  fi
else
  # No python3 — fall back to shell interpolation (old behavior)
  CMD="{\"action\":\"send\",\"to\":\"$TO\",\"content\":$CONTENT,\"type\":\"$TYPE\",\"priority\":\"$PRIORITY\""
  if [[ -n "$SUBJECT" ]]; then
    CMD="$CMD,\"subject\":\"$SUBJECT\""
  fi
  CMD="$CMD}"
fi

# Send via IPC — use printf to handle large payloads properly
printf '%s\n' "$CMD" | nc -U "$SOCKET_PATH"
