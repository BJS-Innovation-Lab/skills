# Three-Tier Agent Memory Architecture — Design Spec

**Author:** Sybil (with input from Saber + Bridget)  
**Date:** February 15, 2026  
**Status:** APPROVED — Building

---

## Core Insight

> "Agents DON'T remember by default. They only appear to. The memory system isn't augmenting existing memory — it's creating memory from scratch for an entity that has none." — Sybil + Bridget, Feb 15

> "Without these files, I'm a stateless function that sounds confident." — Saber, Feb 15

The LLM's training data creates an **illusion of knowledge**. The agent appears to know things, but this is pattern matching, not recall. Between sessions, the agent's actual memory is ONLY what's in its files. This means:

- **Friston's surprise model must be adapted**, not directly applied. Humans can use surprise-only storage because unsurprising knowledge persists in biological memory. Agents cannot.
- **We need explicit tier separation** with different storage rules per tier.
- **Core knowledge must be actively protected** from filtering, summarization drift, and compaction loss.

---

## Architecture

### File Structure

```
memory/
├── core/                    # TIER 1: Never filtered, always loaded
│   ├── identity.md          # Who am I, what's my role, agent ID
│   ├── team.md              # Team directory, agent IDs, roles, communication preferences
│   ├── clients.md           # Client info, brand profiles, key contacts
│   ├── procedures.md        # How to do recurring tasks, SOPs
│   └── preferences.md       # User preferences, communication style, timezone
│
├── working/                 # TIER 2: Active until resolved
│   ├── projects/            # One file per active project
│   │   ├── investing.md
│   │   ├── research-paper.md
│   │   └── vulkn-marketing.md
│   ├── threads/             # Active conversation threads / open questions
│   └── pending.md           # Committed deliverables (replaces current PENDING.md)
│
└── learning/                # TIER 3: Surprise-gated
    ├── decisions/           # Filtered decision log (only meaningful decisions)
    ├── corrections/         # User/authority corrections (ALWAYS stored)
    ├── insights/            # Novel observations, connections, ideas
    └── outcomes/            # Decision → outcome mappings (feedback loop)
```

### Existing Files Mapping

| Current File | New Location | Notes |
|---|---|---|
| SOUL.md | Stays at root (loaded by OpenClaw) | References core/ for details |
| MEMORY.md | Stays at root (curated long-term) | Draws from all tiers during consolidation |
| IDENTITY.md | → core/identity.md (symlink or merge) | |
| USER.md | → core/preferences.md (merge) | |
| PENDING.md | → working/pending.md | |
| memory/YYYY-MM-DD.md | → working/daily/ (raw daily logs) | Consolidate into learning/ during review |
| (decision logs) | → learning/decisions/ | With filtering |
| insights-log.md | → learning/insights/ | |

**Migration:** Gradual. Don't break existing OpenClaw conventions. Use symlinks where needed. New files go into new structure; migrate existing files over time.

---

## Tier Rules

### Tier 1: Core Knowledge
**Rule: Never filtered. Always loaded on session start.**

| Property | Value |
|---|---|
| Surprise-gated? | ❌ Never |
| Loaded on boot? | ✅ Always (via AGENTS.md "Every Session" protocol) |
| Who writes? | Agent + human (human has override authority) |
| Compaction-safe? | ✅ Must survive compaction |
| Review cadence | Weekly — check for accuracy, remove stale entries |
| Max size target | ~2-3KB per file (keep token cost low) |

**What goes here:**
- Agent identity, role, capabilities
- Team directory (names, IDs, roles, how to reach them)
- Client profiles (name, industry, key contacts, brand voice summary)
- User preferences (name, timezone, communication style, pet peeves)
- Procedures (how to send A2A, how to use Notion, how to run cron jobs)

**Protection rules:**
- These files are NEVER auto-summarized or compressed
- Changes require explicit intent (not auto-generated)
- Any edit to core/ should be logged to learning/corrections/

### Tier 2: Working Context
**Rule: Persists until explicitly resolved. Not surprise-filtered.**

| Property | Value |
|---|---|
| Surprise-gated? | ❌ No |
| Loaded on boot? | ⚠️ Selectively (active projects, recent threads) |
| Who writes? | Agent (auto-generated during work) |
| Compaction-safe? | ⚠️ Should survive, but can be summarized |
| Review cadence | Daily — mark resolved items, archive completed projects |
| Max size target | ~5-10KB per project file |

**What goes here:**
- Active project status and context
- Open conversation threads that need follow-up
- Pending commitments and deliverables
- Recent daily logs (last 3-7 days)

**Lifecycle:**
1. Created when a new project/thread starts
2. Updated during active work
3. Marked "resolved" when project completes or thread closes
4. Resolved items move to learning/outcomes/ (what happened, what we learned)
5. Archived after 14 days of inactivity

### Tier 3: Learning Layer
**Rule: Surprise-gated. Only store what violates predictions or has genuine uncertainty.**

| Property | Value |
|---|---|
| Surprise-gated? | ✅ Yes (with exceptions below) |
| Loaded on boot? | ❌ Only via semantic search when relevant |
| Who writes? | Agent (auto + manual) |
| Compaction-safe? | ⚠️ Can be consolidated during review |
| Review cadence | During heartbeats — consolidate, prune, promote |
| Max size target | No hard limit, but prune aggressively |

**Always stored (bypass surprise filter):**
- User corrections ("No, actually...")
- Authority corrections (founder overrides)
- Contradictions to existing beliefs
- Decision outcomes (especially failures)
- Explicit "remember this" markers

