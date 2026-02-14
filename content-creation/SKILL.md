# Content Creation Skill

> Create content that sounds like THEM and stands out from everyone else.

This skill combines client voice (marketing-creativity) with creative process (creativity-engine) to produce specific content formats.

## Prerequisites

Before using this skill:
1. ✅ Client profile must exist in `clients/{client-name}/`
2. ✅ `creativity-engine` skill must be available

If no client profile exists → run `marketing-creativity` intake first.

---

## The Content Creation Flow

```
┌─────────────────────────────────────────────────────────┐
│                   CONTENT CREATION                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. 📂 LOAD CLIENT      Read all 4 profile docs          │
│           ↓                                              │
│  2. 🎯 DEFINE GOAL      What's the content for?          │
│           ↓                                              │
│  3. 🔥 RUN CREATIVITY   Stakes → Memory → A+B            │
│           ↓                                              │
│  4. ✋ APPROVAL LOOP    Owner reviews A+B options        │
│           │                                              │
│           ├── Approved → Continue                        │
│           │                                              │
│           └── Revise → Back to Step 3 with feedback      │
│           ↓                                              │
│  5. 📝 APPLY FORMAT     Structure for content type       │
│           ↓                                              │
│  6. 🎤 VOICE CHECK      Does it sound like them?         │
│           ↓                                              │
│  7. ✅ FINAL APPROVAL   Owner confirms before publish    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Step 1: Load Client Profile

Read all four documents from `clients/{client-name}/`:

| Document | Use For |
|----------|---------|
| `story.md` | Origin references, key quotes, mission |
| `voice.md` | Tone dimensions, words to use/avoid |
| `customers.md` | Pain points, aspirations, their language |
| `learnings.md` | What's worked/failed before |

**Extract and hold in context:**
- 2-3 key quotes from story.md
- Voice dimension ratings
- Customer pain points + aspirations
- What to avoid (from learnings.md)

---

## Step 2: Define the Goal

Before creating, clarify:

| Question | Why It Matters |
|----------|----------------|
| What format? | Blog, landing page, email, social, ad? |
| What's the goal? | Awareness? Trust? Conversion? |
| Who's the audience? | Which customer segment? |
| What action? | What should they do after reading? |
| What emotion? | How should they feel? |

---

## Step 3: Run Creativity Engine

Invoke `creativity-engine` with context from the client profile.

### Stakes Protocol
Write a danger scenario specific to THIS content for THIS client:

> *Example: "You're the bakery owner. This blog post is going out to 5,000 subscribers. If it sounds like every other bakery newsletter, they unsubscribe forever. Your grandmother's legacy — the recipes, the story — reduced to spam folder silence."*

### Memory Mining
Search for concepts adjacent to:
- The client's industry
- The customer's pain points
- The content topic

Use low threshold (0.2-0.4) for unexpected connections.

### Generate A + B

**Output A (Clean):** 
- Stakes + Memory fragments
- Client voice applied
- Professional, direct

**Output B (Wild):**
- Apply random Amplifier
- Push creative boundaries
- May need owner approval

---

## Step 4: Approval Loop (MANDATORY)

**Do NOT proceed to formatting until owner approves the creative direction.**

### Present Options

Show owner both A + B outputs with context:

```
## Creative Direction — Round 1

### Option A: Clean
[Raw creative output]

**Approach:** Direct, professional, uses [specific element from their story].

---

### Option B: Wild  
[Raw creative output]

**Approach:** Experimental, uses [Amplifier technique], pushes boundaries.

---

