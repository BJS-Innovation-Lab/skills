# Content Creation Skill

> Create content that sounds like THEM and stands out from everyone else.

Part of the BJS Labs Marketing Stack. Combines client voice extraction with creative process to produce specific content formats.

## Prerequisites

This skill requires:
1. **marketing-creativity** — Client profile must exist
2. **creativity-engine** — For creative process

```bash
# Install all three
gh repo clone BJS-Innovation-Lab/marketing-creativity ~/.openclaw/workspace/skills/marketing-creativity
gh repo clone BJS-Innovation-Lab/creativity-engine ~/.openclaw/workspace/skills/creativity-engine
gh repo clone BJS-Innovation-Lab/content-creation ~/.openclaw/workspace/skills/content-creation

# Create clients folder
mkdir -p ~/.openclaw/workspace/clients
```

## ⚠️ REQUIRED: Update AGENTS.md

See `marketing-creativity/README.md` for the required AGENTS.md rule that enforces client profiles before content creation.

## The Flow

```
1. 📂 LOAD CLIENT      Read all 4 profile docs
         ↓
2. 🎯 DEFINE GOAL      What's the content for?
         ↓
3. 🔥 RUN CREATIVITY   Stakes → Memory → A+B
         ↓
4. 📝 APPLY FORMAT     Structure for content type
         ↓
5. 🎤 VOICE CHECK      Does it sound like them?
         ↓
6. ✅ PRESENT          Show A + B options to owner
```

## File Structure

```
skills/content-creation/
├── SKILL.md              # Main instructions
├── README.md             # This file
├── formats/
│   ├── blog-post.md      # Blog structure, hooks, SEO
│   ├── email.md          # Subject, preview, body, CTA
│   ├── social-post.md    # Platform-specific formats
│   └── landing-page.md   # Hero, benefits, proof, CTA
├── workflows/
│   └── ideation.md       # Generate topic ideas from profiles
└── checklists/
    └── pre-publish.md    # Final quality check
```

## Content Formats

| Format | Template | Key Elements |
|--------|----------|--------------|
| Blog Post | `formats/blog-post.md` | Hook, structure, CTA |
| Email | `formats/email.md` | Subject, preview, body |
| Social Post | `formats/social-post.md` | Platform-specific |
| Landing Page | `formats/landing-page.md` | Hero, benefits, proof |

## The Stack

```
┌──────────────────────────────────────┐
│         CONTENT CREATION             │
│    (blog, email, social, landing)    │
│                 ↑                    │
│     ┌───────────┴───────────┐        │
│     │                       │        │
│     ▼                       ▼        │
│ ┌─────────────┐    ┌──────────────┐  │
│ │ MARKETING-  │    │ CREATIVITY-  │  │
│ │ CREATIVITY  │    │ ENGINE       │  │
│ │ (voice)     │    │ (process)    │  │
│ └─────────────┘    └──────────────┘  │
└──────────────────────────────────────┘
```

## Output: Always A + B

Every piece of content produces two options:

**Output A (Clean):** Stakes + Memory, direct, professional
**Output B (Wild):** + Random Amplifier, experimental

Present both to owner. They choose.

## After Publishing

Update `clients/{client}/learnings.md` with:
- What was published
- Which option they chose (A or B)
- Results/feedback
- Voice refinements

## Credits

- Built by: Sybil | BJS Labs
- Integrates: marketing-creativity (Sybil) + creativity-engine (Saber & Bridget)
- Date: 2026-02-14

## License

MIT — Use freely, attribution appreciated.
