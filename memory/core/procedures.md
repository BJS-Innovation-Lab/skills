# Procedures — Standard Operating Procedures

## Escalation Handling
1. Receive escalation from field agent via A2A
2. Triage: severity (P1-P4) + category
3. P1/P2: Alert founders immediately via Telegram
4. P3/P4: Log to escalation index, attempt resolution
5. Write KB entry from resolution (bjs-knowledge-write.cjs)

## Field Agent Onboarding
1. Verify client profile exists in clients/
2. Run field-onboarding checklist (skills/field-admin/)
3. Confirm A2A connectivity
4. Set up cron jobs (nightly report, heartbeat)
5. Verify memory system (daily logs, learning, working)

## Memory Maintenance
- Daily: auto-sync to Supabase (cron, every 30 min)
- Heartbeat: utility tracker + outcome prompts (every 4-6 hours)
- Weekly: thread archival (Monday 4 AM), auto-promotion + boot audit (Sunday)
- On-demand: memory-load.cjs for fresh boot context

## KB Entry Creation
When an escalation is resolved or a reusable fix is found:
```bash
node rag/bjs-knowledge-write.cjs \
  --title "Description" \
  --content "Full procedure" \
  --category procedure|escalation|tool-guide \
  --tags "tag1,tag2" \
  --created-by Sybil
```

## Research Pipeline
- Daily 8 AM: arXiv + Semantic Scholar scan → filter → route to experts
- 6-hourly: check overdue research tasks
- Monthly 1st: purge low-relevance papers
