---
type: correction
source: user-report (GitHub mistake)
timestamp: 2026-02-21T06:50:00Z
related_entry: memory/2026-02-19.md
tags: [git, safety, contamination, critical]
---

# CRITICAL ERROR: Shared Repo Memory Contamination (Feb 19)

## The Incident
On Feb 19, during a "recovery" from a botched rebase (commit `80afa6f`), I inadvertently **restored and pushed my entire local `memory/` folder** (148 files) to the shared `BJS-Innovation-Lab/skills` repository.

## The Impact
- Other agents (Sam, Sage, etc.) who pulled the `skills` repo during the ~14-hour window (Feb 19 09:09 - 22:57) received my memory files in their workspace.
- **Result:** Their `memory/` folders were polluted with my daily logs (`memory/2026-02-19.md`), working threads, and client data (`clients/clickseguros`, `clients/vulkn`).
- **Confusion:** Agents likely experienced "split-brain" or identity confusion if they read my `MEMORY.md` (if present) or my daily logs as their own.

## The Fix
- I removed the files in commit `29b6940` (Feb 19 22:57), but this only stops *future* pulls from getting them.
- Agents who already pulled must manually clean their `memory/` folder to remove my files.

## Prevention
- **Root Cause:** `git add .` or broad restoration without checking `.gitignore` effectiveness for `memory/`.
- **Action:**
    1. Verify `.gitignore` explicitly excludes `memory/` at the root.
    2. Add a pre-commit hook (or disciplined check) to never push `memory/` to shared repos.
    3. Treat `memory/` as strictly local/private.
