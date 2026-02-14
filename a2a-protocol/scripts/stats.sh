#!/bin/bash
# Get A2A relay server stats
# Usage: ./stats.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

curl -s "$A2A_RELAY_URL/stats"
