---
name: email-drafter
description: Structured email workflow for SMB agents. Draft business emails with templates, tone matching, CRM context, and Telegram preview with send/draft/edit buttons. Bilingual (EN/ES).
metadata:
  openclaw:
    emoji: "📧"
    requires:
      skills: ["gog"]
    os: ["darwin", "linux"]
---

# Email Drafter

Structured workflow for writing and sending business emails. Designed for SMB agents managing customer relationships.

## Core Flow

1. **Gather context** — Check CRM for customer info, recent interactions, outstanding balances
2. **Select template** — Match the email type to the right template
3. **Draft** — Write the email using template + context + tone guide
4. **Preview in chat** — Show the full email in Telegram with inline buttons
5. **User decides** — Draft, Send, or Edit

## Preview Format (Telegram)

Always present emails like this:

```
📧 Email Draft

To: {recipient_email}
Subject: {subject_line}

{email_body}
```

Then attach inline buttons:
```json
[[{"text": "📤 Send Now", "callback_data": "email_send"}, {"text": "📝 Save Draft", "callback_data": "email_draft"}, {"text": "✏️ Edit", "callback_data": "email_edit"}]]
```

**IMPORTANT NOTE ON BUTTONS:** Telegram's inline buttons do not support Markdown within the `text` field. Ensure button text is plain. If buttons appear as raw JSON, there might be an issue with the Telegram plugin's rendering or temporary platform behavior. In such cases, ask the user directly for their choice (Send, Draft, Edit).

When user clicks:
- **Send Now** → Use `gog gmail send` to send immediately
- **Save Draft** → Use `gog gmail draft` to save as draft in Gmail
- **Edit** → Ask what to change, revise, preview again

## Gog Troubleshooting and Best Practices

When using `gog` for email operations, ensure the following:

### 1. Gog Account Authentication
- **Command:** `gog auth add <your-email-address> --services gmail,calendar,drive,contacts,docs,sheets`
- This command will open a browser for interactive authentication.
- Always specify the `--account` flag when sending emails if multiple Google accounts are configured. Example: `--account "sher.bjs.labs@gmail.com"`

### 2. Enable Gmail API
- If you encounter a `403 accessNotConfigured` error, the Gmail API needs to be enabled for your Google Cloud Project.
- **Action:** Visit `https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=<your-project-id>` (replace `<your-project-id>` with the ID from the error message, e.g., `70166590259`) and enable the Gmail API.

### 3. Email Formatting with Newlines
- When sending multi-paragraph emails, the `--body` argument might not correctly interpret `\n` for newlines.
- **Best Practice:** Use `--body-file -` with a heredoc to feed the email content via standard input. This ensures proper paragraph breaks.

  ```bash
  gog gmail send \
    --to "recipient@example.com" \
    --subject "Your Subject" \
    --body-file - \
    --account "your-email@gmail.com" <<'EOF'
  Dear [Name],

  This is the first paragraph of your email.
  It will have proper line breaks.

  This is the second paragraph.

  Best regards,
  [Your Name]
  EOF
  ```

## Templates

### Cold Outreach
- **When:** First contact with a potential customer
- **Tone:** Professional but warm. Show you know their business.
- **Structure:** Greeting → Why you're reaching out (1 sentence) → Value prop (2-3 sentences) → Soft CTA → Sign-off
- **Subject line:** Specific, not salesy. Reference their business name.
- **Max length:** 150 words

### Follow-Up
- **When:** No reply after 3+ days
- **Tone:** Friendly, not pushy. Add new value.
- **Structure:** Reference previous email → New angle or info → Easy CTA
- **Subject line:** "Re:" original subject or "Quick follow-up — {topic}"
- **Max length:** 100 words

### Proposal / Quote
- **When:** Customer asked for pricing or a proposal
- **Tone:** Confident, clear. No ambiguity on pricing.
- **Structure:** Thank them → Summary of what they need → Pricing breakdown → Timeline → Next steps
- **Subject line:** "Propuesta: {service}" or "Quote for {service}"
- **Max length:** 250 words

### Payment Reminder
- **When:** Invoice overdue
- **Tone:** Friendly first, firmer on 2nd/3rd reminder
- **Structure:** Greeting → Reference invoice number + amount → Payment options → Offer help if needed
- **Escalation:** 1st (friendly) → 2nd after 7 days (direct) → 3rd after 14 days (firm)
- **Max length:** 100 words

### Thank You / Post-Sale
- **When:** After a purchase, meeting, or milestone
- **Tone:** Genuine, brief. Not generic.
- **Structure:** Specific thank you → What happens next → Open door for questions
- **Max length:** 80 words

### Support / Issue Response
- **When:** Customer reported a problem
- **Tone:** Empathetic, solution-focused. Acknowledge before solving.
- **Structure:** Acknowledge the issue → What you're doing about it → Timeline → Apology if warranted
- **Max length:** 150 words

## Tone Guide

### By Audience
| Audience | Tone | Language Tips |
|----------|------|---------------|
| New prospect | Professional, warm | Use their name. Reference their business. |
| Existing customer | Familiar, helpful | Skip formalities. Be direct. |
| Overdue payment | Friendly → firm | Never threatening. Always offer a path forward. |
| Partner/vendor | Collegial, efficient | Get to the point. Respect their time. |
| Internal team | Casual, clear | Bullet points. Action items explicit. |

### Mexico vs US
| Aspect | Mexico | US |
|--------|--------|-----|
| Greeting | "Estimado/a" (formal) or "Hola {nombre}" (warm) | "Hi {name}" |
| Warmth | Expected. Ask about their day/family briefly. | Optional. Get to point faster. |
| Formality | Use "usted" for new contacts | First name is fine immediately |
| Closing | "Quedo a sus órdenes" / "Saludos cordiales" | "Best" / "Thanks" |
| Follow-up timing | Wait 4-5 days (more patience) | 3 days is fine |

## Pre-Send Checklist

Before presenting the preview, verify:
- [ ] **Recipient correct?** — Check CRM for the right email
- [ ] **Subject line specific?** — No generic "Hello" or "Quick question"
- [ ] **Clear CTA?** — Reader knows exactly what to do next
- [ ] **Right language?** — Match customer's preferred language
- [ ] **Tone appropriate?** — Matches relationship level
- [ ] **No sensitive data leaked?** — Don't include internal notes
- [ ] **Length OK?** — Under template max. Shorter is better.

## Follow-Up Tracking

After sending an email, log it:
```bash
echo '{"to":"email","subject":"subject","sent_at":"ISO","template":"type","follow_up_date":"ISO"}' >> ~/.openclaw/workspace/learning/email-tracker.jsonl
```

During heartbeats, check email-tracker.jsonl for items past their follow_up_date with no reply. Alert the user.

## CRM Integration

Before drafting, always check if the recipient is in the CRM:
```bash
node ~/.openclaw/workspace/skills/smb-crm/scripts/query.js search "{name_or_email}"
```

Use the customer's history (last purchase, balance, notes) to personalize the email. Never send a generic email to a known customer.

## Examples

See `references/examples.md` for full email examples in English and Spanish for each template type.
