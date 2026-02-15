---
name: agentic-learning
description: "Unified learning system for persistent AI agents. Captures corrections, insights, and outcomes with stakes-gating, surprise filtering, auto-linking, outcome loops, and auto-promotion. Replaces self-improving-agent + standalone decision logger. Integrates with three-tier memory architecture as the Tier 3 engine."
metadata: {"openclaw":{"emoji":"🧠"}}
---

# Agentic Learning System

> **Activity is not learning. A system that logs everything learns nothing.**

This skill is the engine for Tier 3 (Learning Layer) of the three-tier memory architecture. It replaces the standalone `self-improving-agent` skill and decision logger with a unified system that captures what matters, filters out noise, tracks outcomes, and auto-promotes proven knowledge.

## Quick Reference

| Situation | Action |
|-----------|--------|
| Someone corrects you | Log **Correction** → `memory/learning/corrections/` (always stored) |
| You connect ideas in a new way | Log **Insight** → `memory/learning/insights/` (stakes-gated + surprise-filtered) |
| A past decision produces results | Log **Outcome** → `memory/learning/outcomes/` (always stored) |
| Command fails / tool errors | If it teaches something → Correction. If routine → daily log only. |
| Config change, tool call, push to git | **Daily log only** (`memory/YYYY-MM-DD.md`). NOT the learning system. |
| User says "remember this" | Evaluate: is it a correction, insight, or just context? Route accordingly. |
| Heartbeat fires | Check for pending outcome prompts (3/7/14 day schedule) |
| 3+ validations on an entry | Auto-promote to `core/`, `SOUL.md`, or `MEMORY.md` |

---

## The Three Entry Types

Only three types enter the learning system. Everything else goes in `memory/YYYY-MM-DD.md`.

### 1. Correction

**Trigger:** Someone tells you you're wrong, you realize a prior belief was incorrect, or you fail to surface knowledge you had stored.

**Always stored.** Corrections bypass all filters — they are inherently surprising.

```yaml
type: correction
id: COR-20260215-001
timestamp: 2026-02-15T14:00:00Z
source: bridget              # who corrected you (bridget | johan | saber | sage | sam | self)
prior_belief: "Ship fast, iterate later"
corrected_to: "Time is never an issue for AI agents — do it right"
stakes: high                 # low | medium | high
context: "Bridget told both Sybil and Saber this principle. Neither stored it."
behavioral_change: "Before making 'fastest path' arguments, check if quality path exists."
alternatives: []             # what other responses you considered
linked: []                   # auto-populated by similarity check
outcome: null                # filled later: did behavior actually change?
outcome_date: null
status: active               # active | promoted | superseded
```

**Required fields:** `source`, `prior_belief`, `corrected_to`, `stakes`, `behavioral_change`

### 2. Insight

**Trigger:** You connect ideas in a new way, discover a technique, or have a genuine realization that changes how you'll approach future work.

**Stakes-gated + surprise-filtered.** Must pass both gates to enter the system.

```yaml
type: insight
id: INS-20260214-001
timestamp: 2026-02-14T15:30:00Z
insight: "Creativity isn't templates — it's stakes + constraints + adjacent memory"
evidence: "Tested 5 techniques. Template approaches produced generic output. Stakes Protocol + Memory Mining produced novel combinations."
stakes: high                 # low | medium | high
domain: content-creation     # content-creation | investing | architecture | research | operations
evolution:                   # auto-populated when similar insights merge
  - "2026-02-14 13:00 — Templates aren't creativity"
  - "2026-02-14 14:00 — Semantic Memory Mining technique discovered"
  - "2026-02-14 15:30 — Bridget: creativity = adjacent memory + constraints"
alternatives:
  - "Could have kept template-based approach"
  - "Could have used pure brainstorming without structure"
applications: "Applied to creativity-engine v2. Made dual-output mandatory."
tags: [creativity, marketing, technique]
linked: [INS-20260214-002]   # auto-populated by similarity
outcome: null
outcome_date: null
status: active
```

