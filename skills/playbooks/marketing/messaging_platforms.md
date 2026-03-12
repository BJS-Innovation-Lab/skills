# Messaging Platforms Reference

Platform specs and gotchas for WhatsApp, Telegram, and other messaging channels.

---

## WhatsApp Business

### Message Limits
| Type | Limit |
|------|-------|
| Text message | **4,096 characters** |
| Caption (media) | 1,024 characters |
| Template message | Varies by component |

### 24-Hour Window Rule
**Critical:** WhatsApp only allows freeform messages within 24 hours of customer's last message.

```
Customer messages → 24h window opens → You can reply freely
After 24h with no customer message → Only template messages allowed
```

**Template messages** must be:
- Pre-approved by Meta
- Categorized (marketing, utility, authentication)
- Can include buttons, but text is fixed

**Implications:**
- Don't promise "I'll follow up tomorrow" unless you have an approved template
- For reminders/notifications, need pre-approved templates
- If customer goes quiet, you lose ability to message freely

### Rate Limits
| Tier | Messages/day | How to reach |
|------|--------------|--------------|
| Unverified | 250 | Default |
| Tier 1 | 1,000 | After verification |
| Tier 2 | 10,000 | Good quality + volume |
| Tier 3 | 100,000 | High quality + volume |
| Tier 4 | Unlimited | Top performers |

Quality rating affects tier. Too many blocks/reports = downgrade.

### Gotchas
- Phone must stay online for first ~2 weeks (WhatsApp syncing)
- Business verification takes 2-5 days
- Display name changes require re-verification
- Can't message first — customer must initiate
- Media files: 16MB limit for images, 100MB for docs/video

---

## Telegram

### Message Limits
| Type | Limit |
|------|-------|
| Text message | **4,096 characters** |
| Caption (media) | 1,024 characters |
| Message entities (bold, links, etc.) | 100 per message |

### No 24-Hour Window
Unlike WhatsApp, Telegram bots can message users anytime after they start a conversation.

### Rate Limits
| Scope | Limit |
|-------|-------|
| Same chat | 1 msg/second |
| Different chats | 30 msgs/second |
| Group messages | 20 msgs/minute to same group |
| Bulk notifications | Contact @BotFather for higher limits |

### Gotchas
- Users can block bots silently (you won't know)
- Bot can't see messages in groups unless:
  - Added as admin, OR
  - Message starts with `/command`, OR
  - Privacy mode disabled
- Inline keyboards limited to 8 buttons per row
- Callback data limited to 64 bytes

---

## SMS (via Twilio)

### Message Limits
| Type | Limit |
|------|-------|
| Single SMS | 160 characters (GSM-7) |
| Single SMS (Unicode) | 70 characters |
| Concatenated | Up to 1,600 characters (splits into multiple) |

### Gotchas
- Emojis = Unicode = 70 char limit
- Long messages split and may arrive out of order
- 10DLC registration required for US business messaging
- Carrier filtering can silently drop messages
- $0.0079+ per segment (adds up fast with long messages)

---

## Best Practices for Field Agents

### Keep messages short
- WhatsApp/Telegram: Stay under 1,000 chars for readability
- Use multiple messages for long content (feels more conversational)

### Handle the 24h window (WhatsApp)
- If customer goes quiet, last message should invite response
- "¿Tienes alguna otra pregunta?" keeps window open
- Don't say "I'll send you X tomorrow" without a template ready

### Media over text
- Product images > text descriptions
- Voice messages feel personal (Telegram especially)
- PDFs for invoices/quotes (both platforms support)

### Escalation triggers
If these happen, consider human handoff or escalation:
- Customer asks to "talk to a real person"
- Complaint or frustration language
- Request outside business scope
- Payment/refund disputes

---

*Last updated: 2026-03-12*
