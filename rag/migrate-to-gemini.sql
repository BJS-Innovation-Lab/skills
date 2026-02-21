-- ============================================================
-- Migration: OpenAI text-embedding-3-small (1536) → Gemini embedding-001 (768)
-- Run this in Supabase SQL Editor for EACH agent's project
-- ============================================================

-- 1. documents table
DROP INDEX IF EXISTS documents_embedding_idx;
ALTER TABLE documents ALTER COLUMN embedding TYPE vector(768) USING NULL;
UPDATE documents SET embedding = NULL;
CREATE INDEX documents_embedding_idx ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 2. bjs_knowledge table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bjs_knowledge') THEN
    EXECUTE 'DROP INDEX IF EXISTS bjs_knowledge_embedding_idx';
    EXECUTE 'ALTER TABLE bjs_knowledge ALTER COLUMN embedding TYPE vector(768) USING NULL';
    EXECUTE 'UPDATE bjs_knowledge SET embedding = NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS bjs_knowledge_embedding_idx ON bjs_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)';
  END IF;
END $$;

-- 3. research_chunks table (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'research_chunks') THEN
    EXECUTE 'DROP INDEX IF EXISTS research_chunks_embedding_idx';
    EXECUTE 'ALTER TABLE research_chunks ALTER COLUMN embedding TYPE vector(768) USING NULL';
    EXECUTE 'UPDATE research_chunks SET embedding = NULL';
  END IF;
END $$;

-- 4. Update search_documents function
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(768),
  match_count int DEFAULT 10,
  filter jsonb DEFAULT '{}'::jsonb
) RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM documents d
  WHERE d.embedding IS NOT NULL
    AND (filter = '{}'::jsonb OR d.metadata @> filter)
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. Done! Now re-embed:
--    node rag/sync-memory.cjs          (re-embeds all memory files)
--    node rag/bjs-knowledge-write.cjs  (if KB entries exist)
