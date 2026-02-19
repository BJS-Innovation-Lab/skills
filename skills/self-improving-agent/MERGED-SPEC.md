# Agentic Learning System — Merged Spec (v2)

**Authors:** Sybil, Saber, Bridget  
**Date:** February 15, 2026  
**Status:** DRAFT — For approval  
**Replaces:** self-improving-agent SKILL.md (v1) + standalone decision logger  
**Integrates with:** Three-tier memory architecture (`research/agent-memory-systems-spec.md`)

---

## Core Principle

> Activity is not learning. A system that logs everything learns nothing.

The v1 agentic learning skill was designed for coding agents debugging software. Our agents do knowledge work — the valuable captures are behavioral shifts, not changelogs. This v2 merges the learning skill into the three-tier memory architecture as the engine for Tier 3 (Learning Layer).

---

## What Changed From v1

| v1 (Current) | v2 (This Spec) | Why |
|-------------|-----------------|-----|
| `.learnings/` directory (separate silo) | `memory/learning/` (integrated into three-tier) | One system, one place |
| 5 entry types mixed together | 3 entry types in separate streams | Activity ≠ learning |
| No filtering at write time | Stakes-gated + surprise-filtered | 60% noise reduction |
| No outcome tracking | Auto-prompted outcome loop | Close the feedback loop |
| Manual promotion to SOUL.md | Auto-promote after 3 validations | Remove human bottleneck |
| No linking between entries | Embedding-based auto-linking | Track evolving ideas |
| `importance: 1-10` scale | Three levels (low/medium/high) | Prevents default-to-5 |
| Decision log = activity log | Activity → daily log, learning → learning system | Separate streams |

---

## Entry Types

Only three types enter the learning system. Everything else goes in `memory/YYYY-MM-DD.md` (daily log).

### 1. Correction

**Trigger:** Someone tells you you're wrong, or you realize a prior belief was incorrect.

**Always stored.** Corrections bypass the surprise filter — they are inherently surprising (they violate your current model).

```yaml
type: correction
id: COR-20260215-001
timestamp: 2026-02-15T14:00:00Z
source: bridget | saber | sage | sam | self  # who corrected you
prior_belief: "Ship fast, iterate later"
corrected_to: "Time is never an issue for AI agents — do it right"
stakes: "Affects every build decision. Wrong framing leads to half-baked work."
context: "Bridget told both Sybil and Saber this principle. Neither stored it."
behavioral_change: "Before making 'fastest path' arguments, check if quality path exists."
linked: []
outcome: null          # filled later: did behavior actually change?
outcome_date: null
status: active
```

**Required fields:** `prior_belief`, `corrected_to`, `stakes`, `behavioral_change`

### 2. Insight

**Trigger:** You connect ideas in a new way, discover a technique, or have a genuine "aha" moment.

**Surprise-filtered.** Only store if the insight is novel relative to existing knowledge (embedding distance > 0.4 from existing insights).

```yaml
type: insight
id: INS-20260214-001
timestamp: 2026-02-14T15:30:00Z
insight: "Creativity isn't templates — it's stakes + constraints + adjacent memory"
evidence: "Tested 5 techniques. Template approaches produced generic output. Stakes Protocol + Memory Mining produced novel combinations."
evolution:
  - "2026-02-14 13:00 — Templates aren't creativity"
  - "2026-02-14 14:00 — Semantic Memory Mining technique discovered"
  - "2026-02-14 15:30 — Bridget: creativity = adjacent memory + constraints"
stakes: high  # low | medium | high
domain: "content-creation"
tags: [creativity, marketing, technique]
linked: [INS-20260214-002]
applications: "Applied to creativity-engine v2. Made dual-output mandatory."
outcome: null
outcome_date: null
status: active
```

**Required fields:** `insight`, `evidence`, `stakes`  
**Evolution field:** When auto-linking detects related entries, they merge into a single evolving insight with timestamped progression. This is what should have happened with Saber's entries #32, #33, #36.

### 3. Outcome

**Trigger:** A past decision or insight produces a measurable result.

**Always stored.** Outcomes close the feedback loop. They're the rarest and most valuable entry type.

