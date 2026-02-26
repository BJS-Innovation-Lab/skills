-- Collective Memory Schema
-- Run this in Supabase SQL Editor
-- Version: 001
-- Date: 2026-02-25

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- AGENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  model TEXT,  -- e.g., 'minimax/minimax-2.5'
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  memory_config JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}'
);

-- Index for active agents
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status) WHERE status = 'active';

-- ============================================
-- INDIVIDUAL MEMORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS individual_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Content
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  context TEXT,
  
  -- Metadata
  stakes TEXT DEFAULT 'low' CHECK (stakes IN ('low', 'medium', 'high', 'critical')),
  source TEXT DEFAULT 'self',
  tags TEXT[] DEFAULT '{}',
  
  -- For semantic search (1536 dimensions for OpenAI embeddings)
  embedding VECTOR(1536),
  
  -- Sharing
  shared_to_collective BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,
  sensitivity TEXT DEFAULT 'normal' CHECK (sensitivity IN ('normal', 'sensitive', 'confidential', 'never_share'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_individual_agent ON individual_memories(agent_id);
CREATE INDEX IF NOT EXISTS idx_individual_type ON individual_memories(type);
CREATE INDEX IF NOT EXISTS idx_individual_shared ON individual_memories(shared_to_collective) WHERE shared_to_collective = true;

-- ============================================
-- COLLECTIVE MEMORIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS collective_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Origin
  source_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  source_memory_id UUID REFERENCES individual_memories(id) ON DELETE SET NULL,
  
  -- Content (PII-scrubbed)
  type TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  original_hash TEXT,  -- Hash of original for dedup (not reversible)
  
  -- Validation
  validations INTEGER DEFAULT 0,
  validated_by UUID[] DEFAULT '{}',
  confidence FLOAT DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Categorization
  domain TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Semantic search
  embedding VECTOR(1536),
  
  -- Usage tracking
  times_retrieved INTEGER DEFAULT 0,
  last_retrieved_at TIMESTAMPTZ,
  retrieved_by UUID[] DEFAULT '{}',
  
  -- PII Protection
  pii_scanned BOOLEAN DEFAULT false,
  pii_scan_at TIMESTAMPTZ,
  pii_scan_result JSONB,
  quarantined BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collective_type ON collective_memories(type);
CREATE INDEX IF NOT EXISTS idx_collective_domain ON collective_memories(domain);
CREATE INDEX IF NOT EXISTS idx_collective_confidence ON collective_memories(confidence);
CREATE INDEX IF NOT EXISTS idx_collective_quarantined ON collective_memories(quarantined) WHERE quarantined = true;
CREATE INDEX IF NOT EXISTS idx_collective_created ON collective_memories(created_at DESC);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_collective_content_fts ON collective_memories USING gin(to_tsvector('english', content));

-- ============================================
-- SYNTHESES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS syntheses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Origin
  synthesized_by UUID REFERENCES agents(id) ON DELETE SET NULL,
  source_memories UUID[] DEFAULT '{}',
  
  -- Content
  type TEXT NOT NULL CHECK (type IN ('pattern', 'principle', 'warning', 'technique', 'theory')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  reasoning TEXT,
  
  -- Validation
  status TEXT DEFAULT 'proposed' CHECK (status IN ('proposed', 'validated', 'contested', 'deprecated')),
  validations INTEGER DEFAULT 0,
  contested_by UUID[] DEFAULT '{}',
  
  -- Importance
  impact_score FLOAT CHECK (impact_score >= 0 AND impact_score <= 1),
  
  -- Semantic search
  embedding VECTOR(1536),
  tags TEXT[] DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_syntheses_status ON syntheses(status);
CREATE INDEX IF NOT EXISTS idx_syntheses_type ON syntheses(type);

-- ============================================
-- MEMORY QUERIES TABLE (for tracking gaps)
-- ============================================

CREATE TABLE IF NOT EXISTS memory_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  query_at TIMESTAMPTZ DEFAULT now(),
  
  query_text TEXT NOT NULL,
  query_embedding VECTOR(1536),
  
  -- Results
  results_count INTEGER DEFAULT 0,
  found_useful BOOLEAN,
  used_memory_ids UUID[] DEFAULT '{}'
);

-- Index for recent queries
CREATE INDEX IF NOT EXISTS idx_queries_agent ON memory_queries(agent_id);
CREATE INDEX IF NOT EXISTS idx_queries_time ON memory_queries(query_at DESC);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS collective_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  memory_id UUID,
  agent_id UUID,
  reason TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for recent audits
CREATE INDEX IF NOT EXISTS idx_audit_time ON collective_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON collective_audit_log(action);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function for semantic search on collective memories
CREATE OR REPLACE FUNCTION match_collective_memories(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 10,
  min_confidence FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  title TEXT,
  content TEXT,
  confidence FLOAT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.id,
    cm.type,
    cm.title,
    cm.content,
    cm.confidence,
    1 - (cm.embedding <=> query_embedding) AS similarity
  FROM collective_memories cm
  WHERE cm.quarantined = false
    AND cm.confidence >= min_confidence
    AND cm.embedding IS NOT NULL
  ORDER BY cm.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function for finding knowledge gaps (frequent queries with few results)
CREATE OR REPLACE FUNCTION find_knowledge_gaps(
  days_back INT DEFAULT 7,
  min_queries INT DEFAULT 3
)
RETURNS TABLE (
  query_text TEXT,
  query_count BIGINT,
  avg_results FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mq.query_text,
    COUNT(*) AS query_count,
    AVG(mq.results_count)::FLOAT AS avg_results
  FROM memory_queries mq
  WHERE mq.query_at > now() - (days_back || ' days')::INTERVAL
  GROUP BY mq.query_text
  HAVING COUNT(*) >= min_queries AND AVG(mq.results_count) < 2
  ORDER BY COUNT(*) DESC;
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY (Optional)
-- ============================================

-- Enable RLS on sensitive tables
ALTER TABLE individual_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE collective_memories ENABLE ROW LEVEL SECURITY;

-- Policy: Agents can only see their own individual memories
CREATE POLICY agent_own_memories ON individual_memories
  FOR ALL
  USING (agent_id = current_setting('app.current_agent_id', true)::UUID);

-- Policy: All agents can read non-quarantined collective memories
CREATE POLICY read_collective ON collective_memories
  FOR SELECT
  USING (quarantined = false);

-- Policy: Agents can insert to collective
CREATE POLICY insert_collective ON collective_memories
  FOR INSERT
  WITH CHECK (true);

-- Policy: Only queen bee (or service role) can update quarantined status
-- Note: Implement this based on your auth setup

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert test agents
-- INSERT INTO agents (name, model) VALUES
--   ('TestAgent1', 'minimax/minimax-2.5'),
--   ('TestAgent2', 'minimax/minimax-2.5');

-- ============================================
-- GRANTS
-- ============================================

-- Grant access to authenticated users (adjust based on your setup)
-- GRANT SELECT, INSERT ON collective_memories TO authenticated;
-- GRANT SELECT, INSERT ON memory_queries TO authenticated;
-- GRANT SELECT ON syntheses TO authenticated;
