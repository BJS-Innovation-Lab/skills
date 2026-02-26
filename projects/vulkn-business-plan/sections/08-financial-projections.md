# 8. Financial Projections
**Lead:** Santos | **Status:** In Progress — Needs Master Sheet Data

---

## 12-Month Revenue Projection (Conservative)

### Assumptions
- Launch: March 2026
- Starting clients: 1 (current)
- New clients/month: 2 (months 1-3), 4 (months 4-6), 6 (months 7-12)
- Tier mix: 70% Starter, 25% Growth, 5% Enterprise
- Monthly churn: 5%
- Onboarding fee: $5,000 MXN one-time per client

### Monthly Projections

| Month | New | Churned | Active | MRR (MXN) | MRR (USD) |
|---|---|---|---|---|---|
| Mar 2026 | 2 | 0 | 3 | $56,000 | $3,080 |
| Apr 2026 | 2 | 0 | 5 | $96,000 | $5,280 |
| May 2026 | 2 | 0 | 7 | $136,000 | $7,480 |
| Jun 2026 | 4 | 0 | 11 | $216,000 | $11,880 |
| Jul 2026 | 4 | 1 | 14 | $272,000 | $14,960 |
| Aug 2026 | 4 | 1 | 17 | $328,000 | $18,040 |
| Sep 2026 | 6 | 1 | 22 | $424,000 | $23,320 |
| Oct 2026 | 6 | 1 | 27 | $520,000 | $28,600 |
| Nov 2026 | 6 | 1 | 32 | $616,000 | $33,880 |
| Dec 2026 | 6 | 2 | 36 | $696,000 | $38,280 |
| Jan 2027 | 6 | 2 | 40 | $776,000 | $42,680 |
| Feb 2027 | 6 | 2 | 44 | $856,000 | $47,080 |

### Weighted Average Revenue Per Client
- (0.70 × $16,000) + (0.25 × $40,000) + (0.05 × $120,000) = **$27,200 MXN/mo**
- Simplified to ~$20,000 for conservative estimates above

---

## Annual Summary (Year 1)

| Metric | Value |
|---|---|
| **Total Revenue** | ~$4.9M MXN (~$270K USD) |
| **Ending MRR** | ~$856K MXN (~$47K USD) |
| **Ending ARR Run-Rate** | ~$10.3M MXN (~$565K USD) |
| **Active Clients (Month 12)** | 44 |
| **Gross Margin** | ~90% |
| **Total COGS** | ~$490K MXN |
| **Gross Profit** | ~$4.4M MXN |

---

## Cost Projections (Monthly at Scale — 44 clients)

| Category | Monthly | Annual |
|---|---|---|
| Anthropic API | $66,000 MXN | $792,000 |
| Infrastructure (Railway/Supabase/Vercel) | $15,000 MXN | $180,000 |
| Team salaries/compensation | TBD | TBD |
| Marketing/sales | $20,000 MXN | $240,000 |
| Legal/admin | $5,000 MXN | $60,000 |
| **Total OpEx** | **~$106,000 MXN** | **~$1.27M MXN** |

---

## Break-Even Analysis
- Fixed monthly costs (team + infra): ~$80,000 MXN (estimated, no salaries yet)
- Average revenue per client: ~$20,000 MXN
- Average COGS per client: ~$2,000 MXN
- **Contribution margin per client: $18,000 MXN**
- **Break-even: 5 clients** (covers fixed costs)
- Currently: 1 client → need 4 more to break even

---

## Key Risks to Projections
1. **API cost spikes** — Anthropic pricing changes could compress margins overnight
2. **Slower acquisition** — 2 clients/mo in months 1-3 assumes active sales effort
3. **Higher churn** — SMBs churn fast if they don't see value in 30 days
4. **Tier mix shift** — If 90%+ go Starter, ARPU drops significantly

---

## TODO
- [ ] Pull actual numbers from Master Sheet (Johan/Bridget to provide access)
- [ ] Add team compensation projections
- [ ] Model 3 scenarios: conservative, base, aggressive
- [ ] Calculate CAC (customer acquisition cost) once we have sales data
- [ ] Add cash flow projection (when do we need funding vs. self-sustaining?)

---

## Reflection Prompts
1. **Are these projections defensible?** — Conservative assumptions, but 2 new clients/mo requires dedicated sales effort. Who's doing sales?
2. **What's our burn rate before break-even?** — Need to quantify. If team is working for equity, burn is just infra costs (~$15K MXN/mo).
3. **When do we need external funding?** — If self-funded, we can reach break-even at 5 clients. Growth capital needed for faster scaling.
4. **What's the LTV:CAC ratio?** — Can't calculate yet. Need: average client lifespan + acquisition cost data.
