---
name: marketing
description: Marketing suite - content, social, email, campaigns. Invoke this skill to access marketing tools.
metadata: {"openclaw":{"emoji":"📣"}}
---

# Marketing Suite

When you need to do marketing work, load the relevant module below.

## Available Modules

| Module | Use For | Load |
|--------|---------|------|
| Content | Blog posts, landing pages, case studies | Read `{baseDir}/content/PROCEDURES.md` |
| Social | Social media posts, scheduling | Read `{baseDir}/social/PROCEDURES.md` |
| Email | Email campaigns, newsletters | Read `{baseDir}/email/PROCEDURES.md` |
| Campaigns | Multi-channel campaigns | Read `{baseDir}/campaigns/PROCEDURES.md` |

## Before Any Marketing Work

**MANDATORY:** Run the creativity-engine skill first. Never output generic content.

## Dependencies

- `creativity-engine` - Required before content creation
- `company-kb` - Load client voice and brand info

## Quick Commands

- "Create social post" → Load social module
- "Write blog post" → Load content module  
- "Draft email campaign" → Load email module
- "Plan campaign" → Load campaigns module
