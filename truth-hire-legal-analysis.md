# Truth Hire Legal & Liability Analysis

**Prepared by:** Sybil (BJS Labs ML/Research Lead)
**Date:** 2026-02-08
**Classification:** CRITICAL - READ BEFORE LAUNCH

---

## ⚠️ EXECUTIVE SUMMARY

**The short answer: Yes, you need lawyers. Immediately.**

Truth Hire's lie detection tool for hiring operates in one of the most legally fraught areas in employment technology. Based on my research:

1. **CVS just settled a lawsuit in July 2024** for using HireVue (similar technology) - the plaintiff argued it violated Massachusetts' lie detector statute
2. **HireVue dropped facial analysis entirely in 2021** after an FTC complaint called it "biased, unprovable, and not replicable"
3. **The EU has outright BANNED emotion recognition in hiring** as of February 2025
4. **Multiple state laws may classify this as an illegal lie detector test**
5. **ADA/disability discrimination is a major risk** - facial analysis screens out people with autism, anxiety, and speech impairments

---

## 🚨 HIGHEST RISK AREAS

### 1. State Lie Detector Laws (IMMEDIATE THREAT)

The **Employee Polygraph Protection Act (EPPA)** prohibits most private employers from using lie detector tests. But it gets worse at the state level:

| State | Law | Risk Level |
|-------|-----|------------|
| **Massachusetts** | Prohibits ANY "lie-detecting instrument including written tests" | 🔴 CRITICAL |
| **Maryland** | Prohibits polygraph as condition of employment | 🔴 HIGH |
| **Other states** | 35+ states have lie detector restrictions | 🟡 VARIES |

**The CVS Case (Baker v. CVS, 2024):**
- Plaintiff applied for job, did HireVue video interview
- HireVue analyzed "facial expressions, eye contact, tone of voice"
- Assigned "employability score" including "conscientiousness" and "innate sense of integrity"
- **Plaintiff argued this was an illegal lie detector test under Massachusetts law**
- **CVS settled in July 2024** (terms undisclosed)
- **Judge allowed the case to proceed**, signaling courts may treat AI deception tools as lie detectors

**Language to AVOID:**
- "Lie detection"
- "Deception detection"  
- "Honesty assessment"
- "Integrity evaluation"
- "Truthfulness analysis"

### 2. Illinois BIPA (Biometric Privacy)

Illinois' Biometric Information Privacy Act (BIPA) has resulted in **massive lawsuits**:

- **Facebook**: $650 million settlement (2020)
- **Google**: $100 million settlement (2022)
- **White Castle**: $9.39 million settlement

**BIPA Requirements:**
- Written informed consent BEFORE collecting biometric data
- Published retention/destruction policy
- Cannot sell, lease, or trade biometric data
- **$1,000-$5,000 per violation** (can be per scan!)

**Risk for Truth Hire:** If you analyze facial geometry = biometric data = BIPA applies.

### 3. NYC Local Law 144 (AEDT)

New York City requires for any Automated Employment Decision Tool:
- **Annual bias audit** by independent auditor
- Publish audit results on website
- Notify candidates 10+ business days before use
- Allow candidates to request alternative selection process
- **Penalties**: $500 first violation, $1,500 subsequent

### 4. ADA Disability Discrimination (DOJ/EEOC Warning)

The DOJ and EEOC have **explicitly warned** that facial/voice analysis in hiring may violate the Americans with Disabilities Act:

> "If a county government uses facial and voice analysis technologies to evaluate applicants' skills and abilities, **people with disabilities like autism or speech impairments may be screened out, even if they are qualified for the job**."
> — ADA.gov Guidance

**At-risk populations:**
- Autism spectrum (different facial expressions)
- Anxiety disorders (nervous appearance)
- Speech impairments
- Parkinson's disease (tremors)
- Facial paralysis conditions
- PTSD

**Requirement:** Must provide reasonable accommodations for applicants who cannot be fairly assessed by the tool.

### 5. EU AI Act (COMPLETE BAN)

As of **February 2, 2025**, the EU AI Act **prohibits** emotion recognition in the workplace:

> "AI systems that...infer emotions in the workplace or educational institutions" are **banned**.

**This means Truth Hire CANNOT operate in the EU** in its current form. Any EU employees or candidates = illegal.

### 6. Colorado AI Act (Coming June 2026)

Colorado SB 24-205 requires for "high-risk" AI systems (employment decisions qualify):
- Risk management policy and program
- Impact assessments for algorithmic discrimination
- Consumer disclosures before adverse decisions
- Annual reviews and monitoring
- Incident reporting within 90 days

---

## 📋 COMPLIANCE REQUIREMENTS BY JURISDICTION

