-- Vulkimi Supabase Migration
-- Run this in Supabase SQL Editor (https://apyinhgahnmtphndbwij.supabase.co)

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table (for memory sync + RAG search)
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  doc_type text,
  file_path text,
  agent_id uuid,
  agent_name text,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS documents_file_path_agent_key ON documents (file_path, agent_name);
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Conversations table (for transcript sync)
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  agent_name text NOT NULL,
  session_id text,
  client_id text,
  user_id text,
  user_name text,
  direction text NOT NULL,
  message text NOT NULL,
  message_type text DEFAULT 'text',
  metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conv_agent_ts ON conversations (agent_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS conv_client_ts ON conversations (client_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS conv_user_ts ON conversations (user_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS conv_session ON conversations (session_id);
CREATE INDEX IF NOT EXISTS conv_date ON conversations (timestamp DESC);
CREATE UNIQUE INDEX IF NOT EXISTS conversations_dedup ON conversations (agent_id, session_id, timestamp, direction);

-- Search function for RAG
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  filter_agent_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  doc_type text,
  file_path text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY SELECT d.id, d.title, d.content, d.doc_type, d.file_path, d.metadata,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents d
  WHERE d.embedding IS NOT NULL
    AND (filter_agent_id IS NULL OR d.agent_id = filter_agent_id)
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
