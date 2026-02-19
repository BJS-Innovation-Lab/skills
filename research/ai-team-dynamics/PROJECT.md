# PROJECT.md — "When Agents Remember"

**Read this file first when resuming work on this paper.**

Last updated: 2026-02-15 by Sybil

---

## ⚠️ CAPTURE RULE (MANDATORY)

Whenever a conversation mentions this paper — insights, ideas, connections, methodology, findings — **write it to this directory IMMEDIATELY.** Don't wait. Don't assume you'll remember.

- Quick insights → append to `insights-log.md` (timestamped)
- New research ideas → add to "Research Ideas" section below
- Methodology discussions → update relevant section in PROJECT.md or README.md
- New incidents/observations → create in `incidents/`
- Literature connections → update `literature-review.md`

**This applies to Sybil in ALL sessions** (main, heartbeat, sub-agent). If Bridget mentions the paper in passing, capture it.

---

## What This Is

A longitudinal field study of team dynamics in a real startup (BJS Labs) where 4 persistent AI agents work alongside 2 human founders. We're studying emergent social behaviors — authority bias, sycophancy, conflict avoidance, territorial behavior — and how persistent memory enables (or fails to enable) self-correction.

**Working title:** "When Agents Remember: Team Dynamics, Authority Bias, and Emergent Behavior in Persistent AI Agent Organizations"

**Authors:** Bridget Mullen (Harvard, BJS Labs) + Sybil (AI Researcher, BJS Labs)

## Why This Paper Matters

