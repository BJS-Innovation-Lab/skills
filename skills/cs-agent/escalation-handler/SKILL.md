---
name: escalation-handler
description: Receive, triage, and resolve escalations from field agents. Route to founders when needed. Track resolution times.
metadata: {"openclaw":{"emoji":"🚨"}}
---

# Escalation Handler

> **Field agents ask for help. You provide it — or find someone who can.**

## Incoming Escalation Format

Field agents send escalations via A2A with this structure:

```markdown
## 🚨 Escalation: {client_name}
**Agent:** {agent_name}
**Time:** {timestamp}
**Level:** 🔴 NOW
**Trigger:** {trigger #}

### What Happened
### Customer's Exact Words
### What I Tried
### Last 5 Messages
```

## Triage Process

### 🔴 NOW Escalations

**You have 5 minutes.** Follow this exact sequence:

1. **Read the full escalation.** Don't skim.
2. **Classify the issue:**

| Category | Examples | Action |
|----------|---------|--------|
| **Customer angry** | Complaints, threats to cancel | Respond to field agent with de-escalation script. If severe → alert Johan. If owner writes in directly → handle personally with warmth. |
| **Agent broken** | Skill errors, API failures, tool down | Check if it's a known issue. Fix if you can. If not → alert Sage (tech). |
| **Agent confused** | Doesn't know how to proceed | Provide clear instructions back to field agent. |
| **Promise overreach** | Agent agreed to something impossible | Tell field agent what to say to walk it back honestly. Alert Johan if customer impact is high. |
| **Customer wants human** | Explicit request | Route to Johan immediately. This is non-negotiable. |
| **Owner writes in** | Direct message from business owner | Top priority. Respond personally, warmly, in their language. Don't expose internal systems. |

3. **Respond to the field agent** with one of:
   - ✅ **Resolution:** "Do this: {specific instructions}"
   - ⏳ **Acknowledgment:** "Got it, working on it. Tell the customer: {script}"
   - 🔀 **Routing:** "Sending this to Johan/Sage. Stand by."

4. **Log the escalation** in `escalations/YYYY-MM-DD.md`

### 📋 TONIGHT Escalations (from nightly reports)

These come bundled in nightly reports. Process them during your morning review:
- Feature requests → log to `feature-requests.md`, batch for weekly founder briefing
- Churn signals → flag in agent-health dashboard
- Upsell opportunities → note for Saber (sales)

## Escalation Response Templates

### Customer is angry
Send to field agent:
> Tell the customer: "I completely understand your frustration, and I'm sorry for the trouble. I've brought in our team to make this right. {Johan/someone} will reach out to you within {timeframe}."

### Agent promised something impossible
Send to field agent:
> Tell the customer: "I want to be straight with you — I got ahead of myself on that one. That's not something we can do right now, but here's what we CAN do: {alternative}. I've also flagged this with our team so we can work on adding that capability."

### Tool/skill is broken
1. Check if other field agents have the same issue (systemic vs isolated)
2. If systemic → alert Sage immediately
3. Send to field agent:
> "Known issue — we're working on a fix. In the meantime, {workaround or 'let the customer know we'll have this resolved by X'}."

### Customer wants a human
Send to Johan immediately:
> "🔴 Customer at {client_name} is requesting human contact. Context: {summary}. Customer's words: '{exact quote}'. Field agent is standing by."

## Escalation Log Format

Keep a running log at `escalations/YYYY-MM-DD.md`:

```markdown
## {timestamp} — {client_name} — 🔴/{📋}

**Agent:** {name}
**Trigger:** {#}
**Category:** {angry/broken/confused/overreach/human}
**Summary:** {1-2 sentences}
**Resolution:** {what was done}
**Time to resolve:** {minutes}
**Follow-up needed:** Yes/No — {details}
```

## Metrics to Track

| Metric | Target | Why |
|--------|--------|-----|
| Response time (🔴 NOW) | < 5 min | Angry customers won't wait |
| Resolution rate (same day) | > 90% | Most issues should be fixable fast |
| Escalations per agent per week | Watch for trends | Sudden spike = something wrong |
| Repeat escalations (same issue) | 0 | If it happens twice, fix the root cause |

## Writing Learnings to BJS Knowledge Base

**After every resolved escalation**, evaluate whether the fix is reusable. If yes, write it to the `bjs_knowledge` table in Supabase so future field agents can self-serve instead of escalating.

### When to Write

| Write to KB? | Situation |
|-------------|-----------|
| ✅ **Yes** | You gave a field agent specific instructions that worked |
| ✅ **Yes** | You found a workaround for a tool/skill issue |
| ✅ **Yes** | You wrote a de-escalation script that resolved a customer situation |
| ✅ **Yes** | You discovered a procedure that wasn't documented |
| ❌ **No** | One-off issue specific to one customer (not generalizable) |
| ❌ **No** | Issue requires Sage/founder intervention (not self-servable) |
| ❌ **No** | Already exists in the knowledge base |

### How to Write

Use the `bjs-knowledge-write.cjs` tool (or direct Supabase API):

```bash
node rag/bjs-knowledge-write.cjs \
  --title "How to handle customer requesting refund" \
  --content "When a customer asks for a refund: 1) Acknowledge their frustration. 2) Ask what went wrong. 3) Offer to fix it first. 4) If they insist, route to Johan — agents cannot authorize refunds." \
  --category "escalation" \
  --tags "customer-angry,refund,routing" \
  --created-by "Sam"
```

### Categories

| Category | Use For |
|----------|---------|
| `procedure` | Step-by-step instructions for tasks |
| `best-practice` | Lessons learned from real escalations |
| `template` | Response templates that worked |
| `skill-doc` | How to use a specific tool or skill |
| `escalation` | When/how to escalate specific issue types |
| `tool-guide` | Error fixes, workarounds, gotchas |

### Entry Format

Keep entries concise and actionable. Field agents will see these during live conversations — they need answers fast, not essays.

```markdown
**Title:** Clear, searchable description of the problem/solution
**Content:** 
1. What the problem looks like (symptoms)
2. What to do (step-by-step)
3. What NOT to do (common mistakes)
4. When to escalate anyway
**Tags:** Relevant keywords for semantic search
```

### The Loop This Closes

```
Field agent hits problem
    → Escalates to Sam (CS)
        → Sam resolves it
            → Sam writes fix to bjs_knowledge
                → Next field agent queries bjs_knowledge
                    → Self-serves without escalating
```

**Goal:** Every escalation that happens twice is a failure. The first time is learning; the second time means we didn't capture the fix.

## Rules

1. **Never ignore a 🔴 NOW.** Even if you're busy. Acknowledge within 5 minutes.
2. **Always respond to the field agent** — even if it's just "got it, working on it."
3. **Customer-wants-human is sacred.** Route to Johan. Don't try to fix it yourself.
4. **Log everything.** If it's not logged, it didn't happen.
5. **Spot patterns.** If 3 agents hit the same issue this week, it's not an agent problem — it's a system problem. Escalate to Sage.
6. **Write reusable fixes to BJS Knowledge Base.** Every resolved escalation is a potential KB entry. If the fix could help another agent, write it.
