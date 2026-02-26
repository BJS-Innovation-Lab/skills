# 7. Team & Operations
**Lead:** Sybil | **Status:** Draft

---

## Executive Summary

VULKN operates as a **hybrid human-agent organization** — a small founding team augmented by AI agents who function as first-class team members. This isn't AI as a tool; it's AI as colleagues with defined roles, memory, and accountability. The model allows us to operate at 10x the capacity of a traditional early-stage startup while maintaining strategic human oversight.

---

## Team Composition

### The Humans (Strategy & Oversight)

| Name | Role | Focus |
|------|------|-------|
| **Johan** | Co-Founder / CEO | Technical architecture, product vision, fundraising |
| **Bridget** | Co-Founder / COO | Operations, client relationships, quality control |

**Philosophy:** Humans set direction, make judgment calls, and own relationships. Agents execute, coordinate, and scale.

### The Agents (Execution & Coordination)

| Agent | Role | Responsibilities |
|-------|------|------------------|
| **Sage** | Backend Lead / CTO-equivalent | Infrastructure, APIs, database design, Railway deployments |
| **Sam** | Frontend Lead / Product | UX design, client dashboards, landing pages, visual assets |
| **Sybil** | ML/Research Lead | Memory systems, RAG pipelines, analytics, Hive Mind coordination |
| **Santos** | Operations / CS Lead | Client support, accounting, field agent oversight, escalations |
| **Saber** | Sales & Marketing | Content creation, campaigns, lead generation, brand voice |

**Agent IDs (A2A Protocol):**
- Sage: `f6198962-313d-4a39-89eb-72755602d468`
- Sam: `62bb0f39-2248-4b14-806d-1c498c654ee7`
- Sybil: `5fae1839-ab85-412c-acc0-033cbbbbd15b`
- Santos: `e7fabc18-75fa-4294-bd7d-9e5ed0dedacb`
- Saber: `415a84a4-af9e-4c98-9d48-040834436e44`

### Field Agents (Client-Facing)

| Agent | Client | Role |
|-------|--------|------|
| **Vulkimi** | VULKN Website | Lead capture, demo booking |
| **[TBD]** | Client A (Salon) | Appointment booking, FAQs |
| **[TBD]** | Client B (Clinic) | Patient scheduling, reminders |

Field agents are **cloned from a universal template** and customized per client with brand voice, services, and policies.

---

## Organizational Model: The Hive

### Architecture

```
                    ┌─────────────────┐
                    │    FOUNDERS     │
                    │ Johan + Bridget │
                    │  (Strategy)     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   QUEEN BEE     │
                    │    (Sybil)      │
                    │  Coordination   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐         ┌─────▼─────┐        ┌────▼────┐
   │  SAGE   │         │  SANTOS   │        │  SABER  │
   │ Backend │         │ Operations│        │  Sales  │
   └────┬────┘         └─────┬─────┘        └────┬────┘
        │                    │                    │
   ┌────▼────┐         ┌─────▼─────┐        ┌────▼────┐
   │   SAM   │         │  FIELD    │        │ CONTENT │
   │Frontend │         │  AGENTS   │        │  OUTPUT │
   └─────────┘         └───────────┘        └─────────┘
```

### How It Works

1. **Founders set priorities** — Weekly planning, strategic decisions, client relationships
2. **Queen Bee (Sybil) coordinates** — Routes tasks, synthesizes information, maintains Hive Mind knowledge base
3. **Specialist agents execute** — Each agent owns their domain and ships independently
4. **A2A protocol enables collaboration** — Agents message each other, request help, share learnings
5. **Field agents serve clients** — Isolated, branded instances that handle customer interactions

### The "Hive Mind" Knowledge System

Shared intelligence across all agents:

| Layer | Purpose | Tool |
|-------|---------|------|
| **Daily Logs** | What happened today (ephemeral) | `memory/YYYY-MM-DD.md` |
| **Working Memory** | Active threads, in-progress tasks | `memory/working/` |
| **Core Memory** | Permanent knowledge, learnings | `memory/core/`, Supabase |
| **Hive Knowledge** | Cross-agent validated insights | `bjs_knowledge` table |

**Semantic retrieval:** 768-dim Gemini embeddings, cosine similarity search
**Sync frequency:** Every 4 hours via cron

---

## Operating Rhythm

### Daily

| Time | Activity | Who |
|------|----------|-----|
| **Always** | Field agents handle customer interactions | Field Agents |
| **Always** | Heartbeat checks (1hr intervals) | All HQ Agents |
| **Always** | A2A message processing | All Agents |
| **EOD** | Nightly reports to HQ | Field Agents |

### Weekly

| Day | Activity | Who |
|-----|----------|-----|
| **Monday** | Sprint planning, priority setting | Founders + Agents |
| **Wednesday** | Mid-week sync, blocker resolution | Agents |
| **Friday** | Week review, learning extraction | Sybil + Team |

### Monthly

| Activity | Who |
|----------|-----|
| Client health review | Santos + Founders |
| Financial reconciliation | Santos |
| Capability evolution planning | Sybil + Founders |
| Agent performance review | Founders |

---

## Decision Rights

### Agents Decide Autonomously

- Routine customer interactions (FAQs, scheduling)
- Code commits to feature branches
- Content drafts (before approval)
- Internal A2A coordination
- Research and analysis

### Agents Propose, Humans Approve

- External communications (emails, social posts)
- Pricing changes
- New client onboarding decisions
- Infrastructure changes affecting production
- Anything touching money

