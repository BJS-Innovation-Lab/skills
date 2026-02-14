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
| Intake | Client interview, brand profile (DO FIRST) | Read `{baseDir}/intake/PROCEDURES.md` |
| Content | Blog posts, landing pages, case studies | Read `{baseDir}/content/PROCEDURES.md` |
| Social | Social media posts, scheduling | Read `{baseDir}/social/PROCEDURES.md` |
| Email | Email campaigns, newsletters | Read `{baseDir}/email/PROCEDURES.md` |
| Campaigns | Multi-channel campaigns | Read `{baseDir}/campaigns/PROCEDURES.md` |
| Log | Track what we posted (update after each action) | Read `{baseDir}/log/PROCEDURES.md` |
| Assets | Store & track all copy, images, usage | Read `{baseDir}/assets/PROCEDURES.md` |
| Calendar | Plan content ahead, weekly/monthly scheduling | Read `{baseDir}/calendar/PROCEDURES.md` |
| Templates | Quote cards, stat cards, branded images | Read `{baseDir}/templates/PROCEDURES.md` |
| Posting | API vs manual, how to actually publish | Read `{baseDir}/posting/PROCEDURES.md` |

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
