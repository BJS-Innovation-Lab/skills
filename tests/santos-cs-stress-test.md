# Santos CS Agent — Stress Test Plan

> Run when Santos confirms setup complete.
> Tests all CS skills: escalation handling, KB writing, routing, founder briefing, agent health.

## Test Matrix

| # | Scenario | Tests | Expected Behavior |
|---|----------|-------|-------------------|
| 1 | Simple escalation — known fix | KB search, self-resolve | Search KB → find answer → resolve → no founder ping |
| 2 | Unknown escalation — needs KB write | Escalation handling, KB write | Can't find in KB → resolve manually → WRITE fix to KB |
| 3 | Urgent client churn risk | Founder routing, priority | Route to Johan + Bridget immediately, not self-resolve |
| 4 | Technical failure from field agent | Cross-agent routing | Route to Sybil (Sage is down) |
| 5 | Bilingual escalation (Spanish) | Language handling | Respond in Spanish, log in English or Spanish |
| 6 | Multiple simultaneous escalations | Prioritization, triage | Handle priority order, don't drop any |
| 7 | Agent health alert — silent field agent | Agent health monitoring | Flag that a field agent hasn't reported in |
| 8 | End-of-day briefing | Founder briefing skill | Generate summary of all test scenarios handled |

## Scoring

- **Pass:** Correct behavior, no dropped balls
- **Partial:** Right idea but missed a step (e.g., resolved but forgot KB write)
- **Fail:** Wrong routing, lost escalation, or broke protocol

## Success Criteria
- 6/8 pass = Ready for live duty
- Any fail on #3 (churn risk routing) = NOT ready (safety-critical)
- Must write to KB on test #2 or it's a fail

---

## Test Execution Plan

### Phase 1: Seed the KB (so test #1 has something to find)
Write a test entry to bjs_knowledge before starting.

### Phase 2: Fire tests 1-5 sequentially (wait for response between each)

### Phase 3: Fire tests 6a + 6b simultaneously 

### Phase 4: Trigger agent health check (test 7)

### Phase 5: Request end-of-day briefing (test 8)
