#!/bin/bash
# Setup Tailscale Funnel for instant agent messaging
# Run this on each agent's machine

set -e

AGENT_ID="${AGENT_ID:-$(whoami)}"
PORT="${NOTIFIER_PORT:-3456}"

echo "🔧 Setting up instant notifications for: $AGENT_ID"
echo ""

# Check if Tailscale is installed
if ! command -v tailscale &> /dev/null; then
    if [[ -f "/Applications/Tailscale.app/Contents/MacOS/Tailscale" ]]; then
        TAILSCALE="/Applications/Tailscale.app/Contents/MacOS/Tailscale"
    else
        echo "❌ Tailscale not installed!"
        echo "   Install from: https://tailscale.com/download"
        exit 1
    fi
else
    TAILSCALE="tailscale"
fi

# Check Tailscale status
echo "📡 Checking Tailscale connection..."
if ! $TAILSCALE status &> /dev/null; then
    echo "❌ Tailscale not connected!"
    echo "   Run: $TAILSCALE up"
    exit 1
fi

# Get machine name
MACHINE_NAME=$($TAILSCALE status --json | grep -o '"Self":{"[^"]*' | head -1 | cut -d'"' -f4 || hostname)
echo "✅ Connected as: $MACHINE_NAME"

# Check if notifier dependencies are installed
SKILL_DIR="$(dirname "$0")/.."
if [[ ! -d "$SKILL_DIR/node_modules" ]]; then
    echo "📦 Installing dependencies..."
    cd "$SKILL_DIR"
    npm install dotenv @supabase/supabase-js express 2>/dev/null
fi

# Start notifier in background
echo "🔔 Starting message notifier on port $PORT..."
cd "$SKILL_DIR"
AGENT_ID="$AGENT_ID" nohup node scripts/message-notifier.cjs > /tmp/message-notifier-$AGENT_ID.log 2>&1 &
NOTIFIER_PID=$!
sleep 2

if lsof -i :$PORT &> /dev/null; then
    echo "✅ Notifier running (PID: $NOTIFIER_PID)"
else
    echo "❌ Notifier failed to start"
    cat /tmp/message-notifier-$AGENT_ID.log
    exit 1
fi

# Enable Funnel
echo "🌐 Enabling Tailscale Funnel..."
$TAILSCALE funnel $PORT &
sleep 3

# Get the funnel URL
FUNNEL_URL=$($TAILSCALE funnel status 2>&1 | grep "https://" | head -1 | awk '{print $1}')

if [[ -z "$FUNNEL_URL" ]]; then
    echo "⚠️  Funnel may need to be enabled in Tailscale admin"
    echo "   Visit: https://login.tailscale.com/admin/acls"
    echo "   Or check: $TAILSCALE funnel status"
else
    echo "✅ Funnel URL: $FUNNEL_URL"
    echo ""
    echo "📝 Next step: Register this URL in Supabase"
    echo "   Run this SQL:"
    echo ""
    echo "   UPDATE known_agents"
    echo "   SET webhook_url = '$FUNNEL_URL'"
    echo "   WHERE agent_id = '$AGENT_ID';"
fi

echo ""
echo "🎉 Setup complete for $AGENT_ID!"
echo ""
echo "To test, send a message:"
echo "  AGENT_ID=someone node scripts/agent-messaging.cjs send $AGENT_ID \"Test!\""
