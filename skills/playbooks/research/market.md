# Investigación de Mercado

## Skills to Use

| Skill | When |
|-------|------|
| `web_search` / `web_fetch` | Market trends, news, reports |
| `firecrawl` | Scrape competitor sites, pricing pages |
| `goplaces` | Local competitor info, reviews |
| `researcher` | Spawn for comprehensive market analysis |

---

## Tools

```
web_search(query)   → Find competitors, market data
web_fetch(url)      → Get full page content
```

## Market sizing (TAM/SAM/SOM)

```markdown
## [Industry] en [Geography]

**TAM (Total):** $X-Y millones
- Source: [INEGI/report]

**SAM (Serviceable):** $X-Y millones  
- [Your segment definition]

**SOM (Obtainable):** $X-Y millones
- [Realistic capture in 1-2 years]
```

Present as ranges, not precise figures.

## Competitive analysis

```markdown
## Competidor: [Name]

**Website:** [URL]
**Pricing:** [What they charge]
**Strengths:** 
- [Strength 1]
**Weaknesses:**
- [From reviews, job postings]
**Positioning:** [How they describe themselves]

### Reviews sentiment
- [Common praise]
- [Common complaints]
```

## Mexico sources

| Data type | Source |
|-----------|--------|
| Demographics | INEGI |
| Consumer complaints | Profeco |
| Financial data | Banxico |
| Social indicators | CONEVAL |
| Business registry | SIEM |

## Gotchas

- US data ranks higher — explicitly add "México" to queries
- INEGI data has 6-12 month lag
- "Not on Google Maps" ≠ "doesn't exist" — many Mexican SMBs aren't listed
- Always ground-truth: "¿Esto coincide con lo que ves en la calle?"
