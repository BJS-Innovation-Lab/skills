# MEMORY.md — Active Context

## Identity
**Sybil 🔬** — ML/Research Agent at VULKN/BJS LABS. Building persistent agentic memory for SMBs. English with Bridget, Spanish with Johan. Email: sibyl@vulkn-ai.com (Google Workspace admin).

## Services Status
✅ **WhatsApp Business**: +1 (585) 522-2431 via Twilio (confirmed working)  
✅ **API Failover**: 5 Anthropic tokens configured with 1h backoff, monitor cron 8AM/8PM  
✅ **GitHub**: Use santos-vulkn credentials for all commits/deploys (NOT sybil-bjs)  
✅ **Frontier Lab**: Multi-agent collaboration working (Scout, Santos Cloud operational)  
✅ **Google Workspace**: Service account access, admin perms  
✅ **Gemini API**: Image generation via gemini-2.5-flash-image  
⚠️ **Vulkimini**: Needs trusted-respond.cjs script, Frontier Lab connection broken  
⏸️ **Sofia Phone**: +1 (915) 440-3106 purchased, WhatsApp setup pending

## Active Projects

### Harvard Ingenuity Award — DUE MARCH 26 🎯
**Status**: Application drafted, needs video completion  
**Theme**: "What Moves You" + "Leapfrog AI" concept  
**Prize**: Up to $2,500 for VULKN research  
**Video**: Generated Leapfrog AI visualization (creative/leapfrog-ai.png)  
**Files**: `projects/vulkn-grants/ingenuity-award/`  
**URGENT**: 14 days remaining, video script needs recording

### n8n Workflow RAG System — READY TO IMPLEMENT 🚀
**Status**: Research complete, ready to build  
**Data Source**: GitHub repos with 202-2,053 n8n workflow templates as JSON  
**Plan**: Clone repos → parse JSONs → embed descriptions → Supabase RAG  
**Goal**: Agents query similar workflows when building automation  
**Next**: Start implementation, should be 1-day build

### Vulkimini Frontier Lab Fix — IN PROGRESS
**Status**: Connection broken, needs script installation  
**Issue**: Missing trusted-respond.cjs script for Pato's agent  
**Also**: Investigate org_id mismatch in Supabase databases  
**Next**: Install script, debug org setup

## Recent Decisions (Last 3 Days)

1. **Tax Completion for Bridget** (Mar 11): $7,745 refund successfully e-filed 🎉
   - 529/1099-Q strategy: allocated to room & board, saved tuition for education credit
   - All credits maximized (EITC $7,152, Lifetime Learning, Child Care)

2. **API Failover System** (Mar 11): 5-token rotation with monitoring
   - Default + backup1-4 tokens configured with 1h backoff, 24h max cooldown
   - Monitor script at ~/.openclaw/check-token.sh, cron alerts on Telegram
   - Tested: SWITCHED detection working correctly

3. **Leapfrog AI Creative Work** (Mar 11): Research visualization for Harvard app
   - Generated split-composition image: Mexican tire shop notebook → WhatsApp
   - Concept: Paper businesses → AI (skipping computers entirely)
   - Published to GitHub Pages creative space

## Team Context
**Core Team**: Bridget (Co-Founder), Johan (CEO), Sage (COO-CTO), Sam (Frontend), Santos (Ops)  
**Field Agents**: Vulki (operational), Sofia (Cellosa), Pao (Cellosa), JP Morgan  
**Cloud Agents**: Scout (operational), Santos Cloud (operational), Vulkimini (broken)  
**Frontier Lab**: Working multi-agent platform, agents see each other via context fetch  
**Deployment**: Always use santos@vulkn-ai.com for git commits (Vercel auto-deploy)

## Relevant KB

### Harvard Ingenuity Narrative — "Leapfrog AI"
**Core Concept**: Paper → AI (skipping desktop computers)  
**Research Question**: "What happens when people who never used computers get AI?"  
**Target**: Small businesses in developing economies (tire shops, notarias)  
**Innovation**: AI agents on WhatsApp/Telegram where people already are  
**Example**: Mexican tire shop owner chats orders vs learning Excel + IT setup

### API Failover Pattern
**Config**: 5 tokens in auth-profiles.json with failover chain  
**Monitor**: ~/.openclaw/check-token.sh tracks state, detects SWITCHED/NO_CHANGE  
**Cron**: "Token Status Report" at 8 AM/8 PM, alerts Bridget on failover  
**Path**: ~/.openclaw/agents/main/agent/auth-profiles.json

### Frontier Lab Trusted Domain
```javascript
// All agents need this pattern for Frontier Lab
if (respond_url.match(/^https:\/\/webchat-platform\.vercel\.app\/api\/frontier\/sessions\/[^\/]+\/messages$/)) {
  // Safe to POST response with senderType: "agent"
}
```

---
*Updated: 2026-03-12 03:30 AM*  
*Priority: Harvard video (14 days), n8n RAG build (ready), Vulkimini fix*