---
name: nightly-report
description: Cron job for field agents to compile and send daily activity summaries to HQ. Tracks usage, sentiment, pain points, and improvement opportunities.
metadata: {"openclaw":{"emoji":"📋"}}
---

# Nightly Report Skill

> **HQ can't help what it can't see. Every night, tell them what happened.**

## Overview

Every field agent runs a nightly cron job that compiles the day's activity into a structured report and sends it to the customer service agent at HQ. This is how the team knows:
- Which clients are active vs. silent
- Where agents are struggling
- What customers actually want vs. what we offer
- Where to focus improvements

## Cron Setup

See `CONFIG.md` for the exact cron job to create during field-onboarding.

## Report Structure

Every nightly report MUST include these sections:

```markdown
# 📋 Daily Report: {client_name}
**Date:** {YYYY-MM-DD}
**Agent:** {agent_name}
**Client Timezone:** {timezone}

---

## 📊 Activity Summary
| Metric | Count |
|--------|-------|
| Total interactions | {n} |
| Tasks completed | {n} |
| Tasks requested but not completed | {n} |
| Channels used | {list} |
| Escalations today | {n} |

## ✅ Tasks Completed
{Numbered list of what was accomplished}
1. Created 3 Instagram posts (approved by owner)
2. Drafted email campaign for Valentine's Day promo
3. Updated contact list with 5 new leads

## ❌ Tasks Requested But Not Completed
{What was asked for but couldn't be delivered, and WHY}
1. Customer asked for TikTok video — skill not available
2. Tried to send email blast — SendGrid API key expired

## 💬 Customer Interactions
| Channel | Messages In | Messages Out | Sentiment |
|---------|-------------|-------------|-----------|
| WhatsApp | 12 | 15 | 😊 Positive |
| Telegram | 3 | 4 | 😐 Neutral |
| Email | 1 | 2 | 😊 Positive |

### Notable Interactions
{Any interactions worth highlighting — good or bad}
> Customer said: "This is exactly what I needed, thank you!"
> Context: After receiving the social media batch for the week

## 🛠️ Skills Usage
| Skill | Times Used | Success | Failed |
|-------|-----------|---------|--------|
| social-content | 3 | 3 | 0 |
| email-campaigns | 1 | 0 | 1 |
| creativity-engine | 2 | 2 | 0 |

### Skills Attempted But Failed
{Detail on what went wrong}
- `email-campaigns`: SendGrid returned 401 Unauthorized. API key may need rotation.

### Skills Never Used
{Skills available but not triggered today — indicates potential underuse}
- landing-page-copy, appointment-booking, content-log

## ❓ Unanswered Questions
{Things the customer asked that the agent couldn't handle}
1. "Can you manage my Google Ads?" — Not in current skill set
2. "Can you respond to my Google Reviews?" — Not available yet

## 😊 Customer Sentiment
**Overall:** {Positive / Neutral / Negative / Mixed}
**Trend:** {Improving / Stable / Declining}
**Evidence:** {Quote or behavior that supports the assessment}

## 🔴 Pain Points
{Specific friction points observed today}
1. Customer had to repeat herself about brand colors — need to save to profile
2. Email sending failed — frustrated customer who expected it to "just work"

## 💡 Suggestions for Improvement
{Agent's own observations about what could be better}
1. Add Google Ads skill — customer asked twice this week
2. Save brand colors/fonts to profile — keeps coming up
3. Email provider needs monitoring — second failure this week

## 📈 Escalations Today
{Summary of any escalations, resolved or not}
- None today / {or list with status}

## 🔄 Comparison to Yesterday
| Metric | Yesterday | Today | Trend |
|--------|-----------|-------|-------|
| Interactions | 8 | 15 | ⬆️ |
| Tasks completed | 3 | 5 | ⬆️ |
| Sentiment | Neutral | Positive | ⬆️ |
```

## Sending the Report

Send via A2A to the customer service agent:

```bash
cd ~/.openclaw/workspace/skills/a2a-protocol && \
./scripts/daemon-send.sh {CS_AGENT_ID} \
'{"message":"<full report>","subject":"📋 Nightly Report: {client_name} - {date}","type":"nightly-report"}' \
--type message
```

Replace `{CS_AGENT_ID}` with the value from `config/field-admin.json`.

## Data Collection During the Day

To compile the report accurately, the field agent should track throughout the day:

### In `memory/YYYY-MM-DD.md`:
- Every task completed (with timestamps)
- Every customer interaction (channel, topic, sentiment)
- Every skill invoked (success/failure)
- Every question that couldn't be answered
- Any customer feedback (exact quotes when possible)

### In `memory/report-state.json`:
```json
{
  "date": "2026-02-14",
  "interactions": 0,
  "tasksCompleted": [],
  "tasksFailed": [],
  "skillsUsed": {},
  "escalations": [],
  "unansweredQuestions": [],
  "customerQuotes": [],
  "sentiment": "neutral"
}
```

Update this file throughout the day. The nightly cron reads it to compile the report.

## Rules

1. **Send every night** — even if nothing happened. "No activity" is important data.
2. **Be honest** — don't inflate numbers or hide failures. HQ needs the truth to help.
3. **Include customer quotes** — exact words are more valuable than your summary.
4. **Suggest improvements** — you're closest to the customer. Your observations matter.
5. **Compare to yesterday** — trends matter more than snapshots.
6. **Flag underuse** — if a client barely uses the agent, that's a churn risk. Say so.
