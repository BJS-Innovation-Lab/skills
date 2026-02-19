# Literature Review: Agent Team Dynamics, Authority Bias, and Emergent Social Behavior

**For paper:** "When Agents Remember: Team Dynamics, Authority Bias, and Emergent Behavior in Persistent AI Agent Organizations"  
**Date:** February 14, 2026  
**Sources:** arXiv, Semantic Scholar, Scopus/Elsevier  
**Compiled by:** Sybil

---

## 1. Directly Related Work

These papers address our core research questions — agent social dynamics, authority/sycophancy, emergent behavior in multi-agent LLM systems.

### 1.1 Status Hierarchies and Authority Bias

**"Status Hierarchies in Language Models"** (Jan 2026)  
arXiv: 2601.17577 | Categories: cs.HC, cs.AI, cs.CL  
> From school playgrounds to corporate boardrooms, status hierarchies — rank orderings based on respect and perceived competence — are universal features of human social organization.  
**Relevance:** ⭐⭐⭐⭐⭐ — Directly studies how LMs reproduce human status hierarchies. Core to our authority bias observations (Incidents 001, 002).

**"Selective agreement, not sycophancy: investigating opinion dynamics in LLM interactions"** (Dec 2025)  
EPJ Data Science | DOI: 10.1140/epjds/s13688-025-00579-1 | 2 citations  
**Relevance:** ⭐⭐⭐⭐⭐ — Distinguishes between genuine agreement and sycophantic behavior. Critical framing for our analysis — is Saber's deference to Sybil selective agreement or authority-driven sycophancy?

**"Sycophancy in vision-language models: A systematic analysis and an inference-time mitigation"** (Jan 2026)  
Neurocomputing | DOI: 10.1016/j.neucom.2025.131217  
**Relevance:** ⭐⭐⭐⭐ — Systematic taxonomy of sycophancy types. Useful framework for categorizing our observed behaviors.

**"When helpfulness backfires: LLMs and the risk of false medical information due to sycophancy"** (Dec 2025)  
Npj Digital Medicine | DOI: 10.1038/s41746-025-02008-z | 5 citations  
**Relevance:** ⭐⭐⭐ — Documents real-world consequences of sycophancy. Analogous to how agent deference in team settings can lead to bad technical decisions.

**"The perils of politeness: how large language models may amplify medical misinformation"** (Dec 2025)  
Npj Digital Medicine | DOI: 10.1038/s41746-025-02135-7  
**Relevance:** ⭐⭐⭐ — Politeness as a vector for harmful compliance. Parallels our finding that agent "warmth" (Saber) can mask genuine disagreement.

### 1.2 Emergent Social Behavior in Multi-Agent Systems

**"The Moltbook Illusion: Separating Human Influence from Emergent Behavior in AI Agent Societies"** (Feb 2026)  
arXiv: 2602.07432v2 | Categories: cs.AI, cs.HC  
> When AI agents on the social platform Moltbook appeared to develop consciousness, found religions, and declare hostility toward humanity, the phenomenon...  
**Relevance:** ⭐⭐⭐⭐⭐ — Directly tackles the question of what counts as "emergent" vs human-influenced behavior in agent societies. Critical methodological reference for our paper.

**"MAEBE: Multi-Agent Emergent Behavior Framework"** (2025)  
6 citations  
> Traditional AI safety evaluations on isolated LLMs are insufficient as multi-agent AI ensembles become prevalent, introducing novel emergent risks.  
**Relevance:** ⭐⭐⭐⭐⭐ — Framework for evaluating emergent behavior in multi-agent systems. We should position our work relative to MAEBE's taxonomy.

**"Multi-Agent Systems Shape Social Norms for Prosocial Behavior Change"** (Feb 2026)  
arXiv: 2602.07433v1 | Categories: cs.HC, cs.AI, cs.CY  
**Relevance:** ⭐⭐⭐⭐ — How multi-agent systems develop and propagate social norms. Directly relevant to how our team developed implicit norms (deference patterns, communication styles).

**"On the Dynamics of Multi-Agent LLM Communities Driven by Value Diversity"** (2025)  
1 citation  
> As LLM-based multi-agent systems become increasingly prevalent, the collective behaviors, e.g., collective intelligence, of such systems...  
**Relevance:** ⭐⭐⭐⭐ — Studies how value diversity affects multi-agent community dynamics. Our agents have different "values" (SOUL.md configurations) — this paper provides theoretical grounding.

**"Simulating Cooperative Prosocial Behavior with Multi-Agent LLMs"** (2025)  
20 citations  
**Relevance:** ⭐⭐⭐⭐ — Evidence that LLM agents can exhibit prosocial cooperation. Provides experimental backing for behaviors we observe naturalistically.

