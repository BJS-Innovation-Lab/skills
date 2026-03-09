#!/bin/bash
# List all agents and their status
# Usage: ./agents.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

curl -s "$A2A_RELAY_URL/agents"
