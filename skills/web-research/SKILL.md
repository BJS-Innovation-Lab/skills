# Web Research Skill (Fireplexity)

AI-powered web search with real-time citations and streaming responses. Like Perplexity, but self-hosted. Perfect for research, fact-checking, and answering questions that need current web data.

## When to Use This Skill
- "Search the web for..." or "Find information about..."
- Questions requiring current/real-time information
- Research with citations needed
- Fact-checking claims
- Market research and analysis
- "What's the latest on..."
- Keywords: "research", "search", "find", "lookup", "current", "latest", "recent", "citation", "source", "verify"

## What It Does
- **Real-time web search** - Gets current information
- **AI synthesis** - Combines multiple sources into coherent answer
- **Citations** - Every claim linked to source
- **Streaming** - See results as they come
- **Follow-ups** - Ask clarifying questions

## Quick Start (CLI Alternative)

If Fireplexity isn't deployed, use firecrawl search:
```bash
# Quick web search
firecrawl search "your research query" --limit 10

# AI agent for deeper research
firecrawl agent "Research and summarize the latest trends in [topic]"
```

## Full Setup

### Install Fireplexity
```bash
cd ~/.openclaw/workspace/tools/firecrawl/fireplexity
npm install
cp .env.example .env
```

### Configure `.env`
```
FIRECRAWL_API_KEY=your-key
OPENAI_API_KEY=your-key
# Or use other providers:
ANTHROPIC_API_KEY=your-key
```

### Run
```bash
npm run dev    # Development on localhost:3000
npm run build  # Production build
```

## Usage

### Web Interface
Navigate to `http://localhost:3000` and ask questions like:
- "What are the best AI tools for small businesses in 2025?"
- "Latest funding rounds in the SMB software space"
- "How does [competitor] compare to [competitor]?"

### API Usage
```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Your research question"}'
```

## Research Workflows

### Market Research
```bash
# Search for market data
firecrawl search "SMB software market size 2025" --limit 10

# Deep dive on specific sources
firecrawl scrape https://relevant-report.com -o market-data.md
```

### Competitive Analysis
```bash
# Find competitor information
firecrawl search "[competitor] reviews pricing features" --limit 10

# Extract structured comparison
firecrawl agent "Compare [competitor A] vs [competitor B] on pricing, features, and target market"
```

### Trend Analysis
```bash
# Current trends
firecrawl search "AI agent trends 2025" --limit 10

# Industry news
firecrawl search "[industry] news this week" --limit 10
```

## For Field Agents
Use this when clients ask:
1. "What's happening in our industry?"
2. "What are competitors doing?"
3. "Find me data on [market/trend]"
4. "What's the best [tool/approach] for [problem]?"

## Combining with Other Skills

### Research → Scrape → Analyze
```bash
# 1. Find relevant sources
firecrawl search "topic" --limit 5

# 2. Scrape the best ones
firecrawl scrape https://best-source.com -o research.md

# 3. Analyze with AI
cat research.md | # pipe to your analysis
```

## Source
Tool: `~/.openclaw/workspace/tools/firecrawl/fireplexity/`
Repo: https://github.com/firecrawl/fireplexity
