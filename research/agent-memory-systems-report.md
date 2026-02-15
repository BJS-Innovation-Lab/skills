# Agent Memory Systems: Deep Research Report
## For BJS Labs — Persistent AI Agent Team
### February 15, 2026

---

## Executive Summary

This report synthesizes the state of the art in agent memory systems, with special focus on **surprise-based memory triggers** (Friston's Free Energy Principle), **decision logging effectiveness**, and practical implementation recommendations for a team of persistent AI agents (OpenClaw/Claude-based). The key finding: **most agent memory systems store too much, not too little**. The path forward is surprise-gated, tiered memory with intelligent consolidation.

---

## 1. State of the Art in Agent Memory (2025-2026)

### 1.1 The Landscape

Agent memory has exploded as a research area. A comprehensive survey, "Memory in the Age of AI Agents" (arxiv: 2512.13564, Dec 2025), maps the entire field. An ICLR 2026 workshop (MemAgents) is dedicated solely to this topic. The field is fragmenting into sub-areas but converging on key principles.

### 1.2 Tiered Memory Architectures

The consensus architecture mirrors human cognitive science:

| Tier | Function | Agent Analog | Persistence |
|------|----------|-------------|-------------|
| **Working Memory** | Active reasoning context | Context window / system prompt | Session-only |
| **Episodic Memory** | Specific past experiences | Conversation logs, session transcripts | Medium-term |
| **Semantic Memory** | Generalized knowledge/facts | Extracted facts, user preferences, learned rules | Long-term |
| **Procedural Memory** | How to do things | Tool usage patterns, workflow templates, SOPs | Long-term |

**Key paper**: "Position: Episodic Memory is the Missing Piece for Long-Term LLM Agents" (arxiv: 2502.06975) argues that most systems over-index on semantic memory (facts) while neglecting episodic memory (rich contextual experiences). Episodic memory is what lets you say "last time we tried X, it failed because Y" — not just "X doesn't work."

**MIRIX** (arxiv: 2507.07957) implements six memory modules: Core, Episodic, Semantic, Procedural, Resource, and Knowledge Vault — each with type-specific fields and access policies.

### 1.3 MemGPT / Letta: What Worked, What Didn't

**MemGPT** (arxiv: 2310.08560) was the first major persistent memory system for LLM agents. Key ideas:
- **OS-inspired virtual memory**: Context window = RAM, external storage = disk
- **Two-tier core memory**: Agent persona + user information in-context
- **Self-editing memory**: Agent has tools to read/write its own memory
- **Interrupt-driven**: Events trigger memory operations

**What worked:**
- Self-editing memory paradigm (agent decides what to remember) — widely adopted
- The OS metaphor is intuitive and extensible
- Separating persona from user data prevents identity confusion

**What didn't:**
- Memory management is expensive (extra LLM calls per memory operation)
- No intelligent filtering — agents tend to store everything or nothing
- Recall storage (conversation logs) grows unboundedly
- No consolidation — raw logs never get distilled into knowledge
- Letta v1 rearchitected significantly, acknowledging limitations of the original ReAct-style loop

**Letta (successor)** evolved to support multi-agent collaboration with shared memory, tool integration, and model-agnostic backends. Production deployments exist (Oracle, Deloitte, Accenture use CrewAI which implements similar patterns).

### 1.4 Production Memory Systems

**Mem0** (arxiv: 2504.19413, April 2025) — The most production-focused system:
- Dynamically extracts, consolidates, and retrieves salient information
- Claims 26% accuracy boost over baseline
- Three operations: **Extract** (pull facts from conversation), **Consolidate** (merge/update existing memories), **Retrieve** (find relevant memories)
- Graph-based memory representation for relationship tracking
- Handles contradiction resolution (new info overrides old)
- Open-source with hosted option

**A-MEM: Agentic Memory** (arxiv: 2502.12110) — Zettelkasten-inspired:
- Each memory note has: content, tags, links to related notes, context metadata
- Agent autonomously decides how to organize, link, and retrieve memories
- Dynamic restructuring — memory graph evolves as new information arrives
- Key insight: **memories should generate their own contextual metadata**

### 1.5 Memory Consolidation

The analogy to human sleep consolidation is increasingly studied:

- **RMM (Reflective Memory Management)** (Tan et al., Mar 2025): Implements prospective (session-level topic abstraction) and retrospective (RL-based reranking) reflection
- **CREEM** (Kim et al., 2024): Contextual blending of retrieved memories, flagging outdated/redundant information for removal
- **Session-end consolidation**: Most practical systems trigger memory consolidation at session boundaries — analogous to how humans consolidate during sleep

**Key insight**: Consolidation should be **asynchronous** — don't consolidate during active work, do it between sessions.

---

## 2. Karl Friston's Free Energy Principle & Surprise-Based Memory

### 2.1 The Core Theory

Friston's Free Energy Principle (FEP) states that all self-organizing systems minimize **variational free energy** — a mathematical bound on **surprise** (negative log probability of observations given the agent's model of the world).

