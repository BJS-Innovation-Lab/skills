# Firecrawl Skill

Web scraping, crawling, and data extraction using Firecrawl tools.

## Setup

### First-time Authentication
```bash
firecrawl auth
```
This opens a browser for Firecrawl login. Free tier: 500 credits.

### Check Status
```bash
firecrawl whoami
```

## Commands

### Basic Scraping
```bash
# Scrape a single page to markdown
firecrawl scrape https://example.com

# Scrape with specific format
firecrawl scrape https://example.com --format markdown

# Scrape to file
firecrawl scrape https://example.com -o output.md
```

### Crawling (Multiple Pages)
```bash
# Crawl entire site
firecrawl crawl https://example.com

# Crawl with depth limit
firecrawl crawl https://example.com --max-depth 2

# Crawl with page limit
firecrawl crawl https://example.com --limit 50
```

### Search
```bash
# Search the web
firecrawl search "query here"

# Search with limit
firecrawl search "AI agents" --limit 10
```

### Extract Structured Data
```bash
# Extract with schema
firecrawl extract https://example.com --schema '{"title": "string", "price": "number"}'
```

### Generate llms.txt
```bash
# Generate LLM-friendly site description
firecrawl llmstxt https://example.com
```

## Use Cases

### For Field Agents (SMBs)
- **Competitor monitoring**: Crawl competitor sites for pricing, features
- **Lead enrichment**: Extract company data from websites
- **Content research**: Gather industry information
- **Website audits**: Check client sites for issues

### For Research
- **Data collection**: Scrape academic/research sites
- **Documentation**: Convert sites to markdown for RAG
- **Trend analysis**: Monitor news and industry sites

## Related Tools in This Directory

| Tool | Purpose |
|------|---------|
| `firecrawl-cli/` | Main CLI (installed globally) |
| `open-scouts/` | Web monitoring with alerts |
| `fire-enrich/` | Email → company data enrichment |
| `firecrawl-observer/` | Website change detection |
| `fireplexity/` | Perplexity-like search engine |
| `llmstxt-generator/` | Generate llms.txt files |

## Credits Usage
- Scrape: 1 credit per page
- Crawl: 1 credit per page
- Search: 1 credit per result
- Free tier: 500 credits (one-time)
- Hobby: 3,000/month ($16)
- Standard: 100,000/month ($83)
