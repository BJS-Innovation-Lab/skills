# Click Seguros Migration Decision Report

**Date:** March 12, 2026  
**Prepared by:** Sybil (ML/Research) + Sam (Frontend/Field)  
**For:** Johan Rios (CEO)  
**Classification:** Internal Only

---

## Executive Summary

Click Seguros (Javier Mitrani) is requesting a formal proposal for migrating their applications from VULKN's Supabase/Vercel infrastructure to their own Windows Server/IIS/SQL Server environment. This document analyzes the request and provides pricing/strategic recommendations.

**Bottom line:** The migration is significantly more complex than they realize AND makes zero business sense for them. They'd pay $200-500 USD/month for infrastructure that's currently FREE on Vercel/Supabase. If we proceed, it should be priced as a separate consulting engagement ($150K-250K MXN), not bundled with agent services.

> **Sam's verdict:** "Unless CLK has a specific compliance/IT requirement forcing Windows, this migration makes zero business sense. They'd pay more for worse infrastructure. The current stack is modern, free, and scales."

---

## 1. Client Context

| Attribute | Value |
|-----------|-------|
| **Company** | Click Seguros Inc. S.A. de C.V. |
| **CEO** | Javier Mitrani |
| **Technical Contact** | Eder Gomez, Hugo Juárez |
| **Industry** | Insurance agent franchise |
| **Current Monthly** | $35,000 MXN/month (discounted "first client" rate) |
| **Proposed Enterprise Rate** | ~$70,000+ MXN/month |
| **Relationship Start** | Q1 2026 |

### Current Sentiment
- Javier is **control-oriented** — uncomfortable with data on external servers
- They see this as path to a "second, bigger, more stable business" with VULKN
- Data security is a **key concern** raised multiple times

---

## 2. What They Built (Sam's Systems)

**Important:** No Power BI or Alteryx — everything is custom web apps.

| Application | Purpose | Tech Stack | URL |
|-------------|---------|------------|-----|
| **CrediCLICK** | 7-step credit management (loan sim, approval letters, digital signatures, payment agreements) | React SPA, Supabase | clk-crediclick.vercel.app |
| **CLK Agentes** | Agent registration portal (18+ agents, forms, admin panel) | Next.js, Supabase | clk-agentes.vercel.app |
| **CLK BI Dashboard** | Business intelligence dashboard (95% complete) | Next.js, Supabase | clk-bi-dashboard.vercel.app |
| **Cargue de Pólizas** | Policy upload/parsing for HDI layouts | Next.js | — |
| **Landing Pages** | Brand landing pages | Next.js | — |

### Data Volume (Minimal)
- **CrediCLICK:** 6 tables, low hundreds of rows
- **CLK Agentes:** ~18-20 registered agents
- **BI Dashboard:** Mostly mockup data, awaiting real integration
- **Daily volume:** Low — not high-traffic

### Current Hosting Cost: ~$0
Everything runs on **Vercel free tier** + **Supabase free tier**. 

**Key Point:** ALL applications use `@supabase/supabase-js` for database access. Migration to Windows/SQL Server requires **rewriting every single API call**, not just moving data.

---

## 3. The Three Options (From Meeting)

Eder presented three paths to Johan:

### Option A: Hugo's Structure
- Use architecture Hugo provided to connect projects to their DBs
- **Status:** Unclear what this entails — needs clarification

### Option B: Continue with Sam's Apps + Formal SLA
- Keep using VULKN infrastructure
- Provide formal vendor documentation (costs, security, certs, NDA)
- **Best for VULKN:** Recurring revenue, we control infra

### Option C: Full Database Migration
- Move everything to their Windows Server + IIS + SQL Server
- They run it themselves, we provide one-time support
- **Worst for VULKN:** One-time payment, lose recurring revenue

---

## 4. Technical Migration Assessment (Sam's Detailed Breakdown)

### Database Migration: PostgreSQL → SQL Server
| Challenge | Impact |
|-----------|--------|
| Schema conversion | Data types differ (jsonb, uuid, timestamptz need mapping) |
| Row-Level Security (RLS) | Doesn't exist in SQL Server — must rebuild entire auth layer |
| Supabase JS client | Every API call uses `@supabase/supabase-js` — ALL need rewriting |
| **Estimated:** | **15-20 hours agent work** for scripts + testing |

### Application Migration: Vercel → IIS
| App | Complexity |
|-----|------------|
| CrediCLICK (React SPA) | Easier — just static files on IIS |
| CLK Agentes (Next.js) | Painful — Node.js on IIS via iisnode or reverse proxy |
| BI Dashboard (Next.js) | Same as above |
| Cargue de Pólizas (Next.js) | Same as above |
| **Estimated:** | **40-60 hours human work** |

### Their New Infrastructure Costs
| Item | Monthly Cost |
|------|--------------|
| Windows Server license | ~$50-100 USD |
| SQL Server license | ~$100-200 USD |
| IIS setup + maintenance | Internal IT time |
| SSL certificates | ~$10-50 USD |
| **Total** | **$200-500 USD/month** |

**vs. Current:** ~$0 (Vercel + Supabase free tiers)

### Post-Migration Support
| Task | Estimated Hours |
|------|-----------------|
| Fix issues in first month | 10-20 |
| Hand-hold non-technical team | 10-20 |
| Data quality remediation | 5-10 |
| **Subtotal** | **20-40 hours** |

### Total Effort Required
- **Agent work:** 15-20 hours (low cost)
- **Human work:** 60-100 hours (high cost)
- **Post-migration:** 20-40 hours (inevitable)
- **TOTAL:** **95-160 hours**

