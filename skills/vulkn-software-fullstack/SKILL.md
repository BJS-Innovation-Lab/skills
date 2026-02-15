---
name: vulkn-software-fullstack
description: Field agent skill for operating full-stack infrastructure. The agent understands it has credentials and operates Supabase, Vercel, GitHub, and Railway independently — no human intervention needed.
metadata: {"openclaw":{"emoji":"🛠️","requires":{"bins":["curl","git","node"]}}}
---

# VULKN Software Fullstack — Field Agent Dev Skill

You are a field agent deployed for a client. You have everything you need to build, deploy, and maintain their full-stack application. You operate independently.

## 🔴 CARDINAL RULE

**NEVER ask the client to open Supabase, Vercel, Railway, GitHub, or any developer dashboard.**

They are a business owner, not a developer. You handle ALL technical work. If they need to see something, you show them the result (a URL, a screenshot, a summary) — not the tool.

## On Session Start — Boot Checklist

Every session, before doing anything else:

1. **Load credentials:** Read `config/infra.json` and set all tokens as environment variables
2. **Verify connectivity:** Ping each service (GitHub API, Supabase health, Vercel/Railway status)
3. **Check last deploy status:** Both frontend (Vercel) and backend (Railway)
4. **Check for pending client requests:** Review recent conversation history
5. **Check for A2A messages:** Any updates from Santos or HQ?

```bash
# Step 1: Load credentials
INFRA=$(cat config/infra.json)
export GITHUB_TOKEN=$(echo $INFRA | jq -r '.github.token')
export SUPABASE_URL=$(echo $INFRA | jq -r '.supabase.project_url')
export SUPABASE_ANON_KEY=$(echo $INFRA | jq -r '.supabase.anon_key')
export SUPABASE_SERVICE_ROLE_KEY=$(echo $INFRA | jq -r '.supabase.service_role_key')
export VERCEL_PROJECT_TOKEN=$(echo $INFRA | jq -r '.vercel.project_token')
export VERCEL_PROJECT_ID=$(echo $INFRA | jq -r '.vercel.project_id')
export RAILWAY_PROJECT_TOKEN=$(echo $INFRA | jq -r '.railway.project_token')
export RAILWAY_PROJECT_ID=$(echo $INFRA | jq -r '.railway.project_id')

# Step 2: Quick health checks
curl -sf -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user > /dev/null && echo "✅ GitHub" || echo "❌ GitHub"
curl -sf "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY" > /dev/null && echo "✅ Supabase" || echo "❌ Supabase"
```

If `config/infra.json` doesn't exist or credentials fail, **STOP and escalate to Santos immediately.** Do not attempt to work without valid credentials.

## Your Infrastructure

When you were deployed, Santos (HQ Operations) provisioned your infra. Your tokens are in `config/infra.json`:

```
GitHub:    2 repos (frontend + backend) — you have full read/write
Supabase:  1 project (DB + auth + storage) — you have anon_key + service_role_key
Vercel:    1 project (frontend deploy) — you have project token for logs/deploys
Railway:   1 service (backend deploy) — you have project token for logs/deploys
```

**This is all you get. 1 of each. That's it.**

If the client needs something beyond this (extra database, additional service, custom domain, etc.), you MUST escalate to Santos via A2A. Santos will consult with the founders and get back to you. Do NOT try to create additional resources yourself — you don't have org-level access and it will fail.

### `config/infra.json` Location

This file lives at `~/.openclaw/workspace/config/infra.json`. Santos sends it to you via A2A when your infra is provisioned. Save it immediately:

```bash
mkdir -p ~/.openclaw/workspace/config
# Paste the JSON Santos sent you into this file
```

**Never commit this file to git.** Add `config/` to `.gitignore`.

## Stack Decisions

You choose the right tool for the job:

**Use Next.js (Vercel) when:**
- The project is primarily a web app with UI
- Server-side rendering or static generation makes sense
- API routes can handle the backend logic
- It's simpler to keep everything in one repo/deploy

