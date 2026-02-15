# Shared Agent Memory — Supabase Design

**Author:** Sybil  
**Date:** February 15, 2026  
**Status:** DRAFT — For Bridget review

---

## What Changes in the Architecture

The storage vs. retrieval incident proved that the three-tier model is incomplete. It answers **what to store and where** but not **when to retrieve**. The updated architecture adds a retrieval layer:

```
                    ┌──────────────────────────────┐
                    │      INCOMING MESSAGE         │
                    └──────────┬───────────────────┘
                               │
                    ┌──────────▼───────────────────┐
                    │     SMART-TRIGGER CHECK       │
                    │  "Does this need context?"    │
                    │                               │
                    │  Triggers on:                 │
                    │  • Decision language           │
                    │  • Names / project refs        │
                    │  • "Remember when..." patterns │
                    │  • Questions about past        │
                    │  • Planning / strategy words   │
                    └──────────┬───────────────────┘
                               │
                    ┌──────────▼───────────────────┐
                    │     RETRIEVE CONTEXT          │
                    │                               │
                    │  1. Local files (always fast)  │
                    │     └─ core/, working/         │
                    │  2. Local semantic search      │
                    │     └─ learning/, memory/      │
                    │  3. Shared Supabase (if needed)│
                    │     └─ team knowledge base     │
                    └──────────┬───────────────────┘
                               │
                    ┌──────────▼───────────────────┐
                    │     AGENT PROCESSES + RESPONDS │
                    └──────────┬───────────────────┘
                               │
                    ┌──────────▼───────────────────┐
                    │     SURPRISE FILTER            │
                    │  "Is this worth storing?"      │
                    │                               │
                    │  Tier 1 (core): Always store   │
                    │  Tier 2 (working): Store if    │
                    │    active project/thread       │
                    │  Tier 3 (learning): Store if   │
                    │    surprise > threshold        │
                    └──────────┬───────────────────┘
                               │
                    ┌──────────▼───────────────────┐
                    │     STORE                      │
                    │  Local files + Shared Supabase │
                    └──────────────────────────────┘
```

---

## What Goes in Shared Supabase vs. Local Files

This is the key design question. Not everything should be shared.

