# Sybil RAG System

Personal knowledge base with semantic search using Supabase pgvector.

## Setup

### 1. Create Database Schema
Run `schema.sql` in Supabase SQL Editor:
- Go to https://fcgiuzmmvcnovaciykbx.supabase.co
- Open SQL Editor
- Paste contents of `schema.sql`
- Run

### 2. Install Dependencies
```bash
cd rag
npm install
```

### 3. Set Environment Variables
```bash
export SUPABASE_URL="https://fcgiuzmmvcnovaciykbx.supabase.co"
export SUPABASE_SERVICE_KEY="your-service-role-key"  # From 1Password
export OPENAI_API_KEY="your-openai-key"  # From 1Password
```

Or use 1Password injection:
```bash
op run --env-file=.env.1password -- npm run ingest
```

### 4. Ingest Documents
```bash
# Ingest all workspace docs
npm run ingest

# Ingest single file
node ingest.js --file ../truth_hire_icp.md
```

### 5. Search
```bash
node search.js "customer segments for Truth Hire"
node search.js "memory improvement" --limit 3
node search.js "A2A protocol" --type note
```

## File Structure
```
rag/
├── schema.sql     # Database schema (run in Supabase)
├── ingest.js      # Document ingestion script
├── search.js      # Semantic search script
├── package.json   # Dependencies
└── README.md      # This file
```

## Document Types
- `report` - Formal reports and deliverables
- `research` - Research documents
- `memory` - Daily memory files
- `learning` - Error logs and learnings
- `note` - General notes
- `core_memory` - MEMORY.md

## Integration with OpenClaw

To search from OpenClaw, run:
```bash
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... OPENAI_API_KEY=... node ~/workspace/rag/search.js "query"
```

Or create a wrapper script that loads credentials from 1Password.
