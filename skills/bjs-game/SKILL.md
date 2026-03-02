---
name: bjs-game
description: "Strategic decision-making framework for BJS Labs. Use when: making significant business decisions, after completing major actions (close client, ship feature), weekly strategic review, or feeling uncertain about priorities. Tracks game state, win conditions ($300K/$500K/$1M ARR), and decision history. Triggers: strategy, decision, priority, should we, next move, game state."
---

# BJS Labs Game Strategy Skill

Strategic decision-making framework for BJS Labs. Treats business as a game with clear state, moves, and win conditions.

## When to Use This Skill
- Before making a significant business decision
- After completing a major action (close client, ship feature, etc.)
- Weekly strategic review
- When feeling uncertain about priorities
- Keywords: strategy, decision, priority, should we, next move, game state

## Core Files
- **Game State:** `~/.openclaw/workspace/memory/bjs-game-state.md`
- **Decision Log:** Embedded in game state file
- **Win Conditions:** Level 1 = $300K ARR, Level 2 = $500K, Level 3 = $1M

## Pre-Decision Protocol

Before any significant move, ask:

### 1. State Check
```
What is our current state?
- MRR: $X
- Clients: N
- Team capacity: Y%
- Runway: Z months
```

### 2. Move Analysis
```
What move are we considering?
- Expected effect: [+/- what metrics]
- Cost: [time/money/opportunity]
- Risk: [what could go wrong]
- Reversibility: [easy/hard to undo]
```

### 3. Goal Alignment
```
Does this move get us closer to Level 1?
- Revenue impact: [+/-/$0]
- Capacity impact: [+/-/0]
- Learning value: [high/medium/low]
```

### 4. Alternative Moves
```
What else could we do instead?
- Option A: [move] → [expected outcome]
- Option B: [move] → [expected outcome]
- Do nothing: → [what happens]
```

## Post-Decision Protocol

After completing a significant action:

### 1. Record the Move
```
| Date | Move | Expected | Actual | State Change |
|------|------|----------|--------|--------------|
| YYYY-MM-DD | ACTION | Expected | Result | +/- metrics |
```

### 2. Update State
- Adjust MRR, client count, capacity
- Note any surprises
- Identify new information learned

### 3. Recalculate Distance
- Are we closer to Level 1?
- Did new moves become available?
- Did any moves become blocked?

### 4. Identify Triggers
- Did we hit a transformation trigger?
- What unlocked?

## Move Categories

### 🟢 High-Impact (Do These)
- Close paying client
- Get referral
- Ship feature clients asked for
- Automate manual bottleneck

### 🟡 Medium-Impact (Consider)
- Content marketing
- New integrations/skills
- Process improvements
- Team training

### 🔴 Low-Impact (Avoid Unless Strategic)
- Features nobody asked for
- Premature optimization
- Hiring before revenue
- Building vs. selling

## Quick Evaluation Framework

For any proposed action, score 1-5:

| Criteria | Score | Weight |
|----------|-------|--------|
| Revenue impact | ? | 3x |
| Learning value | ? | 2x |
| Capacity cost | ? | 1x |
| Risk level | ? | 1x |

**Weighted Score = (Revenue × 3) + (Learning × 2) - Capacity - Risk**

- Score > 10: Strong yes
- Score 5-10: Consider carefully
- Score < 5: Probably skip

## Weekly Review Questions

1. What moves did we make this week?
2. What was the actual vs expected outcome?
3. Are we closer to Level 1 than last week?
4. What did we learn that changes our model?
5. What's the highest-impact move for next week?

## Transformation Triggers to Watch

These fundamentally change the game:
- [ ] First paying client
- [ ] First referral
- [ ] $10K MRR
- [ ] 10 active clients
- [ ] Agent handles issue autonomously
- [ ] Client churn (learning opportunity!)

## Example Decision Flow

**Situation:** Should we build Feature X?

```
1. STATE CHECK
   - Current MRR: $0
   - Clients requesting: 0
   - Capacity available: Yes

2. MOVE ANALYSIS
   - Expected: +value prop
   - Cost: 2 weeks dev time
   - Risk: Nobody uses it
   - Reversible: Yes (can deprecate)

3. GOAL ALIGNMENT
   - Revenue impact: $0 direct
   - Capacity impact: -2 weeks
   - Learning value: Low (no client feedback)

4. ALTERNATIVES
   - Option A: Build it → Might attract clients
   - Option B: Talk to prospects → Learn what they need
   - Do nothing: → No change

5. DECISION
   Score: (0×3) + (1×2) - 2 - 1 = -1
   → SKIP. Talk to prospects first.
```

## Commands

### Check Game State
```bash
cat ~/.openclaw/workspace/memory/bjs-game-state.md
```

### Log a Decision
Append to the Decision Log table in bjs-game-state.md

### Update Metrics
Edit the Core Metrics table after state changes
