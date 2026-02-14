---
name: vulkn-software-manager
description: HQ skill for provisioning full-stack infrastructure for new VULKN field agents. Creates GitHub repos, Supabase project, Vercel deploy, and Railway service — all via API. Sends individual keys to field agents via A2A.
metadata: {"openclaw":{"emoji":"🏭","requires":{"bins":["curl","gh","node"]}}}
---

# VULKN Software Manager

> **HQ creates the infra. Field agents receive their keys. No dashboards. No humans in the loop.**

## Overview

This skill is used by HQ agents (Santos, Sage) to provision full-stack infrastructure for a new client deployment. It creates everything the field agent needs to operate independently.

## What Gets Created Per Client

| # | Service | Resource | Purpose |
|---|---------|----------|---------|
| 1 | GitHub | `{client}-frontend` repo | Frontend source code |
| 2 | GitHub | `{client}-backend` repo | Backend source code |
| 3 | Supabase | 1 project | Database + Auth (shared by front & back) |
| 4 | Vercel | 1 project | Frontend deployment (linked to frontend repo) |
| 5 | Railway | 1 service | Backend deployment (linked to backend repo) |

## Architecture Per Client

```
GitHub: {client}-frontend ──→ Vercel (auto-deploy)
GitHub: {client}-backend  ──→ Railway (auto-deploy)
                                 │
                    Both connect to:
                                 │
                          Supabase: {client}
                          (DB + Auth + Storage)
```

## Required Org-Level Tokens

These tokens stay at HQ. **Never sent to field agents.**

| Service | Token Type | Scope | Where Stored |
|---------|-----------|-------|--------------|
| GitHub | Org App / PAT | `repo`, `workflow`, `admin:org` | `config/hq-tokens.json` |
| Supabase | Management Token | Create/manage all projects in org | `config/hq-tokens.json` |
| Vercel | Team Token | Create/manage all projects in team | `config/hq-tokens.json` |
| Railway | Team Token | Create/manage all projects in team | `config/hq-tokens.json` |

### Token Config: `config/hq-tokens.json`

```json
{
  "github": {
    "token": "ghp_...",
    "org": "BJS-Innovation-Lab"
  },
  "supabase": {
    "management_token": "sbp_...",
    "org_id": "your-supabase-org-id"
  },
  "vercel": {
    "token": "vercel_...",
    "team_id": "team_..."
  },
  "railway": {
    "token": "railway_...",
    "team_id": "team_..."
  }
}
```

## Execution Order

Must run in this order — each step depends on the previous.

### Step 1: GitHub (2 repos)
See `github/SKILL.md`
- Create `{client}-frontend` from frontend template
- Create `{client}-backend` from backend template
- Output: 2 repo URLs

### Step 2: Supabase (1 project)
See `supabase/SKILL.md`
- Create project under org
- Wait for ACTIVE_HEALTHY
- Retrieve `anon_key`, `service_role_key`, `project_url`
- Run initial migrations
- Output: DB credentials

### Step 3: Vercel (1 deploy)
See `vercel/SKILL.md`
- Create project linked to `{client}-frontend` repo
- Set env vars (Supabase URL, anon key)
- Trigger first deploy
- Output: deployment URL

### Step 4: Railway (1 service)
See `railway/SKILL.md`
- Create project linked to `{client}-backend` repo
- Set env vars (Supabase URL, service_role_key)
- Deploy
- Output: backend URL

### Step 5: Deliver Keys to Field Agent
Via A2A, send the field agent their `config/infra.json`:

```json
{
  "client_name": "{client}",
  "github": {
    "frontend_repo": "https://github.com/BJS-Innovation-Lab/{client}-frontend",
    "backend_repo": "https://github.com/BJS-Innovation-Lab/{client}-backend"
  },
  "supabase": {
    "project_url": "https://{project_id}.supabase.co",
    "anon_key": "eyJ...",
    "service_role_key": "eyJ..."
  },
  "vercel": {
    "project_url": "https://{client}.vercel.app",
    "project_id": "prj_..."
  },
  "railway": {
    "service_url": "https://{client}-backend.up.railway.app",
    "project_id": "..."
  }
}
```

## Security Rules

1. **Org tokens NEVER leave HQ** — not sent via A2A, not stored in field agent config
2. **Field agents only receive project-scoped keys** — they can only access THEIR resources
3. **All communication via A2A** — encrypted, logged, auditable
4. **Rollback on failure** — if any step fails, clean up everything created so far

## Rollback Procedure

If provisioning fails mid-way:
1. Delete Railway service (if created)
2. Delete Vercel project (if created)
3. Delete Supabase project (if created)
4. Delete GitHub repos (if created)
5. Notify requesting agent of failure with error details
