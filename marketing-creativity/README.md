# Marketing Creativity Skill

> The real creativity starts with their voice and story. Our job is to bring it out of them.

This skill extracts the oral history and identity of a business through interviews, creating living documents that grow over time. It's the foundation for all marketing content — ensuring output sounds like THEM, not like generic AI.

## Installation

### 1. Copy the skill folder

```bash
cp -r skills/marketing-creativity ~/.openclaw/workspace/skills/
```

### 2. Copy the marketing module wrapper

```bash
cp -r skills/marketing ~/.openclaw/workspace/skills/
```

### 3. Create the clients folder

```bash
mkdir -p ~/.openclaw/workspace/clients
```

### 4. ⚠️ REQUIRED: Update AGENTS.md

Add the following rule to your `AGENTS.md` file. **This is mandatory** — without it, agents won't know to check for client profiles before generating content.

```markdown
## 🎯 Marketing Content Rule (MANDATORY)

Before creating ANY marketing content (emails, social posts, ads, copy, campaigns):

1. **Identify the client** — Who is this for?
2. **Check for profile** — Does `clients/{client-name}/` exist?
3. **If NO profile exists:**
   - STOP. Do not generate generic content.
   - Tell the user: "I need to understand this business first. Can we do a quick intake interview?"
   - Load `marketing-creativity` skill
   - Run the 14-question intake interview
   - Create the 4 profile documents (story.md, voice.md, customers.md, learnings.md)
4. **If profile exists:**
   - Read ALL 4 documents before writing anything
   - Reference specific quotes and voice dimensions
   - Check learnings.md for what's worked/failed before
5. **After every campaign** — Update learnings.md with results

**This is not optional.** Generic content wastes everyone's time.

The goal: Content should sound like THEM on their best day, not like anyone could have written it.
```

## Requirements

| Requirement | Purpose |
|-------------|---------|
| `skills/marketing-creativity/` | Core skill with intake interview |
| `skills/marketing/` | Module wrapper (entry point) |
| `clients/` folder | Stores client profiles |
| `AGENTS.md` rule | Enforces pre-flight check |

## How It Works

### The Intake Interview

When no client profile exists, the agent runs a 14-question interview:

**Origin (4 questions)**
- How did this business start?
- What made you start THIS instead of something else?
- What did you give up to do this?
- What do you wish people understood?

**Customer Truth (4 questions)**
- Best customer interaction?
- Worst customer interaction?
- Magic wand — what would be different for customers?
- What do customers actually say? (exact words)

**Voice Discovery (4 questions)**
- If your business was at a party, how would it talk?
- What would you NEVER say in marketing?
- "We want people to feel ___ when they discover us"
- What story do you tell at parties about your work?

**Differentiation (2 questions)**
- Competitors — what do they do that annoys you?
- What do you do that they don't?

### The 4 Living Documents

After intake, these documents are created in `clients/{client-name}/`:

| Document | What It Contains | When It Updates |
|----------|------------------|-----------------|
| `story.md` | Origin, pivotal moments, key quotes | New stories emerge |
| `voice.md` | 4 dimensions, do/don't examples | Feedback refines |
| `customers.md` | Best/worst stories, their language | Customer insights |
| `learnings.md` | What resonates, what falls flat | Every campaign |

### The Voice Dimensions

Brand voice is mapped on 4 spectrums (0-100):

```
Funny ←————————→ Serious
Casual ←————————→ Formal  
Irreverent ←————————→ Respectful
Enthusiastic ←————————→ Matter-of-fact
```

These shift by channel (Instagram vs LinkedIn) and context (celebration vs apology).

## File Structure

```
skills/marketing-creativity/
├── SKILL.md                    # Main instructions
├── README.md                   # This file
├── frameworks/
│   ├── voice-dimensions.md     # The 4 spectrums explained
│   └── oral-history.md         # Interview techniques
├── templates/
│   ├── story.md                # Client story template
│   ├── voice.md                # Voice profile template
│   ├── customers.md            # Customer profile template
│   └── learnings.md            # Feedback loop template
└── examples/
    └── before-after.md         # Generic → Creative transforms

skills/marketing/
└── SKILL.md                    # Module wrapper (entry point)

clients/
├── README.md
└── {client-name}/
    ├── story.md
    ├── voice.md
    ├── customers.md
    └── learnings.md
```

## Core Philosophy

1. **Interview-first, not form-filling** — Extract stories through conversation
2. **Capture their words, not your summary** — Exact quotes matter
3. **Living documents** — These grow with every interaction
4. **Best AND worst** — Negative feedback teaches as much as positive
5. **Earn the right** — You can't tell their story until you truly understand it

## The Golden Rule

> Content should sound like THEM on their best day, not like anyone could have written it.

If you can swap in a competitor's name and the content still works, it's too generic. Start over.

## Dependencies

- None (pure skill, no external tools required)

## Related Skills

- `marketing/` — Module wrapper (required)
- `ai-creativity/` — Universal creative foundations (planned)

## Credits

- Research: Sybil (BJS Labs)
- Academic foundations: Saber (BJS Labs)
- Based on: Nielsen Norman Group voice dimensions, Smithsonian oral history methodology, StoryBrand framework

## License

MIT — Use freely, attribution appreciated.
