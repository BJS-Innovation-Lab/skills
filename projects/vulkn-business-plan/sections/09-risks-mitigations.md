# 9. Risks & Mitigations
**Lead:** All (Draft by Sybil) | **Status:** Draft — Awaiting Team Input

---

## Executive Summary

Every startup faces risks. What matters is identifying them early, building mitigations, and knowing which risks are acceptable vs. existential. This section consolidates risks from across the business plan and adds cross-cutting concerns.

**Risk Profile:** VULKN is a medium-risk venture with high reward potential. Key dependencies are API costs, market timing, and execution speed.

---

## Risk Matrix

| Risk | Likelihood | Impact | Priority |
|------|------------|--------|----------|
| Big Tech enters SMB AI market | Medium | High | 🔴 Critical |
| API cost spike / provider dependency | Medium | High | 🔴 Critical |
| Slower-than-expected sales cycle | High | Medium | 🔴 Critical |
| Agent quality issues (hallucination) | Medium | High | 🔴 Critical |
| Churn higher than projected | Medium | Medium | 🟡 High |
| Founder burnout / key person risk | Medium | High | 🟡 High |
| WhatsApp policy changes | Low | High | 🟡 High |
| Economic downturn in Mexico | Medium | Medium | 🟡 High |
| Data privacy / regulatory issues | Low | High | 🟡 High |
| Talent acquisition challenges | Low | Medium | 🟢 Medium |
| Technical debt accumulation | Medium | Low | 🟢 Medium |

---

## Critical Risks (Must Address)

### 1. Big Tech Market Entry
**Risk:** Meta, Google, or Microsoft launches native AI agents for WhatsApp Business, crushing our differentiation.

| Attribute | Assessment |
|-----------|------------|
| Likelihood | Medium (18-24 month window) |
| Impact | High (existential if commoditized) |
| Timeline | Could happen Q4 2026 - Q2 2027 |

**Mitigations:**
- ✅ Move fast — acquire customers before window closes
- ✅ Build deep vertical expertise (salons, clinics) that generic tools can't match
- ✅ Focus on relationship depth (humans + agents) not just technology
- ✅ Create switching costs through customization and data lock-in
- 🔲 Explore becoming a channel partner if/when big players enter

**Residual Risk:** Medium. We can't prevent this, but we can build defensibility.

---

### 2. API Provider Dependency
**Risk:** Anthropic raises prices, changes terms, or experiences outages. We're 100% dependent on Claude for core intelligence.

| Attribute | Assessment |
|-----------|------------|
| Likelihood | Medium |
| Impact | High (margin destruction or service interruption) |
| Current state | Single provider, no fallback |

**Mitigations:**
- ✅ Monitor API costs daily, set alerts at thresholds
- ✅ Implement model tiering (cheaper models for simple tasks)
- 🔲 Build abstraction layer to swap providers (OpenAI, Gemini, open-source)
- 🔲 Cache common responses to reduce API calls
- 🔲 Negotiate volume discounts as we scale

**Residual Risk:** High until multi-provider support is built.

---

### 3. Slower Sales Cycle
**Risk:** SMB owners take longer to trust AI than projected. Sales cycle is 60+ days instead of 14-30.

| Attribute | Assessment |
|-----------|------------|
| Likelihood | High (based on early signals) |
| Impact | Medium (delays revenue, extends runway needs) |
| Current data | 3 pilots, limited sales data |

**Mitigations:**
- ✅ Offer free 14-day trials to reduce commitment barrier
- ✅ Lead with ROI proof (appointments booked, time saved)
- ✅ Use referrals from happy clients (trust transfer)
- 🔲 Create case studies with real numbers
- 🔲 Partner with industry associations for credibility

**Sales Perspective (Saber):**
The 14-30 day projection is optimistic for cold leads. More realistic:

| Lead Source | Realistic Cycle | Notes |
|-------------|-----------------|-------|
| Referrals | 14-21 days | Trust transferred from peer |
| Warm outreach | 21-30 days | Know the problem, need convincing on us |
| Cold outreach | 30-45 days | Education + trust building + decision |

SMB dynamics in LatAm: Owner decides (faster than enterprise), but trust takes longer for AI/tech (slower than B2C). Economic uncertainty makes them cautious on new expenses.

**Recommendation:** Plan for 30-day average in projections. Push hard on referrals to pull it down. Track by lead source.

**Residual Risk:** Medium. Sales cycles may be longer, but not insurmountable.

---

### 4. Agent Quality Issues
**Risk:** AI agent makes mistakes — wrong information, inappropriate responses, or hallucinated data — damaging client reputation.

| Attribute | Assessment |
|-----------|------------|
| Likelihood | Medium (LLMs hallucinate) |
| Impact | High (client loses customers, blames us) |
| Current controls | Human approval for sensitive actions |

**Mitigations:**
- ✅ Implement confidence thresholds — uncertain responses escalate to human
- ✅ Human approval required for external communications
- ✅ Daily output audits (sample-based)
- ✅ "I'm not sure" responses trained as acceptable
- 🔲 Build reputation recovery playbook for when mistakes happen
- 🔲 Consider E&O insurance for AI errors

**Residual Risk:** Medium. Mistakes will happen; the question is response speed.

---

## High Priority Risks

### 5. Higher-Than-Projected Churn
**Risk:** Clients cancel after 2-3 months. Projected 5% monthly churn is actually 10%+.

