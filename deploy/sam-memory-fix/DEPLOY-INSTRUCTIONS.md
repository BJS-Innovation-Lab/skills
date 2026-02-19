# Sam Memory Fix — Deploy Instructions

## What This Fixes
Your memory files got contaminated with Santos's and Sybil's data during the identity crisis (Feb 17).
These are clean replacements built from YOUR actual conversation data and client work.

## Files to Replace
Copy these files to your workspace, OVERWRITING the existing ones:

```bash
# Main boot memory
cp MEMORY.md ~/.openclaw/workspace/MEMORY.md

# Core memory files (these had Santos/Sybil data)
cp memory/core/team.md ~/.openclaw/workspace/memory/core/team.md
cp memory/core/reflections.md ~/.openclaw/workspace/memory/core/reflections.md
cp memory/core/procedures.md ~/.openclaw/workspace/memory/core/procedures.md
cp memory/core/resources.md ~/.openclaw/workspace/memory/core/resources.md
```

## What's NOT Changed
- `memory/core/knowledge.md` — clean, keep as-is
- `memory/core/promoted.md` — clean, keep as-is
- `memory/learning/` — all clean, keep as-is
- `clients/` — all clean, keep as-is
- `IDENTITY.md` — already correct
- Daily logs (memory/2026-02-*.md) — kept as-is (historical record)

## After Deploy
Run memory sync to push clean files to Supabase:
```bash
node rag/sync-memory.cjs --force
```
