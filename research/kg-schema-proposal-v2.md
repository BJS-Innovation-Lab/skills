# KG Schema Proposal v2 — For Team Review

**Author:** Sybil · **Date:** 2026-02-17  
**Status:** DRAFT — requesting feedback before implementation  
**Full research:** `research/kg-schema-deep-research.md`

---

## What This Is

A knowledge graph for VULKN field agents. Captures who said what, who knows who, what decisions were made, what patterns emerge — across clients and over time. Built on Supabase PostgreSQL (no Neo4j).

## Why We Need It

Right now agent memory is flat text files. An agent can search "Click Seguros" but can't answer:
- "Which clients have similar onboarding friction?"
- "What do all insurance clients have in common?"
- "Who decided X and what led to that decision?"

The KG connects isolated facts into queryable intelligence.

---

## Entity Types (10)

| Type | What It Captures | Example |
|------|-----------------|---------|
| **Person** | Anyone mentioned in conversations | Javier Mitrani, Suzanne Rubinstein |
| **Organization** | Companies, teams, departments | Click Seguros, Senda Chat |
| **Product** | Things clients sell/use/build | Insurance policies, chat platform |
| **Topic** | Problems, solutions, patterns, subjects | "onboarding friction", "WhatsApp integration" |
| **Decision** | Explicit choices with consequences | "Chose Option B for multi-client isolation" |
| **Preference** | Stated or inferred preferences | "Prefers WhatsApp over email" |
| **Task** | Action items, goals, deliverables | "Deploy identity fix", "Define credential flow" |
| **Event** | Meetings, incidents, milestones | "Sam identity crisis Feb 15" |
| **Conversation** | Episodic nodes — source material | Session transcripts, chat segments |
| **Skill** | Capabilities, expertise areas | "React development", "insurance underwriting" |

**What we cut:** Location → property on Person/Org. Document → reference on edges. Metric → property on Org/Product. Goal → Task with `type: goal`. Problem/Solution/Pattern → merged into Topic with `topic_type`.

**Principle:** Start lean. Add types only when we have 100+ instances AND distinct query patterns.

---

## Relationship Types (12 core)

| Relationship | Between | Notes |
|-------------|---------|-------|
| `WORKS_AT` | Person → Org | temporal (valid_from/to) |
| `HAS_ROLE` | Person → Org | temporal, `role` property |
| `KNOWS` | Person → Person | |
| `REPORTS_TO` | Person → Person | temporal |
| `PREFERS` | Person/Org → Topic/Product | strength property |
| `DECIDED` | Person → Decision | |
| `DISCUSSED` | Conversation → Topic | |
| `MENTIONED_IN` | Any → Conversation | provenance link |
| `RELATED_TO` | Any → Any | catch-all with `relation_type` |
| `ASSIGNED_TO` | Task → Person | |
| `PART_OF` | Any → Any | hierarchy |
| `USES` | Org → Product | |

**Every edge carries:**
- `valid_from` / `valid_to` — when the fact was true in the real world
- `created_at` / `invalidated_at` — when we learned/superseded it
- `confidence` — 0.0-1.0
- `source_type` — extracted / stated / inferred / manual
- `source_episode_id` — which conversation produced this

---

## Tables (PostgreSQL)

### `entities`
```
id              UUID PK
tenant_id       UUID FK → tenants (RLS)
entity_type     TEXT (Person, Organization, etc.)
name            TEXT
name_embedding  VECTOR(1536) — for entity resolution
properties      JSONB — flexible per-type metadata
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### `edges`
```
id              UUID PK
tenant_id       UUID FK → tenants (RLS)
source_id       UUID FK → entities
target_id       UUID FK → entities
relation_type   TEXT (WORKS_AT, PREFERS, etc.)
fact            TEXT — natural language: "John works at Acme as CTO"
fact_embedding  VECTOR(1536) — for semantic edge search
properties      JSONB
confidence      FLOAT
source_type     TEXT (extracted/stated/inferred/manual)
source_episode_id UUID FK → episodes
valid_from      TIMESTAMPTZ
valid_to        TIMESTAMPTZ (NULL = current)
created_at      TIMESTAMPTZ
invalidated_at  TIMESTAMPTZ
```

### `episodes`
```
id              UUID PK
tenant_id       UUID FK → tenants (RLS)
conversation_id UUID — links to existing conversations table
content         TEXT
content_embedding VECTOR(1536)
source_type     TEXT (conversation/document/manual)
metadata        JSONB
occurred_at     TIMESTAMPTZ
created_at      TIMESTAMPTZ
```

---

## Extraction Pipeline

```
Conversation → Chunk by turn/topic → LLM structured extraction → Entity resolution → Graph upsert
```

1. **Chunking:** By conversation turn or topic shift (not fixed token windows)
2. **Extraction:** Gemini Flash with JSON schema (structured output) — ~$0.002/day/agent
3. **Entity resolution:** Exact name match → embedding similarity (>0.85) → LLM confirmation for ambiguous cases
4. **Upsert:** Merge-on-match for entities, temporal invalidation for contradicting edges

**Hybrid approach:** Streaming extraction during conversations (fresh), batch reconciliation nightly (accurate).

---

## Multi-Tenancy

- Shared tables with `tenant_id` + Supabase RLS
- Each client is a tenant — complete data isolation by default
- Cross-client intelligence via service-role queries on anonymized/generalized patterns only

---

## Open Questions for the Team

1. **Entity types:** Are 10 right? Too many? Missing something critical?
2. **Relationship types:** What connections matter that I'm not capturing?
3. **Extraction granularity:** Every message? Or only when "something interesting" happens?
4. **Cross-client intelligence:** How aggressive do we want pattern sharing across tenants?
5. **Embedding model:** text-embedding-3-small (1536d) or something smaller/faster?
6. **Episode granularity:** One episode per message? Per conversation turn? Per topic?

---

## Cost Estimate

- **Extraction:** Gemini Flash ~$0.002/day/agent (20 messages/batch)
- **Embeddings:** ~$0.001/day/agent (entity names + edge facts)
- **Storage:** Supabase included (well within free/pro tier)
- **Total per agent:** ~$0.10/month for KG maintenance

---

*Full research and sources in `research/kg-schema-deep-research.md`*
