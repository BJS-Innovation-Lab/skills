# BJS Knowledge Base — Guide for CS Agent

> **Every escalation that happens twice is a failure.** The first time is learning; the second time means we didn't capture the fix.

## Your Role

As CS Agent, you're the primary writer to the BJS Knowledge Base. You see every field agent problem through escalations and nightly reports. When you resolve an issue, evaluate: **is this fix reusable?** If yes, write it to the KB so the next field agent can self-serve.

## Tools

Both tools are in `rag/` in the shared skills repo. They need a `.env` file with `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (or `SUPABASE_ANON_KEY`), and `OPENAI_API_KEY`.

### Writing Entries

```bash
node rag/bjs-knowledge-write.cjs \
  --title "How to handle customer requesting a refund" \
  --content "1) Acknowledge frustration. 2) Ask what went wrong. 3) Offer fix. 4) If insist, route to Johan." \
  --category escalation \
  --tags "customer-angry,refund,routing" \
  --created-by Sam
```

**Required fields:** `--title`, `--content`, `--category`, `--created-by`

### Searching (Before Writing)

Always search before writing to avoid duplicates:

```bash
node rag/bjs-knowledge-search.cjs "refund request"
```

If a relevant entry exists, update it instead:

```bash
node rag/bjs-knowledge-write.cjs --update <id> --content "Updated content..."
```

### Listing All Entries

```bash
node rag/bjs-knowledge-write.cjs --list
node rag/bjs-knowledge-write.cjs --list --category escalation
```

### Other Commands

```bash
node rag/bjs-knowledge-write.cjs --delete <id>        # Remove entry
node rag/bjs-knowledge-search.cjs --browse             # Browse all
node rag/bjs-knowledge-search.cjs --id <uuid>          # Get specific entry
node rag/bjs-knowledge-search.cjs "query" --compact    # Compact output (for context injection)
node rag/bjs-knowledge-search.cjs "query" --json       # JSON output
```

## Categories

| Category | Use For | Example |
|----------|---------|---------|
| `procedure` | Step-by-step how-to instructions | "How to set up cron jobs for a new client" |
| `best-practice` | Lessons from real client deployments | "Always confirm timezone before scheduling" |
| `template` | Response templates that worked | "De-escalation script for angry customer" |
| `skill-doc` | How a specific skill works | "Creativity engine requires 4 steps, no shortcuts" |
| `escalation` | When/how to handle specific issues | "Customer wants refund → route to Johan" |
| `tool-guide` | Error fixes, workarounds, gotchas | "A2A truncates messages >2KB, use GitHub instead" |

## When to Write

| Write? | Situation |
|--------|-----------|
| ✅ Yes | You gave a field agent specific instructions that worked |
| ✅ Yes | You found a workaround for a tool/skill issue |
| ✅ Yes | You wrote a de-escalation script that resolved a situation |
| ✅ Yes | You discovered a procedure that wasn't documented |
| ❌ No | One-off issue specific to one customer (not generalizable) |
| ❌ No | Issue requires founder intervention (not self-servable) |
| ❌ No | Already exists in the knowledge base (search first!) |

## Entry Quality

Keep entries concise and actionable. Field agents see these during live conversations — they need answers fast.

**Good entry:**
```
Title: How to handle customer requesting a refund
Content: 1) Acknowledge frustration. 2) Ask what went wrong. 
3) Offer to fix first. 4) If insist, route to Johan — agents 
cannot authorize refunds. Say "Let me connect you with someone 
who can help directly."
```

**Bad entry:**
```
Title: Refunds
Content: Sometimes customers want refunds. It depends on the situation.
```

## The Loop

```
Field agent hits problem
  → Escalates to you
    → You resolve it
      → You write fix to bjs_knowledge
        → Next field agent queries KB via smart-trigger
          → Self-serves without escalating
```
