# Memory Refresh — Agent Review

**Job Name:** `Memory Refresh — Agent Review`  
**Schedule:** `30 3 * * *` (3:30 AM daily, after sleep-consolidation)  
**Target:** `isolated`  
**Model:** `sonnet`

## Why This Exists

The old `memory-load.cjs` script was generating garbage MEMORY.md content:
- Ran with meaningless query ("periodic refresh")
- Couldn't understand context or prioritize
- Output was stale A2A snippets and random file paths

**New approach:** YOU read your recent work and write what future-YOU needs to know.

## The Job

```json
{
  "name": "Memory Refresh — Agent Review",
  "schedule": {"kind": "cron", "expr": "30 3 * * *", "tz": "America/New_York"},
  "sessionTarget": "isolated",
  "payload": {
    "kind": "agentTurn",
    "model": "sonnet",
    "timeoutSeconds": 300,
    "message": "📝 MEMORY REFRESH — Manual Review\n\nRewrite MEMORY.md by actually reading your recent work.\n\n## Step 1: Read Recent Context\nRead the last 3 daily logs:\n- memory/$(date +%Y-%m-%d).md (today)\n- memory/$(date -v-1d +%Y-%m-%d).md (yesterday)  \n- memory/$(date -v-2d +%Y-%m-%d).md (2 days ago)\n\n## Step 2: Read Core Files\n- memory/core/CREDENTIALS-INDEX.md\n- IDENTITY.md\n- Any active project READMEs mentioned in recent logs\n\n## Step 3: Write MEMORY.md\nRewrite MEMORY.md with these sections:\n\n1. **Identity** — Who am I (brief)\n2. **Services Status** — What's working (APIs, integrations)\n3. **Active Projects** — Current work + status\n4. **Recent Decisions** — Key decisions from last 3 days\n5. **Team Context** — Agent IDs, who's doing what\n6. **Relevant KB** — 2-3 actively useful learnings\n\n## Constraints\n- Keep under 4000 chars\n- Prioritize ACTIONABLE context over history\n- Services/credentials you set up → Services Status\n- Active projects → include current state\n- Delete stale info\n\n## Step 4: Commit\n```bash\ngit add MEMORY.md && git commit -m \"memory: refresh $(date +%Y-%m-%d)\"\n```\n\nThis is YOU writing what future-YOU needs. Make it useful."
  },
  "delivery": {"mode": "none"}
}
```

## What Changed

| Before | After |
|--------|-------|
| Script embeds query + searches | Agent reads actual logs |
| "periodic refresh" query = garbage | Agent understands context |
| Stale A2A snippets in output | Real services/projects status |
| ~2000 chars of noise | ~4000 chars of signal |

## To Add This Job

```bash
openclaw cron add --file deploy/cron-jobs/memory-refresh-agent-review.json
```

Or via gateway config.

---

**Delete if you have it:** `Memory API Refresh` (the old script-based job)
