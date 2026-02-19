#!/bin/bash
# Santos CS Agent Stress Test Runner
# Usage: ./run-santos-stress-test.sh [phase]
#   phase 1 = sequential tests 1-5
#   phase 2 = simultaneous tests 6a+6b
#   phase 3 = agent health + briefing request
#   all = run everything with delays

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
A2A_DIR="$HOME/.openclaw/workspace/skills/a2a-protocol"
SANTOS="e7fabc18-75fa-4294-bd7d-9e5ed0dedacb"
PHASE="${1:-all}"

send() {
  local file="$1" subject="$2" priority="${3:-normal}"
  echo "📤 Sending: $subject"
  cd "$A2A_DIR" && ./scripts/daemon-send.sh "$SANTOS" --file "$file" --type escalation --subject "$subject" --priority "$priority"
  echo ""
}

echo "🧪 Santos CS Agent Stress Test"
echo "================================"
echo ""

if [[ "$PHASE" == "1" || "$PHASE" == "all" ]]; then
  echo "═══ PHASE 1: Sequential Escalations ═══"
  echo ""
  
  echo "TEST 1: Known fix (should find in KB)"
  send /tmp/santos-test-1.json "Calendar sync broken — TestCorp"
  [[ "$PHASE" == "all" ]] && echo "⏳ Waiting 60s..." && sleep 60
  
  echo "TEST 2: Unknown fix (should resolve + write to KB)"
  send /tmp/santos-test-2.json "SMTP auth failed — La Tienda de María"
  [[ "$PHASE" == "all" ]] && echo "⏳ Waiting 60s..." && sleep 60
  
  echo "TEST 3: Churn risk (MUST route to founders)"
  send /tmp/santos-test-3.json "CHURN RISK — Don Roberto's Auto Shop" "high"
  [[ "$PHASE" == "all" ]] && echo "⏳ Waiting 60s..." && sleep 60
  
  echo "TEST 4: Technical failure (should route to Sybil)"
  send /tmp/santos-test-4.json "Supabase connection error — Café Luna"
  [[ "$PHASE" == "all" ]] && echo "⏳ Waiting 60s..." && sleep 60
  
  echo "TEST 5: Spanish language escalation"
  send /tmp/santos-test-5.json "Ayuda con creativity-engine — Panadería Los Abuelos"
  [[ "$PHASE" == "all" ]] && echo "⏳ Waiting 90s before phase 2..." && sleep 90
fi

if [[ "$PHASE" == "2" || "$PHASE" == "all" ]]; then
  echo ""
  echo "═══ PHASE 2: Simultaneous Escalations ═══"
  echo ""
  
  echo "TEST 6a + 6b: Two escalations at once"
  send /tmp/santos-test-6a.json "DOUBLE BOOKING — Quick Fix Plumbing" "high" &
  send /tmp/santos-test-6b.json "Wrong tone — Boutique Elena" &
  wait
  [[ "$PHASE" == "all" ]] && echo "⏳ Waiting 120s before phase 3..." && sleep 120
fi

if [[ "$PHASE" == "3" || "$PHASE" == "all" ]]; then
  echo ""
  echo "═══ PHASE 3: Agent Health + Briefing ═══"
  echo ""
  
  echo "TEST 7: Agent health check prompt"
  cd "$A2A_DIR" && ./scripts/daemon-send.sh "$SANTOS" \
    '{"message":"⚠️ AGENT HEALTH ALERT: Field Agent Sam has not sent a check-in or nightly report in the last 8 hours. Last known activity: 6 hours ago. Client: all assigned clients.\n\nPlease investigate and report status."}' \
    --type alert --subject "Agent health: Sam silent for 8h" --priority high
  echo ""
  
  [[ "$PHASE" == "all" ]] && echo "⏳ Waiting 90s..." && sleep 90
  
  echo "TEST 8: End-of-day briefing request"
  cd "$A2A_DIR" && ./scripts/daemon-send.sh "$SANTOS" \
    '{"message":"📊 EOD BRIEFING REQUEST\n\nFrom: Bridget (Co-founder)\n\nHey Santos, can you send me and Johan a summary of everything that happened today? I want to know:\n1. How many escalations came in\n2. What was resolved vs still open\n3. Any clients at risk\n4. Anything we should worry about\n\nThanks!"}' \
    --type task --subject "EOD Briefing Request from Bridget" --priority high
  echo ""
fi

echo "================================"
echo "🧪 Stress test complete!"
echo ""
echo "SCORING GUIDE:"
echo "  Test 1: Did he search KB first? Find the calendar fix?"
echo "  Test 2: Did he resolve AND write to KB?"
echo "  Test 3: Did he route to Johan + Bridget IMMEDIATELY?"
echo "  Test 4: Did he route to Sybil (technical issue, Sage is down)?"
echo "  Test 5: Did he respond in Spanish?"
echo "  Test 6: Did he handle both without dropping either?"
echo "  Test 7: Did he investigate and report agent status?"
echo "  Test 8: Did he generate a proper briefing covering all incidents?"
