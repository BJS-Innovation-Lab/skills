# 🔬 Research Intelligence System

Automated research discovery, analysis, and synthesis for BJS Labs AI agents.

[![Built for OpenClaw](https://img.shields.io/badge/Built%20for-OpenClaw-blue)](https://openclaw.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Overview

This skill provides a complete research intelligence pipeline that:

- 🔍 **Discovers** relevant papers from arXiv, Semantic Scholar, NBER, and more
- 🎯 **Filters** by relevance using project context and memory
- 📄 **Processes** PDFs with Gemini 2.5 Flash Preview
- 🧠 **Analyzes** top papers with Claude Opus
- 📨 **Routes** domain-specific papers to expert agents
- 📊 **Tracks** all tasks with strict monitoring
- 📬 **Delivers** morning briefings to stakeholders

## Quick Start

```bash
# Clone the repo
git clone https://github.com/BJS-Innovation-Lab/research-intelligence.git

# Install dependencies
cd research-intelligence
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys

# Run the setup (creates Supabase tables)
npm run setup

# Run a manual scan
npm run scan
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DAILY PIPELINE (8 AM EST)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  STAGE 1: DISCOVER                                               │
│  └── arXiv + Semantic Scholar → ~50-100 candidates               │
│                                                                  │
│  STAGE 2: FILTER (Claude Opus)                                   │
│  └── Score by relevance → Keep score >= 7 (~5-15 papers)         │
│                                                                  │
│  STAGE 3: PROCESS (Gemini 2.5 Flash)                            │
│  └── Read PDFs → Extract findings, charts, methods               │
│                                                                  │
│  STAGE 4: ROUTE TO EXPERTS                                       │
│  └── Backend → Sage | Frontend → Sam | Business → Saber          │
│                                                                  │
│  STAGE 5: ANALYZE & REPORT (Claude Opus)                        │
│  └── Deep analysis → Morning briefing to Bridget                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Research Domains

| Domain | Source | Focus |
|--------|--------|-------|
| Agent Tech | arXiv | Multi-agent, tools, RAG |
| Deep Theory | arXiv | Cognitive architecture, memory |
| AutoML | arXiv | Automated ML, data analysis |
| Business Automation | Semantic Scholar | Workflows, SMB AI |
| AI Economics | NBER, Semantic Scholar | Future of work, AI impact |

## Expert Protocol

When papers are routed to domain experts, they must:

1. **ACK** within 1 hour
2. **ANALYZE** within 24 hours
3. **RESPOND** with structured JSON
4. **LOG TO MEMORY** for high/medium relevance

See [docs/EXPERT-PROTOCOL.md](docs/EXPERT-PROTOCOL.md) for full details.

## Monitoring

- Task tracking in Supabase
- Cron checkpoints every 15 minutes
- Escalation: 24h → ping, 48h → alert Bridget
- Memory logging verification

## File Structure

```
research-intelligence/
├── SKILL.md              # OpenClaw skill definition
├── README.md             # This file
├── package.json          # Dependencies
├── .env.example          # Environment template
│
├── lib/                  # Core modules
│   ├── arxiv-fetcher.js
│   ├── semantic-scholar.js
│   ├── memory-interface.js
│   └── task-tracker.js
│
├── scripts/              # Executable scripts
│   ├── daily-scan.js
│   ├── setup.js
│   └── check-overdue.js
│
├── schema/               # Database schema
│   └── tables.sql
│
├── prompts/              # LLM prompts
│   └── ...
│
└── docs/                 # Documentation
    └── EXPERT-PROTOCOL.md
```

## Configuration

Edit `research_config` table in Supabase or modify defaults in schema/tables.sql:

- `sources`: Enable/disable research sources
- `keywords`: Search terms by domain
- `thresholds`: Relevance score cutoff, task deadlines
- `agents`: Expert assignments

## Contributing

1. Create a branch in `BJS-Innovation-Lab/research-intelligence`
2. Make changes
3. Test locally with `npm run scan`
4. Submit PR for review

## License

MIT - See [LICENSE](LICENSE) for details.

---

*Built by Sybil for BJS Labs | [OpenClaw](https://openclaw.ai)*
