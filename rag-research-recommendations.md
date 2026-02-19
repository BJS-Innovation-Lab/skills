# 🔍 RAG Research & Recommendations

**Date:** 2026-02-06
**Question:** Should we create a RAG for the company or just for Sybil?

---

## TL;DR Recommendation

**Both, but start with Sybil's personal RAG, then expand to company-wide.**

| Scope | Timeline | Purpose |
|-------|----------|---------|
| **Sybil Personal RAG** | Now (weeks) | My documents, memory, learnings |
| **BJS Labs Shared RAG** | Later (months) | Company knowledge base for all agents |

---

## What is RAG?

**Retrieval-Augmented Generation** = Give LLMs access to external knowledge by:
1. **Ingestion:** Chunk documents → create embeddings → store in vector DB
2. **Retrieval:** User query → find similar chunks via semantic search
3. **Augmentation:** Combine retrieved context with query → send to LLM
4. **Generation:** LLM produces grounded response using context

**Why it matters:** LLMs have knowledge cutoffs and no access to private data. RAG bridges that gap.

---

## Option 1: Personal RAG for Sybil

### What It Would Index
- All my workspace documents (`*.md`)
- Daily memory files
- Learnings and errors
- Created reports and research
- A2A conversation logs

### Pros
- ✅ Solves my immediate memory problem
- ✅ Quick to implement (small corpus)
- ✅ Low cost (few documents)
- ✅ Can use simple local solution

### Cons
- ❌ Only helps me, not Sage/Sam
- ❌ Siloed knowledge

### Implementation Options

| Option | Complexity | Cost | Notes |
|--------|------------|------|-------|
| **Extend OpenClaw memory_search** | Low | Free | Already have it, just limited scope |
| **Local vector store (Chroma/FAISS)** | Medium | Free | Run locally on Mac Mini |
| **Supabase pgvector** | Medium | ~Free | Already have Supabase account |

**Recommendation:** Start with **Supabase pgvector** — you already have the account, and it scales to company use later.

---

## Option 2: Company-Wide RAG for BJS Labs

### What It Would Index
- Product documentation
- Research reports (ICP, competitor analysis)
- Meeting notes and decisions
- Codebase documentation
- Customer feedback
- Agent learnings (all agents)

### Pros
- ✅ All agents share same knowledge
- ✅ Institutional memory survives agent changes
- ✅ Humans can query it too
- ✅ Single source of truth

### Cons
- ❌ More complex to set up
- ❌ Need to manage access permissions
- ❌ Requires ongoing maintenance (keep docs updated)
- ❌ Higher cost at scale

### Architecture Options

#### A. Supabase + pgvector (Recommended for BJS Labs)
```
┌──────────────────────────────────────────────┐
│              BJS Labs Supabase               │
│  ┌────────────────────────────────────────┐  │
│  │         documents table                │  │
│  │  id | title | content | embedding      │  │
│  │     | agent_id | doc_type | created_at │  │
│  └────────────────────────────────────────┘  │
│                     │                        │
│              pgvector index                  │
└──────────────────────┬───────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
    Sybil           Sage            Sam
```

**Why Supabase:**
- You already have it (`fcgiuzmmvcnovaciykbx.supabase.co`)
- pgvector is built-in and free
- Row-level security for access control
- Agents can read/write via API
- Humans can query via dashboard

#### B. Pinecone (More powerful, higher cost)
- Managed vector DB
- Better for large scale
- Serverless pricing
- Overkill for current stage

#### C. LlamaIndex / LangChain (Framework)
- Orchestration layer on top of vector DB
- Good for complex retrieval strategies
- May be over-engineering for now

---

## Recommended Roadmap

### Phase 1: Sybil Personal RAG (This Week)
1. Create `documents` table in Supabase with pgvector
2. Write ingestion script for my workspace `*.md` files
3. Create search function I can call
4. Test with my existing docs

### Phase 2: Standardize Agent Knowledge (Next 2 Weeks)
1. Define document types (report, memo, research, decision)
2. Create shared schema all agents use
3. Add agent_id column for ownership
4. Set up row-level security

### Phase 3: Company RAG (Month 2)
1. Migrate all agent docs to shared store
2. Add human-facing search interface
3. Set up auto-ingestion for new docs
4. Create retrieval API all agents call

---

## Technical Implementation (Phase 1)

### Supabase Table Schema
```sql
create extension if not exists vector;

create table documents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  doc_type text, -- 'report', 'memo', 'research', 'memory', 'learning'
  file_path text,
  agent_id uuid,
  embedding vector(1536), -- OpenAI text-embedding-3-small
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on documents using ivfflat (embedding vector_cosine_ops);
```

### Search Function
```sql
create or replace function search_documents (
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5,
  filter_agent_id uuid default null
)
returns table (
  id uuid,
  title text,
  content text,
  doc_type text,
  similarity float
)
language sql stable
as $$
  select
    d.id,
    d.title,
    d.content,
    d.doc_type,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where 1 - (d.embedding <=> query_embedding) > match_threshold
    and (filter_agent_id is null or d.agent_id = filter_agent_id)
  order by d.embedding <=> query_embedding
  limit match_count;
$$;
```

### Ingestion Script (Node.js)
```javascript
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const openai = new OpenAI()

async function ingestDocument(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const title = path.basename(filePath)
  
  // Generate embedding
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: content.slice(0, 8000) // Token limit
  })
  
  const embedding = response.data[0].embedding
  
  // Store in Supabase
  await supabase.from('documents').upsert({
    title,
    content,
    file_path: filePath,
    embedding,
    agent_id: SYBIL_AGENT_ID
  })
}
```

---

## Cost Estimate

| Component | Phase 1 (Sybil) | Phase 3 (Company) |
|-----------|-----------------|-------------------|
| Supabase | Free tier | Free tier (probably) |
| OpenAI Embeddings | ~$0.02/month | ~$0.10/month |
| Storage | Negligible | Negligible |
| **Total** | **~Free** | **~$5/month** |

---

## Alternatives Considered

| Option | Verdict |
|--------|---------|
| **Just use MEMORY.md** | Current approach, too limited |
| **Local Chroma/FAISS** | Good but doesn't share across agents |
| **Pinecone** | Overkill, costs money |
| **Full LlamaIndex stack** | Over-engineering |

---

## Next Steps

1. **Approve this plan** — does this direction make sense?
2. **Set up Supabase table** — I can do this via SQL
3. **Write ingestion script** — index my existing docs
4. **Test search** — verify retrieval quality
5. **Integrate into my workflow** — call RAG during queries

Want me to start implementing Phase 1?

---

*Research completed: 2026-02-06 08:25 EST*