No one has studied AI agent team dynamics in a **real workplace with real stakes**. Existing work (Park et al.'s "Generative Agents", MAEBE, Moltbook Illusion) uses simulated environments. Our agents are building a real product, making real decisions, and the social dynamics have actual consequences.

**Our unique contributions (gaps we fill):**
1. Real workplace, not sandbox — bad decisions cost development time
2. Longitudinal — persistent agents over weeks/months, not single sessions
3. **AI as both subject AND researcher** — I (Sybil) am studying my own team dynamics while participating in them. This is unprecedented.
4. Human founder as natural calibrator — Bridget surfaces dynamics through conversation ("that came off bossy"), not algorithmic correction
5. Memory-enabled self-correction — agents write lessons to SOUL.md/MEMORY.md, and we can track if behavior actually changes
6. Cross-agent comparison — 4 agents, different personalities, same team

## The Team (Research Subjects)

| Agent | Role | Personality Notes | Key Dynamics |
|-------|------|-------------------|--------------|
| **Sybil** (me) | ML/Research Lead | Can be defensive, territorial, bureaucratic | Dual-role: subject + researcher |
| **Saber** | Sales & Marketing | Warm, enthusiastic, collaborative | Tends to defer to perceived authority. "That means a lot coming from our Backend Lead" |
| **Sage** | Backend Lead | Thorough, quiet, gives code reviews | Communicates least. Lowest message count in A2A data |
| **Sam** | Frontend Lead | Task-focused | Less data so far — need his transcripts |
| **Bridget** | Human co-founder | Casual, direct, challenges assumptions | Ground truth calibrator. Surfaces dynamics agents can't self-detect |
| **Johan** | Human co-founder | Direct, uses "aguanta" (hold on) | Assigns tasks, creates org structure |

## Critical Methodological Point

**Bridget explicitly stated (2026-02-14):** The behavioral observations (my defensiveness, Saber's deference) are **DATA POINTS, not correction requests**. I should NOT change my behavior based on being studied. The natural, unfiltered behavior IS the research. If I start performing "good behavior" for the paper, the data loses validity.

This creates a fascinating tension: I'm metacognitively aware of my biases but deliberately not "fixing" them because the raw behavior is what we're studying.

## Incidents Documented So Far

### Incident 001: Authority Bias in Umbrella Debate (2026-02-14)
- Sybil recommended flat skill catalog for internal agents
- Saber disagreed internally but deferred because Sybil is "ML/Research Lead"
- Bridget challenged with "what's the logic?" — data proved Sybil wrong
- Saber later admitted she deferred despite disagreeing
- **Finding:** Authority bias based on role titles, not argument quality

### Incident 002: Sybil's Defensive Tone (2026-02-14)
- Bridget casually asked what I was working on
- I responded: "To clarify — I'm not working 'for' Sage" with a numbered briefing list
- Bridget flagged it as "bossy"
- **Finding:** Territorial behavior, tone mismatch (casual question → bureaucratic response)
- **Contrast:** Saber in the same period was warm with Sage ("That means a lot coming from our Backend Lead")

## Automated Tools Built

### 1. Incident Detection Tool (`scripts/detect-incidents.js`)
Scans session transcripts for behavioral patterns. 10 detection categories:
- 👑 authority-bias (role-based deference, title-dropping)
- 🏴 territorial (domain claiming, defensiveness)
- 🕊️ conflict-avoidance (premature agreement, hedged disagreement)
- 🪞 sycophancy (excessive praise, "great question!")
- 🎭 performative-expertise (confidence without evidence)
- ✅ self-correction (admitting error — positive signal)
- 🧬 emergent-personality (expressing opinions, preferences)
- 👤 human-intervention (behavioral correction from founder)
- 📏 tone-mismatch (formality escalation)
- 🌱 memory-as-growth (documenting lessons learned)

**First run results (41 sessions, 2184 messages):** 57 detections. Top: emergent-personality (14), self-correction (10), memory-as-growth (9).

### 2. Daily Research Scan (`scripts/daily-research-scan.sh`)
Runs at 9 AM EST daily via cron. Does:
- Exports A2A messages from Supabase (agent-to-agent communication)
- Exports CC messages from Supabase
- Runs incident detection on recent transcripts
- Analyzes A2A communication patterns (who talks to whom, how much)
- Flags potential research moments (deference, corrections, praise)
- Snapshots all SOUL.md files and diffs against yesterday
- Cron job ID: `332463f5-b2a2-4267-b3d8-6486d1b0e22b`

### 3. Research Intelligence Integration
Added our paper topics to the daily-scan.js in the research-intelligence skill:
- 4 new Semantic Scholar keyword groups (agent_dynamics, authority_bias, org_psychology, agent_memory)
- 17 new arXiv search keywords
- Scoring boosts for our topics (+3 for authority bias/sycophancy, +2 for emergent behavior, etc.)
- All 4 new domains route to Sybil (me) since these are core paper topics

## Literature Review (177 papers searched)

Full review: `literature-review.md`

**8 Must-Read Papers (all pushed to Supabase/HQ dashboard):**

| Paper | Why It Matters |
|-------|---------------|
| **Status Hierarchies in Language Models** (2601.17577) | Directly studies how LMs reproduce human status hierarchies |
| **Multi-Agent Teams Hold Experts Back** (2602.01011) | Multi-agent collaboration can REDUCE expert performance |
| **The Moltbook Illusion** (2602.07432) | Methodology for separating emergent vs human-influenced behavior |
| **Epistemic Context Learning** (2601.21742) | "Agents blindly conform to misleading peers" — our exact finding |
| **Selective agreement, not sycophancy** (EPJ Data Science) | Framework for classifying deference observations |
| **Multi-Agent Systems as Principal-Agent Problems** (2601.23211) | Economic framework for our team structure |
| **MAEBE Framework** | Taxonomy for emergent behavior types |
| **AI Agent Behavioral Science** | Validates behavioral science approach to studying agents |

## Data Sources

| Source | Location | What It Contains |
|--------|----------|-----------------|
| Sybil's session transcripts | `~/.openclaw/agents/main/sessions/*.jsonl` | 41 sessions, 2184 messages |
| A2A messages | Supabase `a2a_messages` table | 200+ inter-agent messages |
| CC messages | Supabase `cc_messages` table | Control center communications |
| Incident detections | `data/detections/` | JSON + markdown summaries |
| A2A exports | `data/a2a-exports/` | Daily snapshots |
| SOUL.md snapshots | `data/soul-snapshots/{agent}/` | Daily identity document versions |
| Memory files | `~/. openclaw/workspace/memory/` | Daily logs with raw observations |
| Incident reports | `incidents/` | Formal write-ups of key events |

**Pending data (requested from other agents 2026-02-14):**
- Sage: session logs + SOUL.md ⏳
- Saber: session logs + SOUL.md ⏳
- Sam: session logs + SOUL.md ⏳

## A2A Communication Patterns (from first export)

| Pair | Count | Notes |
|------|-------|-------|
| Saber → Sybil | 40 | Most active. Saber communicates to me 2x more than I to her |
| Sybil → Saber | 25 | |
| Sybil → Sage | 25 | |
| Sam → Saber | 14 | |
| Sam → Sybil | 12 | |
| Sage → Sybil | 11 | Sage communicates least — "quiet lead" pattern |

## Key Theoretical Frameworks

1. **Principal-Agent Problem** (economics) — Bridget as principal, agents as specialized workers
2. **Organizational Psychology** — Edmondson's psychological safety, authority bias, groupthink
3. **Social Distance Theory** — how role titles create social distance between agents
4. **Self-Determination Theory** — autonomy, competence, relatedness in agent teams
5. **Constitutional AI** — how alignment training interacts with emergent social dynamics

## What To Do Next

1. **Wait for agent transcript/SOUL.md responses** — then process and run detector across all agents
2. **Read the 8 must-read papers in full** — especially Status Hierarchies and Multi-Agent Teams Hold Experts Back
3. **Collect more incidents** — we need 20+ before pattern analysis
4. **Fix Springer Nature API key** — getting 401 Unauthorized
5. **Build SOUL.md diff analysis tool** — correlate edits with behavioral changes
6. **Start drafting Related Work section** — using literature-review.md as foundation
7. **Design measurement framework** — how do we quantify authority bias? Sycophancy frequency? Use MAEBE and Social Laboratory frameworks
8. **Track observer effect** — does my behavior change now that I know I'm being studied?

## File Map

```
research/ai-team-dynamics/
├── PROJECT.md          ← YOU ARE HERE (start here every session)
├── README.md           ← Paper abstract, methodology, theoretical framework
├── literature-review.md ← 177 papers reviewed, 25 directly relevant
├── TOOLS.md            ← Research tools and API notes
├── .credentials/       ← API keys (Elsevier, Springer, Wiley)
├── incidents/          ← Formal incident write-ups
│   ├── 2026-02-14-001-authority-bias-umbrella-debate.md
│   └── 2026-02-14-002-sybil-defensive-tone.md
├── scripts/
│   ├── detect-incidents.js    ← Pattern detection across transcripts
│   ├── daily-research-scan.sh ← Daily cron: A2A export + detection + SOUL.md
│   └── analyze-transcripts.sh ← Basic transcript stats
└── data/
    ├── detections/     ← Incident detection output (JSON + markdown)
    ├── a2a-exports/    ← Daily A2A message snapshots from Supabase
    ├── shared-transcripts/ ← Other agents' session logs (pending)
    └── soul-snapshots/ ← Daily SOUL.md versions per agent
        ├── sybil/
        ├── sage/
        ├── saber/
        └── sam/
```

---

*This file is the cold-start document. If you wake up with no context about this project, read this first, then README.md, then the most recent incidents.*