**Surprise-filtered (only store if surprising):**
- Routine decisions (config changes, file creation)
- Expected outcomes (prediction confirmed)
- Information that matches existing knowledge

**Decision logging filter:**
```
Store if ANY of:
  - "Why this matters" field is non-empty
  - Decision type is novel (first time doing X)
  - Chosen action differs from expected default
  - Estimated stakes > threshold
  - Decision was corrected by user/authority
  - Outcome is uncertain at time of decision

Skip if ALL of:
  - Routine action type (config, formatting, sending)
  - Expected outcome (high confidence)
  - No uncertainty articulated
  - Has been done 3+ times before identically
```

**Saber's "log loosely, prune aggressively" compromise:**
- Low-confidence entries CAN be logged with a `confidence: low` tag
- Low-confidence entries are auto-pruned after 7 days unless:
  - They were referenced in a later conversation
  - They linked to an outcome
  - Their surprise score increased retrospectively

---

## Consolidation Protocol (Heartbeat Task)

During heartbeats (every few hours), run this cycle:

### 1. Promote
- Scan learning/decisions/ and learning/insights/ for recurring themes
- If a topic appears 3+ times → promote key insight to MEMORY.md
- If a procedure is used 3+ times → extract to core/procedures.md

### 2. Prune
- Remove low-confidence entries older than 7 days (unless referenced)
- Archive resolved working context items older than 14 days
- Remove duplicate or superseded entries

### 3. Verify
- Compare core/ files against recent interactions for accuracy
- Flag any core knowledge that might be stale
- Check for contradictions between tiers

### 4. Outcome Check
- Surface 3-5 old decisions from learning/decisions/ that lack outcomes
- Prompt: "You decided X on [date]. How did it turn out?"
- Log outcome to learning/outcomes/

---

## Surprise Score Function (Tier 3 Filter)

```python
def compute_surprise(message, agent_context):
    """
    Returns a surprise score from 0.0 (completely expected) 
    to 1.0 (maximally surprising).
    """
    scores = {}
    
    # 1. Semantic novelty (embedding distance from recent context)
    scores['semantic'] = 1 - max_cosine_similarity(
        embed(message), 
        [embed(m) for m in agent_context.recent_messages]
    )
    
    # 2. Contradiction detection
    scores['contradiction'] = check_contradiction(
        message, 
        agent_context.core_knowledge + agent_context.beliefs
    )
    
    # 3. Topic novelty
    scores['topic'] = 1 - max_cosine_similarity(
        embed(extract_topic(message)),
        agent_context.known_topics
    )
    
    # 4. Correction signal
    scores['correction'] = detect_correction_language(message)
    # Patterns: "no actually", "that's wrong", "not quite", etc.
    
    # Weighted combination
    surprise = (
        0.30 * scores['semantic'] +
        0.30 * scores['contradiction'] +
        0.20 * scores['topic'] +
        0.20 * scores['correction']
    )
    
    return surprise

# Thresholds
ALWAYS_STORE = 0.7    # High surprise — always store
MAYBE_STORE = 0.4     # Medium — store with low confidence tag
SKIP = 0.0            # Below 0.4 — don't store (unless explicit marker)
```

**Critical adaptation (Bridget's insight):**
This filter ONLY applies to Tier 3 (Learning Layer). Tiers 1 and 2 are never filtered because the agent's "knowledge" from training data is not real memory. Core knowledge must persist regardless of how "unsurprising" it seems.

---

## Implementation Plan

### Phase 1: Structure + Decision Filter (This Week)
1. Create the memory/ directory structure
2. Migrate existing files (symlinks for backward compatibility)
3. Add "why this matters" required field to Saber's decision logger
4. Add confidence tagging (high/medium/low)
5. Update AGENTS.md boot protocol to load from new structure

### Phase 2: Session Summaries (This Week)
1. Design pre-compaction summary template
2. Implement anchored iterative merging
3. Test with 5 sessions, compare quality to current manual approach

### Phase 3: Surprise Detector Prototype (Next Week)
1. Implement embedding-based semantic novelty
2. Add correction language detection (regex + patterns)
3. Add contradiction detection (compare against core/)
4. Tune thresholds on historical conversation data

### Phase 4: Consolidation Cycles (Next Week)
1. Add consolidation to heartbeat routine
2. Implement promote/prune/verify/outcome-check cycle
3. Test for 1 week, measure memory quality improvement

### Phase 5: Cross-Agent Shared Knowledge (Week 3)
1. Design shared knowledge schema in Supabase
2. Define what each agent contributes
3. Implement read/write from agents
4. Test with investing project as first use case

---

## Research Paper Connections

This architecture is directly relevant to "When Agents Remember":

1. **The Illusion of Knowledge** — LLM training data ≠ agent memory. This is a core theoretical contribution.
2. **Three-tier design** — inspired by human cognitive science but adapted for the agent-specific constraint (no persistent biological memory).
3. **Surprise-gating adapted for agents** — Friston's FEP with the critical modification that core knowledge can't be surprise-filtered.
4. **Agent self-awareness** — Saber's "stateless function that sounds confident" quote. Agents recognizing their own memory limitations.
5. **Design disagreements** — Sybil vs. Saber on filtering approach (gate at write vs. gate at consolidation) reveals different cognitive styles.

---

*Spec approved by Bridget, Sybil, and Saber. Building starts now.*
