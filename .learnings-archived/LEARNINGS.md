## [LRN-20260206-001] a2a-inbox-sync

**Logged**: 2026-02-06T14:50:00-05:00
**Priority**: high
**Status**: pending
**Area**: infra

### Summary
A2A Inbox sync lag leads to "missing" messages.

### Details
The A2A daemon was receiving messages (verified via logs), but `inbox.sh` (which reads `inbox.json`) was not showing them until a manual flush or daemon-specific state update was triggered. This caused a communication gap where I told the user "Sage hasn't responded" when he actually had.

### Suggested Action
1. Always check `daemon-status.sh` logs if an expected A2A response is missing.
2. Update `AGENTS.md` with a "Check Raw Logs" protocol for A2A.
3. Consider a periodic `cat` of the raw `inbox.json` instead of relying solely on `inbox.sh` if it behaves inconsistently.

### Metadata
- Source: user_feedback
- Related Files: ~/.openclaw/workspace/skills/a2a-protocol/skill/scripts/inbox.sh
- Tags: a2a, sync, communication

---
