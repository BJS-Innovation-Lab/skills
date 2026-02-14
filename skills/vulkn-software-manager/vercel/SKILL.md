---
name: vercel-provision
description: Create a Vercel project linked to the frontend repo with Supabase env vars. Step 3 of vulkn-software-manager.
metadata: {"openclaw":{"emoji":"▲"}}
---

# Vercel Provision

> **Step 3: Frontend deployed. Linked to GitHub, connected to Supabase.**

## What Gets Created

- 1 Vercel project under the VULKN team
- Linked to `{client}-frontend` GitHub repo
- Environment variables set (Supabase connection)
- First deploy triggered

## Procedure

### 1. Create Project
```bash
curl -X POST "https://api.vercel.com/v10/projects" \
  -H "Authorization: Bearer {vercel_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "{client}-frontend",
    "framework": "nextjs",
    "gitRepository": {
      "type": "github",
      "repo": "BJS-Innovation-Lab/{client}-frontend"
    },
    "teamId": "{team_id}"
  }'
# Returns: project_id
```

### 2. Set Environment Variables
```bash
curl -X POST "https://api.vercel.com/v10/projects/{project_id}/env?teamId={team_id}" \
  -H "Authorization: Bearer {vercel_token}" \
  -H "Content-Type: application/json" \
  -d '[
    {"key":"NEXT_PUBLIC_SUPABASE_URL","value":"{supabase_url}","type":"plain","target":["production","preview","development"]},
    {"key":"NEXT_PUBLIC_SUPABASE_ANON_KEY","value":"{anon_key}","type":"plain","target":["production","preview","development"]},
    {"key":"SUPABASE_SERVICE_ROLE_KEY","value":"{service_role_key}","type":"encrypted","target":["production"]}
  ]'
```

### 3. Trigger Deploy
```bash
curl -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer {vercel_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "{client}-frontend",
    "project": "{project_id}",
    "target": "production",
    "gitSource": {
      "type": "github",
      "org": "BJS-Innovation-Lab",
      "repo": "{client}-frontend",
      "ref": "main"
    },
    "teamId": "{team_id}"
  }'
```

### 4. Wait for Deploy
```bash
# Poll every 15s, timeout after 10 min
while true; do
  STATE=$(curl -s "https://api.vercel.com/v13/deployments/{deployment_id}?teamId={team_id}" \
    -H "Authorization: Bearer {vercel_token}" | jq -r '.readyState')
  [ "$STATE" = "READY" ] && break
  sleep 15
done
```

## Outputs

```json
{
  "project_id": "prj_...",
  "project_url": "https://{client}-frontend.vercel.app",
  "deployment_id": "dpl_...",
  "status": "READY"
}
```

## Verification
```bash
curl -s -o /dev/null -w "%{http_code}" "https://{client}-frontend.vercel.app"
# Should return 200
```

## Rollback
```bash
curl -X DELETE "https://api.vercel.com/v9/projects/{project_id}?teamId={team_id}" \
  -H "Authorization: Bearer {vercel_token}"
```