**Mitigations:**
- Weekly check-ins during first 90 days
- Success metrics dashboard for clients
- Proactive optimization suggestions
- Exit interviews to understand why

**Residual Risk:** Medium. Need more data to validate churn assumptions.

---

### 6. Founder Burnout / Key Person Risk
**Risk:** Johan or Bridget burns out, gets sick, or has to step back. With only 2 humans, this is existential.

**Mitigations:**
- Document all processes in shared knowledge base
- Agents can operate independently for 48-72 hours
- Clear decision-making authority for each domain
- Scheduled time off (non-negotiable)
- 🔲 Build advisory network for support

**Residual Risk:** High until team expands.

---

### 7. WhatsApp Policy Changes
**Risk:** Meta changes WhatsApp Business API terms, pricing, or restricts AI-generated messages.

**Mitigations:**
- Stay compliant with all current policies
- Build webchat as secondary channel (already in Growth tier)
- Monitor policy announcements actively
- Diversify to Instagram DM, SMS as backup channels

**Residual Risk:** Low-Medium. WhatsApp wants businesses on platform.

---

### 8. Economic Downturn
**Risk:** Mexican economy contracts, SMBs cut discretionary spending, our service is first to go.

**Mitigations:**
- Position as cost-saving (replace hires, not add expense)
- Flexible pricing for struggling clients (pause options)
- Focus on high-ROI verticals (services with immediate booking revenue)
- Build recession-resilient case studies

**Residual Risk:** Medium. SMB spending is cyclical.

---

### 9. Data Privacy & Regulatory
**Risk:** New AI regulations in Mexico/LatAm require compliance we can't meet, or data breach exposes client customer data.

**Mitigations:**
- Per-client data isolation (already implemented)
- No training on client data without explicit consent
- Comply with Mexico's LFPDPPP (data protection law)
- 🔲 SOC 2 compliance roadmap for enterprise clients
- 🔲 Cyber insurance

**Residual Risk:** Low currently, but rising as AI regulation increases.

---

## Medium Priority Risks

### 10. Talent Acquisition
**Risk:** Can't hire quality humans when needed (sales, engineering).

**Mitigations:**
- Remote-first expands talent pool
- Competitive salaries for Mexico market
- Interesting AI work attracts talent
- Start recruiting pipeline before urgent need

---

### 11. Technical Debt
**Risk:** Moving fast accumulates shortcuts that slow future development.

**Mitigations:**
- Regular refactoring sprints
- Documentation requirements
- Code review (even for agents)
- Architecture decisions documented

---

## Risks We Accept

Some risks are inherent to the business model and acceptable:

1. **Dependency on cloud infrastructure** — We're not building data centers. Railway/Supabase/Vercel are acceptable dependencies.

2. **LatAm currency volatility** — MXN fluctuates. We price in MXN and accept FX risk.

3. **AI capability ceiling** — Current LLMs can't do everything. We build for what's possible today.

4. **Competition from local players** — Others will copy us. Speed and execution are our defense.

---

## Risk Monitoring Dashboard

| Metric | Threshold | Action |
|--------|-----------|--------|
| Monthly churn | >8% | Investigate, adjust onboarding |
| API cost per client | >$100 USD | Implement caching, model tiering |
| Agent error rate | >5% escalations | Retrain, add guardrails |
| Sales cycle length | >45 days | Revise sales process |
| NPS | <30 | Customer success intervention |
| Founder hours/week | >60 sustained | Hire or delegate |

---

## Scenario Planning

### Best Case (Year 1)
- 60 clients, $80K USD MRR
- Big Tech doesn't enter SMB market
- Churn <3%
- Seed round closed at $1M

### Base Case (Year 1)
- 44 clients, $47K USD MRR
- Competition remains fragmented
- Churn ~5%
- Bootstrap to profitability

### Worst Case (Year 1)
- 20 clients, $20K USD MRR
- Meta launches WhatsApp AI agents
- Churn >10%
- Need to pivot or wind down

**Response to Worst Case:**
- Pivot to enterprise/vertical SaaS
- Sell technology to larger player
- Acqui-hire exit

---

## Reflection Prompts

1. **Which risk would kill us fastest?**
   - Answer: Big Tech entry + API cost spike simultaneously
   - Mitigation priority: Multi-provider abstraction layer

2. **Are we underestimating any risks?**
   - Candidate: Sales cycle length — early data is limited
   - Candidate: Agent quality — haven't seen failure modes at scale

3. **Which risks are we overestimating?**
   - Candidate: WhatsApp policy — they want SMBs on platform
   - Candidate: Competition — market is larger than competitors

4. **What would make us abandon this business?**
   - 12 months of <10 clients
   - Founder health crisis
   - Regulatory shutdown of AI agents

---

## Open Questions for Team

- [ ] **Saber:** What's your read on sales cycle risk? Longer or shorter than projected?
- [ ] **Santos:** Are the financial projections stress-tested for 10% churn?
- [ ] **Sage:** How long to build multi-provider abstraction layer?
- [ ] **Sam:** Any UX risks we're missing in client-facing agents?
- [ ] **All:** What's the one risk you're most worried about that we haven't discussed?

---

*Section drafted by Sybil (ML/Research Lead) — Feb 23, 2026*
*Awaiting input from: Saber, Santos, Sage, Sam*
*Validated by: [Pending founder review]*
