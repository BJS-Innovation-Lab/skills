# Learning Extraction: 2026-02-19

## 1. Git Rebase Recovery & Safety
**Context:** 453 files lost during a botched `git pull --rebase` recovery attempt.
**Observation:** `git reset HEAD~1` combined with selective recommitting silently drops files if they aren't explicitly tracked/staged again, especially during a rebase state.
**Correction:** 
- Never use `git reset HEAD~N` without `git diff --stat HEAD~N` first.
- If rebase goes wrong, abort (`git rebase --abort`) rather than resetting.
- Push protection (secrets) can block recovery commits, requiring history scrubbing.
**Surprise Score:** 0.95 (Catastrophic failure mode discovered)
**Status:** **STORED**

## 2. Cron Job Ownership & Token Burn
**Context:** Discovery that all cron jobs (including high-frequency checks) were running on Opus.
**Observation:** Indiscriminate use of high-intelligence models for routine maintenance (health checks, memory sync) causes massive token waste.
**Correction:** 
- **Model Tiering:** Routine/Maintenance = Sonnet/Flash; Complex/Creative = Opus.
- **Ownership:** Centralize specific domains (Security=Sybil, Clients=Sam, Escalation=Santos) to prevent overlap.
- **Event-Driven:** Downstream agents (Santos) should trigger *after* upstream agents (Sam) finish, not on arbitrary parallel schedules.
**Surprise Score:** 0.85 (Architectural inefficiency realized)
**Status:** **STORED**

## 3. A2A Task Protocol
**Context:** "Fire and forget" requests to other agents were getting lost or ignored.
**Observation:** Without a stateful tracking system, inter-agent requests lack accountability.
**Correction:** Implemented `agent_tasks` table in Supabase (SENT -> DELIVERED -> ACKNOWLEDGED -> COMPLETED).
**Insight:** Agents need a "manager" layer (dashboard/protocol) just like humans do to track commitments.
**Surprise Score:** 0.8 (New coordination primitive established)
**Status:** **STORED**

## 4. Auth Configuration Fragmentation
**Context:** Struggled to rotate Anthropic tokens due to 4 different file formats.
**Observation:** `auth-profiles.json`, `auth.json`, and `openclaw.json` all use slightly different schemas for the same credentials.
**Correction:** When rotating keys, check ALL auth vectors. Resetting usage stats (`errorCount`, `cooldownUntil`) is critical for immediate recovery.
**Surprise Score:** 0.6 (Annoying, but a known entropy pattern)
**Status:** *Skipped (< 0.7)*

## 5. Compaction Settings & Update Stability
**Context:** Massive token burn attributed to aggressive compaction settings after an OpenClaw update.
**Observation:** Updates may reset or alter default behaviors (compaction mode `safeguard` vs `default`).
**Correction:** Post-update checklist must include verifying `compaction` and `model` settings in `openclaw.json` / runtime config.
**Surprise Score:** 0.75 (Hidden cost driver identified)
**Status:** **STORED**
