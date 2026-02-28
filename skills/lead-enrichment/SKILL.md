# Lead Enrichment Skill (Fire Enrich)

Turn email addresses into rich company profiles. Get funding data, tech stacks, employee counts, and more from just an email. Perfect for sales prospecting, lead qualification, and CRM enrichment.

## When to Use This Skill
- User has an email and wants company information
- Sales prospecting or lead research
- "Who is this company?" from an email
- CRM data enrichment
- Lead qualification and scoring
- Prospect research before outreach
- Finding company details: funding, size, tech stack, industry
- Keywords: "lead", "prospect", "company info", "enrich", "email lookup", "sales research", "who is", "company profile"

## What It Returns
From just an email address, get:
- **Company name and description**
- **Industry and sector**
- **Employee count**
- **Funding information** (rounds, amounts, investors)
- **Tech stack** (what tools they use)
- **Social profiles** (LinkedIn, Twitter)
- **Contact information**
- **Location and headquarters**

## Setup

### Prerequisites
```bash
cd ~/.openclaw/workspace/tools/firecrawl/fire-enrich
npm install
```

### Configuration
Create `.env` with:
```
FIRECRAWL_API_KEY=your-key
OPENAI_API_KEY=your-key  # For AI enrichment
```

## Usage

### Single Email Enrichment
```bash
cd ~/.openclaw/workspace/tools/firecrawl/fire-enrich
npm run enrich -- --email "john@company.com"
```

### Batch Enrichment (CSV)
```bash
npm run enrich -- --file leads.csv --output enriched.csv
```

### Quick Web Lookup (Alternative)
If fire-enrich isn't set up, use firecrawl directly:
```bash
# Find company website from email domain
firecrawl search "company.com about" --limit 3

# Scrape company page
firecrawl scrape https://company.com/about -o company-info.md

# AI extraction
firecrawl agent "Find company size, funding, and key info from company.com"
```

## Example Output

Input: `sarah@acmecorp.com`

Output:
```json
{
  "company": "Acme Corp",
  "industry": "SaaS / Enterprise Software",
  "employees": "50-200",
  "funding": {
    "total": "$15M",
    "last_round": "Series A",
    "investors": ["VC Fund A", "Angel Investor B"]
  },
  "tech_stack": ["React", "AWS", "Salesforce"],
  "linkedin": "linkedin.com/company/acmecorp",
  "headquarters": "San Francisco, CA"
}
```

## Integration with CRM

### Export to CSV
```bash
npm run enrich -- --file leads.csv --output enriched.csv --format csv
```

### JSON for API Integration
```bash
npm run enrich -- --email "john@company.com" --format json
```

## For Field Agents (Saber)
Use this skill when:
1. A prospect emails and you need background
2. Qualifying leads before follow-up
3. Preparing for sales calls
4. Building target account lists
5. Enriching CRM data

## Source
Tool: `~/.openclaw/workspace/tools/firecrawl/fire-enrich/`
Repo: https://github.com/firecrawl/fire-enrich
