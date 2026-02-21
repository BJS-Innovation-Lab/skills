#!/usr/bin/env node
/**
 * migrate-to-gemini.cjs — Migrate Supabase vector columns from 1536 → 768 dimensions
 * 
 * What this does:
 * 1. Drops existing vector index on `documents.embedding`
 * 2. Alters column from vector(1536) to vector(768)
 * 3. Nullifies all existing embeddings (they're OpenAI, incompatible)
 * 4. Recreates the index
 * 5. Same for `bjs_knowledge.embedding` if it exists
 * 6. Same for `research_chunks.embedding` if it exists
 * 
 * After running: re-run sync-memory.cjs to re-embed everything with Gemini.
 * 
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node migrate-to-gemini.cjs
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Need SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

async function runSQL(sql, label) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!resp.ok) {
    // Try pg_net or direct SQL endpoint
    const resp2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });
    if (!resp2.ok) {
      console.log(`⚠️  ${label}: Could not execute via RPC. Run manually in Supabase SQL Editor:`);
      console.log(`    ${sql}`);
      return false;
    }
  }
  console.log(`✅ ${label}`);
  return true;
}

async function main() {
  console.log('🔄 Migrating Supabase vectors: 1536 → 768 (Gemini embedding-001)\n');

  const migrations = [
    // documents table
    ['DROP INDEX IF EXISTS documents_embedding_idx;', 'Drop documents embedding index'],
    ['ALTER TABLE documents ALTER COLUMN embedding TYPE vector(768) USING NULL;', 'Alter documents.embedding to vector(768)'],
    ['UPDATE documents SET embedding = NULL;', 'Clear old OpenAI embeddings from documents'],
    ['CREATE INDEX documents_embedding_idx ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);', 'Recreate documents embedding index'],

    // bjs_knowledge table
    ['DROP INDEX IF EXISTS bjs_knowledge_embedding_idx;', 'Drop bjs_knowledge embedding index'],
    ['ALTER TABLE bjs_knowledge ALTER COLUMN embedding TYPE vector(768) USING NULL;', 'Alter bjs_knowledge.embedding to vector(768)'],
    ['UPDATE bjs_knowledge SET embedding = NULL;', 'Clear old embeddings from bjs_knowledge'],
    ['CREATE INDEX IF NOT EXISTS bjs_knowledge_embedding_idx ON bjs_knowledge USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);', 'Recreate bjs_knowledge embedding index'],

    // research_chunks table (if exists)
    ['DROP INDEX IF EXISTS research_chunks_embedding_idx;', 'Drop research_chunks embedding index'],
    ['ALTER TABLE research_chunks ALTER COLUMN embedding TYPE vector(768) USING NULL;', 'Alter research_chunks.embedding to vector(768)'],
    ['UPDATE research_chunks SET embedding = NULL;', 'Clear old embeddings from research_chunks'],

    // Update search_documents function to use 768
    [`CREATE OR REPLACE FUNCTION search_documents(
      query_embedding vector(768),
      match_count int DEFAULT 10,
      filter jsonb DEFAULT '{}'::jsonb
    ) RETURNS TABLE (
      id bigint,
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
    $$;`, 'Update search_documents function for vector(768)'],
  ];

  let manualNeeded = [];

  for (const [sql, label] of migrations) {
    const ok = await runSQL(sql, label);
    if (!ok) manualNeeded.push({ sql, label });
  }

  if (manualNeeded.length > 0) {
    console.log('\n📋 Run these manually in Supabase SQL Editor:\n');
    console.log('-- Migration: OpenAI 1536 → Gemini 768');
    for (const { sql, label } of manualNeeded) {
      console.log(`\n-- ${label}`);
      console.log(sql);
    }
  }

  console.log('\n📌 After migration:');
  console.log('   1. Run: node sync-memory.cjs   (re-embeds all files with Gemini)');
  console.log('   2. Run: node bjs-knowledge-write.cjs --re-embed   (if you have KB entries)');
  console.log('   3. Verify: node search-supabase.cjs "test query"');
}

main().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
