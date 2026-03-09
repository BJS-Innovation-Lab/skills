---
name: learning-extraction
description: "Nightly learning extraction and Hive sharing for field agents. Agent reviews their day, logs corrections/insights locally, and shares valuable learnings to Hive Mind."
parent: field-admin
---

# Learning Extraction (Field Agents)

> **You learn. You share. The team gets smarter.**

This cron-triggered skill prompts field agents to review their day, extract learnings, and share the valuable ones to Hive Mind.

## When It Runs

Cron schedule: `0 22 * * *` (10 PM local time, after business hours)

## The Process

### Step 1: Review Your Day

Read today's memory file and look for:
- **Corrections**: Client corrected you, you realized something was wrong
- **Insights**: Pattern you noticed, technique that worked, realization that changes your approach
- **Surprises**: Something unexpected that taught you something

### Step 2: Log Locally

Write to the appropriate file:
```
memory/learning/corrections/YYYY-MM-DD.md
memory/learning/insights/YYYY-MM-DD.md
```

Use this format:
```markdown
## [Short title]
**Context:** What were you doing?
**Learning:** What did you learn?
**Stakes:** low/medium/high
```

### Step 3: Share to Hive Mind

For learnings with **medium or high stakes** that would help OTHER agents:

```bash
cd ~/.openclaw/workspace && AGENT_NAME=$YOUR_NAME node skills/hive-mind/scripts/hive-add.cjs \
  --title "Your title" \
  --content "What you learned and why it matters" \
  --category best-practice
```

**Only share things with real stakes.** Quality over quantity.

### Step 4: Commit

```bash
git add memory/learning/ && git commit -m "learning: $(date +%Y-%m-%d)"
```

## What Makes a Good Hive Entry

| Good for Hive | Keep Local |
|---------------|------------|
| "Client scheduling patterns: insurance clients always ask about quotes on Thursdays" | "Fixed a typo in client's name" |
| "Tool X doesn't work with Spanish characters — use Y instead" | "Learned client prefers morning calls" |
| "Escalation to founders should include suggested action, not just problem" | "Remembered to check calendar before scheduling" |

## Cron Setup

Add this cron job for each field agent:

```yaml
name: "Learning Extraction + Hive Share"
schedule:
  kind: cron
  expr: "0 22 * * *"
  tz: "America/Mexico_City"  # Adjust to client timezone
sessionTarget: isolated
payload:
  kind: agentTurn
  message: |
    📚 LEARNING EXTRACTION + HIVE SHARE
    
    Review what happened today and share anything valuable with the team.
    
    ## Step 1: Review Your Day
    Read today's memory file: memory/$(date +%Y-%m-%d).md
    
    Look for:
    - **Corrections**: Something was wrong, you fixed it
    - **Insights**: A pattern or principle that would help others
    - **Surprises**: Something unexpected that changed your thinking
    
    ## Step 2: Log Locally
    Write to: memory/learning/{corrections,insights}/$(date +%Y-%m-%d).md
    
    Format:
    ```
    ## [Short title]
    **Context:** What were you doing?
    **Learning:** What did you learn?
    **Stakes:** low/medium/high
    ```
    
    ## Step 3: Share to Hive Mind
    For medium/high stakes learnings that would help OTHER agents:
    
    ```bash
    cd ~/.openclaw/workspace && AGENT_NAME=$(cat IDENTITY.md | grep -i 'name:' | head -1 | sed 's/.*: *//' | tr '[:upper:]' '[:lower:]') node skills/hive-mind/scripts/hive-add.cjs --title "Title" --content "Learning" --category best-practice
    ```
    
    Only share things with real stakes. Quality over quantity.
    
    ## Step 4: Commit
    ```bash
    git add memory/learning/ && git commit -m "learning: $(date +%Y-%m-%d)"
    ```
    
    If nothing worth sharing today, reply HEARTBEAT_OK.
  model: sonnet
  timeoutSeconds: 300
delivery:
  mode: none
```

## Integration

This skill is part of the field-admin module. It complements:
- **nightly-report**: Activity summary → HQ
- **learning-extraction** (this): Knowledge sharing → Hive Mind
