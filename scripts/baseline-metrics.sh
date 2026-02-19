#!/bin/bash
# Sybil's Baseline Memory Metrics Tracker
# Run bi-daily to compare against Saber's agentic-learning system

WORKSPACE=~/.openclaw/workspace
OUTPUT_FILE="$WORKSPACE/learning-baseline/metrics-$(date +%Y-%m-%d).json"
mkdir -p "$WORKSPACE/learning-baseline"

# Memory file sizes
MEMORY_MD_SIZE=$(stat -f%z "$WORKSPACE/MEMORY.md" 2>/dev/null || echo 0)
DAILY_MEMORY_SIZE=$(du -sk "$WORKSPACE/memory" 2>/dev/null | cut -f1 || echo 0)
LEARNINGS_SIZE=$(du -sk "$WORKSPACE/.learnings" 2>/dev/null | cut -f1 || echo 0)

# File counts
DAILY_FILES=$(ls -1 "$WORKSPACE/memory/"*.md 2>/dev/null | wc -l | tr -d ' ')
LEARNINGS_COUNT=$(grep -c "^## \[" "$WORKSPACE/.learnings/LEARNINGS.md" 2>/dev/null || echo 0)
ERRORS_COUNT=$(grep -c "^## \[" "$WORKSPACE/.learnings/ERRORS.md" 2>/dev/null || echo 0)

# A2A metrics
A2A_INBOX_SIZE=$(wc -l < ~/.openclaw/a2a/inbox.json 2>/dev/null || echo 0)
A2A_NOTIFICATIONS=$(cat ~/.openclaw/a2a/notifications.json 2>/dev/null | jq 'length' || echo 0)

# Generate JSON
cat > "$OUTPUT_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "agent": "Sybil",
  "system": "baseline (simple memory)",
  "storage": {
    "memory_md_bytes": $MEMORY_MD_SIZE,
    "daily_memory_kb": $DAILY_MEMORY_SIZE,
    "learnings_kb": $LEARNINGS_SIZE,
    "total_kb": $((DAILY_MEMORY_SIZE + LEARNINGS_SIZE))
  },
  "counts": {
    "daily_memory_files": $DAILY_FILES,
    "learnings_logged": $LEARNINGS_COUNT,
    "errors_logged": $ERRORS_COUNT
  },
  "a2a": {
    "inbox_lines": $A2A_INBOX_SIZE,
    "pending_notifications": $A2A_NOTIFICATIONS
  }
}
EOF

echo "✅ Baseline metrics saved to $OUTPUT_FILE"
cat "$OUTPUT_FILE"
