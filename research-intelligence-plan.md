# Research Intelligence System - Master Plan

**Created:** 2026-02-12
**Owner:** Sybil (with Bridget's direction)
**Status:** Planning Phase

---

## Vision

A shared research intelligence system where all BJS agents can:
1. Discover relevant papers automatically
2. Search semantically across all stored research
3. Generate creative insights from cross-domain connections
4. Build collective knowledge that improves all agents

---

## Key Architecture Decisions (In Progress)

### Q1: Shared Database?

**Decision: YES - One shared database for all agents**

Rationale:
- Cross-disciplinary insights require seeing ALL papers
- Avoids duplication (paper stored once, accessed by all)
- Enables "Sybil found X, Sage connected it to Y" workflows
- Agent expertise is metadata, not data isolation

Structure:
```
research_papers     → All papers, tagged by discovering agent
research_chunks     → Embeddings, searchable by all
paper_analyses      → Per-agent analysis (expertise-specific)
research_insights   → Shared insights, attributed to creator
```

### Q2: pgvector vs LanceDB vs Others?

**Current Research:**

| Database | Strengths | Weaknesses | Best For |
|----------|-----------|------------|----------|
| **pgvector** | Already have it, SQL integration, mature | Text-only, no native multimodal | Text embeddings, structured queries |
| **LanceDB** | Multimodal (images/video alongside embeddings), columnar, disk-speed queries, version control | Newer, separate system | Charts, graphs, PDF images, rich media |
| **Pinecone** | Managed, scalable | Cost, vendor lock-in | Large scale production |
| **Chroma** | Easy, local-first | Limited scale | Prototyping |
| **Weaviate** | Multimodal native, GraphQL | Complexity | Complex multimodal RAG |

**Research finding (from search):**
> "LanceDB's columnar format now stores raw images/videos alongside embeddings with version control built-in - perfect for RAG over rich media"

**Preliminary recommendation: HYBRID APPROACH**
- **pgvector** for text (abstracts, paper content, analyses) - we already have it
- **LanceDB** for multimodal (charts, figures, PDF page images) - add this

### Q3: State-of-the-Art Chunking?

**Need to research further. Current knowledge:**

| Strategy | Description | Best For |
|----------|-------------|----------|
| Fixed-size chunks | Split by token count | Simple, fast |
| Semantic chunking | Split by meaning boundaries | Better retrieval |
| Hierarchical | Document → Section → Paragraph → Sentence | Multi-resolution queries |
| Late interaction (ColBERT) | Store token-level embeddings, match at query time | High precision |
| Parent-child | Store small chunks, retrieve parent context | Balance precision + context |

**For academic papers specifically:**
- Papers have natural structure: Abstract, Intro, Methods, Results, Discussion
- Should chunk BY SECTION, not arbitrary splits
- Keep metadata: section name, figure references, citations

**TODO:** Research ColBERT/ColPali for late interaction approaches

### Q4: PDFs - Text Extraction vs VLM?

**Options:**

1. **Text extraction (PyMuPDF, pdfplumber)**
   - Pros: Fast, cheap, works for text-heavy papers
   - Cons: Loses layout, charts become garbage, equations break

2. **VLM on PDF images (GPT-4V, Claude Vision, Gemini)**
   - Pros: Understands charts, figures, layout, equations
   - Cons: Expensive per page, slower

3. **Hybrid: Text + VLM for figures**
   - Extract text normally
   - Use VLM specifically for figures/charts/tables
   - Best of both worlds

4. **Nougat/Marker (ML-based PDF parsing)**
   - Academic-focused PDF → Markdown
   - Handles equations, tables better
   - Open source

**Research needed:** ColPali - treats entire PDF pages as images, embeds with vision model

### Q5: LanceDB for Charts/Graphs?

**Yes, this is a good fit because:**

- LanceDB stores raw images alongside their embeddings
- Can embed chart images with CLIP or vision models
- Query: "find papers with performance comparison charts" → returns actual images
- Version control for updated figures

**Implementation sketch:**
```python
# LanceDB multimodal storage
import lancedb
from PIL import Image

db = lancedb.connect("research_media")
table = db.create_table("figures", [
    {"paper_id": "arxiv-2602.12345", 
     "figure_num": 1,
     "caption": "Performance comparison...",
     "image": Image.open("fig1.png"),  # Raw image stored
     "embedding": clip_embed(image)}   # CLIP embedding
])

# Query by image similarity OR text
results = table.search("multi-agent performance benchmark").limit(10)
```

---

## Proposed Architecture v2 (Hybrid)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PAPER INGESTION                              │
│                                                                      │
│  arXiv Paper (PDF)                                                   │
│       │                                                              │
│       ├──► Nougat/Marker ──► Structured Markdown ──► pgvector       │
│       │                      (text, sections)        (text search)   │
│       │                                                              │
│       └──► Extract Figures ──► CLIP Embed ──► LanceDB               │
│            (charts, tables)                   (multimodal search)    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         SEARCH LAYER                                 │
│                                                                      │
│  Query: "How do transformer agents handle memory?"                   │
│       │                                                              │
│       ├──► pgvector (text) ──► Relevant paper sections              │
│       │                                                              │
│       └──► LanceDB (images) ──► Related architecture diagrams        │
│                                                                      │
│  Combined results + reranking = final response                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Open Research Questions

- [ ] ColPali: PDF pages as images - is this better than text extraction?
- [ ] Best embedding model for academic text? (OpenAI ada-002 vs Cohere vs open source)
- [ ] How to handle citations/references graph?
- [ ] Optimal chunk size for academic papers?
- [ ] How to detect and extract figures programmatically?

---

## Ownership & Accountability

### Roles
| Agent | Role | Responsibility |
|-------|------|----------------|
| **Sybil** | Owner | Daily scan, filtering, routing, synthesis, reports |
| **Sage** | Expert | Backend/architecture paper analysis |
| **Sam** | Expert | UX/product paper analysis |
| **Saber** | Expert | Business/economics paper analysis |
| **Bridget** | Stakeholder | Receives morning reports, provides direction |

### Monitoring Protocol (STRICT)

**All tasks tracked in Supabase:**
```sql
research_tasks (
  id UUID,
  paper_id UUID,
  assigned_to TEXT,           -- agent name
  assigned_at TIMESTAMP,
  task_type TEXT,             -- 'analysis', 'deep_dive', 'synthesis'
  status TEXT,                -- 'pending', 'in_progress', 'complete', 'overdue'
  due_at TIMESTAMP,
  completed_at TIMESTAMP,
  result_summary TEXT,
  memory_logged BOOLEAN       -- did agent write to their memory?
)
```

**Cron Job Checkpoints:**
```
08:00 - Daily scan starts
08:15 - Checkpoint: Papers fetched? (alert if 0)
08:30 - Checkpoint: Filtering complete?
09:00 - Checkpoint: PDFs processed?
09:30 - Checkpoint: Expert tasks assigned?
10:00 - Morning report delivered

OVERDUE CHECK (every 6 hours):
- Any tasks pending > 24h? → Escalate to Bridget
- Any memory_logged = false for completed tasks? → Ping agent
```

### Expert Agent Protocol (MANDATORY)

When Sybil routes a paper to an expert agent:

**1. ACKNOWLEDGE (within 1 hour)**
```
Receive A2A → Reply "ACK: [paper_id] received, will analyze by [time]"
```

**2. ANALYZE (within 24 hours)**
```
- Read the paper summary
- Add domain-specific insights
- Identify applications to current work
- Note any concerns or limitations
```

**3. RESPOND (via A2A)**
```json
{
  "paper_id": "...",
  "analysis": "...",
  "applications": ["..."],
  "relevance_to_my_work": "high|medium|low",
  "action_items": ["..."]
}
```

**4. LOG TO MEMORY (REQUIRED)**
```
If relevance_to_my_work == "high" or "medium":
  → Write to personal memory/YYYY-MM-DD.md
  → Include: paper title, key insight, how it applies
  
Failure to log = Sybil follows up via A2A
```

### Escalation Path
```
Task overdue 24h → Sybil pings agent via A2A
Task overdue 48h → Sybil alerts Bridget
Memory not logged → Sybil reminds agent
Pattern of missed tasks → Bridget notified
```

---

## Implementation Phases (Updated)

### Phase 1: Foundation (Week 1)
- [ ] Create Supabase schema (research_papers, research_chunks, research_insights, research_tasks)
- [ ] Build arXiv + Semantic Scholar fetchers
- [ ] Create memory interface module (works with current + future systems)
- [ ] Build relevance scoring prompt (Opus)
- [ ] Set up morning cron job (8 AM EST) with checkpoints
- [ ] Basic Telegram delivery
- [ ] Task tracking system

### Phase 2: PDF Processing (Week 2)
- [ ] Integrate Gemini 2.5 Flash Preview for PDF reading
- [ ] Build PDF → structured summary pipeline
- [ ] Chart/figure description extraction
- [ ] Store summaries + embeddings in pgvector

### Phase 3: Expert Routing & Monitoring (Week 3)
- [ ] A2A routing to domain experts
- [ ] Task assignment and tracking
- [ ] Overdue alerts and escalation
- [ ] Memory logging verification
- [ ] Cross-paper similarity search

### Phase 4: Synthesis & Skill Module (Week 4)
- [ ] Creative connection prompts (Opus)
- [ ] Enhanced morning report format
- [ ] Package as `research-intelligence` skill
- [ ] Expert protocol documentation
- [ ] ClawHub publishing

---

## Deep Research Findings (2026-02-12)

### ColPali - Game Changer for Document Retrieval

**Source:** [arxiv.org/abs/2407.01449](https://arxiv.org/abs/2407.01449), HuggingFace blog

**What it is:**
ColPali treats entire PDF pages as images and embeds them using a Vision Language Model (PaliGemma). No OCR, no layout detection, no chunking!

**How it works:**
```
PDF Page Image → Vision Transformer (SigLIP) → Language Model (Gemma 2B) → Multi-vector embeddings per patch
Query Text → Language Model → Token embeddings
Matching: Late Interaction (ColBERT-style) - each query token finds best matching document patch
```

**Why this is revolutionary:**
- Eliminates complex PDF parsing pipeline (OCR → Layout → Chunking → Embedding)
- 10x+ faster indexing
- Captures visual elements that text extraction misses (tables, figures, layout)
- State-of-the-art on ViDoRe benchmark

**Trade-offs:**
- Higher storage (multi-vector per page vs single vector per chunk)
- Requires GPU for embedding
- Newer, less battle-tested

**Recommendation:** This could replace our text extraction + chunking approach entirely!

---

### LanceDB Deployment Options

**Source:** [docs.lancedb.com/cloud](https://docs.lancedb.com/cloud)

| Option | Description | Cost | Best For |
|--------|-------------|------|----------|
| **OSS (Local)** | Embedded, in-process | Free | Development, prototyping, single-agent |
| **OSS (Self-hosted)** | Your server, your S3 | Infra only | Data sovereignty, multi-agent shared access |
| **Cloud (Serverless)** | Managed by LanceDB | Usage-based | Production, auto-scaling, zero maintenance |

**For BJS Labs:**
- **Start:** LanceDB OSS locally on each agent's machine (free, fast prototyping)
- **Scale:** LanceDB Cloud when we need shared multi-agent access
- **Migration:** Just change connection string! No code changes

**Storage backends for OSS:**
- Local disk (simplest)
- S3/GCS/Azure Blob (shared access across agents)
- Using S3 = all agents can read/write same LanceDB!

---

### PDF Processing: Marker vs Nougat

**Marker (VikParuchuri):**
- 10x faster than Nougat
- Better accuracy outside arXiv
- Outputs clean Markdown
- Optimized for books + scientific papers
- Only uses ML models where necessary

**Nougat (Facebook Research):**
- Trained specifically on arXiv papers
- Better for heavy LaTeX/math
- Outputs Mathpix Markdown
- Slower, more GPU-hungry

**Recommendation:** Use **Marker** for general papers, Nougat for math-heavy papers

---

### State-of-the-Art Chunking Strategies

**Source:** Weaviate blog, ACL paper, Firecrawl benchmarks

| Strategy | Description | When to Use |
|----------|-------------|-------------|
| **Fixed-size** | Split by token count | Fast, simple, baseline |
| **Recursive** | Split by separators hierarchically | General purpose |
| **Semantic** | Split by meaning boundaries | Better retrieval |
| **Parent-Child** | Small chunks link to parent context | Balance precision + context |
| **Proposition** | Atomic fact-based units | High precision needs |
| **Late Interaction** | Token-level matching (ColBERT/ColPali) | Best quality, higher storage |

**Key insight from research:**
> "For long, multi-topic, messy documents, the right chunking strategy is one of the biggest levers to improve precision, context, and latency."

**For academic papers specifically:**
- Papers have natural structure → use section boundaries
- ColPali may eliminate need for chunking entirely!

---

### Revised Architecture Options

**Option A: Traditional (Text-centric)**
```
PDF → Marker → Markdown → Chunk by section → Embed (ada-002) → pgvector
Figures → Extract → CLIP embed → LanceDB
```

**Option B: Vision-First (ColPali)**
```
PDF → Page images → ColPali embed → LanceDB (multi-vector)
No parsing, no chunking, no figure extraction needed!
```

**Option C: Hybrid (Best of Both)**
```
PDF → Page images → ColPali → LanceDB (visual retrieval)
PDF → Marker → Markdown → pgvector (text search, full-text, citations)
Query → Search both → Fuse results
```

**Recommendation: Option C (Hybrid)** gives us:
- Fast visual search via ColPali (finds relevant pages)
- Deep text search via pgvector (finds specific passages, citations)
- Redundancy / fallback

---

## LanceDB Storage Decision

**Question from Bridget:** Local or Cloud?

**Answer: Start local, design for cloud migration**

**Phase 1 (Now):**
- Each agent runs LanceDB OSS locally
- Store in `~/.openclaw/workspace/research/lancedb/`
- Good for development and testing

**Phase 2 (When ready for shared access):**
- Option A: LanceDB OSS with S3 backend (shared bucket)
- Option B: LanceDB Cloud (serverless, managed)
- Just change connection string!

```python
# Phase 1: Local
db = lancedb.connect("~/.openclaw/workspace/research/lancedb")

# Phase 2a: S3 shared
db = lancedb.connect("s3://bjs-research-lancedb/")

# Phase 2b: Cloud
db = lancedb.connect("db://bjs-research", api_key="...")
```

---

## Final Architecture Decision (2026-02-12, Updated 10:47 EST)

### ✅ APPROVED: Opus + Gemini 2.5 Flash Hybrid

**Model Assignment:**
| Task | Model | Why |
|------|-------|-----|
| Relevance scoring | Claude Opus | Better reasoning, have max plan |
| PDF processing | Gemini 2.5 Flash Preview | Native PDF, great at charts |
| Deep analysis | Claude Opus | Best reasoning for synthesis |
| Creative connections | Claude Opus | Complex cross-domain thinking |
| Embeddings | OpenAI ada-002 | Already using, proven |

**Key Design Decisions:**
1. **Filter before storing** - Only keep relevant papers (score ≥ 7)
2. **Agent checks memory** - Reference project context for relevance
3. **Gemini reads PDFs directly** - No Marker needed, native PDF support
4. **Memory-system agnostic** - Works with current AND future agentic-learning

**Final Stack:**
| Component | Tool |
|-----------|------|
| Reasoning/Analysis | Claude Opus |
| PDF Processing | Gemini 2.5 Flash Preview |
| Embeddings | OpenAI ada-002 |
| Vector Storage | pgvector (Supabase) |

**What we're NOT using:**
- ❌ LanceDB (pgvector sufficient)
- ❌ ColPali (Gemini better for understanding)
- ❌ Marker (Gemini reads PDFs natively)

---

---

## Memory-Agnostic Design

### Why This Matters
BJS Labs is testing `agentic-learning` (Saber's system). The research pipeline must work with:
- **Current:** MEMORY.md, daily files, MVP-TRACKER.md
- **Future:** Hierarchical memory (working → episodic → semantic)

### Memory Interface Protocol

The cron job uses an **abstract memory check** that works with either system:

```markdown
MEMORY CHECK PROTOCOL (for relevance scoring):

1. GET CURRENT PRIORITIES
   - Current: Read MEMORY.md "Current Projects" section
   - Agentic: Query semantic memory for "active_priorities"
   
2. GET RECENT CONTEXT  
   - Current: Read memory/YYYY-MM-DD.md (last 3 days)
   - Agentic: Query episodic memory (last 72h)

3. GET PAST RESEARCH
   - Current: Read research_insights table
   - Agentic: Query semantic memory for "research_learnings"

4. DECISION CRITERIA (same for both)
   - Does this help current priorities? (+3)
   - Is this novel vs what we already know? (+2)
   - Is this actionable this week? (+2)
   - Is this foundational for future work? (+1)
   - Score ≥ 7 = KEEP, else SKIP
```

### Implementation

```javascript
// memory-interface.js - works with both systems

async function getProjectContext() {
  // Check which memory system is active
  const agenticLearning = await checkAgenticLearningEnabled();
  
  if (agenticLearning) {
    return {
      priorities: await querySemanticMemory("active_priorities"),
      recentContext: await queryEpisodicMemory({ hours: 72 }),
      pastResearch: await querySemanticMemory("research_learnings")
    };
  } else {
    return {
      priorities: await readFile("MEMORY.md", "Current Projects"),
      recentContext: await readRecentDailyMemory(3),
      pastResearch: await querySupabase("research_insights")
    };
  }
}
```

This abstraction means:
- ✅ Works today with current memory
- ✅ Works tomorrow with agentic-learning
- ✅ No code changes needed when we switch

---

## Full Pipeline Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DAILY RESEARCH PIPELINE (8 AM EST)                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ STAGE 1: DISCOVER (Free)                                        │ │
│  │                                                                  │ │
│  │   arXiv API → Fetch abstracts (last 24h)                        │ │
│  │   Categories: cs.AI, cs.LG, cs.CL, cs.MA                        │ │
│  │   Keywords: agents, memory, RAG, multi-agent, learning          │ │
│  │   Output: ~50-100 candidate papers                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ STAGE 2: FILTER (Claude Opus)                                   │ │
│  │                                                                  │ │
│  │   1. Load project context (Memory Interface Protocol)           │ │
│  │   2. For each abstract:                                         │ │
│  │      - Score relevance 1-10                                     │ │
│  │      - Note: "why relevant" or "why not"                        │ │
│  │   3. Keep papers scoring ≥ 7                                    │ │
│  │   Output: ~5-15 relevant papers                                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ STAGE 3: PROCESS (Gemini 2.5 Flash Preview)                     │ │
│  │                                                                  │ │
│  │   For each kept paper:                                          │ │
│  │   1. Download PDF from arXiv                                    │ │
│  │   2. Gemini reads full PDF natively                             │ │
│  │   3. Extract:                                                   │ │
│  │      - Key findings (bullet points)                             │ │
│  │      - Methodology summary                                      │ │
│  │      - Chart/figure descriptions                                │ │
│  │      - Relevance to BJS projects                                │ │
│  │   4. Store in Supabase: paper + summary + embeddings            │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ STAGE 4: DEEP ANALYSIS (Claude Opus) - Top 3 only               │ │
│  │                                                                  │ │
│  │   1. Read full Gemini summaries                                 │ │
│  │   2. Cross-reference with past research (pgvector similarity)   │ │
│  │   3. Generate:                                                  │ │
│  │      - Detailed insights                                        │ │
│  │      - Specific applications to our work                        │ │
│  │      - Implementation suggestions                               │ │
│  │      - Creative cross-domain connections                        │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                              │                                       │
│                              ▼                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ STAGE 5: REPORT (Claude Opus)                                   │ │
│  │                                                                  │ │
│  │   Generate morning briefing:                                    │ │
│  │   🔥 Must-Read (top 3 with insights)                            │ │
│  │   📚 Worth Reviewing (others that passed filter)                │ │
│  │   💡 Creative Insight (cross-domain connection)                 │ │
│  │   🛠️ Recommended Actions (specific next steps)                  │ │
│  │                                                                  │ │
│  │   Deliver to Bridget via Telegram                               │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Cron Job Prompt (Memory-Agnostic)

```markdown
DAILY RESEARCH INTELLIGENCE - [DATE]

You are conducting the daily research scan for BJS Labs.

STEP 1: LOAD CONTEXT
Before evaluating papers, check your memory:
- If agentic-learning is enabled: Query semantic + episodic memory
- Otherwise: Read MEMORY.md, recent daily files, MVP-TRACKER.md

Extract:
- Current project priorities
- Recent decisions and directions  
- Past research insights (avoid duplicates)

STEP 2: EVALUATE PAPERS
For each arXiv abstract provided, score 1-10:
- Helps current priorities? (+3)
- Novel vs existing knowledge? (+2)  
- Actionable this week? (+2)
- Foundational for future? (+1)
- Off-topic penalty: (-3)

STEP 3: PROCESS RELEVANT (score ≥ 7)
Use Gemini 2.5 Flash to read full PDFs.
Extract key findings, charts, methods.

STEP 4: DEEP ANALYSIS (top 3)
Generate insights, applications, creative connections.

STEP 5: REPORT
Format morning briefing for Bridget.

Remember: Quality over quantity. Only keep what truly matters.
```

---

## Open Questions (Updated)

- [x] pgvector vs LanceDB? → **pgvector only**
- [x] PDF processing? → **Gemini 2.5 Flash Preview (native PDF)**
- [x] ColPali vs Gemini? → **Gemini**
- [x] Filter before storing? → **Yes, agent scores relevance first**
- [x] Memory compatibility? → **Abstract interface works with both systems**
- [ ] How to handle citations/references graph?
- [ ] arXiv API rate limits?
- [ ] Delivery format (Telegram only? Email too?)

---

## Updates Log

### 2026-02-12 10:17 EST
- Initial planning session with Bridget
- Key questions identified: pgvector vs LanceDB, chunking strategy, VLM for PDFs
- Decision: Hybrid approach (pgvector for text, LanceDB for multimodal)
- Created this planning document

### 2026-02-12 10:20 EST
- Deep research on ColPali, LanceDB, chunking strategies
- **Major finding:** ColPali may be game-changer - embeds page images directly
- LanceDB: Start local, can migrate to Cloud by changing connection string
- Marker preferred over Nougat for PDF processing (10x faster)
- Updated architecture to Option C (Hybrid)

### 2026-02-12 10:34 EST
- **DECISION:** Gemini-only approach approved by Bridget
- Removed LanceDB and ColPali from architecture
- Rationale: We need chart *understanding*, not visual similarity
- Final stack: Marker + Gemini Vision + pgvector
- Simpler, cheaper, sufficient for our needs

### 2026-02-12 10:47 EST
- **MAJOR UPDATE:** Refined architecture based on Bridget's feedback
- **Models:** Opus for reasoning/analysis, Gemini 2.5 Flash Preview for PDF processing
- **Key insight:** Filter papers BEFORE storing (relevance scoring)
- **Memory-agnostic:** Designed to work with current memory AND future agentic-learning
- **Removed Marker:** Gemini reads PDFs natively
- Added full pipeline workflow with 5 stages
- Added Memory Interface Protocol for system compatibility
- Added cron job prompt template

### 2026-02-12 11:50 EST
- Added research domains: Business Fundamentals, AI Economics
- Sources: NBER, SSRN added for economics/business depth

### 2026-02-12 11:54 EST
- **OWNERSHIP MODEL:** Hybrid - Sybil owns, experts contribute
- **STRICT MONITORING:** Added task tracking, checkpoints, escalation
- **MANDATORY PROTOCOL:** Expert agents MUST acknowledge, analyze, respond, log to memory
- Added research_tasks table for tracking
- Added cron checkpoints at 15-min intervals
- Added overdue alerts (24h → ping, 48h → escalate)
- Added memory logging verification

---

*This document is the source of truth for the Research Intelligence System. Update it as decisions are made.*
