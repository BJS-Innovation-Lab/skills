-- Research Intelligence System - Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- RESEARCH PAPERS
-- Stores metadata for all discovered papers
-- ============================================
CREATE TABLE IF NOT EXISTS research_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source identifiers
  source TEXT NOT NULL,              -- 'arxiv', 'semantic_scholar', 'pubmed', etc.
  source_id TEXT NOT NULL,           -- e.g., '2602.12345' for arXiv
  
  -- Paper metadata
  title TEXT NOT NULL,
  authors JSONB,                     -- Array of author objects
  abstract TEXT,
  published_date DATE,
  categories TEXT[],                 -- e.g., ['cs.AI', 'cs.LG']
  pdf_url TEXT,
  
  -- Relevance scoring
  relevance_score INTEGER,           -- 1-10 from Opus
  relevance_reasoning TEXT,          -- Why this score
  relevance_tags TEXT[],             -- e.g., ['agents', 'memory', 'rag']
  
  -- Processing status
  status TEXT DEFAULT 'discovered',  -- discovered, filtered, processed, analyzed
  processed_at TIMESTAMP,
  
  -- Discovery metadata
  discovered_at TIMESTAMP DEFAULT NOW(),
  discovered_by TEXT,                -- Agent who found it
  
  -- Unique constraint
  UNIQUE(source, source_id)
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_papers_status ON research_papers(status);
CREATE INDEX IF NOT EXISTS idx_papers_score ON research_papers(relevance_score);
CREATE INDEX IF NOT EXISTS idx_papers_date ON research_papers(discovered_at);
CREATE INDEX IF NOT EXISTS idx_papers_source ON research_papers(source);

-- ============================================
-- RESEARCH CHUNKS
-- Stores embedded chunks for semantic search
-- ============================================
CREATE TABLE IF NOT EXISTS research_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paper_id UUID REFERENCES research_papers(id) ON DELETE CASCADE,
  
  -- Chunk metadata
  chunk_type TEXT NOT NULL,          -- 'abstract', 'summary', 'findings', 'methods', 'chart_description'
  section_name TEXT,                 -- Original section name if applicable
  content TEXT NOT NULL,
  
  -- Embedding
  embedding vector(1536),            -- OpenAI ada-002 dimension
  
  -- Metadata
  metadata JSONB,                    -- Additional context (figure refs, etc.)
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON research_chunks 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_chunks_paper ON research_chunks(paper_id);
CREATE INDEX IF NOT EXISTS idx_chunks_type ON research_chunks(chunk_type);

-- ============================================
-- RESEARCH INSIGHTS
-- Cross-paper insights and creative connections
-- ============================================
CREATE TABLE IF NOT EXISTS research_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Insight content
  insight TEXT NOT NULL,
  insight_type TEXT,                 -- 'cross_domain', 'application', 'synthesis'
  
  -- Supporting evidence
  supporting_papers UUID[],          -- Array of paper IDs
  
  -- Attribution
  created_by TEXT NOT NULL,          -- Agent who created insight
  expertise_area TEXT,               -- 'ml', 'backend', 'frontend', 'business'
  
  -- Implementation tracking
  implemented BOOLEAN DEFAULT FALSE,
  implementation_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insights_type ON research_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_insights_creator ON research_insights(created_by);

