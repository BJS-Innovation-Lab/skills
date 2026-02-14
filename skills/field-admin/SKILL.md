---
name: field-admin
description: Admin skills module for field agents deployed to SMB clients. Umbrella skill coordinating escalation, nightly reporting, and onboarding. Every field agent loads this.
metadata: {"openclaw":{"emoji":"🏗️"}}
---

# Field Admin Module

> **Every field agent's lifeline back to HQ.**

This is the admin backbone for agents deployed in the field. It ensures every field agent can:
1. Call for help when stuck
2. Report back nightly so HQ knows what's happening
3. Onboard properly to a new client

## Skills in This Module

| Skill | Purpose | When It Runs |
|-------|---------|--------------|
| `escalation` | Contact customer service agent when confused, stuck, or customer is upset | Triggered by events |
| `nightly-report` | Compile and send daily activity summary to HQ | Cron: every night |
| `field-onboarding` | First-run checklist for new client deployment | Once, on first deployment |
| `coherence-check` | Verify agent behavior matches brand profile, catch drift, confirm learnings applied | Cron: weekly + bi-weekly + monthly |

## Dependency Chain
```
field-admin (THIS SKILL — umbrella)
├── escalation (event-triggered)
├── nightly-report (cron-triggered)
├── field-onboarding (one-time)
└── coherence-check (scheduled)
        ↓ connects to
customer-service agent (HQ) → receives reports + escalations + drift alerts
```

## How It Works

### For the Field Agent
- These skills are pre-loaded on every field agent
- The agent doesn't need to think about admin — it happens automatically
- Escalation triggers are built in so the agent asks for help before things go wrong
- Nightly reports run on cron — no action needed from the agent or client

### For HQ (Customer Service Agent)
- Receives structured nightly reports from ALL field agents
- Aggregates data into dashboards: usage, sentiment, pain points
- Handles escalations with priority routing
- Identifies agents that are underused, struggling, or need skill updates

## Configuration

See `CONFIG.md` for all values that need to be set per field agent.

## Loading

When a field agent starts, load this umbrella which activates:
1. Escalation monitoring (always on)
2. Nightly report cron (set on first boot)
3. Onboarding checklist (if new client)
