# Fleet Guardian - Token Health Monitoring System

**Created:** 2026-03-06
**Owner:** Sybil (temporary) → TBD (Operations agent)
**Status:** Planned - Starting Tomorrow

## Problem
When an agent's Claude/MiniMax token hits its limit, the agent dies. A dead agent can't save itself. We need external monitoring to detect failures and perform emergency token swaps.

## Architecture

```
                    ┌─────────────────────┐
                    │   Fleet Guardian    │
                    │    (Sybil → TBD)    │
                    │  Always-on token    │
                    └──────────┬──────────┘
                               │
         Direct HTTP ──────────┼────────── Sheet Heartbeat
         (Cloud agents)        │           (All agents)
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
       Cloud Agents       Cloud Agents        Local Agent
       (Railway)          (Railway)           (Sam only)
```

## Monitoring Methods

### Cloud Agents (Primary: Direct HTTP)
- Ping gateway URL directly
- Test /v1/chat/completions with minimal request
- No A2A dependency - most reliable

### All Agents (Backup: Sheet Heartbeat)
- "Last Seen" column in Agent Registry
- Agents update every heartbeat via Sheets API
- Guardian checks for stale entries (>30 min)

## Emergency Swap Protocol

1. Guardian detects agent is dead or at critical usage (>90%)
2. Find available token in vault (Active, not assigned)
3. Cloud agents: Railway API to update env + restart
4. Local agents: Filesystem config update + restart
5. Update Token Vault sheet
6. Notify founders via Telegram

## Token Vault
https://docs.google.com/spreadsheets/d/1NediJKJzIWuHxQxbqKOzPFJqasF4UpToPULQZraXLO8/edit

## Fleet Composition
- Cloud (Railway): Vulki, Vulkimi, Sam Cloud, + many more coming
- Local: Sam only (everyone else moving to cloud)

## Handoff Plan
- Sybil builds v1 and proves the concept
- Hand off to Operations agent (Santos or dedicated)
- Sybil returns to ML/Research focus

## Next Steps (Tomorrow)
1. Add "Last Seen" column to Agent Registry
2. Build health check cron (every 15 min)
3. Test direct gateway pings
4. Set up emergency Telegram alerts
5. Get Railway API access

---
*Plan created 2026-03-06 during Token Vault session with Bridget*
