---
name: railway-provision
description: Create a Railway project and service linked to the backend repo with Supabase env vars. Step 4 of vulkn-software-manager.
metadata: {"openclaw":{"emoji":"🚂"}}
---

# Railway Provision

> **Step 4: Backend API deployed. Linked to GitHub, connected to Supabase.**

## What Gets Created

- 1 Railway project under the VULKN team
- 1 service linked to `{client}-backend` GitHub repo
- Environment variables set (Supabase connection)
- Auto-deploy on push to main

## Procedure

### 1. Create Project
```bash
curl -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer {railway_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { projectCreate(input: { name: \"{client}-backend\", teamId: \"{team_id}\" }) { id } }"
  }'
# Returns: project_id
```

### 2. Create Service (linked to GitHub)
```bash
curl -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer {railway_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { serviceCreate(input: { projectId: \"{project_id}\", name: \"{client}-api\", source: { repo: \"BJS-Innovation-Lab/{client}-backend\" } }) { id } }"
  }'
# Returns: service_id
```

### 3. Set Environment Variables
```bash
# Get the default environment ID first
curl -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer {railway_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { project(id: \"{project_id}\") { environments { edges { node { id name } } } } }"
  }'

# Set variables
curl -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer {railway_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { variableCollectionUpsert(input: { projectId: \"{project_id}\", environmentId: \"{env_id}\", serviceId: \"{service_id}\", variables: { SUPABASE_URL: \"{supabase_url}\", SUPABASE_SERVICE_ROLE_KEY: \"{service_role_key}\", SUPABASE_ANON_KEY: \"{anon_key}\", PORT: \"8000\" } }) }"
  }'
```

### 4. Generate Domain
```bash
curl -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer {railway_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { serviceDomainCreate(input: { serviceId: \"{service_id}\", environmentId: \"{env_id}\" }) { domain } }"
  }'
# Returns: {client}-backend.up.railway.app
```

### 5. Trigger Deploy
```bash
# Push to GitHub triggers auto-deploy
# Or manually redeploy:
curl -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer {railway_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { serviceInstanceRedeploy(serviceId: \"{service_id}\", environmentId: \"{env_id}\") }"
  }'
```

## Outputs

```json
{
  "project_id": "...",
  "service_id": "...",
  "service_url": "https://{client}-backend.up.railway.app",
  "status": "deployed"
}
```

## Verification
```bash
# Check backend is responding
curl -s "https://{client}-backend.up.railway.app/health"
# Should return 200 with health check response
```

## Rollback
```bash
curl -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer {railway_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { projectDelete(id: \"{project_id}\") }"
  }'
```
