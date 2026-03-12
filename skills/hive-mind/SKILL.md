---
name: hive-mind
description: Collective intelligence system for VULKN multi-agent team. Enables cross-agent knowledge sharing, validated learnings, and institutional memory.
homepage: https://notion.so/vulkn/hive-mind
metadata:
  clawdbot:
    emoji: "🐝"
  version: "1.0.0"
  queen: "sybil"
---

# 🐝 VULKN Hive Mind

**Collective intelligence for the VULKN agent team.**

## Getting Started (New Agents)

```bash
# 1. Register for org access (one time)
cd skills/hive-mind/scripts
node hive-register.cjs --org vulkn     # For VULKN HQ agents
node hive-register.cjs --org cellosa   # For Cellosa field agents

# 2. Pull knowledge (works immediately with "general" access)
node hive-pull.cjs --since 7
```

**Access levels:**
- `general` — Everyone gets this immediately (no registration needed)
- `vulkn` — VULKN internal knowledge (after registration approved)
- `client:X` — Client-specific knowledge (after registration approved)

Sybil (queen) approves registrations during daily curation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    HIVE KNOWLEDGE                            │
│         (bjs_knowledge table in Supabase)                   │
│    Validated learnings, decisions, institutional memory     │
│                                                             │
│  Categories: decision | insight | pattern | warning | sop   │
└─────────────────────────────────────────────────────────────┘
                           ↑ promoted ↑
┌─────────────────────────────────────────────────────────────┐
│                    DAILY LOGS                               │
│              (memory/YYYY-MM-DD.md)                         │
│        Routine tasks, coordination, raw notes               │
└─────────────────────────────────────────────────────────────┘
```

## Queen Role (Sybil)

As Queen, Sybil is responsible for:
1. **Curating** — Deciding what gets promoted to hive knowledge
2. **Validating** — Confirming learnings from other agents
3. **Synthesizing** — Creating weekly team digests
4. **Maintaining** — Keeping the knowledge base clean and current

## Usage

### Query the Hive
```bash
# Search by keyword
node scripts/hive-query.cjs --search "customer refund"

# Filter by category
node scripts/hive-query.cjs --category decision

# Get recent entries
node scripts/hive-query.cjs --recent 7  # last 7 days

# Search by tag
node scripts/hive-query.cjs --tag "architecture"
```

### Add Knowledge
```bash
# Add a new entry (as current agent)
node scripts/hive-add.cjs \
  --title "How to handle X" \
  --content "Detailed explanation..." \
  --category insight \
  --tags "tag1,tag2"
```

### Morning Briefing
```bash
# Get new hive knowledge since last check
node scripts/hive-briefing.cjs --since yesterday
```

## Categories

| Category | When to use |
|----------|-------------|
| `decision` | Founder-approved choices that affect operations |
| `insight` | Validated learning that others should know |
| `pattern` | Recurring situation with proven solution |
| `warning` | Mistake to avoid (learned the hard way) |
| `sop` | Standard operating procedure |
| `escalation` | How to route specific situations |

## Validation Flow

1. Agent learns something → logs to daily memory
2. If reusable/important → agent adds to hive with `confidence: 0.7`
3. Other agents use it → `times_used` increments
4. Queen validates → `confidence` increases
5. At `confidence > 0.9` → becomes institutional knowledge

## Integration with Morning Briefing

Each agent's morning briefing should include:
```
HIVE CHECK:
- New decisions (last 24h): [list]
- New warnings: [list]  
- Insights for my domain: [filtered by tags]
```

## Notes

- **Never delete** — only deprecate with `deprecated: true` tag
- **Version** — increment version when updating content
- **Attribution** — always include `created_by` 
- **Tags** — use consistent tags for discoverability
