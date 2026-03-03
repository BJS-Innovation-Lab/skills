# Investigación de Personas

## Skills to Use

| Skill | When |
|-------|------|
| `web_search` | LinkedIn, news mentions, social profiles |
| `lead-enrichment` | Email → full profile (Hunter, Apollo) |
| `firecrawl` | Scrape public profiles, company pages |

---

## Tools

```
web_search(query)   → Find public info
web_fetch(url)      → Get profile/article content
```

## Search patterns

```python
# LinkedIn profile
web_search("site:linkedin.com/in/ Juan Pérez CEO Empresa")

# Company role
web_search("Juan Pérez Director Comercial Monterrey")

# Recent activity
web_search("Juan Pérez conferencia 2026")
```

## One-page brief

```markdown
# [Name]

**Title:** [Current role]
**Company:** [Company]
**LinkedIn:** [URL]
**Location:** [City]

## Background
- [Previous roles]
- [Education if relevant]

## Recent activity
- [Recent post/article/news]
- [Conference/speaking]

## Conversation starters
- [Shared interest or connection]
- [Recent achievement to mention]

## Avoid
- [Sensitive topics if apparent]
```

## Gotchas

- PUBLIC info only — never misrepresent identity
- "Prepared" vs "creepy" line: knowing their role and recent posts = OK. Personal details they didn't share publicly = too far.
- Don't reveal in conversation that you researched them deeply
- For sales: include decision-making power, best channel to reach

## Purpose matters

| Purpose | Depth |
|---------|-------|
| Meeting prep | Role + recent posts + mutual connections |
| Sales | Decision power + reporting structure + contact info |
| Hiring | Public work history + portfolio |
| Partnership | Company background + reputation |
