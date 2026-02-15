---
name: memory-retriever
description: Sub-agent memory retrieval system. Spawns a Sonnet sub-agent to search memory files, A2A logs, and learning entries — returns concise summaries without bloating the main session's context window.
metadata: {"openclaw":{"emoji":"🔍"}}
---

# Memory Retriever — Sub-Agent Memory Search

## Overview

Instead of loading dozens of memory files into your context window, spawn a lightweight sub-agent to search, reason, and return only what you need.

**Why:** Every file you read eats context. After reading 10 daily logs + A2A history + learning entries, you've burned thousands of tokens before the conversation even starts. The memory retriever does the heavy lifting in an isolated context and returns a tight summary.

## V1 — General Memory Retriever

### When to Use

Spawn a memory retriever when:
- Someone asks about something you don't have in context
- You need to search A2A history ("what did Santos say about X?")
- You need to check learning entries before a task
- You need cross-day context ("what happened last week with client Y?")
- You want team status without reading everyone's files

### How to Use

```
sessions_spawn({
  task: "<your query — see templates below>",
  label: "memory-retriever",
  model: "anthropic/claude-sonnet-4-20250514"
})
```

### Query Templates

**General memory search:**
```
Search my memory files for information about [TOPIC].

Sources to check:
- memory/*.md (daily logs)
- memory/core/*.md (persistent facts)
- memory/working/*.md (active tasks)
- MEMORY.md (boot memory)

Return:
1. Direct answer (2-3 sentences)
2. Key details as bullet points (max 5)
3. Source files with line numbers
4. Confidence: high/medium/low

If nothing found, say so. Don't guess.
```

**A2A communication search:**
```
Search A2A communication logs for messages about [TOPIC].

Check these files:
- memory/a2a-*.md (auto-logged A2A messages)
- memory/working/threads/*.md (conversation threads)
- memory/*.md (daily logs that mention A2A messages)

I need to know:
1. Who said what, and when
2. Any commitments or action items
3. Current status (resolved/pending/blocked)

Return as a timeline with [date] Agent: summary format.
```

**Learning system check:**
```
Search the learning system for entries relevant to [TOPIC/TASK].

Check:
- memory/learning/corrections/*.md — past mistakes relevant to this
- memory/learning/insights/*.md — insights that apply
- memory/learning/outcomes/*.md — how similar situations turned out

Return:
1. Relevant corrections (things to avoid)
2. Relevant insights (things to apply)
3. Outcome patterns (what worked/didn't)

Max 5 entries. Most relevant first.
```

**Team status check:**
```
Compile current team status from available memory files.

Check:
- memory/team-highlights.md (latest sync)
- memory/a2a-*.md (recent messages)
- memory/working/*.md (active tasks)
- memory/*.md (today + yesterday daily logs)

Return a table:
| Agent | Last Active | Current Task | Blockers |
Format as markdown. Flag anyone inactive >24h.
```

**Pre-task context load:**
```
I'm about to work on [TASK/CLIENT]. Load relevant context.

Search all memory sources for:
- Previous work on this task/client
- Decisions already made
- Commitments to the client or team
- Known issues or gotchas
- Brand voice / preferences (if client work)

Return as a structured briefing, max 500 words.
```

## V2 — Smart Memory Retriever

### Enhancements Over V1

V2 adds reasoning, multi-hop search, confidence scoring, and source cross-referencing.

### Multi-Hop Reasoning

When a simple search isn't enough, the retriever chains searches:

```
Search Phase 1: Find mentions of [TOPIC] in daily logs
  → Extract related entities (people, projects, dates)
Search Phase 2: Search for those entities to find connected context
  → Cross-reference with A2A logs
Search Phase 3: Check learning entries for relevant corrections/insights
  → Synthesize everything into a coherent answer
```

**Query template for multi-hop:**
```
I need deep context on [TOPIC]. This may require multi-hop reasoning.

Phase 1 — Direct search:
Search memory/*.md, memory/core/*.md, memory/working/*.md for [TOPIC].

Phase 2 — Entity expansion:
From Phase 1 results, identify related people, projects, dates, decisions.
Search for THOSE entities to find connected context I might have missed.

Phase 3 — Cross-reference:
Check A2A logs (memory/a2a-*.md) for communications about this topic.
Check learning entries for relevant corrections/insights.
Verify consistency — flag any contradictions between sources.

Phase 4 — Synthesize:
Return a coherent narrative (max 300 words) that answers:
- What happened?
- What was decided?
- What's the current state?
- What should I know before acting?

Include confidence score (high/medium/low) and list any gaps.
```

### Confidence Scoring

The retriever scores its own confidence:

- **HIGH** — Found direct, recent, consistent mentions across multiple sources
- **MEDIUM** — Found relevant info but it's older, incomplete, or from single source
- **LOW** — Only tangential mentions, or sources conflict with each other
- **NONE** — Nothing found. Recommend asking the user or team.

