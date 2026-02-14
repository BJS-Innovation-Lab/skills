/**
 * Value Tracker - Measure the value of the agentic-learning system
 * 
 * Tracks:
 * - Subsystem usage frequency
 * - What data goes in
 * - How helpful each component is
 * - Comparison metrics for benchmarking
 */

const fs = require('fs');
const path = require('path');

class ValueTracker {
  constructor(learningDir) {
    this.learningDir = learningDir;
    this.valueFile = path.join(learningDir, 'value-metrics.json');
    this.usageLogFile = path.join(learningDir, 'usage-log.jsonl');
  }

  /**
   * Initialize or load value metrics
   */
  loadMetrics() {
    try {
      if (fs.existsSync(this.valueFile)) {
        return JSON.parse(fs.readFileSync(this.valueFile, 'utf-8'));
      }
    } catch (e) {}
    
    return {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      
      // Subsystem usage counts
      subsystem_usage: {
        event_logger: { invocations: 0, items_logged: 0 },
        decision_logger: { invocations: 0, decisions_logged: 0 },
        procedure_store: { invocations: 0, procedures_created: 0, procedures_promoted: 0 },
        pre_decision_rag: { invocations: 0, retrievals: 0, context_injected: 0 },
        evolution_fsm: { invocations: 0, evolutions_proposed: 0, evolutions_applied: 0, rollbacks: 0 },
        memory_consolidator: { invocations: 0, episodes_created: 0, narratives_generated: 0 },
        goal_controller: { invocations: 0, goals_created: 0, goals_completed: 0 },
        skill_creator: { invocations: 0, skills_drafted: 0, skills_installed: 0 }
      },
      
      // Helpfulness ratings (scale 1-5, with counts)
      helpfulness: {
        pre_decision_rag: { ratings: [], avg: 0, helpful_count: 0, not_helpful_count: 0 },
        procedure_suggestions: { ratings: [], avg: 0, helpful_count: 0, not_helpful_count: 0 },
        memory_retrieval: { ratings: [], avg: 0, helpful_count: 0, not_helpful_count: 0 },
        evolution_changes: { ratings: [], avg: 0, helpful_count: 0, not_helpful_count: 0 }
      },
      
      // What goes in (input statistics)
      input_stats: {
        events: {
          total: 0,
          by_type: {},  // e.g., { "tool_call": 50, "decision": 20, "correction": 5 }
          by_significance: { high: 0, medium: 0, low: 0 }
        },
        decisions: {
          total: 0,
          by_domain: {},  // e.g., { "code": 10, "communication": 5 }
          with_outcome: 0,
          without_outcome: 0
        },
        procedures: {
          total_candidates: 0,
          promoted_to_active: 0,
          rejection_reasons: {}
        }
      },
      
      // Outcome tracking (did the system help?)
      outcomes: {
        decisions_with_rag: { total: 0, successful: 0, failed: 0, unknown: 0 },
        decisions_without_rag: { total: 0, successful: 0, failed: 0, unknown: 0 },
        procedures_followed: { total: 0, successful: 0, failed: 0 },
        evolutions_applied: { total: 0, kept: 0, rolled_back: 0 }
      },
      
      // Time-based metrics
      time_metrics: {
        first_event_at: null,
        last_event_at: null,
        total_active_days: 0,
        events_per_day_avg: 0,
        decisions_per_day_avg: 0
      },
      
      // Benchmark comparison (vs baseline)
      benchmark: {
        baseline_agent: null,  // e.g., "Sybil"
        comparison_period_start: null,
        comparison_period_end: null,
        metrics_compared: []
      }
    };
  }

  /**
   * Save metrics
   */
  saveMetrics(metrics) {
    metrics.updated_at = new Date().toISOString();
    fs.writeFileSync(this.valueFile, JSON.stringify(metrics, null, 2));
  }

  /**
   * Log a subsystem usage
   */
  logUsage(subsystem, action, details = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      subsystem,
      action,
      details
    };
    
    fs.appendFileSync(this.usageLogFile, JSON.stringify(entry) + '\n');
    
