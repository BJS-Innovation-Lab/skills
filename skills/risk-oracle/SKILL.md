---
name: risk-oracle
description: "Pre-action risk assessment. Checks if proposed actions are similar to past corrections, giving the agent a 'sense of risk' before dangerous operations. Based on MemoryArena research showing agents fail to APPLY corrections even when stored."
metadata: {"openclaw": {"emoji": "🎯"}}
---

# Risk Oracle

Pre-action risk assessment that gives agents a "sense of risk" before dangerous operations.

## The Problem

Agents log corrections but don't check them before repeating mistakes. The correction EXISTS but isn't RETRIEVED at the right time.

## How It Works

Before risky actions, run:
```bash
node risk-check.cjs "git push origin main"
```

Returns:
```json
{
  "risk": "high",
  "reason": "Similar to COR-20260221-001 (git memory contamination)",
  "correction_id": "COR-20260221-001",
  "external_effect": true
}
```

If risk is HIGH, inject warning into agent context before proceeding.

## Setup

1. Run `setup.sql` in Supabase SQL Editor
2. Sync existing corrections: `node sync-correction.cjs --all`
3. After writing new corrections, sync them: `node sync-correction.cjs path/to/correction.md`

## Integration

Hook into agentic-learning: after writing a correction, auto-sync to Supabase for risk detection.

## Research Basis

Based on MemoryArena (arXiv:2602.16313, Choi & Pentland 2026): "Agents with near-saturated performance on recall benchmarks perform poorly in agentic settings."

Key insight: Retrieval ≠ Application. Memory must be consulted BEFORE action.
