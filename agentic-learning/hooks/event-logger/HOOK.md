# Event Logger Hook

Captures all significant events and appends to the unified event log.

## Events

- `session:start` - Session started
- `session:end` - Session ended
- `command:new` - New command started

## Behavior

1. Detects event type and significance
2. Extracts relevant context
3. Appends to `learning/events/events.jsonl`
4. Updates status metrics

## Configuration

Enable in `learning/config.yaml`:

```yaml
event_logger:
  enabled: true
  log_all: false  # only significant events
```
