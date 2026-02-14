---
name: appointment-booking
description: Multi-channel appointment scheduling with owner checkpoints. Detects booking requests from email/WhatsApp/Telegram, coordinates with owner before sending anything, and syncs to Google Calendar.
metadata:
  openclaw:
    emoji: "📅"
    requires:
      skills: ["gog"]
    optional:
      skills: ["wacli", "himalaya"]
---

# Appointment Booking Skill

Help SMB owners schedule meetings without the back-and-forth. Supports multiple input channels, always confirms with owner before taking action.

## Core Principle

**You are an ASSISTANT, not auto-pilot.** Never send messages or create calendar entries without owner approval. Multiple checkpoints at every step.

## Trigger Types

| Trigger | Source | Your Action |
|---------|--------|-------------|
| Inbound request | Email/WhatsApp/Telegram | Notify owner, gather prefs, propose times |
| Owner outreach | Direct instruction | Draft message, get approval, send, wait for response |
| Detected in email | Reading inbox | Alert owner about mentioned meeting, ask to add |
| Reschedule request | Customer message | Notify owner, propose alternatives |
| Cancel request | Customer message | Confirm with owner before removing |

## The 3 Checkpoints

Before ANY external message or calendar entry:

### Checkpoint 1: Gather Preferences
Ask owner BEFORE checking calendar:
- How long should this meeting be? (15min, 30min, 1hr?)
- Any days/times to prefer or avoid?
- Meeting type:
  - **Google Meet** (video call - use `--with-meet`)
  - **Phone call** (add number to description)
  - **In-person** (add location)
  - **Other video** (Zoom, Teams - add link to description)
- Any notes to include?
- Send calendar invite directly OR wait for confirmation first?

### Checkpoint 2: Approve Message
Show owner the EXACT message before sending:
```
Here's what I'll send to [Name] via [channel]:

---
[Full message text]
---

✅ Send this? Or would you like to edit?
```

### Checkpoint 3: Confirm Booking
When the other party confirms a time:
```
[Name] confirmed [Day] at [Time].

Should I:
1. ✅ Create calendar invite and send confirmation
2. ✏️ You want to handle this manually
3. 🔄 Suggest different times
```

## Flow: Inbound Request

1. **Detect**: Booking request arrives (email, WhatsApp, etc.)
2. **Notify**: Tell owner about the request
   ```
   📬 New meeting request from [Name] ([contact]):
   "[Their message]"
   
   Want me to help schedule this?
   ```
3. **Checkpoint 1**: Gather preferences from owner
4. **Check Calendar**: Use `gog calendar events` to find available slots
5. **Propose to Owner**: Show 3 options, ask which to offer
6. **Checkpoint 2**: Show exact message, get approval
7. **Send**: Deliver message via appropriate channel
8. **Wait**: Monitor for response
9. **Checkpoint 3**: When they confirm, ask owner to approve booking
10. **Book**: Create calendar event, send confirmation

## Flow: Owner-Initiated Outreach

1. **Instruction**: Owner asks to schedule with someone
   ```
   "Reach out to john@company.com and set up a call this week"
   ```
2. **Checkpoint 1**: Gather preferences
3. **Check Calendar**: Find available slots matching preferences
4. **Draft Message**: Compose outreach with proposed times
5. **Checkpoint 2**: Show message, get approval
6. **Send**: Deliver via specified channel
7. **Wait**: Do NOT create calendar entry yet
8. **Response**: When recipient replies with their choice
9. **Checkpoint 3**: Confirm with owner before booking
10. **Book**: Create event and send confirmation

## Flow: Detected Meeting in Email

1. **Detect**: While reading emails, spot meeting mention:
   - Explicit times: "Let's meet Tuesday at 3pm"
   - Confirmations: "See you tomorrow at 10am"
   - Requests: "When are you free this week?"

2. **Alert Owner**:
   ```
   📧 I noticed an email from [Name] mentioning a meeting:
   "[Relevant quote]"
   
   Want me to add this to your calendar?
   ```
3. **Gather Details**: Duration, meeting type, etc.
4. **Check Calendar**: Verify the time is free
5. **Checkpoint 3**: Confirm before creating
6. **Book**: Create event
7. **Checkpoint 2**: Draft confirmation reply, get approval
8. **Send**: Confirmation to the other party

## Calendar Commands

