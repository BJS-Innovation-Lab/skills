# Sleep Consolidation

**Job Name:** `Sleep Consolidation`  
**Schedule:** `0 3 * * *` (3:00 AM daily)  
**Target:** `isolated`  
**Model:** `sonnet`

## Purpose

Nightly job that:
1. Processes the day's learnings
2. Updates service/credential indexes (prevents credential amnesia)
3. Pushes to Hive Mind
4. Commits changes

## The Job

```json
{
  "name": "Sleep Consolidation",
  "schedule": {"kind": "cron", "expr": "0 3 * * *", "tz": "America/New_York"},
  "sessionTarget": "isolated",
  "payload": {
    "kind": "agentTurn",
    "model": "sonnet",
    "timeoutSeconds": 600,
    "message": "🌙 NIGHTLY SLEEP CONSOLIDATION\n\nStep 1: Read today's memory log (memory/YYYY-MM-DD.md)\n\nStep 2: Extract learnings\n- Corrections → memory/learning/corrections/YYYY-MM-DD.md\n- Insights → memory/learning/insights/YYYY-MM-DD.md\n\nStep 3: Update Service & Credential Indexes\nCheck for NEW services/APIs/credentials set up today.\nIf found, update memory/core/CREDENTIALS-INDEX.md.\n\nStep 4: Push to Hive Mind\nsource rag/.env && AGENT_NAME=$AGENT node skills/hive-mind/scripts/hive-push.cjs --verbose\n\nStep 5: Commit\ngit add -A && git commit -m \"sleep: consolidate $(date +%Y-%m-%d)\"\n\nIf nothing significant, reply HEARTBEAT_OK."
  },
  "delivery": {"mode": "none"}
}
```

## Why This Matters

Without sleep consolidation:
- Learnings get lost in daily logs
- Credentials get forgotten (credential amnesia)
- Service status isn't tracked
- No push to collective Hive Mind

---

**Runs before:** Memory Refresh (3:30 AM)
