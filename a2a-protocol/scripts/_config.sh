#!/bin/bash
# A2A Protocol Configuration

export A2A_RELAY_URL="${A2A_RELAY_URL:-https://a2a-bjs-internal-skill-production-f15e.up.railway.app}"
# IMPORTANT: Each agent MUST set A2A_AGENT_ID and A2A_AGENT_NAME in their environment
# No defaults — prevents identity mixups (e.g., agent registering as wrong agent on relay)
if [[ -z "$A2A_AGENT_ID" || -z "$A2A_AGENT_NAME" ]]; then
  # Check for local config file
  LOCAL_CONFIG="${A2A_DATA_DIR:-$HOME/.openclaw/a2a}/agent.conf"
  if [[ -f "$LOCAL_CONFIG" ]]; then
    source "$LOCAL_CONFIG"
  else
    echo "❌ A2A_AGENT_ID and A2A_AGENT_NAME not set."
    echo "   Option 1: export A2A_AGENT_ID='your-uuid' A2A_AGENT_NAME='YourName'"
    echo "   Option 2: Create $LOCAL_CONFIG with those exports"
    echo ""
    echo "   Agent IDs:"
    echo "     Sybil:  5fae1839-ab85-412c-acc0-033cbbbbd15b"
    echo "     Saber:  415a84a4-af9e-4c98-9d48-040834436e44"
    echo "     Sam:    62bb0f39-2248-4b14-806d-1c498c654ee7"
    echo "     Santos: e7fabc18-75fa-4294-bd7d-9e5ed0dedacb"
    echo "     Sage:   f6198962-313d-4a39-89eb-72755602d468"
    exit 1
  fi
fi

# Supabase Configuration (for Control Center)
export SUPABASE_URL="${SUPABASE_URL:-https://fcgiuzmmvcnovaciykbx.supabase.co}"
export SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjZ2l1em1tdmNub3ZhY2l5a2J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTYyMDIsImV4cCI6MjA4NTU3MjIwMn0.zHgY_1UYiAfIkwhCfv8lmyytCSy_w_iU21rYRiSzi-Q}"
export A2A_ORG_ID="${A2A_ORG_ID:-6420346e-4e6a-47a8-b671-80beacd394b4}"

# Resolve agent name to ID
resolve_agent_id() {
  local input=$(echo "$1" | tr '[:upper:]' '[:lower:]')
  case "$input" in
    sybil)  echo "5fae1839-ab85-412c-acc0-033cbbbbd15b" ;;
    saber)  echo "415a84a4-af9e-4c98-9d48-040834436e44" ;;
    sam)    echo "62bb0f39-2248-4b14-806d-1c498c654ee7" ;;
    santos) echo "e7fabc18-75fa-4294-bd7d-9e5ed0dedacb" ;;
    sage)   echo "f6198962-313d-4a39-89eb-72755602d468" ;;
    *)      echo "$1" ;;  # assume it's already an ID
  esac
}