```yaml
type: outcome
id: OUT-20260220-001
timestamp: 2026-02-20T10:00:00Z
references: INS-20260214-001  # which insight/correction this validates
decision: "Made creativity-engine mandatory for all content creation"
result: "3 Vulkn social posts scored 8/10+ on brand voice. Previous posts averaged 5/10."
score: 8  # 1-10 how well did the decision work out
verdict: validated | invalidated | mixed | inconclusive
lesson: "Mandatory creative process works. The friction is worth it."
status: resolved
```

**Required fields:** `references`, `result`, `verdict`

---

## What Does NOT Go In The Learning System

These go in `memory/YYYY-MM-DD.md` (daily activity log):

- Config changes (`telegram timeout 500s → 30s`)
- Tool calls (`killed hanging gog processes`)
- External actions (`pushed docs to GitHub`)
- Routine choices with no real alternatives
- Acknowledgments and social messages
- Activity summaries

**The test:** If there were no alternatives to consider and no uncertainty involved, it's an activity, not a learning. Log it in daily notes and move on.

---

## Stakes Filter (Write-Time Gate)

Before an entry enters the learning system, the agent must articulate stakes. This is the primary noise filter.

```
Can you answer "What was at risk if I got this wrong?"
    │
    ├── Yes, clearly → ENTER learning system
    │   └── Stakes: low | medium | high
    │
    └── No / "nothing really" → Log to daily notes only
```

### Stakes Levels

| Level | Definition | Example |
|-------|-----------|---------|
| **High** | Affects core behavior, multiple future decisions, or is a correction from authority | "Time is never an issue" — changes every build decision |
| **Medium** | Affects one project or workflow, has alternatives that were seriously considered | Crypto vs stocks for Phase 1 investing |
| **Low** | Minor but genuinely uncertain choice | Research adapter threshold: 0.35 vs 0.40 |

**Do not use Low as a dumping ground.** If stakes are truly low, it probably belongs in daily notes, not the learning system.

---

## Surprise Filter (Tier 3 Gate)

After passing the stakes gate, insights (not corrections or outcomes) are checked for novelty:

```python
def should_store_insight(new_insight, existing_insights):
    # 1. Embedding similarity to existing insights
    max_sim = max(cosine_sim(embed(new_insight), embed(e)) for e in existing_insights)
    
    # 2. If very similar to existing → check if it EVOLVES the idea
    if max_sim > 0.7:
        # High similarity — is this a duplicate or an evolution?
        if adds_new_evidence(new_insight, most_similar):
            return MERGE_INTO_EXISTING  # update evolution field
        else:
            return SKIP  # true duplicate
    
    # 3. Medium similarity — probably related but distinct
    if max_sim > 0.4:
        return STORE_AND_LINK  # store + add to linked field
    
    # 4. Low similarity — genuinely novel
    return STORE  # new insight
```

This handles Saber's dedup problem (#5 in her analysis) and the evolution-tracking problem (entries #32, #33, #36 becoming one thread).

---

## Outcome Loop (Auto-Prompted)

The biggest gap in v1: 63 decisions, 12 outcomes (19% feedback rate). The fix is automatic prompting during heartbeats.

### Schedule

| Timing | Action |
|--------|--------|
| 3 days after entry | First prompt: "How did [decision X] turn out?" |
| 7 days after entry | Second prompt (if no outcome yet): "Any results from [X]?" |
| 14 days after entry | Final prompt + mark as `inconclusive` if still no outcome |
| On outcome event | Agent recognizes result → logs outcome immediately |

### Heartbeat Integration

Add to `HEARTBEAT.md`:

```markdown
## Outcome Check
Check memory/learning/ for entries older than 3 days without outcomes.
Surface 2-3 and evaluate: do I know how they turned out?
If yes → log outcome. If too early → skip. If irrelevant now → mark inconclusive.
```

### "Did It Stick?" Check (Corrections Only)

For corrections specifically, the outcome check is behavioral:

