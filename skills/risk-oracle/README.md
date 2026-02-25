# Risk Oracle 🎯

**Pre-action risk assessment for AI agents.**

Based on research from MemoryArena (Choi, Pentland et al., 2026): agents that ace memory recall benchmarks still fail to *apply* corrections to prevent repeat mistakes. The gap isn't storage—it's retrieval timing.

## The Problem

```
Current flow:
  Agent does risky action → Breaks something → Logs correction
  Later: Agent does same risky action → Breaks again
  Bridget: "Did you check your corrections?"
  Agent: "Oh right, I logged this exact mistake last week"
```

The correction EXISTS but wasn't RETRIEVED before acting.

## The Solution

A lightweight "risk oracle" that runs before risky actions:

```
Proposed action → risk-check.cjs → Risk signal
                                    ├── LOW: proceed silently
                                    ├── MEDIUM: note and proceed
                                    └── HIGH: inject warning into context
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Agent Context                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ "⚠️ Risk: Similar to COR-20260221-001           │    │
│  │  (git memory contamination). Check first?"      │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ Inject if HIGH risk
                           │
┌─────────────────────────────────────────────────────────┐
│                    risk-check.cjs                        │
│  1. Embed proposed action                                │
│  2. Search corrections table for similarity              │
│  3. Check for external effects (git, api, email)        │
│  4. Return: { risk: "high", reason: "...", id: "..." }  │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ Query
                           │
┌─────────────────────────────────────────────────────────┐
│              Supabase: corrections table                 │
│  ┌─────────────────────────────────────────────────┐    │
│  │ id: COR-20260221-001                            │    │
│  │ summary: "Never git add . in shared repos"      │    │
│  │ embedding: [0.123, -0.456, ...]                 │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │ Sync on write
                           │
┌─────────────────────────────────────────────────────────┐
│           memory/learning/corrections/*.md               │
│  (Existing agentic-learning correction files)            │
└─────────────────────────────────────────────────────────┘
```

## Setup

### 1. Create Supabase Table

Run `setup.sql` in your Supabase SQL Editor:

```bash
cat setup.sql  # Review first
# Then paste into Supabase SQL Editor
```

### 2. Configure Environment

Ensure `~/.openclaw/workspace/rag/.env` has:
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
GOOGLE_API_KEY=xxx  # For embeddings
```

### 3. Sync Existing Corrections

```bash
node sync-correction.cjs --all
```

### 4. Test Risk Check

```bash
node risk-check.cjs "git push origin main"
# Expected: { risk: "high", reason: "Similar to COR-..." }

node risk-check.cjs "cat README.md"
# Expected: { risk: "low", reason: "No risk signals" }
```

## Files

| File | Purpose |
|------|---------|
| `risk-check.cjs` | Main risk assessment script |
| `sync-correction.cjs` | Syncs corrections to Supabase |
| `setup.sql` | Supabase table and function setup |

## Integration with Agentic Learning

After writing a correction, sync it:

```bash
# In agentic-learning workflow:
# 1. Write correction to memory/learning/corrections/
# 2. Sync to risk oracle:
node ~/scripts/risk-oracle/sync-correction.cjs path/to/correction.md
```

Future: Hook into agentic-learning scripts to auto-sync.

## Risk Signals

| Signal | Trigger | Risk Level |
|--------|---------|------------|
| Correction similarity > 0.75 | Embedding match to past mistake | HIGH |
| External effect pattern | git push, curl POST, send email | MEDIUM |
| Both above | Combined | HIGH |
| Neither | No signals | LOW |

## Research Context

This implements findings from:

- **MemoryArena** (arXiv:2602.16313): "Agents with near-saturated performance on recall benchmarks perform poorly in agentic settings"
- Key insight: Retrieval ≠ Application. Memory must be consulted *before* action, not just stored.

## Status

- [x] Core scripts written
- [ ] Supabase table created
- [ ] Existing corrections synced
- [ ] Hook into agentic-learning
- [ ] OpenClaw pre-exec integration (future)

---

*Created: 2026-02-25 by Sybil + Bridget*
*Part of BJS Labs memory research*