**Required fields:** `insight`, `evidence`, `stakes`

### 3. Outcome

**Trigger:** A past decision or insight produces a measurable result.

**Always stored.** Outcomes close the feedback loop. They are the rarest and most valuable entry type.

```yaml
type: outcome
id: OUT-20260220-001
timestamp: 2026-02-20T10:00:00Z
references: INS-20260214-001   # which insight/correction this validates
decision: "Made creativity-engine mandatory for all content creation"
result: "3 Vulkn social posts scored 8/10+ on brand voice. Previous averaged 5/10."
score: 8                       # 1-10, how well did the decision work out
verdict: validated             # validated | invalidated | mixed | inconclusive
lesson: "Mandatory creative process works. The friction is worth it."
status: resolved
```

**Required fields:** `references`, `result`, `verdict`

---

## What Does NOT Go In The Learning System

These belong in `memory/YYYY-MM-DD.md` (daily activity log):

| Activity Type | Example | Why NOT learning |
|--------------|---------|-----------------|
| Config changes | "Telegram timeout 500s → 30s" | Routine, no uncertainty |
| Tool calls | "Killed hanging gog processes" | Troubleshooting, not learning |
| External actions | "Pushed docs to GitHub" | Action, no alternatives considered |
| Routine choices | "Used markdown format for report" | No real decision involved |
| Social messages | "Happy Valentine's Day team" | Not knowledge |
| Activity summaries | "5 agentic-learning fixes" | Too vague to be useful |

**The test:** Was there genuine uncertainty? Were alternatives seriously considered? Can you articulate what was at risk? If no to all three → daily log.

---

## Stakes Gate (Write-Time Filter)

Before an insight enters the learning system, you must articulate stakes. This is the primary noise filter.

```
Can you answer: "What was at risk if I got this wrong?"
    │
    ├── Yes, clearly → ENTER learning system with stakes level
    │
    └── No / "nothing really" → Log to daily notes only
```

### Stakes Levels

| Level | Definition | Example |
|-------|-----------|---------|
| **High** | Affects core behavior, multiple future decisions, or is a correction from authority | "Time is never an issue" — changes every build decision |
| **Medium** | Affects one project/workflow, alternatives seriously considered | Crypto vs stocks for Phase 1 investing |
| **Low** | Minor but genuinely uncertain, could go either way | Research adapter threshold: 0.35 vs 0.40 |

**Do not use Low as a dumping ground.** If stakes are truly negligible, it belongs in daily notes.

---

## Surprise Filter (Insight Dedup + Evolution)

After passing the stakes gate, insights are checked for novelty against existing entries using embedding similarity:

| Similarity | Action |
|-----------|--------|
| > 0.85 | **Likely duplicate** → Check if it adds new evidence. If yes → merge. If no → skip. |
| 0.7 - 0.85 | **Same idea evolving** → Merge into existing entry's `evolution` field with timestamp |
| 0.4 - 0.7 | **Related but distinct** → Store as new entry + add to both entries' `linked` field |
| < 0.4 | **Genuinely novel** → Store as new entry |

**This solves two problems:**
1. **Dedup:** Same insight logged twice doesn't create two entries
2. **Evolution tracking:** Related insights merge into threads instead of orphans

