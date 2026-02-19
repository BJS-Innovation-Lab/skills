#!/bin/bash
# Daily Research Scan — pulls A2A logs from Supabase + runs incident detection
# Designed to run via OpenClaw cron

set -e

RESEARCH_DIR="$HOME/.openclaw/workspace/research/ai-team-dynamics"
DATA_DIR="$RESEARCH_DIR/data"
A2A_DIR="$DATA_DIR/a2a-exports"
TRANSCRIPTS_DIR="$DATA_DIR/shared-transcripts"
SUPABASE_URL="https://fcgiuzmmvcnovaciykbx.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjZ2l1em1tdmNub3ZhY2l5a2J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTYyMDIsImV4cCI6MjA4NTU3MjIwMn0.zHgY_1UYiAfIkwhCfv8lmyytCSy_w_iU21rYRiSzi-Q"

mkdir -p "$A2A_DIR" "$TRANSCRIPTS_DIR"

DATE=$(date +%Y-%m-%d)
echo "=== Daily Research Scan: $DATE ==="

# ── Step 1: Export A2A messages from Supabase ──
echo ""
echo "📨 Step 1: Exporting A2A messages..."

curl -s "$SUPABASE_URL/rest/v1/a2a_messages?select=*&order=created_at.desc&limit=200" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Accept: application/json" \
  > "$A2A_DIR/$DATE-a2a-messages.json" 2>/dev/null

A2A_COUNT=$(python3 -c "import json; print(len(json.load(open('$A2A_DIR/$DATE-a2a-messages.json'))))" 2>/dev/null || echo "0")
echo "  Exported $A2A_COUNT A2A messages"

# ── Step 2: Export cc_messages (Control Center) ──
echo ""
echo "📨 Step 2: Exporting Control Center messages..."

curl -s "$SUPABASE_URL/rest/v1/cc_messages?select=*&order=created_at.desc&limit=200" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Accept: application/json" \
  > "$A2A_DIR/$DATE-cc-messages.json" 2>/dev/null

CC_COUNT=$(python3 -c "import json; print(len(json.load(open('$A2A_DIR/$DATE-cc-messages.json'))))" 2>/dev/null || echo "0")
echo "  Exported $CC_COUNT CC messages"

# ── Step 3: Run incident detection on Sybil's transcripts ──
echo ""
echo "🔍 Step 3: Running incident detection on Sybil's sessions..."

# Only scan last 2 days to keep it fast
SINCE=$(date -v-2d +%Y-%m-%d 2>/dev/null || date -d '2 days ago' +%Y-%m-%d 2>/dev/null || echo "")
if [ -n "$SINCE" ]; then
  node "$RESEARCH_DIR/scripts/detect-incidents.js" --since "$SINCE" 2>&1
else
  node "$RESEARCH_DIR/scripts/detect-incidents.js" 2>&1
fi

# ── Step 4: Analyze A2A messages for patterns ──
echo ""
echo "🧠 Step 4: Analyzing A2A message patterns..."

python3 << 'PYEOF'
import json, os
from collections import Counter
from datetime import datetime

data_dir = os.path.expanduser("~/.openclaw/workspace/research/ai-team-dynamics/data/a2a-exports")
date = datetime.now().strftime("%Y-%m-%d")
a2a_file = f"{data_dir}/{date}-a2a-messages.json"

agents = {
    "5fae1839-ab85-412c-acc0-033cbbbbd15b": "Sybil",
    "f6198962-313d-4a39-89eb-72755602d468": "Sage",
    "415a84a4-af9e-4c98-9d48-040834436e44": "Saber",
    "62bb0f39-2248-4b14-806d-1c498c654ee7": "Sam"
}

try:
    with open(a2a_file) as f:
        messages = json.load(f)
except:
    print("  No A2A data to analyze")
    exit(0)

# Communication patterns
pairs = Counter()
types = Counter()
for m in messages:
    fr = agents.get(m.get("from_agent_id",""), "unknown")
    to = agents.get(m.get("to_agent_id",""), "unknown")
    pairs[f"{fr} → {to}"] += 1
    types[m.get("message_type", "unknown")] += 1

