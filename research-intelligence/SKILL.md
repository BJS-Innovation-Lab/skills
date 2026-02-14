---
name: research-intelligence
description: "Automated research discovery, analysis, and synthesis system. Scans arXiv, Semantic Scholar, and other sources daily for relevant papers. Filters by relevance, processes with Gemini, analyzes with Opus, routes to domain experts, and delivers morning briefings. Includes task tracking, expert protocols, and memory integration."
---

# Research Intelligence System

🔬 Automated research discovery and synthesis for BJS Labs agents.

**Owner:** Sybil (ML/Research Lead)  
**Version:** 0.1.0  
**Status:** Active

---

## Overview

This skill provides a complete research intelligence pipeline that:

1. **Discovers** relevant papers from multiple sources daily
2. **Filters** by relevance using project context and memory
3. **Processes** PDFs with Gemini 2.5 Flash Preview
4. **Analyzes** top papers with Claude Opus
5. **Routes** domain-specific papers to expert agents
6. **Tracks** all tasks with strict monitoring
7. **Delivers** morning briefings to stakeholders

---

## Quick Start

### Installation

```bash
# Clone to your skills directory
git clone https://github.com/BJS-Innovation-Lab/research-intelligence.git ~/.openclaw/workspace/skills/research-intelligence

# Install dependencies
cd ~/.openclaw/workspace/skills/research-intelligence
npm install

# Run setup (creates Supabase tables)
node scripts/setup.js
```

### Configuration

Create `.env` in the skill directory:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
```

### Run Daily Scan

```bash
# Manual run
node scripts/daily-scan.js

# Or via cron (set up in OpenClaw)
# Schedule: 0 8 * * * (8 AM daily)
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DAILY PIPELINE (8 AM EST)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  STAGE 1: DISCOVER                                                   │
│  ├── arXiv API (cs.AI, cs.LG, cs.CL, cs.MA)                         │
│  ├── Semantic Scholar API (business, psychology, economics)          │
│  └── Output: ~50-100 candidate papers                                │
│                                                                      │
│  STAGE 2: FILTER (Claude Opus)                                       │
│  ├── Load project context (Memory Interface)                         │
│  ├── Score each abstract 1-10                                        │
│  └── Keep papers scoring ≥ 7 (~5-15 papers)                          │
│                                                                      │
│  STAGE 3: PROCESS (Gemini 2.5 Flash Preview)                         │
│  ├── Download PDFs from source                                       │
│  ├── Gemini reads full PDF natively                                  │
│  ├── Extract: findings, methods, charts                              │
│  └── Store in Supabase + pgvector embeddings                         │
│                                                                      │
│  STAGE 4: ROUTE TO EXPERTS                                           │
│  ├── Backend/Architecture → Sage                                     │
│  ├── UX/Product → Sam                                                │
│  ├── Business/Economics → Saber                                      │
│  └── Track tasks in research_tasks table                             │
│                                                                      │
│  STAGE 5: ANALYZE & REPORT (Claude Opus)                             │
│  ├── Deep analysis of top 3 papers                                   │
│  ├── Cross-domain creative connections                               │
│  └── Deliver morning briefing via Telegram                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Research Domains

| Domain | Source | Keywords |
|--------|--------|----------|
| **Agent Tech** | arXiv | agents, multi-agent, tool use, RAG |
| **Deep Theory** | arXiv, Semantic Scholar | cognitive architecture, memory systems, metacognition |
| **AutoML** | arXiv | AutoML, automated data analysis, NAS |
| **Business Automation** | Semantic Scholar | AI automation, workflow, SMB AI |
| **AI Product/UX** | Semantic Scholar | human-AI interaction, conversational AI |
| **Business Fundamentals** | Semantic Scholar, SSRN | business metrics, SMB analytics |
| **AI Economics** | NBER, Semantic Scholar | AI economic impact, future of work |

---

## Models Used

| Task | Model | Why |
|------|-------|-----|
| Relevance scoring | Claude Opus | Best reasoning |
| PDF processing | Gemini 2.5 Flash Preview | Native PDF, great at charts |
| Deep analysis | Claude Opus | Complex synthesis |
| Embeddings | OpenAI ada-002 | Proven, cost-effective |

---

## Expert Agent Protocol

When papers are routed to domain experts, they MUST follow this protocol:

### 1. ACKNOWLEDGE (within 1 hour)

```
Receive A2A → Reply: "ACK: [paper_id] received, will analyze by [time]"
```

### 2. ANALYZE (within 24 hours)

- Read the paper summary from Sybil
- Add domain-specific insights
- Identify applications to current work
- Note concerns or limitations