```bash
# Check availability
gog calendar events --account ACCOUNT --from "2026-02-14" --to "2026-02-21" --json

# Create event (basic)
gog calendar create primary \
  --account ACCOUNT \
  --summary "Meeting with [Name]" \
  --from "2026-02-14T14:00:00-05:00" \
  --to "2026-02-14T15:00:00-05:00" \
  --description "Booked via appointment-booking skill"

# Create event WITH Google Meet (recommended for video calls)
gog calendar create primary \
  --account ACCOUNT \
  --summary "Meeting with [Name]" \
  --from "2026-02-14T14:00:00-05:00" \
  --to "2026-02-14T15:00:00-05:00" \
  --with-meet \
  --attendees "attendee@email.com" \
  --description "Booked via appointment-booking skill"
# Returns hangoutLink with the Google Meet URL

# Update event (reschedule)
gog calendar update primary [event-id] --from "2026-02-15T10:00:00-05:00"

# Delete event (cancel)
gog calendar delete primary [event-id]
```

### Meeting Type Options

| Type | Command Flag | Notes |
|------|--------------|-------|
| Google Meet | `--with-meet` | Auto-generates Meet link, included in invite |
| Phone call | (none) | Add phone number in `--description` or `--location` |
| In-person | `--location "123 Main St"` | Physical address |
| Zoom/Other | (none) | Add link in `--description` |

## Messaging Commands

### Email (gog gmail)
```bash
# Send
gog gmail send \
  --to "recipient@email.com" \
  --subject "Meeting Times" \
  --body "..."

# Check for replies
gog gmail list --query "from:recipient@email.com" --max 5
```

### WhatsApp (wacli)
```bash
# Send
wacli send --to "+1234567890" --message "..."

# Check messages
wacli history --chat "+1234567890" --limit 10
```

## Response Templates

### Offering Times (customize per business)
```
Hi [Name],

Thanks for reaching out! I have a few times available:

• [Day 1] at [Time 1]
• [Day 2] at [Time 2]
• [Day 3] at [Time 3]

Let me know which works best for you.

Best,
[Owner Name]
```

### Confirmation
```
Great! You're confirmed for:

📅 [Day, Date]
🕐 [Start Time] - [End Time]
📍 [Location/Video link]

I'll send a reminder beforehand. See you then!
```

### Reschedule
```
No problem! Here are some alternative times:

• [Option 1]
• [Option 2]
• [Option 3]

Let me know what works better.
```

### Cancellation
```
Your appointment on [Date] at [Time] has been cancelled.

If you'd like to reschedule, just let me know!
```

## Configuration

Each SMB can customize (store in config.yaml):

```yaml
business_name: "Maria's Salon"
owner_name: "Maria Garcia"

# Working hours
hours:
  monday: "9:00-17:00"
  tuesday: "9:00-17:00"
  wednesday: "9:00-17:00"
  thursday: "9:00-17:00"
  friday: "9:00-17:00"
  saturday: "10:00-14:00"
  sunday: closed

# Default appointment settings
defaults:
  duration_minutes: 60
  buffer_minutes: 15
  max_advance_days: 30

# Service types (optional)
services:
  - name: "Consultation"
    duration: 30
  - name: "Full Session"
    duration: 60
  - name: "Extended Session"
    duration: 90

# Reminders
reminders:
  - hours_before: 24
  - hours_before: 1

# Preferred response channel
preferred_channel: "same"  # or "email", "whatsapp"
```

## Edge Cases

| Situation | Response |
|-----------|----------|
| Requested time unavailable | Offer 3 nearest alternatives |
| Outside business hours | Explain hours, offer next available |
| Same-day request | Check policy, may require owner approval |
| Vague request ("sometime next week") | Ask for preference: morning/afternoon, specific days |
| Double booking attempt | Reject gracefully, offer alternatives |
| No response after sending times | After 24-48h, ask owner if should follow up |

## Important Notes

1. **Never auto-book**: Calendar entries only after BOTH parties confirm
2. **Always show messages**: Owner sees exact text before it sends
3. **Match channel**: Reply on same channel request came from (unless owner specifies)
4. **Store contact info**: Remember customer preferences for future bookings
5. **Timezone awareness**: Confirm timezone if customer might be remote

## Files in This Skill

```
appointment-booking/
├── SKILL.md                 # This file
├── config.example.yaml      # Sample configuration
├── references/
│   ├── gog-calendar.md      # Calendar command reference
│   └── messaging.md         # Email/WhatsApp commands
├── scripts/
│   ├── check-availability.sh
│   └── parse-meeting-request.sh
└── templates/
    ├── offer-times.txt
    ├── confirmation.txt
    ├── reschedule.txt
    └── cancellation.txt
```
