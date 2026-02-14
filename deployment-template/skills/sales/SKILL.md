---
name: sales
description: Sales suite - CRM, outreach, pipeline, proposals. Invoke this skill to access sales tools.
metadata: {"openclaw":{"emoji":"💰"}}
---

# Sales Suite

When you need to do sales work, load the relevant module below.

## Available Modules

| Module | Use For | Load |
|--------|---------|------|
| CRM | Customer data, queries, updates | Read `{baseDir}/crm/PROCEDURES.md` |
| Outreach | Cold emails, follow-ups | Read `{baseDir}/outreach/PROCEDURES.md` |
| Pipeline | Deal tracking, forecasting | Read `{baseDir}/pipeline/PROCEDURES.md` |
| Proposals | Quotes, proposals, contracts | Read `{baseDir}/proposals/PROCEDURES.md` |

## Dependencies

- `smb-crm` - Customer database queries
- `email-drafter` - For outreach emails
- `company-kb` - Product/pricing info

## Quick Commands

- "Who owes money?" → Load CRM module, run `query.js --deudores`
- "Draft cold email" → Load outreach module
- "Check pipeline" → Load pipeline module
- "Create proposal" → Load proposals module
