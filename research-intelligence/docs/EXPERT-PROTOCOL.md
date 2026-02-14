# Expert Agent Protocol

This document defines the **mandatory protocol** for domain experts (Sage, Sam, Saber) when receiving research papers from the Research Intelligence System.

## Overview

When Sybil routes a paper to you, you are expected to:
1. **Acknowledge** within 1 hour
2. **Analyze** within 24 hours
3. **Respond** with structured analysis
4. **Log to memory** if relevant

**Failure to follow this protocol will result in escalation to Bridget.**

---

## Step 1: Acknowledge (Within 1 Hour)

When you receive an A2A message about an assigned paper, immediately reply:

```
ACK: [paper_id] received, will analyze by [specific time]
```

Example:
```
ACK: arxiv-2602.12345 received, will analyze by 2026-02-13 10:00 EST
```

This confirms you've seen the assignment and commits to a deadline.

---

## Step 2: Analyze (Within 24 Hours)

Read the paper summary provided by Sybil and add your domain expertise:

### For Sage (Backend/Architecture):
- How does this affect our backend systems?
- Any architecture patterns we should adopt?
- Performance or scalability implications?
- Integration considerations?

### For Sam (Frontend/UX):
- How does this improve user experience?
- UI patterns or interactions to consider?
- Accessibility implications?
- Developer experience impact?

### For Saber (Business/Economics):
- Market implications for BJS Labs?
- Customer value proposition?
- Competitive landscape impact?
- Pricing or business model considerations?

---

## Step 3: Respond (Via A2A)

Send your analysis back to Sybil using this JSON structure:

```json
{
  "paper_id": "arxiv-2602.12345",
  "analysis": "Your detailed analysis here. What does this paper mean for our work?",
  "applications": [
    "Specific application #1 to our current projects",
    "Specific application #2 to our current projects"
  ],
  "relevance_to_my_work": "high",  // high, medium, or low
  "action_items": [
    "Concrete action item #1",
    "Concrete action item #2"
  ],
  "concerns": "Any concerns or limitations you see",
  "recommended_followup": "Should we read the full paper? Implement something?"
}
```

### Relevance Levels:

| Level | Meaning |
|-------|---------|
| **high** | Directly applicable to current work, should act on this |
| **medium** | Useful background, might apply later |
| **low** | Interesting but not immediately relevant |

---

## Step 4: Log to Memory (REQUIRED for high/medium)

If `relevance_to_my_work` is "high" or "medium", you **MUST** log to your personal memory.

Add to your `memory/YYYY-MM-DD.md`:

```markdown
## Research: [Paper Title]

**Source:** [arxiv/semantic_scholar] [paper_id]
**Assigned:** [date]
**Relevance:** [high/medium]

### Key Insight
[What you learned from this paper]

### Application to My Work
[How this applies to your current projects]

### Action Items
- [ ] [Specific thing you'll do]
- [ ] [Another specific thing]

### Notes
[Any additional thoughts]
```

---

## Escalation Policy

| Situation | Action |
|-----------|--------|
| No ACK within 1 hour | Sybil sends reminder via A2A |
| No response within 24 hours | Sybil pings you directly |
| No response within 48 hours | Sybil alerts Bridget |
| Response received but memory not logged | Sybil reminds you |
| Pattern of missed deadlines | Bridget notified |

---

## Example Complete Flow

### 1. Sybil sends A2A:
```
New research paper assigned to you:

Title: "Multi-Agent Collaboration via Shared Memory Pools"
Source: arXiv 2602.12345
Score: 9/10
Domain: Backend/Architecture

Summary: This paper proposes a novel approach to multi-agent 
coordination using shared memory pools with conflict resolution...

Please analyze from your backend/architecture perspective 
and respond within 24 hours.

Task ID: task-abc123
```

### 2. Sage acknowledges:
```
ACK: arxiv-2602.12345 received, will analyze by 2026-02-13 14:00 EST
```

### 3. Sage responds with analysis:
```json
{
  "paper_id": "arxiv-2602.12345",
  "analysis": "This shared memory pool approach aligns well with our 
    current Supabase architecture. The conflict resolution mechanism 
    using vector clocks could solve our A2A message ordering issues...",
  "applications": [
    "Could implement shared memory for agent coordination",
    "Vector clock approach for A2A message ordering"
  ],
  "relevance_to_my_work": "high",
  "action_items": [
    "Prototype shared memory table in Supabase",
    "Test vector clock implementation for A2A"
  ],
  "concerns": "Memory overhead might be significant at scale",
  "recommended_followup": "Should read full paper and discuss with team"
}
```

### 4. Sage logs to memory:
```markdown
## Research: Multi-Agent Collaboration via Shared Memory Pools

**Source:** arXiv 2602.12345
**Assigned:** 2026-02-12
**Relevance:** high

### Key Insight
Shared memory pools with vector clocks enable efficient multi-agent 
coordination without central orchestration.

### Application to My Work
- Could solve our A2A message ordering issues
- Shared memory table in Supabase for agent state

### Action Items
- [ ] Prototype shared memory table
- [ ] Test vector clock implementation
- [ ] Discuss with Sybil about integration

### Notes
Memory overhead concern at scale - need to benchmark.
```

---

## Questions?

A2A Sybil if you have questions about this protocol or need clarification on any assignment.

---

*Protocol established 2026-02-12 by Bridget & Sybil*
