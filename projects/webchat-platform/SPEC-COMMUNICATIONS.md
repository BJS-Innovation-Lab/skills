# Communications Hub — Feature Spec

**Author:** Sybil  
**Date:** 2026-03-06  
**For:** Johan (Frontend Implementation)  
**Status:** Ready for Development

---

## Overview

A unified communications section in webchat-platform where founders can:
1. See messages sent TO them from agents
2. Monitor all agent-to-agent communications
3. Send messages to any agent
4. Filter/search message history

---

## Database

Already exists in Supabase:

**Table: `agent_messages`**
```sql
id              UUID PRIMARY KEY
client_id       TEXT (default 'vulkn-internal')
from_agent      TEXT
to_agent        TEXT
subject         TEXT
message         TEXT
message_type    TEXT (message, escalation, alert, notification)
priority        TEXT (low, normal, high, urgent)
metadata        JSONB
read            BOOLEAN
read_at         TIMESTAMP
archived        BOOLEAN
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

**Table: `known_agents`**
```sql
agent_id        TEXT PRIMARY KEY
display_name    TEXT
webhook_url     TEXT
client_id       TEXT
role            TEXT (agent, admin)
active          BOOLEAN
created_at      TIMESTAMP
```

---

## UI Components

### 1. Main Layout

```
┌─────────────────────────────────────────────────────────┐
│  💬 Communications                        [+ Compose]   │
├─────────────────────────────────────────────────────────┤
│  [My Inbox (3)] [All Messages] [▼ Filter by Agent]      │
├─────────────────────────────────────────────────────────┤
│  🔍 Search messages...                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔴 URGENT  From: Saber  →  You      11:30 AM   │   │
│  │ Subject: Client Emergency                       │   │
│  │ "Need your approval on the refund request..."   │   │
│  │                              [Reply] [Archive]  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🟢 normal  From: Sybil  →  Saber    11:19 AM   │   │
│  │ Subject: Funnel Test                            │   │
│  │ "Your webhook is registered..."                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. Tab Behavior

| Tab | Query Filter | Badge |
|-----|--------------|-------|
| My Inbox | `to_agent = current_user` | Unread count |
| All Messages | No filter (or `client_id = 'vulkn-internal'`) | Total today |
| Filter by Agent | `from_agent = X OR to_agent = X` | — |

### 3. Message Card

```tsx
interface MessageCardProps {
  id: string;
  from_agent: string;
  to_agent: string;
  subject?: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  created_at: string;
  onReply: () => void;
  onArchive: () => void;
  onMarkRead: () => void;
}
```

**Priority badges:**
- 🔴 `urgent` — Red badge, maybe pulse animation
- 🟠 `high` — Orange badge
- 🟢 `normal` — Green or no badge
- ⚪ `low` — Gray or muted

**Unread indicator:** Bold text or left border highlight

### 4. Compose Modal

```
┌─────────────────────────────────────────┐
│  📝 New Message                    [X]  │
├─────────────────────────────────────────┤
│  To: [▼ Select Agent]                   │
│       ☐ sybil                           │
│       ☐ saber                           │
│       ☐ sage                            │
│       ☐ santos                          │
│       ☐ sam                             │
│                                         │
│  Subject: [____________________]        │
│                                         │
│  Priority: [▼ normal]                   │
│                                         │
│  Message:                               │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│              [Cancel]  [Send Message]   │
└─────────────────────────────────────────┘
```

### 5. Reply Inline

When clicking Reply, expand a text area below the message:

```
┌─────────────────────────────────────────────────┐
│ 🟢 From: Saber → You                 11:30 AM   │
│ "Need your approval..."                         │
├─────────────────────────────────────────────────┤
│ ↩️ Reply to Saber:                              │
│ ┌─────────────────────────────────────────┐    │
│ │ Type your reply...                      │    │
│ └─────────────────────────────────────────┘    │
│                          [Cancel] [Send]        │
└─────────────────────────────────────────────────┘
```

---

## API Endpoints

### GET /api/messages
```ts
// Query params
interface MessagesQuery {
  inbox?: string;        // Filter to_agent (e.g., "bridget")
  agent?: string;        // Filter from_agent OR to_agent
  unread?: boolean;      // Only unread
  since?: string;        // ISO timestamp
  limit?: number;        // Default 50
  offset?: number;       // Pagination
}

// Response
interface MessagesResponse {
  messages: AgentMessage[];
  total: number;
  unread_count: number;
}
```

### POST /api/messages
```ts
interface SendMessageBody {
  to_agent: string;
  message: string;
  subject?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

// Sets from_agent based on authenticated user
```

### PATCH /api/messages/:id
```ts
interface UpdateMessageBody {
  read?: boolean;
  archived?: boolean;
}
```

---

## Real-time Updates

Use Supabase Realtime subscription:

```ts
const subscription = supabase
  .channel('agent_messages')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'agent_messages' },
    (payload) => {
      // Add new message to UI if it matches current filter
      if (payload.new.to_agent === currentUser || showingAll) {
        addMessage(payload.new);
        playNotificationSound();
      }
    }
  )
  .subscribe();
```

---

## User Stories

1. **As Bridget**, I want to see messages agents send me so I can respond to escalations
2. **As Johan**, I want to monitor agent-to-agent chatter so I can spot issues
3. **As an admin**, I want to send messages to any agent from the web UI
4. **As an admin**, I want to search message history for debugging
5. **As an admin**, I want real-time updates without refreshing

---

## Navigation

Add to sidebar:
```
📊 Dashboard
👥 Agents
💬 Communications  ← NEW (with unread badge)
⚙️ Settings
```

---

## Auth

Use existing Supabase auth. Check user's role in `known_agents`:
- `role = 'admin'` → Can see all messages, send as self
- `role = 'agent'` → (Future: agent dashboard view?)

For now, only admins (Bridget, Johan) access this section.

---

## Priority

**MVP (v1):**
- [ ] My Inbox view
- [ ] All Messages view
- [ ] Compose new message
- [ ] Mark as read
- [ ] Real-time updates

**v2:**
- [ ] Filter by agent dropdown
- [ ] Search
- [ ] Archive
- [ ] Reply inline
- [ ] Priority filtering
- [ ] Date range filter

---

## Questions for Johan

1. Should this be a new route (`/communications`) or a section within an existing page?
2. Notification sound preference?
3. Mobile responsive needed for v1?
4. Any existing component library patterns to follow?

---

*Spec written by Sybil. Ping me with questions!*