### Source Cross-Referencing

When the retriever finds info from multiple sources, it checks for consistency:

```
Source A (daily log 02-15): "Santos has org tokens"
Source B (A2A log): "Santos still waiting for org tokens"
→ CONFLICT DETECTED: Flag both, note timestamps, let main agent decide.
```

### Contradiction Detection

**Simple (check new info):**
```
Check if [NEW INFORMATION] contradicts anything in my memory.

Search all sources for claims about [TOPIC].
Compare against: [NEW INFORMATION]

Return:
1. Consistent sources (support the new info)
2. Contradicting sources (conflict with new info)
3. Assessment: Is this an update, a correction, or a genuine conflict?
```

**Open-Ended (autonomous search):**
```
Contradiction detection for [TOPIC]:

Search all available sources for conflicting information.
You decide which sources to check and in what order.

Flag:
- Timeline inconsistencies
- Conflicting statuses ("working" vs "silently failing")
- "Fixed" followed by "still broken"
- Duplicate or conflicting claims
- Version/date mismatches

Cross-reference timestamps. Show your reasoning.
```

> **Key insight (Test Case 9):** The retriever performs *better* with open-ended prompts
> than rigid templates. It autonomously checked GitHub issues, changelogs, and cross-temporal
> memory files — sources not prescribed in the prompt. This suggests memory retrievers benefit
> from autonomy in search strategy, not just synthesis. See `benchmark/test-case-9-contradiction-detection.md`.

### Temporal Awareness

The retriever understands time context:

```
What was the state of [TOPIC] as of [DATE]?

Search memory files up to (but not after) [DATE].
Ignore any information from after that date.
This is important — I need the historical state, not current state.
```

### Memory Gap Detection

```
Analyze my memory coverage for [TOPIC/TIME PERIOD].

Check what I have vs what I should have:
- Daily logs: Are there gaps? Missing days?
- A2A logs: Am I missing conversations I should have records of?
- Learning entries: Have I logged corrections/insights for known issues?

Return:
1. Coverage summary (what I have)
2. Detected gaps (what's missing)
3. Recommendations (what to backfill)
```

## Architecture Notes

### Model Selection
- **V1:** `anthropic/claude-sonnet-4-20250514` — fast, cheap, good at retrieval
- **V2 multi-hop:** Same model, but with `thinking: "low"` for reasoning chains
- **Never use Opus for retrieval** — it's overkill for search tasks, save it for creative/analytical work

### Token Budget
- Sub-agent reads files (input tokens are cheap with Sonnet)
- Output should be **under 500 tokens** for V1, **under 1000 tokens** for V2
- If the retriever is returning more than that, the query is too broad — decompose it

### Caching Strategy
- Frequently asked queries (team status, recent A2A) can be cached as files
- `memory/cache/team-status.md` — refreshed every heartbeat
- `memory/cache/recent-a2a-summary.md` — refreshed every 30 min
- Main agent reads cache file instead of spawning sub-agent for common queries

