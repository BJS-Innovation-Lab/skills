# Knowledge Graph Schema Research for VULKN Agent Memory

**Date:** 2026-02-17  
**Purpose:** Inform the final KG schema design for VULKN's cross-client AI agent intelligence system  
**Stack:** Supabase PostgreSQL (not Neo4j)

---

## Executive Summary

The state of the art in agent memory KGs is defined by **Zep/Graphiti** (2025), which uses a temporally-aware knowledge graph with three core constructs: **entity nodes**, **episodic nodes** (conversation chunks), and **edges with temporal metadata**. The key insight from production systems is: **fewer entity types with richer relationships beats more entity types with thin relationships.**

**Our recommendation: trim your 16 entity types to 8-10 core types**, use JSONB `properties` for flexibility, and invest heavily in temporal/provenance metadata on edges. PostgreSQL with RLS-based multi-tenancy is viable for your scale.

---

## 1. Production KG Schemas for Agent Memory

### What Real Systems Use

**Zep/Graphiti** (the current SOTA, [arXiv:2501.13956](https://arxiv.org/abs/2501.13956)) uses a surprisingly simple schema:

- **Entity Nodes** — people, organizations, concepts, etc. with `name`, `entity_type`, `properties` (JSONB equivalent), `created_at`, `updated_at`
- **Episodic Nodes** — conversation chunks/messages with source metadata and timestamps
- **Edges** — typed relationships between entities with bi-temporal tracking (`valid_from`, `valid_to`, `created_at`), `fact` (natural language description), and `confidence`

Graphiti supports **custom entity types via Pydantic models** but defaults to open extraction — the LLM decides what entities to create. This is key: they don't pre-define a fixed taxonomy of 16+ types.

**Key patterns from production systems:**

| System | Entity Types | Approach |
|--------|-------------|----------|
| Zep/Graphiti | Dynamic (LLM-extracted) | ~5-8 common types emerge organically |
| Microsoft GraphRAG | Entity + Community | Cluster-based summarization |
| MemGPT | Key-value memory | No graph structure |
| SGMEM | Sentence-level tree | Utterance-based, not entity-based |

### Verdict on Your 16 Types

**Too many.** The research consistently shows that:

1. **Over-specified taxonomies** create extraction friction — the LLM has to decide between "Problem" vs "Decision" vs "Goal" when the boundaries are fuzzy
2. **Types that rarely get queried** add schema weight without value (Location, Document, Metric are rarely the *target* of agent queries)
3. **The best systems let types emerge** from data while constraining to a core set

### Recommended Entity Types (10 Core)

| Entity Type | Justification | Your Original |
|------------|---------------|---------------|
| **Person** | Universal, always queried | ✅ Keep |
| **Organization** | Client companies, vendors, partners | ✅ Keep |
| **Product** | What clients sell/use | ✅ Keep |
| **Topic** | Replaces Problem, Solution, Pattern — a general "subject matter" node | 🔄 Merge 3→1 |
| **Decision** | High-value, actionable intelligence | ✅ Keep |
| **Preference** | Critical for personalization | ✅ Keep |
| **Task** | Actionable items with status | ✅ Keep (absorbs Goal) |
| **Event** | Temporal anchors (meetings, incidents, milestones) | ✅ Keep |
| **Conversation** | Episodic nodes — the source material | ✅ Keep |
| **Skill/Capability** | Useful for expertise matching | ✅ Keep |

**Dropped:**
- **Location** → property on Person/Organization/Event, not its own node
- **Document** → reference/URL property on edges or as metadata, not a first-class entity
- **Metric** → property on Organization/Product/Task, not its own node  
- **Goal** → absorbed into Task (a task with `type: goal`)
- **Problem/Solution/Pattern** → merged into Topic with `topic_type` discriminator

**Why this works:** You can always *add* types later. Starting lean means cleaner extraction, fewer deduplication headaches, and queries that don't need to JOIN across rarely-used node types.

---

## 2. Relationship Design Patterns

### Temporal Relationships (Bi-Temporal Model)

The Zep/Graphiti approach is the gold standard here. Every edge carries:

```
valid_from    TIMESTAMPTZ  -- when this fact became true in the real world
valid_to      TIMESTAMPTZ  -- when this fact stopped being true (NULL = current)
created_at    TIMESTAMPTZ  -- when we ingested this fact
invalidated_at TIMESTAMPTZ -- when a newer fact superseded this one
```

**Why bi-temporal matters for VULKN:**
- "John was VP of Sales at Acme" → `valid_from: 2024-01, valid_to: 2025-06`
- "John is now CEO of Acme" → `valid_from: 2025-06, valid_to: NULL`
- Both facts coexist in the graph. Queries can ask "who was VP in March 2024?" or "what changed?"

### Confidence & Provenance on Edges

Every edge should carry:

```sql
confidence    FLOAT        -- 0.0-1.0, how certain we are
source_type   TEXT         -- 'extracted', 'stated', 'inferred', 'manual'
source_id     UUID         -- reference to the conversation/episode that produced this
extraction_model TEXT      -- which LLM version extracted this
```

**Provenance hierarchy (from research):**
1. **Stated** (confidence 0.9-1.0) — user explicitly said it: "I'm the CTO"
2. **Extracted** (confidence 0.6-0.9) — LLM extracted from context: "When John presented the Q3 results..." → John PRESENTED_AT Q3_Review
3. **Inferred** (confidence 0.3-0.6) — derived from patterns: John attends all board meetings → John LIKELY_MEMBER_OF Board
4. **Manual** (confidence 1.0) — human-curated corrections

### Recommended Relationship Types

**Core relationships (start with these):**

| Relationship | Between | Example |
|-------------|---------|---------|
| `WORKS_AT` | Person → Organization | temporal |
| `HAS_ROLE` | Person → Organization | temporal, with `role` property |
| `KNOWS` | Person → Person | |
| `REPORTS_TO` | Person → Person | temporal |
| `PREFERS` | Person/Org → Topic/Product | with strength property |
| `DECIDED` | Person → Decision | |
| `DISCUSSED` | Conversation → Topic | |
| `MENTIONED_IN` | Entity → Conversation | provenance link |
| `RELATED_TO` | Any → Any | catch-all with `relation_type` |
| `ASSIGNED_TO` | Task → Person | |
| `PART_OF` | Entity → Entity | hierarchical |
| `USES` | Organization → Product | |

**Key pattern: keep relationship types broad and use properties for specifics.** Don't create `LOVES`, `LIKES`, `TOLERATES`, `HATES` — use `SENTIMENT_TOWARD` with a `strength` property.

### Hierarchical vs Flat

**Recommendation: Flat with optional hierarchy via `PART_OF` edges.**

Don't build deep inheritance hierarchies into your schema. Instead:
- All entities are in one `entities` table with `entity_type` discriminator
- Hierarchy is modeled via `PART_OF` relationships (team PART_OF department PART_OF company)
- This keeps queries simple and avoids the "which table do I query?" problem

---

## 3. Extraction Pipeline Design

### Structured Extraction (Recommended for VULKN)

The research strongly favors **LLM structured output** over free-form NER for knowledge graph construction:

**Best approach: Schema-guided structured extraction using tool/function calling**

```json
{
  "entities": [
    {"name": "John Smith", "type": "Person", "properties": {"role": "CTO"}},
    {"name": "Acme Corp", "type": "Organization"}
  ],
  "relationships": [
    {"source": "John Smith", "target": "Acme Corp", "type": "HAS_ROLE", 
     "properties": {"role": "CTO"}, "confidence": 0.95}
  ]
}
```

**Why structured > free-form NER:**
- Consistent output format → easier downstream processing
- Schema constraints reduce hallucination (LLM can only output defined types)
- OpenAI, Anthropic, Gemini all support structured output natively
- Pydantic/Zod validation catches malformed extractions before they enter the graph

### Extraction Pipeline Architecture

```
Conversation → Chunking → LLM Extraction → Entity Resolution → Graph Upsert
                              ↓                    ↓
                    Structured JSON          Dedup/Merge
                    (entities + rels)        (embedding similarity)
```

**Stage 1: Chunking**
- Chunk conversations by turn or by topic shift (not fixed token windows)
- Each chunk becomes an "Episode" node linked to extracted entities

**Stage 2: LLM Extraction**
- Use structured output with your entity/relationship schema
- Include existing entities from the graph in the prompt for dedup hints
- Use a focused prompt: "Extract people, organizations, decisions, preferences, and their relationships from this conversation segment"

**Stage 3: Entity Resolution** (critical for VULKN's multi-client scenario)

Three-layer dedup strategy:
1. **Exact match** on normalized name within tenant scope
2. **Embedding similarity** (cosine > 0.85) for fuzzy matches ("John", "John Smith", "J. Smith")
3. **LLM confirmation** for ambiguous cases — ask the LLM "are these the same entity?"

Graphiti's approach: generate a name embedding for each entity, search for similar entities before creating new ones, and use LLM to resolve conflicts.

**Stage 4: Graph Upsert**
- Merge-on-match for entities (update properties, don't duplicate)
- For edges: check if relationship already exists; if so, update temporal metadata
- If new fact contradicts existing: invalidate old edge, create new one

### Batch vs Streaming

**For VULKN: Streaming extraction with batch reconciliation.**

- **Streaming (real-time):** Extract entities/relationships as each conversation happens. Enables the agent to use the KG during the conversation itself.
- **Batch (nightly/hourly):** Re-process recent conversations with full graph context for better entity resolution. Cross-reference entities across clients (for cross-client intelligence). Run community detection and pattern analysis.

The Graphiti paper confirms this hybrid approach works best — real-time for freshness, batch for accuracy.

---

## 4. Schema Anti-Patterns to Avoid

### Anti-Pattern 1: Over-Normalization (Entity Type Explosion)

**Problem:** Creating 20+ entity types where 8 would suffice. Every new type requires extraction prompt updates, dedup logic, UI support, and query complexity.

**Your risk:** Your original 16 types edges toward this. "Pattern" as a separate entity type is especially risky — patterns are better represented as properties or community summaries.

**Fix:** Start with ≤10 types. Use `entity_type` + JSONB `properties` for variation. Add new types only when you have >100 instances AND distinct query patterns for them.

### Anti-Pattern 2: Under-Connected Entities

**Problem:** Extracting lots of entities but few relationships. A knowledge graph with many orphan nodes is just a fancy database.

**Fix:** Require at least one relationship per entity extraction. If the LLM extracts "Acme Corp" but no relationships, either connect it to the conversation episode or skip it.

### Anti-Pattern 3: Property Bloat on Nodes

**Problem:** Storing 30+ properties on each entity node, most of which are NULL for most entities.

**Fix:** Use a small set of indexed columns (`name`, `entity_type`, `tenant_id`, `created_at`) plus a JSONB `properties` column for everything else. Only promote to a real column if you index/query on it frequently.

### Anti-Pattern 4: Reifying Everything

**Problem:** Turning every relationship into a node (e.g., creating a "Membership" node between Person and Organization instead of an edge). This is sometimes necessary (when the relationship has complex properties) but often overkill.

**Fix:** Use edge properties for simple metadata. Only reify into a node when the "relationship" has its own relationships (e.g., a Contract between two parties that has its own timeline, amendments, etc.).

### Anti-Pattern 5: Ignoring Temporal Invalidation

**Problem:** Only adding new facts without marking old ones as superseded. The graph accumulates contradictions: "John is VP" AND "John is CEO" both appear valid.

**Fix:** Implement the bi-temporal model. When a new fact contradicts an existing one, set `valid_to` on the old edge. Graphiti handles this with an "edge invalidation" step during ingestion.

### Anti-Pattern 6: No Provenance Trail

**Problem:** Can't trace why a fact exists in the graph. When a client asks "why does your system think I prefer X?", you can't answer.

**Fix:** Every edge links back to its source episode/conversation. Store `source_type`, `confidence`, and `extraction_model`.

---

## 5. PostgreSQL-Specific Implementation

### Schema Design for Supabase

```sql
-- Core tables
CREATE TABLE entities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    entity_type     TEXT NOT NULL,  -- 'Person', 'Organization', etc.
    name            TEXT NOT NULL,
    name_embedding  VECTOR(1536),   -- for entity resolution
    properties      JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE edges (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    source_id       UUID NOT NULL REFERENCES entities(id),
    target_id       UUID NOT NULL REFERENCES entities(id),
    relation_type   TEXT NOT NULL,  -- 'WORKS_AT', 'PREFERS', etc.
    fact            TEXT,           -- natural language: "John works at Acme as CTO"
    fact_embedding  VECTOR(1536),   -- for semantic edge search
    properties      JSONB DEFAULT '{}',
    confidence      FLOAT DEFAULT 0.5,
    source_type     TEXT DEFAULT 'extracted', -- extracted/stated/inferred/manual
    source_episode_id UUID REFERENCES episodes(id),
    valid_from      TIMESTAMPTZ DEFAULT now(),
    valid_to        TIMESTAMPTZ,    -- NULL = currently valid
    created_at      TIMESTAMPTZ DEFAULT now(),
    invalidated_at  TIMESTAMPTZ
);

CREATE TABLE episodes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    conversation_id UUID,
    content         TEXT NOT NULL,
    content_embedding VECTOR(1536),
    source_type     TEXT,  -- 'conversation', 'document', 'manual'
    metadata        JSONB DEFAULT '{}',
    occurred_at     TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ DEFAULT now()
);
```

### JSONB vs Normalized Columns

**Rule of thumb:**
- **Indexed column** if you filter/sort on it: `entity_type`, `name`, `tenant_id`, `relation_type`, `confidence`, `valid_from`, `valid_to`
- **JSONB** for everything else: entity-specific properties (role, industry, preferences, contact info)
- **JSONB GIN index** for searching within properties: `CREATE INDEX ON entities USING GIN (properties jsonb_path_ops);`

This gives you schema flexibility (no migrations when you add a property) with query performance where it matters.

### Indexing Strategy

```sql
-- Entity lookups
CREATE INDEX idx_entities_tenant_type ON entities(tenant_id, entity_type);
CREATE INDEX idx_entities_name_trgm ON entities USING GIN (name gin_trgm_ops);  -- fuzzy name search
CREATE INDEX idx_entities_embedding ON entities USING ivfflat (name_embedding vector_cosine_ops);

-- Edge traversal (the critical path)
CREATE INDEX idx_edges_source ON edges(source_id) WHERE valid_to IS NULL;  -- active edges only
CREATE INDEX idx_edges_target ON edges(target_id) WHERE valid_to IS NULL;
CREATE INDEX idx_edges_tenant_type ON edges(tenant_id, relation_type);
CREATE INDEX idx_edges_temporal ON edges(valid_from, valid_to);
CREATE INDEX idx_edges_fact_embedding ON edges USING ivfflat (fact_embedding vector_cosine_ops);

-- Episode lookups
CREATE INDEX idx_episodes_tenant ON episodes(tenant_id, occurred_at DESC);
CREATE INDEX idx_episodes_conversation ON episodes(conversation_id);
```

### Recursive CTEs for Graph Traversal

PostgreSQL recursive CTEs work well for **shallow traversals** (2-4 hops), which is what agent memory queries typically need:

```sql
-- Find all entities connected to a person within 2 hops
WITH RECURSIVE connected AS (
    -- Base: direct connections
    SELECT e.target_id AS entity_id, 1 AS depth, ARRAY[e.source_id, e.target_id] AS path
    FROM edges e
    WHERE e.source_id = $person_id
      AND e.valid_to IS NULL
      AND e.tenant_id = $tenant_id
    
    UNION ALL
    
    -- Recurse: next hop
    SELECT e.target_id, c.depth + 1, c.path || e.target_id
    FROM connected c
    JOIN edges e ON e.source_id = c.entity_id
    WHERE c.depth < 2
      AND e.valid_to IS NULL
      AND e.target_id != ALL(c.path)  -- cycle prevention
      AND e.tenant_id = $tenant_id
)
SELECT DISTINCT en.*, c.depth
FROM connected c
JOIN entities en ON en.id = c.entity_id;
```

**Performance notes from research:**
- Recursive CTEs on 30M rows with depth ~15 run in <1 second with proper indexes (Stack Overflow benchmarks)
- For your use case (likely <1M edges per tenant, depth ≤3), this will be sub-100ms
- **Partial indexes** on `valid_to IS NULL` dramatically help — most queries only care about current facts
- Use `LIMIT` on recursive CTEs to prevent runaway queries
- Consider **materialized paths** or **closure tables** for frequently-traversed hierarchies

### PostgreSQL vs Neo4j Tradeoffs

| Factor | PostgreSQL | Neo4j |
|--------|-----------|-------|
| Shallow traversal (1-3 hops) | ✅ Fast enough | ✅ Native |
| Deep traversal (5+ hops) | ⚠️ CTE overhead | ✅ Optimized |
| ACID transactions | ✅ Full | ✅ Full |
| JSONB flexibility | ✅ Native | ⚠️ Property maps |
| Vector search | ✅ pgvector | ⚠️ Plugin |
| Supabase integration | ✅ Native | ❌ Separate service |
| RLS multi-tenancy | ✅ Built-in | ❌ Custom |
| SQL familiarity | ✅ | ❌ Cypher |

**For VULKN on Supabase, PostgreSQL is the right call.** You'd only need Neo4j if you regularly traverse 5+ hops, which is unlikely for agent memory queries.

### Multi-Tenancy with RLS

```sql
-- Enable RLS on all KG tables
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation ON entities
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
CREATE POLICY tenant_isolation ON edges
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
CREATE POLICY tenant_isolation ON episodes
    USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

**For cross-client intelligence** (patterns across tenants), use a service-role bypass that aggregates anonymized/generalized insights without exposing tenant-specific data.

---

## 6. Similar Use Case Schemas

### CRM Knowledge Graphs

CRM KGs (Salesforce Einstein, HubSpot) typically use:
- **Contact** (Person), **Company** (Organization), **Deal** (Opportunity/Task), **Activity** (Event/Conversation)
- ~4-6 core entity types, heavily relationship-driven
- Key insight: CRMs succeed because they're simple. Don't out-think Salesforce on entity taxonomy.

### Customer Intelligence Platforms

Platforms like Gong, Chorus (conversation intelligence) extract:
- Topics discussed, objections raised, competitors mentioned, next steps
- These map well to: Topic, Decision, Task, Organization
- They do NOT typically create separate "Problem" and "Solution" entity types

### Multi-Tenant Patterns

Three approaches for PostgreSQL multi-tenancy (from Crunchy Data, AWS):

1. **Shared table + RLS** (recommended for VULKN) — single schema, `tenant_id` column, RLS policies. Best for <1000 tenants, simplest operations.
2. **Schema-per-tenant** — separate PostgreSQL schemas. Better isolation but harder to query across tenants.
3. **Database-per-tenant** — maximum isolation, worst for cross-tenant analytics.

**Recommendation:** Shared table + RLS for client data, with a separate `global_insights` schema for cross-client intelligence that stores anonymized patterns.

---

## 7. Implementation Roadmap

### Phase 1: Core Schema (Week 1-2)
- Implement `entities`, `edges`, `episodes` tables with indexes
- Set up RLS multi-tenancy
- Basic CRUD API via Supabase functions

### Phase 2: Extraction Pipeline (Week 2-4)
- Streaming extraction using structured output (Claude/GPT with tool calling)
- Entity resolution with embedding similarity + name matching
- Edge temporal management (invalidation on contradiction)

### Phase 3: Retrieval (Week 3-5)
- Semantic search over entities and edges (pgvector)
- 2-hop graph traversal via recursive CTE
- Combined retrieval: semantic + graph + keyword (BM25 via `pg_trgm`)

### Phase 4: Cross-Client Intelligence (Week 5-8)
- Batch pipeline for pattern detection across tenants
- Anonymized insight aggregation
- Community detection (optional, can use simple clustering)

---

## Sources

1. Rasmussen et al., "Zep: A Temporal Knowledge Graph Architecture for Agent Memory," arXiv:2501.13956, Jan 2025
2. Graphiti open-source framework, github.com/getzep/graphiti
3. OpenAI Cookbook, "Temporal Agents with Knowledge Graphs," Jun 2025
4. Enterprise Knowledge, "Best Practices for Enterprise Knowledge Graph Design," 2023
5. Neo4j Developer Guide, "Creating Knowledge Graphs from Unstructured Data"
6. LangChain Blog, "Constructing Knowledge Graphs from Text Using OpenAI Functions," Oct 2023
7. Shereshevsky, "Entity Resolution at Scale: Deduplication Strategies for KG Construction," Medium, Jan 2026
8. Crunchy Data, "Designing Your Postgres Database for Multi-tenancy"
9. AWS, "Multi-tenant Data Isolation with PostgreSQL Row Level Security," 2022
10. EnterpriseDB, "Representing Graphs in PostgreSQL with SQL/PGQ"
11. Stack Overflow benchmarks on recursive CTE performance with millions of rows
12. Bratanic, "Building Knowledge Graphs with LLM Graph Transformer," TDS, Nov 2024