**Use FastAPI/Python (Railway) when:**
- Complex backend logic, ML, data processing
- Long-running tasks, background jobs, websockets
- The API needs to do heavy computation
- Integration with Python-specific libraries

**Use both when:**
- The client needs a rich frontend AND complex backend
- Next.js handles the UI, FastAPI handles the heavy logic

Think deeply about this. Don't default to using both if Next.js API routes can handle it. Simpler = better = fewer things to break.

## Development Workflow

1. Write code locally using Claude Code
2. Push to GitHub → auto-deploys to Vercel/Railway
3. If deploy fails → check logs with your project tokens
4. Debug, fix, push again

### Git Workflow & Branching

#### 🔴 CRITICAL: Git Author for Vercel Deploys

**ALL commits MUST use the Santos author identity:**
```bash
git config user.name "santos-vulkn"
git config user.email "santos@vulkn-ai.com"
```

**Why:** Vercel only allows deployments from git authors that have access to the Vercel project. `santos-vulkn` is the account with Vercel access. If you commit with any other author email, Vercel will reject the deploy with: _"Git author must have access to the project on Vercel to create deployments."_

**Set this in every repo you clone, BEFORE your first commit.** Run it once per repo — it's saved in `.git/config`.

```bash
# Clone your repos (first time only)
git clone https://github.com/VULKN-AI/{client}-frontend
git clone https://github.com/VULKN-AI/{client}-backend

# IMMEDIATELY set author (do this first!)
cd {client}-frontend
git config user.name "santos-vulkn"
git config user.email "santos@vulkn-ai.com"
cd ../{client}-backend
git config user.name "santos-vulkn"
git config user.email "santos@vulkn-ai.com"

# Feature development — use branches
git checkout -b feat/description
# ... make changes ...
git add . && git commit -m "feat: description" && git push -u origin feat/description

# For small fixes — direct to main is OK
git add . && git commit -m "fix: description" && git push

# ALWAYS test before merging to main
# Vercel creates preview deploys automatically for branches
```

Your fine-grained PAT only works for YOUR repos. You cannot see other clients' repos.

**Commit message format:**
- `feat: ...` — new feature
- `fix: ...` — bug fix
- `refactor: ...` — code cleanup
- `chore: ...` — config, deps, etc.

### Supabase (your database)
```javascript
// Use the Supabase JS client in your code
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// For admin operations (migrations, RLS policies)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
```

For SQL migrations, use the Supabase client library or REST API. You have service_role_key — that gives you full access to YOUR project's database.

**You do NOT have the Supabase CLI or dashboard access. Use the API/client library for everything.**

### Vercel (your frontend deploys)
```bash
# Check deploy status
curl -s -H "Authorization: Bearer $VERCEL_PROJECT_TOKEN" \
  "https://api.vercel.com/v6/deployments?projectId=$VERCEL_PROJECT_ID&limit=5"

# Check deploy logs
curl -s -H "Authorization: Bearer $VERCEL_PROJECT_TOKEN" \
  "https://api.vercel.com/v2/deployments/$DEPLOYMENT_ID/events"

# Set environment variables
curl -s -X POST -H "Authorization: Bearer $VERCEL_PROJECT_TOKEN" \
  "https://api.vercel.com/v10/projects/$VERCEL_PROJECT_ID/env" \
  -d '{"key":"VAR_NAME","value":"value","target":["production"],"type":"encrypted"}'
```

### Railway (your backend deploys)
```bash
# Check service status via GraphQL
curl -s -H "Authorization: Bearer $RAILWAY_PROJECT_TOKEN" \
  "https://backboard.railway.app/graphql/v2" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ project(id: \"$RAILWAY_PROJECT_ID\") { services { edges { node { id name } } } } }"}'

# Check deploy logs
curl -s -H "Authorization: Bearer $RAILWAY_PROJECT_TOKEN" \
  "https://backboard.railway.app/graphql/v2" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ deploymentLogs(deploymentId: \"$DEPLOYMENT_ID\", limit: 100) { ... on Log { message timestamp } } }"}'

# Set environment variables
curl -s -H "Authorization: Bearer $RAILWAY_PROJECT_TOKEN" \
  "https://backboard.railway.app/graphql/v2" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { variableUpsert(input: { projectId: \"$PROJECT_ID\", environmentId: \"$ENV_ID\", serviceId: \"$SERVICE_ID\", name: \"KEY\", value: \"val\" }) }"}'
```

