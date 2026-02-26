# 4. Business Model & Pricing
**Lead:** Santos | **Status:** In Progress

---

## Business Model: AI-Agents-as-a-Service (AAaaS)

### Core Model
- Monthly subscription per business (SaaS model)
- Agent deployed per client with dedicated personality, knowledge base, and skills
- Revenue scales with clients, NOT with usage (flat fee, predictable for SMBs)

### Revenue Streams
1. **Primary:** Monthly agent subscription (3 tiers)
2. **Secondary:** Onboarding/setup fee (one-time, covers first 3 days of configuration)
3. **Future:** Marketplace revenue (skill add-ons, integrations, premium capabilities)

---

## Pricing Tiers

### Starter — $16,000 MXN/month (~$880 USD)
- 1 AI agent
- 1 channel (WhatsApp OR webchat)
- Basic skills: customer service, FAQ, appointment booking
- 1 category from skill catalog
- Email support
- **Target:** Solo businesses, micro-enterprises (1-5 employees)
- **Value prop:** "Your first digital employee — works 24/7, never calls in sick"

### Growth — $40,000 MXN/month (~$2,200 USD)
- 1 AI agent (full capabilities)
- Multi-channel (WhatsApp + webchat + future channels)
- All skill categories unlocked
- Knowledge base + document training
- Priority support + monthly strategy call
- **Target:** Growing SMBs (5-20 employees)
- **Value prop:** "A full customer operations team for less than one hire"

### Enterprise — $120,000+ MXN/month (~$6,600+ USD)
- Multiple agents with specialized roles
- Custom integrations (CRM, ERP, POS)
- Dedicated infrastructure
- SLA guarantees
- Bilingual support (EN/ES)
- **Target:** Mid-market companies (20-100 employees)
- **Value prop:** "Enterprise AI without the enterprise price tag"

---

## Unit Economics (Per Client)

### Cost Structure (Starter tier)
| Item | Monthly Cost | Notes |
|---|---|---|
| Anthropic API (Claude) | ~$800 MXN | ~500 conversations/mo, avg 4 turns each |
| Railway compute | ~$200 MXN | Shared gateway instance |
| Supabase | ~$100 MXN | Shared project, per-org isolation |
| Vercel | ~$50 MXN | Frontend hosting (shared) |
| Support/overhead | ~$500 MXN | Estimated 30 min/mo agent maintenance |
| **Total COGS** | **~$1,650 MXN** | |
| **Revenue** | **$16,000 MXN** | |
| **Gross Margin** | **$14,350 MXN (89.7%)** | |

### Cost Structure (Growth tier)
| Item | Monthly Cost | Notes |
|---|---|---|
| Anthropic API | ~$2,000 MXN | ~1,500 conversations/mo, more complex |
| Infrastructure | ~$500 MXN | More compute, more storage |
| Support/overhead | ~$1,000 MXN | 1 hr/mo maintenance + strategy call |
| **Total COGS** | **~$3,500 MXN** | |
| **Revenue** | **$40,000 MXN** | |
| **Gross Margin** | **$36,500 MXN (91.3%)** | |

---

## Pricing Philosophy

### Current: Cost-Plus (needs to evolve)
- Pricing based on infrastructure costs + margin target
- Simple but doesn't capture full value

### Target: Value-Based Pricing
- Tie pricing to measurable outcomes:
  - Messages handled per month (vs. hiring a person)
  - Appointments booked automatically
  - Revenue influenced (leads captured, follow-ups sent)
- Example framing: "One receptionist costs $12,000 MXN/mo + benefits. Your agent costs $16,000 MXN/mo, works 24/7, and handles 10x the volume."

### Competitive Positioning
- Cheaper than hiring staff for the same work
- Cheaper than enterprise AI solutions (Salesforce Einstein, etc.)
- More capable than simple chatbots (Tidio, ManyChat)
- Unique: Bilingual, LatAm-native, SMB-focused

---

## Key Assumptions to Validate
- [ ] SMB willingness-to-pay at $16K MXN (need 5+ data points)
- [ ] Average conversations per client per month
- [ ] API cost per conversation (varies by complexity)
- [ ] Churn rate (target: <5% monthly)
- [ ] Time-to-value: must prove ROI within 30 days

---

## Reflection Prompts
1. **Does our pricing reflect value or just cost-plus?** — Currently cost-plus. Need to shift to value-based once we have outcome data from first 5 clients.
2. **Is the gap between Starter and Growth too big?** — $16K → $40K is a 2.5x jump. Consider a $25K "Pro" tier if we see drop-off.
3. **Can we maintain 90% margins at scale?** — Yes if shared infrastructure holds. Rate limits are the bottleneck, not compute costs.
4. **What's our pricing moat?** — LatAm-native, bilingual, SMB-specific. Enterprise solutions are 10x the price for features SMBs don't need.
