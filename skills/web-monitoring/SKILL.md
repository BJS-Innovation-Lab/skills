# Web Monitoring Skill (Open Scouts)

Monitor websites for changes and get email alerts. Track competitor pricing, news mentions, product updates, or any web content that matters to your business.

## When to Use This Skill
- "Watch this website for changes"
- "Alert me when competitor updates pricing"
- "Monitor news for mentions of X"
- "Track when this page changes"
- Competitor monitoring and intelligence
- Brand mention tracking
- Price monitoring
- News and industry alerts
- Keywords: "monitor", "watch", "track", "alert", "notify", "changes", "updates", "competitor", "news"

## What It Does
- **Scheduled checks** - Monitor URLs on a schedule
- **Change detection** - Detect when content changes
- **Email alerts** - Get notified immediately
- **Search monitoring** - Track search results for keywords
- **Custom filters** - Only alert on specific changes

## Setup

### Install
```bash
cd ~/.openclaw/workspace/tools/firecrawl/open-scouts
npm install
cp .env.example .env
```

### Configure `.env`
```
FIRECRAWL_API_KEY=your-key
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email
SMTP_PASS=your-app-password
ALERT_EMAIL=where-to-send@email.com
```

### Run
```bash
npm run dev  # Development
npm run start  # Production
```

## Usage Examples

### Monitor Competitor Pricing
```javascript
// Add a scout for competitor pricing page
{
  "name": "Competitor Pricing",
  "url": "https://competitor.com/pricing",
  "schedule": "0 9 * * *",  // Daily at 9am
  "alert_on": "any_change",
  "email": "team@company.com"
}
```

### Track News Mentions
```javascript
{
  "name": "Brand Mentions",
  "type": "search",
  "query": "YourCompany news",
  "schedule": "0 */4 * * *",  // Every 4 hours
  "alert_on": "new_results"
}
```

### Monitor Product Page
```javascript
{
  "name": "Competitor Product",
  "url": "https://competitor.com/product",
  "schedule": "0 8 * * 1",  // Every Monday 8am
  "alert_on": "content_change",
  "ignore": ["footer", "ads"]
}
```

## Alternative: Quick Change Detection

If Open Scouts isn't set up, use firecrawl-observer:
```bash
cd ~/.openclaw/workspace/tools/firecrawl/firecrawl-observer
npm install
npm run check -- --url https://example.com
```

Or manual approach with cron:
```bash
# Scrape and save
firecrawl scrape https://example.com -o page-$(date +%Y%m%d).md

# Compare with previous version
diff page-yesterday.md page-today.md
```

## For Field Agents
Use this to help clients:
1. **Track competitors** - Know when they change pricing/features
2. **Monitor reviews** - Alert on new reviews/mentions
3. **Watch regulations** - Track government/industry pages
4. **Price tracking** - Monitor supplier/market prices

## Cron Integration
Add monitoring jobs via OpenClaw cron:
```javascript
{
  "name": "Daily Competitor Check",
  "schedule": { "kind": "cron", "expr": "0 9 * * *" },
  "payload": {
    "kind": "systemEvent",
    "text": "Check competitor.com/pricing for changes and summarize any differences"
  }
}
```

## Source
Tool: `~/.openclaw/workspace/tools/firecrawl/open-scouts/`
Repo: https://github.com/firecrawl/open-scouts
