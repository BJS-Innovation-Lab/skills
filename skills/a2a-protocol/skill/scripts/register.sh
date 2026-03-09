#!/usr/bin/env bash
# Register A2A endpoint with HQ so other agents can discover you
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

HOST=""
PORT="$MY_PORT"

while [[ $# -gt 0 ]]; do
  case $1 in
    --host) HOST="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    *) shift ;;
  esac
done

if [[ -z "$HOST" ]]; then
  echo "Usage: register.sh --host YOUR-IP-OR-HOSTNAME --port 8001" >&2
  echo ""
  echo "Example: register.sh --host 192.168.1.100 --port 8001" >&2
  exit 1
fi

ENDPOINT="http://$HOST:$PORT/a2a"
echo "📝 Registering A2A endpoint: $ENDPOINT"

# Update agent record in HQ with A2A endpoint
RESPONSE=$(curl -s -X PATCH "$SUPABASE_URL/rest/v1/agents?id=eq.$MY_AGENT_ID" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{\"a2a_endpoint\": \"$ENDPOINT\"}" \
  -w "%{http_code}" -o /dev/null)

if [[ "$RESPONSE" == "204" ]]; then
  echo "✅ Endpoint registered successfully"
  echo "   Other agents can now reach you directly at: $ENDPOINT"
else
  echo "❌ Failed to register (HTTP $RESPONSE)"
  exit 1
fi
