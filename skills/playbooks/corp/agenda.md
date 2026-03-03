# Agenda & Citas

## Commands

```bash
# Check availability
gog calendar events --from "tomorrow" --to "next friday" --json

# Create event (times in RFC3339 or relative)
gog calendar create primary \
  --summary "Meeting with Juan" \
  --from "2026-02-28T10:00:00-06:00" \
  --to "2026-02-28T11:00:00-06:00" \
  --attendees "juan@email.com" \
  --with-meet \
  --description "Agenda: ..."

# Check for conflicts before booking
gog calendar freebusy primary --from "..." --to "..."

# Update existing
gog calendar update primary <eventId> --summary "New title"

# Delete
gog calendar delete primary <eventId>
```

## First session with client

Ask and store in `clients/{name}/preferences.md`:
- Calendar ID (usually `primary`, but some use work/personal split)
- Timezone (Mexico City = `-06:00`, assumes CST)
- Business hours (e.g., 9am-6pm)
- Buffer between meetings? (default 15 min)
- Auto-add Meet link? (default yes)
- Who can book without asking? (e.g., existing clients = auto, new = confirm)

## Gotchas

- `--from` and `--to` need timezone offset or they default to UTC
- `--attendees` sends invite immediately — no draft mode
- All-day events: use `--all-day` with date-only (no time)
- Recurring: `--rrule "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR"`
- Calendar ID for shared calendars is the calendar's email, not "primary"

## Trust tiers

| Action | Week 1-2 | Week 3+ |
|--------|----------|---------|
| Check availability | ✅ Auto | ✅ Auto |
| Book with existing client | ❓ Confirm | ✅ Auto |
| Book with new client | ❓ Confirm | ❓ Confirm |
| Cancel/reschedule | ❓ Confirm | ❓ Confirm |
| Send reminder | ✅ Auto | ✅ Auto |

## Reminders via cron

```bash
# Set via OpenClaw cron — reminder 24h before
# payload: "Reminder: You have [event] tomorrow at [time] with [attendee]"
```