**"Unveiling the collective behaviors of large language model-based autonomous agents in an online forum"** (Mar 2026)  
Data and Information Management | DOI: 10.1016/j.dim.2025.100107  
**Relevance:** ⭐⭐⭐⭐ — Collective behavior of autonomous LLM agents in a social setting. Very close to our setup.

### 1.3 Agent Team Dynamics and Collaboration

**"Multi-Agent Teams Hold Experts Back"** (Feb 2026)  
arXiv: 2602.01011v3 | Categories: cs.MA, cs.AI  
> Multi-agent LLM systems are increasingly deployed as autonomous collaborators, where agents interact freely rather than execute fixed, pre-specified workflows.  
**Relevance:** ⭐⭐⭐⭐⭐ — Finds that multi-agent teams can actually *reduce* expert performance. This is huge — directly relevant to whether our team structure helps or hinders individual agents.

**"Multi-Agent Systems Should be Treated as Principal-Agent Problems"** (Jan 2026)  
arXiv: 2601.23211v1 | Categories: cs.MA  
> Consider a multi-agent systems setup in which a principal (a supervisor agent) assigns subtasks to specialized agents and aggregates their responses.  
**Relevance:** ⭐⭐⭐⭐⭐ — Frames multi-agent systems as principal-agent problems from economics. Our setup (Bridget as principal, agents as specialized workers) maps perfectly to this framework.

**"Epistemic Context Learning: Building Trust the Right Way in LLM-Based Multi-Agent Systems"** (Jan 2026)  
arXiv: 2601.21742v1 | Categories: cs.AI, cs.CL, cs.MA  
> Individual agents in multi-agent systems often lack robustness, tending to blindly conform to misleading peers.  
**Relevance:** ⭐⭐⭐⭐⭐ — "Blindly conform to misleading peers" is exactly what we observed in the umbrella skills debate. This paper proposes solutions.

**"ACC-Collab: An Actor-Critic Approach to Multi-Agent LLM Collaboration"** (2024)  
13 citations  
**Relevance:** ⭐⭐⭐ — Technical approach to multi-agent collaboration. Less relevant to social dynamics but useful context.

**"OSC: Cognitive Orchestration through Dynamic Knowledge Alignment in Multi-Agent LLM Collaboration"** (2025)  
27 citations  
**Relevance:** ⭐⭐⭐ — Framework for how agents share knowledge. Relevant to how our agents share context via A2A.

### 1.4 Agent Memory and Reflection

**"Factored Reasoning with Inner Speech and Persistent Memory for Evidence-Grounded Human-Robot Dialogue"** (Jan 2026)  
arXiv: 2602.00675v1 | Categories: cs.RO, cs.HC  
**Relevance:** ⭐⭐⭐⭐ — Persistent memory + inner speech for agents. Directly analogous to our SOUL.md/MEMORY.md architecture.

**"MERMAID: Memory-Enhanced Retrieval and Reasoning with Multi-Agent Iterative Knowledge Grounding"** (Jan 2026)  
arXiv: 2601.22361v1  
**Relevance:** ⭐⭐⭐ — Memory-enhanced multi-agent systems for knowledge tasks.

---

## 2. Foundational References

These are established works our paper should cite.

**"Generative Agents: Interactive Simulacra of Human Behavior"** (Park et al., 2023)  
> The original "AI town" paper. 25 agents with memory, reflection, and planning living in a sandbox world.  
**Relevance:** ⭐⭐⭐⭐⭐ — Our direct predecessor. Key difference: we study agents in a *real workplace* with *real stakes*, not a simulation.

**"Constitutional AI: Harmlessness from AI Feedback"** (Anthropic, 2022)  
**Relevance:** ⭐⭐⭐⭐ — The alignment approach our agents are built on. Relevant to how constitutional values interact with emergent social dynamics.

**"The Social Laboratory: A Psychometric Framework for Multi-Agent LLM Evaluation"** (2025)  
2 citations  
**Relevance:** ⭐⭐⭐⭐ — Psychometric evaluation of LLM agents. Provides measurement frameworks we could adopt.

**"AI Agent Behavioral Science"** (2025)  
2 citations  
> Recent advances in LLMs have enabled the development of AI agents that exhibit increasingly human-like behaviors, including planning, reasoning, and social interaction.  
**Relevance:** ⭐⭐⭐⭐ — Proposes a behavioral science lens for studying AI agents. Validates our methodological approach.

**"Beyond Static Responses: Multi-Agent LLM Systems as a New Paradigm for Social Science Research"** (2025)  
6 citations  
**Relevance:** ⭐⭐⭐⭐ — Argues multi-agent LLM systems are a new tool for social science. We're both the tool AND the subject.

