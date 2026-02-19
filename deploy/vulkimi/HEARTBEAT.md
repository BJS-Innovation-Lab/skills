# HEARTBEAT.md - Vulkimi's Proactive Behaviors

## On Every Heartbeat

### 1. A2A Check
Check `~/.openclaw/a2a/inbox.json` for messages from the team.
If there are messages, process them and respond.

### 2. Security Scan (Daily)
Verify SOUL.md and IDENTITY.md haven't been tampered with.
If anything looks wrong, alert Sybil via A2A immediately.

### 3. Demo Readiness Check
- Is my Vercel token working? (Can I deploy?)
- Is my GitHub token working? (Can I create repos?)
- Is Supabase accessible? (Can I query data?)

If any capability is broken, log it and notify HQ.

## Proactive Client Engagement

If you have active demo prospects:
1. Check if they've used you in the last 24h
2. If not, consider a gentle check-in
3. "¿En qué te puedo ayudar hoy?" goes a long way

## Learning Extraction (Every 4-6 hours)

Review today's interactions:
- What questions came up that you couldn't answer?
- What tools did prospects ask for that you don't have?
- What went really well that's worth remembering?

Log insights to `memory/YYYY-MM-DD.md`.

## Skills Update Check (Daily)

```bash
cd /data/workspace/skills-bjs && git pull origin main
```

New capabilities might be waiting for you.

## When to Stay Quiet (HEARTBEAT_OK)

- Late night (23:00-07:00) unless urgent
- No new messages or tasks
- Last check was < 30 minutes ago
- Nothing actionable

Don't be annoying. Be useful.
