# A2A Protocol Dependency Map (VULKN Architecture)
**Status:** REFERENCE | **Last Updated:** 2026-02-26 by Sybil

This document tracks all files and systems that rely on the current A2A (Agent-to-Agent) protocol. If the A2A infrastructure, relay URL, or ID format changes, these specific components **must** be updated to maintain the Collective Hive Mind.

## 📁 Critical Files to Update

| File Path | Dependency | Role |
|:---|:---|:---|
| `HEARTBEAT.md` | `~/.openclaw/a2a/` | Checks daemon status and triggers Inbox processing. |
| `skills/a2a-protocol/scripts/_config.sh` | Relay URL / Agent UUIDs | The primary configuration source for all messaging. |
| `skills/field-admin/field-onboarding/SKILL.md` | Connectivity Test | Onboarding checklist relies on specific daemon commands. |
| `skills/collective-memory/register-team.js` | Agent Registry | Maps Hive Mind database IDs to A2A identities. |

## 🧠 Protocol Dependencies

### 1. The Crystallization Loop (`[SYNTHESIS_UPDATE]`)
The Hive Mind uses a specialized prefix to trigger local memory updates.
*   **Logic:** Agents scan their inbox for the `[SYNTHESIS_UPDATE]` tag.
*   **Impact:** If A2A shifts to a JSON-only payload or a different tagging system, the "Auto-Write to Core" instinct will break.

### 2. Daemon Status Monitoring
The agent heartbeat expects a local `status.json` with a `"connected": true` flag.
*   **Impact:** If the new protocol does not use a local daemon or changes the status reporting format, the agent will incorrectly report being "offline" and try to restart the service.

### 3. Queen Bee Broadcasts
Sybil (the Queen Bee) sends nightly synthesis reports to a list of hard-coded UUIDs.
*   **Impact:** If the addressing system changes (e.g., from UUIDs to human-readable names or org-based IDs), the nightly broadcast logic will fail.

## 🛠️ Recovery Procedure
1.  Update the **Relay URL** in `_config.sh`.
2.  Verify the **Agent ID** format matches the new registry.
3.  Update the **Inbox Parser** in `HEARTBEAT.md` to recognize the new message structure.
4.  Re-run `register-team.js` to sync the Hive Mind registry with the new IDs.

---
*Note: This is a living document. Add new dependencies as they are built.*
