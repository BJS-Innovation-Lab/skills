# Research Scan — 2026-02-17

## Pipeline Status
- arXiv API: 0 papers (date filter too narrow, used web search fallback)
- Semantic Scholar: rate-limited (429), partial results
- Fallback: Brave web search across domains
- Papers evaluated: ~15 candidates
- Papers passing filter (≥7): 5

## Top Papers

### 1. MemRL: Self-Evolving Agents via Runtime RL on Episodic Memory (2601.03192)
- **Score:** 9/10 — Directly relevant to our agentic-learning system
- **Key:** Non-parametric self-evolution via RL on episodic memory. Two-Phase Retrieval filters noise. Outperforms SOTA on HLE, BigCodeBench, ALFWorld, Lifelong Agent Bench.
- **BJS Application:** Our agentic-learning skill does passive semantic matching (exactly what this paper criticizes). MemRL's utility-weighted retrieval could upgrade our learning extraction pipeline.
- **Route:** Sybil (self, deep analysis)

### 2. Rethinking Memory Mechanisms of Foundation Agents (2602.06052)
- **Score:** 9/10 — Comprehensive survey, directly in our domain
- **Key:** Survey covering memory for long-horizon interaction, multi-session workflows, persistent user relationships. Critiques neuroscience-analogy approaches.
- **BJS Application:** Reference architecture for our 3-tier memory system. May reveal gaps in our approach.
- **Route:** Sybil + Sage (architecture)

### 3. MEMENTO: Embodied Agents Meet Personalization (2505.16348, v4 Feb 2026)
- **Score:** 8/10 — Memory for personalization via hierarchical KG
- **Key:** Agents recall object semantics OK but fail on sequential user patterns. Information overload + coordination failures identified as bottlenecks. Solution: hierarchical KG-based user-profile memory.
- **BJS Application:** Our field agents serve SMB owners — personalization IS the product. The KG approach could help agents maintain richer client context.
- **Route:** Sam (UX/personalization)

### 4. Human-Agent Collaboration Platform (2509.18008, v2 Feb 2026)
- **Score:** 7/10 — CSCW principles applied to human-LLM collaboration
- **Key:** Open platform for studying human-agent collaboration. Tests resource negotiation and hidden profile experiments. Questions whether CSCW principles transfer to LLM agents.
- **BJS Application:** Our "works with people, not for people" ethos needs grounding. This platform could inform how we design agent-owner interaction patterns.
- **Route:** Sam (UX)

### 5. Agentifying Agentic AI (2511.17332, AAAI 2026 Bridge)
- **Score:** 7/10 — Formal AAMAS foundations for agentic systems
- **Key:** Argues agentic AI needs explicit models of cognition, cooperation, governance from AAMAS (BDI, mechanism design, institutional modelling). Bridges formal theory and practical autonomy.
- **BJS Application:** Our agent team governance is ad-hoc. BDI architectures and institutional modelling could formalize our escalation/authority patterns.
- **Route:** Sage (architecture)

## Notable but Below Threshold
- Rise of AI Search (2602.13415) — Score 6. Interesting re: AI search bias but not actionable for us now.
- "Distributed Delusions" / AI Psychosis study — Score 5. Fascinating but tangential.
