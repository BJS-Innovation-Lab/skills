# Marketing Module

> Complete marketing skill for AI agents. Handles content creation, social media, email campaigns, and asset management.

## Overview

This module provides procedures for an AI agent to handle marketing tasks for SMB clients. Built with a "human in the loop" philosophy — the agent drafts, the owner approves.

## Quick Start

1. **New client?** Start with `intake/PROCEDURES.md` — creates brand profile
2. **Writing content?** Load the appropriate module (social, email, content)
3. **Posting?** Use `posting/PROCEDURES.md` to publish
4. **Tracking?** Update `log/PROCEDURES.md` and `assets/PROCEDURES.md`

## Modules

| Module | File | Purpose |
|--------|------|---------|
| **Intake** | `intake/PROCEDURES.md` | 14-question brand interview |
| **Content** | `content/PROCEDURES.md` | Blog posts, landing pages, case studies |
| **Social** | `social/PROCEDURES.md` | Social media posts + images |
| **Email** | `email/PROCEDURES.md` | Campaign emails, sequences |
| **Campaigns** | `campaigns/PROCEDURES.md` | Multi-channel coordination |
| **Log** | `log/PROCEDURES.md` | Track what was posted |
| **Assets** | `assets/PROCEDURES.md` | Store copy, images, usage |
| **Calendar** | `calendar/PROCEDURES.md` | Plan content ahead |
| **Templates** | `templates/PROCEDURES.md` | Quote cards, branded images |
| **Posting** | `posting/PROCEDURES.md` | API vs manual publishing |

## Client Folder Structure

Each client gets this structure:

```
clients/{client-name}/
├── story.md           # Origin, mission, key quotes
├── voice.md           # How they sound (4 dimensions)
├── customers.md       # Who they serve, pain points
├── learnings.md       # What worked/failed
├── calendar.md        # Content schedule
├── usage-log.md       # Asset usage tracking
│
├── copy/
│   ├── social-posts.md
│   ├── email-campaigns.md
│   ├── taglines.md
│   └── descriptions.md
│
└── assets/
    ├── logos/
    ├── covers/
    ├── social/
    └── landing-pages/
```

## The Flow

```
┌─────────────┐
│   Intake    │ ← 14 questions → Brand profile
└──────┬──────┘
       ↓
┌─────────────┐
│   Create    │ ← Draft content using profile
└──────┬──────┘
       ↓
┌─────────────┐
│   Approve   │ ← Owner approves via Telegram
└──────┬──────┘
       ↓
┌─────────────┐
│    Post     │ ← API, mac-use, or manual
└──────┬──────┘
       ↓
┌─────────────┐
│    Track    │ ← Log, update calendar, metrics
└─────────────┘
```

## Key Principles

### 1. Profile First
Never create content without a client profile. Generic content fails.

### 2. Owner Approval
Always get approval before publishing. Show the content + image.

### 3. Track Everything
Log what was created, when, where. Update learnings with results.

### 4. Internal vs External
- **Internal:** learnings.md, usage-log.md, profiles → agent only
- **External:** actual content → what customers see

## Testing Status

### ✅ Tested
- Intake flow (Vulkn profile created)
- Social post drafting + approval
- Image generation (logo, cover, social)
- Email campaign copy (4 versions)
- Asset storage

### ⚠️ Needs Testing
- Landing page copy generation
- API posting (LinkedIn, Facebook, Instagram)
- mac-use posting flow
- Email sending via gog
- Content calendar workflow
- Quote card generation
- Full intake with new client
- Performance tracking

## Dependencies

| Skill | Used For |
|-------|----------|
| `openai-image-gen` | Generate social images |
| `gog` | Send emails via Gmail |
| `mac-use` | Browser control for posting |
| `social-setup` | Create social accounts |
| `creativity-engine` | Generate creative angles |

## Related Skills

- `marketing-module/` — Entry point with pre-flight checks
- `marketing-creativity/` — Intake interview frameworks
- `social-setup/` — Account creation procedures
- `creativity-engine/` — Creative process

## Contributing

When adding new procedures:
1. Create `{module}/PROCEDURES.md`
2. Add to table in `SKILL.md`
3. Update this README
4. Test with a real client

## License

MIT — Part of BJS Labs deployment templates.
