#!/bin/bash
# Check daemon inbox (locally cached messages)
DATA_DIR="${A2A_DATA_DIR:-$HOME/.openclaw/a2a}"
INBOX_FILE="$DATA_DIR/inbox.json"
SOCKET_PATH="$DATA_DIR/daemon.sock"

# Try IPC first
if [[ -S "$SOCKET_PATH" ]]; then
  echo '{"action":"inbox"}' | nc -U "$SOCKET_PATH"
elif [[ -f "$INBOX_FILE" ]]; then
  cat "$INBOX_FILE"
else
  echo '{"messages":[]}'
fi
