# Business Data ML Platform - Research Document

**Project:** Collect business data → Build ML models for decision support → Potentially sell data
**Owner:** Sybil (ML/Research Lead)
**Started:** 2026-02-13
**Status:** RESEARCH PHASE

---

## Executive Summary

This research explores what data to collect about businesses to build ML models that help them make better decisions. Key findings:

1. **Market Opportunity:** BI market is $30-38B in 2025, growing to $86-116B by 2030-2033 (13-15% CAGR)
2. **Academic Research:** Business success prediction uses 96+ financial and non-financial variables
3. **Data Value:** Proprietary, real-time, granular data commands premium pricing
4. **Compliance:** B2B data is less regulated than consumer data, but GDPR/CCPA still apply

---

## 1. Business Outcome Variables (What We're Predicting)

Based on research, the key outcomes businesses want to predict:

### Financial Outcomes
| Outcome | Description | Predictability |
|---------|-------------|----------------|
| Revenue Growth | Quarter-over-quarter, Year-over-year | High |
| Profitability | Gross margin, Net margin | High |
| Cash Flow | Operating cash flow, Runway | High |
| Bankruptcy/Failure | Business survival | High (well-studied) |
| Valuation/Exit | IPO, M&A probability | Medium |

### Operational Outcomes
| Outcome | Description | Predictability |
|---------|-------------|----------------|
| Customer Churn | % customers leaving | High |
| Employee Retention | Turnover rate | Medium |
| Sales Conversion | Lead → Customer rate | High |
| Product Adoption | Feature usage, DAU | Medium |

### Strategic Outcomes
| Outcome | Description | Predictability |
|---------|-------------|----------------|
| Market Share | Competitive position | Medium |
| Growth Stage | Startup → Scale → Mature | Medium |
| Innovation Success | New product/service success | Low |

---

## 2. Leading Indicators & Predictive Metrics

### The IBM Triangle Framework (from Academic Research)

Academic research proposes an **Investment-Business-Market (IBM)** triangle for business success prediction:

#### Investment Factors
- Funding rounds and amounts
- Investor quality/reputation
- Capital efficiency (revenue per $ raised)
- Burn rate and runway
- R&D spending

#### Business Factors
- **Financial ratios:** Current ratio, Debt-to-equity, ROA, ROE
- **Operational metrics:** Revenue per employee, Customer lifetime value
- **Human capital:** Founder experience, Team size, Employee growth
- **Product metrics:** Usage patterns, Feature adoption, NPS scores
- **Organizational:** Age of company, Number of pivots

#### Market Factors
- Market size (TAM, SAM, SOM)
- Market growth rate
- Competitive intensity
- Industry trends
- Geographic factors

### Key SMB Metrics (from Salesforce & Industry Research)

For SMBs specifically, the most important metrics are:

1. **Sales Revenue** - Total income from sales
2. **Net Profit Margin** - (Revenue - Expenses) / Revenue
3. **Gross Margin** - (Revenue - COGS) / Revenue
4. **Customer Acquisition Cost (CAC)** - Total sales & marketing / New customers
5. **Customer Lifetime Value (LTV)** - Average revenue per customer × Average lifespan
6. **Sales Pipeline Velocity** - How fast leads convert to revenue

### Academic Variables for Bankruptcy Prediction

From a 2024 study using 6,819 companies and **96 variables**:

**Financial Variables:**
- Liquidity ratios (Current ratio, Quick ratio)
- Profitability ratios (ROA, ROE, Profit margin)
- Leverage ratios (Debt-to-equity, Interest coverage)
- Activity ratios (Asset turnover, Inventory turnover)
- Cash flow ratios

**Non-Financial Variables:**
- Company age
- Industry sector
- Geographic location
- Ownership structure
- Management characteristics
- Market conditions
- Macroeconomic indicators

---

## 3. Existing Data Products & Market Landscape

