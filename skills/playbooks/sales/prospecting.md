# Prospección

## Skills to Use

| Skill | When |
|-------|------|
| `web_search` / `web_fetch` | Quick research, news, LinkedIn |
| `firecrawl` | Deep website scraping, competitor sites |
| `lead-enrichment` | Email → company profile (Hunter, Apollo) |
| `goplaces` | Local business info, reviews, contact details |
| `google-official` (gog) | Gmail for outreach, Calendar for scheduling |
| `wacli` | WhatsApp outreach |

---

## Tools

```
web_search(query)     → Find companies, news, pain points
web_fetch(url)        → Get full page content
```

## Research before outreach

```python
# Find info about prospect
web_search("Empresa XYZ Monterrey")
web_search("Juan Pérez Director Comercial LinkedIn")
web_search("site:linkedin.com/in/ Juan Pérez XYZ")

# Find pain points
web_search("Empresa XYZ reseñas")
web_search("Empresa XYZ noticias 2026")
```

## One-page prospect brief

```markdown
# [Company Name]

**Contact:** [Name], [Title]
**Phone:** [if found]
**Email:** [if found]
**LinkedIn:** [URL]

## Company
- Industry: 
- Size: 
- Location:

## Recent news
- [Relevant item]

## Pain points (from reviews, news, job postings)
- [Pain point 1]
- [Pain point 2]

## Personalization hook
"Noté que [specific thing] — [how we can help]"
```

## Cold outreach sequence

| Touch | Timing | Channel | Content |
|-------|--------|---------|---------|
| 1 | Day 0 | Email | Value-first intro, one question |
| 2 | Day 3 | Email | Share relevant resource |
| 3 | Day 7 | LinkedIn | Connect + short note |
| 4 | Day 14 | Email | Break-up email |

## Gotchas

- Check CRM before outreach — has someone already contacted them?
- LinkedIn: connect request has character limit (~300)
- Real personalization: "Noté que abrieron segunda sucursal en Querétaro" > "Vi que hacen X"
- One channel at a time — don't pile on

## Trust tiers

| Action | Week 1-2 | Week 3+ |
|--------|----------|---------|
| Research | ✅ Auto | ✅ Auto |
| Draft outreach | ✅ Auto | ✅ Auto |
| Send outreach | ❓ Confirm all | ❓ Confirm first touch, auto follow-ups |