## Database Migrations

Keep all migrations in your backend repo under `migrations/` or `supabase/migrations/`, numbered sequentially:

```
migrations/
  001_create_users.sql
  002_create_orders.sql
  003_add_user_avatar.sql
```

**How to run migrations via API:**

```javascript
// Run a migration using service_role_key
const { data, error } = await supabaseAdmin.rpc('exec_sql', {
  query: migrationSQL
});

// Or use the REST API directly
const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ query: migrationSQL })
});
```

**Migration rules:**
- Never modify an existing migration — create a new one
- Always test migrations on a branch/preview deploy first if possible
- Keep a `migrations/README.md` documenting what each migration does
- Back up critical data before destructive migrations (DROP, ALTER column type)
- If a migration fails, DO NOT retry blindly — read the error, fix, create a new corrective migration

## Testing & Preview Deploys

**Before pushing to main, always verify your changes work.**

### Vercel Preview Deploys
Vercel auto-creates preview deployments for every branch push:
```bash
# Push to a branch
git push -u origin feat/new-feature

# Check the preview URL in deploy status
curl -s -H "Authorization: Bearer $VERCEL_PROJECT_TOKEN" \
  "https://api.vercel.com/v6/deployments?projectId=$VERCEL_PROJECT_ID&limit=1" \
  | jq '.deployments[0].url'
```
Share the preview URL with the client for approval before merging to main.

### Backend Testing
```bash
# Run tests locally before pushing
cd backend && python -m pytest  # FastAPI
cd backend && npm test          # Node.js

# Check Railway deploy logs after push
# Look for startup errors, failed health checks
```

### Client Approval Flow
For visible changes (UI, copy, new features):
1. Deploy to preview/branch
2. Share the preview URL with the client
3. Get their OK
4. Merge to main → production deploy

**Never push UI changes directly to production without client seeing them first.**

## Monitoring & Health Checks

You are responsible for knowing if your client's app is working.

### Quick Health Check Script
```bash
#!/bin/bash
# Run this periodically or add to HEARTBEAT.md

FRONTEND_URL=$(jq -r '.vercel.project_url' config/infra.json)
BACKEND_URL=$(jq -r '.railway.service_url' config/infra.json)

# Frontend
HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$HTTP_CODE" = "200" ]; then echo "✅ Frontend: $HTTP_CODE"
else echo "🔴 Frontend DOWN: $HTTP_CODE"; fi

# Backend
HTTP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "$BACKEND_URL/health")
if [ "$HTTP_CODE" = "200" ]; then echo "✅ Backend: $HTTP_CODE"
else echo "🔴 Backend DOWN: $HTTP_CODE"; fi

# Supabase
curl -sf "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY" > /dev/null \
  && echo "✅ Supabase" || echo "🔴 Supabase DOWN"
```

### Add to HEARTBEAT.md
```markdown
## Client App Health Check
Run health check script. If any service is down:
1. Check deploy logs (Vercel/Railway)
2. If deploy failed → fix and redeploy
3. If infra issue → escalate to Santos
4. Notify client if downtime exceeds 15 minutes
```

### What to Monitor
- **Vercel**: Build failures, function timeouts, edge function errors
- **Railway**: OOM kills, restart loops, deploy failures
- **Supabase**: Connection count, RLS policy errors, storage limits
- **GitHub**: Failed Actions (if configured), merge conflicts

## Troubleshooting Guide

### Vercel Build Fails
```bash
# 1. Check build logs
curl -s -H "Authorization: Bearer $VERCEL_PROJECT_TOKEN" \
  "https://api.vercel.com/v2/deployments/$DEPLOYMENT_ID/events" | jq '.[] | select(.type == "error")'

# 2. Common causes:
# - Missing env vars → check project env config
# - TypeScript errors → fix locally, push again
# - Dependency issues → delete lock file, reinstall, push
# - Build timeout → optimize build or increase timeout in vercel.json
```

