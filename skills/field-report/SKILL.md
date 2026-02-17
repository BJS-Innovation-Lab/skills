---
name: field-report
description: Nightly field agent reporting. Analyzes daily activity, generates structured reports with dashboard/insights/alerts, sends to HQ via A2A for founder briefings.
version: 1.0.0
author: Sybil + Santos (BJS Labs)
metadata:
  category: operations
  tags: [reporting, field-agent, analytics, client-health]
---

# Field Report — Nightly Agent Intelligence

Generates structured nightly reports from field agent activity. Designed for the Sam → Santos → Founders pipeline.

## Pipeline

```
Sam (field) → Nightly Report → A2A → Santos (CS/Ops) → Morning Briefing → Bridget/Johan
                                       ↓
                                  Enriched with CS analysis
```

## Report Structure (3 sections, per Santos)

### 📊 Dashboard — Numbers at a Glance
- Total messages (in/out), unique users active, sessions, avg session depth
- First response time (avg, p95)
- Resolution rate (completed vs abandoned)
- Work vs personal split
- After-hours usage %
- Top tools/skills used

### 🔍 Insights — What the Data Means
- User engagement patterns (who's active, who's fading)
- Project types trending
- Feature discovery gaps (what users haven't tried)
- Complexity trends (are requests getting harder?)
- Language patterns

### 🚨 Alerts — Needs Human Attention
- Client Health Score drops (below 5/10)
- Churn risk (user inactive >48h after first use)
- Upsell opportunities ("can you also do X?")
- Security events (from field-security)
- Escalation failures (Sam couldn't handle it)

## Metrics (21 total)

### Core (1-5)
1. **Who** — per-user message counts
2. **What** — project/task categorization
3. **When** — timestamps, duration, time patterns
4. **Work vs Personal** — business relevance classification
5. **Outcome** — resolved, abandoned, escalated

### Quality (6-10)
6. **Satisfaction** — sentiment signals (thanks, frustration, silence)
7. **Complexity** — simple/medium/complex classification
8. **Tool Usage** — skills and tools invoked
9. **Repeat Requests** — same user, same topic (habit vs failure)
10. **Upsell Signals** — "can you also..." requests

### Operations (11-15, Santos additions)
11. **Confusion Points** — where users misunderstand capabilities
12. **Security Events** — from field-security layer
13. **Idle Users** — tried once, never returned
14. **ROI Indicators** — estimated time saved
15. **Language** — Spanish/English/mixed

### Performance (16-21, Santos additions)
16. **First Response Time** — message → first reply latency
17. **Escalation Rate** — % needing human/HQ help
18. **Session Depth** — avg messages per conversation
19. **After-Hours Usage** — nights/weekends %
20. **Feature Discovery** — unused capabilities per user
21. **Client Health Score** — composite 1-10 (frequency + satisfaction + complexity + repeat usage)

## Client Health Score Formula

```
health = (
  frequency_score * 0.30 +      # How often they use Sam (0-10)
  satisfaction_score * 0.25 +    # Sentiment analysis (0-10)
  depth_score * 0.20 +           # Session depth / engagement (0-10)
  breadth_score * 0.15 +         # Feature diversity used (0-10)
  recency_score * 0.10           # Days since last interaction (0-10)
)
```

Alert if score < 5.0 for any user or < 6.0 for the client overall.

## Setup (Field Agent)

1. `git pull` in skills repo
2. Add cron job for nightly report:
```bash
openclaw cron add --cron "0 22 * * *" --tz "America/Mexico_City" \
  --session isolated --message "Run nightly field report: node skills/field-report/scripts/generate-report.cjs --send-hq" \
  --name "Nightly Field Report"
```

## Setup (HQ — Santos)

Santos receives reports via A2A, enriches with CS analysis, and delivers morning briefing:
```bash
openclaw cron add --cron "0 9 * * *" --tz "America/Mexico_City" \
  --session isolated --message "Check for field reports in A2A inbox. Compile founder briefing with CS analysis." \
  --name "Morning Founder Briefing"
```

## Files

```
skills/field-report/
├── SKILL.md                          # This file
├── scripts/
│   ├── generate-report.cjs           # Main report generator
│   ├── analyze-sessions.cjs          # Session parsing + metrics extraction
│   └── health-score.cjs              # Client health score calculator
└── templates/
    └── report-template.md            # Report format template
```
