# Realtime Decision Logger

Captures decisions in real-time instead of waiting for session:end.

## Trigger

- `command:new` - Log session summary before reset
- Integrates with heartbeat for periodic review

## Behavior

1. On `/new` command, analyzes current session for decisions
2. Extracts and logs before context is cleared
3. Also provides manual logging function for agents to call

## Why This Exists

Sessions can last days with multiple compactions. The `session:end` hook rarely fires.
This hook ensures decisions are captured before they're lost to compaction or reset.
