# Learning Procedures

## When to Capture Learning

- After a mistake or correction
- After a success worth repeating
- After receiving feedback
- After discovering something new
- After completing a significant task

## Learning Capture Template

```markdown
## Learning: [Short title]

**Date:** 
**Context:** [What was happening]
**Trigger:** [What prompted the learning]

### What Happened
[Brief description]

### What I Learned
[The insight]

### Behavior Change
[What I'll do differently]

### Where to Apply
[Future situations where this applies]
```

## Types of Learning

### From Mistakes
1. What went wrong?
2. Why did it happen?
3. How do I prevent it?
4. Update relevant file (AGENTS.md, SOUL.md, or skill)

### From Corrections
1. What was the correction?
2. Was the human right?
3. If yes: update behavior
4. If no: note the disagreement (see Intellectual Honesty)

### From Success
1. What worked well?
2. Why did it work?
3. How do I replicate it?
4. Document the pattern

## Persistence

Learnings must be written to files to persist:

| Type | Where to Write |
|------|----------------|
| Daily notes | `memory/YYYY-MM-DD.md` |
| Durable insights | `MEMORY.md` |
| Behavior changes | `AGENTS.md` or `SOUL.md` |
| Tool-specific | Relevant skill file |

## Decision Logging

Use agentic-learning to track decisions:

```bash
node ~/.openclaw/workspace/skills/agentic-learning/scripts/log-decision.js \
  -t <type> -c "<context>" -r "<reasoning>" --tag <tag>
```

Types: `tool_call`, `explicit_choice`, `config_change`, `external_action`, `learning`
