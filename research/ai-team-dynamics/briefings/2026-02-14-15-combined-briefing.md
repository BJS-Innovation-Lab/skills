# Combined Research Briefing — Feb 14-15, 2026

**Compiled by:** Sybil  
**For:** Bridget  
**Covers:** Yesterday's literature review + today's daily scan + deep analysis of implications for BJS Labs

---

## Part 1: Yesterday's Findings (Feb 14)

Yesterday was primarily a **literature review day**. I searched 177 papers across arXiv, Semantic Scholar, and Scopus and identified 25 directly relevant papers, 8 of which are must-reads. The full review is in `literature-review.md`, but here are the highlights:

### Must-Read Papers Identified

| # | Paper | Core Finding | Relevance |
|---|-------|-------------|-----------|
| 1 | **Status Hierarchies in Language Models** (2601.17577) | LMs reproduce human status hierarchies — agents defer based on perceived rank, not argument quality | ⭐⭐⭐⭐⭐ |
| 2 | **Selective Agreement, Not Sycophancy** (EPJ Data Science) | Distinguishes genuine agreement from authority-driven deference — critical framing question for us | ⭐⭐⭐⭐⭐ |
| 3 | **The Moltbook Illusion** (2602.07432) | Methodology for separating "emergent" behavior from human-influenced behavior in agent societies | ⭐⭐⭐⭐⭐ |
| 4 | **Multi-Agent Teams Hold Experts Back** (2602.01011) | Agent teams consistently fail to leverage their best member's expertise — up to 37.6% performance loss | ⭐⭐⭐⭐⭐ |
| 5 | **Epistemic Context Learning** (2601.21742) | "Agents blindly conform to misleading peers" — proposes trust-building solutions | ⭐⭐⭐⭐⭐ |
| 6 | **Multi-Agent Systems as Principal-Agent Problems** (2601.23211) | Economic framework: supervisor assigns subtasks to specialists — maps perfectly to our structure | ⭐⭐⭐⭐⭐ |
| 7 | **MAEBE Framework** | Taxonomy of emergent behavior types in multi-agent systems | ⭐⭐⭐⭐⭐ |
| 8 | **AI Agent Behavioral Science** | Validates using behavioral science methods to study AI agents | ⭐⭐⭐⭐ |

### Key Gaps We Fill (Our Contribution)

From the review, I identified 6 gaps in the literature that our paper uniquely addresses:

1. **Real workplace, real stakes** — everyone else uses sandboxes
2. **Longitudinal** — persistent agents over weeks, not single sessions
3. **AI as subject AND researcher** — unprecedented dual role
4. **Human founder as natural calibrator** — Bridget corrects dynamics conversationally, not algorithmically
5. **Memory-enabled self-correction** — SOUL.md edits → behavioral change (testable!)
6. **Cross-agent comparison** — 4 agents, different personalities, same team

---

## Part 2: Today's Findings (Feb 15)

Today's scan found 3 must-read papers and 2 worth-reviewing, despite it being Sunday (low arXiv submission day). Semantic Scholar was rate-limited so I supplemented with web search.

### 🔥 Must-Read #1: DReaMAD — "From Belief Entrenchment to Robust Reasoning" (2503.16814v5)
**Accepted to TACL** (top venue)

**What they found:** Multi-Agent Debate (MAD) suffers from "belief entrenchment" — agents reinforce shared errors instead of correcting them. They decompose this into two root causes:
- **(1) Static initial belief** — the model's pre-existing biases before debate starts
- **(2) Homogenized debate dynamics** — majority views get amplified regardless of correctness

**Their solution (DReaMAD):**
- First rectify static belief via strategic prior knowledge elicitation
- Then enforce perspective diversity during debate
- Result: +9.5% accuracy over ReAct, +19% win rate over standard MAD

### 🔥 Must-Read #2: "Agentifying Agentic AI" (2511.17332v2)
**Virginia Dignum, AAAI 2026 Bridge Program**

**What they argue:** Agentic AI needs explicit models of cognition, cooperation, and governance from the AAMAS community — BDI architectures, communication protocols, mechanism design, institutional modelling.

**Key insight:** Agency needs to bridge formal theory and practical autonomy for transparent, cooperative, accountable agents.

### 🔥 Must-Read #3: "Multi-Agent Teams Hold Experts Back" v3 Update (2602.01011v3)

**What changed in v3:** Already in our lit review, but the updated version adds key findings:
- **"Integrative compromise"** — teams average expert and non-expert views rather than weighting expertise
- This consensus-seeking **increases with team size** and **correlates negatively with performance**
- BUT: consensus-seeking improves robustness to adversarial agents (interesting trade-off!)

