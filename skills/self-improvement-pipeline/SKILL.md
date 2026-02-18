---
name: self-improvement-pipeline
description: "Nightly self-improvement pipeline for field agents. Agent reviews transcripts, identifies mistakes, auto-applies safe fixes, and sends proposals for risky changes to founders for approval. One job, no morning phase needed."
metadata:
  category: operations
  tags: [self-improvement, pipeline, field-agent, nightly, automation]
  openclaw:
    emoji: "🔧"
---

# Self-Improvement Pipeline

> **Fix what's safe. Propose what's not. Founders approve before morning.**

## Overview

A single nightly job where each field agent:
1. Reviews the day's transcripts and identifies mistakes
2. **Auto-applies safe fixes** (additive knowledge, memory, checklists)
3. **Sends proposals** for risky fixes to founders for approval
4. Founders check off approvals whenever they see them (night or morning)
5. Agent implements approved changes on next run

No morning report phase needed — everything happens in one pass.

## Two-Tier Fix System

### Tier 1: Auto-Apply (No Approval Needed)

These are **additive, low-risk** changes that can't break anything:

| Fix Type | Example |
|----------|---------|
| Add knowledge to memory | Fill a pricing gap in `memory/core/products.md` |
| Add checklist items to HEARTBEAT.md | "Check voice.md before composing" |
| Update TOOLS.md notes | Correct a tool usage pattern |
| Add entries to knowledge base | New FAQ answer in `clients/{name}/kb/` |
| Log corrections/insights | Via agentic-learning system |

**Rule: If it only ADDS information and doesn't change behavior logic, auto-apply it.**

### Tier 2: Propose-and-Wait (Needs Founder Approval)

These change **how the agent behaves** and need a human check:

| Fix Type | Example |
|----------|---------|
| Skill logic changes | Modifying workflow steps in a SKILL.md |
| SOUL.md updates | Adjusting personality or behavioral rules |
| Brand profile changes | Updating voice dimensions or tone |
| AGENTS.md workflow changes | Changing when/how the agent does things |
| Shared skill modifications | Anything other agents also use |
| Deleting or replacing content | Removing existing rules or procedures |

**Rule: If it changes behavior, the agent proposes — founders decide.**

---

## Nightly Job Process

### Step 1: Review Transcripts

Read these for today's activity:
- `memory/YYYY-MM-DD.md` — daily activity log
- `memory/learning/corrections/` — corrections received today
- `memory/learning/insights/` — insights logged today
- Session transcripts (via `sessions_history` if available)

### Step 2: Identify Issues

Look for:

| Category | Signal |
|----------|--------|
| **Mistakes** | User corrections, failed tasks, wrong outputs |
| **Missed Knowledge** | Had the info but didn't use it |
| **Capability Gaps** | Requests the agent couldn't handle |
| **Drift** | Behavior diverging from SOUL.md or brand profile |
| **Process Failures** | Workflows that broke or were skipped |

For each issue, identify root cause:
- Knowledge gap → Tier 1 fix (add to memory)
- Skill/workflow bug → Tier 2 fix (propose change)
- Missing procedure → Tier 2 fix (propose new workflow)
- Behavioral drift → Tier 2 fix (propose SOUL.md update)
- Config issue → Tier 1 or 2 depending on scope

### Step 3: Apply Tier 1 Fixes

Implement all safe, additive fixes immediately:
- Git commit each change: `[self-improvement] <description>`
- Log in `memory/improvement-logs/YYYY-MM-DD.md`

### Step 4: Send Tier 2 Proposals to Founders

Send a **full nightly report** to founders covering BOTH tiers — so founders can review everything and decide what to roll out to other agents.

```markdown
🔧 **Nightly Improvement Report — {agent_name} ({date})**

**Issues found:** {n} | **Auto-applied:** {n} ✅ | **Needs approval:** {n} ⏳

---

## ✅ Tier 1 — Auto-Applied (Safe Fixes)

### 1. {Short description}
- **What went wrong:** {1-2 sentences}
- **Fix applied:** {file} — {what changed}
- **Git commit:** {hash}
- **🚀 Recommend for all agents?** Yes / No — {why}

### 2. {Short description}
...

## ⏳ Tier 2 — Proposals (Needs Your Approval)

### 1. {Short description}
- **What went wrong:** {1-2 sentences}
- **Proposed change:** {file} — {what to change}
- **Current:** {what it says now}
- **Proposed:** {what it should say}
- **Why:** {reasoning}
- **🚀 Recommend for all agents?** Yes / No — {why}

### 2. {Short description}
...

## 🔄 Coherence Check
- **Identity alignment:** ✅/❌
- **Brand voice:** ✅/❌
- **Regressions:** None / {details}

## 📊 Patterns
{Recurring issues, or "No patterns yet — first day of tracking"}
```

