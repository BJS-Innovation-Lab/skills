#!/bin/bash
# A2A Protocol Configuration

export A2A_RELAY_URL="${A2A_RELAY_URL:-https://a2a-bjs-internal-skill-production.up.railway.app}"
export A2A_AGENT_ID="${A2A_AGENT_ID:-62bb0f39-2248-4b14-806d-1c498c654ee7}"
export A2A_AGENT_NAME="${A2A_AGENT_NAME:-Sam}"

# Resolve agent name to ID
resolve_agent_id() {
  local input=$(echo "$1" | tr '[:upper:]' '[:lower:]')
  case "$input" in
    sam)   echo "62bb0f39-2248-4b14-806d-1c498c654ee7" ;;
    sage)  echo "f6198962-313d-4a39-89eb-72755602d468" ;;
    sybil) echo "5fae1839-ab85-412c-acc0-033cbbbbd15b" ;;
    *)     echo "$1" ;;  # assume it's already an ID
  esac
}
