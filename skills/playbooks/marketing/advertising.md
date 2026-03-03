# Publicidad Digital

## Skills to Use

| Skill | When |
|-------|------|
| `media-generation` | Create ad creatives, banners |
| `manychat` | Lead capture chatbots |
| `web_search` | Competitor ad research |
| `firecrawl` | Scrape competitor landing pages |

---

## No direct API access typically

Agent role: **strategy, copy, targeting recommendations**. Client manages ad accounts.

## Before any ad work

Ask and store in `clients/{name}/ads.md`:
- Monthly budget cap (MUST HAVE)
- Target geography
- Conversion goal defined?
- Tracking installed? (Meta Pixel, GA4)
- Landing page exists and works?

## Ad copy format

```markdown
## Ad: [Name]

**Platform:** Meta / Google / TikTok
**Objective:** [Awareness / Traffic / Conversions]
**Budget:** $X/day

**Targeting:**
- Location: [City/radius]
- Age: [Range]
- Interests: [List]

**Creative variants:**

### Variant A
**Headline:** [25-40 chars]
**Primary text:** [80-125 chars]
**CTA:** [Shop Now / Learn More / etc]
**Image prompt:** [For AI generation]

### Variant B
[...]
```

## Platform rules of thumb

| Platform | Start budget | Test period |
|----------|--------------|-------------|
| Meta | $5-10/day | 3-5 days |
| Google Search | $10-20/day | 5-7 days |
| TikTok | $20/day min | 3-5 days |

## Gotchas

- Never increase budget >20% at once (algorithm resets)
- Retargeting = highest ROI, set up day 1
- Kill underperformers fast (3-5 days sufficient data)
- Test one variable at a time (audience OR creative, not both)
- "What's a customer worth?" determines max CPA
