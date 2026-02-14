# Scheduling Procedures

## Appointment Booking Flow

Use the `appointment-booking` skill for external meetings.

### 3-Checkpoint System
1. **Gather preferences** - Ask owner for availability
2. **Approve message** - Show draft before sending to external party
3. **Confirm booking** - Verify before creating calendar entry

### Quick Internal Reminder
For simple reminders (no external coordination):
```
Use cron tool:
- "Remind me at 3pm" → cron systemEvent
- "Remind me tomorrow" → cron at specific time
```

## Calendar Best Practices

### Before Scheduling
- Check existing calendar for conflicts
- Consider travel time between meetings
- Block focus time for deep work

### Meeting Defaults
- 30 min for quick syncs
- 45 min for working sessions (gives buffer)
- Include video link (Google Meet)
- Add agenda to description

### Recurring Meetings
- Weekly: same day/time each week
- Monthly: first [day] of month
- Include skip dates for holidays

## Google Calendar Commands (via gog)

```bash
# List upcoming events
gog cal list

# Create event
gog cal create --title "Meeting" --start "2024-01-15 10:00" --duration 30

# Find free time
gog cal free --date "2024-01-15"
```

## Meeting Notes Flow

After any meeting:
1. Use `meeting-summarizer` if voice notes available
2. Log key decisions to memory
3. Create follow-up tasks/reminders
4. Send summary to attendees if needed
