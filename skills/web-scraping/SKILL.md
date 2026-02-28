# Web Scraping Skill (Firecrawl)

Turn any website into clean markdown or structured data. Use for research, competitor analysis, documentation, content extraction, or data collection.

## When to Use This Skill
- User asks to "scrape", "crawl", "extract", or "get data from" a website
- Need to convert a webpage to markdown
- Want to download an entire website
- Research that requires web content
- Competitor analysis from websites
- Documentation extraction
- Any task involving "website", "URL", "page", "site" + "content", "data", "text"

## Quick Commands

### Scrape Single Page
```bash
firecrawl scrape https://example.com
```

### Scrape to File
```bash
firecrawl scrape https://example.com -o output.md
```

### Crawl Multiple Pages
```bash
# Crawl with page limit
firecrawl crawl https://example.com --limit 50

# Crawl with depth limit
firecrawl crawl https://example.com --max-depth 2
```

### Search the Web
```bash
firecrawl search "your query here" --limit 10
```

### AI Agent Extraction
```bash
firecrawl agent "Extract all pricing information from example.com"
```

### Download Entire Site
```bash
firecrawl download https://docs.example.com
```

## Output Formats
- `--format markdown` (default) - Clean markdown
- `--format html` - Raw HTML
- `--format text` - Plain text

## Examples

### Research Task
```bash
# Search for topic
firecrawl search "AI agents for small business" --limit 5

# Scrape relevant pages
firecrawl scrape https://relevant-article.com -o research.md
```

### Competitor Analysis
```bash
# Scrape competitor pricing
firecrawl scrape https://competitor.com/pricing -o competitor-pricing.md

# Extract structured data
firecrawl agent "Extract pricing tiers, features, and limits from competitor.com"
```

### Documentation Collection
```bash
# Crawl entire docs site
firecrawl crawl https://docs.example.com --limit 100

# Output goes to .firecrawl/ directory
```

## Check Status
```bash
firecrawl --status  # Shows credits, auth status
```

## Credits
- 1 credit per page scraped
- Current balance: check with `firecrawl --status`