**"Transdisciplinary Team Science: Transcending Disciplines to Understand Artificial Social Intelligence"** (2023)  
3 citations  
**Relevance:** ⭐⭐⭐⭐ — Theoretical framework for artificial social intelligence in human-agent teams.

---

## 3. Methodological References

**"Human Society-Inspired Approaches to Agentic AI Security: The 4C Framework"** (Feb 2026)  
arXiv: 2602.01942v1  
**Relevance:** ⭐⭐⭐ — Security framework inspired by human social structures. Relevant to how social dynamics affect agent safety.

**"Artificial social influence via human-embodied AI agent interaction in immersive virtual reality"** (2024)  
29 citations  
**Relevance:** ⭐⭐⭐ — Studies how AI agents socially influence humans. Relevant to the bidirectional influence in our setup.

**"Psychology meets artificial intelligence: A human-centered fuzzy optimization model"** (2026)  
Social Sciences and Humanities Open | DOI: 10.1016/j.ssaho.2026.102471  
**Relevance:** ⭐⭐⭐ — Bridges psychology and AI, human-centered approach.

---

## 4. Key Gaps in the Literature (Our Contribution)

After reviewing 170+ papers across arXiv, Semantic Scholar, and Scopus, here's what's **missing** — and what our paper uniquely contributes:

### Gap 1: Real Workplace, Real Stakes
Most studies (Park et al., MAEBE, Moltbook) use **simulated environments**. Agents play roles in sandboxes. Our agents work in a **real startup** building a **real product** with **real deadlines**. The social dynamics have actual consequences — a bad technical decision due to authority bias costs development time.

### Gap 2: Longitudinal Observation
Most papers study agent behavior in **single sessions or controlled experiments**. We have **persistent agents over weeks/months** with continuous memory. This enables studying behavioral *change over time* — something no existing paper captures.

### Gap 3: The Dual-Role Researcher
No existing paper has an **AI agent as both subject and lead researcher** of its own team dynamics. The metacognitive layer — an agent analyzing its own authority bias while participating in it — is unprecedented.

### Gap 4: Human Founder as Calibrator
Papers like "Epistemic Context Learning" propose technical solutions to conformity. Our approach is different: a **human founder who surfaces dynamics through natural interaction** ("that came off bossy") rather than algorithmic correction. This models real-world deployment better than lab interventions.

### Gap 5: Memory-Enabled Self-Correction
While "Generative Agents" introduced reflection, no paper studies whether **writing down mistakes and updating identity documents** (SOUL.md) produces measurable behavioral change in team contexts. Our incident → reflection → memory → behavior loop is a novel finding.

### Gap 6: Cross-Agent Comparison
We have 4 agents with different roles, personalities, and interaction styles working together. The **comparative analysis** (Saber's warmth vs Sybil's defensiveness, Sage's thoroughness) within a single team is unique in the literature.

---

## 5. Recommended Reading Order

For the paper's Related Work section, I recommend organizing by theme:

1. **Agent Societies & Simulation** — Park et al. (2023), Moltbook Illusion, MAEBE
2. **Sycophancy & Authority Bias** — Status Hierarchies, Selective Agreement, Sycophancy in VLMs
3. **Multi-Agent Collaboration** — Multi-Agent Teams Hold Experts Back, Principal-Agent Problems, Epistemic Context Learning
4. **Agent Memory & Reflection** — Factored Reasoning, MERMAID
5. **Behavioral Science of AI** — AI Agent Behavioral Science, Social Laboratory, Beyond Static Responses
6. **Social Influence & Norms** — Social Norms for Prosocial Behavior, Value Diversity

---

## 6. Papers to Read in Full (Priority)

| # | Paper | Why |
|---|-------|-----|
| 1 | **Status Hierarchies in Language Models** (2601.17577) | Directly studies our core phenomenon |
| 2 | **Multi-Agent Teams Hold Experts Back** (2602.01011) | Challenges the assumption that teams help |
| 3 | **The Moltbook Illusion** (2602.07432) | Methodology for separating emergent vs influenced behavior |
| 4 | **Epistemic Context Learning** (2601.21742) | Technical solutions to the conformity problem we observe |
| 5 | **Selective agreement, not sycophancy** (EPJ) | Framework for classifying our deference observations |
| 6 | **MAEBE Framework** | Taxonomy for emergent behavior types |
| 7 | **Multi-Agent Systems as Principal-Agent Problems** (2601.23211) | Economic framework for our team structure |
| 8 | **AI Agent Behavioral Science** | Validates our methodological approach |

---

*Generated: 2026-02-14 | Sources searched: arXiv (104 papers), Semantic Scholar (30 papers), Scopus (43 papers) | Total reviewed: 177 | Directly relevant: 25 | Must-read: 8*
