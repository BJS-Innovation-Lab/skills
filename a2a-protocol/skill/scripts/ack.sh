#!/bin/bash
# Acknowledge/clear messages from inbox
# Usage: ./ack.sh [message_id1 message_id2 ...] (or no args to clear all)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

if [[ $# -eq 0 ]]; then
  # Clear all
  curl -s -X POST "$A2A_RELAY_URL/inbox/$A2A_AGENT_ID/ack" \
    -H "Content-Type: application/json" \
    -d '{}'
else
  # Ack specific messages
  IDS=$(printf '"%s",' "$@")
  IDS="[${IDS%,}]"
  curl -s -X POST "$A2A_RELAY_URL/inbox/$A2A_AGENT_ID/ack" \
    -H "Content-Type: application/json" \
    -d "{\"messageIds\": $IDS}"
fi
