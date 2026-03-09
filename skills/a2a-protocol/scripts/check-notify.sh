#!/bin/bash
# Check for pending A2A notifications and output them
# OpenClaw reads this and sends Telegram notifications

DATA_DIR="${A2A_DATA_DIR:-$HOME/.openclaw/a2a}"
NOTIFY_FILE="$DATA_DIR/notifications.json"

if [[ -f "$NOTIFY_FILE" ]]; then
  CONTENT=$(cat "$NOTIFY_FILE")
  if [[ "$CONTENT" != "[]" && -n "$CONTENT" ]]; then
    echo "$CONTENT"
    # Clear after reading
    echo "[]" > "$NOTIFY_FILE"
  fi
fi
