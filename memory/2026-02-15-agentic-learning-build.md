# 2026-02-15 — Agentic Learning Skill Build

## What Was Built

Built the new `agentic-learning` skill, replacing the old `self-improving-agent` skill by merging it with the three-tier memory architecture's Tier 3 (Learning Layer).

### Files Created

| File | Description |
|------|-------------|
| `skills/agentic-learning/SKILL.md` | Complete, self-contained skill doc (~20KB). Covers all entry types, pipeline stages, installation, and migration. |
| `skills/agentic-learning/hooks/openclaw/handler.js` | Bootstrap hook — injects learning system reminder with 3 entry types and stakes gate |
| `skills/agentic-learning/scripts/activator.sh` | UserPromptSubmit hook — evaluates for corrections, insights, outcomes |
| `skills/agentic-learning/scripts/error-detector.sh` | PostToolUse hook — detects errors and suggests correction vs daily log |
| `skills/agentic-learning/assets/SKILL-TEMPLATE.md` | Copied from old skill — template for extracting learnings into standalone skills |
| `skills/agentic-learning/references/installation.md` | Full step-by-step installation guide with migration steps |

### Notion Page

Created "Agentic Learning System" page (🧠) under BJS LABS.
Page ID: `3087a723-4ce4-8130-86ac-e910cf33fe2c`

### Source of Truth

Used `skills/self-improving-agent/MERGED-SPEC.md` (authored by Sybil, Saber, Bridget) as the source of truth.

### What's NOT Done Yet (Implementation Tasks)

- [ ] Create actual `memory/learning/` directories in workspace
- [ ] Update HEARTBEAT.md with outcome check section
- [ ] Update AGENTS.md boot sequence
- [ ] Migrate existing `.learnings/` content
- [ ] Implement embedding-based surprise filter
- [ ] Implement auto-promotion engine
- [ ] Deprecate old `self-improving-agent` skill

### Key Design Decisions

- 3 entry types only (correction, insight, outcome) — activity goes to daily log
- Stakes gate as primary noise filter (must articulate "what's at risk")
- Corrections always stored (bypass surprise filter)
- Outcome loop on 3/7/14 day heartbeat schedule
- Auto-promote after 3 validations (no manual bottleneck)
- Weekly synthesis is a system audit, not a passive report
