# Deploy: Agentic Learning Stakes-Gating

**What:** Noise filter for the learning system. Only logs entries where the agent can answer "what was at risk if I got this wrong?" Reduces learning noise by ~87% (tested on Saber's 65 decisions → only 8 were real learnings).

**Where:** Shared skills repo `https://github.com/BJS-Innovation-Lab/skills.git` branch `main`

**Who needs it:** Saber (primary — she's the one with the noisy learning log), Sam (once he has the learning system), any future field agents.

---

## Step 1: Pull Latest Skills

```bash
cd ~/.openclaw/workspace/skills && git pull origin main
```

If the agent doesn't have the skills repo cloned yet:
```bash
cd ~/.openclaw/workspace
git clone https://github.com/BJS-Innovation-Lab/skills.git
```

**Verify:** Check that `skills/agentic-learning/SKILL.md` exists and contains "Stakes Gate" section (~line 130).

---

## Step 2: Create Learning Directories

```bash
mkdir -p ~/.openclaw/workspace/memory/learning/{corrections,insights,outcomes}
```

---

## Step 3: Add to SOUL.md

Add this block to the agent's SOUL.md (or AGENTS.md if they don't have SOUL.md):

```markdown
## Learning System

Before logging ANY learning entry (correction or insight), you MUST pass the Stakes Gate:

**Ask yourself: "What was at risk if I got this wrong?"**
- Clear answer → Log it with stakes level (high/medium/low)
- No clear answer / "nothing really" → Daily notes only, NOT the learning system

Stakes levels:
- **High:** Affects core behavior, multiple future decisions, or correction from authority
- **Medium:** Affects one project/workflow, alternatives seriously considered  
- **Low:** Minor but genuinely uncertain (NOT a dumping ground)

Activity is NOT learning. "I worked on X" is a daily log entry, not an insight.
Only log entries that would change how you approach something in 6 months.

Full system: `skills/agentic-learning/SKILL.md`
```

---

## Step 4: Add to HEARTBEAT.md

```markdown
## Learning Extraction (every 4-6 hours)
WORKSPACE=~/.openclaw/workspace node ~/.openclaw/workspace/skills/agentic-learning/scripts/extract-insights.cjs --days 1

## Outcome Check (every 4-6 hours)
Run: node ~/.openclaw/workspace/skills/agentic-learning/scripts/outcome-checker.cjs
If entries found, evaluate evidence and log outcomes.
```

---

## Step 5: Clean Up Existing Noise (Saber only)

Saber has 9 procedure candidates, 8 of which are activity logs not learnings. Two options:

**Option A — Archive (recommended):**
```bash
mkdir -p ~/.openclaw/workspace/memory/work-history
# Move the 8 noise candidates (smb-crm, feature, skill-registry, documentation, 
# marketing, architecture, content, ai-investing) to work-history/
# Keep only "creativity" in the learning pipeline
```

**Option B — Delete:**
Remove the 8 noise candidates entirely. The daily logs still have the activity record.

---

## Step 6: Verify

After deployment, ask the agent:
> "Log a learning: I configured a cron job today"

**Expected behavior:** Agent should recognize this as activity, NOT a learning, and decline to log it (or log it to daily notes only).

Then ask:
> "Log a learning: I discovered that clients who get onboarded with a 15-min call retain 3x better than self-serve"

**Expected behavior:** Agent should log this as a medium/high stakes insight with clear behavioral change.

---

## What's Included

| File | Purpose |
|------|---------|
| `skills/agentic-learning/SKILL.md` | Full system spec — stakes gate, surprise filter, outcome loops, auto-promotion |
| `scripts/extract-insights.cjs` | Automated extraction from session transcripts |
| `scripts/session-capture.cjs` | Real-time capture during conversations |
| `scripts/outcome-checker.cjs` | Prompts for outcome follow-up on old entries |
| `scripts/auto-promote.cjs` | Promotes entries with 3+ validations to core/ |
| `scripts/activator.sh` | Quick-reference for capture triggers |

## Key Commits
- `a74d887` — utility scoring with anti-bias mechanisms  
- `768fa2e` — auto-promotion engine
- `c1c1b2b` — three automated capture tools
- `a19aa18` — agentic-learning v2 (merged system)

---

## Notes

- Stakes-gating is primarily **behavioral** — the agent follows the rules in SKILL.md and SOUL.md. The scripts enforce it during automated extraction but the agent's own judgment is the first filter.
- The anti-bias mechanisms (decay, novelty bonus, epsilon-greedy) are in `skills/memory-retriever/scripts/search-supabase.cjs` — separate deploy if the agent uses Supabase retrieval.
- Saber should see immediate improvement: new entries will be stakes-gated, old noise can be archived.
