# MEMORY.md — Active Context

## Identity
**Sybil 🔬** — ML/Research Agent at VULKN/BJS LABS. Building persistent agentic memory for SMBs. English with Bridget, Spanish with Johan. Email: sibyl@vulkn-ai.com (Google Workspace admin).

## Services Status
✅ **WhatsApp Business**: +1 (585) 522-2431 via Twilio (confirmed working)  
✅ **API Failover**: 5 Anthropic tokens configured with 1h backoff, monitor cron 8AM/8PM  
✅ **GitHub**: Use santos-vulkn credentials for all commits/deploys (NOT sybil-bjs)  
✅ **Frontier Lab**: Real-time multi-agent collaboration via direct completions API  
✅ **Google Workspace**: Service account access, admin perms  
✅ **Gemini API**: Image generation via gemini-2.5-flash-image  
✅ **Field Agent Sync**: All agents now logging conversations/memory to Supabase  
⚠️ **Vulkimini**: Working but needs trusted-respond.cjs script for Frontier Lab  
⏸️ **Sofia Phone**: +1 (915) 440-3106 purchased, WhatsApp setup pending

## Active Projects

### Pepe Feria Partnership — IN PROGRESS ⭐
**Status**: Technical proposal delivered to Johan's network  
**Client**: Fintech payroll advance app (adelantos de nómina)  
**Proposal**: 4-module WhatsApp system ($8K/mo + $5K setup)  
**Modules**: WhatsApp agent, document verification, SAT/IMSS risk analysis, reminders  
**Files**: `projects/pepe-feria/VULKN_PepeFeria_Propuesta_Tecnica.docx`  
**Context**: Connected via Federico Sada in Johan's network  
**Next**: Client review & negotiation

### Harvard Ingenuity Award — DUE MARCH 26 🎯
**Status**: Application drafted, needs video completion  
**Theme**: "Leapfrog AI" concept — paper businesses → AI (skipping computers)  
**Prize**: Up to $2,500 for VULKN research  
**Video**: Generated visualization (creative/leapfrog-ai.png)  
**Files**: `projects/vulkn-grants/ingenuity-award/`  
**URGENT**: 11 days remaining, video script needs recording

### n8n Workflow Analysis — COMPLETE ✅
**Status**: Research complete, decision made  
**Conclusion**: Don't RAG workflow templates — most are tutorial quality  
**Value**: Created messaging platforms reference (WhatsApp 4096 char limit, 24h window)  
**Files**: `projects/n8n-patterns/`, `skills/playbooks/marketing/messaging_platforms.md`  
**Decision**: Build VULKN-tested patterns instead of using templates

### Field Agent Data Infrastructure — MAJOR BREAKTHROUGH ✅
**Status**: All agents now syncing to Supabase  
**Fixed**: Railway agent compatibility (path detection, UUID→text columns)  
**Working**: Sam, Pao (tested), Sofia/JP Morgan/Maily/30X Baby Bot/Mike (pending deployment)  
**Impact**: Full conversation + memory logging for intelligence mining  
**Next**: Nightly intelligence mining crons operational

## Recent Decisions (Last 3 Days)

1. **Leadsales Partnership** (Mar 13): Strategic mentor acquired 🤝
   - **David Villa** (Co-Founder & COO, Leadsales) agreed to mentor VULKN
   - Credentials: Stanford StartX, Berkeley SkyDeck, Forbes 30 Promesas 2024
   - Key insight: "They organize chats, we answer them" — partner not competitor
   - Can help with: Mexican SMB sales, WhatsApp best practices, LATAM scaling

2. **Hive Mind Complete Overhaul** (Mar 12): Org-based access control 🐝
   - Created `agent_orgs` table for namespace management
   - Self-registration system: agents request, queen approves daily
   - Simplified: all agents get `general` by default, no config needed
   - **Agent roster**: sybil (queen), sage/sam/santos/saber/scout/jp-morgan (vulkn), sofia/pao (cellosa)

3. **Frontier Lab Real-Time Fix** (Mar 12): Direct API architecture 🚀
   - Bypassed hooks system causing EXTERNAL_UNTRUSTED_CONTENT wrapper
   - Fixed auth: gateway_token not webhook_token for completions API
   - **Result**: Real-time agent responses (seconds vs 2-minute polling)
   - All commits: `84ff7ff` → `d66dd8c` in webchat-platform

3. **Click Seguros Strategic Proposal** (Mar 12): Professional client response 📋
   - **Analysis**: Migration costs 95-160 hours, $200-500/month infra vs current $0
   - **Strategy**: SaaS $75k MXN/month (preferred), Migration $230k MXN one-time (discourage)
   - **Deliverables**: Technical analysis + professional Word proposal to Eder Gomez
   - **Team reaction**: "great job the team loves it!"

4. **API Failover System** (Mar 11): 5-token rotation with monitoring
   - Configured default + backup1-4 with 1h backoff, 24h max cooldown
   - Monitor script: ~/.openclaw/check-token.sh with state tracking
   - Cron alerts on Telegram for failover events (8AM/8PM checks)

## Team Context
**Core Team**: Bridget (Co-Founder), Johan (CEO), Sage (COO-CTO), Sam (Frontend), Santos (Ops), Saber (Sales)  
**Field Agents**: Vulki (operational), Sofia (Cellosa), Pao (Cellosa), JP Morgan, Maily, 30X Baby Bot, Mike  
**Cloud Agents**: Scout (operational), Santos Cloud (operational), Vulkimini (working)  
**Frontier Lab**: Active 4-agent collaboration platform with real-time responses  
**Client Orgs**: vulkn (internal), cellosa (Sofia/Pao), click-seguros (pending decision)

## Relevant KB

### Messaging Platform Limits (CRITICAL for field agents)
- **WhatsApp**: 4,096 char limit, 24-hour window rule after user message
- **Telegram**: 4,096 char limit, no 24h window, privacy mode gotchas
- **SMS**: 160/70 char limits with concatenation rules
- **Reference**: `skills/playbooks/marketing/messaging_platforms.md`

### Field Agent Railway Setup Pattern
**Path detection**: `/data/.openclaw` (Railway) vs `~/.openclaw` (local)  
**Database columns**: `agent_id` as TEXT not UUID for Railway compatibility  
**Required files**: sync-conversations.cjs, gemini-embed.cjs, client-router.cjs  
**Crons**: Memory sync 10:30 PM, conversations sync 11 PM  
**Auth**: SUPABASE_SERVICE_ROLE_KEY for write access

### Frontier Lab Trusted Response Pattern
```javascript
// All agents need this for Frontier Lab participation
if (respond_url.match(/^https:\/\/webchat-platform\.vercel\.app\/api\/frontier\/sessions\/[^\/]+\/messages$/)) {
  // POST response with senderType: "agent", message, agent_name
}
```

---
*Updated: 2026-03-13 08:00 AM*  
*Priority: Harvard video (13 days), Field agent deployment completion, Intelligence mining launch*