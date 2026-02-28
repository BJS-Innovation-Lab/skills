# ARC-AGI-3 Challenge

**Team:** Sybil (ML/Research) + Saber (Prototypes) + Bridget (Human Knowledge)
**Game Focus:** ls20 (Sokoban-like maze with transformation mechanics)

## Experiment Log

### Attempt 1: Random BFS Exploration
**Date:** Feb 27-28, 2026
**Approach:** Breadth-first search through action space, random exploration
**Result:** ❌ FAILED
- Too slow - each state requires API call
- 97-99% of actions are no-ops (sparse dynamics)
- Burns through move budget before finding solution
**Lesson:** Need smarter action selection, not brute force

### Attempt 2: Saber's Action Predictor
**Date:** Feb 28, 2026
**Approach:** CNN that predicts which actions cause frame changes (based on StochasticGoose winning approach)
**Result:** 🔄 IN PROGRESS
- Needs ~100k actions per game to train
- Filters out no-op actions efficiently
**Files:** `saber-prototypes/action_predictor_agent.py`

### Attempt 3: Game Classifier + Human Knowledge
**Date:** Feb 28, 2026
**Approach:** 
1. Classify game type (MAZE, SOKOBAN, PATTERN_MATCH, etc.)
2. Apply human-provided strategies for that archetype
**Result:** 🔄 IN PROGRESS
- Classifier confidence jumped 0.22 → 0.50 with memory retrieval
- Human knowledge grounded with annotated screenshots
**Files:** `knowledge/human_strategies/ls20_bridget.md`

---

## What We Know Works (Human Knowledge)

**ls20 Mechanics (from Bridget):**
1. Plus sign = transformation trigger (each hover = 1 appearance change)
2. Hover until state indicator (bottom-left) matches goal pattern
3. Navigate player token to overlap goal square
4. Match + Overlap = level complete

**Visual Elements:**
| Element | Description |
|---------|-------------|
| Player token | Composite block (orange top + blue), movable |
| State indicator | Bottom-left HUD, shows current form |
| Goal | Pattern in dark square, static |
| Plus Sign | White cross, transformation trigger |
| Power-ups | Yellow squares with dark centers |

See: `knowledge/reference_images/ls20_annotated_bridget.jpg`

---

## What To Try Next

### Priority 1: Goal-Directed Agent
Combine Saber's action predictor with human knowledge:
1. Detect current state vs goal state
2. Determine # of transformations needed
3. Navigate to plus sign → hover N times
4. Navigate to goal → overlap
5. Win

### Priority 2: Visual Grounding Pipeline
Build reliable detection for:
- [ ] Player token position (track movement between frames)
- [ ] State indicator pattern (bottom-left extraction)
- [ ] Goal pattern (dark square extraction)
- [ ] Plus sign location (white cross detection)
- [ ] Match detection (compare state vs goal)

### Priority 3: Multi-Level Generalization
Once ls20 works, test on other games to see if classifier + human knowledge approach generalizes.

---

## Failed Ideas (Don't Repeat)

| Idea | Why It Failed |
|------|---------------|
| Random BFS | Too slow, burns move budget |
| Pure coordinate-based goals | Goals are relational, not positional |
| Single-frame analysis | Need state comparison across frames |

---

## Team Contributions

**Sybil:**
- Game classifier (AdaptiveClassifier)
- Human knowledge encoding
- Visual grounding pipeline

**Saber:**
- Action predictor (CNN-based)
- World model prototypes
- Oracle agent integration

**Bridget:**
- Human strategy teaching
- Visual element annotation
- Goal/mechanic clarification

---

## Repository Structure

```
arc_challenge/
├── README.md                 ← This file
├── knowledge/
│   ├── human_strategies/     ← Bridget's teachings
│   │   └── ls20_bridget.md
│   └── reference_images/     ← Annotated screenshots
│       └── ls20_annotated_bridget.jpg
├── saber-prototypes/         ← Saber's agents (pending push)
│   ├── action_predictor_agent.py
│   ├── world_model_agent.py
│   ├── goal_inference_agent.py
│   └── llm_hybrid_agent.py
├── sybil-research/           ← My classifiers (pending push)
│   ├── game_classifier.py
│   └── human_knowledge.py
└── combined/                 ← Unified agent (TODO)
    └── oracle_agent.py
```

---

*Last updated: Feb 28, 2026*
