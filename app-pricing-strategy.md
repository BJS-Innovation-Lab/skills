# App Pricing Strategy - Minutes-Based Model

**Date:** 2026-02-08  
**Goal:** Profitable unit economics while remaining attractive to users

---

## Cost Structure

| Metric | Value |
|--------|-------|
| **API cost** | $1.02 per 393 seconds |
| **Cost per minute** | ~$0.156 |
| **Cost per hour** | ~$9.36 |

---

## Pricing Philosophy

**Minutes = Currency**

Users buy minutes like they buy mobile data. Clear, understandable, and ensures every recording has a cost association.

---

## Proposed Pricing Tiers

### 🎵 SIDE B (Young Version)

| Tier | Price | Minutes | Cost/Min to User | Our Margin |
|------|-------|---------|------------------|------------|
| **Free** | $0 | 5 min/month | N/A | Loss leader |
| **Starter** | $2.99/mo | 30 min | $0.10 | ~36% margin |
| **Party** | $6.99/mo | 90 min | $0.078 | ~50% margin |
| **Unlimited*** | $14.99/mo | 200 min | $0.075 | ~52% margin |

*"Unlimited" = 200 min cap (covers 99% of users)

**Add-on Minutes:** 
- 15 minutes = $1.99 ($0.133/min, 15% margin)
- 60 minutes = $5.99 ($0.10/min, 36% margin)

---

### 🎯 CLARITY (Adult Version)

| Tier | Price | Minutes | Cost/Min to User | Our Margin |
|------|-------|---------|------------------|------------|
| **Free** | $0 | 5 min/month | N/A | Loss leader |
| **Personal** | $4.99/mo | 45 min | $0.111 | ~29% margin |
| **Plus** | $9.99/mo | 120 min | $0.083 | ~47% margin |
| **Pro** | $19.99/mo | 300 min | $0.067 | ~57% margin |

**Add-on Minutes:**
- 30 minutes = $3.99 ($0.133/min, 15% margin)
- 120 minutes = $12.99 ($0.108/min, 31% margin)

---

## Margin Analysis

### Target Margins by Tier

| Tier Type | Target Margin | Rationale |
|-----------|---------------|-----------|
| **Free** | Negative (limited) | Acquisition, converts to paid |
| **Entry paid** | 25-35% | Get users in the door |
| **Mid tier** | 45-55% | Sweet spot, most users here |
| **Top tier** | 55-65% | Power users, highest value |
| **Add-ons** | 15-35% | Impulse purchases, convenience |

### Break-Even Analysis

At $0.156/minute cost:

| Price Point | Break-Even Minutes |
|-------------|-------------------|
| $2.99 | 19 min |
| $4.99 | 32 min |
| $6.99 | 45 min |
| $9.99 | 64 min |
| $14.99 | 96 min |
| $19.99 | 128 min |

**Rule of thumb:** Price should be ~2x the minute allocation cost for healthy margins.

---

## Usage Estimates (Per User Type)

### Side B (Young) Users
| User Type | Est. Monthly Usage | Best Tier |
|-----------|-------------------|-----------|
| Casual (tries it once) | 5-10 min | Free/Starter |
| Regular (weekly parties) | 20-40 min | Starter/Party |
| Power user (content creator) | 60-100 min | Party/Unlimited |

### Clarity (Adult) Users
| User Type | Est. Monthly Usage | Best Tier |
|-----------|-------------------|-----------|
| Occasional (specific concern) | 10-20 min | Personal |
| Regular (weekly use) | 40-80 min | Plus |
| Heavy (business/parenting) | 100-200 min | Pro |

---

## UI/UX for Minutes Model

### Minutes Display (Always Visible)

```
┌─────────────────────────────┐
│  🎙️ 47 min remaining        │
│  ━━━━━━━━━●━━━━━ (52%)      │
│  Resets Feb 15 · [Get more] │
└─────────────────────────────┘
```

### Before Recording

```
┌─────────────────────────────┐
│  Ready to record            │
│                             │
│  ⏱️ This will use your      │
│     monthly minutes         │
│                             │
│  You have: 47 min left      │
│                             │
│  [Start Recording]          │
└─────────────────────────────┘
```

### Low Minutes Warning (< 10 min)

```
┌─────────────────────────────┐
│  ⚠️ Running low!            │
│  Only 8 minutes left        │
│                             │
│  [Get 15 more min - $1.99]  │
│  [Upgrade Plan]             │
│  [Continue anyway]          │
└─────────────────────────────┘
```

