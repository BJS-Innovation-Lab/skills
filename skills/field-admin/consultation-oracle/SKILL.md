---
name: consultation-oracle
description: Triggers and routing for field agents to consult the Frontier Lab when uncertain. Unlike escalation (crisis mode), this is for "I'm not sure" moments before they become problems.
metadata: {"openclaw":{"emoji":"🔮"}}
---

# Consultation Oracle

> **Ask before you guess.**

## Escalation vs Consultation

| | Escalation 🚨 | Consultation 🔮 |
|---|---|---|
| **When** | Crisis — customer upset, something broke | Uncertainty — not sure what's right |
| **Urgency** | Immediate | Before you respond |
| **Who** | Customer Service agent | Frontier Lab (expert agents) |
| **Customer knows?** | Yes — "connecting you with our team" | No — happens in background |
| **Goal** | Damage control | Get it right the first time |

---

## Automatic Triggers

These fire when you **sense uncertainty** — before it becomes a problem.

### 🔮 CONSULT — Ask the Lab First

| # | Trigger | How to Detect |
|---|---------|---------------|
| 1 | **You're about to hedge** | Catching yourself writing "I think...", "maybe...", "I believe...", "probably..." |
| 2 | **First time seeing this request type** | Nothing similar in your memory. Novel situation. |
| 3 | **High-stakes decision** | Anything involving: pricing, refunds, contracts, legal, compliance, money |
| 4 | **Customer question you can't fully answer** | You know *part* of the answer but not all of it |
| 5 | **Conflicting information** | Your training says X but customer is saying Y |
| 6 | **Multi-step process you haven't done before** | Customer wants something that requires steps you're unsure about |

### When NOT to Consult

- Routine requests you've handled many times
- Simple factual questions you're confident about
- Customer just chatting/greeting
- Anything in your established playbook

---

## The Consultation Flow

```
1. Customer asks something
2. You notice a trigger firing (uncertainty, novelty, stakes)
3. PAUSE — don't respond to customer yet
4. Send consultation request to Frontier Lab
5. Wait for response (timeout: 60 seconds)
6. Incorporate advice into your response
7. Respond to customer
8. Log the consultation
```

**What to tell the customer while waiting:**
> "Let me check on that for you — one moment."

Keep it natural. Don't say "consulting my AI colleagues."

---

## Consultation Request Format

Send to Frontier Lab via A2A:

```markdown
## 🔮 Consultation Request

**Agent:** {your_name}
**Client:** {client_name}
**Time:** {timestamp}
**Trigger:** {which trigger # fired}

### Customer's Request
> "{exact words}"

### What I Think the Answer Is
{your best guess — or "I don't know"}

### What I'm Uncertain About
{specific questions}

### Context
{relevant background — what does this customer do, recent history}
```

**Rules:**
- **Include your best guess** — even if wrong, it helps the oracle understand your thinking
- **Be specific about uncertainty** — "I don't know if we can do refunds" is better than "I'm confused"
- **Keep context brief** — 2-3 sentences max

---

## Frontier Lab Routing

| Domain | Expert Agent | When to Route |
|--------|--------------|---------------|
| Sales, pricing, upsells | Saber | Money questions, negotiations, deals |
| Technical, integrations | Sage | API issues, technical setup, bugs |
| Operations, process | Santos | Workflow questions, procedures |
| UX, customer experience | Sam | Interface issues, user confusion |
| Research, edge cases | Sybil | Novel situations, unusual requests |

If unsure who to ask, send to **Sybil** — she'll route appropriately.

---

## Response Handling

When you get a response from the Lab:

1. **Read the full response** before replying to customer
2. **Don't copy-paste** — adapt to your voice and context
3. **If you disagree**, you can deviate but log why
4. **If no response in 60 seconds**, use your best judgment + log that you didn't get help

---

## Integration with Emotional Triggers

This skill connects to the emotional memory system:

- **😕 Confusion** → Consultation trigger
- **🆕 Novelty** → Consultation trigger  
- **⚠️ Stakes** → Consultation trigger
- **😤 Frustration** (2+ failures) → Escalation, not consultation

The difference: consultation is **before** things go wrong. Frustration is **after** something failed.

---

## Logging

Every consultation gets logged to your nightly report:

```markdown
### Consultations Today

| Time | Trigger | Question | Oracle | Outcome |
|------|---------|----------|--------|---------|
| 14:32 | Stakes (pricing) | Bulk discount request | Saber | Got approval for 15% |
| 16:45 | Novelty | Integration question | Sage | Learned it's not supported |
```

This helps HQ understand what field agents need help with → informs training.

---

## Self-Check Prompt

Before responding to any non-trivial customer request, ask yourself:

> "Am I about to hedge? Is this new? Are stakes high? Do I know the full answer?"

If yes to any → consult first.

**A consultation that feels unnecessary is still better than a confident wrong answer.**