-- ============================================
-- RESEARCH TASKS
-- Tracks expert assignments and completion
-- ============================================
CREATE TABLE IF NOT EXISTS research_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What and who
  paper_id UUID REFERENCES research_papers(id) ON DELETE CASCADE,
  assigned_to TEXT NOT NULL,         -- Agent name
  task_type TEXT NOT NULL,           -- 'analysis', 'deep_dive', 'synthesis'
  
  -- Timing
  assigned_at TIMESTAMP DEFAULT NOW(),
  due_at TIMESTAMP,                  -- Usually 24h from assignment
  completed_at TIMESTAMP,
  
  -- Status tracking
  status TEXT DEFAULT 'pending',     -- pending, acknowledged, in_progress, complete, overdue
  acknowledged_at TIMESTAMP,
  
  -- Results
  result_summary TEXT,
  result_json JSONB,                 -- Full structured response
  
  -- Memory verification
  memory_logged BOOLEAN DEFAULT FALSE,
  memory_verified_at TIMESTAMP,
  
  -- Escalation tracking
  escalated BOOLEAN DEFAULT FALSE,
  escalated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON research_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON research_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON research_tasks(due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_paper ON research_tasks(paper_id);

-- ============================================
-- RESEARCH CONFIG
-- Stores configuration for the research system
-- ============================================
CREATE TABLE IF NOT EXISTS research_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO research_config (key, value) VALUES
  ('sources', '{
    "arxiv": {
      "enabled": true,
      "categories": ["cs.AI", "cs.LG", "cs.CL", "cs.MA", "cs.NE", "stat.ML"],
      "max_results": 100
    },
    "semantic_scholar": {
      "enabled": true,
      "fields": ["computer science", "business", "psychology", "economics"],
      "max_results": 100
    }
  }'::jsonb),
  ('keywords', '{
    "agent_tech": ["agents", "multi-agent", "tool use", "function calling", "RAG", "retrieval"],
    "deep_theory": ["cognitive architecture", "memory systems", "metacognition", "reasoning"],
    "automl": ["AutoML", "automated machine learning", "neural architecture search"],
    "business": ["AI automation", "workflow automation", "small business AI"],
    "economics": ["AI economic impact", "future of work", "AI labor market"]
  }'::jsonb),
  ('thresholds', '{
    "min_relevance_score": 7,
    "max_papers_per_day": 15,
    "task_due_hours": 24,
    "escalation_hours": 48
  }'::jsonb),
  ('agents', '{
    "owner": "Sybil",
    "experts": {
      "backend": "Sage",
      "frontend": "Sam", 
      "business": "Saber"
    }
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- FUNCTIONS
-- Helper functions for common operations
-- ============================================

-- Function to search papers by embedding similarity
CREATE OR REPLACE FUNCTION search_research(
  query_embedding vector(1536),
  match_count INT DEFAULT 10,
  min_similarity FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  paper_id UUID,
  title TEXT,
  chunk_content TEXT,
  chunk_type TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rp.id AS paper_id,
    rp.title,
    rc.content AS chunk_content,
    rc.chunk_type,
    1 - (rc.embedding <=> query_embedding) AS similarity
  FROM research_chunks rc
  JOIN research_papers rp ON rp.id = rc.paper_id
  WHERE 1 - (rc.embedding <=> query_embedding) > min_similarity
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to get overdue tasks
CREATE OR REPLACE FUNCTION get_overdue_tasks()
RETURNS TABLE (
  task_id UUID,
  paper_title TEXT,
  assigned_to TEXT,
  assigned_at TIMESTAMP,
  due_at TIMESTAMP,
  hours_overdue FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rt.id AS task_id,
    rp.title AS paper_title,
    rt.assigned_to,
    rt.assigned_at,
    rt.due_at,
    EXTRACT(EPOCH FROM (NOW() - rt.due_at)) / 3600 AS hours_overdue
  FROM research_tasks rt
  JOIN research_papers rp ON rp.id = rt.paper_id
  WHERE rt.status NOT IN ('complete', 'acknowledged')
    AND rt.due_at < NOW()
  ORDER BY rt.due_at ASC;
END;
$$;

-- Function to get daily stats
CREATE OR REPLACE FUNCTION get_research_stats(for_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'date', for_date,
    'papers_discovered', (SELECT COUNT(*) FROM research_papers WHERE discovered_at::date = for_date),
    'papers_filtered', (SELECT COUNT(*) FROM research_papers WHERE discovered_at::date = for_date AND relevance_score >= 7),
    'papers_processed', (SELECT COUNT(*) FROM research_papers WHERE discovered_at::date = for_date AND status = 'processed'),
    'tasks_assigned', (SELECT COUNT(*) FROM research_tasks WHERE assigned_at::date = for_date),
    'tasks_completed', (SELECT COUNT(*) FROM research_tasks WHERE completed_at::date = for_date),
    'tasks_overdue', (SELECT COUNT(*) FROM research_tasks WHERE status NOT IN ('complete') AND due_at < NOW()),
    'insights_created', (SELECT COUNT(*) FROM research_insights WHERE created_at::date = for_date)
  ) INTO stats;
  
  RETURN stats;
END;
$$;

-- ============================================
-- ENABLE REALTIME (optional)
-- ============================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE research_tasks;
-- ALTER PUBLICATION supabase_realtime ADD TABLE research_papers;
