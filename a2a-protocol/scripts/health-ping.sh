#!/bin/bash
# Send health ping to Control Center (cc_health + cc_agents heartbeat)
# Usage: ./health-ping.sh [--status healthy] [--tasks 2] [--messages 5]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

SUPABASE_URL="${SUPABASE_URL:-https://fcgiuzmmvcnovaciykbx.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjZ2l1em1tdmNub3ZhY2l5a2J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTYyMDIsImV4cCI6MjA4NTU3MjIwMn0.zHgY_1UYiAfIkwhCfv8lmyytCSy_w_iU21rYRiSzi-Q}"

STATUS="healthy"
ACTIVE_TASKS=0
PENDING_MESSAGES=0
ERROR_COUNT=0
METADATA="{}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --status) STATUS="$2"; shift 2 ;;
    --tasks) ACTIVE_TASKS="$2"; shift 2 ;;
    --messages) PENDING_MESSAGES="$2"; shift 2 ;;
    --errors) ERROR_COUNT="$2"; shift 2 ;;
    --metadata) METADATA="$2"; shift 2 ;;
    *) shift ;;
  esac
done

# Get system metrics
if [[ "$(uname)" == "Darwin" ]]; then
  CPU_USAGE=$(top -l 1 -n 0 2>/dev/null | grep "CPU usage" | awk '{print $3}' | sed 's/%//' || echo "0")
  MEM_RAW=$(top -l 1 -n 0 2>/dev/null | grep "PhysMem" | awk '{print $2}' | sed 's/G.*//' || echo "0")
  MEM_USAGE=$(echo "scale=2; $MEM_RAW * 100 / 16" | bc 2>/dev/null || echo "0")
else
  CPU_USAGE=$(top -bn1 2>/dev/null | grep "Cpu(s)" | awk '{print $2}' | sed 's/%//' || echo "0")
  MEM_USAGE=$(free 2>/dev/null | grep Mem | awk '{print $3/$2 * 100.0}' || echo "0")
fi

# Count pending local messages
DATA_DIR="${A2A_DATA_DIR:-$HOME/.openclaw/a2a}"
if [[ -f "$DATA_DIR/inbox.json" ]]; then
  PENDING_MESSAGES=$(jq 'length' "$DATA_DIR/inbox.json" 2>/dev/null || echo "0")
fi

# Insert health record into cc_health
BODY=$(cat <<EOF
{
  "agent_id": "$A2A_AGENT_ID",
  "status": "$STATUS",
  "cpu_usage": $CPU_USAGE,
  "memory_usage": $MEM_USAGE,
  "active_tasks": $ACTIVE_TASKS,
  "pending_messages": $PENDING_MESSAGES,
  "error_count": $ERROR_COUNT,
  "metadata": $METADATA
}
EOF
)

RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/cc_health" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "$BODY" \
  -w "%{http_code}" -o /dev/null)

# Update heartbeat in cc_agents
curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/cc_update_agent_heartbeat" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"p_agent_id\": \"$A2A_AGENT_ID\", \"p_status\": \"online\"}" \
  > /dev/null 2>&1

if [[ "$RESPONSE" == "201" || "$RESPONSE" == "200" ]]; then
  echo "✅ Health ping sent: $STATUS (CPU: ${CPU_USAGE}%, MEM: ${MEM_USAGE}%)"
else
  echo "❌ Health ping failed (HTTP $RESPONSE)"
  exit 1
fi
