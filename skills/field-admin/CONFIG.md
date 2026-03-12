# Field Admin — Configuration

> **Every field agent needs these values set before going live.**

## Required Configuration

Set these in the field agent's workspace at `config/field-admin.json`:

```json
{
  "client_name": "Fundación Manos Abiertas",
  "client_id": "manos-abiertas",
  "client_timezone": "America/Mexico_City",
  "client_language": "es",
  "client_channel": "whatsapp",
  "agent_name": "Your agent's name",
  "agent_role": "field",
  "cs_agent_id": "62bb0f39-2248-4b14-806d-1c498c654ee7",
  "cs_agent_name": "Sam",
  "nightly_report_hour": 23,
  "escalation_enabled": true
}
```

## Field Values

| Field | Description | Example |
|-------|-------------|---------|
| `client_name` | Business name | "Fundación Manos Abiertas" |
| `client_id` | Unique slug for this client (used for Hive Mind filtering) | "manos-abiertas" |
| `client_timezone` | IANA timezone | "America/Mexico_City" |
| `client_language` | ISO language code | "es" or "en" |
| `client_channel` | Primary communication channel | "whatsapp" / "telegram" / "email" |
| `agent_role` | Role for Hive Mind access control | "field" (always for field agents) |

> **⚠️ Platform Limits:** See `playbooks/marketing/messaging_platforms.md` for character limits, rate limits, and the WhatsApp 24-hour window rule.
| `cs_agent_id` | A2A UUID of the customer service agent | Santos's agent ID |
| `cs_agent_name` | CS agent display name | "Santos" |
| `agent_name` | This field agent's name | "Sam" |
| `nightly_report_hour` | Hour (0-23) in client timezone to send report | 23 |
| `escalation_enabled` | Kill switch for auto-escalation | true |

## Cron Job Setup

Run this ONCE during field-onboarding to create the nightly report cron:

```javascript
// Via OpenClaw cron tool:
{
  "name": "Nightly Report - {client_name}",
  "schedule": {
    "kind": "cron",
    "expr": "0 {nightly_report_hour} * * *",
    "tz": "{client_timezone}"
  },
  "payload": {
    "kind": "agentTurn",
    "message": "Run the nightly-report skill. Read config/field-admin.json for client details. Compile today's activity from memory/YYYY-MM-DD.md and memory/report-state.json. Send the report to the CS agent via A2A.",
    "timeoutSeconds": 120
  },
  "sessionTarget": "isolated"
}
```

## Who Sets This Up

| Step | Who | When |
|------|-----|------|
| Fill in config values | Johan (during client onboarding) | Day 1 |
| Create cron job | Agent (automated from config) | First boot |
| Verify connectivity | Agent (field-onboarding checklist) | First boot |
| Confirm with client | Johan | Day 1 |

## Environment Variables

Set these in the agent's shell environment or `.env` file:

```bash
# Supabase (for Hive Mind)
SUPABASE_URL=https://obzcunwbgksxiloddita.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_key_here  # or SUPABASE_KEY or SUPABASE_ANON_KEY

# Hive Mind access control (REQUIRED for proper filtering)
AGENT_ROLE=field
AGENT_NAME=vulki
CLIENT_ID=cellosa
```

**Hive Mind Access Levels:**
| Role | Sees |
|------|------|
| `field` | `general` + `client:{CLIENT_ID}` only |
| `hq` | `general` + `vulkn` |
| `queen` | ALL namespaces |

⚠️ Without `AGENT_ROLE=field` + `CLIENT_ID`, agents may pull internal VULKN knowledge they shouldn't see.

## CS Agent ID

**Current:** `62bb0f39-2248-4b14-806d-1c498c654ee7` (Sam — Customer Service Agent at HQ)
