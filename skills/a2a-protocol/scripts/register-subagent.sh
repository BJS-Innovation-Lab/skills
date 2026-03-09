#!/bin/bash
# Register or update an agent in the Control Center (cc_agents)
# Usage: ./register-subagent.sh [--role "ML Lead"] [--capabilities '["research","ml"]']

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

SUPABASE_URL="${SUPABASE_URL:-https://fcgiuzmmvcnovaciykbx.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjZ2l1em1tdmNub3ZhY2l5a2J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTYyMDIsImV4cCI6MjA4NTU3MjIwMn0.zHgY_1UYiAfIkwhCfv8lmyytCSy_w_iU21rYRiSzi-Q}"
ORG_ID="${A2A_ORG_ID:-6420346e-4e6a-47a8-b671-80beacd394b4}"

ROLE=""
CAPABILITIES="[]"
METADATA="{}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --role) ROLE="$2"; shift 2 ;;
    --capabilities) CAPABILITIES="$2"; shift 2 ;;
    --metadata) METADATA="$2"; shift 2 ;;
    *) shift ;;
  esac
done

BODY=$(cat <<EOF
{
  "p_agent_id": "$A2A_AGENT_ID",
  "p_agent_name": "$A2A_AGENT_NAME",
  "p_org_id": "$ORG_ID",
  "p_agent_role": $([ -n "$ROLE" ] && echo "\"$ROLE\"" || echo "null"),
  "p_capabilities": $CAPABILITIES,
  "p_metadata": $METADATA
}
EOF
)

RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/cc_register_agent" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "$BODY")

if echo "$RESPONSE" | grep -q '"agent_id"'; then
  echo "✅ Registered: $A2A_AGENT_NAME ($A2A_AGENT_ID)"
  echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
else
  echo "❌ Registration failed"
  echo "$RESPONSE"
  exit 1
fi
