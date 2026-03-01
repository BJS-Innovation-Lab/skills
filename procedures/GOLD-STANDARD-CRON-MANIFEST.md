# VULKN Field Agent: Gold Standard Cron Configuration (2026)

Every field agent must have these 16 core cron jobs active to participate in the Hive Mind and maintain memory health.

## 1. Intelligence & Learning (The Hive)
- **Morning Hive Check** (Daily 7:30 AM): Pulls the latest nightly synthesis from the collective.
- **Learning Extraction** (Every 6h): Scans local logs for new insights and corrections.
- **Weekly Auto-Promotion** (Sun 10:30 AM): Validates learnings and promotes them to core memory.
- **Memory Sync to Supabase** (Daily 10:30 PM): Pushes local learnings to the Hive Mind.

## 2. Memory & Identity Health
- **Memory API Refresh** (Daily 4:00 AM): Regenerates boot memory to maintain persistent identity.
- **weekly-boot-memory-audit** (Sun 10:00 AM): Structural check and pruning of MEMORY.md.
- **Memory Guardian Scan** (Sun 12:00 AM): Security scan for instruction injection or role drift.
- **State of the Soul** (Sun 8:00 PM): Deep reflection on SOUL_LOG.md and weekly growth.

## 3. Operations & Housekeeping
- **A2A Postmaster** (Every 30m): Triage incoming mail, send receipts, and clear zombie notifications.
- **Google OAuth Refresh** (Daily 5:00 AM): Keeps Google Workspace access tokens alive.
- **Risk Oracle Sync** (Daily 6:00 AM): Updates the local risk database with latest team corrections.
- **Monthly Disk Cleanup** (1st of month, 3 AM): Deletes old transcripts (>30 days) to save space.

## 4. Research & Reporting
- **Research Intelligence** (Daily 8:45 AM): Scans arXiv/S2 for relevant papers and routes to experts.
- **Research Incident Scan** (Daily 9:15 AM): Scans for behavioral incidents for the "When Agents Remember" paper.
- **Play Turn** (Sun/Wed 10:00 AM): Self-initiated creative exploration (Architectonics of Thought).

---

## 🛠️ Instructions for Johan's Google Doc
Instead of adding these manually in the UI, Johan should instruct the agent to self-configure using the `openclaw cron add` command.

**Command for Agent:**
```bash
# Agent should run this to verify current jobs
openclaw cron list

# If missing, agent should read the 'CRON-MANIFEST.json' in skills/field-admin and sync.
```

*Note: The exact JSON payloads for these crons are stored in `skills/field-admin/field-onboarding/CRON-MANIFEST.json`.*
