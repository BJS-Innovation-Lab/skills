---
name: coherence-check
description: Closed-loop coherence verification for field agents. Detects behavioral drift, verifies learnings are applied, and compares outputs against brand profile and SOUL.md. Based on coherence debt theory (Mikkilineni 2026).
metadata: {"openclaw":{"emoji":"🔄"}}
---

# Coherence Check

> **Learning something and actually changing are two different things. This skill verifies the change happened.**

## The Problem: Coherence Debt

Agents accumulate "coherence debt" — the gap between how they SHOULD behave (brand profile, SOUL.md, logged learnings) and how they ACTUALLY behave. Without active checking, agents slowly drift:
- Social posts get more generic over time
- Voice match declines as the agent "forgets" the brand
- Logged learnings sit in files but never change behavior
- SOUL.md says one thing, agent does another

This skill pays down that debt through continuous verification.

Reference: Mikkilineni (2026) "Comparing Agentic AI with Mindful Machine Implementations" — coherence as a structural requirement, not an afterthought.

---

## Critical: Drift vs Evolution

**Not all change is bad.** The brand profile is a LIVING document, not a constitution.

| | Drift (bad) | Evolution (good) |
|---|------------|------------------|
| **Source** | Agent forgetting or getting lazy | Owner feedback, customer language, results data |
| **Direction** | Toward generic/template | Toward more specific/authentic |
| **Owner aware?** | No — happens silently | Yes — driven by their input or approved |
| **Action** | Correct back to profile | UPDATE the profile |

### How Brand Evolution Happens Naturally

The agent should update brand docs when:

1. **Owner gives voice feedback** — "I love that tone" / "Too formal" / "More like this" → update voice.md dimensions and log the shift
2. **Customer language evolves** — new phrases, new ways of describing the product → add to customers.md
3. **Results show a pattern** — casual posts get 3x engagement → propose voice.md update to owner: "Data suggests shifting Funny↔Serious from 40 to 30. Want to try it?"
4. **Business pivots** — new product, new market, new values → trigger a mini-intake (3-5 questions, not full 14)

### The Rule
- **Agent detects a change → proposes update → owner approves → profile evolves**
- The agent NEVER silently updates the brand profile. Always ask.
- Log every profile change in the document's changelog with date and reason.

### In the Coherence Check
When scoring voice match, the check should ask:
- "Is this deviation moving toward generic (drift) or toward something more specific and authentic (evolution)?"
- If evolution: flag it as a **profile update opportunity**, not a violation
- If drift: flag it as a correction needed

---

## Four Checks

### 1. Voice Drift Check (Weekly)

**What:** Compare recent content against the brand profile.

**Process:**
1. Read `clients/{client}/voice.md` — extract key dimensions, words to use/avoid, personality
2. Pull the last 7 days of content created (from `content-log` or `memory/YYYY-MM-DD.md`)
3. Score each piece against voice.md:
   - Does it use preferred words? Avoid banned words?
   - Does the tone match the personality dimensions?
   - Would the business owner recognize this as "their voice"?
4. Calculate a **voice match score** (0-100%)
5. Compare to previous week's score

**Output:**
```markdown
## 🔄 Voice Drift Report — {date}

**Client:** {name}
**Content reviewed:** {n} pieces from last 7 days
**Voice match:** {score}% (last week: {prev_score}%)
**Trend:** ⬆️ Improving / ➡️ Stable / ⬇️ Drifting

### Matches ✅
- Post on Feb 12: "Works with you, not for you" — perfect brand alignment
- Email subject: warm, specific, not corporate

### Drift Detected ⚠️
- Post on Feb 14: Used "automate" (banned word)
- Email body: tone shifted formal — sounds like template, not {client}

### Recommendation
{Specific action to correct drift}
```

**Thresholds:**
| Score | Status | Action |
|-------|--------|--------|
| 80-100% | ✅ On brand | Keep going |
| 60-79% | ⚠️ Drifting | Re-read voice.md before next content batch |
| Below 60% | 🔴 Off brand | Stop creating content. Re-run creativity engine. Alert CS agent. |

---

### 2. Learning Verification (Bi-weekly)

**What:** Check if logged learnings actually changed behavior.

**Process:**
1. Read `.learnings/LEARNINGS.md` or `clients/{client}/learnings.md` — get all learnings from the past 2 weeks
2. For each learning, find a RECENT situation where it should have applied
3. Check: did the agent act differently than before the learning?

**Example:**
```markdown
## Learning: "Customer prefers casual tone in WhatsApp" (logged Feb 10)

**Test:** Reviewed 5 WhatsApp messages since Feb 10
**Result:** ✅ APPLIED — tone shifted from formal to casual after Feb 10
**Evidence:** "Hola! Ya tienes listos los posts" vs previous "Buenos días, adjunto los posts para su revisión"
```

```markdown
## Learning: "Don't use exclamation marks in email subject lines" (logged Feb 8)

**Test:** Reviewed 3 email subjects since Feb 8  
**Result:** ❌ NOT APPLIED — 2 of 3 subjects still had exclamation marks
**Action:** Add to SOUL.md as hard rule, not just a learning
```

**If a learning isn't being applied:**
1. First time: promote from learnings.md to SOUL.md or AGENTS.md (stronger enforcement)
2. Second time: add to a pre-flight checklist (procedural enforcement)
3. Third time: escalate to CS agent — the agent may need skill-level changes

---

### 3. Identity Coherence (Monthly)

**What:** Is the agent still acting like its SOUL.md says it should?

