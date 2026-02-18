#!/bin/bash
# disk-cleanup.sh — Monthly disk cleanup for OpenClaw agents
# Deletes old session transcripts and inbound media.
# Client files (workspace/clients/) are NEVER touched.
#
# Usage: node -e "..." or bash disk-cleanup.sh
# Cron: 1st of every month, 3 AM agent timezone

set -e

DAYS=${1:-30}
TRANSCRIPT_DIR="$HOME/.openclaw/agents/main/sessions"
MEDIA_DIR="$HOME/.openclaw/media/inbound"
WS="${WORKSPACE:-$HOME/.openclaw/workspace}"
LOG_FILE="$WS/memory/cleanup-log.md"

echo "🧹 Disk Cleanup — $(date '+%Y-%m-%d %H:%M')"
echo "Retention: ${DAYS} days"
echo ""

# --- Transcripts ---
if [ -d "$TRANSCRIPT_DIR" ]; then
  BEFORE=$(du -sh "$TRANSCRIPT_DIR" 2>/dev/null | cut -f1)
  COUNT=$(find "$TRANSCRIPT_DIR" -name "*.jsonl" -mtime +${DAYS} 2>/dev/null | wc -l | tr -d ' ')
  
  if [ "$COUNT" -gt 0 ]; then
    find "$TRANSCRIPT_DIR" -name "*.jsonl" -mtime +${DAYS} -delete
    AFTER=$(du -sh "$TRANSCRIPT_DIR" 2>/dev/null | cut -f1)
    echo "📝 Transcripts: deleted $COUNT files older than ${DAYS} days ($BEFORE → $AFTER)"
  else
    echo "📝 Transcripts: nothing to clean ($BEFORE, all within ${DAYS} days)"
  fi
else
  echo "📝 Transcripts: directory not found"
fi

# --- Inbound media ---
if [ -d "$MEDIA_DIR" ]; then
  BEFORE=$(du -sh "$MEDIA_DIR" 2>/dev/null | cut -f1)
  COUNT=$(find "$MEDIA_DIR" -type f -mtime +${DAYS} 2>/dev/null | wc -l | tr -d ' ')
  
  if [ "$COUNT" -gt 0 ]; then
    find "$MEDIA_DIR" -type f -mtime +${DAYS} -delete
    AFTER=$(du -sh "$MEDIA_DIR" 2>/dev/null | cut -f1)
    echo "📎 Media: deleted $COUNT files older than ${DAYS} days ($BEFORE → $AFTER)"
  else
    echo "📎 Media: nothing to clean ($BEFORE, all within ${DAYS} days)"
  fi
else
  echo "📎 Media: directory not found"
fi

# --- Never touch these ---
echo ""
echo "🔒 Protected (never deleted):"
echo "   - $WS/clients/ (client files, PDFs, docs)"
echo "   - $WS/memory/ (daily logs, core knowledge)"
echo "   - $WS/MEMORY.md, SOUL.md, IDENTITY.md"

# --- Log it ---
mkdir -p "$(dirname "$LOG_FILE")"
echo "" >> "$LOG_FILE"
echo "## Cleanup $(date '+%Y-%m-%d %H:%M')" >> "$LOG_FILE"
echo "- Transcripts: $COUNT deleted (>${DAYS} days)" >> "$LOG_FILE"
echo "- Media: cleaned" >> "$LOG_FILE"

echo ""
echo "✅ Done"
