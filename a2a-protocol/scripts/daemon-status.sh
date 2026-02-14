#!/bin/bash
# Check A2A Daemon status
DATA_DIR="${A2A_DATA_DIR:-$HOME/.openclaw/a2a}"
PID_FILE="$DATA_DIR/daemon.pid"
STATUS_FILE="$DATA_DIR/status.json"

echo "🔗 A2A Daemon Status"
echo "===================="

# Check if running
if [[ -f "$PID_FILE" ]]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "🟢 Running (PID: $PID)"
  else
    echo "🔴 Not running (stale PID)"
  fi
else
  echo "🔴 Not running"
fi

# Show status file
if [[ -f "$STATUS_FILE" ]]; then
  echo ""
  echo "📊 Status:"
  cat "$STATUS_FILE"
fi

# Show recent logs
LOG_FILE="$DATA_DIR/daemon.log"
if [[ -f "$LOG_FILE" ]]; then
  echo ""
  echo "📜 Recent logs:"
  tail -5 "$LOG_FILE"
fi
