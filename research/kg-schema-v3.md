# Knowledge Graph Schema v3 — FINAL (Locked)

**Status:** APPROVED — Ready for implementation
**Date:** 2026-02-17
**Reviewers:** Sybil (author), Santos (field ops), Saber (sales/marketing), Bridget (product)

---

## Entity Types (12)

| # | Entity | Description | Key Properties |
|---|--------|-------------|----------------|
| 1 | **Person** | Any human (client contact, founder, team member) | `name`, `email`, `phone`, `role`, `organization_id`, `is_primary_contact` |
| 2 | **Organization** | Company, business, or group | `name`, `industry`, `size`, `location`, `website`, `stage` (prospect/active/churned) |
| 3 | **Product** | Product or service (ours or client's) | `name`, `type`, `pricing`, `status` |
| 4 | **Topic** | Subject, problem, pattern, capability gap, testimonial, case study | `name`, `topic_type` (general/problem/solution/pattern/gap/testimonial/case_study), `industry_tags[]` |
| 5 | **Decision** | Choice made by a person or org | `description`, `status` (active/reversed/superseded), `outcome`, `reasoning`, `decided_at` |
| 6 | **Preference** | Stated preference or constraint | `description`, `strength` (strong/mild), `context` |
| 7 | **Task** | Action item, goal, or deliverable | `description`, `status` (pending/in_progress/done/blocked), `due_date`, `assigned_to` |
| 8 | **Event** | Meeting, call, milestone, onboarding moment | `name`, `event_type`, `occurred_at`, `duration_min` |
| 9 | **Conversation** | A conversation chunk (20-message batch) | `summary`, `sentiment` (-1.0 to 1.0), `engagement_score` (0-10), `capability_gaps[]`, `message_count`, `channel` |
| 10 | **Skill** | Agent capability or service offered | `name`, `category`, `maturity` (experimental/stable/deprecated) |
| 11 | **Lead** | Prospect tracking through sales pipeline | `name`, `source`, `status` (prospect/qualified/negotiating/converted/lost), `converted_at`, `lost_reason` |
| 12 | **Campaign** | Marketing campaign or outreach effort | `name`, `campaign_type` (email/social/whatsapp/landing_page), `status`, `start_date`, `end_date`, `metrics` |

### Design Decisions
- **No Founder entity** — Person with `role: founder` covers it
- **No Invoice entity** — tracked as edge property (INVOICED) or Task
- **No Testimonial/Case_Study entity** — Topic with `topic_type: testimonial|case_study`
- **No Metric entity** — properties on Conversation and edges
- **No Outcome entity** — `outcome` property on Decision + LED_TO relationship

---

## Relationships (16)

| # | Relationship | From → To | Description |
|---|-------------|-----------|-------------|
| 1 | **WORKS_AT** | Person → Organization | Employment/affiliation |
| 2 | **HAS_ROLE** | Person → Organization | Role within org (properties: `role`, `department`) |
| 3 | **KNOWS** | Person → Person | Interpersonal relationship |
| 4 | **REPORTS_TO** | Person → Person | Reporting structure |
| 5 | **PREFERS** | Person/Organization → Preference | Stated preference |
| 6 | **DECIDED** | Person → Decision | Who made the decision |
| 7 | **DISCUSSED** | Conversation → Topic/Decision/Task | What was talked about |
| 8 | **MENTIONED_IN** | Person/Organization/Product → Conversation | Entity appeared in conversation |
| 9 | **RELATED_TO** | any → any | General relationship (use sparingly) |
| 10 | **ASSIGNED_TO** | Task → Person | Task ownership |
| 11 | **PART_OF** | any → any | Hierarchical containment |
| 12 | **USES** | Person/Organization → Skill/Product | Usage relationship |
| 13 | **LED_TO** | Decision/Conversation → Decision/Task/Topic | Causal chain (critical for outcome tracking) |
| 14 | **SIMILAR_TO** | Topic → Topic, Organization → Organization | Cross-client pattern matching (anonymized) |
| 15 | **REFERRED_BY** | Lead → Person/Organization | Referral source |
| 16 | **CONVERTED_TO** | Lead → Organization | Prospect became client |

---

## Edge Properties (Bi-Temporal)

Every edge carries:

```
valid_from      TIMESTAMPTZ     -- when this became true in the real world
valid_to        TIMESTAMPTZ     -- when it stopped being true (NULL = current)
created_at      TIMESTAMPTZ     -- when we recorded this
invalidated_at  TIMESTAMPTZ     -- when we learned it was wrong (NULL = valid)
confidence      FLOAT           -- 0.0-1.0, extraction confidence
provenance      TEXT            -- source: "extraction:v3", "manual", "agent:saber"
tenant_id       UUID            -- client isolation (NULL = cross-client pattern)
access_scope    TEXT            -- "tenant" (field agents) or "global" (HQ only)
```

---

## Multi-Tenancy Model

```
┌─────────────────────────────────────────┐
│  HQ Agents (Sybil, Sage)               │
│  access_scope: global                    │
│  Can query ALL entities + edges          │
│  Can see cross-client patterns           │
├─────────────────────────────────────────┤
│  Field Agents (Sam, Saber, Santos)      │
│  access_scope: tenant                    │
│  Query filtered by tenant_id             │
│  Cannot see other clients' data          │
├─────────────────────────────────────────┤
│  Cross-Client Patterns                   │
│  tenant_id: NULL                         │
│  Anonymized Topics, SIMILAR_TO edges     │
│  Visible to HQ, invisible to field      │
└─────────────────────────────────────────┘
```

**Enforcement:** Query layer adds `WHERE tenant_id = $agent_tenant OR tenant_id IS NULL` for field agents. HQ agents get no filter.

---

## PostgreSQL Tables (Supabase)

### Table: `kg_entities`
```sql
CREATE TABLE kg_entities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   TEXT NOT NULL,          -- Person, Organization, Topic, etc.
  name          TEXT NOT NULL,
  properties    JSONB DEFAULT '{}',     -- type-specific properties
  name_embedding VECTOR(1536),          -- for semantic search / entity resolution
  tenant_id     UUID,                   -- NULL for cross-client patterns
  access_scope  TEXT DEFAULT 'tenant',  -- 'tenant' or 'global'
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_entity_type CHECK (entity_type IN (
    'Person','Organization','Product','Topic','Decision',
    'Preference','Task','Event','Conversation','Skill','Lead','Campaign'
  ))
);

CREATE INDEX idx_entities_type ON kg_entities(entity_type);
CREATE INDEX idx_entities_tenant ON kg_entities(tenant_id);
CREATE INDEX idx_entities_name ON kg_entities(name);
CREATE INDEX idx_entities_embedding ON kg_entities USING ivfflat (name_embedding vector_cosine_ops) WITH (lists = 100);
```

### Table: `kg_edges`
```sql
CREATE TABLE kg_edges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship    TEXT NOT NULL,         -- WORKS_AT, DECIDED, LED_TO, etc.
  source_id       UUID NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
  target_id       UUID NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
  properties      JSONB DEFAULT '{}',   -- relationship-specific properties
  fact_embedding  VECTOR(1536),         -- "Person X works at Company Y" embedded
  
  -- Bi-temporal
  valid_from      TIMESTAMPTZ,
  valid_to        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  invalidated_at  TIMESTAMPTZ,
  
  confidence      FLOAT DEFAULT 1.0,
  provenance      TEXT,                 -- 'extraction:v3', 'manual', 'agent:sam'
  tenant_id       UUID,
  access_scope    TEXT DEFAULT 'tenant',
  
  CONSTRAINT valid_relationship CHECK (relationship IN (
    'WORKS_AT','HAS_ROLE','KNOWS','REPORTS_TO','PREFERS','DECIDED',
    'DISCUSSED','MENTIONED_IN','RELATED_TO','ASSIGNED_TO','PART_OF',
    'USES','LED_TO','SIMILAR_TO','REFERRED_BY','CONVERTED_TO'
  ))
);

CREATE INDEX idx_edges_source ON kg_edges(source_id);
CREATE INDEX idx_edges_target ON kg_edges(target_id);
CREATE INDEX idx_edges_rel ON kg_edges(relationship);
CREATE INDEX idx_edges_tenant ON kg_edges(tenant_id);
CREATE INDEX idx_edges_valid ON kg_edges(valid_from, valid_to) WHERE invalidated_at IS NULL;
```

### Table: `kg_episodes`
```sql
CREATE TABLE kg_episodes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES kg_entities(id),  -- links to Conversation entity
  agent_id      UUID NOT NULL,
  client_id     UUID,
  raw_messages   JSONB NOT NULL,        -- original message batch
  extraction_version TEXT,              -- 'v3', 'v4'
  extracted_entities UUID[],            -- entity IDs extracted from this episode
  extracted_edges    UUID[],            -- edge IDs extracted from this episode
  tenant_id     UUID,
  created_at    TIMESTAMPTZ DEFAULT now(),
  expires_at    TIMESTAMPTZ            -- 90-day TTL for raw messages
);

CREATE INDEX idx_episodes_agent ON kg_episodes(agent_id);
CREATE INDEX idx_episodes_tenant ON kg_episodes(tenant_id);
CREATE INDEX idx_episodes_expires ON kg_episodes(expires_at);
```

---

## Graph Traversal (Recursive CTEs)

### Multi-hop query pattern:
```sql
-- Find all entities within N hops of a starting entity
WITH RECURSIVE graph_walk AS (
  -- Base: start node
  SELECT target_id AS node_id, 1 AS depth, ARRAY[source_id, target_id] AS path
  FROM kg_edges
  WHERE source_id = $start_id
    AND invalidated_at IS NULL
    AND (tenant_id = $tenant OR tenant_id IS NULL)
  
  UNION ALL
  
  -- Recurse: follow edges
  SELECT e.target_id, gw.depth + 1, gw.path || e.target_id
  FROM kg_edges e
  JOIN graph_walk gw ON e.source_id = gw.node_id
  WHERE gw.depth < $max_depth
    AND e.target_id != ALL(gw.path)  -- prevent cycles
    AND e.invalidated_at IS NULL
    AND (e.tenant_id = $tenant OR e.tenant_id IS NULL)
)
SELECT DISTINCT n.*, gw.depth
FROM graph_walk gw
JOIN kg_entities n ON n.id = gw.node_id;
```

### Bidirectional traversal:
```sql
-- Walk edges in both directions
WITH RECURSIVE graph_walk AS (
  SELECT 
    CASE WHEN source_id = $start THEN target_id ELSE source_id END AS node_id,
    1 AS depth,
    ARRAY[$start] AS path,
    relationship
  FROM kg_edges
  WHERE (source_id = $start OR target_id = $start)
    AND invalidated_at IS NULL
  
  UNION ALL
  
  SELECT 
    CASE WHEN e.source_id = gw.node_id THEN e.target_id ELSE e.source_id END,
    gw.depth + 1,
    gw.path || gw.node_id,
    e.relationship
  FROM kg_edges e
  JOIN graph_walk gw ON (e.source_id = gw.node_id OR e.target_id = gw.node_id)
  WHERE gw.depth < $max_depth
    AND CASE WHEN e.source_id = gw.node_id THEN e.target_id ELSE e.source_id END != ALL(gw.path)
    AND e.invalidated_at IS NULL
)
SELECT * FROM graph_walk;
```

---

## Extraction Pipeline

**Model:** Gemini Flash (~$0.001 per 10KB)
**Batch size:** 20 messages per extraction
**Entity resolution:** Pass known entities list in prompt to prevent duplicates
**Prompt version:** v3 (validated on real Sam/Click Seguros data)

```
Raw Conversations (90-day retention)
  → Batch into 20-message episodes
  → Extract with Gemini Flash + known entities list
  → Store entities + edges (permanent)
  → Store episode with raw messages (90-day TTL)
  → Cross-client pattern extraction (anonymized Topics, HQ only)
```

---

## Questions This Schema Answers

### NOW (product improvement):
1. Client engagement → Conversation.engagement_score + message_count per tenant
2. Common first requests → Topic extraction from early Conversations per client
3. Churn prediction → Conversation sentiment trends + temporal gaps
4. Feature-market fit → USES relationship frequency (Skill entities)
5. Capability gaps → Topic.topic_type = 'gap'
6. Cross-pollination → SIMILAR_TO between Organizations (anonymized)
7. Time to value → Event (onboarding) to first positive Decision delta
8. Adoption within org → Person → MENTIONED_IN Conversation frequency per org

### DEEP RESEARCH (6-12 months):
9. Industry pain points → Topic aggregation filtered by Organization.industry
10. Predictive onboarding → Temporal Topic ordering per client, SIMILAR_TO matching
11. ROI attribution → LED_TO chains: Decision → Task → measurable outcome
12. Communication style → churn → Conversation.sentiment + engagement_score trends
13. Anonymized pattern matching → Cross-client Topics with tenant_id IS NULL
14. Decision reversals → Decision.status = 'reversed' + LED_TO reasoning
15. Collective intelligence → Skill entities + USES across all agents

---

## Implementation Plan

1. **Supabase migrations** — Create 3 tables + indexes + RLS policies
2. **Core graph library** (`skills/knowledge-graph/lib/`) — addEntity, addEdge, traverse, resolve, query
3. **Extraction pipeline** (`skills/knowledge-graph/scripts/`) — batch, extract (Gemini Flash), ingest
4. **Query layer** — tenant-scoped queries, multi-hop traversal, semantic search
5. **Cleanup job** — expire episodes older than 90 days, prune invalidated edges
