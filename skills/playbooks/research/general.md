# Investigación General

## Skills to Use

| Skill | When |
|-------|------|
| `web_search` / `web_fetch` | Quick searches, read pages |
| `firecrawl` | Deep crawl entire sites, documentation |
| `researcher` | Spawn for complex multi-source research |

---

## Tools

These are OpenClaw native tools (not CLI):

```
web_search(query, count=5)     → Search results with titles, URLs, snippets
web_fetch(url)                 → Full page content as markdown
```

## Search patterns

```python
# Basic search
web_search("mejores prácticas facturación electrónica México 2026")

# Site-specific
web_search("site:inegi.org.mx población Monterrey 2025")

# News/recent
web_search("tendencias ecommerce México 2026", freshness="pm")  # past month

# Exclude results
web_search("CRM pequeñas empresas -salesforce -hubspot")
```

## Mexico-specific sources

| Topic | Source | Search pattern |
|-------|--------|----------------|
| Demographics, economy | INEGI | `site:inegi.org.mx` |
| Consumer protection | Profeco | `site:profeco.gob.mx` |
| Official gazette | DOF | `site:dof.gob.mx` |
| Government services | gob.mx | `site:gob.mx` |
| Central bank / finance | Banxico | `site:banxico.org.mx` |
| Social indicators | CONEVAL | `site:coneval.org.mx` |

## Gotchas

- US sources rank higher — explicitly add "México" to queries
- Check article dates — 2023 "best practices" may be outdated
- INEGI data has lag (usually 6-12 months old)
- `web_fetch` may fail on paywalled sites — note when this happens

## Summarization

When asked to summarize:
1. Ask: "¿TL;DR, bullets, o resumen ejecutivo?"
2. Lead with "so what" — why should they care?
3. Target 10-20% of original length
4. For meetings: decisions + action items only
