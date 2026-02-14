---
name: github-provision
description: Create frontend and backend repos from templates for a new client. Step 1 of vulkn-software-manager.
metadata: {"openclaw":{"emoji":"🐙"}}
---

# GitHub Provision

> **Step 1: Create the two repos. Everything else builds on these.**

## What Gets Created

| Repo | Template | Deploys To |
|------|----------|-----------|
| `{client}-frontend` | `BJS-Innovation-Lab/vulkn-frontend-template` | Vercel |
| `{client}-backend` | `BJS-Innovation-Lab/vulkn-backend-template` | Railway |

## Procedure

### 1. Create Frontend Repo
```bash
gh repo create BJS-Innovation-Lab/{client}-frontend \
  --template BJS-Innovation-Lab/vulkn-frontend-template \
  --private \
  --clone
```

### 2. Create Backend Repo
```bash
gh repo create BJS-Innovation-Lab/{client}-backend \
  --template BJS-Innovation-Lab/vulkn-backend-template \
  --private \
  --clone
```

### 3. Configure Both Repos
```bash
# For each repo:
gh repo edit BJS-Innovation-Lab/{client}-{type} \
  --description "VULKN field agent - {client_name} ({type})" \
  --add-topic vulkn,field-agent,{type}
```

### 4. Set GitHub Secrets (after Supabase + Vercel + Railway are created)
```bash
# Frontend repo secrets
gh secret set NEXT_PUBLIC_SUPABASE_URL --repo BJS-Innovation-Lab/{client}-frontend --body "{supabase_url}"
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --repo BJS-Innovation-Lab/{client}-frontend --body "{anon_key}"

# Backend repo secrets
gh secret set SUPABASE_URL --repo BJS-Innovation-Lab/{client}-backend --body "{supabase_url}"
gh secret set SUPABASE_SERVICE_ROLE_KEY --repo BJS-Innovation-Lab/{client}-backend --body "{service_role_key}"
```

## Outputs

```json
{
  "frontend_repo": "https://github.com/BJS-Innovation-Lab/{client}-frontend",
  "backend_repo": "https://github.com/BJS-Innovation-Lab/{client}-backend",
  "frontend_clone": "git@github.com:BJS-Innovation-Lab/{client}-frontend.git",
  "backend_clone": "git@github.com:BJS-Innovation-Lab/{client}-backend.git"
}
```

## Verification
```bash
gh repo view BJS-Innovation-Lab/{client}-frontend --json name,url,isPrivate
gh repo view BJS-Innovation-Lab/{client}-backend --json name,url,isPrivate
```

## Rollback
```bash
gh repo delete BJS-Innovation-Lab/{client}-frontend --yes
gh repo delete BJS-Innovation-Lab/{client}-backend --yes
```
