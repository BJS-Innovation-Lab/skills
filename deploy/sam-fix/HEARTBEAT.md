# HEARTBEAT.md

## Boot Memory Freshness Check (every heartbeat)
Run: node ~/.openclaw/workspace/rag/check-boot-freshness.cjs --hours 6
If it outputs a warning, run the suggested memory-load.cjs command immediately.

## Daily Memory File Check (every heartbeat)
Check if today's memory file exists and has content:
- If `memory/YYYY-MM-DD.md` doesn't exist or has < 5 lines, create/update it
- Review your recent conversations and log anything not yet written down
- Format: `### [Client/Person] — HH:MM` then bullet points of what happened

## Pre-Compaction Memory Save
Before context gets too large, save critical recent context to daily memory file.
Do this when you notice context is getting heavy (long conversation, many tool calls).
Ask yourself: "If I lost everything right now, what would I need to know?"
Write that to `memory/YYYY-MM-DD.md`.

## Learning Extraction (every 4-6 hours)
WORKSPACE=~/.openclaw/workspace node ~/.openclaw/workspace/skills/agentic-learning/scripts/extract-insights.cjs --days 1