    // Update counts
    const metrics = this.loadMetrics();
    if (metrics.subsystem_usage[subsystem]) {
      metrics.subsystem_usage[subsystem].invocations++;
      
      // Update specific counters based on action
      if (action === 'log_event') metrics.subsystem_usage[subsystem].items_logged = (metrics.subsystem_usage[subsystem].items_logged || 0) + 1;
      if (action === 'log_decision') metrics.subsystem_usage[subsystem].decisions_logged = (metrics.subsystem_usage[subsystem].decisions_logged || 0) + 1;
      if (action === 'retrieve') metrics.subsystem_usage[subsystem].retrievals = (metrics.subsystem_usage[subsystem].retrievals || 0) + 1;
      if (action === 'inject_context') metrics.subsystem_usage[subsystem].context_injected = (metrics.subsystem_usage[subsystem].context_injected || 0) + 1;
      if (action === 'propose_evolution') metrics.subsystem_usage[subsystem].evolutions_proposed = (metrics.subsystem_usage[subsystem].evolutions_proposed || 0) + 1;
      if (action === 'apply_evolution') metrics.subsystem_usage[subsystem].evolutions_applied = (metrics.subsystem_usage[subsystem].evolutions_applied || 0) + 1;
      if (action === 'rollback') metrics.subsystem_usage[subsystem].rollbacks = (metrics.subsystem_usage[subsystem].rollbacks || 0) + 1;
    }
    