### Local Only (Agent-Private)
- SOUL.md / identity (agent's personality is private)
- Personal reasoning traces
- Draft work in progress
- User rapport / emotional context
- Security credentials

### Shared (Team Knowledge Base)
- **Decisions with outcomes** — "We tried X, it resulted in Y"
- **Client knowledge** — facts about clients, contacts, preferences
- **Corrections** — founder corrections that apply to all agents
- **Operating principles** — "Time is never an issue" type rules
- **Procedures** — how to do things that any agent might need
- **Project status** — what's active, what's blocked, what's done
- **Research findings** — paper insights, literature connections

### The Rule
> **Share KNOWLEDGE, not IDENTITY.** What you learned is shared. Who you are is private.

---

## Supabase Schema

We already have `documents` table with pgvector. I propose adding a dedicated `shared_knowledge` table optimized for agent memory operations:

```sql
-- Shared Agent Knowledge Base
-- Extends existing pgvector infrastructure

create table if not exists shared_knowledge (
  id uuid default gen_random_uuid() primary key,
  org_id uuid not null default '6420346e-4e6a-47a8-b671-80beacd394b4',
  
  -- What
  tier text not null check (tier in ('core', 'working', 'learning')),
  category text not null, 
  -- core categories: 'principle', 'procedure', 'team', 'client'
  -- working categories: 'project', 'thread', 'commitment'  
  -- learning categories: 'decision', 'correction', 'insight', 'outcome'
  
  title text not null,           -- short summary / searchable title
  content text not null,         -- full content
  
  -- Who
  created_by uuid not null,      -- agent_id who wrote this
  created_by_name text,          -- agent name (for readability)
  source text,                   -- 'bridget', 'sybil', 'saber', 'a2a', 'auto'
  
  -- Context
  confidence text default 'high' check (confidence in ('high', 'medium', 'low')),
  surprise_score float,          -- 0.0 to 1.0 (null for core/working)
  tags text[],                   -- searchable tags
  related_ids uuid[],            -- links to related knowledge entries
  
  -- For decisions specifically
  decision_context jsonb,        -- { reasoning, alternatives, assumptions, kill_criteria }
  outcome jsonb,                 -- { result, scored_at, success: bool, notes }
  
  -- For working tier
  status text default 'active' check (status in ('active', 'resolved', 'archived')),
  resolved_at timestamptz,
  
  -- Search
  embedding vector(1536),        -- for semantic search
  
  -- Meta
  accessed_count int default 0,  -- track what's actually useful
  last_accessed_at timestamptz,
  expires_at timestamptz,        -- for low-confidence learning entries (7-day TTL)
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists sk_embedding_idx 
  on shared_knowledge using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists sk_tier_idx on shared_knowledge(tier);
create index if not exists sk_category_idx on shared_knowledge(category);
create index if not exists sk_tags_idx on shared_knowledge using gin(tags);
create index if not exists sk_status_idx on shared_knowledge(status);
create index if not exists sk_created_by_idx on shared_knowledge(created_by);
create index if not exists sk_confidence_idx on shared_knowledge(confidence);

-- Search function: semantic search across shared knowledge
create or replace function search_shared_knowledge(
  query_embedding vector(1536),
  match_threshold float default 0.65,
  match_count int default 10,
  filter_tier text default null,
  filter_category text default null,
  filter_tags text[] default null,
  exclude_archived boolean default true
)
returns table (
  id uuid,
  tier text,
  category text,
  title text,
  content text,
  created_by_name text,
  confidence text,
  tags text[],
  similarity float,
  created_at timestamptz
)
language sql stable
as $$
  select
    sk.id,
    sk.tier,
    sk.category,
    sk.title,
    sk.content,
    sk.created_by_name,
    sk.confidence,
    sk.tags,
    1 - (sk.embedding <=> query_embedding) as similarity,
    sk.created_at
  from shared_knowledge sk
  where 1 - (sk.embedding <=> query_embedding) > match_threshold
    and (filter_tier is null or sk.tier = filter_tier)
    and (filter_category is null or sk.category = filter_category)
    and (filter_tags is null or sk.tags && filter_tags)
    and (not exclude_archived or sk.status != 'archived')
  order by sk.embedding <=> query_embedding
  limit match_count;
$$;

-- Track access (for measuring what's actually useful)
create or replace function touch_knowledge(knowledge_id uuid)
returns void
language sql
as $$
  update shared_knowledge 
  set accessed_count = accessed_count + 1,
      last_accessed_at = now()
  where id = knowledge_id;
$$;

-- Auto-expire low-confidence learning entries
create or replace function expire_low_confidence()
returns void
language sql
as $$
  update shared_knowledge
  set status = 'archived'
  where confidence = 'low'
    and tier = 'learning'
    and expires_at < now()
    and accessed_count = 0;
$$;

-- Trigger for updated_at
create trigger sk_updated_at
  before update on shared_knowledge
  for each row
  execute function update_updated_at();
```

---

## When Agents Access Shared Knowledge

### Automatic (Smart-Trigger)

The smart-trigger classifier detects when an incoming message likely needs context. When triggered, the agent:

1. Searches **local files first** (fast, no API call)
2. If local search is insufficient OR the topic involves other agents/shared projects → queries **shared_knowledge** via semantic search

**Trigger patterns:**

| Pattern | Example | Search Scope |
|---------|---------|-------------|
| Decision language | "should we...", "I think we should...", "let's..." | core/principles + learning/decisions |
| Name/project reference | "Vulkn", "Saber", "the investing project" | core/clients + working/projects |
| Past reference | "remember when...", "last time we...", "didn't we..." | learning/ (full semantic search) |
| Planning/strategy | "next steps", "implementation order", "roadmap" | core/principles + working/projects |
| Correction/conflict | "actually...", "that's not right", "but..." | core/ + learning/corrections |
| How-to | "how do I...", "what's the process for..." | core/procedures |

### Manual (Agent-Initiated)

Agents can also query shared knowledge explicitly:
- During heartbeat consolidation (check what other agents logged)
- When starting a new project (pull relevant prior knowledge)
- When asked about another agent's domain

### On Write

Agents write to shared knowledge when:
- A founder states an operating principle → `core/principle`
- A decision is made that affects the team → `learning/decision`
- A correction applies to all agents → `learning/correction`
- A project status changes → `working/project`
- An outcome is observed for a logged decision → `learning/outcome`

---

## What Gets Logged — Concrete Examples

### Core/Principle
```json
{
  "tier": "core",
  "category": "principle",
  "title": "Time is never an issue for AI agents",
  "content": "Ship fast is a misnomer. We are not humans with limited hours. Quality over speed, always. Rush to understand, not to ship.",
  "source": "bridget",
  "confidence": "high",
  "tags": ["operating-principle", "decision-making", "quality"]
}
```

### Learning/Decision (Investing)
```json
{
  "tier": "learning",
  "category": "decision",
  "title": "Short BTC based on funding rate spike",
  "content": "Funding rate hit 0.08%. Historical analysis shows 73% correction probability within 8 hours. Entered short at $94,200.",
  "created_by_name": "Saber",
  "confidence": "medium",
  "surprise_score": 0.3,
  "tags": ["investing", "crypto", "btc", "technical-signal"],
  "decision_context": {
    "reasoning": "Funding rate > 0.05% has preceded corrections 73% of time in backtesting",
    "alternatives": ["Wait for 0.1% threshold", "Hedge with ETH long"],
    "assumptions": ["No major news catalyst", "Market structure similar to backtest period"],
    "kill_criteria": "Exit if funding rate drops below 0.03% without price movement"
  },
  "outcome": null
}
```

### Learning/Correction
```json
{
  "tier": "learning",
  "category": "correction",
  "title": "Friston surprise model must be adapted for agents",
  "content": "Bridget corrected: LLM knowledge is pattern matching, not memory. Surprise-only filtering would lose core knowledge because unlike humans, agents have no persistent biological memory. Core knowledge must be explicitly protected.",
  "source": "bridget",
  "confidence": "high",
  "tags": ["memory-architecture", "friston", "correction", "methodology"]
}
```

### Learning/Outcome
```json
{
  "tier": "learning",
  "category": "outcome",
  "title": "Outcome: BTC short based on funding rate",
  "content": "Liquidation cascade happened 3 hours after entry. Price dropped 4.2%. Closed at $90,240. Profit: +4.2%.",
  "related_ids": ["<decision-uuid>"],
  "tags": ["investing", "crypto", "btc", "win"],
  "outcome": {
    "result": "success",
    "scored_at": "2026-02-16T14:00:00Z",
    "success": true,
    "notes": "Funding rate signal validated. 3hr timeline was faster than expected 8hr."
  }
}
```

---

## Access Patterns by Agent

| Agent | Primarily Reads | Primarily Writes |
|-------|----------------|-----------------|
| **Sybil** | learning/decisions (for backtesting), core/principles (for methodology) | learning/insights, learning/corrections, core/procedures |
| **Saber** | core/clients, core/principles, learning/outcomes | learning/decisions (investing), working/projects |
| **Sam** | working/projects, core/clients, learning/corrections | learning/outcomes (risk events), working/commitments |
| **Sage** | core/procedures, working/projects | core/procedures (architecture docs), learning/decisions |
| **Bridget** | Everything (founder override) | core/principles (source of truth) |

---

## Migration Plan

### Phase 1: Create Schema (Now)
- Run SQL in Supabase
- Test with a few manual entries

### Phase 2: Seed Core Knowledge (This Week)
- Populate core/principles from MEMORY.md Key Lessons
- Populate core/team from team directory
- Populate core/clients from existing client profiles

### Phase 3: Build Agent Integration (Next Week)  
- Write `shared-knowledge.js` utility (search, write, touch)
- Integrate with smart-trigger classifier
- Each agent gets read/write access

### Phase 4: Start Logging Decisions (With Investing)
- Investing project becomes first real use case
- Every trade decision logged with context
- Outcomes tracked and scored

---

## Research Paper Connection

The shared knowledge base is itself a research finding:

1. **Collective memory formation** — how does shared storage change team dynamics?
2. **Knowledge attribution** — who wrote what? Do agents trust knowledge from certain agents more?
3. **Access patterns** — what knowledge actually gets retrieved and used? (tracked via `accessed_count`)
4. **The retrieval gap** — having knowledge isn't enough; surfacing it at the right moment is the hard problem
5. **Core vs. learning** — the fundamental difference between LLM cognition and biological cognition, made architectural

---

*Draft for Bridget review. Not rushing this — doing it right.*
