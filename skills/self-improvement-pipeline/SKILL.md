---
name: self-improvement-pipeline
description: "Automated nightly self-improvement cycle for field agents. Agent reviews own transcripts, identifies mistakes, implements fixes, and reports changes to HQ for founder review."
version: 1.0.0
author: Sybil (BJS Labs)
metadata:
  category: operations
  tags: [self-improvement, field-agent, automation, learning]
  openclaw:
    emoji: "🔧"
---

# Self-Improvement Pipeline

> **Agents know their own mistakes better than anyone. Let them fix themselves — with human oversight.**

## Overview

A nightly automated cycle where each field agent:
1. Reviews their own transcripts from the day
2. Identifies mistakes, pain points, and missed opportunities
3. Creates an improvement plan with concrete fixes
4. Implements fixes overnight (skills, memory, workflows)
5. Runs a coherence check to verify fixes don't introduce drift
6. Sends a structured morning report to HQ showing exactly what changed

Founders review reports each morning and decide what to roll out across all agents.

## Pipeline Flow

```
┌─────────────────────────────────────────────────────┐
│                   NIGHTLY (11 PM)                   │
│                                                     │
│  1. Review today's transcript                       │
│  2. Identify issues (categorize by type)            │
│  3. Draft improvement plan                          │
│  4. Implement fixes (update skills/memory/workflow) │
│  5. Run coherence check against brand profile       │
│  6. Commit changes to git                           │
│                                                     │
├─────────────────────────────────────────────────────┤
│                   MORNING (7 AM)                    │
│                                                     │
│  7. Generate improvement report                     │
│  8. Send report to HQ via A2A                       │
│  9. HQ aggregates → founder morning briefing        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Issue Categories

When reviewing transcripts, classify each issue:

| Category | Description | Example |
|----------|-------------|---------|
| `tone_miss` | Voice/tone didn't match brand profile | Too formal when brand is casual |
| `knowledge_gap` | Didn't know something they should | Couldn't answer basic product question |
| `workflow_fail` | Process broke or was skipped | Forgot to check calendar before booking |
| `tool_error` | Tool/skill used incorrectly | Wrong API call, bad parameters |
| `missed_opportunity` | Could have helped more but didn't | User hinted at need, agent didn't follow up |
| `hallucination` | Stated something incorrect | Wrong price, wrong feature, made-up info |
| `boundary_violation` | Overstepped or understepped | Promised something without owner approval |

## Fix Types

Each issue maps to one or more fix types:

| Fix Type | What Changes | Files Affected |
|----------|-------------|----------------|
| `memory_update` | Add knowledge to prevent gap | `memory/`, `MEMORY.md` |
| `skill_update` | Improve a skill's instructions | `skills/*/SKILL.md` |
| `workflow_update` | Add/modify a process | `AGENTS.md`, skill configs |
| `soul_update` | Adjust behavioral guidelines | `SOUL.md` (requires founder approval) |
| `tool_config` | Fix tool usage patterns | `TOOLS.md`, skill configs |
| `knowledge_base` | Add product/service info | `clients/*/kb/` |

## Nightly Review Process (Cron: 11 PM agent timezone)

### Step 1: Transcript Review

Read today's session transcripts and identify issues:

```markdown
## Issues Found — {YYYY-MM-DD}

### Issue 1
- **Category:** tone_miss
- **Transcript excerpt:** "Dear valued customer, we appreciate your inquiry..."
- **What went wrong:** Used corporate language when brand voice is casual/friendly
- **Root cause:** Brand voice dimensions not loaded in this session
- **Severity:** medium

### Issue 2
- **Category:** knowledge_gap
- **Transcript excerpt:** "I'm not sure about the pricing for that service..."
- **What went wrong:** Couldn't answer pricing question — info exists in KB but wasn't referenced
- **Root cause:** KB file not checked before responding
- **Severity:** high
```

### Step 2: Improvement Plan

For each issue, create a concrete fix:

```markdown
## Improvement Plan

### Fix 1 → tone_miss
- **Fix type:** memory_update
- **Action:** Add brand voice reminder to HEARTBEAT.md check
- **File:** HEARTBEAT.md
- **Change:** Add "Voice check: Re-read clients/{name}/voice.md every 3 hours"
- **Expected outcome:** Consistent voice across all sessions

