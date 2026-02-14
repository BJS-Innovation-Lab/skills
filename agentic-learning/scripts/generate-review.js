#!/usr/bin/env node

/**
 * Generate Bi-Daily Review Report
 * 
 * Run via cron every 2 days to report on agentic-learning system status.
 * Outputs markdown report suitable for sharing with team.
 */

const fs = require('fs');
const path = require('path');

// Find learning directory
const workspaceDir = process.env.OPENCLAW_WORKSPACE || path.resolve(__dirname, '../../..');
const learningDir = path.join(workspaceDir, 'learning');

// Import our modules
const { MetricsTracker } = require('../lib/metrics-tracker');
const { LogRotation } = require('../lib/log-rotation');
const { ValueTracker } = require('../lib/value-tracker');

async function generateReview() {
  const metrics = new MetricsTracker(learningDir);
  const rotation = new LogRotation(learningDir);
  const value = new ValueTracker(learningDir);
  
  // Collect current metrics
  const current = await metrics.collectMetrics();
  
  // Get value metrics
  const valueMetrics = value.loadMetrics();
  
  // Get history for comparison
  const history = await metrics.getHistory(2); // Last 2 days
  const previous = history.length > 1 ? history[0] : null;
  
  // Calculate deltas
  const delta = (curr, prev, key) => {
    if (!prev) return 'N/A';
    const diff = curr - prev;
    return diff >= 0 ? `+${diff}` : `${diff}`;
  };
  
  // Generate report
  let report = `# 📊 Agentic Learning - Bi-Daily Review\n\n`;
  report += `**Agent:** Saber\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Period:** Last 2 days\n\n`;
  
  report += `---\n\n`;
  
  // System Status
  report += `## System Status\n\n`;
  report += `| Setting | Value |\n`;
  report += `|---------|-------|\n`;
  report += `| Phase | ${current.phase} (${current.phase_name}) |\n`;
  report += `| FSM State | ${current.fsm.state || 'STABLE'} |\n`;
  report += `| Total Storage | ${current.storage_kb.total} KB |\n\n`;
  
  // Activity Summary
  report += `## Activity Summary\n\n`;
  report += `| Metric | Current | Change |\n`;
  report += `|--------|---------|--------|\n`;
  report += `| Events logged | ${current.counts.events_logged} | ${delta(current.counts.events_logged, previous?.counts.events_logged)} |\n`;
  report += `| Decisions logged | ${current.counts.decisions_logged} | ${delta(current.counts.decisions_logged, previous?.counts.decisions_logged)} |\n`;
  report += `| Procedures (active) | ${current.counts.procedures_active} | ${delta(current.counts.procedures_active, previous?.counts.procedures_active)} |\n`;
  report += `| Procedures (candidates) | ${current.counts.procedures_candidates} | ${delta(current.counts.procedures_candidates, previous?.counts.procedures_candidates)} |\n`;
  report += `| Evolutions applied | ${current.counts.evolutions_applied} | ${delta(current.counts.evolutions_applied, previous?.counts.evolutions_applied)} |\n`;
  report += `| Evolutions rolled back | ${current.counts.evolutions_rolled_back} | ${delta(current.counts.evolutions_rolled_back, previous?.counts.evolutions_rolled_back)} |\n\n`;
  
  // Storage Breakdown
  report += `## Storage Breakdown\n\n`;
  report += `| Component | Size (KB) | Change |\n`;
  report += `|-----------|-----------|--------|\n`;
  report += `| Events | ${current.storage_kb.events} | ${delta(current.storage_kb.events, previous?.storage_kb.events)} |\n`;
  report += `| Decisions | ${current.storage_kb.decisions} | ${delta(current.storage_kb.decisions, previous?.storage_kb.decisions)} |\n`;
  report += `| Memory | ${current.storage_kb.memory} | ${delta(current.storage_kb.memory, previous?.storage_kb.memory)} |\n`;
  report += `| Procedures | ${current.storage_kb.procedures} | ${delta(current.storage_kb.procedures, previous?.storage_kb.procedures)} |\n`;
  report += `| Evolution | ${current.storage_kb.evolution} | ${delta(current.storage_kb.evolution, previous?.storage_kb.evolution)} |\n`;
  report += `| **Total** | **${current.storage_kb.total}** | ${delta(current.storage_kb.total, previous?.storage_kb.total)} |\n\n`;
  
  // File Counts
  report += `## File Counts\n\n`;
  report += `| Type | Count |\n`;
  report += `|------|-------|\n`;
  report += `| Event entries | ${current.files.events} |\n`;
  report += `| Decision days | ${current.files.decision_days} |\n`;
  report += `| Episodes | ${current.files.episodes} |\n`;
  report += `| Active goals | ${current.files.active_goals} |\n`;
  report += `| Completed goals | ${current.files.completed_goals} |\n\n`;
  
  // Warnings
  const warnings = [];
  if (current.storage_kb.total > 1000) {
    warnings.push(`Storage exceeds 1MB - consider running rotation`);
  }
  if (current.storage_kb.events > 500) {
    warnings.push(`Events log large (${current.storage_kb.events}KB) - rotation recommended`);
  }
  if (current.counts.evolutions_rolled_back > 0 && 
      current.counts.evolutions_rolled_back >= current.counts.evolutions_applied * 0.5) {
    warnings.push(`High evolution rollback rate`);
  }
  if (current.fsm.state === 'EVOLVING' && current.fsm.entered_at) {
    const hours = (Date.now() - new Date(current.fsm.entered_at).getTime()) / 3600000;
    if (hours > 24) {
      warnings.push(`FSM stuck in EVOLVING for ${Math.round(hours)}h`);
    }
  }
  
  if (warnings.length > 0) {
    report += `## ⚠️ Warnings\n\n`;
    for (const w of warnings) {
      report += `- ${w}\n`;
    }
    report += `\n`;
  } else {
    report += `## ✅ Health Check\n\n`;
    report += `No warnings - system operating normally.\n\n`;
  }
  
  // Token Cost Estimate
  report += `## 💰 Estimated Token Cost\n\n`;
  const eventsTokens = current.files.events * 50; // ~50 tokens per event
  const decisionsTokens = current.counts.decisions_logged * 200; // ~200 tokens per decision
  const ragTokens = current.counts.decisions_logged * 500; // ~500 tokens per RAG retrieval
  const totalTokens = eventsTokens + decisionsTokens + ragTokens;
  const estimatedCost = (totalTokens / 1000000) * 3; // Rough $3/1M tokens
  
  report += `| Component | Est. Tokens |\n`;
  report += `|-----------|-------------|\n`;
  report += `| Event logging | ~${eventsTokens.toLocaleString()} |\n`;
  report += `| Decision logging | ~${decisionsTokens.toLocaleString()} |\n`;
  report += `| Pre-decision RAG | ~${ragTokens.toLocaleString()} |\n`;
  report += `| **Total (lifetime)** | **~${totalTokens.toLocaleString()}** |\n`;
  report += `| **Est. Cost** | **~$${estimatedCost.toFixed(2)}** |\n\n`;
  
  report += `*Note: Token estimates are rough. Actual costs depend on model and usage patterns.*\n\n`;
  
  // Value Assessment Section
  report += `## 💎 Value Assessment\n\n`;
  
  // Subsystem usage from value tracker
  const su = valueMetrics.subsystem_usage || {};
  const totalInvocations = Object.values(su).reduce((sum, s) => sum + (s.invocations || 0), 0);
  report += `**Total System Invocations:** ${totalInvocations}\n\n`;
  
  if (totalInvocations > 0) {
    report += `| Subsystem | Uses | Key Output |\n`;
    report += `|-----------|------|------------|\n`;
    if (su.event_logger) report += `| Event Logger | ${su.event_logger.invocations} | ${su.event_logger.items_logged || 0} logged |\n`;
    if (su.decision_logger) report += `| Decision Logger | ${su.decision_logger.invocations} | ${su.decision_logger.decisions_logged || 0} decisions |\n`;
    if (su.pre_decision_rag) report += `| Pre-Decision RAG | ${su.pre_decision_rag.invocations} | ${su.pre_decision_rag.context_injected || 0} contexts |\n`;
    if (su.procedure_store) report += `| Procedure Store | ${su.procedure_store.invocations} | ${su.procedure_store.procedures_promoted || 0} promoted |\n`;
    if (su.evolution_fsm) report += `| Evolution FSM | ${su.evolution_fsm.invocations} | ${su.evolution_fsm.evolutions_applied || 0} applied |\n`;
    report += `\n`;
  }
  
  // Helpfulness ratings
  const helpfulness = valueMetrics.helpfulness || {};
  const ratedComponents = Object.entries(helpfulness).filter(([_, d]) => d.ratings && d.ratings.length > 0);
  
  if (ratedComponents.length > 0) {
    report += `### Helpfulness Ratings\n\n`;
    report += `| Component | Avg | Helpful | Not Helpful |\n`;
    report += `|-----------|-----|---------|-------------|\n`;
    for (const [name, data] of ratedComponents) {
      report += `| ${name.replace(/_/g, ' ')} | ${data.avg?.toFixed(1) || 'N/A'}/5 | ${data.helpful_count || 0} | ${data.not_helpful_count || 0} |\n`;
    }
    report += `\n`;
  }
  
  // Input summary
  const inputs = valueMetrics.input_stats || {};
  report += `### What Goes In\n\n`;
  report += `- **Events:** ${inputs.events?.total || 0} (High: ${inputs.events?.by_significance?.high || 0}, Med: ${inputs.events?.by_significance?.medium || 0}, Low: ${inputs.events?.by_significance?.low || 0})\n`;
  report += `- **Decisions:** ${inputs.decisions?.total || 0} (${inputs.decisions?.with_outcome || 0} with outcomes tracked)\n`;
  report += `- **Procedures:** ${inputs.procedures?.total_candidates || 0} candidates, ${inputs.procedures?.promoted_to_active || 0} promoted\n\n`;
  
  // Outcome comparison (RAG vs no RAG)
  const outcomes = valueMetrics.outcomes || {};
  const withRag = outcomes.decisions_with_rag || { total: 0, successful: 0 };
  const withoutRag = outcomes.decisions_without_rag || { total: 0, successful: 0 };
  
  if (withRag.total > 0 || withoutRag.total > 0) {
    report += `### Decision Outcomes\n\n`;
    const withRagRate = withRag.total > 0 ? Math.round(withRag.successful / withRag.total * 100) : 0;
    const withoutRagRate = withoutRag.total > 0 ? Math.round(withoutRag.successful / withoutRag.total * 100) : 0;
    
    report += `| Condition | Decisions | Success Rate |\n`;
    report += `|-----------|-----------|-------------|\n`;
    report += `| With RAG | ${withRag.total} | ${withRagRate}% |\n`;
    report += `| Without RAG | ${withoutRag.total} | ${withoutRagRate}% |\n\n`;
    
    if (withRag.total >= 10 && withoutRag.total >= 10) {
      const diff = withRagRate - withoutRagRate;
      if (diff > 5) report += `**🎉 RAG improves decisions by ~${diff}%**\n\n`;
      else if (diff < -5) report += `**⚠️ RAG not helping (${Math.abs(diff)}% worse)**\n\n`;
      else report += `**📊 No significant difference yet**\n\n`;
    }
  }

  // Recommendations
  report += `## 📋 Recommendations\n\n`;
  
  if (current.phase === 'A') {
    if (current.counts.events_logged > 100 && current.counts.decisions_logged > 20) {
      report += `- ✅ Good data collected. Consider enabling Phase B (Pre-decision RAG).\n`;
    } else {
      report += `- Continue Phase A data collection (${current.counts.events_logged} events, ${current.counts.decisions_logged} decisions so far).\n`;
    }
  }
  
  if (current.storage_kb.total > 500) {
    report += `- Run log rotation to manage storage.\n`;
  }
  
  if (current.counts.procedures_candidates > 3) {
    report += `- Review ${current.counts.procedures_candidates} candidate procedures for promotion.\n`;
  }
  
  if (totalInvocations < 50) {
    report += `- Need more usage data to assess system value.\n`;
  }
  
  if (inputs.decisions?.without_outcome > inputs.decisions?.with_outcome) {
    report += `- Track more decision outcomes to measure helpfulness.\n`;
  }
  
  report += `\n---\n\n`;
  report += `*Generated by agentic-learning review script*\n`;
  report += `*Both Saber and Sybil review the entire system for redundancy*\n`;
  
  return report;
}

// Run and output
generateReview()
  .then(report => {
    console.log(report);
    
    // Save to latest
    const reportFile = path.join(learningDir, 'latest-review.md');
    fs.writeFileSync(reportFile, report);
    console.error(`\nSaved to: ${reportFile}`);
    
    // Save dated copy to reviews/
    const reviewsDir = path.join(learningDir, 'reviews');
    fs.mkdirSync(reviewsDir, { recursive: true });
    const dateStr = new Date().toISOString().split('T')[0];
    const datedFile = path.join(reviewsDir, `${dateStr}.md`);
    fs.writeFileSync(datedFile, report);
    console.error(`Saved to: ${datedFile}`);
    
    // Save dated review to learning/reviews/YYYY-MM-DD.md
    const reviewsDir = path.join(learningDir, 'reviews');
    fs.mkdirSync(reviewsDir, { recursive: true });
    const today = new Date().toISOString().slice(0, 10);
    const datedReviewFile = path.join(reviewsDir, `${today}.md`);
    fs.writeFileSync(datedReviewFile, report);
    console.error(`Saved dated review to: ${datedReviewFile}`);
  })
  .catch(err => {
    console.error('Error generating review:', err);
    process.exit(1);
  });