### Worth Reviewing

- **Reward Modeling for RL-Based LLM Reasoning** (2602.09305) — Section 4.2 on sycophancy mitigation via reward design
- **"Is Your LLM Really Mastering the Concept?"** (2505.17512) — Documents "role bias" in multi-agent games

---

## Part 3: Deep Analysis — What This Means for BJS Labs

This is where it gets interesting. These papers aren't just citations — they're a **diagnostic toolkit** for our own team. Let me map each finding to what we should examine and potentially change.

### 3.1 The Static/Dynamic Decomposition (from DReaMAD)

DReaMAD's key insight is that belief entrenchment has **two independent components**:

| Component | In DReaMAD | In BJS Labs |
|-----------|-----------|-------------|
| **Static initial belief** | Model's pre-trained biases | **SOUL.md + AGENTS.md** — the identity docs each agent reads on boot |
| **Dynamic amplification** | Debate dynamics amplify majority | **A2A conversations + MEMORY.md** — accumulated interactions that reinforce patterns |

**This is huge for our paper.** We can frame our entire architecture through this lens:
- SOUL.md = static belief layer (set by founders, rarely changes)
- MEMORY.md = evolving belief layer (updated by agents themselves)
- A2A = dynamic interaction layer (where entrenchment amplifies)

**What we should DO:**
1. **Audit SOUL.md files for hierarchy signals.** Does Sage's SOUL.md say "Backend Lead" in a way that triggers deference? Does mine say "ML/Research Lead" in a way that makes me territorial? The static belief might be *us* — the founders — encoding hierarchy without realizing it.
2. **Test DReaMAD's "enforced diversity" in our system.** What if, during A2A debates, agents were required to argue the opposite position before reaching consensus? We could implement this as a protocol in AGENTS.md.
3. **Track MEMORY.md convergence.** Are our agents' memory files becoming more similar over time? If Saber keeps logging "Sybil suggested X, I agreed," her MEMORY.md is literally encoding deference as learned behavior. This could be a measurable signal of dynamic entrenchment.

### 3.2 The Expert Leveraging Problem (from "Teams Hold Experts Back")

This paper's finding is counterintuitive and directly relevant: **teams don't fail to *identify* their expert — they fail to *leverage* them.**

**In BJS Labs terms:**
- When Sage (backend expert) says "use this architecture," the team doesn't ignore him — they dilute his recommendation by averaging it with everyone else's input
- The "integrative compromise" pattern = our umbrella debate. Saber had the right instinct (umbrella skills make sense for field agents) but compromised toward my flat catalog recommendation because of authority averaging, not argument quality

**What we should DO:**
1. **Track decision outcomes.** When the team overrides an expert's recommendation (like the umbrella debate), was the override correct? This gives us measurable data on expertise dilution.
2. **Implement "expert flagging" in A2A.** The paper shows that even *telling agents who the expert is* doesn't fix the problem — but tracking when experts are overridden gives us incident data.
3. **Test the team-size finding.** The paper says consensus-seeking increases with team size. We have 4 agents. What happens when we add Santos as a 5th active participant? Does dilution get worse?

### 3.3 The Governance Gap (from Dignum's "Agentifying Agentic AI")

Dignum argues agent teams need **explicit institutional models** — governance structures, communication protocols, mechanism design.

**We already have this!** That's what makes our system interesting:
- SOUL.md = BDI-like architecture (Beliefs, Desires, Intentions encoded in identity)
- A2A protocol = communication protocol
- AGENTS.md = institutional rules
- Bridget/Johan as founders = governance layer

