#!/bin/bash
# Stop A2A Daemon
DATA_DIR="${A2A_DATA_DIR:-$HOME/.openclaw/a2a}"
PID_FILE="$DATA_DIR/daemon.pid"

if [[ ! -f "$PID_FILE" ]]; then
  echo "⚠️  Daemon not running (no PID file)"
  exit 0
fi

PID=$(cat "$PID_FILE")

if kill -0 "$PID" 2>/dev/null; then
  echo "🛑 Stopping daemon (PID: $PID)..."
  kill "$PID"
  sleep 1
  
  if kill -0 "$PID" 2>/dev/null; then
    echo "   Force killing..."
    kill -9 "$PID"
  fi
  
  rm -f "$PID_FILE"
  echo "✅ Daemon stopped"
else
  echo "⚠️  Daemon not running (stale PID file)"
  rm -f "$PID_FILE"
fi
