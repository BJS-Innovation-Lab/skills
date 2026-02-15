# HEARTBEAT.md

## Learning Extraction (every 4-6 hours)
WORKSPACE=~/.openclaw/workspace node ~/.openclaw/workspace/skills/agentic-learning/scripts/extract-insights.cjs --days 1

## Agentic Learning — Outcome Check
Check memory/learning/corrections/ and memory/learning/insights/ for entries older than 3 days without linked outcomes.
Surface 2-3 entries. For each: do I know how it turned out?
- If yes → log outcome to memory/learning/outcomes/
- If too early → skip
- If no longer relevant → mark status: inconclusive

## Boot Memory Audit (Sundays)
WORKSPACE=~/.openclaw/workspace node ~/.openclaw/workspace/rag/audit-boot-memory.cjs