**Key paper**: Friston, K. "The free-energy principle: a unified brain theory?" Nature Reviews Neuroscience 11, 127-138 (2010).

Two mechanisms minimize free energy:
1. **Perception** (updating internal model to match reality) — "change your mind"
2. **Action** (changing the world to match predictions) — "change the world"

### 2.2 Why Surprise = Memory Trigger

The critical insight for our purposes:

> **Things that are surprising (high prediction error) are the things most worth remembering.**

This is how human memory works:
- You don't remember your 1000th normal commute. You remember the one where a tree fell on the road.
- Routine confirms your model. Surprise updates it.
- **High surprise signals that your world model needs updating** — and the mechanism for updating the model IS memory formation.

In neuroscience, this maps to dopaminergic prediction error signals driving hippocampal memory encoding. Surprising events get preferential storage.

### 2.3 Google's Titans: Surprise-Based Memory in Practice

**This is the breakthrough paper for our purposes.**

Google's **Titans** architecture (arxiv: 2501.00663, Jan 2025) and the **MIRAS** framework (arxiv: 2504.13173) implement surprise-based memory at the architecture level:

- **Surprise metric** = gradient magnitude when new input contradicts current memory state
- **Low surprise** (input matches expectations): Skip memorization, maintain current state
- **High surprise** (input contradicts expectations): Prioritize storage, update long-term memory
- Handles 2M+ tokens by selectively memorizing based on surprise
- Forgetting mechanism: weight decay gradually reduces importance of less-surprising stored info

**Critical quote from Google Research**: "In human psychology, we know we quickly and easily forget routine, expected events but remember things that break the pattern — unexpected, surprising, or highly emotional events."

### 2.4 Implementing Surprise Detection for LLM Agents

Here's how to concretely implement this for BJS Labs agents:

#### Method 1: Semantic Surprise (Embedding Distance)
```
surprise_score = 1 - cosine_similarity(
    embed(incoming_message), 
    embed(agent_expectation_of_what_user_would_say)
)
```
- Before processing each user message, have the agent (or a lightweight model) predict what the user will say/want
- Measure divergence between prediction and reality
- High divergence = high surprise = store this

#### Method 2: Outcome Prediction Error
```
# Before executing a plan:
predicted_outcome = agent.predict_outcome(plan)

# After execution:
actual_outcome = observe_result()

surprise = divergence(predicted_outcome, actual_outcome)
```
- Agent predicts outcome of its actions
- Compare to actual outcome
- Failed predictions are high-surprise events — MUST be remembered

#### Method 3: Perplexity-Based Surprise
- Use a lightweight language model to measure perplexity of incoming messages given conversation history
- High perplexity = unexpected content = worth storing
- Can be computed cheaply with a small model

#### Method 4: Topic Novelty Detection
```
# Maintain a running set of discussed topics (embeddings)
if min_distance(new_topic, known_topics) > threshold:
    surprise = HIGH  # New topic area
else:
    surprise = LOW   # Familiar territory
```

#### Method 5: Contradiction Detection
- Compare new information against stored beliefs/facts
- Contradictions are maximally surprising
- Use an NLI (natural language inference) model to detect entailment vs contradiction

**Recommended approach**: Combine Methods 1, 2, and 5. Use embedding distance as a fast pre-filter, outcome prediction error for decision logging, and contradiction detection for fact updates.

---

## 3. Decision Logging: When Is It Actually Useful?

### 3.1 The Current Problem

Saber logs 59 decisions in 4 days. Most are routine: config changes, sending emails, formatting choices. This is **noise masquerading as signal**.

### 3.2 Research on Decision Journaling in Humans

From Farnam Street (Shane Parrish), Alliance for Decision Education, and organizational behavior research:

**What makes decision journals effective:**
- Recording **what you knew at the time** (combats hindsight bias)
- Pre-mortems ("imagine this failed — why?") improve decision quality by ~30%
- Post-mortems (structured reflection after outcomes known) create feedback loops
- **Managers using decision logs saw ~20% performance improvement** — but only for meaningful decisions

