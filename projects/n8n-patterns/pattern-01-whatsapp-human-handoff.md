# Pattern 01: WhatsApp Support with Human Handoff

## Source
- n8nworkflows.xyz workflow #11648
- Author: shadrack-ago (CustomCX)

## What It Does
AI agent handles WhatsApp support, but defers to human when:
1. Human agent is actively responding
2. Human was active in last 2 hours

## Architecture
```
WhatsApp msg → Check human active? → 2h timeout filter → AI Agent → Reply
                    ↓
              External API (tracks human activity)
```

## Key Components

### 1. Human-in-the-Loop Check
```javascript
// External API call to check human activity
GET https://[your-domain]/api/check-human?phone={{phone}}
// Returns: { humanActive: boolean, lastHumanResponseTime: datetime }
```

**VULKN Note:** They use an external dashboard. We'd integrate this into our existing session state in Supabase.

### 2. 2-Hour Timeout Filter (n8n Filter node)
```javascript
// Allow AI if:
// - humanActive is false, OR
// - lastHumanResponseTime > 2 hours ago
conditions: [
  { humanActive === false },
  { lastHumanResponseTime < $now.minus({ hours: 2 }) }
]
```

**VULKN Note:** Good pattern. Configurable timeout makes sense (some businesses want 30min, others 4h).

### 3. Memory Buffer
```javascript
// Per-phone session, 20 message window
sessionKey: phoneNumber
contextWindowLength: 20
```

**VULKN Note:** We already do this. Nothing new.

### 4. WhatsApp via Twilio
```javascript
to: phoneNumber.replaceAll('whatsapp:', '')
from: businessNumber.replaceAll('whatsapp:', '')
toWhatsapp: true
```

**VULKN Note:** We use native WhatsApp Business API, not Twilio. Different auth but same concept.

---

## Claims to Verify

### ❓ "14,000 character limit for WhatsApp"
**Status:** NEEDS VERIFICATION

The n8n workflow claims WhatsApp has a 14,000 character limit. Actual limits:
- WhatsApp Cloud API: **4,096 characters** per text message
- WhatsApp template messages: varies by component
- Twilio may have different limits than direct API

**Action:** Test with our Twilio setup. The 14k number seems wrong - likely conflating with something else.

### ✅ "24-hour window for business messaging"
**Status:** TRUE

WhatsApp requires user to initiate conversation. Business can reply within 24h. After that, only template messages allowed.

### ✅ "2-hour inactivity = AI resumes"
**Status:** GOOD PATTERN

Not a platform limit, just their logic. Configurable.

---

## What's Actually Useful

### 1. Human Activity Tracking Pattern
Need to track:
- `session_id` (phone number or chat ID)
- `last_human_response_at` timestamp
- `human_active` boolean

**Schema addition for Supabase:**
```sql
ALTER TABLE chat_sessions ADD COLUMN last_human_response_at TIMESTAMPTZ;
ALTER TABLE chat_sessions ADD COLUMN human_active BOOLEAN DEFAULT false;
```

### 2. Timeout Logic
```javascript
const shouldAIRespond = (session) => {
  if (!session.human_active) return true;
  const hoursSinceHuman = (Date.now() - session.last_human_response_at) / 3600000;
  return hoursSinceHuman > session.handoff_timeout_hours || 2;
};
```

### 3. System Prompt Boundaries
Their prompt includes:
- Role definition (what the bot IS)
- Exclusions (no politics, medical, personal)
- Output limits (character count)
- Escalation triggers (contact human support at...)

**VULKN Note:** We should template these for clients.

---

## What's NOT Useful

1. **External dashboard requirement** - We don't need a separate dashboard. State lives in Supabase.
2. **Google Drive for RAG** - Overly complex. We use direct document upload.
3. **Airtable CRM** - Specific to their setup.
4. **Calculator/Think tools** - Overkill for most SMB support.

---

## VULKN Implementation

We already have most of this. What we should add:

### 1. Config option for handoff timeout
```yaml
handoff:
  timeout_hours: 2
  trigger_phrases: ["talk to human", "real person", "agent"]
  auto_resume: true
```

### 2. Client dashboard visibility
Mark messages as AI or Human in transcript view.

### 3. Template prompt with boundaries
```markdown
You are {business_name}'s assistant. 
ONLY answer questions about {business_topics}.
For {excluded_topics}, say "I can help with {business_topics}. For other questions, contact {human_contact}."
Keep responses under {max_chars} characters.
```

---

## Next Steps
1. [ ] Verify WhatsApp character limit (test with Twilio)
2. [ ] Add handoff timeout to field agent config
3. [ ] Create client dashboard for AI/Human message visibility
4. [ ] Template the system prompt boundaries

---
*Analyzed: 2026-03-12*