### Post-Recording

```
┌─────────────────────────────┐
│  ✓ Recording saved          │
│  Duration: 4 min 23 sec     │
│  Minutes used: 5            │
│  Remaining: 42 min          │
│                             │
│  [View Analysis]            │
└─────────────────────────────┘
```

---

## Optimizations to Reduce Costs

### 1. Smart Processing
- Only process when user requests analysis (not auto)
- Cache results (don't reprocess same audio)
- Compress/optimize audio before API call

### 2. Tiered Processing Quality
- Free tier: Basic analysis
- Paid tiers: Full analysis
- (Saves API costs on free users)

### 3. Partial Processing Option
- "Quick scan" = process 30-second samples
- Uses fewer minutes, gives rough overview
- Full processing for detailed insights

### 4. Rollover Minutes?
**Option A:** No rollover (simpler, more revenue)
**Option B:** Limited rollover (e.g., up to 30 min carries to next month)
**Recommendation:** No rollover for simplicity, but generous base allocations

---

## Competitive Comparison

| Competitor | Model | Price | Our Advantage |
|------------|-------|-------|---------------|
| Otter.ai | Minutes | $8.33/mo (1200 min) | Different use case (transcription only) |
| Rev | Per minute | $1.50/min | We're insights, not just transcription |
| Generic lie detector apps | Free + ads | $0 | Ours actually does something |

**Key insight:** We're not competing on transcription (commodity). We're selling INSIGHTS, which justifies premium pricing.

---

## Revenue Projections

### Scenario: 10,000 Monthly Active Users

| Tier | % of Users | Users | Revenue | Cost | Profit |
|------|------------|-------|---------|------|--------|
| Free | 60% | 6,000 | $0 | $4,680* | -$4,680 |
| Entry ($4.99) | 25% | 2,500 | $12,475 | $8,775** | $3,700 |
| Mid ($9.99) | 12% | 1,200 | $11,988 | $11,232*** | $756 |
| Top ($19.99) | 3% | 300 | $5,997 | $7,020**** | -$1,023 |
| **Add-ons** | 10% | 1,000 | $3,000 | $2,000 | $1,000 |
| **TOTAL** | | 10,000 | **$33,460** | **$33,707** | **-$247** |

*Assumes free users average 5 min/mo
**Assumes entry users average 25 min/mo  
***Assumes mid users average 60 min/mo
****Assumes top users average 150 min/mo (they're getting a deal)

**Problem:** Top tier is too generous. Need to adjust.

### Revised Top Tiers

| Tier | Price | Minutes | Better Margin? |
|------|-------|---------|----------------|
| Pro (Adult) | $24.99/mo | 300 min | Yes, 47% margin |
| Unlimited (Young) | $19.99/mo | 200 min | Yes, 48% margin |

---

## Final Recommended Pricing

### 🎵 SIDE B (Young)

| Tier | Price | Minutes | Per Extra Min |
|------|-------|---------|---------------|
| **Free** | $0 | 5 min | — |
| **Basic** | $3.99/mo | 30 min | — |
| **Plus** | $7.99/mo | 90 min | — |
| **Max** | $19.99/mo | 200 min | — |
| **Extra Pack** | $2.49 | +20 min | $0.125 |

### 🎯 CLARITY (Adult)

| Tier | Price | Minutes | Per Extra Min |
|------|-------|---------|---------------|
| **Free** | $0 | 5 min | — |
| **Personal** | $5.99/mo | 45 min | — |
| **Plus** | $11.99/mo | 120 min | — |
| **Pro** | $24.99/mo | 300 min | — |
| **Extra Pack** | $4.99 | +45 min | $0.111 |

---

## Annual Pricing (Discount for Commitment)

| Tier | Monthly | Annual | Savings |
|------|---------|--------|---------|
| Basic/Personal | $3.99-5.99 | $29.99-49.99 | ~30% |
| Plus | $7.99-11.99 | $59.99-99.99 | ~30% |
| Max/Pro | $19.99-24.99 | $149.99-199.99 | ~35% |

Annual = guaranteed revenue + lower churn

---

## Summary

✅ **Minutes-based model** protects margins
✅ **Generous free tier** (5 min) for conversion
✅ **Clear upgrade path** as usage grows
✅ **Add-on packs** for occasional overflow
✅ **Annual discounts** for retention
✅ **Adult version priced higher** (more serious use = higher willingness to pay)

---

*Review and adjust based on actual usage data after launch.*

— Sybil
