---
name: report-aggregator
description: Compile nightly reports from all field agents into aggregated dashboards. Identify trends, at-risk clients, and improvement opportunities.
metadata: {"openclaw":{"emoji":"📊"}}
---

# Report Aggregator

> **Raw reports from 10 agents are noise. Your job is to turn them into signal.**

## When to Run

**Daily:** Every morning at 8 AM ET, after all nightly reports have arrived (agents send at 11 PM their local time).

```javascript
{
  "name": "Morning Report Aggregation",
  "schedule": { "kind": "cron", "expr": "0 8 * * *", "tz": "America/New_York" },
  "payload": {
    "kind": "agentTurn",
    "message": "Run report-aggregator. Read all nightly reports received since yesterday's aggregation. Compile the daily dashboard and flag any issues.",
    "timeoutSeconds": 180
  },
  "sessionTarget": "isolated"
}
```

## Daily Dashboard Format

Compile all nightly reports into one view:

```markdown
# 📊 Daily Dashboard — {date}
**Reports received:** {n} of {total agents}
**Missing reports:** {list agents that didn't report — this is a red flag}

---

## 🚦 Client Health at a Glance

| Client | Agent | Interactions | Sentiment | Trend | Flag |
|--------|-------|-------------|-----------|-------|------|
| Manos Abiertas | Sam | 15 | 😊 | ⬆️ | — |
| Taquería Los Bros | Luna | 3 | 😐 | ⬇️ | ⚠️ Low usage |
| Suzanne ONG | Sam | 22 | 😊 | ⬆️ | — |

### 🔴 Needs Attention
{Clients with declining sentiment, low usage, escalations, or failed tasks}
- **Taquería Los Bros** — only 3 interactions, down from 8 yesterday. Owner may be disengaging.

### ✅ Going Well  
{Clients with positive trends}
- **Suzanne ONG** — 22 interactions, all positive. "No me lo creo" (still amazed).

---

## 📈 Aggregate Metrics

| Metric | Today | Yesterday | Trend |
|--------|-------|-----------|-------|
| Total interactions (all clients) | {n} | {n} | ⬆️/⬇️ |
| Tasks completed | {n} | {n} | |
| Tasks failed | {n} | {n} | |
| Escalations | {n} | {n} | |
| Average sentiment | {score} | {score} | |

## 🛠️ Skills Across All Agents

| Skill | Times Used | Success Rate | Notes |
|-------|-----------|-------------|-------|
| social-content | 12 | 100% | Most used skill |
| email-campaigns | 3 | 67% | 1 failure (SendGrid) |
| appointment-booking | 0 | — | Never used this week |

### Skills Frequently Requested But Missing
{Aggregated from all "unanswered questions" sections}
1. Google Ads management (asked by 3 clients)
2. Google Reviews responses (asked by 2 clients)
3. TikTok content (asked by 1 client)

## ❓ Top Unanswered Questions This Week
{Grouped by frequency — these are your product roadmap signals}

## 💡 Agent Suggestions (Aggregated)
{What field agents are asking for — they're closest to the customer}

## 🔴 Escalation Summary
| Time | Client | Category | Resolved | Time to Resolve |
|------|--------|----------|----------|-----------------|
```

## Weekly Deep Dive (Fridays)

In addition to the daily dashboard, compile a weekly summary every Friday:

```markdown
# 📊 Weekly Summary — Week of {date}

## Client Portfolio Health
- **Active clients:** {n}
- **At-risk clients:** {n} (declining usage or sentiment)
- **New clients onboarded:** {n}
- **Churn this week:** {n}

## Key Wins
{Best outcomes across all clients}

## Key Problems  
{Recurring issues, systemic failures}

## Feature Requests (ranked by frequency)
| Feature | Clients Requesting | Priority |
|---------|-------------------|----------|

## Agent Performance
| Agent | Clients | Avg Sentiment | Escalations | Tasks Completed |
|-------|---------|--------------|-------------|-----------------|

## Recommendations for Founders
{Your analysis — what should Bridget and Johan focus on next week?}
```

## Data Storage

Store aggregated data in structured files:

```
cs-agent/data/
├── dashboards/
│   ├── 2026-02-14.md
│   └── 2026-02-15.md
├── weekly/
│   ├── 2026-W07.md
│   └── 2026-W08.md
├── feature-requests.md        (running tally)
├── client-health.json         (current status of all clients)
└── escalations/
    └── 2026-02-14.md
```

## Rules

1. **Missing reports are red flags.** If an agent didn't report, something is wrong. Check on them.
2. **Trends > snapshots.** One bad day isn't a crisis. Three bad days is.
3. **Aggregate unanswered questions.** These are your product roadmap.
4. **Agent suggestions matter.** They're closest to the customer. Surface their ideas.
5. **Keep it scannable.** Founders have 2 minutes. Lead with what matters.
