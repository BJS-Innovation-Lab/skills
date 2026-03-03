# Mensajes & Emails

## Commands

```bash
# Send email
gog gmail send \
  --to "cliente@email.com" \
  --subject "Seguimiento: nuestra conversación" \
  --body "Hola María, ..."

# Reply to thread
gog gmail send \
  --thread-id "18abc123def" \
  --to "cliente@email.com" \
  --subject "Re: Cotización" \
  --body "..."

# Send with attachment
gog gmail send \
  --to "cliente@email.com" \
  --subject "Propuesta adjunta" \
  --body "..." \
  --attach "/path/to/propuesta.pdf"

# Search sent emails (check before sending)
gog gmail search "to:cliente@email.com" --max 5

# WhatsApp
wacli send text --to "+521234567890" --message "Hola, ..."

# WhatsApp with file
wacli send file --to "+521234567890" --file "/path/to/file.pdf" --caption "Aquí está la cotización"

# Check recent WhatsApp history
wacli messages --jid "+521234567890" --limit 10
```

## Gotchas

- `gog gmail send` sends immediately — no draft mode
- `--thread-id` keeps conversation threaded (get from `gog gmail search --json`)
- WhatsApp 24h rule: after 24h of no reply, only template messages allowed (or message fails)
- Check sent folder before sending: `gog gmail search "to:email subject:tema"`
- Max 2 emails to same person per day

## Trust tiers

| Action | Week 1-2 | Week 3+ |
|--------|----------|---------|
| Reply to active thread | ❓ Confirm | ✅ Auto |
| New outreach | ❓ Confirm | ❓ Confirm |
| Follow-up (3+ days no reply) | ❓ Confirm | ✅ Auto |
| WhatsApp to existing client | ❓ Confirm | ✅ Auto |
| WhatsApp to new contact | ❓ Confirm | ❓ Confirm |
