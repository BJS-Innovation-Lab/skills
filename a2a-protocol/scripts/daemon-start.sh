#!/bin/bash
# Start A2A Daemon in background
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DAEMON_DIR="$SCRIPT_DIR/../daemon"
DATA_DIR="${A2A_DATA_DIR:-$HOME/.openclaw/a2a}"
PID_FILE="$DATA_DIR/daemon.pid"

source "$SCRIPT_DIR/_config.sh"

# Check if already running
if [[ -f "$PID_FILE" ]]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "⚠️  Daemon already running (PID: $PID)"
    exit 0
  fi
fi

# Ensure dependencies
cd "$DAEMON_DIR"
if [[ ! -d "node_modules" ]]; then
  echo "📦 Installing dependencies..."
  npm install --silent
fi

# Start daemon
echo "🚀 Starting A2A Daemon..."
export A2A_RELAY_URL
export A2A_AGENT_ID
export A2A_AGENT_NAME
export A2A_DATA_DIR="$DATA_DIR"

# Telegram instant notifications (configured via setup.sh or _config.sh)
# No 1Password dependency - tokens come from _config.sh
export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
export TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:--5165191591}"
export TELEGRAM_AGENT_TAG="${TELEGRAM_AGENT_TAG:-}"

if [[ -z "$TELEGRAM_BOT_TOKEN" ]]; then
  echo "ℹ️  Telegram not configured (optional - run setup.sh to configure)"
fi

# Ensure openclaw CLI is in PATH for system event triggers
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

nohup node a2a-daemon.js > "$DATA_DIR/daemon.out" 2>&1 &
echo $! > "$PID_FILE"

sleep 1

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "✅ Daemon started (PID: $(cat "$PID_FILE"))"
  echo "   Logs: $DATA_DIR/daemon.log"
  echo "   Status: $DATA_DIR/status.json"
else
  echo "❌ Failed to start daemon"
  exit 1
fi
