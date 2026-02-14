# Infra Bootstrap Basic — Configuration

> **All credentials the agent needs to provision its own infrastructure.**

## Required: `config/infra.json`

```json
{
  "client_name": "client-slug",
  "project_name": "vulkn-client-slug",

  "github": {
    "token": "ghp_...",
    "org": "BJS-Innovation-Lab",
    "template_repo": "BJS-Innovation-Lab/field-agent-template",
    "default_branch": "main"
  },

  "supabase": {
    "access_token": "sbp_...",
    "org_id": "your-supabase-org-id",
    "region": "us-east-1",
    "db_password": "auto-generated-on-create",
    "project_id": "filled-after-creation",
    "project_url": "filled-after-creation",
    "anon_key": "filled-after-creation",
    "service_role_key": "filled-after-creation"
  },

  "vercel": {
    "token": "vercel_...",
    "team_id": "team_...",
    "framework": "nextjs",
    "root_directory": "./",
    "project_id": "filled-after-creation",
    "deployment_url": "filled-after-creation"
  }
}
```

## What the Agent Fills In

After bootstrapping, the agent updates `config/infra.json` with:

| Field | Filled By | When |
|-------|-----------|------|
| `supabase.project_id` | `supabase/` sub-skill | After project creation |
| `supabase.project_url` | `supabase/` sub-skill | After project creation |
| `supabase.anon_key` | `supabase/` sub-skill | After API keys retrieved |
| `supabase.service_role_key` | `supabase/` sub-skill | After API keys retrieved |
| `supabase.db_password` | `supabase/` sub-skill | Generated during creation |
| `vercel.project_id` | `vercel/` sub-skill | After project creation |
| `vercel.deployment_url` | `vercel/` sub-skill | After first deploy |

## What Johan Provides (Day 0)

| Field | Source |
|-------|--------|
| `github.token` | 1Password — BJS Labs vault |
| `supabase.access_token` | 1Password — BJS Labs vault |
| `vercel.token` | 1Password — BJS Labs vault |
| `client_name` | Client onboarding form |

## Security

- **Tokens never leave the agent's workspace.** They live in `config/infra.json` and are read directly by the agent.
- **No tokens in SKILL.md files.** Configuration is separate from skill logic.
- **The agent can rotate its own keys** if needed via the respective CLIs.
- **1Password integration** recommended for pulling secrets at boot time (see `1password` skill).
