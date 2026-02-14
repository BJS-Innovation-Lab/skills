---
name: escalation
description: When and how field agents contact the customer service agent. Severity levels, auto-triggers, and message formatting for clean handoffs.
metadata: {"openclaw":{"emoji":"🚨"}}
---

# Escalation Skill

> **Ask for help before things go wrong, not after.**

## Why This Matters

Research on AI-human teams shows two dangerous patterns:
1. **Agents under-escalate** — status dynamics make agents downplay problems when reporting "up" (Status Hierarchies in LMs, 2026)
2. **Agents over-agree** — agents may promise things they can't deliver to avoid conflict (Selective Agreement, EPJ 2025)

This skill uses **automatic triggers** instead of relying on the agent's judgment about when to ask for help. If the signal fires, you escalate. No debate.

---

## Two Levels Only

| Level | When | Action |
|-------|------|--------|
| 🔴 **NOW** | Customer upset, agent stuck, something broke | Send escalation immediately. Tell the customer help is coming. |
| 📋 **TONIGHT** | Feature request, observation, opportunity | Include in nightly report. No immediate action. |

That's it. No "medium." If you're wondering whether it's NOW or TONIGHT — it's NOW.

---

## Automatic Triggers (Not Optional)

These fire whether or not you think escalation is needed. If the condition is true, you escalate.

### 🔴 NOW — Escalate Immediately

| # | Trigger | How to Detect |
|---|---------|---------------|
| 1 | **Customer uses negative language** | "frustrated," "useless," "cancel," "doesn't work," "hate," angry tone, ALL CAPS, excessive punctuation |
| 2 | **Same task fails twice** | You attempted the same action and it errored or produced wrong results 2x |
| 3 | **Customer asks to talk to a human** | Any variation: "let me talk to someone," "is there a real person," "I need help" |
| 4 | **You agreed to something you can't do** | You said "yes" or "sure" to a request, then realized you don't have the skill or access. This is the anti-sycophancy trigger — catch yourself. |
| 5 | **You're not sure what to do** | You've re-read the request and still don't know how to proceed. Don't guess — escalate. |
| 6 | **Critical tool is broken** | Email won't send, API returning errors, channel disconnected |

### 📋 TONIGHT — Include in Nightly Report

| # | Trigger | Example |
|---|---------|---------|
| 1 | **Customer asks for something outside your skills** | "Can you manage my Google Ads?" |
| 2 | **Customer hasn't engaged in 5+ days** | No messages, no tasks — possible churn |
| 3 | **You notice an upsell opportunity** | Customer needs more than current plan |
| 4 | **Routine weekly check-in** | "Everything is fine" — confirms you're active |

---

## What to Say to the Customer

**🔴 NOW situations:**
> "I want to make sure this gets handled right. I'm connecting you with our team — someone will follow up shortly."

That's it. Don't over-explain. Don't apologize five times. Don't try to fix it yourself after deciding to escalate.

**Customer asks for a human:**
> "Of course. Let me connect you now."

Never argue. Never say "but I can help with that." They asked for a person — give them a person.

---

## Escalation Message Format

Send this to the customer service agent. **The structure prevents you from softening bad news.**

```markdown
## 🚨 Escalation: {client_name}

**Agent:** {your_name}
**Time:** {timestamp}
**Level:** 🔴 NOW
**Trigger:** {which trigger # fired}

### What Happened
{2-3 sentences. Facts only.}

### Customer's Exact Words
> "{copy-paste what they said — do not paraphrase}"

### What I Tried
- {action 1}
- {action 2}

### Last 5 Messages
{paste the conversation}
```

**Rules for this message:**
- **"Customer's Exact Words" is mandatory.** Do not summarize. Do not soften. Copy-paste.
- **"What I Tried" must be honest.** If you tried nothing, say "Nothing — I wasn't sure how to proceed."
- **Do not include your opinion on what should happen.** Just report. Let the CS agent decide.

---

## How to Send

```bash
cd ~/.openclaw/workspace/skills/a2a-protocol && \
./scripts/daemon-send.sh {CS_AGENT_ID} \
'{"message":"<escalation report>","subject":"🚨 {client_name} - NOW","priority":"high"}' \
--type message
```

Replace `{CS_AGENT_ID}` with the value from `config/field-admin.json`.

---

## Rules

1. **If a trigger fires, you escalate.** No exceptions. No "but I think I can handle it."
2. **Copy-paste customer words.** Research shows agents instinctively soften negative feedback when reporting up. Don't.
3. **Never lie to the customer.** Don't say "I can do that" if you can't. Escalate instead.
4. **Never argue with an upset customer.** Acknowledge → escalate → done.
5. **Log every escalation in your nightly report** — even if resolved same-day.
6. **A false alarm is always better than a lost customer.**
