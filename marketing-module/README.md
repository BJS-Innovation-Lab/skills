# Marketing Module

> Entry point for ALL marketing actions. Ensures client profiles exist before content creation.

This is a wrapper module that routes all marketing requests through a pre-flight check. It enforces the rule that no content gets created without understanding the client first.

## Installation

### 1. Install marketing-creativity skill first

This module depends on `marketing-creativity`. Install that first — see its README for full instructions.

### 2. Copy this module

```bash
cp -r skills/marketing ~/.openclaw/workspace/skills/
```

### 3. ⚠️ REQUIRED: Update AGENTS.md

See `skills/marketing-creativity/README.md` for the required AGENTS.md rule.

## How It Works

```
User Request: "Write me an Instagram post for XYZ"
                    ↓
            Marketing Module
                    ↓
            Pre-Flight Check
                    ↓
        Does clients/xyz/ exist?
                    ↓
    ┌───────NO──────┴───────YES───────┐
    ↓                                 ↓
STOP & Say:                    Load all 4 docs:
"I need to understand         - story.md
this business first.          - voice.md  
Can we do intake?"            - customers.md
    ↓                         - learnings.md
Run 14-question                       ↓
interview                     Create content
    ↓                         with their voice
Create 4 documents                    ↓
    ↓                         Anti-generic check
Save to clients/xyz/                  ↓
    ↓                         Deliver
    └─────────────────────────────────┘
```

## Pre-Flight Check

Before any marketing action:

1. **Identify the client** — Who is this for?
2. **Check for profile** — Does `clients/{client-name}/` exist?
3. **If NO** → Run intake interview, create profile
4. **If YES** → Load all 4 documents before writing

## Anti-Generic Check

Before finalizing any content:

- [ ] Specific details, not vague claims?
- [ ] Emotional hook in first line?
- [ ] Sounds like the brand's voice?
- [ ] Something surprising or unexpected?
- [ ] Could a competitor use this same copy? (If yes, start over)

## Dependencies

| Skill | Purpose | Required? |
|-------|---------|-----------|
| `marketing-creativity` | Intake interviews, profile creation | Yes |
| `content-creation` | Blog posts, articles | Optional |
| `email-campaigns` | Email sequences | Optional |
| `social-scheduler` | Social media content | Optional |

## File Structure

```
skills/marketing/
├── SKILL.md     # Main instructions
└── README.md    # This file
```

## Related

- `marketing-creativity/` — Core skill (required)
- `clients/` folder — Where profiles are stored
