---
name: memory-retriever
description: "DEPRECATED for simple searches. Use built-in memory_search tool instead. This sub-agent approach is only for complex multi-hop queries that require reasoning across many files."
metadata: {"openclaw":{"emoji":"🔍"}}
---

# Memory Retriever — UPDATED 2026-03-07

## ⚠️ Important Change

**For most searches, use the built-in `memory_search` tool instead of this sub-agent.**

| Need | What to Use |
|------|-------------|
| Simple memory search | `memory_search` tool (built-in) |
| Read specific file | `memory_get` or `Read` tool |
| Other agents' data | Query Supabase directly (see below) |
| Complex multi-hop reasoning | Sub-agent (this skill) — RARE |

### Why the Change

The old approach (spawning sub-agents for every search) was:
- Slow (spawn delay)
- Expensive (extra tokens)
- Overkill for simple lookups

The built-in `memory_search` tool works better for 95% of cases.

---

## When to Use Built-in Tools (DEFAULT)

### Your Own Memory
```
memory_search({ query: "your search term" })
```
Searches: memory/*.md, memory/core/*.md, topics/*.md

### Specific File
```
memory_get path="memory/2026-03-07.md"
```

### Other Agents' Data (Rare)
```bash
source rag/.env && curl -s "$SUPABASE_URL/rest/v1/documents?content=ilike.*QUERY*&select=metadata,content&limit=5" -H "apikey: $SUPABASE_ANON_KEY"
```

---

## When to Use Sub-Agent Retriever (RARE)

Only spawn a memory-retriever sub-agent when you need:
- **Multi-hop reasoning** across 5+ files
- **Contradiction detection** between sources
- **Deep temporal analysis** (what changed over time)
- **Cross-agent synthesis** (combining info from multiple agents)

If you're just looking something up, **don't spawn a sub-agent**.

---

## Sub-Agent Usage (When Needed)

```javascript
sessions_spawn({
  task: "<your complex query>",
  label: "memory-retriever",
  model: "sonnet"
})
```

### Multi-Hop Query Template
```
I need deep context on [TOPIC] from BJS LABS internal memory.

Phase 1 — Direct search:
Search memory/*.md, memory/core/*.md, memory/working/*.md for [TOPIC].

Phase 2 — Entity expansion:
From Phase 1 results, identify related people, projects, dates.
Search for THOSE entities to find connected context.

Phase 3 — Cross-reference:
Check A2A logs for communications about this topic.
Verify consistency — flag any contradictions between sources.

Phase 4 — Synthesize:
Return a coherent narrative (max 300 words) that answers:
- What happened?
- What was decided?
- What's the current state?

Include confidence score (high/medium/low).
```

### Contradiction Detection Template
```
Search BJS LABS internal memory files for conflicting information about [TOPIC].

Flag:
- Timeline inconsistencies
- Conflicting statuses
- "Fixed" followed by "still broken"
- Duplicate or conflicting claims

Cross-reference timestamps. Show your reasoning.
```

---

## Deleted Scripts

The following scripts have been **DELETED** (as of 2026-03-07):

- ❌ `search-memory.cjs` — was adding noise, use built-in tools instead
- ❌ `auto-retrieve.cjs` — over-engineered, not needed

---

## Summary

| Complexity | Approach |
|------------|----------|
| Simple lookup | `memory_search` tool |
| Read a file | `memory_get` or `Read` |
| Cross-agent data | Supabase query |
| Multi-hop reasoning | Sub-agent (rare) |

**Default to built-in tools. Only spawn sub-agents for genuinely complex queries.**