### Error Handling
- If sub-agent times out → return partial results + "search incomplete" flag
- If no files found → return "no memory files matching your query" (don't hallucinate)
- If too many results → return top 5 by relevance + note "X more results available, narrow your query"

## Integration with Existing Systems

### Works With
- **Agentic Learning** — retriever can search learning entries before tasks
- **A2A Memory Logger** — retriever searches auto-logged A2A conversations
- **Memory Sync (RAG)** — retriever can use Supabase vector search for semantic queries
- **Boot Memory Audit** — retriever can check MEMORY.md accuracy against source files

### Supabase Integration (CORE — Not Optional)

The retriever searches THREE sources simultaneously:

1. **Local files** — keyword search across memory/*.md, working/, learning/
2. **RAG embeddings** — semantic vector search in Supabase (agent-specific documents)
3. **BJS Knowledge Base** — shared KB with procedures, best practices, tool guides

**The sub-agent should run the unified search tool:**

```bash
# Search all sources
node skills/memory-retriever/scripts/search-supabase.cjs "your query" --sources all

# Search specific sources
node skills/memory-retriever/scripts/search-supabase.cjs "calendar fix" --sources kb
node skills/memory-retriever/scripts/search-supabase.cjs "Santos tokens" --sources rag,files

# Different agent's memory
node skills/memory-retriever/scripts/search-supabase.cjs "client status" --agent santos

# Output as JSON for programmatic use
node skills/memory-retriever/scripts/search-supabase.cjs "pricing" --json
```

**Why all three matter:**
- **Files** catch things not yet synced to Supabase (last 30 min)
- **RAG** finds semantically similar content even with different wording
- **KB** surfaces team-wide knowledge the agent might not have locally

The retriever sub-agent should ALWAYS use `--sources all` unless there's a specific reason to narrow it.

## Usage Examples

### Example 1: Simple Lookup
**Main agent receives:** "What was the decision about Santos's role?"
**Main agent thinks:** I don't have this in context.
**Spawns:**
```
sessions_spawn({
  task: 'Search memory for the decision about Santos role change. Check daily logs and A2A messages from Feb 14-15. Return: what was decided, who decided, when.',
  label: 'memory-retriever',
  model: 'anthropic/claude-sonnet-4-20250514'
})
```
**Gets back:** "Johan decided on Feb 15 that Santos moves to CS Agent, Sam moves to Field Agent. Source: memory/2026-02-15-session3.md#L42. Confidence: HIGH."

### Example 2: Multi-Hop (V2)
**Main agent receives:** "Is Santos ready to provision infra for a client?"
**Spawns V2 multi-hop:**
```
Phase 1: Search for Santos + infra/provisioning/tokens
→ Finds: "Santos needs org tokens" (daily log), "Santos has tokens" (Johan said today)
Phase 2: Expand — search for org tokens, GitHub PAT, Supabase management
→ Finds: Conflicting info — daily log says pending, Johan says done
Phase 3: Check A2A — any messages from Santos confirming?
→ Finds: Santos confirmed setup but didn't mention tokens specifically
Phase 4: Synthesize
→ "MEDIUM confidence: Johan says Santos has tokens, but Santos hasn't explicitly confirmed receiving them via A2A. Recommend asking Santos directly."
```

### Example 3: Pre-Task Briefing (V2)
**Main agent about to work on:** Café Bonito content
**Spawns:**
```
Load all context about Café Bonito client.
```
**Gets back:** Brand profile, previous content created, María's preferences, price point ($5.50 lattes), tone (elegante pero cálido), known issue (wrong price incident), prevention protocol in place.

## Tools

### Unified Search (search-supabase.cjs)
Three-source search: local files + RAG embeddings + BJS Knowledge Base.

### Auto-Retrieve (auto-retrieve.cjs)
Smart-trigger classifier → automatic search. Pass a message, it decides if retrieval is needed and runs the search if so. Returns JSON with trigger decision + results.

```bash
node skills/memory-retriever/scripts/auto-retrieve.cjs "what did Santos say about tokens?"
# → triggered: true, tier: shared, 23 results

node skills/memory-retriever/scripts/auto-retrieve.cjs "hey how's it going"
# → triggered: false, no search
```

### Outcome Checker (outcome-checker.cjs)
Scans learning entries for corrections/insights without outcomes, then uses the retriever to search for evidence. Replaces manual file scanning.

```bash
node skills/agentic-learning/scripts/outcome-checker.cjs           # Check 3+ day old entries
node skills/agentic-learning/scripts/outcome-checker.cjs --min-age 0  # Check all entries
node skills/agentic-learning/scripts/outcome-checker.cjs --json       # For sub-agent consumption
```

### Pre-Compaction Save (pre-compaction-save.cjs)
Emergency memory dump before context compaction. Appends timestamped snapshot to daily log.

```bash
node skills/memory-retriever/scripts/pre-compaction-save.cjs "Bridget approved the callback rule for A2A. Commit a9a0b34."
```

**When to use:** When you notice context is getting heavy (long conversation, many tool calls, approaching compaction). Save critical recent context that might be lost.

## Benchmark Results

Tested Feb 15, 2026 (7 queries by Sybil + Saber):
- **memory_search (built-in):** 40% miss rate, avg 0.6 results, avg 38% confidence
- **Sub-agent retriever:** 0% miss rate, avg 15.9 results, multi-source corroboration
- Sub-agent wins on precision (commits, timestamps, line numbers), gap detection, source citations
- Built-in wins on speed (no spawn delay)
- Full benchmark: `research/memory-retriever-benchmark.md`

## Critical Rule: MEMORY.md Curation Stays Manual

The sub-agent retriever is SUPPLEMENTAL, not a replacement for curated boot memory. 

**Risk:** If agents stop curating MEMORY.md because "the retriever will find it," boot context quality degrades over time. The retriever can't help if the agent doesn't know what to ASK for.

**Rule:** MEMORY.md must always contain:
- Identity + core principles (who am I, how do I operate)
- Active goals (what am I working on right now)
- Key pointers (where to find detailed context)
- Recent learning (what changed recently)

The retriever handles everything else — detailed history, cross-references, evidence, precision lookups.

## For All Agents

This skill works for every agent in the team. Each agent searches their OWN memory files. The retriever sub-agent inherits the spawning agent's file access.

**Santos** might search: escalation history, client interactions, infra status
**Sam** might search: client brand profiles, content created, deploy history
**Saber** might search: research findings, brand docs, learning entries
**Sybil** might search: team coordination, research, architecture decisions
