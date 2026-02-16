# HEARTBEAT.md

## Learning Extraction (every 4-6 hours)
WORKSPACE=~/.openclaw/workspace node ~/.openclaw/workspace/skills/agentic-learning/scripts/extract-insights.cjs --days 1

## Outcome Check via Sub-Agent (every 4-6 hours)
Run: node ~/.openclaw/workspace/skills/agentic-learning/scripts/outcome-checker.cjs
If entries found, spawn a Sonnet sub-agent to evaluate evidence and log outcomes.

## Pre-Compaction Memory Save
Before context gets too large, save critical recent context:
node ~/.openclaw/workspace/skills/memory-retriever/scripts/pre-compaction-save.cjs "summary"
Do this when you notice context is getting heavy (long conversation, many tool calls).

## Memory Retrieval Protocol
For any question requiring precision (commits, dates, who said what, action items):
- Spawn Sonnet sub-agent with memory retriever instead of relying on main context
- Use: node ~/.openclaw/workspace/skills/memory-retriever/scripts/search-supabase.cjs "query" --sources all
- For auto-detection: node ~/.openclaw/workspace/skills/memory-retriever/scripts/auto-retrieve.cjs "message"

## Utility Score Update (every 4-6 hours)
node ~/.openclaw/workspace/rag/utility-tracker.cjs

## Auto-Promotion Check (Sundays)
WORKSPACE=~/.openclaw/workspace node ~/.openclaw/workspace/skills/agentic-learning/scripts/auto-promote.cjs

## Boot Memory Audit (Sundays)
WORKSPACE=~/.openclaw/workspace node ~/.openclaw/workspace/rag/audit-boot-memory.cjs
