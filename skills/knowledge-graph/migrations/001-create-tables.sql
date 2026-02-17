-- Knowledge Graph Schema v3 — Migration 001
-- Creates kg_entities, kg_edges, kg_episodes tables
-- Requires: pgvector extension (already enabled on Supabase)

-- ============================================
-- ENTITIES
-- ============================================
CREATE TABLE IF NOT EXISTS kg_entities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type   TEXT NOT NULL,
  name          TEXT NOT NULL,
  properties    JSONB DEFAULT '{}',
  name_embedding VECTOR(1536),
  tenant_id     UUID,
  access_scope  TEXT DEFAULT 'tenant',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_entity_type CHECK (entity_type IN (
    'Person','Organization','Product','Topic','Decision',
    'Preference','Task','Event','Conversation','Skill','Lead','Campaign'
  )),
  CONSTRAINT valid_access_scope CHECK (access_scope IN ('tenant', 'global'))
);

CREATE INDEX IF NOT EXISTS idx_kg_entities_type ON kg_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_kg_entities_tenant ON kg_entities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kg_entities_name ON kg_entities(name);
CREATE INDEX IF NOT EXISTS idx_kg_entities_type_tenant ON kg_entities(entity_type, tenant_id);

-- ============================================
-- EDGES
-- ============================================
CREATE TABLE IF NOT EXISTS kg_edges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship    TEXT NOT NULL,
  source_id       UUID NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
  target_id       UUID NOT NULL REFERENCES kg_entities(id) ON DELETE CASCADE,
  properties      JSONB DEFAULT '{}',
  fact_embedding  VECTOR(1536),
  
  -- Bi-temporal
  valid_from      TIMESTAMPTZ,
  valid_to        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  invalidated_at  TIMESTAMPTZ,
  
  confidence      FLOAT DEFAULT 1.0,
  provenance      TEXT,
  tenant_id       UUID,
  access_scope    TEXT DEFAULT 'tenant',
  
  CONSTRAINT valid_relationship CHECK (relationship IN (
    'WORKS_AT','HAS_ROLE','KNOWS','REPORTS_TO','PREFERS','DECIDED',
    'DISCUSSED','MENTIONED_IN','RELATED_TO','ASSIGNED_TO','PART_OF',
    'USES','LED_TO','SIMILAR_TO','REFERRED_BY','CONVERTED_TO'
  )),
  CONSTRAINT valid_edge_access_scope CHECK (access_scope IN ('tenant', 'global')),
  CONSTRAINT no_self_loops CHECK (source_id != target_id)
);

CREATE INDEX IF NOT EXISTS idx_kg_edges_source ON kg_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_kg_edges_target ON kg_edges(target_id);
CREATE INDEX IF NOT EXISTS idx_kg_edges_rel ON kg_edges(relationship);
CREATE INDEX IF NOT EXISTS idx_kg_edges_tenant ON kg_edges(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kg_edges_source_rel ON kg_edges(source_id, relationship);
CREATE INDEX IF NOT EXISTS idx_kg_edges_valid ON kg_edges(valid_from, valid_to) WHERE invalidated_at IS NULL;

-- ============================================
-- EPISODES (raw conversation chunks, 90-day TTL)
-- ============================================
CREATE TABLE IF NOT EXISTS kg_episodes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES kg_entities(id),
  agent_id        UUID NOT NULL,
  client_id       UUID,
  raw_messages    JSONB NOT NULL,
  extraction_version TEXT,
  extracted_entities UUID[],
  extracted_edges    UUID[],
  tenant_id       UUID,
  created_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ DEFAULT (now() + INTERVAL '90 days')
);

CREATE INDEX IF NOT EXISTS idx_kg_episodes_agent ON kg_episodes(agent_id);
CREATE INDEX IF NOT EXISTS idx_kg_episodes_tenant ON kg_episodes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kg_episodes_expires ON kg_episodes(expires_at);

-- ============================================
-- RLS Policies (multi-tenancy enforcement)
-- ============================================
ALTER TABLE kg_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE kg_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE kg_episodes ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (for HQ agents and extraction pipeline)
-- Field agents use anon key with tenant_id in JWT or query param

-- Entities: field agents see their tenant + global patterns
CREATE POLICY kg_entities_tenant_read ON kg_entities
  FOR SELECT USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR tenant_id IS NULL
    OR access_scope = 'global'
  );

CREATE POLICY kg_entities_tenant_insert ON kg_entities
  FOR INSERT WITH CHECK (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.role', true) = 'hq'
  );

-- Edges: same pattern
CREATE POLICY kg_edges_tenant_read ON kg_edges
  FOR SELECT USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR tenant_id IS NULL
    OR access_scope = 'global'
  );

CREATE POLICY kg_edges_tenant_insert ON kg_edges
  FOR INSERT WITH CHECK (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.role', true) = 'hq'
  );

-- Episodes: strictly tenant-scoped
CREATE POLICY kg_episodes_tenant_read ON kg_episodes
  FOR SELECT USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.role', true) = 'hq'
  );

CREATE POLICY kg_episodes_tenant_insert ON kg_episodes
  FOR INSERT WITH CHECK (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR current_setting('app.role', true) = 'hq'
  );

-- ============================================
-- Embedding index (create after initial data load for better IVFFlat performance)
-- Run manually after first batch insert:
-- CREATE INDEX idx_kg_entities_embedding ON kg_entities USING ivfflat (name_embedding vector_cosine_ops) WITH (lists = 100);
-- CREATE INDEX idx_kg_edges_fact_embedding ON kg_edges USING ivfflat (fact_embedding vector_cosine_ops) WITH (lists = 100);
-- ============================================
