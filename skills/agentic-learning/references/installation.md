# Agentic Learning — Installation Guide

Complete setup for installing the agentic-learning skill on any OpenClaw agent.

## Prerequisites

- OpenClaw agent with workspace at `~/.openclaw/workspace/`
- Three-tier memory structure (or willingness to create it)
- Optional: OpenAI API key for embedding-based similarity (surprise filter + auto-linking)

## Step 1: Install the Skill

**Via ClawHub (when published):**
```bash
clawhub install agentic-learning
```

**Manual:**
```bash
# Copy skill to workspace
cp -r skills/agentic-learning ~/.openclaw/workspace/skills/

# Or clone from repo
git clone <repo-url> ~/.openclaw/workspace/skills/agentic-learning
```

## Step 2: Create Directory Structure

```bash
mkdir -p ~/.openclaw/workspace/memory/learning/{corrections,insights,outcomes}
```

This creates:
```
memory/learning/
├── corrections/    # Entries when you're proven wrong
├── insights/       # Novel connections and techniques (stakes-gated)
└── outcomes/       # Results from past decisions
```

## Step 3: Update AGENTS.md

Add to your "Every Session" boot sequence:

```markdown
6. **Check memory/learning/ for pending outcome prompts**
   - Entries older than 3 days without linked outcomes need follow-up
   - Surface 2-3 and evaluate: do I know how they turned out?
```

Add the detection triggers section:

```markdown
## Agentic Learning Triggers

When you notice these signals, evaluate whether to log:

**Correction signals:** "No, that's wrong", "Actually...", "I already told you..."
**Insight signals:** New connections, techniques discovered, "aha" moments
**Outcome signals:** Past decisions producing measurable results
**Error signals:** Non-obvious failures that reveal knowledge gaps

Before logging an insight: "What was at risk?" If you can't answer → daily log only.
```

## Step 4: Update HEARTBEAT.md

Add this block to your heartbeat routine:

```markdown
## Outcome Check (Agentic Learning)
Check memory/learning/corrections/ and memory/learning/insights/ for entries
older than 3 days without linked outcomes.
Surface 2-3 entries. For each: do I know how it turned out?
- If yes → log outcome to memory/learning/outcomes/
- If too early → skip
- If no longer relevant → mark inconclusive
For CORRECTIONS specifically: "Did it stick?" — has my behavior actually changed?
```

## Step 5: Install Hook (Optional)

The hook injects a brief reminder at session start (~60 tokens overhead).

```bash
# Copy hook
cp -r ~/.openclaw/workspace/skills/agentic-learning/hooks/openclaw \
      ~/.openclaw/hooks/agentic-learning

# Enable
openclaw hooks enable agentic-learning
```

## Step 6: Set Up Weekly Synthesis Cron (Optional)

Schedule a weekly synthesis that audits the learning system:

```
Schedule: Sundays 10:00 AM (agent's timezone)
Session: isolated
Payload: agentTurn
Prompt: "Run weekly learning synthesis. Read all entries in memory/learning/ 
         from this week. Output: system health metrics, trend detection, 
         calibration check (stakes ratings vs outcomes), root cause analysis 
         across corrections. Max 200 words. Broadcast key learnings to team."
```

## Step 7: Migration from self-improving-agent (If Applicable)

If you have existing `.learnings/` files:

1. **Review each entry** against the new criteria
2. **Corrections** (user corrected you, knowledge was wrong) → reformat to YAML, move to `memory/learning/corrections/`
3. **Genuine insights** (novel technique, connection) → reformat, move to `memory/learning/insights/`
4. **Routine errors** (command failed, fixed it) → keep in daily notes or discard
5. **Feature requests** → move to `memory/working/` (active work, not learning)
6. **Activity logs** → daily notes or discard

```bash
# After migration
mv .learnings .learnings-archived
```

**Most v1 entries won't qualify for the new system. That's the point.**

## Step 8: Verify Installation

```bash
# Check directories exist
ls ~/.openclaw/workspace/memory/learning/

# Check skill is loaded
# (OpenClaw should auto-detect SKILL.md in the skills directory)

# Check hook is registered (if installed)
openclaw hooks list

# Create a test entry
cat > ~/.openclaw/workspace/memory/learning/corrections/$(date +%Y-%m-%d).md << 'EOF'
# Corrections — $(date +%Y-%m-%d)

---
type: correction
id: COR-TEST-001
timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)
source: self
prior_belief: "Test entry — old belief"
corrected_to: "Test entry — new understanding"
stakes: low
context: "Installation verification"
behavioral_change: "None — this is a test"
linked: []
outcome: null
outcome_date: null
status: active
---
EOF

echo "Test entry created. Remove after verifying the system reads it."
```

## Embedding Setup (For Surprise Filter + Auto-Linking)

The surprise filter and auto-linking use embeddings to measure similarity between entries. This requires an OpenAI API key.

```bash
# Add to your environment
echo "OPENAI_API_KEY=sk-..." >> ~/.openclaw/workspace/rag/.env
```

**Without embeddings:** The system still works — you just skip the automatic dedup/linking and do it manually during consolidation. Stakes gate and outcome loop work without embeddings.

## Uninstalling self-improving-agent

After confirming the new system works:

```bash
# Archive old skill (don't delete — keep for reference)
mv ~/.openclaw/workspace/skills/self-improving-agent \
   ~/.openclaw/workspace/skills/self-improving-agent-archived

# Remove old hook if installed
openclaw hooks disable self-improvement

# Archive old .learnings directory
mv ~/.openclaw/workspace/.learnings ~/.openclaw/workspace/.learnings-archived
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Entries not being created | Check directory permissions. Verify agent is reading SKILL.md. |
| Too many entries (noise) | Stakes gate too loose. Review: can you articulate risk for each entry? |
| No outcomes logged | Heartbeat not checking. Verify HEARTBEAT.md has the outcome block. |
| Entries never promoted | Check if entries are getting 3+ references. May need longer observation period. |
| Hook not firing | Run `openclaw hooks list`. Re-enable if missing. |