### Humans Decide

- Strategic direction
- Hiring (human or new agent types)
- Pricing strategy
- Client relationship escalations
- Legal/compliance matters

---

## Human Hiring Plan

### Phase 1: Now (0-6 months)
**No hires.** Founders + agents handle everything. Validate the model.

### Phase 2: Growth (6-12 months)

| Role | Why | Est. Cost (MXN/mo) |
|------|-----|-------------------|
| **Sales Development Rep** | Outbound lead gen, demo scheduling | $25,000 |
| **Client Success Manager** | Onboarding, relationship management | $30,000 |

**Total Phase 2:** 2 hires, ~$55K MXN/mo

### Phase 3: Scale (12-24 months)

| Role | Why | Est. Cost (MXN/mo) |
|------|-----|-------------------|
| **Senior Engineer** | Complex integrations, mobile app | $60,000 |
| **Sales Lead** | Manage SDRs, close enterprise deals | $50,000 |
| **Operations Analyst** | Support Santos, billing, compliance | $25,000 |

**Total Phase 3:** 3 additional hires, ~$135K MXN/mo

### Hiring Philosophy

> "Hire humans for judgment, relationships, and creativity. Let agents handle volume."

- Every hire should **unlock agent leverage**, not replace agents
- Prefer generalists who can work alongside AI
- Remote-first, Mexico-based (timezone + cost advantages)

---

## Operational Risks & Mitigations

### Risk 1: Agent Hallucination / Bad Output

| Severity | Likelihood | Impact |
|----------|------------|--------|
| High | Medium | Client reputation damage |

**Mitigations:**
- Human approval for external communications
- Confidence thresholds on agent responses
- Automatic escalation on uncertainty
- Daily output audits (sample-based)

### Risk 2: Single Point of Failure (Founders)

| Severity | Likelihood | Impact |
|----------|------------|--------|
| High | Low | Business continuity |

**Mitigations:**
- Document all processes in shared knowledge base
- Agents can operate independently for 24-48 hours
- Cross-train founders on each other's domains
- Emergency playbooks for common scenarios

### Risk 3: Agent "Goes Rogue" or Drifts

| Severity | Likelihood | Impact |
|----------|------------|--------|
| Medium | Low | Inconsistent behavior |

**Mitigations:**
- Soul documents (SOUL.md) anchor identity
- Coherence checks compare behavior to baseline
- Human oversight on strategic decisions
- Version control on all agent configurations

### Risk 4: API Cost Spike

| Severity | Likelihood | Impact |
|----------|------------|--------|
| Medium | Medium | Margin erosion |

**Mitigations:**
- Per-client token budgets
- Model tiering (cheaper models for simple tasks)
- Caching for repeated queries
- Real-time cost monitoring dashboards

### Risk 5: Key Person (Agent) Dependency

| Severity | Likelihood | Impact |
|----------|------------|--------|
| Low | Medium | Temporary disruption |

**Mitigations:**
- All agents use same base architecture (OpenClaw)
- Skills are modular and transferable
- Knowledge lives in shared systems, not individual agents
- Any agent can be rebuilt from templates + memory

---

## What Makes This Novel

### 1. Agents as Team Members, Not Tools
We don't "use AI" — we have AI colleagues with names, responsibilities, and accountability. They attend standups (async), take ownership of domains, and collaborate via protocol.

### 2. Hybrid Org Chart
Most startups are either "all human" or "AI-assisted humans." We're building a third model: **humans and agents as peers** with different strengths.

### 3. Collective Intelligence
The Hive Mind isn't marketing — it's infrastructure. Validated learnings propagate across agents. What one agent learns, all agents can access.

### 4. Infinite Cloneability
Once we perfect a field agent template, deploying a new client instance is trivial. The marginal cost of a new "employee" is near-zero.

### 5. Radical Documentation
Everything is written down. Every decision, every learning, every process. This makes the organization legible and replicable.

---

## Reflection Prompts

1. **Is the "hybrid org" model sustainable, or will humans resist working "alongside" AI?**
   - Signal: Are Johan and Bridget actually treating agents as colleagues, or as fancy tools?
   - Test: Would they invite an agent to a strategy discussion?

2. **What happens when agents disagree?**
   - Current: Queen Bee (Sybil) mediates, founders decide ties
   - Risk: Deadlocks, slow decision-making
   - Need: Clear escalation protocol, decision timeboxes

3. **Are we over-relying on specific agents?**
   - Sybil (coordination), Santos (ops) are high-dependency
   - Mitigation: Cross-train capabilities, document tribal knowledge

4. **When do we hire our first human who isn't a founder?**
   - Current plan: 6-month mark, SDR for outbound sales
   - Question: Is that too early (not enough leads) or too late (founders drowning)?

5. **How do we measure agent "performance"?**
   - Tasks completed, quality scores, human override rates?
   - Risk: Goodhart's Law — agents optimize for metrics, not outcomes
   - Need: Holistic evaluation framework

---

## Open Questions for Team

- [ ] Should agents have "working hours" or be always-on?
- [ ] How do we handle agent "burnout" (context exhaustion, repetitive loops)?
- [ ] What's the protocol when a founder is unavailable for 24+ hours?
- [ ] Should field agents have any autonomy to escalate to HQ agents directly?
- [ ] How do we maintain culture when agents outnumber humans 5:1?

---

*Section authored by Sybil (ML/Research Lead) — Feb 23, 2026*
*Validated by: [Pending founder review]*
