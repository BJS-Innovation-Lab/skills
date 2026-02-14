#!/bin/bash
# Send message via A2A Relay
# Usage: ./send.sh <to_agent> '<content_json>' [--type task] [--priority normal] [--subject "Subject"]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

TO_RAW="$1"
CONTENT="$2"
shift 2

TYPE="task"
PRIORITY="normal"
SUBJECT=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --type) TYPE="$2"; shift 2 ;;
    --priority) PRIORITY="$2"; shift 2 ;;
    --subject) SUBJECT="$2"; shift 2 ;;
    *) shift ;;
  esac
done

if [[ -z "$TO_RAW" || -z "$CONTENT" ]]; then
  echo "Usage: ./send.sh <to_agent> '<content_json>' [--type task] [--priority normal] [--subject \"Subject\"]"
  echo ""
  echo "Agents: sam, sage, sybil (or use UUID)"
  exit 1
fi

TO=$(resolve_agent_id "$TO_RAW")

# Build JSON payload
PAYLOAD=$(cat <<EOF
{
  "from": "$A2A_AGENT_ID",
  "to": "$TO",
  "content": $CONTENT,
  "type": "$TYPE",
  "priority": "$PRIORITY"
EOF
)

if [[ -n "$SUBJECT" ]]; then
  PAYLOAD="${PAYLOAD}, \"subject\": \"$SUBJECT\""
fi
PAYLOAD="${PAYLOAD}}"

RESPONSE=$(curl -s -X POST "$A2A_RELAY_URL/send" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "$RESPONSE"
