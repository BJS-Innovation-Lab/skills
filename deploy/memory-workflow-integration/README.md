# Memory Workflow Integration

**Problem:** Agents have memory infrastructure installed but default to simpler behavior.

**Solution:** WORKFLOW_AUTO.md + fix for surprise-score.cjs

## What This Fixes

| Issue | Before | After |
|-------|--------|-------|
| Smart-trigger | Not running on messages | Classify every retrieval-relevant message |
| Surprise-score | Not computing before storing | Gate learnings with 0.0-1.0 score |
| Tier separation | Dumping to daily notes | Core/Working/Learning properly separated |
| Bug | surprise-score.cjs missing import | Fixed: EMBEDDING_MODEL now imported |

## Installation

### Option 1: Quick Copy (if you have workspace access)

```bash
# Copy WORKFLOW_AUTO.md to your workspace
cp /path/to/this/WORKFLOW_AUTO.md ~/.openclaw/workspace/

# Fix surprise-score.cjs import bug
sed -i '' 's/EMBEDDING_DIMS } = require/EMBEDDING_DIMS, EMBEDDING_MODEL } = require/' ~/.openclaw/workspace/rag/surprise-score.cjs
```

### Option 2: Manual

1. Create `WORKFLOW_AUTO.md` in your workspace (content below)
2. Edit `rag/surprise-score.cjs` line 35:
   - Before: `const { getEmbedding, getEmbeddings, EMBEDDING_DIMS } = require('./gemini-embed.cjs');`
   - After: `const { getEmbedding, getEmbeddings, EMBEDDING_DIMS, EMBEDDING_MODEL } = require('./gemini-embed.cjs');`

## Usage

After installing, read WORKFLOW_AUTO.md on every session startup. It documents:
- When to run smart-trigger
- When to compute surprise score
- How to properly tier your learnings
- Heartbeat procedures

## Files

- `WORKFLOW_AUTO.md` — The workflow document
- `fix-surprise-score.sh` — One-liner to fix the bug
