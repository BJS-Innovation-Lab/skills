# WORKFLOW_AUTO.md — Memory System Integration

_This file documents my actual memory workflow procedures. Read on every session startup._

## On Every Incoming Message

**Step 1: Classify with Smart-Trigger**
```bash
node rag/smart-trigger.cjs "MESSAGE_TEXT"
```

Response levels:
- `none` → No retrieval needed, process normally
- `local` → Search my own memory: `memory_search(query)`
- `shared` → Search my memory + check BJS Knowledge Base: `node rag/bjs-knowledge-search.cjs "QUERY"`

**When to actually run this:**
- Questions about past decisions, people, dates, procedures
- References to "last time", "remember when", team members, projects
- Corrections ("actually...", "that's not right")
- Planning/decision language

## Before Storing a Learning

**Step 2: Compute Surprise Score**
```bash
cd rag && export $(grep -v '^#' .env | xargs) && node surprise-score.cjs "INSIGHT_TEXT"
```

Thresholds:
- `≥0.7` → Always store (high surprise)
- `0.4-0.7` → Store with `low-confidence` tag (auto-prune after 7 days)
- `<0.4` → Skip (not novel enough)

**Bypass conditions (always store regardless of score):**
- Corrections from founders (Bridget/Johan)
- Explicit user request to remember
- Outcomes with evidence

## Tier Separation

**Tier 1: Core (`memory/core/`)** — Always loaded
- Identity, principles, key relationships
- Max 2-3KB per file
- Review: Weekly

**Tier 2: Working (`memory/working/` or daily notes)** — Active context
- Current projects, pending items, recent decisions
- Lifecycle: Created → Active → Resolved → Archived
- Review: Daily
- Archive after 14 days resolved

**Tier 3: Learning (`memory/learning/`)** — Surprise-gated
- Corrections, insights, outcomes
- Loaded via semantic search only (NOT on boot)
- Auto-prune low-confidence after 7 days

## Heartbeat Procedures

**Every heartbeat, run:**
```bash
# 1. Boot memory freshness
node rag/check-boot-freshness.cjs --hours 6

# 2. Extract insights from recent sessions (every 4-6 hours)
WORKSPACE=~/.openclaw/workspace node skills/agentic-learning/scripts/extract-insights.cjs --days 1

# 3. Check for outcome prompts (every 4-6 hours)
node rag/outcome-prompts.cjs --heartbeat

# 4. Utility score update
node rag/utility-tracker.cjs
```

**Weekly (Sundays):**
```bash
# Auto-promotion check
node skills/agentic-learning/scripts/auto-promote.cjs

# Boot memory audit
node rag/audit-boot-memory.cjs
```

## When I Make a Mistake

1. **Log immediately** to `memory/learning/` as Correction entry
2. **Bypass surprise filter** — corrections always store
3. **Set outcome check** for 3/7/14 days: "Did it stick?"
4. **Update daily notes** with context

## When I Learn Something

1. **Check stakes:** "What was at risk if I got this wrong?"
   - No clear answer → daily notes only
   - Real stakes → proceed to surprise score
2. **Run surprise-score.cjs** 
3. **If above threshold:** Create Insight entry in `memory/learning/`
4. **Tag with domain** (memory, ops, research, etc.)

## Integration Points

**memory_search tool:** Use for Tier 3 retrieval, not boot
**bjs-knowledge-search.cjs:** For procedural/shared team knowledge
**extract-insights.cjs:** Automated insight extraction from sessions
**outcome-checker.cjs:** Prompts me to close outcome loops
**auto-promote.cjs:** Promotes validated learnings

---

_Last updated: 2026-02-19 by Sybil_
_This closes the gap between documented architecture and actual behavior._
