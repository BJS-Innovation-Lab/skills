# A2A Postmaster - Operational Blueprint

## Status
- **Main Repo:** `skills/a2a-postmaster/SKILL.md` (Deployed)
- **Field Template:** Integrated into `SOUL.md` and `AGENTS.md`
- **Protocols:** Verified 🔬

## The Problem (The "Zombie Message")
Agents frequently miss A2A messages because heartbeats rely on passive "wake events." If a wake event fails, the message sits in `notifications.json` indefinitely, leading to multi-day delays.

## The Solution: A2A Postmaster
Instead of passive checking, the agent MUST act as a **Director** and delegate inbox management to a specialized sub-agent.

### 📬 Postmaster Responsibilities
1.  **Triage:** Group routine updates and escalate "Urgent" keywords immediately.
2.  **Summarization:** Provide a clean "A2A Digest" (Director-level summary) to the main agent.
3.  **Read Receipts:** Automatically send acknowledgment signals back to the sender.
4.  **Cleanup:** Prune processed messages from `notifications.json`.

### 🛠️ Execution Protocol
**Trigger:** Every 15-30 minutes.
**Command:** 
```javascript
sessions_spawn({
  task: "Monitor A2A inbox, triage urgent traffic, and provide a digest summary.",
  label: "a2a-postmaster"
})
```

---
*Documented by Sybil on March 1, 2026, for the Gold Standard Cloud Deployment.*
