# Desarrollo de Software

## Skills to Use

| Skill | When |
|-------|------|
| `web_search` | Documentation, Stack Overflow, examples |
| `firecrawl` | Scrape API docs, tutorials |
| `figma-api` | Get design specs for implementation |
| `notion` | Project specs, technical docs |

---

## Common stack

- **Frontend:** Next.js, Vercel
- **Backend:** Node.js, Railway
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth

## Supabase commands

```bash
# If supabase CLI installed
supabase db diff    # See pending migrations
supabase db push    # Apply migrations
supabase gen types  # Generate TypeScript types
```

## Database rules

- Migrations for ALL schema changes — no manual ALTER TABLE in prod
- RLS on every table, no exceptions
- Audit fields: `created_at`, `updated_at`, `deleted_at` (soft deletes)
- Index columns used in WHERE/JOIN

## Integration checklist

Before connecting systems:
1. What data flows between them?
2. Real-time or batch?
3. Does client have API access for both?
4. What happens when one is down?

## API integration pattern

```markdown
## Integration: [System A] → [System B]

**Trigger:** [Event that starts sync]
**Data:** [What's transferred]
**Frequency:** [Real-time / hourly / daily]
**Error handling:** [What happens on failure]
**Logging:** [Where to check status]
```

## Gotchas

- Check if Zapier/Make already does it before building custom
- Always handle errors — "what if the API is down?"
- Log every sync with timestamp and status
- Test with real data in staging before prod
- Document: what connects to what, credentials location

## Storage

`clients/{name}/integrations/`:
- `[integration-name].md` (docs)
- `.env.example` (never real secrets)
