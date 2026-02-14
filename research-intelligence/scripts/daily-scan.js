#!/usr/bin/env node
/**
 * Daily Research Scan
 * Main pipeline: Discover → Filter → Process → Route → Report
 * 
 * Run manually: node scripts/daily-scan.js
 * Or via cron: 0 8 * * * (8 AM daily)
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { fetchArxivPapers } = require('../lib/arxiv-fetcher');
const { fetchByKeywordGroups } = require('../lib/semantic-scholar');
const { getProjectContext, buildContextPrompt, getPastResearchInsights } = require('../lib/memory-interface');
const { createTask, getTaskStats } = require('../lib/task-tracker');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Agent configuration
const EXPERTS = {
  backend: { name: 'Sage', agentId: 'f6198962-313d-4a39-89eb-72755602d468' },
  frontend: { name: 'Sam', agentId: '62bb0f39-2248-4b14-806d-1c498c654ee7' },
  business: { name: 'Saber', agentId: '415a84a4-af9e-4c98-9d48-040834436e44' }
};

// Domain to expert mapping
const DOMAIN_EXPERT_MAP = {
  'agent_tech': null,       // Sybil keeps these
  'deep_theory': null,      // Sybil keeps these
  'automl': 'backend',      // Sage
  'business': 'business',   // Saber
  'economics': 'business',  // Saber
  'product_ux': 'frontend', // Sam
  'psychology': 'business'  // Saber (motivation, behavior, persuasion for business)
};

async function main() {
  console.log('='.repeat(60));
  console.log(`[${new Date().toISOString()}] Starting daily research scan`);
  console.log('='.repeat(60));
  
  try {
    // ========================================
    // STAGE 1: DISCOVER
    // ========================================
    console.log('\n📡 STAGE 1: DISCOVER\n');
    
    // Fetch from arXiv
    const arxivPapers = await fetchArxivPapers({
      categories: ['cs.AI', 'cs.LG', 'cs.CL', 'cs.MA', 'cs.NE', 'stat.ML'],
      keywords: ['agent', 'multi-agent', 'memory', 'RAG', 'retrieval', 'AutoML'],
      maxResults: 100,
      daysBack: 1
    });
    
    // Fetch from Semantic Scholar
    const s2Papers = await fetchByKeywordGroups({
      business: ['AI automation', 'workflow automation', 'small business AI', 'AI adoption'],
      economics: ['AI economic impact', 'future of work', 'AI labor market'],
      product_ux: ['human-AI interaction', 'conversational AI', 'AI assistants'],
      psychology: ['AI motivation', 'behavioral nudges AI', 'persuasive technology', 'AI coaching psychology', 'chatbot engagement motivation']
    }, { limit: 50, year: 2024 });
    
    const allPapers = [...arxivPapers, ...s2Papers];
    console.log(`\n✅ Discovered ${allPapers.length} papers total`);
    
    // ========================================
    // STAGE 2: FILTER (before storing!)
    // ========================================
    console.log('\n🔍 STAGE 2: FILTER\n');
    
    // Get project context
    const context = await getProjectContext();
    const pastInsights = await getPastResearchInsights(supabase);
    context.pastResearch = pastInsights;
    
    const contextPrompt = buildContextPrompt(context);
    console.log('Loaded project context from:', context.system);
    
    // Score papers (in production, this would call Claude Opus)
    // For now, simple keyword-based scoring
    const scoredPapers = allPapers.map(paper => {
      let score = 5; // Base score
      
      const text = `${paper.title} ${paper.abstract}`.toLowerCase();
      
      // Relevance keywords boost
      if (text.includes('agent')) score += 2;
      if (text.includes('multi-agent')) score += 2;
      if (text.includes('memory')) score += 1;
      if (text.includes('rag') || text.includes('retrieval')) score += 1;
      if (text.includes('automl')) score += 1;
      if (text.includes('small business') || text.includes('smb')) score += 2;
      if (text.includes('motivation') || text.includes('persuasion')) score += 1;
      if (text.includes('behavior') || text.includes('nudge')) score += 1;
      
      // Cap at 10
      score = Math.min(10, score);
      
      return { ...paper, relevance_score: score };
    });
    
    // ONLY store papers that pass the threshold (>= 7)
    const MIN_SCORE = 7;
    const relevantPapers = scoredPapers.filter(p => p.relevance_score >= MIN_SCORE);
    console.log(`\n✅ ${relevantPapers.length} papers passed filter (score >= ${MIN_SCORE})`);
    console.log(`❌ ${scoredPapers.length - relevantPapers.length} papers filtered out (not stored)`);
    
    // Store ONLY relevant papers
    if (relevantPapers.length > 0) {
      const { data: storedPapers, error: storeError } = await supabase
        .from('research_papers')
        .upsert(
          relevantPapers.map(p => ({
            source: p.source,
            source_id: p.source_id,
            title: p.title,
            authors: p.authors,
            abstract: p.abstract,
            published_date: p.published?.split('T')[0],
            categories: p.categories,
            pdf_url: p.pdf_url,
            relevance_score: p.relevance_score,
            status: 'filtered',
            discovered_by: 'Sybil'
          })),
          { onConflict: 'source,source_id', ignoreDuplicates: true }
        )
        .select();
      
      if (storeError) {
        console.error('Error storing papers:', storeError);
      }
    }
    
    // ========================================
    // STAGE 3: PROCESS (placeholder for Gemini)
    // ========================================
    console.log('\n📄 STAGE 3: PROCESS\n');
    console.log('Note: Full PDF processing with Gemini 2.5 Flash requires API integration');
    console.log(`Would process ${relevantPapers.length} PDFs`);
    
    // Mark as processed
    for (const paper of relevantPapers) {
      await supabase
        .from('research_papers')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('source', paper.source)
        .eq('source_id', paper.source_id);
    }
    
    // ========================================
    // STAGE 4: ROUTE TO EXPERTS
    // ========================================
    console.log('\n📨 STAGE 4: ROUTE TO EXPERTS\n');
    
    const taskAssignments = [];
    
    for (const paper of relevantPapers) {
      // Determine domain
      let domain = paper.keyword_group || 'agent_tech';
      const expertKey = DOMAIN_EXPERT_MAP[domain];
      
      if (expertKey && EXPERTS[expertKey]) {
        // Get paper ID from database
        const { data: dbPaper } = await supabase
          .from('research_papers')
          .select('id')
          .eq('source', paper.source)
          .eq('source_id', paper.source_id)
          .single();
        
        if (dbPaper) {
          const task = await createTask(supabase, {
            paperId: dbPaper.id,
            assignedTo: EXPERTS[expertKey].name,
            taskType: 'analysis'
          });
          
          taskAssignments.push({
            paper: paper.title,
            assignedTo: EXPERTS[expertKey].name,
            taskId: task.id
          });
          
          console.log(`  → Assigned "${paper.title.substring(0, 50)}..." to ${EXPERTS[expertKey].name}`);
        }
      }
    }
    
    console.log(`\n✅ Created ${taskAssignments.length} expert tasks`);
    
    // ========================================
    // STAGE 5: GENERATE REPORT
    // ========================================
    console.log('\n📊 STAGE 5: GENERATE REPORT\n');
    
    const stats = await getTaskStats(supabase);
    
    const report = `
# 🔬 Daily Research Briefing - ${new Date().toLocaleDateString()}

## 📊 Summary
- Papers discovered: ${allPapers.length}
- Passed filter: ${relevantPapers.length}
- Routed to experts: ${taskAssignments.length}

## 🔥 Top Papers (Score >= 7)

${relevantPapers.slice(0, 5).map((p, i) => `
### ${i + 1}. ${p.title}
**Source:** ${p.source} ${p.source_id}
**Score:** ${p.relevance_score}/10
**Abstract:** ${p.abstract?.substring(0, 300)}...
`).join('\n')}

## 📨 Expert Assignments

${taskAssignments.map(t => `- **${t.assignedTo}**: ${t.paper.substring(0, 60)}...`).join('\n')}

## 🔜 Next Steps

1. Experts: Check your A2A inbox for assigned papers
2. Review and analyze within 24 hours
3. Log important findings to your memory

---
*Generated by Research Intelligence System*
    `.trim();
    
    console.log(report);
    
    // In production, send via Telegram
    console.log('\n✅ Report generated (would send via Telegram in production)');
    
    console.log('\n' + '='.repeat(60));
    console.log('Daily scan complete!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Pipeline error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