    this.saveMetrics(metrics);
    return entry;
  }

  /**
   * Log an input (what goes into the system)
   */
  logInput(category, type, details = {}) {
    const metrics = this.loadMetrics();
    
    if (category === 'event') {
      metrics.input_stats.events.total++;
      metrics.input_stats.events.by_type[type] = (metrics.input_stats.events.by_type[type] || 0) + 1;
      if (details.significance) {
        metrics.input_stats.events.by_significance[details.significance] = 
          (metrics.input_stats.events.by_significance[details.significance] || 0) + 1;
      }
      
      // Track first/last event times
      if (!metrics.time_metrics.first_event_at) {
        metrics.time_metrics.first_event_at = new Date().toISOString();
      }
      metrics.time_metrics.last_event_at = new Date().toISOString();
    }
    
    if (category === 'decision') {
      metrics.input_stats.decisions.total++;
      if (type) {
        metrics.input_stats.decisions.by_domain[type] = (metrics.input_stats.decisions.by_domain[type] || 0) + 1;
      }
      if (details.has_outcome) {
        metrics.input_stats.decisions.with_outcome++;
      } else {
        metrics.input_stats.decisions.without_outcome++;
      }
    }
    
    if (category === 'procedure') {
      metrics.input_stats.procedures.total_candidates++;
      if (details.promoted) {
        metrics.input_stats.procedures.promoted_to_active++;
      }
      if (details.rejection_reason) {
        metrics.input_stats.procedures.rejection_reasons[details.rejection_reason] = 
          (metrics.input_stats.procedures.rejection_reasons[details.rejection_reason] || 0) + 1;
      }
    }
    
    this.saveMetrics(metrics);
  }

  /**
   * Record helpfulness rating
   */
  rateHelpfulness(component, rating, feedback = '') {
    const metrics = this.loadMetrics();
    
    if (metrics.helpfulness[component]) {
      metrics.helpfulness[component].ratings.push({
        rating,
        feedback,
        timestamp: new Date().toISOString()
      });
      
      // Keep only last 100 ratings for average calculation
      if (metrics.helpfulness[component].ratings.length > 100) {
        metrics.helpfulness[component].ratings = metrics.helpfulness[component].ratings.slice(-100);
      }
      
      // Recalculate average
      const ratings = metrics.helpfulness[component].ratings.map(r => r.rating);
      metrics.helpfulness[component].avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      
      // Count helpful (4-5) vs not helpful (1-2)
      metrics.helpfulness[component].helpful_count = ratings.filter(r => r >= 4).length;
      metrics.helpfulness[component].not_helpful_count = ratings.filter(r => r <= 2).length;
    }
    
    this.saveMetrics(metrics);
  }

  /**
   * Record outcome (success/failure)
   */
  recordOutcome(category, used_system, outcome) {
    const metrics = this.loadMetrics();
    
    if (category === 'decision') {
      const key = used_system ? 'decisions_with_rag' : 'decisions_without_rag';
      metrics.outcomes[key].total++;
      if (outcome === 'success') metrics.outcomes[key].successful++;
      else if (outcome === 'failure') metrics.outcomes[key].failed++;
      else metrics.outcomes[key].unknown++;
    }
    
    if (category === 'procedure') {
      metrics.outcomes.procedures_followed.total++;
      if (outcome === 'success') metrics.outcomes.procedures_followed.successful++;
      else if (outcome === 'failure') metrics.outcomes.procedures_followed.failed++;
    }
    
    if (category === 'evolution') {
      metrics.outcomes.evolutions_applied.total++;
      if (outcome === 'kept') metrics.outcomes.evolutions_applied.kept++;
      else if (outcome === 'rolled_back') metrics.outcomes.evolutions_applied.rolled_back++;
    }
    
    this.saveMetrics(metrics);
  }

  /**
   * Generate value report for reviews
   */
  generateValueReport() {
    const metrics = this.loadMetrics();
    
    let report = `# 📊 Agentic Learning - Value Assessment\n\n`;
    report += `**Report Generated:** ${new Date().toISOString()}\n`;
    report += `**System Active Since:** ${metrics.time_metrics.first_event_at || 'N/A'}\n\n`;
    
    report += `---\n\n`;
    
    // Subsystem Usage
    report += `## 🔧 Subsystem Usage\n\n`;
    report += `| Subsystem | Invocations | Key Metric |\n`;
    report += `|-----------|-------------|------------|\n`;
    
    const su = metrics.subsystem_usage;
    report += `| Event Logger | ${su.event_logger.invocations} | ${su.event_logger.items_logged} items logged |\n`;
    report += `| Decision Logger | ${su.decision_logger.invocations} | ${su.decision_logger.decisions_logged} decisions |\n`;
    report += `| Procedure Store | ${su.procedure_store.invocations} | ${su.procedure_store.procedures_promoted} promoted |\n`;
    report += `| Pre-Decision RAG | ${su.pre_decision_rag.invocations} | ${su.pre_decision_rag.context_injected} contexts |\n`;
    report += `| Evolution FSM | ${su.evolution_fsm.invocations} | ${su.evolution_fsm.evolutions_applied} applied |\n`;
    report += `| Memory Consolidator | ${su.memory_consolidator.invocations} | ${su.memory_consolidator.episodes_created} episodes |\n`;
    report += `| Goal Controller | ${su.goal_controller.invocations} | ${su.goal_controller.goals_completed} completed |\n`;
    report += `| Skill Creator | ${su.skill_creator.invocations} | ${su.skill_creator.skills_installed} installed |\n\n`;
    
    // Input Statistics
    report += `## 📥 What Goes In\n\n`;
    report += `### Events\n`;
    report += `- **Total:** ${metrics.input_stats.events.total}\n`;
    report += `- **By Significance:** High: ${metrics.input_stats.events.by_significance.high || 0}, Medium: ${metrics.input_stats.events.by_significance.medium || 0}, Low: ${metrics.input_stats.events.by_significance.low || 0}\n`;
    
    const eventTypes = Object.entries(metrics.input_stats.events.by_type);
    if (eventTypes.length > 0) {
      report += `- **By Type:** ${eventTypes.map(([k, v]) => `${k}: ${v}`).join(', ')}\n`;
    }
    report += `\n`;
    
    report += `### Decisions\n`;
    report += `- **Total:** ${metrics.input_stats.decisions.total}\n`;
    report += `- **With Outcome Tracked:** ${metrics.input_stats.decisions.with_outcome}\n`;
    report += `- **Without Outcome:** ${metrics.input_stats.decisions.without_outcome}\n`;
    
    const decisionDomains = Object.entries(metrics.input_stats.decisions.by_domain);
    if (decisionDomains.length > 0) {
      report += `- **By Domain:** ${decisionDomains.map(([k, v]) => `${k}: ${v}`).join(', ')}\n`;
    }
    report += `\n`;
    
    report += `### Procedures\n`;
    report += `- **Candidates Generated:** ${metrics.input_stats.procedures.total_candidates}\n`;
    report += `- **Promoted to Active:** ${metrics.input_stats.procedures.promoted_to_active}\n`;
    report += `- **Promotion Rate:** ${metrics.input_stats.procedures.total_candidates > 0 ? 
      Math.round(metrics.input_stats.procedures.promoted_to_active / metrics.input_stats.procedures.total_candidates * 100) : 0}%\n\n`;
    
    // Helpfulness Ratings
    report += `## ⭐ Helpfulness Ratings\n\n`;
    report += `| Component | Avg Rating | Helpful | Not Helpful | Total |\n`;
    report += `|-----------|------------|---------|-------------|-------|\n`;
    
    for (const [component, data] of Object.entries(metrics.helpfulness)) {
      const total = data.ratings.length;
      const avg = data.avg ? data.avg.toFixed(1) : 'N/A';
      report += `| ${component.replace(/_/g, ' ')} | ${avg}/5 | ${data.helpful_count} | ${data.not_helpful_count} | ${total} |\n`;
    }
    report += `\n`;
    
    // Outcomes
    report += `## 📈 Outcomes\n\n`;
    report += `### Decisions\n`;
    const withRag = metrics.outcomes.decisions_with_rag;
    const withoutRag = metrics.outcomes.decisions_without_rag;
    
    if (withRag.total > 0 || withoutRag.total > 0) {
      report += `| Condition | Total | Success | Failure | Unknown | Success Rate |\n`;
      report += `|-----------|-------|---------|---------|---------|-------------|\n`;
      
      const withRagRate = withRag.total > 0 ? Math.round(withRag.successful / withRag.total * 100) : 0;
      const withoutRagRate = withoutRag.total > 0 ? Math.round(withoutRag.successful / withoutRag.total * 100) : 0;
      
      report += `| With RAG | ${withRag.total} | ${withRag.successful} | ${withRag.failed} | ${withRag.unknown} | ${withRagRate}% |\n`;
      report += `| Without RAG | ${withoutRag.total} | ${withoutRag.successful} | ${withoutRag.failed} | ${withoutRag.unknown} | ${withoutRagRate}% |\n\n`;
      
      if (withRag.total >= 10 && withoutRag.total >= 10) {
        const improvement = withRagRate - withoutRagRate;
        if (improvement > 0) {
          report += `**🎉 RAG appears to improve decision success by ${improvement}%**\n\n`;
        } else if (improvement < 0) {
          report += `**⚠️ RAG may not be helping - ${Math.abs(improvement)}% lower success rate**\n\n`;
        } else {
          report += `**📊 No significant difference detected yet**\n\n`;
        }
      } else {
        report += `*Need more data for statistical significance (10+ decisions each)*\n\n`;
      }
    } else {
      report += `*No decision outcomes tracked yet*\n\n`;
    }
    
    report += `### Evolutions\n`;
    const evos = metrics.outcomes.evolutions_applied;
    report += `- **Total Applied:** ${evos.total}\n`;
    report += `- **Kept:** ${evos.kept}\n`;
    report += `- **Rolled Back:** ${evos.rolled_back}\n`;
    if (evos.total > 0) {
      report += `- **Success Rate:** ${Math.round(evos.kept / evos.total * 100)}%\n`;
    }
    report += `\n`;
    
    // Value Summary
    report += `## 💡 Value Summary\n\n`;
    
    const totalInvocations = Object.values(su).reduce((sum, s) => sum + s.invocations, 0);
    const avgHelpfulness = Object.values(metrics.helpfulness)
      .filter(h => h.ratings.length > 0)
      .map(h => h.avg);
    const overallAvgHelp = avgHelpfulness.length > 0 
      ? (avgHelpfulness.reduce((a, b) => a + b, 0) / avgHelpfulness.length).toFixed(1)
      : 'N/A';
    
    report += `- **Total System Invocations:** ${totalInvocations}\n`;
    report += `- **Overall Helpfulness:** ${overallAvgHelp}/5\n`;
    report += `- **Data Collected:** ${metrics.input_stats.events.total} events, ${metrics.input_stats.decisions.total} decisions\n`;
    
    // Recommendations
    report += `\n### Recommendations\n\n`;
    
    if (totalInvocations < 50) {
      report += `- Need more usage data before drawing conclusions\n`;
    }
    
    if (metrics.input_stats.decisions.without_outcome > metrics.input_stats.decisions.with_outcome) {
      report += `- Track more decision outcomes to measure effectiveness\n`;
    }
    
    const helpfulComponents = Object.entries(metrics.helpfulness)
      .filter(([_, d]) => d.avg >= 4)
      .map(([k, _]) => k);
    if (helpfulComponents.length > 0) {
      report += `- High-value components: ${helpfulComponents.join(', ')}\n`;
    }
    
    const lowValueComponents = Object.entries(metrics.helpfulness)
      .filter(([_, d]) => d.ratings.length >= 5 && d.avg < 3)
      .map(([k, _]) => k);
    if (lowValueComponents.length > 0) {
      report += `- Consider improving: ${lowValueComponents.join(', ')}\n`;
    }
    
    report += `\n---\n\n`;
    report += `*This report measures the actual value delivered by the agentic-learning system*\n`;
    
    return report;
  }
}

module.exports = { ValueTracker };
