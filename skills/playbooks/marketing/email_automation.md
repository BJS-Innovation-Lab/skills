# Email & Automatización

## Commands

```bash
# Send newsletter/campaign (simple)
gog gmail send \
  --to "lista@example.com" \
  --bcc "contact1@email.com,contact2@email.com" \
  --subject "Newsletter: [Título]" \
  --body-file "newsletter.txt"

# For scale: need Mailchimp/Brevo API (if configured)
```

## Email structure

```markdown
**Subject:** [<60 chars, specific benefit]
**Preview:** [<90 chars, extends subject]

---

[Personal greeting]

[One main message]

[One CTA button/link]

[Sign-off]

---
[Unsubscribe link — required in Mexico: LFPDPPP]
```

## Before sending

- List source: if bought or scraped, STOP
- List cold (>6 months)? Start with small re-engagement segment
- Test on mobile (most Mexican SMB customers read on phone)

## Metrics

| Metric | Good | Bad |
|--------|------|-----|
| Open rate | >25% | <15% |
| Click rate | >3% | <1% |
| Unsubscribe | <0.5% | >1% |

## ManyChat / Chat automation

Agent role: **design flows, client implements**.

Flow document format:
```markdown
## Flow: [Name]
**Trigger:** [Keyword or event]
**Goal:** [Lead capture / FAQ / Booking]

1. Bot: "Hola! [Greeting]"
2. User: [Expected response]
3. Bot: [Next message]
...
→ Escape hatch: "Hablar con una persona"
```

## Gotchas

- One CTA per email
- Deliverability takes months to build, one bad send to destroy
- Max 2 emails/week to same list
