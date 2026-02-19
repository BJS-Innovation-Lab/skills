#!/usr/bin/env node
import pg from 'pg';

const client = new pg.Client({
  host: 'db.fcgiuzmmvcnovaciykbx.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.DB_PASS,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL');
    
    console.log('Creating vector extension...');
    await client.query('create extension if not exists vector');
    
    console.log('Creating documents table...');
    await client.query(`
      create table if not exists documents (
        id uuid default gen_random_uuid() primary key,
        title text not null,
        content text not null,
        doc_type text,
        file_path text unique,
        agent_id uuid,
        agent_name text,
        embedding vector(1536),
        metadata jsonb default '{}',
        created_at timestamptz default now()
      )
    `);
    
    console.log('Creating search function...');
    await client.query(`
      create or replace function search_documents(
        query_embedding vector(1536),
        match_count int default 5,
        filter_agent_id uuid default null
      ) returns table (
        id uuid,
        title text,
        content text,
        doc_type text,
        file_path text,
        similarity float
      ) language plpgsql as $$
      begin
        return query
        select
          d.id, d.title, d.content, d.doc_type, d.file_path,
          1 - (d.embedding <=> query_embedding) as similarity
        from documents d
        where (filter_agent_id is null or d.agent_id = filter_agent_id)
        order by d.embedding <=> query_embedding
        limit match_count;
      end;
      $$
    `);
    
    // Verify table exists
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents'");
    console.log('Table exists:', res.rows.length > 0);
    
    console.log('✅ Done! Schema created successfully.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

main();
