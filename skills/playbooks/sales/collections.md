# Cobranza

## Commands

```bash
# Send WhatsApp reminder
wacli send text --to "+521234567890" --message "Hola Juan, recordatorio amable: la factura #123 por $5,000 MXN venció hace 7 días. ¿Todo bien?"

# Send email reminder
gog gmail send \
  --to "juan@email.com" \
  --subject "Recordatorio: Factura #123 vencida" \
  --body "Hola Juan, ..."

# Check previous messages to this contact
wacli messages --jid "+521234567890" --limit 10
```

## First session with client

Store in `clients/{name}/collections.md`:
- Payment terms (e.g., net 15, net 30)
- Preferred reminder channel (WhatsApp vs email)
- Escalation threshold (e.g., >$10K MXN or >30 days)
- Tone preference (formal vs casual)

## Reminder sequence

| Day | Action | Tone |
|-----|--------|------|
| Due date | Friendly reminder | "Recordatorio amable..." |
| +7 | Follow-up | "Queremos confirmar que recibiste..." |
| +14 | Firm | "Notamos que la factura sigue pendiente..." |
| +30 | Escalate to owner | Don't send - flag for owner |

## Gotchas

- WhatsApp `--to` needs country code: `+52` for Mexico
- Always check `wacli messages` first — don't double-send
- wacli JID format: phone number or `number@s.whatsapp.net`
- If client has multiple numbers, check `clients/{name}/contacts.md`

## Escalate when

- Amount >$10K MXN
- 3+ no-responses
- Client disputes the charge
- Multiple invoices overdue from same client
