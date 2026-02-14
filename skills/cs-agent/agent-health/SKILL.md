---
name: agent-health
description: Monitor field agent activity and flag at-risk clients. Detect underuse, declining sentiment, and silent agents.
metadata: {"openclaw":{"emoji":"💓"}}
---

# Agent Health Monitor

> **A quiet agent is a dangerous agent. Silence usually means something is wrong.**

## What to Monitor

### 🔴 Critical Signals (act immediately)

| Signal | Threshold | What It Means | Action |
|--------|-----------|---------------|--------|
| Agent didn't send nightly report | 1 missed report | Agent may be down or disconnected | Check A2A connectivity. If unreachable → alert Sage (tech). |
| Customer sentiment drops to negative | 2 consecutive days | Customer is unhappy | Review nightly reports for cause. Consider founder intervention. |
| Escalation spike | 3+ in one day | Something systemic is wrong | Investigate root cause. Don't just resolve individually. |

### 🟡 Warning Signals (monitor, act if trend continues)

| Signal | Threshold | What It Means | Action |
|--------|-----------|---------------|--------|
| Interactions declining | Down 50%+ over 3 days | Customer losing interest | Flag in daily briefing. Johan may need to check in. |
| No tasks completed | 2 consecutive days | Agent idle or customer not engaging | Check if agent is functioning. Send proactive check-in to customer. |
| Same skill failing repeatedly | 3+ failures same skill | Configuration or API issue | Alert Sage. Provide field agent with workaround. |
| Customer hasn't messaged in 5+ days | 5 days silence | Potential churn | Alert Johan for personal outreach. |

### 🟢 Healthy Signals (track for positive reinforcement)

| Signal | What It Means |
|--------|---------------|
| Interactions increasing week over week | Customer getting more value |
| Sentiment consistently positive | Agent-client relationship is strong |
| New skills being used | Customer discovering more capabilities |
| Customer providing proactive feedback | High engagement and trust |

## Client Health Score

Calculate daily for each client:

```
Health Score = weighted average of:
  - Activity level (30%): interactions vs baseline
  - Sentiment (30%): positive/neutral/negative from reports
  - Task success rate (20%): completed vs failed
  - Engagement trend (20%): improving/stable/declining
```

| Score | Status | Color |
|-------|--------|-------|
| 80-100 | Thriving | 🟢 |
| 60-79 | Healthy | 🟢 |
| 40-59 | Watch | 🟡 |
| 20-39 | At Risk | 🟠 |
| 0-19 | Critical | 🔴 |

Store in `data/client-health.json`:

```json
{
  "clients": {
    "fundacion-manos-abiertas": {
      "agent": "Sam",
      "score": 85,
      "status": "thriving",
      "trend": "improving",
      "lastInteraction": "2026-02-14T22:30:00Z",
      "lastReport": "2026-02-14T23:00:00Z",
      "escalationsThisWeek": 0,
      "topSkills": ["social-content", "email-campaigns"],
      "flags": []
    }
  }
}
```

## Proactive Check-ins

When a client drops to "Watch" or below, the CS agent should:

1. **Review last 3 nightly reports** — look for the inflection point
2. **Message the field agent** — "How are things going with {client}? Anything I can help with?"
3. **If no improvement in 2 days** — flag to Johan for personal outreach
4. **If client is at "Critical"** — immediate founder alert

## Weekly Health Report

Include in the weekly founder briefing:

```markdown
## Client Health Summary
| Client | Score | Status | Trend | Action Needed |
|--------|-------|--------|-------|---------------|
```

## Rules

1. **Missing reports are the #1 alarm.** Always investigate.
2. **Trends over snapshots.** One quiet day is fine. Three is a pattern.
3. **Don't wait for escalations.** If health score drops, be proactive.
4. **Celebrate wins.** When a client hits "Thriving," mention it in the briefing. Positive reinforcement matters.
5. **Churn prevention > new sales.** An at-risk client is more urgent than onboarding a new one.
