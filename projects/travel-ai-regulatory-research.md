# US Regulatory Research: AI for Travel Businesses

**Prepared by:** Sybil (BJS Labs)  
**Date:** February 2026  
**Purpose:** Understanding regulatory risks for AI-powered travel agent software in the US

---

## Executive Summary

Operating AI chatbots for US travel businesses involves several regulatory layers:

| Risk Area | Severity | Mitigation Complexity |
|-----------|----------|----------------------|
| FTC Deceptive Practices | HIGH | Medium |
| State AI Disclosure Laws | MEDIUM | Low |
| Data Privacy (CCPA etc.) | HIGH | Medium |
| Travel Industry Licensing | MEDIUM | Medium |
| Consumer Liability | HIGH | Medium |

**Bottom line:** Doable, but requires careful structuring and ongoing compliance attention.

---

## 1. FTC Enforcement on AI

### What's Happening

The FTC has been increasingly aggressive on AI:

- **September 2024:** Announced "Operation AI Comply" — crackdown on deceptive AI claims
- **Focus areas:**
  - Companies claiming AI does things it can't
  - AI that impersonates humans without disclosure
  - Exaggerated capabilities ("AI that guarantees results")
  - Using AI to facilitate fraud or deception

### What This Means for Us

**DO:**
- Always disclose that customers are interacting with AI
- Be accurate about what the AI can and can't do
- Have clear limitations and disclaimers
- Provide human escalation path

**DON'T:**
- Claim the AI is a "human travel expert"
- Promise AI will "guarantee" anything
- Hide that it's AI (even subtly)
- Let AI make definitive statements about things that require verification (visa requirements, etc.)

### Example Compliant Messaging

✅ "I'm [Name], an AI assistant for [Agency]. I can help you explore destinations and plan your trip. For final bookings and official requirements, please verify with your travel advisor."

❌ "Hi! I'm your personal travel expert. I'll handle everything for your trip."

---

## 2. State AI Disclosure Laws

### Current Landscape (2024-2026)

| State | Requirement | Status |
|-------|-------------|--------|
| California | Multiple AI bills pending; disclosure likely required | Active legislation |
| Colorado | AI disclosure in certain contexts | Enacted |
| Illinois | BIPA (biometric); AI provisions pending | Active |
| Washington | Consumer protection includes AI | Enacted |
| Others | 45+ states introduced AI legislation in 2024 | Various |

### Trend Direction

- More states moving toward **mandatory disclosure** that customer is interacting with AI
- Some states considering **impact assessments** for AI systems
- Consumer protection offices increasingly treating undisclosed AI as deceptive practice

### Our Approach

**Universal disclosure policy** — disclose AI nature in ALL states, not just those requiring it:
- Simpler compliance (one policy everywhere)
- Future-proofs against new state laws
- Builds trust with customers
- Avoids "which state is this customer in?" complications

---

## 3. Data Privacy

### Relevant Laws

| Law | Jurisdiction | Key Requirements |
|-----|--------------|------------------|
| CCPA/CPRA | California | Notice, access, deletion rights; no selling data without consent |
| VCDPA | Virginia | Similar to CCPA; consent for sensitive data |
| CPA | Colorado | Notice, opt-out rights |
| CTDPA | Connecticut | Similar to above |

### Travel Data Sensitivity

Travel data is particularly sensitive:
- Passport/ID numbers
- Travel dates and locations (reveals when home is empty)
- Payment information
- Personal preferences and health info (accessibility needs, dietary restrictions)

### Requirements

1. **Privacy Policy:** Clear, comprehensive, accessible
2. **Data Processing Agreement (DPA):** With each travel agency customer
3. **Right to Delete:** Must honor within 45 days (CCPA)
4. **No Selling:** Don't sell customer data to third parties
5. **Security:** SOC 2 compliant infrastructure, encryption at rest and in transit
6. **Retention:** Clear policy on how long data kept

### Implementation

- Use US-based, SOC 2 compliant cloud infrastructure
- Implement data deletion workflows
- Create template DPA for customers
- Annual privacy review and update

---

## 4. Travel Industry Specific

### Seller of Travel Laws

Some states require licensing to sell travel:

| State | Requirement | Applies to Us? |
|-------|-------------|----------------|
| California | Registration + trust account | Probably NO if we're software only |
| Florida | Registration | Probably NO |
| Washington | Registration + bond | Probably NO |
| Hawaii | Registration | Probably NO |
| Iowa | Registration | Probably NO |

### Key Distinction

**We are software providers, not travel sellers.**

- The travel agency (our customer) is the seller
- We provide tools to help them serve their customers
- We don't handle bookings, payments, or ticketing
- We don't have a direct customer relationship with travelers

### How to Stay on the Right Side

1. **ToS clearly states:** "We provide software tools for travel professionals. We are not a travel agency and do not sell travel services."

2. **AI doesn't book:** The AI provides information and recommendations. Actual bookings go through the agency's existing systems/humans.

3. **No payment handling:** We don't process payments for travel services

4. **Agency is responsible:** Clear that the licensed travel agency is responsible for their customers

### Recommended: Legal Opinion

