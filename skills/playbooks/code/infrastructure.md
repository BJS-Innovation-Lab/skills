# Infraestructura y DevOps

## Skills to Use

| Skill | When |
|-------|------|
| `web_search` | Cloud docs, troubleshooting |
| `firecrawl` | Scrape provider documentation |
| `notion` | Runbooks, infrastructure docs |

---

## Common tools

- **Frontend hosting:** Vercel
- **Backend hosting:** Railway
- **CI/CD:** GitHub Actions
- **Monitoring:** Vercel Analytics, Railway logs

## Deployment checklist

Before deploying:
- [ ] All env vars documented (not just set)
- [ ] Rollback plan clear (one sentence)
- [ ] Who gets notified on failure?
- [ ] Preview deploy tested?

## Commands

```bash
# Railway CLI (if installed)
railway status
railway logs
railway up       # Deploy

# Vercel CLI (if installed)
vercel          # Preview deploy
vercel --prod   # Production deploy
```

## GitHub Actions basics

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
      - run: npm run build
```

## Rules

- Never commit secrets — use env vars
- Preview deploys for every PR
- Production only from main branch
- Tag releases with version
- No Friday afternoon deploys
- Rollbacks <5 minutes

## Testing priorities

1. Critical user paths (auth, checkout, main flow)
2. Recent bug fixes (regression tests)
3. Edge cases
4. Everything else

## Gotchas

- 100% coverage is vanity — 80% of right things > 100% of getters
- Tests must be independent (no shared state)
- Slow test suite = suite nobody runs