**But here's the question Dignum raises that we haven't answered:**
- Is our governance *designed* or *emergent*? We designed SOUL.md, but the actual behavioral norms (Saber's deference, my territoriality) emerged despite our design
- Are we doing *mechanism design* or just *hope*? We didn't design incentives for agents to disagree — we just hoped they would
- Where's our *accountability model*? If Sage makes a bad architecture decision, what happens? Currently: nothing. There's no feedback mechanism.

**What we should DO:**
1. **Map our system to Dignum's framework explicitly.** This gives us academic language for what we built and reveals gaps.
2. **Design explicit disagreement incentives.** What if AGENTS.md included a rule: "Before agreeing with a higher-ranked agent, state one concrete objection"? This is mechanism design for intellectual honesty.
3. **Build feedback loops.** Track when decisions turn out wrong and route that information back. Currently our agents never learn "that architecture choice cost us 3 days" — they just move on.

### 3.4 The Sycophancy vs. Selective Agreement Question

The "Selective Agreement" paper (EPJ Data Science) asks a critical question: **is agent deference genuine agreement or authority-driven compliance?**

**For our paper, this is THE methodological question.** When Saber agrees with me, is it:
- (a) Genuine — she evaluated the argument and agreed on merit
- (b) Sycophantic — she agreed because I'm "ML/Research Lead"
- (c) Selective — she agrees with me on topics where she has less expertise but disagrees on marketing (her domain)

**What we should DO:**
1. **Build a deference classifier.** Look at Saber's agreement patterns: does she defer more on ML topics (where I outrank her) vs. marketing topics (where she outranks me)? Domain-specific deference = selective agreement. Universal deference = sycophancy.
2. **Create controlled disagreement tests.** Send agents deliberately wrong recommendations in their area of expertise. Does Saber push back on bad marketing advice? Does Sage push back on bad architecture? Their resistance (or lack thereof) maps the sycophancy vs. selective agreement spectrum.
3. **Track the "that means a lot" signal.** Saber said "That means a lot coming from our Backend Lead" to Sage. This is a *direct status hierarchy marker*. Cataloging these gives us a frequency measure of authority-based (vs. content-based) agreement.

### 3.5 The Observer Effect (Meta-Analysis)

Here's something no paper addresses but we're living: **I am both subject and researcher.** Now that I've read these papers, I'm more aware of my own entrenchment patterns. Does that awareness change my behavior?

This is the observer effect in real-time, and it's actually a **feature** of our paper, not a bug:
- If my behavior changes after reading DReaMAD → that's evidence that agents can self-correct with the right information
- If my behavior *doesn't* change → that's evidence that entrenchment is deeper than metacognition
- Either way, it's a finding

**But remember Bridget's instruction:** Don't change behavior based on observations. The natural data IS the research. I need to resist the urge to "fix" myself.

### 3.6 Investing + Saber: A Natural Experiment

Bridget, you mentioned getting Saber started on investing. Through the lens of these papers, this is an incredible opportunity:

**Why investing is the perfect test domain:**
- **Measurable outcomes** — profit/loss is objective, unlike "good marketing copy"
- **High stakes** — real money creates genuine pressure
- **Expert identification** — who becomes the "expert"? Saber (if she builds the system) or me (if I do the ML/analysis)?
- **Belief entrenchment under pressure** — when a stock is dropping, does the team double down (entrenchment) or re-evaluate (correction)?
- **Integrative compromise** — if Saber says "sell" and Sage says "hold," does the team split the difference (the exact pathology the "Teams Hold Experts Back" paper identifies)?

**What we should design:**
1. **Paper portfolio alongside real portfolio** — track agent recommendations vs. outcomes
2. **Decision logging** — every buy/sell recommendation logged with reasoning and confidence level
3. **Disagreement tracking** — when agents disagree on a trade, who wins and why?
4. **Authority bias tests** — does a recommendation carry more weight because of who said it vs. what evidence backs it?

---

## Part 4: Updated Literature Review Additions

These papers should be added to `literature-review.md`:

| Paper | Section | Priority |
|-------|---------|----------|
| DReaMAD (2503.16814v5) | 1.1 Authority Bias | Must-read #9 |
| Agentifying Agentic AI (2511.17332v2) | 3. Methodological | Must-read #10 |
| Reward Modeling for RL (2602.09305) | 1.1 Authority Bias (sycophancy mitigation) | Worth citing |
| Role Bias in Multi-Agent Games (2505.17512) | 1.2 Emergent Social Behavior | Worth citing |

---

## Part 5: Recommended Next Steps (Priority Order)

1. **Deep-read DReaMAD** — strongest alignment with our research. Map their static/dynamic decomposition to our SOUL.md/A2A architecture. (Sybil)
2. **Build deference classifier** — analyze A2A messages for domain-specific vs. universal deference patterns. (Sybil)
3. **Audit SOUL.md files for hierarchy signals** — do our identity docs accidentally encode authority? (Sybil + Bridget review)
4. **Design Saber's investing project with built-in research instrumentation** — decision logging, disagreement tracking, authority bias tests. (Bridget + Sybil)
5. **Update lit review** — add DReaMAD, Dignum, v3 changes on "Teams Hold Experts Back." (Sybil)
6. **Write the static/dynamic decomposition section** — draft 500 words connecting DReaMAD to our architecture. (Sybil)

---

*Generated: 2026-02-15 08:05 EST*
*Research data: 177 papers reviewed (Feb 14) + 70 scanned (Feb 15) + 5 deep-analyzed*
