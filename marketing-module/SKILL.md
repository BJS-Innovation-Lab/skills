# Marketing Module

> All marketing actions route through here first.

This is the entry point for ALL marketing work. It ensures client profiles exist before any content is created.

## When to Use This Skill

Any request involving:
- Marketing content (emails, social, ads, copy)
- Campaigns or promotions
- Content calendars or scheduling
- Marketing strategy
- Brand messaging

## The Pre-Flight Check (MANDATORY)

Before ANY marketing action, run this check:

### Step 1: Identify the Client

Who is this content for?
- If user says "write a post" → Ask: "For which client/business?"
- If it's for the user's own business → Use their name/business name

### Step 2: Check for Client Profile

```
clients/{client-name}/
├── story.md      # Their oral history
├── voice.md      # How they sound
├── customers.md  # Who they serve
└── learnings.md  # What we've learned
```

**Look for this folder.** All 4 files should exist.

### Step 3: If NO Profile Exists

**STOP. Do not generate generic content.**

Say to user:
> "I don't have a profile for [client] yet. Before I can write content that sounds like YOU (not like anyone), I need to understand your business. 
>
> Can we do a quick 10-15 minute intake? I'll ask about how you started, your best customers, and how you want to sound. Then I'll be able to write content that actually sounds like you."

Then:
1. Load `marketing-creativity` skill
2. Follow the intake interview (14 questions)
3. Create the 4 profile documents
4. Save to `clients/{client-name}/`
5. THEN proceed with the original request

### Step 4: If Profile EXISTS

Before writing anything:
1. **Read story.md** — Understand who they are
2. **Read voice.md** — Know how they sound (check the 4 dimensions)
3. **Read customers.md** — Know who they're talking to
4. **Read learnings.md** — Know what's worked/failed before

Reference these throughout content creation.

---

## Content Creation Flow

Once profile is loaded:

### 1. Ground in Their Story
- What aspect of their origin connects to this content?
- Can you reference a pivotal moment or key quote?

### 2. Match the Voice
- Check the 4 dimensions for this channel
- Use words from "words to use" list
- Avoid words from "words to avoid" list
- Check "This sounds like us" examples

### 3. Speak to Customer Truth
- Which pain point or aspiration are we addressing?
- Use language from customers.md
- Reference their actual phrases

### 4. Apply Creative Techniques
- Generate 2-3 angles (don't just write one)
- Use hooks that match their voice
- Check: Would anyone write this, or does it sound like THEM?

### 5. Anti-Generic Check
Before finalizing, verify:
- [ ] Specific details, not vague claims?
- [ ] Emotional hook in first line?
- [ ] Sounds like the brand's voice?
- [ ] Something surprising or unexpected?
- [ ] Would someone share this? Why?

---

## After Every Campaign

Update `clients/{client-name}/learnings.md`:

```markdown
### {Campaign Name} — {Date}
- **What:** {description}
- **Result:** {metrics or feedback}
- **What worked:** {insight}
- **What didn't:** {insight}
- **Voice refinement:** {if any}
```

**Negative feedback is gold.** It refines faster than praise.

---

## Marketing Sub-Skills

This module connects to:

| Skill | Purpose | Requires Profile? |
|-------|---------|-------------------|
| `marketing-creativity` | Intake, voice, story extraction | Creates the profile |
| `content-creation` | Blog posts, articles | Yes |
| `email-campaigns` | Email sequences, newsletters | Yes |
| `social-scheduler` | Social media content | Yes |
| `ad-copy` | Paid advertising copy | Yes |

**All sub-skills require a client profile.** If one doesn't exist, route back to `marketing-creativity` first.

---

## Quick Reference: The 4 Documents

| Document | Contains | Use For |
|----------|----------|---------|
| `story.md` | Origin, mission, key quotes | Authenticity, "why" messaging |
| `voice.md` | 4 dimensions, examples, boundaries | Tone, word choice |
| `customers.md` | Ideal/worst customers, their language | Targeting, pain points |
| `learnings.md` | What worked/failed | Avoiding past mistakes |

---

## The Golden Rule

> Content should sound like THEM on their best day, not like anyone could have written it.

If you can swap in a competitor's name and it still works, it's too generic. Start over.

---

## Client Folder Structure

```
clients/
├── {client-1}/
│   ├── story.md
│   ├── voice.md
│   ├── customers.md
│   └── learnings.md
├── {client-2}/
│   ├── story.md
│   ├── voice.md
│   ├── customers.md
│   └── learnings.md
└── ...
```

Create this structure for each new client after intake interview.