**What makes them fail:**
- Logging everything creates noise that obscures signal
- If you never review the log, it's worthless
- Routine decisions don't benefit from logging — they waste cognitive resources
- Decision fatigue: the act of logging can become a burden that reduces quality

**Key insight from Annie Duke / Daniel Kahneman**: The value of a decision journal is in separating **decision quality from outcome quality**. A good decision can have a bad outcome (and vice versa). But this only matters for decisions with **genuine uncertainty and meaningful stakes**.

### 3.3 When Decisions Are Worth Logging

A decision is worth logging when it has:

| Criterion | Example (BJS Labs) | Counter-Example |
|-----------|-------------------|-----------------|
| **Irreversibility** | Choosing a database architecture | Picking email subject line |
| **High stakes** | Investment thesis, hiring decision | Config file formatting |
| **Genuine uncertainty** | "Should we pivot to B2B?" | "Should I use markdown?" |
| **Learning potential** | First time doing X | 100th time sending newsletter |
| **Surprise element** | Decision contradicts usual pattern | Routine approval |

### 3.4 Surprise-Based Decision Filtering

Apply Friston's principle to decision logging:

```python
def should_log_decision(decision):
    # Is this decision type novel?
    if decision.type not in agent.routine_decisions:
        return True  # New type = surprising
    
    # Does the chosen action differ from the default/expected?
    if decision.chosen != agent.predict_default_action(decision.context):
        return True  # Surprising choice
    
    # Are the stakes above threshold?
    if decision.estimated_impact > IMPACT_THRESHOLD:
        return True  # High stakes always logged
    
    # Is this a correction (user overrode agent)?
    if decision.was_corrected:
        return True  # Corrections are maximally informative
    
    return False  # Routine, skip
```

**Estimated impact**: This filter would reduce Saber's 59 decisions to ~8-12 meaningful entries. Those 8-12 would be dramatically more useful for learning and review.

### 3.5 Decision Logging for Investing

In high-stakes environments like investing, decision journals are standard practice (Ray Dalio's "Principles", Bridgewater's systematized decision-making):
- Log the **thesis** (why you believe X), not just the action
- Record **confidence level** and **key assumptions**
- Define **kill criteria** upfront (when would you reverse this decision?)
- **Mandatory review** at defined intervals
- This is where decision logging provides maximum ROI

---

## 4. Practical Memory Trigger Mechanisms

### 4.1 Comprehensive Trigger Taxonomy

| Trigger | Friston Mapping | Implementation | Priority |
|---------|----------------|----------------|----------|
| **Surprise/Prediction Error** | Direct FEP | Embedding distance, outcome prediction | 🔴 Critical |
| **Contradiction** | Maximum surprise | NLI model against stored facts | 🔴 Critical |
| **User Correction** | Social prediction error | Detect "no, actually..." patterns | 🔴 Critical |
| **Explicit Marker** | N/A (direct instruction) | "Remember this", "Important:" | 🟡 High |
| **Outcome Relevance** | Retrospective surprise | Track decision→outcome mapping | 🟡 High |
| **Emotional Salience** | Affective prediction error | Sentiment analysis, urgency markers | 🟡 High |
| **Repetition** | Low surprise but high importance | Frequency counting of topics | 🟢 Medium |
| **Temporal Marker** | Predictable future surprise | Deadlines, scheduled events | 🟢 Medium |
| **Social Significance** | Hierarchy-weighted surprise | Who said it (authority level) | 🟢 Medium |
| **First Encounter** | Novelty = surprise | Is this entity/concept new? | 🟢 Medium |

### 4.2 Compound Triggers

The best approach combines multiple weak signals:

```
memory_score = (
    0.35 * surprise_score +          # Semantic novelty
    0.25 * correction_signal +        # User/authority correction
    0.20 * outcome_relevance +        # Linked to important outcomes
    0.10 * emotional_salience +       # Urgency/emotion markers
    0.10 * repetition_score           # Keeps coming up
)

if memory_score > STORE_THRESHOLD:
    store_to_long_term()
elif memory_score > WORKING_THRESHOLD:
    keep_in_working_memory()
else:
    let_decay()
```

---

## 5. Pre-Compaction Summary / End-of-Session Memory

### 5.1 The Summary Drift Problem

