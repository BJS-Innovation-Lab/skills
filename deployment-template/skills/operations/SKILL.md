---
name: operations
description: Operations suite - scheduling, docs, automation, support. Invoke this skill to access ops tools.
metadata: {"openclaw":{"emoji":"⚙️"}}
---

# Operations Suite

When you need to do operations work, load the relevant module below.

## Available Modules

| Module | Use For | Load |
|--------|---------|------|
| Scheduling | Appointments, calendar, reminders | Read `{baseDir}/scheduling/PROCEDURES.md` |
| Documents | Docs, templates, organization | Read `{baseDir}/documents/PROCEDURES.md` |
| Automation | Workflows, recurring tasks | Read `{baseDir}/automation/PROCEDURES.md` |

## Dependencies

- `appointment-booking` - For scheduling
- `meeting-summarizer` - For meeting notes
- `gog` - Google Workspace (Calendar, Drive, Gmail)
- `mac-use` - Desktop app automation

## Quick Commands

- "Schedule a meeting" → Load scheduling module
- "Find that document" → Load documents module
- "Set up recurring task" → Load automation module
