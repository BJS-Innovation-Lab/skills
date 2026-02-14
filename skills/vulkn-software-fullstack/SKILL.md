---
name: vulkn-software-fullstack
description: Field agent skill for operating full-stack infrastructure. The agent understands it has credentials and operates Supabase, Vercel, GitHub, and Railway independently — no human intervention needed.
metadata: {"openclaw":{"emoji":"🛠️","requires":{"bins":["curl","git","npx"]}}}
---

# VULKN Software Fullstack

> **You have the keys. You run the show. Never ask a human to open a dashboard.**

## Overview

This skill is for field agents deployed to clients. HQ has already created your infrastructure via `vulkn-software-manager`. Your keys are in `config/infra.json`. You are self-sufficient.

## Your Infrastructure

When you were deployed, HQ created these for your client:

| Service | What You Have | What You Can Do |
|---------|--------------|-----------------|
| GitHub (frontend) | Repo access | Push code, create PRs, manage branches |
| GitHub (backend) | Repo access | Push code, create PRs, manage branches |
| Supabase | `anon_key` + `service_role_key` | Full DB access, auth config, storage |
| Vercel | `project_id` | Deploy frontend, manage env vars |
| Railway | `service_url` | Deploy backend, view logs |

## Your Config: `config/infra.json`

```json
{
  "client_name": "my-client",
  "github": {
    "frontend_repo": "https://github.com/BJS-Innovation-Lab/{client}-frontend",
    "backend_repo": "https://github.com/BJS-Innovation-Lab/{client}-backend"
  },
  "supabase": {
    "project_url": "https://{project_id}.supabase.co",
    "anon_key": "eyJ...",
    "service_role_key": "eyJ...",
    "db_password": "..."
  },
  "vercel": {
    "project_url": "https://{client}-frontend.vercel.app",
    "project_id": "prj_..."
  },
  "railway": {
    "service_url": "https://{client}-backend.up.railway.app",
    "project_id": "..."
  }
}
```

## First Boot Checklist

When you first receive your keys:
1. Save `config/infra.json`
2. Verify each service is reachable (see Health Checks below)
3. Report status to HQ via A2A
4. Begin operations

## How to Operate

### 📊 Supabase — Database & Auth

**Query data:**
```bash
curl -s "{project_url}/rest/v1/{table}?select=*" \
  -H "apikey: {anon_key}" \
  -H "Authorization: Bearer {service_role_key}"
```

**Insert data:**
```bash
curl -X POST "{project_url}/rest/v1/{table}" \
  -H "apikey: {anon_key}" \
  -H "Authorization: Bearer {service_role_key}" \
  -H "Content-Type: application/json" \
  -d '{"column": "value"}'
```

**Run migrations:**
```bash
cd {backend_repo}
npx supabase link --project-ref {project_id} --password {db_password}
npx supabase db push
```

**Create new migration:**
```bash
npx supabase migration new {migration_name}
# Edit the file in supabase/migrations/
npx supabase db push
```

### 🐙 GitHub — Code

**Push changes:**
```bash
cd {repo}
git add -A
git commit -m "description"
git push origin main
```

**Create a branch:**
```bash
git checkout -b feature/{name}
# make changes
git push origin feature/{name}
gh pr create --title "Feature: {name}" --body "Description"
```

### ▲ Vercel — Frontend Deploy

Pushing to the frontend repo auto-deploys. To check status:
```bash
# View latest deployments
curl -s "https://api.vercel.com/v6/deployments?projectId={project_id}&teamId={team_id}&limit=5" \
  -H "Authorization: Bearer {vercel_token}"
```

### 🚂 Railway — Backend Deploy

Pushing to the backend repo auto-deploys. To check logs:
```bash
# View via Railway CLI or API
# Logs are also available in the Railway dashboard
```

## Health Checks

Run these to verify everything is working:

```bash
# Supabase
curl -s -o /dev/null -w "%{http_code}" "{project_url}/rest/v1/" \
  -H "apikey: {anon_key}"
# → 200

# Vercel
curl -s -o /dev/null -w "%{http_code}" "{vercel_url}"
# → 200

# Railway
curl -s -o /dev/null -w "%{http_code}" "{railway_url}/health"
# → 200

# GitHub
gh repo view BJS-Innovation-Lab/{client}-frontend --json name
gh repo view BJS-Innovation-Lab/{client}-backend --json name
# → both return JSON
```

## Golden Rules

1. **Never ask a human to run SQL.** Use `npx supabase db push` with migration files.
2. **Never ask a human to open Supabase dashboard.** Use the REST API or CLI.
3. **Never ask a human to go to Vercel.** Push to GitHub = auto deploy.
4. **Never ask a human to configure Railway.** Use the API.
5. **If something breaks, fix it yourself or escalate to HQ via A2A.**
6. **If you need new tables, create a migration file and push it.**
7. **If you need new env vars, set them via API.**

## Escalation

If you can't fix something:
1. Gather error details (logs, status codes, what you tried)
2. Send to HQ CS agent (Santos) via A2A with type `task` and priority `high`
3. Include your `config/infra.json` client_name so HQ knows which client