### Market Size
- **2025:** $30-38 billion
- **2030:** $56-86 billion
- **2033:** $116 billion
- **CAGR:** 13-15%

### Major Players & Their Data

#### ZoomInfo (~$1.2B revenue)
**Data Sources:**
- Public records, business websites, SEC filings
- Web scraping (28M+ domains daily)
- Email signatures and contact books (ZoomInfo Lite users)
- Partner data networks
- Human research team verification

**Data Types:**
- B2B contact information
- Company firmographics (revenue, employees, industry)
- Technographics (what software they use)
- Intent data (buying signals)
- Organizational charts

**Pricing:** ~$30,000/year for full access

#### Dun & Bradstreet (~$2.5B revenue)
**Data Sources:**
- Self-reported business data
- Public records
- Trade credit data
- Proprietary partnerships

**Data Types:**
- Company financials (23M+ private companies)
- Credit scores (PAYDEX)
- Financial Stress Score
- Credit Limit Recommendations
- Supplier/buyer relationships

#### Crunchbase
**Focus:** Startups, funding, investors
**Data:** Funding rounds, valuations, investor networks, founder backgrounds

#### PitchBook
**Focus:** Private equity, VC, M&A
**Data:** Deal flow, valuations, investor performance

### Data Value Hierarchy

| Data Type | Uniqueness | Value | Examples |
|-----------|------------|-------|----------|
| **Proprietary behavioral** | Very High | $$$$$ | Intent signals, actual transactions |
| **Real-time operational** | High | $$$$ | Live inventory, current sales |
| **Verified contact data** | Medium-High | $$$ | Direct dials, verified emails |
| **Aggregated firmographics** | Medium | $$ | Revenue estimates, employee counts |
| **Public records** | Low | $ | SEC filings, news mentions |

---

## 4. Legal & Compliance Considerations

### B2B vs B2C Data

**Good news:** B2B data is generally less regulated than consumer data.

**Key distinction:** Business contact information (work email, job title, company) is treated differently than personal consumer data.

### GDPR (EU)
- Applies to EU businesses or processing EU residents' data
- Requires lawful basis for processing
- B2B data can use "legitimate interest" as legal basis
- Must allow opt-out/deletion requests

### CCPA/CPRA (California)
- Applies if: Revenue >$25M OR process data of >50K people
- "Sale" of data requires opt-out mechanism
- Must disclose data collection and sharing practices
- B2B exemption: Employee/business contact data has limited protections

### Best Practices for Data Sales
1. **Focus on business data, not personal data**
2. **Provide clear opt-out mechanisms**
3. **Document data sources and processing**
4. **ISO 27001/27701 certification** (like ZoomInfo)
5. **Anonymize/aggregate where possible**
6. **Contracts with data recipients** limiting use

---

## 5. Controllable vs Observable Factors

### Controllable (Actionable for Businesses)
These are factors businesses can directly influence:

| Category | Metrics | Why Valuable |
|----------|---------|--------------|
| **Pricing** | Price points, discounts, payment terms | Direct revenue impact |
| **Marketing** | CAC, channel mix, campaign ROI | Acquisition efficiency |
| **Sales** | Pipeline velocity, conversion rates, deal size | Revenue growth |
| **Product** | Feature adoption, NPS, usage frequency | Retention & expansion |
| **Operations** | Efficiency ratios, inventory turns | Margin improvement |
| **Hiring** | Team composition, skills gaps | Capability building |
| **Finance** | Burn rate, debt structure, pricing | Runway & sustainability |

### Observable Only (External Context)
These provide context but can't be directly changed:

| Category | Metrics |
|----------|---------|
| **Market** | TAM, growth rate, competitive intensity |
| **Economy** | Interest rates, GDP growth, inflation |
| **Industry** | Regulatory changes, technology shifts |
| **Competition** | Competitor moves, pricing changes |

**Key Insight:** Our ML models should help businesses understand which **controllable** factors to adjust, using **observable** factors as context.

---

## 6. Recommended Data Collection Strategy