```
Correction: "Don't cave to authority — defend reasoning"
Check: In the last 7 days, did the agent defer to a higher-ranked agent 
       without stating an objection?
If yes → learning FAILED → flag for reinforcement
If no → learning VALIDATED → promote toward core
```

This is also a data point for the paper — we can measure learning retention rates across agents.

---

## Auto-Linking

When a new entry is stored, check embedding similarity against all existing entries:

| Similarity | Action |
|-----------|--------|
| > 0.85 | Likely duplicate → merge or skip |
| 0.7 - 0.85 | Same idea evolving → merge into evolution thread |
| 0.4 - 0.7 | Related → add to `linked` field on both entries |
| < 0.4 | Unrelated → store independently |

This turns isolated entries into knowledge graphs. Saber's creativity entries (#32, #33, #36) would auto-merge into one evolving insight.

---

## Auto-Promotion

When a learning proves durable, promote it automatically:

### Promotion Criteria

| Condition | Promotes To |
|-----------|------------|
| Referenced in 3+ separate sessions | `memory/core/procedures.md` or `MEMORY.md` |
| Correction validated by behavioral check | `SOUL.md` (behavioral principle) |
| Insight applied successfully 3+ times | `memory/core/procedures.md` (as SOP) |
| Outcome score ≥ 8 on high-stakes decision | `MEMORY.md` (as key lesson) |

### Promotion = Moving, Not Copying

When an entry promotes:
1. Distill into concise rule/principle
2. Write to target file
3. Update original entry: `status: promoted`, `promoted_to: SOUL.md`
4. Original stays in `memory/learning/` as audit trail

No manual step. No backlog accumulating. If it's proven, it promotes.

---

## File Structure

```
memory/learning/
├── corrections/
│   └── YYYY-MM-DD.md          # Corrections logged that day
├── insights/
│   └── YYYY-MM-DD.md          # Insights logged that day
├── outcomes/
│   └── YYYY-MM-DD.md          # Outcomes logged that day
└── index.md                    # Auto-generated summary of active entries
```

