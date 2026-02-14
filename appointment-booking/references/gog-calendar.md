# Google Calendar Commands (gog)

Quick reference for calendar operations.

## List Events (Check Availability)

```bash
# List events for a date range
gog calendar events --account ACCOUNT --from "2026-02-14" --to "2026-02-21"

# JSON output for parsing
gog calendar events --account ACCOUNT --from "2026-02-14" --to "2026-02-21" --json

# Specific calendar
gog calendar events --account ACCOUNT --calendar "work" --from "2026-02-14" --to "2026-02-14"
```

## Create Event

```bash
# Basic event
gog calendar create primary \
  --account ACCOUNT \
  --summary "Meeting with John" \
  --from "2026-02-14T14:00:00-05:00" \
  --to "2026-02-14T15:00:00-05:00"

# With Google Meet (video call) ⭐ RECOMMENDED
gog calendar create primary \
  --account ACCOUNT \
  --summary "Client Call" \
  --from "2026-02-14T10:00:00-05:00" \
  --to "2026-02-14T10:30:00-05:00" \
  --with-meet \
  --attendees "client@email.com" \
  --description "Discuss Q1 project"
# This auto-generates a Google Meet link and sends invite to attendees

# With location (in-person)
gog calendar create primary \
  --account ACCOUNT \
  --summary "Lunch Meeting" \
  --from "2026-02-14T12:00:00-05:00" \
  --to "2026-02-14T13:00:00-05:00" \
  --location "123 Main Street, Miami FL"

# Multiple attendees
gog calendar create primary \
  --account ACCOUNT \
  --summary "Team Sync" \
  --from "2026-02-14T09:00:00-05:00" \
  --to "2026-02-14T09:30:00-05:00" \
  --with-meet \
  --attendees "john@company.com,jane@company.com"
```

## Key Flags for Create

| Flag | Purpose | Example |
|------|---------|---------|
| `--summary` | Event title | `--summary "Meeting with John"` |
| `--from` | Start time (RFC3339) | `--from "2026-02-14T14:00:00-05:00"` |
| `--to` | End time (RFC3339) | `--to "2026-02-14T15:00:00-05:00"` |
| `--with-meet` | Add Google Meet link | (no value needed) |
| `--attendees` | Invite people | `--attendees "a@b.com,c@d.com"` |
| `--location` | Physical location | `--location "123 Main St"` |
| `--description` | Notes/details | `--description "Agenda: ..."` |

## Update Event

```bash
# Reschedule (change time)
gog calendar update primary EVENT_ID \
  --account ACCOUNT \
  --from "2026-02-15T14:00:00-05:00" \
  --to "2026-02-15T15:00:00-05:00"

# Change summary
gog calendar update primary EVENT_ID \
  --account ACCOUNT \
  --summary "New Title"

# Add description
gog calendar update primary EVENT_ID \
  --account ACCOUNT \
  --description "Updated notes"
```

## Delete Event

```bash
gog calendar delete primary EVENT_ID --account ACCOUNT
```

## Response Format (JSON)

When using `--json`, created events return:

```json
{
  "event": {
    "id": "abc123xyz",
    "summary": "Meeting with John",
    "start": {"dateTime": "2026-02-14T14:00:00-05:00"},
    "end": {"dateTime": "2026-02-14T15:00:00-05:00"},
    "hangoutLink": "https://meet.google.com/xxx-xxxx-xxx",
    "attendees": [
      {"email": "john@company.com", "responseStatus": "needsAction"}
    ]
  }
}
```

The `hangoutLink` contains the Google Meet URL when `--with-meet` is used.

## Tips

- Always include timezone offset in times (e.g., `-05:00` for EST)
- Use `--json` output when you need to parse results
- `primary` refers to the user's main calendar
- Event IDs are stable - store them for later updates/deletes
- When using `--attendees`, Google automatically sends calendar invites
