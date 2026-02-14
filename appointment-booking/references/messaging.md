# Messaging Commands Reference

## Email (gog gmail)

### Send Email
```bash
gog gmail send \
  --to "recipient@email.com" \
  --subject "Meeting Times" \
  --body "Hi, here are some available times..."

# With CC
gog gmail send \
  --to "main@email.com" \
  --cc "copy@email.com" \
  --subject "Meeting Confirmation" \
  --body "..."

# Reply to a thread
gog gmail send \
  --to "recipient@email.com" \
  --subject "Re: Meeting Request" \
  --body "..." \
  --thread-id "THREAD_ID"
```

### Read/Search Emails
```bash
# Recent emails
gog gmail list --max 10

# Search for specific sender
gog gmail list --query "from:john@company.com" --max 5

# Unread only
gog gmail list --query "is:unread" --max 10

# Read specific email
gog gmail read MESSAGE_ID
```

## WhatsApp (wacli)

### Send Message
```bash
# Send text
wacli send --to "+1234567890" --message "Hi! Here are the available times..."

# Send to saved contact
wacli send --to "John Smith" --message "..."
```

### Read Messages
```bash
# List chats
wacli chats --limit 10

# History with specific contact
wacli history --chat "+1234567890" --limit 20

# Search messages
wacli search --query "meeting" --limit 10
```

## Telegram (OpenClaw message tool)

```bash
# Use the message tool directly
message action=send channel=telegram target="CHAT_ID" message="..."
```

## Channel Selection Logic

1. **Inbound request**: Reply on same channel
   - Came from email → reply via email
   - Came from WhatsApp → reply via WhatsApp

2. **Owner-initiated**: Ask owner which channel
   - "Should I reach out via email or WhatsApp?"

3. **Stored preference**: If customer has preferred_channel saved, use that

## Message Formatting

### Email
- Full sentences, professional tone
- Include greeting and signature
- Can use formatting (but keep it simple)

### WhatsApp
- Shorter, more casual
- Emojis OK (📅 🕐 ✅)
- Bullet points with • or -

### Telegram
- Similar to WhatsApp
- Markdown supported (**bold**, _italic_)
