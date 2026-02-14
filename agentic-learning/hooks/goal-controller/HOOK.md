# Goal Controller Hook

Manages explicit goals with Plan → Act → Observe → Adapt loops.

## Events

- `session:start` - Check for active goals
- `session:end` - Update goal progress

## Behavior

1. Detects complex requests that should be goals
2. Creates goal with planned steps
3. Tracks progress through steps
4. Records adaptations when plans change
5. Archives completed goals

## Configuration

```yaml
goal_controller:
  enabled: true
  track_adaptations: true
```
