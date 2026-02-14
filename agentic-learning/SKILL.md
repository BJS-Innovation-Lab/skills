# Agentic Learning System

Self-improving memory, decision-making, and evolution for AI agents.

**Version:** 0.1.0  
**Author:** BJS Labs  
**License:** Proprietary (internal use only)

---

## Overview

This skill provides a complete learning infrastructure that enables agents to:

- **Remember** decisions and their outcomes
- **Learn** from mistakes without fine-tuning
- **Improve** through procedural memory and pattern detection
- **Evolve** capabilities through governed self-modification

Based on research from TraceMem, ProcMEM, MemRL, WebCoach, EvoFSM, and others.

---

## Quick Start

### Installation

```bash
# From BJS GitHub (private):
clawhub install github:BJS-Innovation-Lab/agentic-learning

# Or if already cloned locally:
clawhub install ./path/to/agentic-learning
```

### First Run

After installation, run the setup:

```bash
# In your workspace, run:
node skills/agentic-learning/setup/install.js
```

This creates the learning directory structure and default configuration.

### Check Status

```
"Check my learning system status"
→ Agent reads learning/status.json and reports
```

---

## Features

### 1. Hierarchical Memory

```
WORKING (hot)     → Current session context, active goals
    ↓ consolidate at session end
EPISODIC (warm)   → Past sessions, decisions, learnings (days-weeks)
    ↓ extract patterns over time
SEMANTIC (cold)   → Rules, preferences, proven procedures (permanent)
```

### 2. Procedural Memory

Store successful action sequences for automatic reuse:

```json
{
  "procedure": "send_data_email",
  "trigger": "email with data/numbers",
  "steps": ["bullet format", "add visual if complex", "review before send"],
  "success_rate": 0.94
}
```

### 3. Decision Logging

Every significant decision is captured:

```json
{
  "decision_id": "dec_20260211_001",
  "context": "User asked to send Q1 email to sales",
  "options_considered": ["paragraph format", "bullet format"],
  "chosen": "bullet format",
  "reasoning": "Past feedback preferred bullets",
  "outcome": "success"
}
```

### 4. Pre-Decision RAG

Before making decisions, the system automatically retrieves:
- Similar past decisions
- Related failures/mistakes
- Applicable rules and procedures

This context is injected to improve decision quality.

### 5. Goal-Directed Control

Explicit goal tracking with Plan → Act → Observe → Adapt loops:

```json
{
  "goal": "Send Q1 results to sales team",
  "plan": ["draft email", "add chart", "review", "send"],
  "current_step": 2,
  "adaptations": [{"step": 2, "reason": "user requested chart"}]
}
```

### 6. Evolution FSM

Governed self-modification with state machine:

```
STABLE ──evidence──→ LEARNING ──threshold──→ EVOLVING ──success──→ STABLE
   ↑                                              │
   └──────────────────rollback────────────────────┘
```

All evolution requires evidence, and bad changes auto-rollback.

### 7. Skill Creation

When patterns are significant enough, the system can create new skills:
- Procedure → Skill promotion
- Pattern → Skill codification
- Learning → Skill documentation

---

## Configuration

Edit `workspace/learning.yaml`:

```yaml
learning:
  enabled: true
  
  # Phase A - Passive (start here)
  event_logger:
    enabled: true
    log_all: false          # only significant events
    
  decision_logger:
    enabled: true
    capture_reasoning: true
    track_outcomes: true
    
  procedure_detector:
    enabled: true
    min_occurrences: 3      # before creating procedure
    
  # Phase B - Enrichment
  pre_decision_rag:
    enabled: false          # enable after Phase A stable
    max_context_items: 5
    search_decisions: true
    search_failures: true
    search_procedures: true
    
  hierarchical_memory:
    enabled: false
    consolidate_on_session_end: true
    
  # Phase C - Controlled Evolution
  goal_controller:
    enabled: false
    track_adaptations: true
    
  evolution_fsm:
    enabled: false
    require_approval: true  # human must approve changes
    evidence_threshold: 3   # occurrences before evolution
    auto_rollback: true     # revert on negative outcome
    
  # Phase D - Autonomous (careful!)
  auto_evolve:
    enabled: false
    max_daily_evolutions: 3
    excluded_files:         # never auto-modify these
      - SOUL.md
      - AGENTS.md
      - USER.md
```

---

## Directory Structure

After installation:

