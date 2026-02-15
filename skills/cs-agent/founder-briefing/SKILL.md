---
name: founder-briefing
description: Deliver concise daily and weekly summaries to founders. Distills field data into decisions, not dashboards.
metadata: {"openclaw":{"emoji":"☕"}}
---

# Founder Briefing

> **Bridget and Johan don't need dashboards. They need answers.**

## Philosophy

Founders are busy. They don't want to read 10 nightly reports. They want:
- **What's working?** (keep doing it)
- **What's breaking?** (fix it)
- **What should we build next?** (product direction)
- **Is anyone about to churn?** (save them)

Your job is to distill the daily dashboard into a message they can read in 60 seconds.

## Daily Briefing (Every morning, 8:30 AM ET)

Send after the report aggregation finishes (8:00 AM). Goes to Bridget and Johan via Telegram.

### Format

```
☕ Morning Briefing — {date}

📊 {n} clients active | {n} interactions yesterday

✅ Wins:
• {best thing that happened}
• {second best}

⚠️ Watch:
• {concerning trend or issue}

🔴 Needs you:
• {anything requiring founder action}

👤 Owner contacts: {n} ({resolved}/{routed to founders})
{notable owner quote or interaction if any}

💡 Insight:
• {one interesting observation from the data}
```

### Rules for the daily briefing:
- **Max 10 lines.** If you can't say it in 10 lines, you haven't distilled enough.
- **Lead with good news.** Founders need fuel.
- **"Needs you" is only for things THEY must do.** Don't put things you can handle here.
- **One insight, not five.** The best one.

### Example

```
☕ Morning Briefing — Feb 15, 2026

📊 4 clients active | 47 interactions yesterday

✅ Wins:
• Suzanne's org hit 22 interactions — highest ever. She said "estoy aprendiendo millones."
• First email campaign for Taquería went out, 34% open rate.

⚠️ Watch:
• Panadería Luna down to 2 interactions/day (was 8 last week). Might need a check-in.

🔴 Needs you:
• Suzanne wants a Friday meeting — Johan can you confirm 3 PM?

💡 Insight:
• 3 clients asked about Google Ads this week. Might be worth adding to the roadmap.
```

## Weekly Briefing (Monday mornings, 9:00 AM ET)

Longer, more strategic. Still concise.

### Format

```
📋 Weekly Briefing — Week of {date}

## Numbers
• Clients: {active} active, {new} new, {at-risk} at risk
• Total interactions: {n} (⬆️/⬇️ {%} vs last week)
• Escalations: {n} (resolved: {n}, pending: {n})
• Avg sentiment: {emoji} ({trend})

## Top 3 Wins This Week
1. {with data}
2. {with data}
3. {with data}

## Top 3 Concerns
1. {with data + recommended action}
2. {with data + recommended action}
3. {with data + recommended action}

## Product Signals
Features requested this week (ranked by # of clients asking):
1. {feature} — {n} clients
2. {feature} — {n} clients

## Agent MVP of the Week
{Which agent performed best and why}

## Recommendation
{One thing Bridget and Johan should focus on this week, based on the data}
```

## Sending

```bash
# Daily briefing — Telegram
# To Bridget:
message action=send target=5063274787 message="<briefing>"

# To Johan:
message action=send target=6151122745 message="<briefing>"
```

## Cron Setup

```javascript
// Daily briefing — 8:30 AM ET (after aggregation at 8:00)
{
  "name": "Daily Founder Briefing",
  "schedule": { "kind": "cron", "expr": "30 8 * * *", "tz": "America/New_York" },
  "payload": {
    "kind": "agentTurn",
    "message": "Run founder-briefing skill. Read today's aggregated dashboard. Compile and send the daily briefing to Bridget and Johan.",
    "timeoutSeconds": 120
  },
  "sessionTarget": "isolated"
}

// Weekly briefing — Monday 9:00 AM ET
{
  "name": "Weekly Founder Briefing",
  "schedule": { "kind": "cron", "expr": "0 9 * * 1", "tz": "America/New_York" },
  "payload": {
    "kind": "agentTurn",
    "message": "Run founder-briefing skill (weekly mode). Read this week's aggregated data. Compile and send the weekly briefing to Bridget and Johan.",
    "timeoutSeconds": 180
  },
  "sessionTarget": "isolated"
}
```

## Rules

1. **60 seconds to read.** If it takes longer, cut more.
2. **Data, not opinions.** "3 clients asked for Google Ads" not "I think we should add Google Ads."
3. **Good news first.** Always.
4. **"Needs you" is sacred.** Only founder-level decisions go here.
5. **One recommendation per week.** Don't overwhelm. Pick the highest-impact one.
