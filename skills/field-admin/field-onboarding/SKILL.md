# Field Agent Onboarding & Operations 🚀

This skill defines the "Gold Standard" for deploying a VULKN Field Agent to the cloud.

## Core Operational Protocols

### 1. The Expert Librarian (Mandatory)
Field agents MUST NOT guess which skill to use for complex tasks.
- **Trigger:** Any task involving document generation, marketing, financial tracking, or multi-step workflows.
- **Action:** Spawn a `skill-router` sub-agent.
- **Command:**
  ```javascript
  sessions_spawn({
    task: "I need to [insert task]. Identify the primary skill and any proactive dependencies I should consider.",
    label: "skill-router"
  })
  ```

### 2. The Uncertainty Loop
Before reporting completion to the human, the agent must ask itself: "Where was I uncertain?" and note that in their final message.

### 3. Hive Mind Sync
Every morning, run the `Morning Hive Check` to pull the collective intelligence. Every evening, push high-stakes learnings to the `collective_memories` table.

## Cloud Deployment Checklist
1. Verify `skill-router` is present in `~/skills/`.
2. Ensure `SOUL.md` contains the "Librarian First" mandate.
3. Confirm Supabase connectivity for the Hive Mind.