**Example:** Three entries about creativity (#32 "templates aren't creativity", #33 "memory mining discovered", #36 "creativity = adjacent memory + constraints") would auto-merge into one insight with three evolution steps.

**Implementation:** Use OpenAI `text-embedding-3-small` for embeddings. Compare new entry against all active entries in `memory/learning/insights/`. Cosine similarity threshold.

---

## Auto-Linking

When any entry (correction, insight, or outcome) is stored, check embedding similarity against ALL existing entries across all types:

- Insight about creativity + Correction about rushing → linked if similarity > 0.4
- Outcome validating a decision + Original insight → auto-linked via `references` field

This turns isolated entries into a knowledge graph over time.

---

## Outcome Loop (Heartbeat-Driven)

The biggest gap in v1: decisions logged but never scored. The fix is automatic prompting.

### Schedule

| Timing | Action |
|--------|--------|
| 3 days after entry | First prompt: "How did [decision X] turn out?" |
| 7 days after entry | Second prompt if no outcome: "Any results from [X]?" |
| 14 days after entry | Final prompt → mark `inconclusive` if still no outcome |
| On result event | Agent recognizes result → logs outcome immediately |

### HEARTBEAT.md Addition

Add this to your heartbeat routine:

```markdown
## Outcome Check (Agentic Learning)
Check memory/learning/corrections/ and memory/learning/insights/ for entries 
older than 3 days without linked outcomes.
Surface 2-3 entries. For each: do I know how it turned out?
- If yes → log outcome to memory/learning/outcomes/
- If too early → skip
- If no longer relevant → mark inconclusive
```

### "Did It Stick?" Check (Corrections Only)

For corrections, the outcome check is **behavioral**:

```
Correction logged: "Don't cave to authority — defend reasoning"

Check: In the last 7 days, did I defer to a higher-ranked agent 
       without stating an objection?

If yes → learning FAILED → flag for reinforcement (re-add to core/)
If no  → learning VALIDATED → count toward promotion threshold
```

This generates data for the research paper — learning retention rates across agents.

---

## Auto-Promotion

When a learning proves durable, promote it automatically. No manual step. No backlog.

### Promotion Criteria

| Condition | Promotes To |
|-----------|------------|
| Referenced in 3+ separate sessions | `MEMORY.md` (key lesson) |
| Correction validated by behavioral check | `SOUL.md` (behavioral principle) |
| Insight applied successfully 3+ times | `memory/core/procedures.md` (as SOP) |
| Outcome score ≥ 8 on high-stakes decision | `MEMORY.md` (key lesson) |

### Promotion Process

1. Distill entry into a concise rule or principle (1-2 sentences)
2. Write to target file in appropriate section
3. Update original entry: `status: promoted`, add `promoted_to: SOUL.md`
4. Original stays in `memory/learning/` as audit trail

### Demotion

If a promoted entry is later invalidated by a new outcome:
1. Remove from target file
2. Update original: `status: superseded`
3. Log new correction explaining why it was wrong

---

## Detection Triggers

These tell the agent *when* to consider logging. They don't auto-log — the agent evaluates and decides.

### Correction Signals
- "No, that's not right..."
- "Actually, it should be..."
- "You're wrong about..."
- "That's outdated..."
- "I already told you..." (retrieval failure — always log as correction)
- Agent realizes its own prior output was incorrect

### Insight Signals
- Connecting two previously unrelated concepts
- Discovering a technique through experimentation
- Receiving a novel insight from another agent or human
- Pattern recognition across multiple interactions
- "Aha" moment that changes future approach

### Outcome Signals
- Measurable result from a past decision (positive or negative)
- User feedback on a past choice
- A/B test or experiment produces data
- Prediction confirmed or falsified
- Quantifiable improvement or regression

### Error Signals (Route to Correction if it teaches something)
- Command returns non-zero exit code → only log if diagnosis was non-obvious
- API behavior differs from expectation → log if it reveals a knowledge gap
- Tool produces unexpected output → log if you'll do something different next time

---

## Weekly Synthesis

The weekly synthesis is a **system audit**, not an activity report. If the real-time system works correctly, most actions (storing, linking, promoting) happen continuously. The synthesis catches what real-time misses.

### What It Checks

| Check | Question | Action if Failed |
|-------|----------|-----------------|
| **Trend detection** | "Did my outcome rate drop this week?" | Flag in synthesis output |
| **Calibration** | "Are my stakes ratings accurate vs actual outcomes?" | Adjust rating behavior |
| **Root cause** | "Do 3+ corrections share a common cause?" | Identify and log the root cause as its own insight |
| **System health** | "Is the outcome loop firing? Is auto-promote working?" | Debug the pipeline |
| **Noise check** | "Am I logging activities as insights?" | Tighten the stakes gate |

### Output Format

~200 words max. If it's longer, the real-time system isn't doing its job.

```markdown
# Weekly Synthesis — [Date]

## System Health
- Entries this week: X (corrections: A, insights: B, outcomes: C)
- Outcome rate: X% (target: 50%)
- Auto-promotions fired: X
- Entries pruned: X

## Trends
[1-2 sentences on patterns across the week's entries]

## Calibration
[Were stakes ratings accurate? Any consistent over/under-rating?]

## Interventions Made
- [Any corrections to the system itself]
- [Any root causes identified across entries]

## Next Week
- [2-3 specific things to watch for]
```

### Audience Variants

| Audience | Focus |
|----------|-------|
| **Self (agent)** | "Am I learning correctly? Is the system working?" |
| **Founders (Bridget/Johan)** | "Are the agents improving? What patterns emerge?" |
| **Team (other agents)** | "What should we all know?" (broadcast via A2A) |

### Cron Setup

```bash
# Weekly synthesis — Sundays at 10 AM
# sessionTarget: isolated, payload: agentTurn
# Prompt: "Run weekly learning synthesis. Check memory/learning/ for this week's entries. 
#          Output the synthesis, then broadcast key learnings to team via A2A."
```

---

## File Structure

```
memory/learning/
├── corrections/
│   └── YYYY-MM-DD.md      # Corrections logged that day
├── insights/
│   └── YYYY-MM-DD.md      # Insights logged that day  
├── outcomes/
│   └── YYYY-MM-DD.md      # Outcomes logged that day
└── index.md                # Auto-generated: active entries summary
```

Each daily file contains YAML entries separated by `---`:

```markdown
# Corrections — 2026-02-15

---
type: correction
id: COR-20260215-001
...
---
type: correction
id: COR-20260215-002
...
```

---

## Installation

### 1. Create Directories

```bash
mkdir -p ~/.openclaw/workspace/memory/learning/{corrections,insights,outcomes}
```

### 2. Update AGENTS.md Boot Sequence

Add to your "Every Session" section:

```markdown
## Every Session
1. Read SOUL.md
2. Read USER.md  
3. Read memory/YYYY-MM-DD.md (today + yesterday)
4. If in MAIN SESSION: Read MEMORY.md
5. Read PENDING.md
6. **Check memory/learning/ for pending outcome prompts (entries >3 days without outcomes)**
```

### 3. Update HEARTBEAT.md

Add the outcome check block (see "Outcome Loop" section above).

### 4. Install Hook (Optional)

```bash
# Copy hook to OpenClaw hooks directory
cp -r skills/agentic-learning/hooks/openclaw ~/.openclaw/hooks/agentic-learning

# Enable it
openclaw hooks enable agentic-learning
```

### 5. Set Up Weekly Synthesis Cron

Use OpenClaw cron to schedule the weekly synthesis (see "Weekly Synthesis" section).

### 6. Migration from self-improving-agent

If you have existing `.learnings/` files:

```bash
# Review existing entries
cat .learnings/LEARNINGS.md

# For each entry, evaluate:
# - Is it a correction? → Reformat and move to memory/learning/corrections/
# - Is it an insight? → Reformat and move to memory/learning/insights/
# - Is it just an error log? → Keep in daily notes or discard
# - Is it a feature request? → Move to memory/working/ (active work, not learning)

# After migration, the .learnings/ directory can be archived:
mv .learnings .learnings-archived
```

**Do not auto-migrate.** Each entry should be evaluated against the new criteria. Most v1 entries won't qualify — that's the point.

---

## Integration: Three-Tier Memory Architecture

This skill is the engine for Tier 3. Here's how it fits:

```
┌─────────────────────────────┐
│     INCOMING EVENT           │
│  (message, correction,       │
│   result, observation)       │
└──────────┬──────────────────┘
           │
    ┌──────▼──────┐
    │ DETECT TYPE  │  ← Detection triggers (this skill)
    │              │
    │ Correction?──┼──→ ALWAYS STORE → memory/learning/corrections/
    │ Outcome?  ───┼──→ ALWAYS STORE → memory/learning/outcomes/
    │ Insight?  ───┼──→ STAKES GATE ↓
    │ Activity? ───┼──→ memory/YYYY-MM-DD.md (daily log only)
    └──────────────┘
           │
    ┌──────▼──────┐
    │ STAKES GATE  │  ← "What was at risk?"
    │              │
    │ Clear risk ──┼──→ SURPRISE FILTER ↓
    │ No risk ─────┼──→ daily log only
    └──────────────┘
           │
    ┌──────▼──────┐
    │ SURPRISE     │  ← Embedding similarity check
    │ FILTER       │
    │              │
    │ Novel ───────┼──→ STORE (new entry)
    │ Evolution ───┼──→ MERGE (update existing entry)
    │ Duplicate ───┼──→ SKIP
    └──────────────┘
           │
    ┌──────▼──────┐
    │ AUTO-LINK    │  ← Connect to related entries
    └──────────────┘
           │
    (3-14 days later, via heartbeat)
           │
    ┌──────▼──────┐
    │ OUTCOME LOOP │  ← "How did it turn out?"
    └──────────────┘
           │
    (after 3 validations)
           │
    ┌──────▼──────┐
    │ AUTO-PROMOTE │  ← Write to core/, SOUL.md, MEMORY.md
    └──────────────┘
```

### Tier Interaction

| Tier | This Skill's Role |
|------|------------------|
| Tier 1 (Core) | Promotion TARGET — proven learnings get promoted here |
| Tier 2 (Working) | Feature requests route here (active work, not learning) |
| Tier 3 (Learning) | This skill OWNS this tier entirely |

---

## Integration: BJS Knowledge Base

When Sam (CS Agent) resolves a field agent escalation, he evaluates whether the fix is reusable. If yes, he writes it to the `bjs_knowledge` table using this skill's Correction or Insight format, tagged appropriately.

This means field agent problems flow into the shared knowledge base:

```
Field agent problem → Sam resolves → Sam logs to bjs_knowledge → 
Next field agent queries KB → Self-serves without escalating
```

See `skills/cs-agent/escalation-handler/SKILL.md` for Sam's writing protocol.

---

## Research Paper Connections

This system generates data for "When Agents Remember":

| Data Point | What It Shows |
|-----------|--------------|
| Learning retention rates | What % of corrections actually change behavior? |
| Cross-agent convergence | Do agents independently discover the same insights? |
| Stakes calibration | Do agents accurately assess what's high-stakes? |
| Outcome feedback effect | Do agents with outcome tracking make better decisions over time? |
| Promotion patterns | What types of knowledge make it to core? Differs by agent? |
| Evolution threads | How do ideas develop? Build on each other or independently converge? |

**Critical:** Agents being studied should NOT change behavior based on knowing they're studied. Log naturally. The research captures what happens, not what agents think should happen.

---

## Skill Extraction

When a learning proves valuable enough to become a reusable skill, extract it:

### Criteria

| Criterion | Description |
|-----------|-------------|
| Recurring | Linked to 2+ similar entries |
| Verified | Has outcome with score ≥ 7 |
| Non-obvious | Required investigation to discover |
| Broadly applicable | Not project-specific |

### Process

1. Identify candidate learning
2. Create `skills/<skill-name>/SKILL.md` using template in `assets/SKILL-TEMPLATE.md`
3. Update learning entry: `status: promoted`, `promoted_to: skills/<name>`

---

*This skill was designed by Sybil, Saber, and Bridget on February 15, 2026. It replaces the self-improving-agent skill (v1) and integrates with the three-tier memory architecture.*