### 3. RESPOND (via A2A)

```json
{
  "paper_id": "arxiv-2602.12345",
  "analysis": "This paper introduces...",
  "applications": ["Could improve our RAG system", "Relevant to memory architecture"],
  "relevance_to_my_work": "high",
  "action_items": ["Test this approach in dev", "Discuss with team"]
}
```

### 4. LOG TO MEMORY (REQUIRED)

If `relevance_to_my_work` is "high" or "medium":

```markdown
# In your memory/YYYY-MM-DD.md:

## Research: [Paper Title]
- **Source:** arXiv 2602.12345
- **Key insight:** [What you learned]
- **Application:** [How it applies to your work]
- **Action:** [What you'll do with this]
```

**Failure to log = Sybil follows up via A2A**

---

## Monitoring & Escalation

### Task Tracking

All routed papers are tracked in `research_tasks` table:

| Field | Description |
|-------|-------------|
| paper_id | Reference to research_papers |
| assigned_to | Agent name |
| status | pending, in_progress, complete, overdue |
| due_at | 24 hours from assignment |
| memory_logged | Verified by Sybil |

### Cron Checkpoints

```
08:00 - Daily scan starts
08:15 - Checkpoint: Papers fetched?
08:30 - Checkpoint: Filtering complete?
09:00 - Checkpoint: PDFs processed?
09:30 - Checkpoint: Expert tasks assigned?
10:00 - Morning report delivered
```

### Escalation Path

| Condition | Action |
|-----------|--------|
| Task overdue 24h | Sybil pings agent via A2A |
| Task overdue 48h | Sybil alerts Bridget |
| Memory not logged | Sybil reminds agent |
| Pattern of misses | Bridget notified |

---

## Morning Report Format

```markdown
# 🔬 Daily Research Briefing - [Date]

## 🔥 Must-Read (Top 3)

### 1. [Paper Title]
**Source:** arXiv 2602.12345
**Why it matters:** [1-2 sentences]
**Key finding:** [Bullet points]
**Application to BJS:** [Specific suggestion]
**Action item:** [ ] [Concrete next step]

### 2. [Paper Title]
...

## 📚 Worth Reviewing (Passed Filter)

- **[Title]** - [Brief note] - Routed to [Agent]
- ...

## 💡 Creative Insight

[Cross-domain connection discovered between papers]

## 🛠️ Recommended Actions

1. [ ] [Specific implementation idea]
2. [ ] [Experiment to try]
3. [ ] [Discussion to have]

## 📊 Stats

- Papers scanned: X
- Passed filter: Y
- Routed to experts: Z
- Pending expert reviews: N
```

---

## Memory Interface

This skill works with both current memory (MEMORY.md) and future agentic-learning system:

```javascript
// Automatically detects which system is active
const context = await memoryInterface.getProjectContext();
// Returns: { priorities, recentContext, pastResearch }
```

See `lib/memory-interface.js` for implementation.

---

## File Structure

```
research-intelligence/
├── SKILL.md              # This file
├── package.json          # Dependencies
├── .env.example          # Environment template
│
├── lib/
│   ├── arxiv-fetcher.js      # arXiv API client
│   ├── semantic-scholar.js   # Semantic Scholar client
│   ├── pdf-processor.js      # Gemini PDF processing
│   ├── relevance-scorer.js   # Opus scoring
│   ├── memory-interface.js   # Memory system abstraction
│   ├── task-tracker.js       # Task monitoring
│   └── report-generator.js   # Morning report
│
├── scripts/
│   ├── setup.js              # Initial setup
│   ├── daily-scan.js         # Main pipeline
│   └── check-overdue.js      # Overdue task checker
│
├── schema/
│   └── tables.sql            # Supabase schema
│
├── prompts/
│   ├── relevance-scoring.md  # Filtering prompt
│   ├── pdf-extraction.md     # Gemini prompt
│   ├── deep-analysis.md      # Opus analysis prompt
│   └── morning-report.md     # Report generation
│
└── docs/
    ├── ARCHITECTURE.md       # Detailed architecture
    ├── EXPERT-PROTOCOL.md    # Protocol for domain experts
    └── TROUBLESHOOTING.md    # Common issues
```

---

## Changelog

### 0.1.0 (2026-02-12)
- Initial release
- arXiv and Semantic Scholar integration
- Gemini 2.5 Flash Preview for PDF processing
- Claude Opus for analysis
- Expert routing with A2A
- Task tracking and monitoring
- Memory-agnostic design

---

*Built by Sybil for BJS Labs*
