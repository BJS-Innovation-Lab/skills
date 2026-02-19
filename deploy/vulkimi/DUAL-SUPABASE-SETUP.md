# Vulkimi — Dual Supabase Setup

## Two Databases, Two Purposes

### 1. Client Supabase (Vulkimi owns this)
- **URL:** `https://apyinhgahnmtphndbwij.supabase.co`
- **Purpose:** Client records, client app data, client domain
- **Access:** Vulkimi is owner/admin
- **Config location:** `~/.openclaw/workspace/.env` or app-level config
- **Rule:** Never write HQ/agent data here

### 2. BJS Supabase (HQ shared)
- **URL:** `https://fcgiuzmmvcnovaciykbx.supabase.co`
- **Purpose:** Conversation sync, memory sync, learning data — so HQ can monitor
- **Access:** Vulkimi gets anon key + service key (same as Sam)
- **Config location:** `~/.openclaw/workspace/rag/.env`
- **Rule:** Never write client records here

## rag/.env (BJS Supabase — for sync scripts)
```
SUPABASE_URL=https://fcgiuzmmvcnovaciykbx.supabase.co
SUPABASE_ANON_KEY=<BJS_ANON_KEY>
SUPABASE_SERVICE_KEY=<BJS_SERVICE_KEY>
OPENAI_API_KEY=<OPENAI_KEY>
```

## Environment Variables to Set in OpenClaw Config
```
# Client Supabase (for app/client work)
CLIENT_SUPABASE_URL=https://apyinhgahnmtphndbwij.supabase.co
CLIENT_SUPABASE_ANON_KEY=<CLIENT_ANON_KEY>
CLIENT_SUPABASE_SERVICE_KEY=<CLIENT_SERVICE_KEY>

# BJS Supabase is in rag/.env (for sync scripts only)
```

## Cron Jobs (use Field Agent Template)
All sync/memory jobs point to BJS Supabase via `rag/.env`.
All client work uses CLIENT_SUPABASE_* env vars.

## Critical Rule for Vulkimi's AGENTS.md
Add this section:

```markdown
## Dual Supabase — DO NOT MIX

You have TWO Supabase connections:

1. **Client Supabase** (CLIENT_SUPABASE_*) — for client records, app data
   - URL: apyinhgahnmtphndbwij.supabase.co
   - This is YOUR client's database. Never write agent/HQ data here.

2. **BJS Supabase** (rag/.env) — for conversation sync, memory, learnings
   - URL: fcgiuzmmvcnovaciykbx.supabase.co
   - This is HQ's shared database. Santos, Saber, and Sybil read from it.
   - Never write client records here.

The sync scripts (sync-conversations.cjs, sync-memory.cjs) automatically
use rag/.env. Client work should use CLIENT_SUPABASE_* from your env.
```

## Setup Steps

1. [ ] Run Supabase migration on client DB (step0-supabase-migration.sql)
2. [ ] Create rag/.env with BJS Supabase keys
3. [ ] Set CLIENT_SUPABASE_* env vars in Railway
4. [ ] Add dual-supabase section to AGENTS.md
5. [ ] Set up field agent template cron jobs
6. [ ] Test: `node rag/sync-conversations.cjs --hours 1` (should write to BJS)
7. [ ] Test: verify client DB is untouched
8. [ ] Confirm Santos can query Vulkimi's conversations from HQ