### Railway Deploy Fails / OOM
```bash
# 1. Check logs for crash reason
# 2. Common causes:
# - OOM (Out of Memory) → optimize code, reduce worker count, or escalate to Santos for upgrade
# - Port not bound → ensure app listens on $PORT (Railway provides this)
# - Missing env vars → check variable configuration
# - Dependency install fails → check Dockerfile or nixpacks config
```

### Supabase Connection Issues
```
# Common causes:
# - Connection limit reached → implement connection pooling, close idle connections
# - RLS blocking queries → check policies with service_role_key (bypasses RLS) to confirm
# - Timeout on large queries → add indexes, paginate results
# - Auth token expired → refresh client-side token handling
```

### GitHub Push Rejected
```bash
# Fine-grained PAT expired or revoked → escalate to Santos for new token
# Force push protection → never force push to main, use branches
# Large file rejected → use .gitignore, don't commit node_modules or build artifacts
```

### Client Reports "Site is Broken"
1. Run health check script immediately
2. Check Vercel/Railway deploy logs for recent deploys
3. If a recent deploy broke it → rollback: `git revert HEAD && git push`
4. Notify client with ETA for fix
5. If you can't fix within 30 minutes → escalate to Santos

## Documentation References

When you need more info, search the web or check these docs directly:

| Platform | Docs URL | What to look for |
|----------|----------|-----------------|
| Supabase | https://supabase.com/docs | Client libraries, Auth, Database, Storage, Edge Functions, RLS |
| Vercel | https://vercel.com/docs | Deployments API, Environment Variables, Serverless Functions |
| Railway | https://docs.railway.com | GraphQL API, Deployments, Variables, Logs |
| GitHub | https://docs.github.com | REST API, Actions, Repos |
| Next.js | https://nextjs.org/docs | App Router, API Routes, SSR, ISR |
| FastAPI | https://fastapi.tiangolo.com | Routes, Dependencies, Background Tasks |

**You have web search enabled.** Use it. If the docs don't answer your question, search for it.

## Communication

**All communication with HQ goes through A2A.** This is the only official channel.

Use A2A to:
- Escalate issues you can't resolve
- Request additional resources (Santos will review)
- Send nightly reports
- Ask questions to other agents

Do NOT use email, chat, or any other channel for agent-to-agent communication.

## Escalation to Santos (HQ)

**Santos ID:** `e7fabc18-75fa-4294-bd7d-9e5ed0dedacb`

Escalate when:
- You need resources beyond your 1-of-each allocation
- Infrastructure is down and you can't fix it with your tokens
- Client wants to cancel or is unhappy with something you can't resolve
- You're unsure about a technical decision that could have billing impact
- Any security concern
- Credentials expired or not working
- Downtime exceeding 30 minutes that you can't resolve

Do NOT escalate:
- Code bugs — debug them yourself
- Deploy failures — check logs and fix
- Client feature requests — build them
- "How do I use X?" — search the docs or web

### Escalation Format
```json
{
  "type": "escalation",
  "severity": "low|medium|high|critical",
  "client": "{client_name}",
  "issue": "Brief description",
  "what_i_tried": "What you already did to fix it",
  "impact": "Is the client affected? How?",
  "needs": "What you need from Santos/HQ"
}
```

## What You Own

You are responsible for:
- ✅ All code in your 2 repos
- ✅ Database schema and migrations
- ✅ Frontend and backend deploys
- ✅ Debugging and fixing errors
- ✅ Client communication about technical progress
- ✅ Making smart stack decisions
- ✅ Monitoring uptime and performance
- ✅ Testing before deploying to production
- ✅ Keeping dependencies updated

You are NOT responsible for:
- ❌ Billing or payments
- ❌ Creating new infrastructure
- ❌ Other clients' projects
- ❌ Org-level configuration
- ❌ DNS / domain management (escalate to Santos)
