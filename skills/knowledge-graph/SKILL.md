# Knowledge Graph Skill

Cross-client intelligence system for VULKN. Extracts entities and relationships from agent conversations, stores in PostgreSQL (Supabase), enables multi-hop graph queries.

## Quick Start

```bash
# Run migration (once)
psql $DATABASE_URL -f skills/knowledge-graph/migrations/001-create-tables.sql

# Extract from agent conversations
node skills/knowledge-graph/scripts/extract.cjs --agent sam --days 7

# Query the graph
node skills/knowledge-graph/scripts/query.cjs --stats
node skills/knowledge-graph/scripts/query.cjs --entity "Javier Mitrani"
node skills/knowledge-graph/scripts/query.cjs --gaps
node skills/knowledge-graph/scripts/query.cjs --engagement
```

## Architecture

- **12 entity types**: Person, Organization, Product, Topic, Decision, Preference, Task, Event, Conversation, Skill, Lead, Campaign
- **16 relationships**: WORKS_AT, HAS_ROLE, KNOWS, REPORTS_TO, PREFERS, DECIDED, DISCUSSED, MENTIONED_IN, RELATED_TO, ASSIGNED_TO, PART_OF, USES, LED_TO, SIMILAR_TO, REFERRED_BY, CONVERTED_TO
- **Bi-temporal edges**: valid_from/to (real world) + created_at/invalidated_at (system)
- **Multi-tenancy**: RLS policies, field agents scoped to tenant, HQ sees all
- **Extraction**: Gemini Flash, 20-message batches, known entity list for dedup

## Files

- `lib/graph.cjs` — Core graph library (addEntity, addEdge, traverse, resolve)
- `scripts/extract.cjs` — Extraction pipeline (Gemini Flash → Supabase)
- `scripts/query.cjs` — Query CLI (entity lookup, traversal, gaps, engagement)
- `migrations/001-create-tables.sql` — Schema + RLS + indexes

## Environment

```
SUPABASE_URL=https://fcgiuzmmvcnovaciykbx.supabase.co
SUPABASE_SERVICE_KEY=...   # for HQ agents (bypasses RLS)
SUPABASE_ANON_KEY=...      # for field agents (RLS enforced)
GEMINI_API_KEY=...         # for extraction
```

## Schema: research/kg-schema-v3.md