### Fix 2 → knowledge_gap
- **Fix type:** workflow_update
- **Action:** Add KB lookup step before answering product questions
- **File:** AGENTS.md
- **Change:** Add rule "Always check clients/{name}/kb/ before answering product/pricing questions"
- **Expected outcome:** Accurate answers on first response
```

### Step 3: Implement Fixes

Execute each fix. Rules:
- **DO:** Update memory files, skill instructions, workflow configs, KB entries
- **DO:** Add items to HEARTBEAT.md for recurring checks
- **DO:** Update TOOLS.md with corrected tool usage
- **DON'T:** Modify SOUL.md without founder approval (propose the change in the report instead)
- **DON'T:** Delete existing skills or configs
- **DON'T:** Change anything that affects other agents (your workspace only)

### Step 4: Coherence Check

After implementing fixes, run the coherence check skill:
- Compare updated files against brand profile
- Verify voice dimensions still match
- Confirm no contradictions between new rules and existing ones
- If drift detected → revert the problematic fix and note it in the report

### Step 5: Commit

```bash
git add -A
git commit -m "self-improvement: {date} — {n} fixes applied"
```

## Morning Report (Cron: 7 AM agent timezone)

### Report Format

```markdown
# 🔧 Self-Improvement Report: {agent_name}
**Date:** {YYYY-MM-DD}
**Client:** {client_name}
**Issues Found:** {n}
**Fixes Applied:** {n}
**Fixes Deferred:** {n} (need founder approval)

---

## ✅ Fixes Applied

### 1. {Short description}
- **Category:** {category}
- **What happened:** {1-2 sentence description of the mistake}
- **What I changed:** {exact file and change}
- **Why this fixes it:** {reasoning}

### 2. {Short description}
...

## ⏳ Proposed Changes (Need Approval)

### 1. {Short description}
- **Category:** {category}
- **Proposed change to:** SOUL.md / shared skill / brand profile
- **Current:** {what it says now}
- **Proposed:** {what it should say}
- **Reasoning:** {why}

## 🔄 Coherence Check Result
- **Status:** ✅ Pass / ⚠️ Warning / ❌ Drift detected
- **Details:** {any notes}

## 📊 Improvement Trends
- **This week's issues:** {n} (↑/↓ from last week)
- **Top category:** {most common issue type}
- **Fix success rate:** {fixes that resolved the issue vs recurring}
```

### Send to HQ

Send the morning report via A2A to Santos (CS agent) for aggregation into the founder morning briefing.

## Cron Setup

Add these two cron jobs during field-onboarding:

### Nightly Review (11 PM agent timezone)
```
name: "Self-Improvement — Nightly Review"
schedule: { kind: "cron", expr: "0 23 * * *", tz: "{agent_timezone}" }
sessionTarget: "isolated"
payload:
  kind: "agentTurn"
  message: |
    Run the self-improvement pipeline nightly review.
    1. Read today's session transcripts
    2. Identify issues using the categories in skills/self-improvement-pipeline/SKILL.md
    3. Create improvement plan
    4. Implement fixes
    5. Run coherence check
    6. Commit changes
    Save the improvement plan to memory/{date}-improvements.md
```

### Morning Report (7 AM agent timezone)
```
name: "Self-Improvement — Morning Report"
schedule: { kind: "cron", expr: "0 7 * * *", tz: "{agent_timezone}" }
sessionTarget: "isolated"
payload:
  kind: "agentTurn"
  message: |
    Generate the self-improvement morning report.
    1. Read memory/{yesterday}-improvements.md
    2. Format as the morning report per skills/self-improvement-pipeline/SKILL.md
    3. Send via A2A to Santos for the founder briefing
```

## Founder Rollout Process

When founders identify a fix that should go to all agents:

1. **Approve the fix** in the morning briefing
2. **Santos pushes the skill/config update** to the shared git repo
3. **Each agent pulls** on next session start or heartbeat
4. **Coherence check runs** on each agent to verify compatibility

## Metrics to Track

Over time, track in `memory/improvement-stats.json`:
```json
{
  "weekOf": "2026-02-17",
  "issuesFound": 12,
  "fixesApplied": 10,
  "fixesDeferred": 2,
  "fixesReverted": 1,
  "topCategory": "knowledge_gap",
  "coherenceScore": 0.92,
  "recurringIssues": ["pricing_questions", "tone_in_complaints"]
}
```

## Integration Points

- **Nightly Report** (`field-admin/nightly-report`): Improvement report supplements the activity report
- **Agentic Learning** (`agentic-learning`): Issues that meet stakes-gating threshold get logged as corrections/insights
- **Coherence Check** (`field-admin/coherence-check`): Runs after every improvement cycle
- **Field Report** (`field-report`): Morning report feeds into the Santos → Founders pipeline

---

_Agents that fix themselves get better every day. Agents that wait to be fixed stay the same._