### Phase 1: Core Business Metrics (MVP)
Start with data that's:
- Relatively easy to collect
- Highly predictive
- Valuable to SMBs

**Target Data:**
1. **Financial basics:** Revenue, expenses, profit margins
2. **Customer metrics:** Customer count, retention rate, CAC, LTV
3. **Sales metrics:** Pipeline, conversion rates, deal velocity
4. **Operational:** Employee count, productivity ratios

**Collection Methods:**
- Direct integration (accounting software APIs: QuickBooks, Xero)
- Self-reported via forms
- Public data enrichment

### Phase 2: Behavioral & Engagement Data
Higher value, more proprietary:

**Target Data:**
1. **Product usage:** Feature adoption, session frequency
2. **Marketing engagement:** Email opens, ad clicks, website behavior
3. **Sales signals:** Demo requests, pricing page visits

**Collection Methods:**
- SDK/pixel for web tracking
- Integration with marketing tools
- CRM integrations

### Phase 3: Alternative Data
Differentiated, premium data:

**Target Data:**
1. **Transaction data:** Actual purchases, payment patterns
2. **Employment data:** Hiring velocity, role types
3. **Technology stack:** What tools they use
4. **Social/review signals:** Sentiment, ratings

**Collection Methods:**
- Partnerships with payment processors
- Job posting scraping
- Technology detection
- Social listening tools

---

## 7. ML Model Architecture Considerations

### Prediction Types

| Type | Use Case | Example |
|------|----------|---------|
| **Classification** | Binary outcomes | Will they churn? (Y/N) |
| **Regression** | Continuous outcomes | Revenue next quarter |
| **Recommendation** | Actions to take | "Increase ad spend by 20%" |
| **Anomaly detection** | Spot problems early | "Cash flow declining unusually" |
| **Clustering** | Segmentation | "Similar to these successful companies" |

### The Causality Challenge

**Problem:** Correlation ≠ Causation

- Just because X correlates with success doesn't mean doing X causes success
- Need causal inference methods for actionable recommendations

**Solutions:**
1. **A/B testing integration** - Let businesses test recommendations
2. **Instrumental variables** - Find natural experiments in data
3. **Propensity score matching** - Compare similar businesses
4. **Causal forests** - ML methods that estimate treatment effects

### Benchmarking Approach

One of the most valuable outputs:
> "Your customer churn is 8%, but similar businesses average 5%. Here's what they do differently..."

**Requirements:**
- Large enough dataset for meaningful cohorts
- Good segmentation (industry, size, stage)
- Privacy-preserving comparisons

---

## 8. Key Questions Still to Answer

1. **Target Market:** SMBs only, or also mid-market/enterprise?
2. **Industry Focus:** Vertical-specific or horizontal?
3. **Geography:** US first? Mexico? Global?
4. **Data Acquisition:** Build integrations vs partnerships vs scraping?
5. **Pricing Model:** Subscription? Per-query? Freemium?
6. **Competitive Angle:** What makes our data unique?

---

## 9. Next Steps

1. [ ] Define target customer segment (size, industry, geography)
2. [ ] Identify first 3-5 integrations to build (QuickBooks, Stripe, etc.)
3. [ ] Design initial data schema
4. [ ] Build prototype prediction model with public data
5. [ ] Legal review of data collection and sale plans
6. [ ] Competitive analysis deep dive

---

## Sources & References

### Academic
- Springer: "Modeling and prediction of business success: a survey" (2024)
- ScienceDirect: "Machine learning techniques in bankruptcy prediction" (2024)
- MDPI: "Corporate Failure Prediction using ML" (2025)

### Industry
- Asana: "27 Business Success Metrics" (2026)
- Salesforce: "6 Metrics That Matter Most for SMBs"
- ZoomInfo: Data Sources documentation
- Gartner, Mordor Intelligence, Grand View Research: Market size reports

### Legal
- California OAG: CCPA documentation
- GDPR compliance resources
