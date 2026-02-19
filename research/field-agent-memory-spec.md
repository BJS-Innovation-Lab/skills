# Field Agent Memory Architecture — Design Spec

**Author:** Sybil (with Bridget)  
**Date:** February 15, 2026  
**Status:** APPROVED — Building  
**Parent spec:** `research/agent-memory-systems-spec.md`

---

## Context

Field agents are deployed to individual SMB clients. They operate on behalf of the client, not BJS Labs internally. This creates hard boundaries:

- **No access** to BJS internal strategy, research, financials, or other client data
- **No shared brain** — one agent per client, no cross-agent communication (for now)
- **Read-only access** to BJS operational knowledge base (procedures, best practices, templates)

This spec defines the memory architecture for field agents as a variant of the three-tier system.

---

## Architecture

### Memory Structure (Per Field Agent)

```
memory/
├── core/                    # TIER 1: Client identity + operational basics
│   ├── identity.md          # Agent name, role, agent ID, client name
│   ├── client.md            # Client business, industry, contacts, brand voice
│   ├── procedures.md        # Client-specific SOPs and workflows
│   └── preferences.md       # Client communication style, timezone, preferences
│
├── working/                 # TIER 2: Active client work
│   ├── projects/            # Active client projects
│   ├── threads/             # Open conversations / follow-ups
│   └── pending.md           # Committed deliverables
│
└── learning/                # TIER 3: Client-specific lessons
    ├── decisions/           # Meaningful decisions made for this client
    ├── corrections/         # Client corrections (always stored)
    ├── insights/            # Observations about client needs, patterns
    └── outcomes/            # Decision → outcome tracking
```

### What's Different From Internal Agents

| Feature | Internal Agents | Field Agents |
|---------|----------------|--------------|
| Core identity | BJS team member | Client's agent |
| Shared brain | Full cross-agent Supabase | None |
| BJS knowledge base | Full read/write | Read-only queries |
| Smart-trigger levels | none / local / shared | none / local / hq |
| Memory sync outward | Yes (sync-memory.cjs) | No |
| Team highlights | Yes | No |
| Nightly reports | To HQ via A2A (field-admin) | Same (unchanged) |

---

## BJS Knowledge Base

### Purpose

A curated, HQ-maintained knowledge base that field agents can query when they encounter situations not covered by their local memory. Think of it as the franchise operations manual.

### What Goes In

| Category | Examples | Tag |
|----------|----------|-----|
| **Procedures** | How to use A2A, cron, Notion, escalation flows | `procedure` |
| **Best Practices** | Lessons learned across all client deployments | `best-practice` |
| **Templates** | Email templates, onboarding checklists, report formats | `template` |
| **Skill Docs** | How each skill works, common gotchas, tips | `skill-doc` |
| **Escalation Rules** | When to escalate, severity levels, response expectations | `escalation` |
| **Tool Guides** | CLI usage, API patterns, error handling | `tool-guide` |

### What Stays OUT

- ✗ Internal team strategy or decisions
- ✗ Other client data (any client)
- ✗ Research paper content
- ✗ Investing project data
- ✗ Founder conversations or financials
- ✗ Agent-to-agent interpersonal context
- ✗ Pricing, margins, business model details

### Supabase Schema

```sql
-- BJS Knowledge Base (read-only for field agents)
CREATE TABLE bjs_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'procedure', 'best-practice', 'template', 
    'skill-doc', 'escalation', 'tool-guide'
  )),
  tags TEXT[] DEFAULT '{}',
  
  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Metadata
  created_by TEXT NOT NULL,           -- agent name who wrote it
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Embeddings for semantic search
  embedding vector(1536)
);

-- Indexes
CREATE INDEX idx_bjs_knowledge_category ON bjs_knowledge(category);
CREATE INDEX idx_bjs_knowledge_tags ON bjs_knowledge USING GIN(tags);
CREATE INDEX idx_bjs_knowledge_embedding ON bjs_knowledge 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);

-- Semantic search function
CREATE OR REPLACE FUNCTION search_bjs_knowledge(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  category_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  category TEXT,
  tags TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bk.id,
    bk.title,
    bk.content,
    bk.category,
    bk.tags,
    1 - (bk.embedding <=> query_embedding) as similarity
  FROM bjs_knowledge bk
  WHERE (category_filter IS NULL OR bk.category = category_filter)
  ORDER BY bk.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Data Flow

```
                    Sybil, Saber (HQ)
                    curate procedures, skill docs, templates
                         │
                         ▼
┌─────────────────────────────────────────┐
│         bjs_knowledge table              │
│         (Supabase)                       │
│                                          │
│  • Versioned entries                     │
│  • Categorized + tagged                  │
│  • Semantic search enabled               │
│  • Row-level security:                   │
│    - HQ agents: read/write               │
│    - Field agents: read-only             │
└──────┬────────────────────┬─────────────┘
       │                    ▲
       │ query (hq level)   │ write fixes after resolving escalations
       ▼                    │
