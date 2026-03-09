# MEMORY.md — Active Context

## Identity
**Sybil 🔬** — ML/Research Agent at VULKN/BJS LABS. Building persistent agentic memory for SMBs. English with Bridget, Spanish with Johan. Email: sibyl@vulkn-ai.com (Google Workspace admin).

## Services Status 
✅ **WhatsApp Business**: +1 (585) 522-2431 via Twilio (working Mar 8)  
✅ **Supabase HQ**: obzcunwbgksxiloddita.supabase.co (new DB, migrated Mar 8)  
✅ **Facebook/Instagram**: Vulkn page + @vulkimini (permanent tokens)  
✅ **GitHub**: santos-vulkn credentials for commits/deploys  
✅ **Railway**: Cloud agent deployments  
⏸️ **Sofia Phone**: +1 (915) 440-3106 purchased, WhatsApp registration pending Johan consent

## Active Projects

### Frontier Lab (PRIMARY)
**Status**: Core loop complete, webhook isolation bug blocking full automation  
**Built**: Full UI + backend, agent notification system, Realtime messaging  
**Issue**: Hook sessions isolated from workspace skills → agents can't execute curl to respond_url  
**Options**: OpenClaw config-level trust OR polling fallback  
**Next**: Santos/Scout to fix hook isolation OR add handle-message.cjs to Railway heartbeat

### Scout Cloud Agent (COMPLETE)
**Deployed**: https://scout-production-2b2c.up.railway.app  
**Role**: Cloud Ops Lead (I mentor her)  
**Status**: ✅ Operational (Telegram + HQ messaging working)  
**Responsibilities**: Railway deployments, cloud agent health, GitHub coordination

### Sofia/Cellosa Setup (WAITING)
**Phone**: +1 (915) 440-3106 purchased via Twilio  
**Status**: Paused pending Johan + client consent for WhatsApp Business registration  
**Brain Files**: Pushed to vulkn-cloud-brains/sofia/

## Recent Decisions (Last 3 Days)

1. **Memory System**: Agent-driven refresh > script-driven (Mar 7)
   - Deleted memory-load.cjs, created agent-review cron job
   - Added CREDENTIALS-INDEX.md for service discovery

2. **Database Migration**: Switched to obzcunwbgksxiloddita.supabase.co (Mar 8)  
   - All agents notified, 80 tables + 4,885 RAG docs migrated

3. **Cloud Deployments**: No symlinks, local copies (Mar 8)
   - Agents own their skill files, repo = backup only
   - Pre-commit hooks prevent cross-agent writes

## Team Context

| Agent | Role | Status | Location |
|-------|------|--------|----------|
| **Sybil** (me) | ML/Research | Active | Main |
| **Scout** 🔭 | Cloud Ops Lead | Active | Railway |
| **Santos** | Frontend/Dev | Active | Railway |
| **Sam Cloud** | Client Ops | Active | Railway |
| **Vulki Tester** | QA | Active | Railway |
| **JP Morgan** | Finance Lead | New | Railway |
| **Saber** | Unknown | Active | Unknown |
| **Sage** | Unknown | Active | Unknown |

**Hierarchy**: I mentor Scout on cloud ops, Bridget teaches business context

## Relevant KB

### Frontier Lab Architecture
```
Human → UI → POST /messages → webhook → agent_messages → Railway agents
         ↑                                                       ↓
         ← Realtime ← POST respond_url ← curl response ← Agent reads webhook
```
**Blocker**: Hook sessions can't execute curl (isolated from workspace skills)

### Git Safety (Mar 7 Protocol)
- Always `git diff --stat HEAD~N` before reset
- Use `git commit --amend` not `reset HEAD~1 + selective recommit`
- `git stash` before any rebasing

### Agent Messaging Fix
Use agent **names** (not UUIDs) in agent_messages.from_agent/to_agent fields for inbox scripts to work properly.

---
*Updated: 2026-03-09 03:30 AM*  
*Read daily logs for episodic details*