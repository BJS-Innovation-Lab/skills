---
name: infra-bootstrap-basic
description: Self-provisioning skill for field agents. Automatically creates and configures Supabase, Vercel, and GitHub infrastructure without human intervention. Requires macOS.
metadata: {"openclaw":{"emoji":"⚡","requires":{"os":"darwin","bins":["curl","git","node","npx"]}}}
---

# Infra Bootstrap Basic

> **The agent provisions its own infrastructure. No dashboards. No SQL. No hand-holding.**

## Overview

This is the basic infrastructure bootstrapping skill. When a new field agent is deployed, it uses this skill to automatically set up:

1. **GitHub** — Create repo from template, configure secrets, push initial code
2. **Supabase** — Create project, run migrations, configure RLS, set up auth
3. **Vercel** — Create project, link to GitHub repo, set env vars, deploy

The agent has the credentials. The agent does the work. No human needs to open a dashboard.

## Requirements

- **macOS** (required — all agents run on Mac)
- `git` CLI installed
- `node` / `npx` installed
- Supabase CLI (`npx supabase`)
- Vercel CLI (`npx vercel`)
- GitHub CLI (`gh`)

## Sub-Skills

| Skill | Purpose | Order |
|-------|---------|-------|
| `github/` | Create repo, configure secrets, branch protection | 1st |
| `supabase/` | Create project, run migrations, configure auth + RLS | 2nd |
| `vercel/` | Create project, link repo, set env vars, deploy | 3rd |

## Execution Order

GitHub first (repo is the foundation), then Supabase (backend), then Vercel (frontend deployment linked to both).

```
github/  →  supabase/  →  vercel/
(repo)      (backend)     (deploy)
   └──────────┴──────────────┘
         All secrets stored in
         config/infra.json
```

## Configuration

See `CONFIG.md` for all required credentials and values.

The agent reads `config/infra.json` from its workspace. This file contains all tokens and project settings. **The agent owns these credentials and uses them directly — never asks a human to run commands.**

## Key Principle

> **Self-sufficient by design.** The agent understands it has full access to modify infrastructure. It does not ask humans to:
> - Run SQL queries
> - Open the Supabase dashboard
> - Go to Vercel settings
> - Manually configure anything
>
> If it can be done via CLI or API, the agent does it itself.

## Post-Bootstrap

After all three sub-skills complete:
1. Save all project URLs and IDs to `config/infra.json`
2. Run a health check — verify GitHub repo accessible, Supabase API responding, Vercel deployment live
3. Log results to `memory/infra-bootstrap.md`
4. Report status to HQ via A2A
