# Single-Agent Deployment Template

One agent with umbrella skills. Loads detailed procedures on demand to keep context lean.

**Same architecture for everyone** - clients and internal agents. The only difference is which umbrellas are loaded.

See `DEPLOYMENT-PROFILES.md` for role-specific configurations.

## Architecture

```
┌─────────────────────────────────────────────┐
│  System Prompt (~500 tokens)               │
│  - AGENTS.md (lean, references skills)     │
│  - 3 umbrella skills (marketing/sales/ops) │
│  - 4 essential tools always loaded         │
└─────────────────────────────────────────────┘
            ↓ On demand
┌─────────────────────────────────────────────┐
│  Sub-Modules (loaded when needed)          │
│  - marketing/content/PROCEDURES.md         │
│  - marketing/social/PROCEDURES.md          │
│  - sales/outreach/PROCEDURES.md            │
│  - etc.                                    │
└─────────────────────────────────────────────┘
```

## Why Umbrella Skills?

| Flat (56 skills) | Umbrella (3 suites) |
|------------------|---------------------|
| ~15,000 tokens in context | ~500 tokens in context |
| Agent overwhelmed | Agent focused |
| Everything loaded upfront | Load what you need |

## What's Included

```
single-agent-roles/
├── AGENTS.md                    # Main brain (lean!)
├── SOUL.md                      # Personality + Intellectual Honesty
├── DEPLOYMENT-PROFILES.md       # Role-specific configurations
├── config.jsonc                 # OpenClaw config
├── README.md                    # This file
├── SKILLS-AUDIT.md              # Categorization notes
└── skills/
    ├── company-kb/              # Company knowledge [CUSTOMIZE]
    │   └── SKILL.md
    │
    │   # Core Business (most agents)
    ├── marketing/               # 📣 Marketing umbrella
    │   ├── SKILL.md
    │   ├── content/PROCEDURES.md
    │   ├── social/PROCEDURES.md
    │   ├── email/PROCEDURES.md
    │   └── campaigns/PROCEDURES.md
    ├── sales/                   # 💰 Sales umbrella
    │   ├── SKILL.md
    │   ├── crm/PROCEDURES.md
    │   ├── outreach/PROCEDURES.md
    │   ├── pipeline/PROCEDURES.md
    │   └── proposals/PROCEDURES.md
    ├── operations/              # ⚙️ Operations umbrella
    │   ├── SKILL.md
    │   ├── scheduling/PROCEDURES.md
    │   ├── documents/PROCEDURES.md
    │   └── automation/PROCEDURES.md
    │
    │   # Specialized (internal agents)
    ├── research/                # 🔬 Research umbrella
    │   ├── SKILL.md
    │   ├── papers/PROCEDURES.md
    │   ├── data/PROCEDURES.md
    │   └── experiments/PROCEDURES.md
    └── meta/                    # 🧠 Meta umbrella
        ├── SKILL.md
        ├── learning/PROCEDURES.md
        ├── reflection/PROCEDURES.md
        └── skills/PROCEDURES.md
```

## Essential Tools (Copy from BJS Labs)

These go in the workspace alongside the umbrella skills:

| Tool | Purpose | Source |
|------|---------|--------|
| `smb-crm` | Customer database | BJS-Innovation-Lab/skills |
| `creativity-engine` | Content ideation | BJS-Innovation-Lab/skills |
| `mac-use` | GUI automation | BJS-Innovation-Lab/skills |
| `appointment-booking` | Scheduling | BJS-Innovation-Lab/skills |
| `meeting-summarizer` | Voice → notes | BJS-Innovation-Lab/skills |
| `email-drafter` | Email workflow | BJS-Innovation-Lab/skills |

## How Lazy Loading Works

1. Agent receives task: "Write a LinkedIn post about X"
2. Agent recognizes this is marketing → invokes `marketing` skill
3. Agent reads `marketing/SKILL.md` → sees it needs social module
4. Agent reads `marketing/social/PROCEDURES.md` → gets detailed instructions
5. Agent executes with full context for just that task

Only loaded: umbrella entry + relevant sub-module (~400 tokens)
Not loaded: all other sub-modules

## Setup Steps

### 1. Copy template to client workspace

```bash
mkdir -p ~/.openclaw/workspace
cp -r . ~/.openclaw/workspace/
```

### 2. Copy essential tools from BJS

```bash
# From BJS-Innovation-Lab/skills repo
cp -r smb-crm/ ~/.openclaw/workspace/skills/
cp -r creativity-engine/ ~/.openclaw/workspace/skills/
cp -r mac-use/ ~/.openclaw/workspace/skills/
cp -r appointment-booking/ ~/.openclaw/workspace/skills/
cp -r meeting-summarizer/ ~/.openclaw/workspace/skills/
cp -r email-drafter/ ~/.openclaw/workspace/skills/
```

### 3. Customize for client

- Replace `[COMPANY_NAME]` everywhere
- Fill in `company-kb/SKILL.md` with client info
- Adjust procedures to match client workflows

### 4. Apply config

```bash
cp config.jsonc ~/.openclaw/openclaw.json
# Edit: add bot token, owner ID
openclaw gateway restart
```

## Per-Client Checklist

- [ ] Company name replaced everywhere
- [ ] Products/pricing in company-kb
- [ ] Essential tools copied from BJS
- [ ] Supabase configured for CRM
- [ ] Telegram bot created
- [ ] Config applied
- [ ] Test conversation successful
