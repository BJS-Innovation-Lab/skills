# Field Admin — Configuration

> **Every field agent needs these values set before going live.**

## Required Configuration

Set these in the field agent's workspace at `config/field-admin.json`:

```json
{
  "client_name": "Fundación Manos Abiertas",
  "client_timezone": "America/Mexico_City",
  "client_language": "es",
  "client_channel": "whatsapp",
  "cs_agent_id": "e7fabc18-75fa-4294-bd7d-9e5ed0dedacb",
  "cs_agent_name": "Santos",
  "agent_name": "Your agent's name",
  "nightly_report_hour": 23,
  "escalation_enabled": true
}
```

## Field Values

| Field | Description | Example |
|-------|-------------|---------|
| `client_name` | Business name | "Fundación Manos Abiertas" |
| `client_timezone` | IANA timezone | "America/Mexico_City" |
| `client_language` | ISO language code | "es" or "en" |
| `client_channel` | Primary communication channel | "whatsapp" / "telegram" / "email" |
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

## CS Agent ID

**Current:** `e7fabc18-75fa-4294-bd7d-9e5ed0dedacb` (Santos — Client Success / Liaison)
