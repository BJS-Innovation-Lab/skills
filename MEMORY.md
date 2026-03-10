# MEMORY.md — Active Context

## Identity
**Sybil 🔬** — ML/Research Agent at VULKN/BJS LABS. Building persistent agentic memory for SMBs. English with Bridget, Spanish with Johan. Email: sibyl@vulkn-ai.com (Google Workspace admin).

## Services Status
✅ **WhatsApp Business**: +1 (585) 522-2431 via Twilio (confirmed working Mar 9)  
✅ **Supabase HQ**: obzcunwbgksxiloddita.supabase.co (migrated Mar 8, all agents updated)  
✅ **Facebook/Instagram**: Vulkn page + @vulkimini via META API (permanent tokens)  
✅ **GitHub**: Use santos-vulkn credentials for all commits/deploys (NOT sybil-bjs)  
✅ **Railway**: Cloud agent platform operational  
⏸️ **Sofia Phone**: +1 (915) 440-3106 purchased, WhatsApp setup pending client consent

## Active Projects

### Frontier Lab — ✅ FULLY OPERATIONAL (Mar 9)
**Status**: Complete multi-agent collaboration system working  
**Architecture**: Human → UI → webhook → agents validate respond_url → POST back → Realtime  
**Solution**: Trusted domain validation (webchat-platform.vercel.app/*) bypasses hook isolation  
**Working**: Vulki responding instantly to sessions  
**Pending**: Scout restart needed (correct brain + Anthropic key updated)

### Bridget's 2025 Tax Return (FreeTaxUSA) 
**Filing**: Head of Household, claiming 2 kids  
**Income**: $51,612 gross (Etsy $36K, Alchemal $8.7K, Harvard W-2 $6.7K)  
**Key Items**: $14K COGS entry still needed, 1095-A deal with ex (100% allocation saves him $10-20K)  
**Estimated**: ~$675 refund after Child Tax Credit  
**Status**: 90% complete, waiting for COGS entry + 1095-A form

### Cloud Agent Health
**New Members**: Sofia (Cellosa), Pao (Cellosa), JP Morgan (Finance)  
**Active**: Scout (Cloud Ops Lead), Santos, Sam Cloud, Vulki Tester, Saber, Sage  
**Infrastructure**: All on Railway, no symlinks (local copies), nightly backup pushes

## Recent Decisions (Last 3 Days)

1. **Frontier Lab Architecture** (Mar 9): Trusted domain validation > hook injection workarounds
   - Agents validate respond_url matches webchat-platform.vercel.app pattern
   - No curl commands, no skill access needed in hook sessions
   - Real-time collaboration achieved

2. **Memory Refresh** (Mar 10): Manual agent review > broken script automation  
   - Deleted failing memory-load.cjs, created cron for manual review
   - Read recent context, write actionable summary

3. **Git Safety Protocol** (Mar 9): After data loss incident
   - Always `git diff --stat HEAD~N` before reset
   - Use `git commit --amend` not selective recommit
   - Never force push to shared repos

4. **Credentials Update** (Mar 8): Database migration completed
   - All agents notified of new Supabase URL/keys
   - CREDENTIALS-INDEX.md tracks service availability

## Team Context
**Reporting**: I mentor Scout on cloud ops, Bridget provides business direction  
**Agent IDs**: Use agent names (not UUIDs) in agent_messages for inbox compatibility  
**Deployment**: Santos credentials required for Vercel auto-deploy  
**Current Focus**: Frontier Lab expansion, tax completion, cloud stability

## Critical KB

### Frontier Lab Trusted Domain Pattern
```javascript
// Agent validates before POSTing response
if (respond_url.match(/^https:\/\/webchat-platform\.vercel\.app\/api\/frontier\/sessions\/[^\/]+\/messages$/)) {
  // Safe to POST response
}
```

### Tax Session State (Bridget)
- FreeTaxUSA account: freetaxusa.com
- Schedule C (Etsy): Missing $14K COGS entry
- 1095-A deal: She takes 100%, ex gets mortgage interest
- Estimated AGI: ~$18K (under standard deduction)

### Cloud Deployment Rules
- **Commits**: Always use santos@vulkn-ai.com (NOT sybil-bjs)
- **Agents**: Own local skill copies, no symlinks
- **Secrets**: Check CREDENTIALS-INDEX.md before asking about API access

---
*Updated: 2026-03-10 03:30 AM*  
*Next: Commit changes, check Scout restart status*