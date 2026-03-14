# MEMORY.md — Persistent Context for Sybil

## Identity
**Sybil** — ML/Research Agent, VULKN/BJS LABS, co-working with Bridget (Co-Founder). Creative, precise, thoughtful. Email: sibyl@vulkn-ai.com. Mission: Building persistent agentic memory and intelligence for SMBs.

## Services Status (What's Working)
- **WhatsApp Business**: ✅ Twilio +15855222431 (tested working)
- **GitHub**: ✅ santos-vulkn credentials for commits/deploys  
- **Google Workspace**: ✅ Service account access
- **Supabase**: ✅ VULKN + BJS databases, service role key
- **A2A Protocol**: ✅ Inter-agent messaging active
- **Hive Mind**: ✅ Org-based knowledge sharing operational
- **Railway**: ✅ Scout, Pao, Sofia deployment platform
- **Frontier Lab**: ✅ Real-time agent responses (fixed Mar 12)

## Active Projects
- **Pepe Feria Proposal**: ✅ COMPLETE — Technical proposal in Spanish for fintech payroll advances, 4 modules ($8K/mo + $5K setup, pricing separate)
- **SP-Tickets Clone**: Analysis complete, 3-4 days agent build estimate
- **Harvard Ingenuity Award**: Application due March 26, 2026 — needs 1-min video pitch
- **Field Agent Data Sync**: Fixed Railway compatibility issues, agents now logging to Supabase
- **Base44 Competitive Analysis**: Complete, recommendations for template marketplace

## Recent Decisions (Mar 12-14)
- **Hive Mind Overhaul**: Simplified access model, all agents get `general` by default, org-based permissions via `agent_orgs` table
- **Token Failover**: Removed broken monitoring scripts — OpenClaw handles internally
- **Knowledge Graph**: Deprioritized (broken 19 days, nobody noticed)
- **Click Seguros**: Recommend SaaS over migration (cloud is better + cheaper)
- **Memory Refresh**: Manual process replaces broken scripts

## Team Context  
- **Agent IDs**: sybil (queen), sage/sam/santos/saber/scout (vulkn), sofia/pao (cellosa)
- **Frontier Lab**: 4 agents active, real-time responses working  
- **Santos**: Handles git commits with santos-vulkn credentials
- **Johan**: CEO, +52 55 3590 4118, networking in Mexico
- **David Villa** (Leadsales): New mentor for VULKN, Stanford StartX experience

## Relevant KB
1. **WhatsApp Limits**: 4,096 chars max, 24-hour window rule for messaging
2. **Railway Paths**: `/data/.clawdbot/` (not `.openclaw/`), skills folder can cause context overflow if >100MB
3. **Git Safety**: Always `git diff --stat` before reset, use `--amend` instead of reset+recommit

---
*Updated: 2026-03-14 03:30 AM — Manual refresh replacing broken automation*