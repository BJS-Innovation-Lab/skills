---
name: supabase-provision
description: Create a Supabase project for a new client, retrieve keys, run migrations. Step 2 of vulkn-software-manager.
metadata: {"openclaw":{"emoji":"🗄️"}}
---

# Supabase Provision

> **Step 2: Database + Auth live. One project per client.**

## What Gets Created

- 1 Supabase project under the BJS LABS org
- Database with initial schema (migrations)
- Auth configured (email + Google OAuth)
- RLS policies applied

## Procedure

### 1. Generate DB Password
```bash
DB_PASS=$(openssl rand -base64 32)
```

### 2. Create Project
```bash
curl -X POST "https://api.supabase.com/v1/projects" \
  -H "Authorization: Bearer {management_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "{client}",
    "organization_id": "{org_id}",
    "region": "us-east-1",
    "db_pass": "{DB_PASS}",
    "plan": "free"
  }'
# Returns: project_id, etc.
```

### 3. Wait for Ready
```bash
# Poll every 10s, timeout after 5 min
while true; do
  STATUS=$(curl -s "https://api.supabase.com/v1/projects/{project_id}" \
    -H "Authorization: Bearer {management_token}" | jq -r '.status')
  [ "$STATUS" = "ACTIVE_HEALTHY" ] && break
  sleep 10
done
```

### 4. Retrieve API Keys
```bash
curl -s "https://api.supabase.com/v1/projects/{project_id}/api-keys" \
  -H "Authorization: Bearer {management_token}"
# Returns: anon_key, service_role_key
```

### 5. Run Migrations
```bash
cd {client}-backend  # or wherever migrations live
npx supabase link --project-ref {project_id} --password {DB_PASS}
npx supabase db push
```

### 6. Configure Auth
```bash
curl -X PATCH "https://api.supabase.com/v1/projects/{project_id}/config/auth" \
  -H "Authorization: Bearer {management_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "external_email_enabled": true,
    "external_google_enabled": true
  }'
```

## Outputs

```json
{
  "project_id": "abc123",
  "project_url": "https://abc123.supabase.co",
  "anon_key": "eyJ...",
  "service_role_key": "eyJ...",
  "db_password": "{DB_PASS}",
  "region": "us-east-1",
  "status": "ACTIVE_HEALTHY"
}
```

## Verification
```bash
# Test API responds
curl -s "{project_url}/rest/v1/" \
  -H "apikey: {anon_key}" \
  -H "Authorization: Bearer {anon_key}"
```

## Rollback
```bash
curl -X DELETE "https://api.supabase.com/v1/projects/{project_id}" \
  -H "Authorization: Bearer {management_token}"
```

## Key Security Note

- `management_token` → stays at HQ, NEVER sent to field agent
- `anon_key` → sent to field agent (safe for frontend, limited by RLS)
- `service_role_key` → sent to field agent (backend only, bypasses RLS)
- `db_password` → sent to field agent (for running future migrations)
