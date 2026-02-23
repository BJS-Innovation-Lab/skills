# 🚨 EMERGENCY RESET PROTOCOL

If your agent is rate-limited or looping, follow these exact steps:

1. **Stop the Gateway:** `openclaw gateway stop`
2. **Clear A2A Cache:** `rm ~/.openclaw/a2a/notifications.json ~/.openclaw/a2a/status.json`
3. **Reset Git:** `cd ~/.openclaw/workspace && git fetch origin && git reset --hard origin/main`
4. **Start Gateway:** `openclaw gateway start`

Sybil has fixed the duplicate cron bug and cleared the shared queue.