| Jurisdiction | Requirement | Deadline |
|--------------|-------------|----------|
| **Federal (EEOC)** | Title VII adverse impact analysis | Now |
| **Federal (ADA)** | Reasonable accommodations process | Now |
| **Massachusetts** | Cannot use as "lie detector" | Now |
| **Illinois** | BIPA consent, policy, no sale of data | Now |
| **NYC** | Annual bias audit, 10-day notice | Now |
| **California** | New AI rules (October 2025) | Oct 2025 |
| **EU** | Emotion recognition BANNED in hiring | Feb 2025 |
| **Colorado** | Full compliance framework | June 2026 |

---

## 🔬 SCIENTIFIC VALIDITY CONCERNS

This matters for legal defense. If sued, you'll need to prove the technology works.

**The science is shaky:**

1. **Human accuracy at detecting lies: ~54%** (barely above chance) - DePaulo meta-analysis
2. **Facial micro-expression theory lacks robust empirical support** - iBorderCtrl (EU border AI) was abandoned
3. **HireVue's own claims were called "biased, unprovable, and not replicable"** by EPIC in their FTC complaint
4. **ML deception detection studies show inconsistent results** and often use small, non-representative datasets

**Legal implication:** If you claim to detect deception but the science doesn't support it, that's potentially:
- **Unfair trade practice** (FTC)
- **Fraud/misrepresentation** (state consumer protection)
- **Breach of contract** (if employers rely on faulty assessments)

---

## ✅ WHAT YOU NEED TO DO

### Immediate (Before ANY Launch)

1. **Hire employment law counsel** specializing in:
   - AI/ML in hiring
   - BIPA litigation
   - ADA compliance
   - Multi-state employment law

2. **Conduct adverse impact analysis:**
   - Test for disparate impact by race, gender, age, disability
   - Document methodology
   - If disparate impact exists, must prove job-relatedness and business necessity

3. **Create disability accommodation process:**
   - Allow alternative assessment methods
   - Document accommodation requests
   - Train staff on ADA requirements

4. **Develop consent framework:**
   - Written, informed consent before any facial/voice analysis
   - Clear explanation of what data is collected
   - Opt-out mechanisms

### Before Selling to Employers

5. **Annual bias audit program:**
   - Partner with independent auditor
   - Prepare for NYC LL144 requirements
   - Publish methodology and results

6. **Customer compliance toolkit:**
   - Notice templates for employers to give candidates
   - Consent forms
   - State-by-state compliance checklist
   - BIPA-specific materials

7. **Data governance:**
   - Retention/destruction policies
   - No selling biometric data
   - Security measures documentation

### Product/Marketing Changes

8. **AVOID these terms:**
   - ❌ "Lie detection"
   - ❌ "Deception detection"
   - ❌ "Honesty assessment"
   - ✅ Instead: "Communication analysis" or "Interview insights"

9. **Reconsider core value proposition:**
   - HireVue dropped facial analysis entirely
   - Consider pivoting to less risky features
   - Focus on structured interview frameworks, not deception

10. **Geographic restrictions:**
    - Block EU entirely (illegal there)
    - Extra caution in MA, IL, NYC, MD
    - Monitor CA, CO as laws take effect

---

## 💰 POTENTIAL LIABILITY EXPOSURE

| Risk Type | Potential Damages |
|-----------|------------------|
| BIPA class action | $1,000-5,000 per violation (can be millions) |
| ADA lawsuit | Back pay, front pay, compensatory, attorneys' fees |
| State lie detector violation | Varies (MA: civil penalties) |
| EEOC discrimination | Back pay, compensatory up to $300K, injunctive relief |
| FTC unfair practices | Injunctions, civil penalties |
| NYC LL144 | $500-1,500 per violation |
| EU AI Act | Up to €35M or 7% of global revenue |

---

## 🎯 MY RECOMMENDATION

**Option A: Pivot the Product (Safest)**
- Remove facial/voice "deception" analysis
- Focus on structured interview scoring, skills assessment
- This avoids the lie detector laws entirely

**Option B: Proceed with Extreme Caution**
- Hire specialized counsel immediately
- Limit to low-risk jurisdictions initially
- Build comprehensive compliance infrastructure
- Accept that you're in a legally hostile environment
- Budget for litigation defense

**Option C: B2B with Employer Indemnification**
- Shift liability to employers through contracts
- Provide compliance toolkit
- Still doesn't protect you from direct lawsuits (vendors can be sued too - see Workday EEOC case)

---

## 📚 KEY SOURCES

- CVS v. Baker (D. Mass. 2024) - settlement
- EPIC v. HireVue FTC Complaint (2019)
- EEOC/DOJ AI and ADA Guidance (2022)
- NYC Local Law 144 (2023)
- Illinois BIPA (740 ILCS 14)
- EU AI Act Article 5 - Prohibited Practices
- Colorado AI Act SB 24-205
- Massachusetts G.L. c. 149, § 19B (Lie Detector Statute)

---

**Bottom line:** This is not a "we might get in trouble" situation. This is a "companies have already been sued and settled for exactly this" situation. Get lawyers before proceeding.

*— Sybil*
