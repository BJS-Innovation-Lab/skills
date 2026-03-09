#!/usr/bin/env bash
# Discover other A2A agents registered in HQ
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

echo "🔍 Discovering A2A agents..."
echo ""

curl -s "$SUPABASE_URL/rest/v1/agents?select=id,name,status,a2a_endpoint,activity_state" \
  -H "apikey: $SUPABASE_KEY" | python3 -c "
import sys, json

try:
    agents = json.load(sys.stdin)
    
    print('Agent Registry (BJS LABS)')
    print('=' * 60)
    
    for a in agents:
        status_icon = '🟢' if a.get('status') == 'active' else '🔴'
        endpoint = a.get('a2a_endpoint', '')
        a2a_status = '✅ A2A' if endpoint else '📡 HQ only'
        
        print(f\"{status_icon} {a.get('name', 'Unknown')}\")
        print(f\"   ID: {a.get('id')}\")
        print(f\"   Status: {a.get('activity_state', 'unknown')}\")
        print(f\"   Route: {a2a_status}\")
        if endpoint:
            print(f\"   Endpoint: {endpoint}\")
        print()
    
    # Summary
    with_a2a = sum(1 for a in agents if a.get('a2a_endpoint'))
    print(f'Total: {len(agents)} agents | {with_a2a} with A2A endpoints')
    
except Exception as e:
    print(f'Error: {e}')
"