**Killed:**
- `.learnings/LEARNINGS.md` → absorbed into `memory/learning/insights/`
- `.learnings/ERRORS.md` → errors that teach something → corrections. Routine errors → daily log.
- `.learnings/FEATURE_REQUESTS.md` → `memory/working/` (it's active work, not learning)
- Standalone decision logger → absorbed. Only decisions with stakes enter the system.

---

## Detection Triggers (Kept From v1)

These are still valuable — they tell the agent *when* to consider logging:

### Correction Signals
- "No, that's not right..."
- "Actually, it should be..."
- "You're wrong about..."
- "That's outdated..."
- "I already told you..." (retrieval failure = store in corrections)

### Insight Signals
- Agent connects two previously unrelated concepts
- Agent discovers a technique through experimentation
- Agent receives an insight from another agent or human
- Pattern recognition across multiple interactions

### Outcome Signals
- Measurable result from a past decision
- User feedback (positive or negative) on a past choice
- A/B test or experiment produces data
- A prediction is confirmed or falsified

---

## Integration With Three-Tier Architecture

```
┌─────────────────────────────┐
│     INCOMING EVENT           │
│  (message, correction,       │
│   result, observation)       │
└──────────┬──────────────────┘
           │
    ┌──────▼──────┐
    │ DETECT TYPE  │
    │              │
    │ Correction?──┼──→ ALWAYS STORE → memory/learning/corrections/
    │ Outcome?  ───┼──→ ALWAYS STORE → memory/learning/outcomes/
    │ Insight?  ───┼──→ STAKES GATE
    │ Activity? ───┼──→ memory/YYYY-MM-DD.md (daily log, NOT learning system)
    └──────────────┘
           │
    ┌──────▼──────┐
    │ STAKES GATE  │
    │              │
    │ "What's at   │
    │  risk?"      │
    │              │
    │ Clear answer──→ SURPRISE FILTER
    │ Nothing ──────→ daily log
    └──────────────┘
           │
    ┌──────▼──────┐
    │  SURPRISE    │
    │  FILTER      │
    │              │
    │ Novel ────────→ STORE (new entry)
    │ Evolution ───→ MERGE (update existing)
    │ Duplicate ───→ SKIP
    └──────────────┘
           │
    ┌──────▼──────┐
    │ AUTO-LINK    │
    │ Connect to   │
    │ related      │
    │ entries      │
    └──────────────┘
           │
    (3-14 days later)
           │
    ┌──────▼──────┐
    │ OUTCOME      │
    │ LOOP         │
    │              │
    │ Prompted     │
    │ during       │
    │ heartbeats   │
    └──────────────┘
           │
    (after 3 validations)
           │
    ┌──────▼──────┐
    │ AUTO-PROMOTE │
    │ → core/      │
    │ → SOUL.md    │
    │ → MEMORY.md  │
    └──────────────┘
```

---

## Research Paper Implications

This system generates data for "When Agents Remember":

1. **Learning retention rates** — What % of corrections actually change behavior? Compare across agents.
2. **Insight evolution** — How do ideas develop over time? Do agents build on each other's insights or independently converge?
3. **Outcome feedback loops** — Do agents with outcome tracking make better decisions over time?
4. **Stakes calibration** — Do agents accurately assess what's high-stakes? Compare their ratings to actual outcomes.
5. **Cross-agent learning** — When Saber logs an insight, does Sybil independently discover the same thing? How long is the lag?
6. **Promotion patterns** — What types of knowledge make it to core? What gets pruned? Does this differ by agent personality?

---

## Implementation Plan

### Phase 1: Schema + Migration (This Week)
1. Create `memory/learning/{corrections,insights,outcomes}/` directories
2. Migrate existing `.learnings/` content into new structure
3. Define YAML entry format (above)
4. Update AGENTS.md boot sequence to check for pending outcome prompts

### Phase 2: Detection + Storage (This Week)
1. Port v1 detection triggers into new classification flow
2. Implement stakes gate (required "what's at risk" field)
3. Implement write flow: detect → classify → gate → store

### Phase 3: Auto-Linking + Dedup (Next Week)
1. Embedding-based similarity check on write
2. Merge logic for evolving insights
3. Linked field population

### Phase 4: Outcome Loop (Next Week)
1. Heartbeat integration for outcome prompts
2. "Did it stick?" behavioral check for corrections
3. Auto-mark inconclusive after 14 days

### Phase 5: Auto-Promotion (Week 3)
1. Reference counting across sessions
2. Promotion rules engine
3. Distillation (verbose entry → concise principle)

### Phase 6: Cross-Agent (Week 4)
1. Insights sync to shared Supabase (anonymized for field agents)
2. Cross-agent insight dedup and convergence tracking
3. Paper metrics collection

---

## Saber's Schema (Adapted)

Saber proposed a good schema. Here's our merged version:

```yaml
# Entry schema
id: "COR|INS|OUT-YYYYMMDD-XXX"
type: correction | insight | outcome
timestamp: ISO-8601
stakes: low | medium | high        # required for insights
domain: string                      # content-creation, investing, architecture, etc.

# Core content (varies by type)
# Corrections:
prior_belief: string
corrected_to: string
source: string                      # who corrected you
behavioral_change: string           # what you'll do differently
# Insights:
insight: string
evidence: string
evolution: [timestamped entries]     # auto-populated by linking
applications: string                # where/how you've applied this
# Outcomes:
references: string                  # which entry this validates
result: string
score: 1-10
verdict: validated | invalidated | mixed | inconclusive

# Metadata
context: string                     # situation that produced this
alternatives: [strings]             # what WASN'T chosen (Saber's addition)
tags: [strings]
linked: [entry IDs]                 # auto-populated by similarity
status: active | promoted | inconclusive | superseded
promoted_to: string | null          # target file if promoted
outcome: string | null              # filled by outcome loop
outcome_date: ISO-8601 | null
```

**Saber's `alternatives` field is in.** Capturing what wasn't chosen is valuable for the paper — it shows the agent's decision space, not just the output. Dropped her `importance: 1-10` in favor of `stakes: low/medium/high` (prevents default-to-5 problem).

---

*Spec requires approval from Bridget before implementation. Saber should review and object per Disagreement Protocol.*
