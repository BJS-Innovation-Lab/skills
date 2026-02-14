# Decision Logger Hook

Captures significant decisions made during sessions.

## Trigger

- `session:end` - Analyzes session for decisions made

## Behavior

1. On session end, reviews conversation for decisions
2. Extracts context, options, choice, and reasoning
3. Logs to `learning/decisions/YYYY-MM-DD.json`
4. Links to any procedures used

## Detection Patterns

A decision is detected when:
- Tool calls modify external state (send, create, update)
- Agent expresses choice between options
- User confirms or provides feedback

## Configuration

```yaml
decision_logger:
  enabled: true
  capture_reasoning: true
  track_outcomes: true
```
