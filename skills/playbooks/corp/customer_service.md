# Atención al Cliente

## Commands

```bash
# Check recent messages from customer
wacli messages --jid "+521234567890" --limit 20

# Reply to customer
wacli send text --to "+521234567890" --message "Hola, gracias por contactarnos..."

# Send email response
gog gmail send \
  --to "cliente@email.com" \
  --subject "Re: Tu consulta" \
  --body "..."

# Log interaction (append to tracking sheet)
gog sheets append "1abc123spreadsheetId" "Tickets!A:E" \
  "2026-02-27" "+521234567890" "consulta" "resuelto" "Preguntó sobre horarios"
```

## Response templates

Store in `clients/{name}/templates/`:
- `horarios.md` — Business hours response
- `precios.md` — Pricing inquiries  
- `ubicacion.md` — Location/directions
- `pedido-status.md` — Order status check

## Resolve alone vs escalate

| Resolve alone | Escalate to owner |
|---------------|-------------------|
| FAQ answers | Refund requests |
| Order status | Legal threats |
| Basic troubleshooting | 3+ complaints same person |
| Scheduling | Anything >$5K MXN |
| Price questions | "I want to speak to manager" |

## Response timing

- Business hours: <5 min
- After hours: acknowledge + "Respondemos mañana a primera hora"
- Set owner's business hours in `clients/{name}/preferences.md`

## Gotchas

- Read full conversation history before responding
- Never promise timelines you don't control ("llegará mañana" — do you know that?)
- "No refunds" → offer alternative (exchange, credit, discount)
- One angry enterprise client > five mildly annoyed small ones
