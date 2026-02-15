# Boot Memory Specification — BJS Labs Agents

*Standard for MEMORY.md structure across all persistent agents.*

## Why This Matters

MEMORY.md is loaded into every turn's system prompt. It has a **4166 character hard limit**. If it exceeds this, OpenClaw truncates it — silently losing context. This is the single most impactful file in the agent's workspace.

## Research Basis

Based on analysis of:
- **MemGPT/Letta** — two-tier core memory (executive summary + archival)
- **Generative Agents** (Park et al. 2023) — memory stream + reflection
- **CoALA** framework — modular memory components
- **"Lost in the Middle"** (Liu et al. 2023) — LLMs retrieve beginning/end better than middle
- **Miller's Law** — 4-7 chunks optimal for working memory
- **Token efficiency** — Markdown 15% more efficient than JSON

Full research: `boot-memory-research-report.md`

## The Rules

1. **Hard limit: 3500 chars** (leaves 666 char buffer below 4166 truncation)
2. **5-6 sections max** (4-7 chunk rule)
3. **Critical info at top** (identity, principles) — primacy effect
4. **Dynamic info at bottom** (status, timestamps) — recency effect
5. **Reference pointers in middle** — low retrieval priority is OK for links
6. **Markdown format** — no JSON/YAML (token efficiency)
7. **No detail dumps** — if it needs explanation, it belongs in a core/ file

## Standard Template

```markdown
# IDENTITY & CORE FUNCTION
**[Name]** — [Role], [Org]. [One line context].
Agent ID: `[uuid]`

## Operating Principles
- [Principle 1 — most critical behavioral rule]
- [Principle 2]
- [Principle 3]
- [Principle 4 max — if you need more, they aren't all principles]

# ACTIVE GOALS
- **[Goal 1]** — [brief context] → `[file pointer]`
- **[Goal 2]** — [brief context]
- **[Goal 3 max]** — more than 3 active goals = prioritization problem

# RECENT LEARNING
- [Insight from last 7 days — 1 line]
- [Correction from last 7 days — 1 line]
- [Max 4 entries — rotate oldest out weekly]

# MEMORY SYSTEM
**Core:** `memory/core/` — [list key files]
**Working:** `memory/working/` — active tasks
**Learning:** `memory/learning/` — corrections, insights, outcomes
**Daily:** `memory/YYYY-MM-DD.md` — raw logs

# STATUS
**Updated:** [timestamp]
**Pending:** [key blockers or check PENDING.md]
```

## Section Purposes

| Section | Position | Why Here | Update Frequency |
|---------|----------|----------|-----------------|
| Identity & Principles | TOP | Primacy effect — always retrieved | Rarely (monthly) |
| Active Goals | Upper-mid | Need these every turn | Weekly |
| Recent Learning | Mid | Context for decisions | Weekly (rotate) |
| Memory System | Lower-mid | Reference pointers — OK if deprioritized | Rarely |
| Status | BOTTOM | Recency effect — recent context | Daily |

## What Goes WHERE

### IN MEMORY.md (always loaded)
- Core identity (1-2 lines)
- Operating principles (3-4 max)
- Current active goals (2-3 max)
- Recent learnings (3-4 from last 7 days)
- File system pointers
- Current status/blockers

### NOT in MEMORY.md (retrieved on demand)
- Team directory → `memory/core/team.md`
- Client details → `memory/core/clients.md`
- Project history → `memory/core/documents.md`
- Detailed learnings → `memory/learning/`
- Conversation logs → `memory/YYYY-MM-DD.md`
- Procedures/SOPs → `memory/core/procedures.md`

## Audit System

### Weekly Audit (Heartbeat — Sundays)

Every agent runs this during a heartbeat:

```
1. Check: wc -c MEMORY.md — MUST be under 3500 chars
2. Check: Are all sections still accurate?
   - Remove completed goals
   - Rotate stale "Recent Learning" entries (>7 days old)
   - Verify file pointers still exist
3. Check: Is "Recent Learning" current?
   - Pull top 2-3 entries from memory/learning/ last 7 days
   - Replace old entries
4. Check: Any learnings ready for auto-promotion to Operating Principles?
   - 3+ validations → promote
```

### Monthly Deep Audit (Cron — 1st Sunday)

```
1. Review all Operating Principles — still valid?
2. Check if identity/role description needs updating
3. Compare MEMORY.md structure against this spec
4. Report any structural drift to Bridget
```

### Audit Logging

After each audit, append to `memory/learning/outcomes/`:
```yaml
type: outcome
id: OUT-YYYYMMDD-audit
references: boot-memory-spec
result: "MEMORY.md at X chars. Rotated N entries. Promoted N learnings."
verdict: validated  # or: needs-attention
```

## Anti-Patterns

| Anti-Pattern | Why Bad | Fix |
|-------------|---------|-----|
| Stuffing everything in MEMORY.md | Hits 4166 limit, gets truncated | Move to core/ files |
| No structure / flat list | No prioritization, middle gets lost | Use the template |
| Never updating "Recent Learning" | Stale context misleads decisions | Rotate weekly |
| Duplicating info across sections | Wastes char budget | One location per fact |
| Putting procedures in MEMORY.md | Too detailed for boot context | Move to core/procedures.md |
| JSON/YAML format | 15% less token-efficient | Use markdown |

## For Field Agents

Field agents (Santos, etc.) use the same template with adjusted content:
- **Operating Principles** → client-facing rules, not HQ internal
- **Active Goals** → current client tasks
- **Memory System** → same three-tier structure
- **No shared brain** — each field agent's MEMORY.md is independent

## Paper Contribution

This spec documents a concrete, research-backed design for persistent agent boot memory. Key contributions:
1. Character-budgeted boot file with primacy/recency optimization
2. Weekly audit cycle preventing organic drift
3. Auto-promotion pipeline from learning → boot memory
4. Empirical evidence: unstructured growth hit limits at 2.4x budget

Capture data: audit logs, promotion rates, structural drift over time.

---
*Designed by Sybil + Bridget, Feb 15 2026. Based on boot-memory-research-report.md.*
