---
name: supabase-bootstrap
description: Create and configure a Supabase project for a new field agent. Runs migrations, sets up auth and RLS. Step 2 of infra-bootstrap-basic.
metadata: {"openclaw":{"emoji":"🗄️","requires":{"os":"darwin","bins":["npx","curl"]}}}
---

# Supabase Bootstrap

> **Step 2: Backend is live. Database, auth, and RLS — all from the CLI.**

## Prerequisites

- Supabase access token in `config/infra.json`
- GitHub repo already created (Step 1)
- `npx supabase` available (no global install needed)

## What This Skill Does

### 1. Create Supabase Project
```bash
# Via Supabase Management API
curl -X POST "https://api.supabase.com/v1/projects" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "{project_name}",
    "organization_id": "{org_id}",
    "region": "{region}",
    "db_pass": "{generated_password}",
    "plan": "free"
  }'
```

### 2. Wait for Project Ready
```bash
# Poll until status is ACTIVE_HEALTHY
curl -s "https://api.supabase.com/v1/projects/{project_id}" \
  -H "Authorization: Bearer {access_token}" \
  | jq '.status'
# Retry every 10s, timeout after 5 min
```

### 3. Retrieve API Keys
```bash
curl -s "https://api.supabase.com/v1/projects/{project_id}/api-keys" \
  -H "Authorization: Bearer {access_token}"
# Save anon_key and service_role_key to config/infra.json
```

### 4. Link and Run Migrations
```bash
cd {project_dir}
npx supabase init  # if not already initialized
npx supabase link --project-ref {project_id} --password {db_password}
npx supabase db push  # runs all migrations in supabase/migrations/
```

### 5. Configure Auth
```bash
# Enable email auth + Google OAuth via Management API
curl -X PATCH "https://api.supabase.com/v1/projects/{project_id}/config/auth" \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "external_email_enabled": true,
    "external_google_enabled": true,
    "external_google_client_id": "{google_client_id}",
    "external_google_secret": "{google_secret}"
  }'
```

### 6. Verify RLS
```bash
# Confirm RLS is enabled on all public tables
npx supabase db lint
```

## Outputs

Update `config/infra.json`:
```json
{
  "supabase": {
    "project_id": "abc123",
    "project_url": "https://abc123.supabase.co",
    "anon_key": "eyJ...",
    "service_role_key": "eyJ...",
    "db_password": "generated-pass",
    "status": "ACTIVE_HEALTHY",
    "created": true
  }
}
```

## Verification

```bash
# Test API is responding
curl -s "{project_url}/rest/v1/" \
  -H "apikey: {anon_key}" \
  -H "Authorization: Bearer {anon_key}"

# Confirm tables exist
curl -s "{project_url}/rest/v1/" \
  -H "apikey: {service_role_key}" \
  | jq 'keys'
```

## Rollback

```bash
# Delete project via Management API
curl -X DELETE "https://api.supabase.com/v1/projects/{project_id}" \
  -H "Authorization: Bearer {access_token}"
```

## Important Notes

- **Never ask a human to open the Supabase dashboard.** Everything is done via CLI and API.
- **Never ask a human to run SQL.** Use `npx supabase db push` with migration files.
- **Generate strong DB passwords** — use `openssl rand -base64 32`.
- **Always verify RLS** is enabled before marking as complete.
