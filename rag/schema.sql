-- RAG Schema for Sybil's Personal Knowledge Base
-- Supabase: fcgiuzmmvcnovaciykbx.supabase.co
-- Run this in Supabase SQL Editor

-- Enable pgvector extension
create extension if not exists vector;

-- Documents table
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  doc_type text, -- 'report', 'memo', 'research', 'memory', 'learning', 'note'
  file_path text,
  agent_id uuid,
  agent_name text,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimensions
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for vector similarity search
create index if not exists documents_embedding_idx 
  on documents using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Index for filtering by agent
create index if not exists documents_agent_idx on documents(agent_id);

-- Index for filtering by doc type
create index if not exists documents_type_idx on documents(doc_type);

-- Search function
create or replace function search_documents (
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5,
  filter_agent_id uuid default null,
  filter_doc_type text default null
)
returns table (
  id uuid,
  title text,
  content text,
  doc_type text,
  file_path text,
  similarity float
)
language sql stable
as $$
  select
    d.id,
    d.title,
    d.content,
    d.doc_type,
    d.file_path,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where 1 - (d.embedding <=> query_embedding) > match_threshold
    and (filter_agent_id is null or d.agent_id = filter_agent_id)
    and (filter_doc_type is null or d.doc_type = filter_doc_type)
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

-- Update timestamp trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger documents_updated_at
  before update on documents
  for each row
  execute function update_updated_at();

-- Grant permissions (adjust as needed)
-- grant all on documents to authenticated;
-- grant all on documents to service_role;
