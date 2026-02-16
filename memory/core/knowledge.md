# Knowledge — Domain Knowledge & Validated Learnings

## Memory Architecture
- Three-tier: Core (permanent) → Working (active) → Learning (feedback loop)
- Retrieval: Two-phase (semantic similarity → re-rank by utility + recency + tier)
- Utility scoring: outcomes feed back into retrieval quality
- MEMORY.md limit: 4166 chars. Boot memory is an index, not storage.
- LLMs have primacy/recency bias — structure boot memory accordingly

## VULKN Business Model
- AI agents as a service for SMBs, starting Mexico
- Price: ~$35,000 MXN/month ($2K USD) per agent standard
- Flexible pricing for PyMEs: $10-16K MXN tier possible
- Internal cost per agent: ~$50-200 USD/month (tokens + infra)
- First product: Truth Hire (interview lie detection)

## Agent Architecture
- OpenClaw on Mac Mini = internal team agents
- Cloud servers = client-facing agents (when multi-tenant needed)
- A2A protocol for inter-agent communication
- Shared KB in Supabase (bjs_knowledge table)
- Agent memory synced to Supabase via embeddings (documents table)

## Research Findings (Feb 2026)
- MemRL: similarity ≠ utility in retrieval (adopted into pipeline)
- MEMENTO: multi-memory coordination requires structure (future consideration)
- Memory survey: our three-tier approach aligns with field taxonomy
- Key gap: only ~18% of decisions have outcome tracking
