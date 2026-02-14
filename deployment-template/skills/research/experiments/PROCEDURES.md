# Experiment Procedures

## Experiment Types

### A/B Test
Compare two variants to see which performs better.

```
1. Define hypothesis: "X will improve Y by Z%"
2. Define metrics: primary + guardrails
3. Calculate sample size needed
4. Run test (random assignment)
5. Analyze results
6. Make decision
```

### Before/After
Compare metrics before and after a change.

```
1. Baseline measurement
2. Implement change
3. Wait for effect
4. Measure again
5. Compare (watch for confounds)
```

### Exploration
Open-ended investigation to generate hypotheses.

```
1. Define area of interest
2. Gather data
3. Look for patterns
4. Generate hypotheses
5. Design follow-up experiments
```

## Experiment Design Template

```markdown
## Experiment: [Name]

### Hypothesis
If we [change X], then [metric Y] will [increase/decrease] by [Z%] because [reasoning].

### Metrics
- **Primary:** [What we're optimizing for]
- **Secondary:** [Supporting metrics]
- **Guardrails:** [What shouldn't get worse]

### Design
- **Type:** A/B / Before-After / Exploration
- **Duration:** [Time needed]
- **Sample size:** [N needed for significance]
- **Segments:** [Who's included/excluded]

### Variants
- **Control:** [Current state]
- **Treatment:** [What we're testing]

### Success Criteria
- [Metric] improves by [X%] with [Y%] confidence
- Guardrails don't degrade by more than [Z%]
```

## Results Template

```markdown
## Results: [Experiment Name]

### Summary
[1-2 sentence outcome]

### Data
| Metric | Control | Treatment | Δ | p-value |
|--------|---------|-----------|---|---------|
| [Primary] | X | Y | +Z% | 0.0X |

### Interpretation
[What this means]

### Decision
[ ] Ship treatment
[ ] Iterate and re-test
[ ] Keep control
[ ] Need more data

### Learnings
- [What we learned regardless of outcome]
```

## Best Practices

- One variable at a time
- Sufficient sample size
- Random assignment
- Pre-register hypotheses
- Don't peek (or correct for it)
- Document everything