Field Agents ──escalate──▶ Sam (CS Agent)
  (Santos,                  - Receives escalations
   future)                  - Resolves issues
                            - Writes reusable fixes to KB
                            - Goal: every fix that could help
                              another agent gets captured
```

**Sam's role is critical:** He's the primary writer of `best-practice`, `escalation`, and `tool-guide` entries because he sees every problem field agents encounter. Every resolved escalation is evaluated: if the fix is reusable, it goes into the knowledge base. The goal is that the same issue never gets escalated twice.

See `skills/cs-agent/escalation-handler/SKILL.md` for Sam's full KB writing protocol.

---

## Smart-Trigger for Field Agents

Field agents use a modified smart-trigger classifier with two retrieval levels instead of three:

### Levels

| Level | When | What happens |
|-------|------|-------------|
| `none` | Casual chat, greetings, simple tasks | No search. Proceed with loaded context. |
| `local` | References to past client work, decisions, preferences | Search agent's own `memory/` files |
| `hq` | Procedural questions, error handling, scope uncertainty, escalation decisions | Query `bjs_knowledge` table via semantic search |

### HQ-Level Trigger Patterns

```
Procedural:
  "how do i", "how should i", "what's the process for"
  "is there a template for", "standard procedure"

Error/Failure:
  "error", "failed", "broken", "not working"
  "something went wrong", "can't figure out"

Scope:
  "can i do this", "is this something i handle"
  "should i be doing", "outside my scope"
  "am i allowed to"

Escalation:
  "should i escalate", "is this urgent"
  "do i need to tell", "contact hq"
  
Tool/Skill:
  "how does [tool] work", "never used this before"
  "what skill do i use for"
```

### Implementation

Variant of `rag/smart-trigger.cjs` with:
- `shared` level replaced by `hq` level
- HQ trigger patterns added (procedural, error, scope, escalation)
- Team name references removed (field agent doesn't know internal team)
- Client name references configured per deployment
- Same zero-token regex approach

File: `rag/smart-trigger-field.cjs`

---

## Boot Sequence (Field Agent)

1. Load `core/` files (client identity, procedures, preferences)
2. Load `working/pending.md` (open commitments)
3. Load recent `working/` context (last 3-7 days)
4. **No team highlights** (no shared brain)
5. **No MEMORY.md** loading of BJS internal content
6. Ready to process messages with `none` / `local` / `hq` trigger levels

---

## Consolidation (Simplified)

Field agents run the same consolidation cycle but scoped to client knowledge only:

1. **Promote** — Recurring client patterns → `core/procedures.md` or `core/preferences.md`
2. **Prune** — Low-confidence entries >7 days, resolved working items >14 days
3. **Verify** — Core files still accurate? Client info changed?
4. **Outcome Check** — Surface old decisions, log what happened

No cross-agent promotion. No writing to shared knowledge base.

---

## Future: Multi-Agent Client Teams

When clients eventually have multiple agents, we'll add:
- **Client-scoped shared brain** (separate from BJS knowledge base)
- Smart-trigger `shared` level (cross-agent within same client)
- Client-specific `sync-memory.cjs` pointing to client-scoped Supabase table
- This is a separate spec — not needed now

---

## Implementation Plan

### Phase 1: BJS Knowledge Base (This Week)
1. Create `bjs_knowledge` table in Supabase
2. Build `rag/bjs-knowledge-write.cjs` (HQ tool to add/update entries)
3. Seed with initial content (procedures, escalation rules, skill docs)
4. Build `rag/bjs-knowledge-search.cjs` (field agent query tool)

### Phase 2: Field Agent Smart-Trigger (This Week)
1. Fork `smart-trigger.cjs` → `smart-trigger-field.cjs`
2. Add HQ-level trigger patterns
3. Remove internal team references
4. Test against field agent conversation scenarios

### Phase 3: Deploy to Santos (Next Week)
1. Set up `memory/core/`, `memory/working/`, `memory/learning/` on Santos
2. Configure `smart-trigger-field.cjs` with client names
3. Provide read-only Supabase credentials for `bjs_knowledge`
4. Test full flow: message → trigger → query → response

---

## Key Files

| File | Purpose |
|------|---------|
| `research/field-agent-memory-spec.md` | This spec |
| `research/agent-memory-systems-spec.md` | Parent spec (internal agents) |
| `research/shared-memory-schema.md` | Full Supabase schema (internal) |
| `rag/smart-trigger.cjs` | Internal agent classifier |
| `rag/smart-trigger-field.cjs` | Field agent classifier (to build) |
| `rag/bjs-knowledge-write.cjs` | HQ knowledge base writer (to build) |
| `rag/bjs-knowledge-search.cjs` | Field agent query tool (to build) |

---

*Spec approved by Bridget. Building starts now.*
