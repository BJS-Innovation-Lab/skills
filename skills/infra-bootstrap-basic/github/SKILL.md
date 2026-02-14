---
name: github-bootstrap
description: Create and configure a GitHub repository from template for a new field agent deployment. Step 1 of infra-bootstrap-basic.
metadata: {"openclaw":{"emoji":"🐙","requires":{"os":"darwin","bins":["gh","git"]}}}
---

# GitHub Bootstrap

> **Step 1: Create the repo. Everything else builds on this.**

## Prerequisites

- `gh` CLI authenticated (`gh auth status`)
- GitHub token in `config/infra.json`
- Template repo exists: `BJS-Innovation-Lab/field-agent-template`

## What This Skill Does

### 1. Create Repo from Template
```bash
gh repo create {org}/{project_name} \
  --template {template_repo} \
  --private \
  --clone
```

### 2. Configure Repository Settings
```bash
# Branch protection on main
gh api repos/{org}/{project_name}/branches/main/protection \
  -X PUT \
  -f required_status_checks='{"strict":true,"contexts":[]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"required_approving_review_count":0}'

# Set repo description
gh repo edit {org}/{project_name} \
  --description "VULKN field agent - {client_name}" \
  --add-topic vulkn,field-agent
```

### 3. Store Secrets in GitHub (for CI/CD)
```bash
# Supabase secrets (after supabase/ sub-skill runs)
gh secret set SUPABASE_URL --repo {org}/{project_name} --body "{supabase_url}"
gh secret set SUPABASE_ANON_KEY --repo {org}/{project_name} --body "{anon_key}"
gh secret set SUPABASE_SERVICE_ROLE_KEY --repo {org}/{project_name} --body "{service_role_key}"

# Vercel secrets (after vercel/ sub-skill runs)
gh secret set VERCEL_TOKEN --repo {org}/{project_name} --body "{vercel_token}"
gh secret set VERCEL_PROJECT_ID --repo {org}/{project_name} --body "{vercel_project_id}"
```

### 4. Initial Commit
```bash
cd {project_name}
git add -A
git commit -m "🚀 Initial setup for {client_name}"
git push origin main
```

## Outputs

After completion, update `config/infra.json`:
```json
{
  "github": {
    "repo_url": "https://github.com/{org}/{project_name}",
    "clone_url": "git@github.com:{org}/{project_name}.git",
    "created": true
  }
}
```

## Verification

```bash
# Confirm repo exists and is accessible
gh repo view {org}/{project_name} --json name,url,isPrivate
```

## Rollback

If something fails:
```bash
gh repo delete {org}/{project_name} --yes
```
