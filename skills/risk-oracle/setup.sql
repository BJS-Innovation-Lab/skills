-- Risk Oracle: Supabase Setup
-- Run this in Supabase SQL Editor to create the corrections table and search function

-- Enable vector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Corrections table
CREATE TABLE IF NOT EXISTS corrections (
  id TEXT PRIMARY KEY,
  summary TEXT NOT NULL,
  prior_belief TEXT,
  corrected_to TEXT,
  context TEXT,
  stakes TEXT DEFAULT 'medium',
  source_file TEXT,
  embedding vector(768),  -- Gemini text-embedding-004 dimension
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS corrections_embedding_idx 
ON corrections 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- RPC function for similarity search
CREATE OR REPLACE FUNCTION match_corrections(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id TEXT,
  summary TEXT,
  prior_belief TEXT,
  corrected_to TEXT,
  context TEXT,
  stakes TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.summary,
    c.prior_belief,
    c.corrected_to,
    c.context,
    c.stakes,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM corrections c
  WHERE 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant permissions
GRANT SELECT ON corrections TO anon, authenticated;
GRANT EXECUTE ON FUNCTION match_corrections TO anon, authenticated;

-- Verify setup
SELECT 'Corrections table created' AS status;