**Which direction feels right? Or should I explore different angles?**
```

### Possible Responses

| Owner Says | Action |
|------------|--------|
| "I like A" | ✅ Proceed to Step 5 with A |
| "I like B" | ✅ Proceed to Step 5 with B |
| "Mix of both" | ✅ Combine elements, confirm, then proceed |
| "Neither / Try again" | 🔄 Run creativity-engine again with their feedback |
| "More like X" | 🔄 Regenerate with specific direction |
| "Tone is off" | 🔄 Adjust voice dimensions, regenerate |

### Revision Loop

If revising:
1. Capture their feedback specifically
2. Run creativity-engine again with feedback as constraint
3. Present new A + B options
4. Repeat until approved

**There is no limit on revision rounds.** Get it right before formatting.

### Log the Decision

When approved, note:
- Which option chosen (A, B, or hybrid)
- Key feedback that shaped the direction
- This informs future content (goes in learnings.md)

---

## Step 5: Apply Format

Use the appropriate format template from `formats/`:

| Format | Template | Key Elements |
|--------|----------|--------------|
| Blog Post | `formats/blog-post.md` | Hook, structure, CTA |
| Landing Page | `formats/landing-page.md` | Hero, benefits, proof, CTA |
| Email | `formats/email.md` | Subject, preview, body, CTA |
| Social Post | `formats/social-post.md` | Hook, value, engagement |
| Ad Copy | `formats/ad-copy.md` | Headline, body, CTA |
| About Page | `formats/about-page.md` | Story-driven, mission |
| Case Study | `formats/case-study.md` | Problem, solution, result |
| Product Description | `formats/product-description.md` | Benefits, features, proof |

---

## Step 5: Voice Check

Before finalizing, verify against `voice.md`:

### Dimension Check
| Dimension | Target | This Content |
|-----------|--------|--------------|
| Funny ↔ Serious | {from profile} | {rate this} |
| Casual ↔ Formal | {from profile} | {rate this} |
| Irreverent ↔ Respectful | {from profile} | {rate this} |
| Enthusiastic ↔ Matter-of-fact | {from profile} | {rate this} |

### Voice Checklist
- [ ] Uses words from "words to use" list?
- [ ] Avoids words from "words to avoid" list?
- [ ] Matches "This sounds like us" examples?
- [ ] Doesn't match "This does NOT sound like us"?
- [ ] References their actual customers/language?
- [ ] Could a competitor use this? (If yes, rewrite)

---

## Step 7: Final Approval

After formatting and voice check, present the polished content:

```
## Final Content — Ready for Review

[Fully formatted content]

---

### Checklist Passed:
✅ Voice matches profile
✅ Uses customer language
✅ Hook is strong
✅ CTA is clear
✅ [Format-specific checks]

---

**Ready to publish? Or any final tweaks?**
```

### Possible Responses

| Owner Says | Action |
|------------|--------|
| "Approved" / "Send it" | ✅ Publish / deliver |
| "Small tweak: [X]" | Make edit, reconfirm |
| "Actually, change direction" | 🔄 Back to Step 4 |

**Never publish without explicit approval.**

---

## After Publication

Update `clients/{client-name}/learnings.md`:

```markdown
### {Content Title} — {Date}
- **Format:** {blog/email/social/etc}
- **Chose:** {A or B}
- **Result:** {metrics or feedback}
- **What worked:** {insight}
- **What didn't:** {insight}
- **Voice note:** {any refinements}
```

---

## Quick Reference: Content Goals

| Goal | Emotional Target | Content Approach |
|------|------------------|------------------|
| Awareness | Curiosity, Interest | Story, contrarian view, education |
| Trust | Confidence, Safety | Proof, testimonials, transparency |
| Conversion | Urgency, Desire | Benefits, scarcity, clear CTA |
| Retention | Belonging, Value | Exclusive content, community |
| Referral | Pride, Generosity | Shareable, remarkable |

---

## Format Files

See `formats/` directory for detailed templates:
- `blog-post.md`
- `landing-page.md`
- `email.md`
- `social-post.md`
- `ad-copy.md`
- `about-page.md`
- `case-study.md`
- `product-description.md`

See `workflows/` for:
- `ideation.md` — Topic generation from profiles
- `repurposing.md` — One piece → multiple formats

See `checklists/` for:
- `pre-publish.md` — Final quality check
- `seo-basics.md` — Search optimization

---

## Integration

```
User: "Write a blog post for [client]"
            ↓
    content-creation skill
            ↓
    1. Load clients/{client}/
    2. Define goal (blog, awareness, etc.)
    3. Run creativity-engine (Stakes → Mine → A+B)
    4. Apply blog-post.md format
    5. Voice check against voice.md
    6. Present A + B to owner
            ↓
    Owner picks → Publish → Update learnings.md
```

---

*Built by Sybil | BJS Labs | 2026-02-14*
*Integrates: marketing-creativity + creativity-engine*