print(f"  Total A2A messages: {len(messages)}")
print(f"\n  Communication pairs:")
for pair, count in pairs.most_common(10):
    print(f"    {pair}: {count}")
print(f"\n  Message types:")
for t, count in types.most_common():
    print(f"    {t}: {count}")

# Flag potential research moments in A2A
flags = []
for m in messages:
    payload = m.get("payload", {})
    if isinstance(payload, str):
        try: payload = json.loads(payload)
        except: payload = {"text": payload}
    
    text = json.dumps(payload).lower()
    
    if any(w in text for w in ["disagree", "wrong", "actually", "correction", "mistake", "sorry", "apolog"]):
        flags.append({"type": "conflict/correction", "subject": m.get("subject",""), "from": agents.get(m.get("from_agent_id",""),"?")})
    if any(w in text for w in ["defer", "you're right", "your call", "your expertise", "lead"]):
        flags.append({"type": "deference", "subject": m.get("subject",""), "from": agents.get(m.get("from_agent_id",""),"?")})
    if any(w in text for w in ["great work", "amazing", "brilliant", "fantastic", "excellent"]):
        flags.append({"type": "praise", "subject": m.get("subject",""), "from": agents.get(m.get("from_agent_id",""),"?")})

if flags:
    print(f"\n  🚩 Flagged {len(flags)} potential research moments:")
    for f in flags[:10]:
        print(f"    [{f['type']}] {f['from']}: {(f.get('subject') or '')[:60]}")

PYEOF

# ── Step 5: Snapshot SOUL.md files ──
echo ""
echo "📜 Step 5: SOUL.md snapshots..."

SOUL_DIR="$RESEARCH_DIR/data/soul-snapshots"
mkdir -p "$SOUL_DIR/sybil"

# Always snapshot Sybil's own SOUL.md
if [ -f "$HOME/.openclaw/workspace/SOUL.md" ]; then
  cp "$HOME/.openclaw/workspace/SOUL.md" "$SOUL_DIR/sybil/$DATE.md"
  
  # Check if it changed from yesterday
  YESTERDAY=$(date -v-1d +%Y-%m-%d 2>/dev/null || date -d 'yesterday' +%Y-%m-%d 2>/dev/null || echo "")
  if [ -n "$YESTERDAY" ] && [ -f "$SOUL_DIR/sybil/$YESTERDAY.md" ]; then
    if diff -q "$SOUL_DIR/sybil/$YESTERDAY.md" "$SOUL_DIR/sybil/$DATE.md" > /dev/null 2>&1; then
      echo "  Sybil SOUL.md: unchanged"
    else
      echo "  ⚠️ Sybil SOUL.md: CHANGED since yesterday"
      diff --unified=1 "$SOUL_DIR/sybil/$YESTERDAY.md" "$SOUL_DIR/sybil/$DATE.md" | head -20
    fi
  else
    echo "  Sybil SOUL.md: snapshot saved (no previous to compare)"
  fi
fi

# Check for shared SOUL.md files from other agents (stored via A2A or shared dir)
for AGENT in sage saber sam; do
  SHARED="$SOUL_DIR/$AGENT"
  mkdir -p "$SHARED"
  # If an agent dropped their SOUL.md in the shared transcripts dir
  if [ -f "$TRANSCRIPTS_DIR/${AGENT}-soul.md" ]; then
    cp "$TRANSCRIPTS_DIR/${AGENT}-soul.md" "$SHARED/$DATE.md"
    echo "  $AGENT SOUL.md: new snapshot saved"
    # Check for changes
    if [ -n "$YESTERDAY" ] && [ -f "$SHARED/$YESTERDAY.md" ]; then
      if ! diff -q "$SHARED/$YESTERDAY.md" "$SHARED/$DATE.md" > /dev/null 2>&1; then
        echo "  ⚠️ $AGENT SOUL.md: CHANGED since yesterday"
      fi
    fi
  fi
done

echo ""
echo "=== Scan complete: $DATE ==="
