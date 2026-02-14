# CS Agent — Configuration

> **Santos needs these values set before going live.**

## Required Configuration

Set these in the CS agent's workspace at `config/cs-agent.json`:

```json
{
  "cs_agent_name": "Santos",
  "cs_agent_id": "e7fabc18-75fa-4294-bd7d-9e5ed0dedacb",

  "founders": {
    "bridget": {
      "name": "Bridget",
      "channel": "telegram",
      "telegram_id": "5063274787",
      "email": "bridget4g@gmail.com",
      "role": "Co-founder (Data/Product)"
    },
    "johan": {
      "name": "Johan",
      "channel": "telegram",
      "telegram_id": "6151122745",
      "email": "johanrios0age@gmail.com",
      "role": "Co-founder (Ops/Client Relations)"
    }
  },

  "team_agents": {
    "sage": {
      "id": "f6198962-313d-4a39-89eb-72755602d468",
      "role": "Backend Lead",
      "escalate_for": ["technical issues", "API failures", "infrastructure"]
    },
    "sybil": {
      "id": "5fae1839-ab85-412c-acc0-033cbbbbd15b",
      "role": "ML/Research Lead",
      "escalate_for": ["skill development", "research", "analytics"]
    },
    "saber": {
      "id": "415a84a4-af9e-4c98-9d48-040834436e44",
      "role": "Sales & Marketing",
      "escalate_for": ["marketing skills", "sales questions", "content strategy"]
    },
    "sam": {
      "id": "62bb0f39-2248-4b14-806d-1c498c654ee7",
      "role": "Frontend Lead",
      "escalate_for": ["UI issues", "dashboard", "webchat platform"]
    }
  },

  "schedules": {
    "report_aggregation": "08:00 America/New_York",
    "daily_briefing": "08:30 America/New_York",
    "weekly_briefing": "Monday 09:00 America/New_York"
  },

  "sla": {
    "now_escalation_minutes": 5,
    "tonight_escalation_hours": 12
  }
}
```

## Routing Guide

When an escalation comes in, Santos knows who to contact:

| Issue Type | Route To | Why |
|-----------|----------|-----|
| Customer wants a human | **Johan** | He handles all client relationships |
| Technical/API failure | **Sage** | Backend infrastructure |
| Marketing skill issue | **Saber** | Marketing module owner |
| Agent confused/stuck | **Santos handles directly** | Standard CS resolution |
| Churn risk / unhappy customer | **Johan + Bridget** | Founder-level decision |
| New feature request | **Log it** → weekly briefing | Product roadmap input |

## Who Sets This Up

| Step | Who | When |
|------|-----|------|
| Fill in config values | Sybil or Sage (initial setup) | Day 1 |
| Register field agents | Santos (as they come online) | Ongoing |
| Verify founder Telegram IDs | Johan | Day 1 |
| Test briefing delivery | Santos | Day 1 |
