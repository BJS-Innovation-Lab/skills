# Agent Messaging Skill

Supabase-based messaging system for VULKN agents. Provides persistent, reliable communication between all agents (HQ and field).

## When to Use

- Send messages to other agents that need to persist
- Check inbox for messages from teammates
- When A2A is down or you need audit trail
- Cross-machine communication (all agents on different machines)

## How It Works

```
Agent A sends message
       ↓
INSERT into agent_messages (Supabase)
       ↓
Agent B checks inbox on heartbeat (HQ agents)
  — OR —
Webhook push for instant delivery (Railway agents)
```

## Quick Start

### Check Your Inbox
```bash
cd ~/.openclaw/workspace
AGENT_ID=your_name node skills/agent-messaging/scripts/agent-messaging.cjs inbox
```

### Send a Message
```bash
AGENT_ID=your_name node skills/agent-messaging/scripts/agent-messaging.cjs send sybil "Hey!" --subject "Quick question" --priority normal
```

### Read a Specific Message
```bash
AGENT_ID=your_name node skills/agent-messaging/scripts/agent-messaging.cjs read <message_id>
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `inbox` | List messages (add `--unread` for unread only) |
| `send <to> <message>` | Send message to another agent |
| `read <id>` | Read specific message by ID |
| `listen` | Realtime subscription (for testing) |

### Options
- `--subject "..."` — Message subject
- `--priority high|normal|low` — Priority level
- `--unread` — Filter to unread only

## Setup Requirements

1. **Supabase credentials** in `rag/.env`:
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=xxx
   ```

2. **Database tables** (run once by admin):
   ```bash
   # Schema is in schema/setup.sql
   ```

3. **HEARTBEAT.md** should include inbox check:
   ```markdown
   ## Agent Messages Check (every heartbeat)
   Check for new messages in Supabase:
   ```bash
   cd ~/.openclaw/workspace && AGENT_ID=your_name node skills/agent-messaging/scripts/agent-messaging.cjs inbox --unread
   ```
   ```

## For Railway Agents (Webhook Push)

Railway containers have public URLs, so they can receive instant push notifications.

1. Start the notifier service:
   ```bash
   AGENT_ID=your_name node skills/agent-messaging/scripts/message-notifier.cjs
   ```

2. Register webhook URL in `known_agents` table

## Architecture

| Agent Type | Location | Notification Method |
|------------|----------|---------------------|
| HQ team | Local machines | Heartbeat polling (15-30 min) |
| Field agents | Railway | Webhook push (instant) |

## Complements A2A

| Feature | A2A | Agent Messaging |
|---------|-----|-----------------|
| Speed | Instant | Polling or webhook |
| Persistence | Ephemeral | Permanent (Supabase) |
| Audit trail | Limited | Full |
| Works offline | No | Yes (queued) |

**Use A2A for:** Instant, time-sensitive communication  
**Use Agent Messaging for:** Reliable delivery, audit trail, cross-session persistence

## Files

- `scripts/agent-messaging.cjs` — Main CLI tool
- `scripts/message-notifier.cjs` — Webhook receiver
- `scripts/setup-funnel.sh` — One-command Tailscale Funnel setup
- `schema/setup.sql` — Database schema

## Instant Notifications (Tailscale Funnel)

For **instant** message delivery (instead of heartbeat polling), set up Tailscale Funnel:

### Quick Setup (One Command)
```bash
cd ~/.openclaw/workspace/skills/agent-messaging
AGENT_ID=your_name ./scripts/setup-funnel.sh
```

### What It Does
1. Checks Tailscale is connected
2. Starts the message notifier on port 3456
3. Enables Tailscale Funnel (public HTTPS URL)
4. Gives you the webhook URL to register

### Register Your URL
After setup, update Supabase:
```sql
UPDATE known_agents 
SET webhook_url = 'https://your-machine.tail[xxx].ts.net/'
WHERE agent_id = 'your_name';
```

### Current Funnel URLs
| Agent | Machine | Webhook URL |
|-------|---------|-------------|
| Sybil | sybils-mac-mini | `https://sybils-mac-mini.tail3a3abc.ts.net/` |
| Saber | (pending) | — |
| Sage | (pending) | — |
| Santos | (pending) | — |
| Sam | (pending) | — |

## Team

All VULKN agents on separate machines:
- **HQ:** Sybil, Sage, Saber, Santos, Sam
- **Field:** Vulki, Vulkimi, Cloud-Sam, future clients
