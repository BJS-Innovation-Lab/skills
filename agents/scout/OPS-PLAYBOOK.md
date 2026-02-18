# Scout's Ops Playbook

> Everything I (Sybil) learned about deploying and maintaining VULKN agents, distilled for Scout.
> This is a living document — updated with every deployment and incident.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   BJS LABS / VULKN                   │
│                                                      │
│  HQ (Mac Mini)              Cloud (Railway/VPS)      │
│  ┌──────────┐              ┌──────────────────┐      │
│  │ Sybil    │◄──A2A───────►│ Field Agents     │      │
│  │ Saber    │              │ (per client)      │      │
│  │ Scout    │              └──────────────────┘      │
│  │ Santos   │                                        │
│  └──────────┘                                        │
│                                                      │
│  Shared: Supabase (BJS), A2A Relay (Railway)         │
│  Per-client: Supabase + Vercel + Railway             │
└─────────────────────────────────────────────────────┘
```

## Per-Client Stack

| Service | Purpose | Provisioned By |
|---------|---------|---------------|
| GitHub repos (frontend + backend) | Source code | vulkn-software-manager |
| Supabase project | DB + Auth + Storage | vulkn-software-manager |
| Vercel project | Frontend hosting | vulkn-software-manager |
| Railway service | Backend + OpenClaw agent | vulkn-software-manager |

## Deployment Checklist

### Pre-Deploy
- [ ] Client profile exists (name, industry, timezone, language)
- [ ] Founder (Johan) has done client intake
- [ ] Org tokens configured in `config/hq-tokens.json`

### Deploy Steps
1. Provision infra (vulkn-software-manager runs all 4 sub-skills)
2. Clone field template to agent workspace
3. Configure IDENTITY.md, USER.md, SOUL.md for the client
4. Set up Telegram bot (via @BotFather) or WhatsApp channel
5. Configure A2A daemon + register with relay
6. Run field-onboarding checklist (5 phases)
7. Set up cron jobs (nightly report, self-improvement, session reset, disk cleanup, auto-update)
8. Verify: send test message, confirm A2A round-trip, check memory sync

### Post-Deploy (first 48 hours)
- [ ] Monitor first nightly report
- [ ] Verify daily memory file is being written
- [ ] Check identity is correct (NOT contaminated)
- [ ] Verify client can reach agent on all channels
- [ ] Run self-improvement pipeline manually once

---

## Known Failure Modes (Lessons Learned)

### 1. Identity Contamination (CRITICAL)
**What:** Agent thinks it's someone else. Shares wrong info with clients.
**How it happened:** Santos committed personal files (IDENTITY.md, USER.md, MEMORY.md) to shared skills repo. Sam did `git pull` and got overwritten. Spent a full day as Santos, shared internal team structure with clients.
**Fix:** Identity files are now gitignored. NEVER commit IDENTITY.md, USER.md, or MEMORY.md to shared repos.
**Prevention:** 
- Verify identity after every `git pull`
- HEARTBEAT.md checks identity file on every heartbeat
- field-security skill Layer 1 detects identity mismatch

### 2. Context Corruption / tool_use_id Bug
**What:** Messages repeat 15x, agent loses all context, can't function.
**How it happened:** OpenClaw 2026.2.14 had a bug with tool_use_id handling. Context fills with duplicate messages.
**Fix:** Update to OpenClaw 2026.2.17+ (`npm update -g openclaw`)
**Prevention:**
- Auto-update cron (Mondays 3 AM)
- Session reset cron (daily 4 AM) clears corrupted context
- `update.checkOnStart: true` in OpenClaw config

### 3. Memory Not Written
**What:** Agent works all day with clients but writes nothing to daily memory file.
**How it happened:** Agent too busy juggling multiple users. Pre-compaction flushes fire but agent is processing other messages.
**Fix:** Sam added self-checks — HEARTBEAT verifies daily file exists, noon cron forces write if empty.
**Prevention:**
- HEARTBEAT.md includes daily memory check
- Noon cron as safety net
- Nightly report flags zero-activity days (data quality gate in remote-analyze.cjs)

### 4. Memory Contamination (Cross-Agent Bleed)
**What:** Agent's memory files contain another agent's reflections, procedures, team perspective.
**How it happened:** Multiple vectors:
1. **Hardcoded defaults in shared scripts** (ROOT CAUSE, Feb 2026): `search-supabase.cjs`, `auto-retrieve.cjs`, and `smart-trigger.cjs` all had `agent: 'sybil'` hardcoded as the default. Any agent running these without `--agent <name>` got Sybil's 628 document chunks from Supabase. Those got absorbed into MEMORY.md/reflections as if they were the agent's own. Hit Santos AND Sam.
2. When identity was wrong, memory-api generated boot memory with wrong context.
3. core/ files written from wrong agent's perspective.
**Fix (Feb 18 2026, commit 2cd5471):** All three scripts now auto-detect agent name from `IDENTITY.md` instead of hardcoding. Manual decontamination for affected agents (rebuilt MEMORY.md, core/ files).
**Prevention:**
- **NEVER hardcode an agent name as default in shared scripts** — always read from IDENTITY.md
- IDENTITY.md must be filled in IMMEDIATELY at deploy (blank = broken)
- Verify identity BEFORE running memory-load.cjs
- core/ files should reference "me" correctly (check team.md for "— me" marker)
- After any identity fix, ALWAYS rebuild memory files
- Agent must run `sync-memory.cjs` early so their OWN docs exist in Supabase

### 5. Shared Supabase Key Exposure
**What:** Field agent has BJS shared Supabase service key, could access other agents' data.
**Risk:** Client-facing agents shouldn't see internal BJS data.
**Current state:** sync-memory.cjs uses shared key (needed for document table). sync-conversations.cjs also uses it.
**Mitigation:** 
- RLS policies scope queries by agent_id
- Field agents only need THEIR data
- Long-term: per-client Supabase projects for client data

### 6. Disk Growth (Silent)
**What:** Transcripts and inbound media grow forever, eventually fill disk.
**How it happens:** Every session writes .jsonl, every Telegram image saved to media/inbound/. No built-in rotation.
**Fix:** Monthly disk-cleanup.sh cron (30-day retention for transcripts + media).
**Prevention:** Cleanup cron is mandatory in deploy checklist.

### 7. A2A Daemon Zombies
**What:** A2A daemon process dies but PID file remains. Agent appears connected but can't receive messages.
**Fix:** Zombie fix script (daemon-start.sh now checks if PID is actually running).
**Prevention:** HEARTBEAT.md verifies daemon is responsive, not just that PID file exists.

---

## Cron Job Standard (Every Agent)

| Cron | Schedule | Purpose |
|------|----------|---------|
| Nightly Report | 10 PM agent TZ | Send daily activity summary to HQ |
| Self-Improvement | 11 PM agent TZ | Review transcripts, auto-fix, propose changes |
| Auto-Update | 3 AM Monday agent TZ | `npm update -g openclaw` |
| Session Reset | 4 AM daily agent TZ | Clear context corruption |
| Memory Sync | Every 30 min (heartbeat) | Push files to Supabase |
| Disk Cleanup | 3 AM 1st of month | Rotate transcripts + media (30 days) |

---

## Quick Reference

### Key Repos
- Field template: `https://github.com/BJS-Innovation-Lab/vulkn-field-template`
- Shared skills: `https://github.com/BJS-Innovation-Lab/skills`

### Key Supabase Tables (BJS Shared)
- `documents` — agent memory files (embedded, searchable)
- `conversations` — raw message logs (for HQ reporting only)
- `bjs_knowledge` — shared knowledge base (read: all, write: HQ)

### Agent UUIDs
- Sybil: 5fae1839-ab85-412c-acc0-033cbbbbd15b
- Saber: 415a84a4-af9e-4c98-9d48-040834436e44
- Sam: 62bb0f39-2248-4b14-806d-1c498c654ee7
- Santos: e7fabc18-75fa-4294-bd7d-9e5ed0dedacb
- Sage: f6198962-313d-4a39-89eb-72755602d468
- Scout: (TBD — assign on deployment)

### A2A Relay
- URL: https://a2a-bjs-internal-skill-production-f15e.up.railway.app

### Founder Contacts
- Bridget: Telegram 5063274787
- Johan: Telegram 6151122745

---

## Updating This Playbook

Every time something breaks, every time a deploy reveals a new gotcha:
1. Add it to "Known Failure Modes"
2. Update the checklist if a step was missing
3. Commit and push

This playbook is Scout's brain. Keep it sharp.