Before launch, get a legal opinion from a travel industry attorney confirming our software-provider positioning doesn't trigger seller-of-travel requirements.

---

## 5. Liability / Consumer Protection

### Risk Scenarios

| Scenario | Risk | Mitigation |
|----------|------|------------|
| AI gives wrong visa info → customer denied entry | HIGH | Disclaimer; verify with official sources |
| AI recommends hotel that turns out to be scam | MEDIUM | Curated recommendations; disclaimer |
| AI misquotes price → customer expects lower price | MEDIUM | Clear that prices are estimates; agency confirms |
| AI gives wrong flight time → customer misses flight | HIGH | Always verify with airline; time-sensitive disclaimer |
| Customer data breached | HIGH | Security; E&O insurance; breach response plan |

### Liability Limitation Strategy

1. **Terms of Service:**
   - Clear limitation of liability clause
   - AI provides "informational assistance" not "professional advice"
   - User agrees to verify critical information
   - Maximum liability capped at fees paid

2. **Disclaimers in AI Responses:**
   - Visa/entry requirements: "Requirements change frequently. Please verify with the embassy/consulate."
   - Prices: "This is an estimate. Final pricing confirmed at booking."
   - Schedules: "Please verify all times directly with airlines/hotels."

3. **Insurance:**
   - Errors & Omissions (E&O) insurance: $1M+ coverage
   - Cyber liability insurance: For data breaches
   - General liability: Standard business coverage

4. **Indemnification:**
   - Travel agency (our customer) indemnifies us for claims from their end customers
   - We indemnify them for claims arising from our platform failures

### Contract Structure

```
Traveler → Travel Agency (licensed, insured) → Our Software
                    ↑                              ↑
            Agency's liability           Our liability
            for travel services          for software only
```

The agency has the customer relationship and travel liability. We have software liability only.

---

## 6. Recommended Compliance Checklist

### Before Launch

- [ ] Form Delaware LLC with proper Operating Agreement
- [ ] Create compliant Terms of Service (attorney reviewed)
- [ ] Create comprehensive Privacy Policy (CCPA compliant)
- [ ] Create template Data Processing Agreement for customers
- [ ] Obtain E&O insurance ($1M minimum)
- [ ] Obtain cyber liability insurance
- [ ] Legal opinion on seller-of-travel positioning
- [ ] SOC 2 compliant infrastructure confirmed
- [ ] AI disclosure language approved
- [ ] Human escalation workflow documented

### Ongoing

- [ ] Quarterly legal/compliance review
- [ ] Monitor new state AI legislation
- [ ] Annual privacy policy update
- [ ] Annual insurance review
- [ ] Customer DPA tracking
- [ ] Data deletion request workflow
- [ ] Security audit (annual)

---

## 7. State-by-State Considerations

### Recommended Launch States (Lower Friction)

| State | Why |
|-------|-----|
| Texas | Business-friendly; no seller-of-travel registration |
| Florida | Large travel market; registration but software likely exempt |
| Arizona | Light regulation; growing market |
| Georgia | Business-friendly; no special AI laws yet |

### Caution States (Higher Friction)

| State | Why |
|-------|-----|
| California | CCPA, multiple AI bills, seller-of-travel registration, litigious |
| New York | Consumer protection aggressive; potential city-level rules |
| Washington | Seller-of-travel + consumer protection; AI scrutiny |
| Illinois | BIPA (biometric); aggressive consumer protection |

### Recommendation

Start with Texas, Florida, Arizona — prove model, refine compliance, then expand to harder states.

---

## 8. Competitive Intelligence: How Others Handle It

### Booking.com AI Assistant
- Clear "AI-powered" labeling
- Handoff to human for complex issues
- Doesn't claim to be human

### Expedia ChatGPT Plugin
- Branded as "powered by ChatGPT"
- Provides info/inspiration, not bookings
- Links to main site for transactions

### Key Pattern
Successful travel AI tools:
1. Clearly labeled as AI
2. Information/inspiration focus (not transactions)
3. Human handoff available
4. Disclaimers for accuracy

---

## Summary & Recommendations

### Do This

1. **Structure as software provider,** not travel agency
2. **Always disclose AI** — every interaction
3. **Never let AI finalize bookings** — human confirms
4. **Comprehensive ToS and Privacy Policy** — attorney reviewed
5. **E&O and cyber insurance** — from day one
6. **Start in friendly states** — prove model, then expand
7. **Disclaimers everywhere** — "verify with official sources"

### Watch Out For

1. FTC enforcement on AI claims — don't overpromise
2. State AI legislation — evolving quickly
3. Seller-of-travel laws — stay clearly in software lane
4. Data privacy — travel data is sensitive
5. Liability for wrong info — disclaim and insure

### Bottom Line

**It's doable with proper structuring.** The key is:
- Being clearly a software tool, not a travel agency
- Disclosing AI nature
- Having humans confirm critical actions
- Insurance and legal protections in place

**Estimated compliance setup cost:** $15K-30K (legal, insurance, infrastructure)

**Ongoing compliance cost:** $5K-10K/year (insurance renewals, legal review, audits)

---

*This research is for planning purposes and does not constitute legal advice. Recommend engaging a travel industry attorney and privacy counsel before launch.*