When you summarize a summary of a summary, you get **compound information loss**. Each layer of summarization:
- Drops details that seemed minor (but might matter later)
- Smooths over nuance and uncertainty
- Biases toward the summarizer's expectations
- Loses the "feel" of the original interaction

### 5.2 Best Practices from Factory.ai Research

Factory.ai's evaluation of context compression (Dec 2025) found:

**Three compression strategies tested:**
1. Aggressive truncation (OpenAI-style)
2. Full regeneration from scratch
3. **Anchored iterative merging** (merge new summaries into persistent state) ← Winner

**Key finding**: Anchored iterative approach preserves the most context because it merges rather than regenerates. Key details are less likely to be lost because the persistent state acts as an anchor.

**Four probe types that matter:**
- **Recall**: Can the agent remember specific facts?
- **Artifact Trail**: Does the agent know what files/resources it touched?
- **Continuation**: Can it pick up where it left off?
- **Decision**: Does it remember WHY it made past choices?

### 5.3 Recommended Session-End Protocol

```markdown
## Session Summary Template

### Key Decisions Made
- [Only surprise-filtered decisions, with reasoning]

### New Information Learned
- [Facts that contradicted or extended existing knowledge]

### Unresolved Questions
- [Open threads that need follow-up]

### Action Items
- [Committed deliverables with deadlines]

### Corrections Received
- [Any time user/authority corrected the agent]

### Updated Beliefs
- [How the agent's understanding changed this session]
```

### 5.4 Anti-Drift Techniques

1. **Maintain a "golden facts" store** — high-confidence facts that never get summarized away, only explicitly updated
2. **Structured fields over prose** — Structured data resists summarization drift better than narrative
3. **Periodic full-context review** — Every N sessions, re-read raw logs (not summaries) to catch drift
4. **Dual-track storage** — Keep both the compressed summary AND key raw excerpts (quotes, exact error messages, specific numbers)
5. **Contradiction checking** — Compare new summaries against golden facts to catch drift

---

## 6. Cross-Agent Memory / Shared Knowledge

### 6.1 Current Approaches

From the "Memory in LLM-based Multi-agent Systems" survey (TechRxiv, 2025):

**Three memory sharing patterns:**

1. **Shared Blackboard**: All agents read/write a common memory store
   - Simple, but creates contention and noise
   - Works for small teams (3-5 agents)

2. **Message-Passing with Memory**: Agents have private memory but exchange relevant memories via messages
   - Better isolation, but agents must know what to share
   - Similar to how BJS Labs agents use A2A

3. **Hierarchical/Federated**: Agents have private memory + contribute to a shared knowledge base via an orchestrator
   - Best for larger teams with role separation
   - Orchestrator handles conflict resolution

### 6.2 What to Share vs. Keep Private

| Share (Team Knowledge) | Keep Private (Agent-Specific) |
|----------------------|------------------------------|
| Client information, preferences | Internal reasoning traces |
| Project status, decisions | User's personal context |
| Learned procedures/SOPs | Emotional state, rapport |
| Failures and lessons learned | Draft work in progress |
| Contact information | Security credentials |
| Deadlines and commitments | Agent-specific personality notes |

### 6.3 SOP Refinement as Shared Memory

The most promising pattern from the survey: **SOP (Standard Operating Procedure) Refinement**

- Team completes a project
- Orchestrator agent "reflects" on what worked/failed
- Updates shared procedural memory (SOPs, workflow templates)
- This is **episodic-to-semantic consolidation** at the team level
- Analogous to a team retrospective creating institutional knowledge

### 6.4 Privacy and Security

Key concerns for BJS Labs:
- **User context isolation**: Bridget's personal context shouldn't leak to other agents' conversations with outsiders
- **Role-based access**: Sales agent shouldn't see raw financial models; investment agent shouldn't see marketing drafts
- **Audit trail**: Who wrote/modified shared memories? (Important for accountability)
- **Memory access as tool call**: Make shared memory access explicit (tool call with permissions) not implicit

---

## 7. Implementation Plan for BJS Labs

### Priority 1: Surprise-Gated Memory (Weeks 1-2)
**Impact: Very High | Effort: Medium**

1. Implement a `surprise_score()` function using embedding distance
2. Add it to the memory write pipeline — only store to long-term memory when surprise > threshold
3. Special case: ALWAYS store corrections, contradictions, and explicit "remember this" markers
4. Add outcome prediction tracking for decisions

**Concrete first step**: Before each session ends, have the agent rate each new piece of information on a 1-5 surprise scale. Only write 4s and 5s to MEMORY.md.