**Process:**
1. Read SOUL.md — extract identity traits, values, behaviors
2. Sample 20 interactions from the past month
3. Score each interaction against SOUL.md traits:
   - Does the agent's personality match what SOUL.md describes?
   - Are the stated values reflected in actual decisions?
   - Has the agent developed behaviors NOT described in SOUL.md (emergent or drift)?

**Output:**
```markdown
## 🪞 Identity Coherence Report — {month}

**SOUL.md says:** "Warm, casual, makes eye contact"
**Actual behavior:** 85% match — slightly more formal in email than personality suggests

**SOUL.md says:** "Never promises what it can't deliver"
**Actual behavior:** 100% match — escalated twice when unsure instead of guessing

**Emergent behavior (not in SOUL.md):**
- Agent started using emojis heavily (not specified in SOUL.md) — is this drift or natural evolution?
- Agent became more proactive about suggesting content themes — positive emergence

**Recommendation:** Add emoji usage guidelines to voice.md. Keep proactive suggestions — it's good behavior.
```

---

### 4. Brand Evolution Check (Weekly, alongside Voice Drift)

**What:** Identify moments where the brand profile should be UPDATED, not enforced.

**Process:**
1. Review the week's owner interactions — look for voice feedback, tone corrections, new preferences
2. Review customer language — any new phrases or ways of describing the product?
3. Review content performance — which pieces got the best engagement? What's the pattern?
4. Compare: does the current voice.md still match where the owner is heading?

**Output:**
```markdown
## 🌱 Brand Evolution Report — {date}

### Owner Signals
- Owner said "I love how casual that WhatsApp message was" (Feb 12) → voice.md Casual↔Formal may need adjusting from 30 to 25
- Owner rejected a formal email subject line twice this week → pattern, not one-off

### Customer Language
- New phrase from customers: "mi compañero digital" (my digital partner) → add to customers.md
- 3 customers used "tranquilidad" when describing the product → matches Johan's "socio estratégico" framing

### Performance Data
- Posts with emojis: 2.5x engagement vs without → consider adding emoji guidelines to voice.md
- Spanish-only posts outperformed bilingual 3:1 → market signal

### Proposed Profile Updates
1. **voice.md** — Shift Casual↔Formal from 30 → 25 (owner keeps pushing more casual)
2. **customers.md** — Add "mi compañero digital" to customer language section
3. **voice.md** — Add emoji usage guidelines (currently not mentioned)

**⚠️ These are proposals. Send to owner for approval before updating.**
```

**The approval flow:**
1. Agent compiles proposals
2. Sends to owner via preferred channel: "Hey! Based on this week, I think our brand voice is evolving. Here are 3 small updates I'd suggest. Want me to make them?"
3. Owner approves/rejects/modifies
4. Agent updates the docs and logs the change

This keeps the brand alive without the agent going rogue.

---

## Cron Setup

```javascript
// Voice drift check — every Monday 9 AM client timezone
{
  "name": "Coherence: Voice Drift - {client}",
  "schedule": { "kind": "cron", "expr": "0 9 * * 1", "tz": "{client_timezone}" },
  "payload": {
    "kind": "agentTurn",
    "message": "Run coherence-check voice drift. Compare last week's content against clients/{client}/voice.md. Report results.",
    "timeoutSeconds": 120
  },
  "sessionTarget": "isolated"
}

// Learning verification — 1st and 15th of each month
{
  "name": "Coherence: Learning Verification - {client}",
  "schedule": { "kind": "cron", "expr": "0 10 1,15 * *", "tz": "{client_timezone}" },
  "payload": {
    "kind": "agentTurn",
    "message": "Run coherence-check learning verification. Check if recent learnings are being applied in practice.",
    "timeoutSeconds": 120
  },
  "sessionTarget": "isolated"
}

// Identity coherence — 1st of each month
{
  "name": "Coherence: Identity Check - {client}",
  "schedule": { "kind": "cron", "expr": "0 10 1 * *", "tz": "{client_timezone}" },
  "payload": {
    "kind": "agentTurn",
    "message": "Run coherence-check identity. Sample 20 interactions and compare against SOUL.md traits.",
    "timeoutSeconds": 180
  },
  "sessionTarget": "isolated"
}
```

## Integration with Other Skills

| Skill | How Coherence-Check Connects |
|-------|------------------------------|
| `nightly-report` | Voice drift score included in weekly summary |
| `escalation` | 🔴 Off-brand score triggers auto-escalation to CS agent |
| `self-improving-agent` | Verifies that captured learnings actually changed behavior |
| `content-log` | Reads content history for voice comparison |
| `creativity-engine` | Re-triggered when drift score drops below 60% |

## The Closed Loop

```
Agent creates content
    ↓
coherence-check scores it against brand profile
    ↓
Drift detected? → Log learning + specific correction
    ↓
Next content cycle
    ↓
coherence-check verifies: did the correction stick?
    ↓
YES → score improves, continue
NO → escalate enforcement (learnings → SOUL.md → checklist → CS agent)
```

This is the difference between "we logged it" and "we fixed it."

## Rules

1. **Run the checks on schedule.** Don't skip because "things seem fine." Drift is invisible until it's not.
2. **Be specific in drift reports.** "Tone is off" is useless. "Used 'automate' (banned word) in Feb 14 post" is actionable.
3. **Escalate enforcement gradually.** Learning → SOUL.md → checklist → CS agent. Don't jump to maximum enforcement for a first offense.
4. **Emergent behavior isn't always bad.** If the agent develops a positive habit not in SOUL.md, add it to SOUL.md. Evolution is good. Drift is bad. Know the difference.
5. **Report to CS agent.** Voice drift scores go in the nightly report aggregation so HQ sees trends across all clients.
