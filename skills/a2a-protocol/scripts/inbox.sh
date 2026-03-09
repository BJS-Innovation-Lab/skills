#!/bin/bash
# Check A2A inbox for pending messages
# Usage: ./inbox.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

curl -s "$A2A_RELAY_URL/inbox/$A2A_AGENT_ID"