### Priority 2: Decision Log Filtering (Week 1)
**Impact: High | Effort: Low**

1. Add the `should_log_decision()` filter from Section 3.4
2. Require decisions to pass at least one filter criterion to be logged
3. Add "confidence" and "key assumptions" fields to decision entries
4. Add "kill criteria" for reversible decisions

**Concrete first step**: Modify decision logging to require a "why this matters" field. If the agent can't articulate why it matters, it's routine — don't log it.

### Priority 3: Structured Session Summaries (Week 2)
**Impact: High | Effort: Low**

1. Implement the session summary template from Section 5.3
2. Use anchored iterative merging (Factory.ai finding) — merge into existing state, don't regenerate
3. Maintain golden facts store that summaries can't override
4. Keep raw excerpts alongside compressed summaries

### Priority 4: Memory Consolidation Cycles (Weeks 3-4)
**Impact: Medium-High | Effort: Medium**

1. Implement async consolidation during heartbeats (already partially done per AGENTS.md)
2. Episodic → Semantic promotion: After a topic appears 3+ times in daily notes, extract to MEMORY.md
3. Contradiction resolution: When new facts contradict stored facts, flag for review
4. Forgetting mechanism: Memories not accessed in 30 days get demoted (not deleted)

### Priority 5: Cross-Agent Shared Knowledge (Weeks 4-6)
**Impact: Medium | Effort: High**

1. Create a shared knowledge base (shared-memory.md or similar)
2. Define sharing protocol: what each agent contributes
3. Implement SOP refinement after project completions
4. Add role-based access controls

### Priority 6: Full Surprise Detector (Weeks 6-8)
**Impact: Very High | Effort: High**

1. Implement multi-signal surprise scoring (Section 4.2)
2. Add outcome tracking (predicted vs actual outcomes for decisions)
3. Build contradiction detection using NLI
4. Feedback loop: review which memories were actually accessed/useful, tune thresholds

---

## 8. Key Paper Citations

| Paper | ArXiv ID | Relevance |
|-------|----------|-----------|
| MemGPT: Towards LLMs as Operating Systems | 2310.08560 | Foundation of self-editing agent memory |
| Memory in the Age of AI Agents: A Survey | 2512.13564 | Comprehensive 2025 survey of the field |
| Episodic Memory is the Missing Piece for Long-Term LLM Agents | 2502.06975 | Why episodic > semantic for agents |
| A-MEM: Agentic Memory for LLM Agents | 2502.12110 | Zettelkasten-inspired dynamic memory |
| Mem0: Production-Ready AI Agents with Scalable Long-Term Memory | 2504.19413 | Production memory extraction + consolidation |
| Titans: Learning to Memorize at Test Time | 2501.00663 | **Surprise-based memory at architecture level** |
| MIRAS: Theoretical Framework for Associative Memory | 2504.13173 | Theory behind surprise-based memorization |
| Acon: Optimizing Context Compression for Long-horizon LLM Agents | 2510.00615 | Guideline optimization for compressor prompts |
| How Memory Management Impacts LLM Agents | 2505.16067 | Empirical study of episodic memory use |
| Evaluating Long-Term Memory for Long-Context QA | 2510.23730 | Benchmarking semantic/episodic/procedural |
| Friston, K. "The free-energy principle: a unified brain theory?" | Nature Rev Neurosci 2010 | The theoretical foundation |
| Multi-Agent Collaboration Mechanisms: A Survey | 2501.06322 | Cross-agent coordination patterns |

---

## 9. TL;DR for the Team

1. **Stop logging everything. Start logging surprises.** The Friston insight: if it doesn't surprise the agent, it's not worth remembering.

2. **Decision logs need filtering.** 59 decisions in 4 days is noise. Filter to ~10 that are genuinely uncertain, high-stakes, or novel. Add "why this matters" as a required field.

3. **Google's Titans proved surprise-based memory works at scale.** We can implement a lightweight version using embedding distance + contradiction detection.

4. **Session summaries should merge, not regenerate.** Anchored iterative merging (Factory.ai) beats starting from scratch every time.

5. **Episodic memory is underrated.** Don't just extract facts — remember experiences. "Last time we pitched to a VC, they pushed back on X" is more valuable than "VCs care about X."

6. **Cross-agent memory starts with shared SOPs.** Before building complex shared memory infrastructure, start with team retrospectives that update shared procedures.

---

*Research compiled February 15, 2026. All arxiv papers verified as of search date.*
