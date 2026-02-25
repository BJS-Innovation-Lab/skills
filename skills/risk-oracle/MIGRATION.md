# Risk Oracle Migration Guide

## Current Status: Local (Sybil only)

The risk oracle is currently running locally on Sybil's machine. This document describes how to roll it out to other agents.

## Files to Push to Other Agents

When ready to deploy team-wide:

### 1. Skill Files (push to skills repo)
```
skills/risk-oracle/
├── SKILL.md           # Skill description
├── README.md          # Documentation
├── package.json       # Dependencies (@google/generative-ai)
├── local-db.cjs       # Local JSON database
├── sync-correction-local.cjs  # Sync corrections
├── risk-check-local.cjs       # Risk assessment
└── MIGRATION.md       # This file
```

### 2. Environment Setup (each agent needs)
```bash
# Create .env in skills/risk-oracle/
echo "GOOGLE_API_KEY=<key>" > skills/risk-oracle/.env

# Install dependencies
cd skills/risk-oracle && npm install
```

### 3. Initial Sync
Each agent runs:
```bash
cd skills/risk-oracle && npm run sync
```

This syncs their local corrections to their local database.

## Future: Team-Wide Shared Database

When ready for shared learning:

1. **Create Supabase table** (use setup.sql)
2. **Update scripts** to use Supabase instead of local-db.cjs
3. **Sync all agent corrections** to shared database
4. **Benefits:**
   - Saber's git mistake teaches me
   - My config error teaches Santos
   - Collective learning across team

## Integration Points

### Option A: Manual Check (current)
Agent consciously runs risk-check before risky actions:
```bash
node skills/risk-oracle/risk-check-local.cjs "git push to shared repo"
```

### Option B: WORKFLOW_AUTO.md Rule
Add to agent's workflow:
```markdown
## Pre-Action Checks
Before git push/add in shared repos:
1. Run: node skills/risk-oracle/risk-check-local.cjs "<action>"
2. If HIGH risk, review the correction
3. Then proceed
```

### Option C: OpenClaw Hook (future)
Request OpenClaw feature: pre-exec hook that runs risk-check automatically.

## Correction Format

For corrections to be synced properly, use YAML fields:
```yaml
---
type: correction
id: COR-YYYYMMDD-XXX
prior_belief: "What I thought before"
corrected_to: "What I know now"
context: "What happened"
stakes: high|medium|low
---
```

Or for prose-format corrections, manually sync using the local-db API.

## Test Commands

```bash
cd ~/.openclaw/workspace/skills/risk-oracle

# Check stats
npm run stats

# Sync all corrections
npm run sync

# Test risk check
npm run check "git add . in shared repo"
```

---

*Created: 2026-02-25*
*Status: Testing on Sybil, pending team rollout*