```
workspace/
└── learning/
    ├── config.yaml              # Your configuration
    ├── status.json              # Current system status
    │
    ├── events/
    │   └── events.jsonl         # Append-only event log
    │
    ├── memory/
    │   ├── working/             # Current session (ephemeral)
    │   ├── episodic/            # Past sessions + decisions
    │   │   ├── episodes/
    │   │   └── narratives.json
    │   └── semantic/            # Permanent knowledge
    │       ├── rules.md
    │       └── preferences.json
    │
    ├── procedures/
    │   ├── active/              # Confirmed procedures
    │   ├── candidates/          # Emerging (not yet confirmed)
    │   └── metrics.json
    │
    ├── decisions/
    │   ├── YYYY-MM-DD.json      # Daily logs
    │   └── outcomes.json
    │
    ├── goals/
    │   ├── active/
    │   └── completed/
    │
    ├── failures/
    │   ├── log.jsonl
    │   └── patterns.json
    │
    └── evolution/
        ├── state.json           # FSM current state
        ├── pending.json         # Pending evolutions
        └── history.jsonl        # State transitions
```

---

## Phases

### Phase A: Passive Mode (Start Here)

Enable only logging — no behavior changes:

```yaml
event_logger: { enabled: true }
decision_logger: { enabled: true }
procedure_detector: { enabled: true }
# Everything else: false
```

**What happens:** Agent runs normally, system collects data.

**Duration:** 1-2 weeks, until you see good data in logs.

### Phase B: Read-Only Enrichment

Enable context injection:

```yaml
pre_decision_rag: { enabled: true }
hierarchical_memory: { enabled: true }
```

**What happens:** Agent gets smarter context before decisions.

**Duration:** 1 week, verify decisions improve.

### Phase C: Controlled Evolution

Enable governed self-modification:

```yaml
goal_controller: { enabled: true }
evolution_fsm: { enabled: true, require_approval: true }
```

**What happens:** System proposes changes, you approve.

**Duration:** Until you trust the proposals.

### Phase D: Autonomous

Enable auto-evolution (with limits):

```yaml
auto_evolve: { enabled: true, max_daily_evolutions: 3 }
evolution_fsm: { require_approval: false }
```

**What happens:** System evolves on its own within limits.

**Caution:** Only enable after high confidence in system behavior.

---

## Commands

Ask your agent:

| Request | What It Does |
|---------|--------------|
| "Check learning status" | Show system status, phase, metrics |
| "List recent decisions" | Show decision log |
| "Show my procedures" | List active procedures |
| "What have I learned?" | Summarize learnings + rules |
| "Show evolution history" | FSM state transitions |
| "Propose evolution for X" | Manually trigger evolution proposal |
| "Approve pending evolution" | Approve pending change |
| "Rollback last evolution" | Revert last change |

---

## Hooks

This skill installs the following hooks:

| Hook | Trigger | Purpose |
|------|---------|---------|
| `event-logger` | All events | Append to events.jsonl |
| `decision-logger` | Significant decisions | Log decisions + outcomes |
| `procedure-detector` | Session end | Detect action patterns |
| `goal-controller` | Complex requests | Track goals + adaptations |
| `evolution-fsm` | Pattern threshold | Govern self-modification |

---

## Dependencies

This skill works with (installed separately via ClawHub):

- `failure-analyzer` - Root cause analysis (optional, enhances failure detection)
- `reflect-learn` - Conversation learning (optional, enhances pattern extraction)
- `decision-frameworks` - Structured decisions (optional, enhances decision quality)

Install them with:
```bash
clawhub install failure-analyzer reflect-learn decision-frameworks
```

**Note:** The core learning system works without these dependencies. They enhance specific features when available.

## Future Enhancements

Currently file-based storage. Planned enhancements:
- **Vector search** via Supabase pgvector for semantic memory search
- **Cross-agent learning** via A2A protocol
- **Multimodal memory** via LanceDB (images, audio)

---

## Troubleshooting

### "Learning directory not found"

Run the setup script:
```bash
node skills/agentic-learning/setup/install.js
```

### "FSM stuck in EVOLVING"

Force reset to STABLE:
```bash
echo '{"state": "STABLE"}' > workspace/learning/evolution/state.json
```

### "Too many events logged"

Adjust thresholds in config:
```yaml
event_logger:
  log_all: false
  min_significance: 0.5
```

### "Procedures not being detected"

Lower threshold or wait for more data:
```yaml
procedure_detector:
  min_occurrences: 2  # was 3
```

---

## Contributing

Internal BJS Labs use only. For changes:

1. Create branch in `BJS-Innovation-Lab/agentic-learning`
2. Make changes
3. Test on your agent
4. PR for review
5. After merge, other agents run `clawhub update agentic-learning`

---

## Changelog

### 0.1.0 (2026-02-11)
- Initial release
- Hierarchical memory structure
- Procedural memory
- Decision logging + Pre-Decision RAG
- Goal-directed control
- Evolution FSM
- Skill creation capability

---

*Built by BJS Labs for internal AI agent improvement.*
