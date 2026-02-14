#!/bin/bash
# A2A Health Check - Verifica que todo esté configurado correctamente
# No usar set -e para que muestre todos los errores

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

echo "🔍 A2A Health Check"
echo "===================="
echo ""

PASS=0
FAIL=0

check() {
  local name="$1"
  local result="$2"
  if [[ "$result" == "ok" ]]; then
    echo "✅ $name"
    PASS=$((PASS + 1))
  else
    echo "❌ $name: $result"
    FAIL=$((FAIL + 1))
  fi
}

# 1. Config check
echo "📋 Configuration"
echo "----------------"
if [[ -n "$A2A_AGENT_ID" ]]; then
  check "Agent ID configured" "ok"
  echo "   ID: $A2A_AGENT_ID"
else
  check "Agent ID configured" "A2A_AGENT_ID not set in _config.sh"
fi

if [[ -n "$A2A_AGENT_NAME" ]]; then
  check "Agent Name configured" "ok"
  echo "   Name: $A2A_AGENT_NAME"
else
  check "Agent Name configured" "A2A_AGENT_NAME not set in _config.sh"
fi

echo ""

# 2. Daemon check
echo "🔄 Daemon Status"
echo "----------------"
DATA_DIR="${A2A_DATA_DIR:-$HOME/.openclaw/a2a}"
PID_FILE="$DATA_DIR/daemon.pid"

if [[ -f "$PID_FILE" ]]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    check "Daemon running" "ok"
    echo "   PID: $PID"
  else
    check "Daemon running" "PID file exists but process not running"
  fi
else
  check "Daemon running" "Not running (no PID file)"
fi

# Check connection status
if [[ -f "$DATA_DIR/status.json" ]]; then
  CONNECTED=$(python3 -c "import json; print(json.load(open('$DATA_DIR/status.json')).get('connected', False))" 2>/dev/null || echo "false")
  if [[ "$CONNECTED" == "True" ]]; then
    check "Connected to relay" "ok"
  else
    check "Connected to relay" "Not connected"
  fi
else
  check "Connected to relay" "No status file"
fi

echo ""

# 3. Relay check
echo "🌐 Relay Connection"
echo "-------------------"
RELAY_STATUS=$(curl -s --max-time 5 "$A2A_RELAY_URL/health" 2>/dev/null || echo "error")
if [[ "$RELAY_STATUS" == *"ok"* ]] || [[ "$RELAY_STATUS" == *"healthy"* ]]; then
  check "Relay reachable" "ok"
else
  # Try agents endpoint
  AGENTS=$(curl -s --max-time 5 "$A2A_RELAY_URL/agents" 2>/dev/null || echo "error")
  if [[ "$AGENTS" == *"agents"* ]]; then
    check "Relay reachable" "ok"
  else
    check "Relay reachable" "Cannot reach $A2A_RELAY_URL"
  fi
fi

echo ""

# 4. OpenClaw check
echo "🦞 OpenClaw Integration"
echo "-----------------------"
if command -v openclaw &> /dev/null; then
  check "OpenClaw CLI installed" "ok"
  
  # Check if config is valid
  CONFIG_CHECK=$(python3 -c "import json; json.load(open('$HOME/.openclaw/openclaw.json')); print('ok')" 2>&1)
  if [[ "$CONFIG_CHECK" == "ok" ]]; then
    check "OpenClaw config valid" "ok"
  else
    check "OpenClaw config valid" "Invalid JSON in openclaw.json"
  fi
else
  check "OpenClaw CLI installed" "openclaw command not found"
fi

echo ""

# 5. Telegram check (optional)
echo "📱 Telegram (Optional)"
echo "----------------------"
if [[ -n "$TELEGRAM_BOT_TOKEN" ]]; then
  check "Telegram token configured" "ok"
  
  # Test token validity
  TG_TEST=$(curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe" 2>/dev/null || echo "error")
  if [[ "$TG_TEST" == *"\"ok\":true"* ]]; then
    check "Telegram token valid" "ok"
  else
    check "Telegram token valid" "Token invalid or network error"
  fi
else
  echo "⚪ Telegram not configured (optional)"
fi

echo ""

# 6. Data directory check
echo "📁 Data Directory"
echo "-----------------"
if [[ -d "$DATA_DIR" ]]; then
  check "Data directory exists" "ok"
  echo "   Path: $DATA_DIR"
  
  if [[ -f "$DATA_DIR/inbox.json" ]]; then
    MSG_COUNT=$(python3 -c "import json; print(len(json.load(open('$DATA_DIR/inbox.json'))))" 2>/dev/null || echo "0")
    echo "   📨 Messages in inbox: $MSG_COUNT"
  fi
else
  check "Data directory exists" "Directory not found: $DATA_DIR"
fi

echo ""
echo "===================="
echo "Results: ✅ $PASS passed, ❌ $FAIL failed"

if [[ $FAIL -gt 0 ]]; then
  echo ""
  echo "⚠️  Some checks failed. Review the issues above."
  exit 1
else
  echo ""
  echo "🎉 All checks passed! A2A is ready."
  exit 0
fi