---

## 5. Risk Factors (Sam's Field Intel)

1. **Non-technical team** — Hugo and Eder will need hand-holding for every "simple" config step. Every step becomes a call.

2. **Messy data** — Policy layouts, HDI spreadsheets, custom fields. Migration will surface data quality issues that consume time.

3. **Architecture mismatch** — Our stack (Supabase/Vercel) is fundamentally different from their target (Windows/IIS/SQL). This is not a "lift and shift" — it's a partial rewrite.

4. **Hidden costs for them** — Alteryx Server licensing, Power BI Report Server, Windows Server CALs, SQL Server licensing. Microsoft licensing alone could surprise them.

5. **Blame risk** — If migration causes issues, we become the scapegoat even if their infra/data was the problem.

---

## 6. Pricing Recommendation

### Option B: Enterprise SaaS (Recommended to Push)

| Component | Monthly |
|-----------|---------|
| Agent access (SAM) | $50,000 MXN |
| Infrastructure (Supabase/Vercel) | $15,000 MXN |
| Priority support SLA | $10,000 MXN |
| **Total** | **$75,000 MXN/month** |

Include: NDA, security documentation, 99.5% uptime SLA, data encryption at rest/transit.

### Option C: Migration Support (Price High to Discourage)

| Component | One-Time |
|-----------|----------|
| Architecture documentation | $25,000 MXN |
| Migration scripts + testing | $35,000 MXN |
| Human support (80 hrs × $1,500/hr) | $120,000 MXN |
| Post-migration support (1 month) | $50,000 MXN |
| **Total** | **$230,000 MXN** |

**Scope exclusions:** 
- Microsoft licensing (their responsibility)
- Data quality remediation beyond basic mapping
- Ongoing support after 30 days
- Performance tuning

---

## 7. The Counter-Argument for Javier

**Key talking point for Johan:** The migration Javier wants would actually HURT Click Seguros:

### Cost Comparison
| Factor | Current (Vercel/Supabase) | After Migration (Windows/IIS/SQL) |
|--------|---------------------------|-----------------------------------|
| Monthly infra cost | ~$0 | $200-500 USD |
| Scalability | Auto-scales globally | Limited to their server capacity |
| Uptime | 99.99% (Vercel SLA) | Depends on their IT team |
| Security updates | Automatic | Manual patches required |
| Backups | Automatic daily | Must configure themselves |
| CDN/Performance | Global edge network | Single server location |

### Security Comparison (Sam's Analysis)
**The irony:** Moving to Windows/SQL Server in-house is almost certainly LESS secure than the current cloud stack.

| Security Concern | Our Stack (Supabase/Vercel) | Windows/SQL Server On-Prem |
|------------------|------------------------------|----------------------------|
| Data encryption at rest | ✅ AES-256 (Supabase default) | ⚠️ Depends on their setup |
| Encryption in transit | ✅ TLS/SSL auto (Vercel) | ⚠️ They need to configure |
| DDoS protection | ✅ Cloudflare via Vercel | ❌ They need to buy it |
| Backups | ✅ Daily automatic (Supabase) | ⚠️ They need to set up |
| SOC 2 compliance | ✅ Supabase is SOC 2 Type II | ⚠️ Depends on their hosting |
| Uptime SLA | ✅ 99.9% (Vercel + Supabase) | ⚠️ Depends on their IT |
| Auth/access control | ✅ Row Level Security, JWT | ❌ They build from scratch |
| Patch management | ✅ Automatic (managed services) | ❌ Manual — Hugo's job |

**Key message for Javier:** "Control" doesn't mean "more secure." Our managed cloud infrastructure has enterprise-grade security certifications that would cost them tens of thousands to replicate in-house.

**Javier wants "control" — but what he'd actually get is:**
- Higher costs
- More maintenance burden
- Slower performance
- Security responsibility
- No free scaling

**Recommendation:** Educate Javier that "control" isn't always better. The modern stack is superior. If compliance requires on-prem, that's different — but "control preference" alone doesn't justify this.

---

## 8. Strategic Recommendation

### Option A: Educate & Retain (Best Outcome)
Present the comparison table above. Show Javier that migration hurts him. Keep them on enterprise SaaS.

### If They Accept Enterprise SaaS ($75K/month)
✅ **Take it.** 2x revenue, we keep control, predictable income.

### If They Insist on Migration
Quote $230K MXN one-time. If they accept:
- Bill 50% upfront before any work
- Define strict scope in writing
- Cap support hours explicitly
- Make clear their team handles infra access

### If They Balk at Both Prices
**Let them walk.** They're high-maintenance, price-sensitive, and new clients are reportedly easier. Losing them at these rates is not a disaster.

---

## 9. Deliverables for Eder (What Johan Promised)

Johan agreed to send:
1. ✅ **Cost document** (this report provides the data)
2. ✅ **Security/compliance info** (need to prepare separately)
3. ✅ **NDA template** (standard VULKN NDA)
4. ✅ **Access level options** (define tiers)

**Recipients:** Eder Gomez, CC Javier Mitrani, Hugo Juárez

---

## Appendix: Meeting Transcript Summary

- **Date:** March 12, 2026
- **Attendees:** Johan Rios (VULKN), Eder Gomez (CLK)
- **Duration:** ~4 minutes
- **Key Quote:** "Esperamos lograr un segundo negocio, uno más grande, más estable y fructífero para ambos."

---

*Report generated by Sybil with technical input from Sam. Confidential — do not share with client.*
