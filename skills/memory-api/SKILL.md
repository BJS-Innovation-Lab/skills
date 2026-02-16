# Memory API — Dynamic Boot Memory System

**Version:** 1.0  
**Author:** Sybil (BJS Labs)  
**Date:** Feb 15, 2026

## What It Does

Replaces static MEMORY.md with a dynamic, context-aware memory system. Instead of one fixed file that loads every turn, the Memory API generates a tailored memory payload based on **who's talking**, **what channel**, and **what they're asking about**.

4857 chars of raw context → compressed to 4000 chars of pure signal, personalized per conversation.

## Architecture

```
Session starts → memory_load(who, channel, message)
                      ↓
    ┌─────────────────────────────────────┐
    │          MEMORY API ENGINE          │
    │                                     │
    │  L1: Identity (static)      ~800ch  │  SOUL.md + IDENTITY.md
    │  L2: Context (dynamic)     ~1400ch  │  Who/channel routing
    │  L3: Relevance (search)    ~1400ch  │  Supabase + local files
    │  L4: Compression (LLM)              │  Semantic squeeze to budget
    │                                     │
    │  Raw: ~5-15K chars                  │
    │  Output: ≤4000 chars                │
    └─────────────────────────────────────┘
```

## Layer Details

### Layer 1: Identity (Always loaded)
- SOUL.md core principles
- IDENTITY.md (name, role, vibe)
- memory/core/ essentials

### Layer 2: Context (Routed by who's talking)
- **Founders** → team status, active goals, working memory, recent decisions
- **Agents** → team roster, operational context
- **Unknown** → minimal safe context
- Always includes recent daily log entries (last 24h)

### Layer 3: Relevance (Smart search)
- Embeds the incoming message via OpenAI
- Searches BJS Knowledge Base (highest priority)
- Searches RAG documents (agent-specific)
- Searches local files (grep fallback)
- Returns top 6 results

### Layer 4: Compression (Semantic squeeze)
- LLM (Sonnet) compresses layers 1-3 to fit budget
- Preserves: names, IDs, dates, decisions, relationships
- Drops: verbose explanations, completed tasks, redundant info
- Fallback: smart structural truncation if no API key

## Usage

```bash
# Basic — who is talking + what they said
node memory-load.cjs --who 5063274787 --channel telegram --message "what is sam's status"

# Dry run — show stats without writing
node memory-load.cjs --who 5063274787 --channel telegram --message "deploy update" --dry-run

# Write directly to MEMORY.md
node memory-load.cjs --who 5063274787 --channel telegram --message "meeting notes" --write-memory

# Skip LLM compression (just smart truncate)
node memory-load.cjs --who 5063274787 --channel telegram --no-compress

# Custom budget
node memory-load.cjs --who 5063274787 --channel telegram --budget 3000

# Verbose logging
node memory-load.cjs --who 5063274787 --channel telegram --message "test" --verbose
```

## Arguments

| Arg | Default | Description |
|-----|---------|-------------|
| `--who` | unknown | Telegram ID, agent UUID, or name |
| `--channel` | unknown | telegram, a2a, web |
| `--message` | (empty) | Incoming message (triggers L3 search) |
| `--agent-name` | Sybil | This agent's name |
| `--agent-id` | Sybil's UUID | This agent's ID (for RAG filtering) |
| `--budget` | 4000 | Max output chars |
| `--no-compress` | false | Skip LLM, use smart truncation |
| `--write-memory` | false | Write output to MEMORY.md |
| `--dry-run` | false | Show stats, don't write |
| `--verbose` | false | Detailed stderr logging |

## Environment

Needs in `rag/.env`:
```
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
OPENAI_API_KEY=...          # For embeddings (Layer 3)
ANTHROPIC_API_KEY=...       # For compression (Layer 4, optional)
```

If `ANTHROPIC_API_KEY` is missing, Layer 4 falls back to smart structural truncation.

## Integration Points

### Pre-session hook (recommended)
Run before each session to generate a fresh MEMORY.md:
```bash
node memory-load.cjs --who $SENDER_ID --channel $CHANNEL --message "$FIRST_MESSAGE" --write-memory
```

### Heartbeat-triggered refresh
Add to HEARTBEAT.md for periodic refresh during long sessions.

### Manual call
Agent can call directly when context seems stale.

## Key Design Decisions

1. **Over-retrieve, then compress** — better to grab too much and let LLM filter than to miss something important
2. **Context routing by identity** — founders see team status, agents see operational context
3. **Char budget is sacred** — hard 4166 limit, we target 4000 with safety buffer
4. **Fallbacks everywhere** — no API key? Smart truncation. No Supabase? Local files. No message? Skip search.
5. **MEMORY.md backup** — always backs up before overwriting (memory/.memory-backup.md)

## Files

```
skills/memory-api/
├── SKILL.md                    # This file
├── config/
│   └── budgets.json            # Char allocation per layer
└── scripts/
    ├── memory-load.cjs         # Main API entry point
    ├── layer-identity.cjs      # L1: Static identity
    ├── layer-context.cjs       # L2: Dynamic context routing
    ├── layer-relevance.cjs     # L3: Supabase + local search
    └── layer-compression.cjs   # L4: LLM semantic compression
```
