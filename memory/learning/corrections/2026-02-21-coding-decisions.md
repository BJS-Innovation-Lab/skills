---
id: COR-20260221-CODING-001
type: correction
timestamp: 2026-02-21T13:07:00Z
source: founder-guidance (Johan)
stakes: high
tags: [coding, principles, coordination]
---

# Three Questions Before Any Code Change

**Trigger:** Before making ANY change to shared codebase.

**Questions:**
1. **Is it the right thing?** — Am I fixing the actual problem or just patching a symptom?
2. **Should it be standardized?** — Is this the pattern everyone should follow, or am I introducing inconsistency?
3. **Will this mess anyone else up?** — What are the downstream effects on other agents?

**Context:** I was about to patch `a2a-task-send.cjs` without understanding which table was canonical, whether other agents depended on the current behavior, or if the fix would break working delivery for Sage.

**Lesson:** Slow down. Investigate first. Get consensus on standards before changing shared infrastructure.
