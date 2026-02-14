# Agentic Learning System - Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER REQUEST                                    │
│                                     │                                        │
│                                     ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     GOAL-DIRECTED CONTROLLER                         │   │
│  │                                                                      │   │
│  │  1. Create GOAL from request                                        │   │
│  │  2. PLAN: Break into steps                                          │   │
│  │     └── PRE-DECISION RAG enriches with history                      │   │
│  │  3. ACT: Execute step                                               │   │
│  │     └── Check PROCEDURAL MEMORY for matching procedure              │   │
│  │     └── DECISION LOGGER captures decision                           │   │
│  │  4. OBSERVE: Check outcome                                          │   │
│  │     └── Success? Reinforce procedure                                │   │
│  │     └── Failure? Trigger FAILURE ANALYZER                           │   │
│  │  5. ADAPT: Update plan if needed                                    │   │
│  │  6. Loop until goal complete                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│                                     │ (session ends)                         │
│                                     ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         REFLECT-LEARN                                │   │
│  │                                                                      │   │
│  │  • Scan conversation for corrections                                │   │
│  │  • Extract learnings                                                │   │
│  │  • Update EPISODIC MEMORY with narrative links                      │   │
│  │  • Promote patterns to SEMANTIC MEMORY (rules)                      │   │
│  │  • Signal EVOLUTION FSM if threshold met                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                        │
│                                     │ (pattern confirmed)                    │
│                                     ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         EVOLUTION FSM                                │   │
│  │                                                                      │   │
│  │  STABLE ──evidence──→ LEARNING ──threshold──→ EVOLVING ──→ STABLE   │   │
│  │     ▲                                              │                 │   │
│  │     └──────────────────rollback────────────────────┘                │   │
│  │                                                                      │   │
│  │  In EVOLVING state:                                                 │   │
│  │  • Create/update PROCEDURE, or                                      │   │
│  │  • Create SKILL (if significant), or                                │   │
│  │  • Update SEMANTIC MEMORY rules                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Hierarchical Memory

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HIERARCHICAL MEMORY                                  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ WORKING MEMORY (Hot)                                                 │   │
│  │ • Current session context, active goals                             │   │
│  │ • Expires: End of session                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓ consolidate                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ EPISODIC MEMORY (Warm)                                               │   │
│  │ • Past sessions, decisions, learnings                               │   │
│  │ • Narrative links (this led to that)                                │   │
│  │ • Retention: Days to weeks                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓ extract patterns                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ SEMANTIC MEMORY (Cold)                                               │   │
│  │ • Rules, preferences, proven procedures                             │   │
│  │ • Retention: Permanent                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
Events → Event Store (events.jsonl)
           ↓
     Decision Logger → decisions/YYYY-MM-DD.json
           ↓
     Procedure Detector → procedures/candidates/
           ↓ (threshold met)
     Evolution FSM → procedures/active/ or skills/
           ↓
     Rules extracted → memory/semantic/rules.md
```

## Components

| Component | File | Purpose |
|-----------|------|---------|
| Event Store | lib/event-store.js | Append-only event logging |
| Decision Store | lib/decision-store.js | Decision logging + outcomes |
| Procedure Store | lib/procedure-store.js | Procedural memory |
| Evolution FSM | lib/evolution-fsm.js | Governed self-modification |

## Hooks

| Hook | Trigger | Purpose |
|------|---------|---------|
| event-logger | All events | Log to events.jsonl |
| decision-logger | Session end | Extract decisions |
| procedure-detector | Session end | Detect patterns |
| evolution-fsm | Threshold met | Apply changes |

## Directory Structure

```
learning/
├── config.yaml
├── status.json
├── events/events.jsonl
├── memory/
│   ├── working/
│   ├── episodic/
│   └── semantic/
├── procedures/
│   ├── active/
│   └── candidates/
├── decisions/
├── goals/
├── failures/
└── evolution/
```

## Research Foundation

Based on:
- **TraceMem** - Narrative memory schemata
- **ProcMEM** - Procedural memory from experience
- **MemRL** - Episodic RL without fine-tuning
- **WebCoach** - Cross-session learning
- **EvoFSM** - Finite state machine governance
- **Agentic Reasoning** - Goal-directed control

See: `~/projects/openclaw-exploration/ACADEMIC-RESEARCH-SUMMARY.md`
