#!/bin/bash
# Transcript analyzer for AI Team Dynamics research
# Extracts key interactions from OpenClaw session logs and A2A messages

SESSIONS_DIR="$HOME/.openclaw/agents/main/sessions"
A2A_INBOX="$HOME/.openclaw/a2a/inbox.json"
OUTPUT_DIR="$HOME/.openclaw/workspace/research/ai-team-dynamics/data"
mkdir -p "$OUTPUT_DIR"

echo "=== AI Team Dynamics - Transcript Analysis ==="
echo "Date: $(date)"
echo ""

# 1. Session stats
echo "## Session Overview"
TOTAL=$(ls "$SESSIONS_DIR"/*.jsonl 2>/dev/null | wc -l | tr -d ' ')
echo "Total sessions: $TOTAL"
echo ""

# 2. A2A interaction summary
echo "## A2A Interactions"
if [ -f "$A2A_INBOX" ]; then
  echo "Messages by sender:"
  python3 -c "
import json
with open('$A2A_INBOX') as f:
    data = json.load(f)
msgs = data.get('messages', data) if isinstance(data, dict) else data
by_sender = {}
by_type = {}
for m in msgs:
    sender = m.get('fromName', 'unknown')
    mtype = m.get('type', 'unknown')
    by_sender[sender] = by_sender.get(sender, 0) + 1
    by_type[mtype] = by_type.get(mtype, 0) + 1
for s, c in sorted(by_sender.items(), key=lambda x: -x[1]):
    print(f'  {s}: {c} messages')
print()
print('Messages by type:')
for t, c in sorted(by_type.items(), key=lambda x: -x[1]):
    print(f'  {t}: {c}')
" 2>/dev/null
fi
echo ""

# 3. Memory file timeline
echo "## Memory Timeline"
for f in "$HOME/.openclaw/workspace/memory"/2026-*.md; do
  DATE=$(basename "$f" .md)
  LINES=$(wc -l < "$f" | tr -d ' ')
  SECTIONS=$(grep -c "^## " "$f" 2>/dev/null || echo 0)
  echo "  $DATE: $LINES lines, $SECTIONS sections"
done
echo ""

# 4. SOUL.md change log (via git if available)
echo "## SOUL.md Evolution"
cd "$HOME/.openclaw/workspace" 2>/dev/null
if git log --oneline SOUL.md 2>/dev/null | head -5; then
  echo ""
else
  echo "  (no git history available)"
  echo "  Current sections:"
  grep "^## " SOUL.md 2>/dev/null | sed 's/^/  /'
fi
echo ""

# 5. Skill usage frequency
echo "## Skill Usage (from transcripts)"
grep -rh 'SKILL.md' "$SESSIONS_DIR"/*.jsonl 2>/dev/null | 
  grep -o 'skills/[a-zA-Z0-9_-]*/SKILL.md' | 
  sort | uniq -c | sort -rn | head -15 | sed 's/^/  /'
echo ""

echo "=== Analysis complete ==="
