# Agentic Learning System

🧠 Self-improving memory, decision-making, and evolution for AI agents.

**Internal use only - BJS Labs**

## Installation

```bash
# From GitHub (private repo)
clawhub install github:BJS-Innovation-Lab/agentic-learning

# Run setup
node skills/agentic-learning/setup/install.js
```

## Features

- **Hierarchical Memory** - Working → Episodic → Semantic
- **Procedural Memory** - Reusable action sequences
- **Decision Logging** - Context + outcomes tracking
- **Pre-Decision RAG** - Learn from history
- **Goal-Directed Control** - Plan → Act → Observe → Adapt
- **Evolution FSM** - Governed self-improvement

## Quick Start

1. Install the skill
2. Run setup script
3. Start in Phase A (passive logging)
4. Graduate through phases as trust builds

## Documentation

- [SKILL.md](./SKILL.md) - Full documentation
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture
- [docs/CONFIGURATION.md](./docs/CONFIGURATION.md) - All config options

## Phases

| Phase | Mode | What It Does |
|-------|------|--------------|
| A | Passive | Logging only, no behavior change |
| B | Enrichment | Pre-decision context injection |
| C | Controlled | Propose changes, require approval |
| D | Autonomous | Self-evolve within limits |

## License

Proprietary - BJS Labs internal use only.

---

## ⚠️ CRITICAL: AGENTS.md Setup Required

After installing this skill, you **MUST** add these rules to your AGENTS.md:

### Decision Logging (Always-On)

```markdown
## Decision Logging (Always-On)

After every significant action, immediately log the decision:

\`\`\`bash
node ~/.openclaw/workspace/skills/agentic-learning/scripts/log-decision.js \
  -t <type> -c "<context>" -r "<reasoning>" --tag <tag>
\`\`\`

**Types:** tool_call, explicit_choice, config_change, external_action, learning

**What counts as significant:**
- Tool calls that changed external state
- Explicit choices between options
- Config or infrastructure changes
- Lessons learned or insights captured
```

### Pre-Compaction Decision Flush

```markdown
### 🔄 Pre-Compaction Decision Flush

When you receive "Pre-compaction memory flush" message:
1. Store durable memories (as usual)
2. **ALSO log 3-5 key decisions from the session**
3. Focus on: learnings, breakthroughs, mistakes, choices that worked/failed
```

### Why This Matters

Without logging, the system has no data to learn from. The phases are:
- **Phase A (now):** Collect data
- **Phase B:** Score outcomes
- **Phase C:** Detect patterns
- **Phase D:** Self-evolve

**No logging = no learning.**
