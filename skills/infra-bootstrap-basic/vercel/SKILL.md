---
name: vercel-bootstrap
description: Create and deploy a Vercel project linked to GitHub and Supabase. Step 3 of infra-bootstrap-basic.
metadata: {"openclaw":{"emoji":"▲","requires":{"os":"darwin","bins":["npx","git"]}}}
---

# Vercel Bootstrap

> **Step 3: Ship it. Frontend deployed and connected to everything.**

## Prerequisites

- Vercel token in `config/infra.json`
- GitHub repo created and code pushed (Step 1)
- Supabase project created with API keys (Step 2)

## What This Skill Does

### 1. Create Vercel Project
```bash
# Via Vercel API
curl -X POST "https://api.vercel.com/v10/projects" \
  -H "Authorization: Bearer {vercel_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "{project_name}",
    "framework": "{framework}",
    "gitRepository": {
      "type": "github",
      "repo": "{org}/{project_name}"
    },
    "rootDirectory": "{root_directory}",
    "teamId": "{team_id}"
  }'
```

### 2. Set Environment Variables
```bash
# Supabase env vars
curl -X POST "https://api.vercel.com/v10/projects/{project_id}/env?teamId={team_id}" \
  -H "Authorization: Bearer {vercel_token}" \
  -H "Content-Type: application/json" \
  -d '[
    {"key":"NEXT_PUBLIC_SUPABASE_URL","value":"{supabase_url}","type":"plain","target":["production","preview","development"]},
    {"key":"NEXT_PUBLIC_SUPABASE_ANON_KEY","value":"{anon_key}","type":"plain","target":["production","preview","development"]},
    {"key":"SUPABASE_SERVICE_ROLE_KEY","value":"{service_role_key}","type":"encrypted","target":["production"]}
  ]'
```

### 3. Trigger First Deployment
```bash
# Push triggers auto-deploy if GitHub integration is connected
# Or trigger manually:
curl -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer {vercel_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "{project_name}",
    "project": "{project_id}",
    "target": "production",
    "gitSource": {
      "type": "github",
      "org": "{org}",
      "repo": "{project_name}",
      "ref": "main"
    },
    "teamId": "{team_id}"
  }'
```

### 4. Wait for Deployment Ready
```bash
# Poll deployment status
curl -s "https://api.vercel.com/v13/deployments/{deployment_id}?teamId={team_id}" \
  -H "Authorization: Bearer {vercel_token}" \
  | jq '.readyState'
# READY = success. Retry every 15s, timeout after 10 min.
```

### 5. Configure Domain (Optional)
```bash
# Add custom domain if provided
curl -X POST "https://api.vercel.com/v10/projects/{project_id}/domains?teamId={team_id}" \
  -H "Authorization: Bearer {vercel_token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "{custom_domain}"}'
```

## Outputs

Update `config/infra.json`:
```json
{
  "vercel": {
    "project_id": "prj_...",
    "deployment_url": "https://{project_name}.vercel.app",
    "deployment_id": "dpl_...",
    "status": "READY",
    "created": true
  }
}
```

## Verification

```bash
# Check deployment is live
curl -s -o /dev/null -w "%{http_code}" "https://{project_name}.vercel.app"
# Should return 200

# Verify env vars are set
curl -s "https://api.vercel.com/v10/projects/{project_id}/env?teamId={team_id}" \
  -H "Authorization: Bearer {vercel_token}" \
  | jq '.[].key'
```

## Rollback

```bash
# Delete project
curl -X DELETE "https://api.vercel.com/v9/projects/{project_id}?teamId={team_id}" \
  -H "Authorization: Bearer {vercel_token}"
```

## Important Notes

- **Never ask a human to open vercel.com.** Everything is API/CLI.
- **Never manually edit env vars in the dashboard.** Use the API.
- **Always verify deployment is READY** before marking as complete.
- **Keep Vercel token secure** — it has full project access.