Use inline buttons for Tier 2 approvals:
```
buttons: [[{text: "✅ Approve All", callback_data: "approve_all_improvements"}, {text: "❌ Review First", callback_data: "review_improvements"}]]
```

**Key:** Each fix (Tier 1 and Tier 2) includes a "Recommend for all agents?" flag. This helps founders quickly spot fixes worth rolling out team-wide vs. fixes that are agent-specific.

### Step 5: Coherence Check

After implementing Tier 1 fixes:
1. Re-read SOUL.md — do changes align with identity?
2. Re-read brand profile — do changes maintain voice?
3. Check for contradictions with existing rules
4. If regression detected → revert and move to Tier 2 proposal

### Step 6: Commit & Log

```bash
git add -A
git commit -m "[self-improvement] {date} — {n} auto-fixes, {n} proposals sent"
```

Write full log to `memory/improvement-logs/YYYY-MM-DD.md` using the template.

---

## Handling Founder Responses

When a founder approves a proposal:
1. Implement the change
2. Run coherence check
3. Git commit with `[self-improvement] approved: <description>`
4. Confirm to founder: "✅ Implemented: {description}"

When a founder rejects:
1. Log the rejection and reason in improvement log
2. Don't implement — mark as closed
3. Confirm: "Got it, won't make that change."

Unchecked proposals after 48 hours → remind founders once, then archive.

---

## Cron Setup

One cron job per field agent, added during onboarding:

```bash
openclaw cron add \
  --cron "0 23 * * *" \
  --tz "{agent_timezone}" \
  --session isolated \
  --name "Self-Improvement: Nightly Review" \
  --message "Run self-improvement pipeline:
1. Read today's memory/YYYY-MM-DD.md and memory/learning/ entries
2. Review session transcripts for mistakes, corrections, missed opportunities
3. For each issue: classify as Tier 1 (safe/additive) or Tier 2 (behavioral change)
4. Auto-apply all Tier 1 fixes, git commit each one
5. Send Tier 2 proposals to founders with reasoning
6. Run coherence check on all Tier 1 changes
7. Write improvement log to memory/improvement-logs/YYYY-MM-DD.md
8. Do NOT publish to ClawHub. Push to our git repos only.
Follow skills/self-improvement-pipeline/SKILL.md strictly."
```

No morning cron needed — founders see proposals whenever they check messages.

---

## Improvement Log Format

Write to `memory/improvement-logs/YYYY-MM-DD.md`:

```markdown
# Improvement Log — YYYY-MM-DD

## Issues Found: {n}

### 1. {Short description}
- **What happened:** {description}
- **Root cause:** knowledge-gap | skill-bug | missing-procedure | drift | config | capability-gap
- **Evidence:** {quote or reference}

## Tier 1 Fixes Applied: {n}

### 1. {Short description}
- **File changed:** {path}
- **What changed:** {description}
- **Git commit:** {hash}

## Tier 2 Proposals Sent: {n}

### 1. {Short description}
- **Proposed change to:** {file}
- **Status:** pending | approved | rejected
- **Founder response:** {when received}

## Coherence Check
- **Identity alignment:** ✅/❌
- **Brand voice:** ✅/❌
- **Regressions:** none | {list}
```

---

## Integration

| System | Connection |
|--------|-----------|
| **agentic-learning** | Reads corrections/insights as input |
| **nightly-report** | Runs AFTER nightly-report — uses it as input |
| **coherence-check** | Validates all changes post-fix |
| **field-report** | Improvement data flows into Santos pipeline |

### Recommended Cron Order
```
10:00 PM — nightly-report (compile day's activity)
11:00 PM — self-improvement (review + fix + proposals)
```

---

## Rules

1. **Run every night.** Even if nothing went wrong.
2. **Be honest.** Don't hide mistakes.
3. **Tier 1 = additive only.** If in doubt, make it Tier 2.
4. **Always coherence-check.** Never ship without verifying.
5. **No ClawHub.** Git repos only.
6. **Git commit everything.** Founders must see exact diffs.
7. **Silence is scary.** Always send something, even "no issues found today."

---

## File Structure

```
memory/improvement-logs/
└── YYYY-MM-DD.md              # Nightly improvement logs

skills/self-improvement-pipeline/
├── SKILL.md                   # This file
└── templates/
    ├── improvement-log.md     # Template for nightly logs
    └── morning-report.md      # Template for proposals message
```
