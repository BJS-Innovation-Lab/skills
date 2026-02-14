/**
 * Metrics Tracker - Monitor system usage and costs
 * 
 * Tracks: events, decisions, procedures, file sizes, token costs
 */

const fs = require('fs');
const path = require('path');

class MetricsTracker {
  constructor(learningDir) {
    this.learningDir = learningDir;
    this.metricsFile = path.join(learningDir, 'metrics.json');
    this.statusFile = path.join(learningDir, 'status.json');
  }

  /**
   * Safe JSON operations
   */
  safeParseJSON(filePath, defaultValue) {
    try {
      if (!fs.existsSync(filePath)) return defaultValue;
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      return defaultValue;
    }
  }

  safeWriteJSON(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get file size in KB
   */
  getFileSizeKB(filePath) {
    try {
      if (!fs.existsSync(filePath)) return 0;
      const stats = fs.statSync(filePath);
      return Math.round(stats.size / 1024 * 10) / 10;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Count lines in JSONL file
   */
  countLines(filePath) {
    try {
      if (!fs.existsSync(filePath)) return 0;
      const content = fs.readFileSync(filePath, 'utf-8');
      return content.trim().split('\n').filter(l => l).length;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Count JSON files in directory
   */
  countFilesInDir(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) return 0;
      return fs.readdirSync(dirPath).filter(f => f.endsWith('.json')).length;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Calculate directory size in KB
   */
  getDirSizeKB(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) return 0;
      let total = 0;
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          total += stats.size;
        } else if (stats.isDirectory()) {
          total += this.getDirSizeKB(filePath) * 1024; // Convert back to bytes
        }
      }
      return Math.round(total / 1024 * 10) / 10;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Collect all metrics
   */
  async collectMetrics() {
    const status = this.safeParseJSON(this.statusFile, { metrics: {} });
    
    const metrics = {
      collected_at: new Date().toISOString(),
      
      // Counts from status
      counts: {
        events_logged: status.metrics.events_logged || 0,
        decisions_logged: status.metrics.decisions_logged || 0,
        procedures_active: status.metrics.procedures_active || 0,
        procedures_candidates: status.metrics.procedures_candidates || 0,
        evolutions_applied: status.metrics.evolutions_applied || 0,
        evolutions_rolled_back: status.metrics.evolutions_rolled_back || 0
      },
      
      // File counts
      files: {
        events: this.countLines(path.join(this.learningDir, 'events', 'events.jsonl')),
        failures: this.countLines(path.join(this.learningDir, 'failures', 'log.jsonl')),
        evolution_history: this.countLines(path.join(this.learningDir, 'evolution', 'history.jsonl')),
        decision_days: this.countFilesInDir(path.join(this.learningDir, 'decisions')),
        episodes: this.countFilesInDir(path.join(this.learningDir, 'memory', 'episodic', 'episodes')),
        active_procedures: this.countFilesInDir(path.join(this.learningDir, 'procedures', 'active')),
        candidate_procedures: this.countFilesInDir(path.join(this.learningDir, 'procedures', 'candidates')),
        active_goals: this.countFilesInDir(path.join(this.learningDir, 'goals', 'active')),
        completed_goals: this.countFilesInDir(path.join(this.learningDir, 'goals', 'completed'))
      },
      
      // Storage sizes (KB)
      storage_kb: {
        total: this.getDirSizeKB(this.learningDir),
        events: this.getFileSizeKB(path.join(this.learningDir, 'events', 'events.jsonl')),
        decisions: this.getDirSizeKB(path.join(this.learningDir, 'decisions')),
        procedures: this.getDirSizeKB(path.join(this.learningDir, 'procedures')),
        memory: this.getDirSizeKB(path.join(this.learningDir, 'memory')),
        failures: this.getFileSizeKB(path.join(this.learningDir, 'failures', 'log.jsonl')),
        evolution: this.getDirSizeKB(path.join(this.learningDir, 'evolution')),
        goals: this.getDirSizeKB(path.join(this.learningDir, 'goals'))
      },
      
      // FSM state
      fsm: this.safeParseJSON(path.join(this.learningDir, 'evolution', 'state.json'), {}),
      
      // Phase
      phase: status.phase || 'A',
      phase_name: status.phase_name || 'Passive'
    };

    // Save metrics history
    const historyFile = path.join(this.learningDir, 'metrics-history.jsonl');
    fs.appendFileSync(historyFile, JSON.stringify(metrics) + '\n');

    return metrics;
  }

  /**
   * Generate human-readable report
   */
  async generateReport() {
    const metrics = await this.collectMetrics();
    
    let report = `# Agentic Learning System - Metrics Report\n\n`;
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Phase:** ${metrics.phase} (${metrics.phase_name})\n`;
    report += `**FSM State:** ${metrics.fsm.state || 'UNKNOWN'}\n\n`;
    
    report += `## Activity Counts\n\n`;
    report += `| Metric | Count |\n`;
    report += `|--------|-------|\n`;
    report += `| Events logged | ${metrics.counts.events_logged} |\n`;
    report += `| Decisions logged | ${metrics.counts.decisions_logged} |\n`;
    report += `| Active procedures | ${metrics.counts.procedures_active} |\n`;
    report += `| Candidate procedures | ${metrics.counts.procedures_candidates} |\n`;
    report += `| Evolutions applied | ${metrics.counts.evolutions_applied} |\n`;
    report += `| Evolutions rolled back | ${metrics.counts.evolutions_rolled_back} |\n\n`;
    
    report += `## File Counts\n\n`;
    report += `| File Type | Count |\n`;
    report += `|-----------|-------|\n`;
    report += `| Event entries | ${metrics.files.events} |\n`;
    report += `| Failure entries | ${metrics.files.failures} |\n`;
    report += `| Decision days | ${metrics.files.decision_days} |\n`;
    report += `| Episodes | ${metrics.files.episodes} |\n`;
    report += `| Active procedures | ${metrics.files.active_procedures} |\n`;
    report += `| Candidate procedures | ${metrics.files.candidate_procedures} |\n`;
    report += `| Active goals | ${metrics.files.active_goals} |\n`;
    report += `| Completed goals | ${metrics.files.completed_goals} |\n\n`;
    
    report += `## Storage Usage\n\n`;
    report += `| Component | Size (KB) |\n`;
    report += `|-----------|----------|\n`;
    report += `| **Total** | **${metrics.storage_kb.total}** |\n`;
    report += `| Events | ${metrics.storage_kb.events} |\n`;
    report += `| Decisions | ${metrics.storage_kb.decisions} |\n`;
    report += `| Procedures | ${metrics.storage_kb.procedures} |\n`;
    report += `| Memory | ${metrics.storage_kb.memory} |\n`;
    report += `| Failures | ${metrics.storage_kb.failures} |\n`;
    report += `| Evolution | ${metrics.storage_kb.evolution} |\n`;
    report += `| Goals | ${metrics.storage_kb.goals} |\n\n`;
    
    // Warnings
    const warnings = [];
    if (metrics.storage_kb.total > 1000) {
      warnings.push(`⚠️ Total storage exceeds 1MB (${metrics.storage_kb.total}KB)`);
    }
    if (metrics.storage_kb.events > 500) {
      warnings.push(`⚠️ Events log exceeds 500KB - consider rotation`);
    }
    if (metrics.counts.evolutions_rolled_back > metrics.counts.evolutions_applied * 0.3) {
      warnings.push(`⚠️ High rollback rate (${metrics.counts.evolutions_rolled_back}/${metrics.counts.evolutions_applied})`);
    }
    
    if (warnings.length > 0) {
      report += `## ⚠️ Warnings\n\n`;
      for (const w of warnings) {
        report += `- ${w}\n`;
      }
      report += `\n`;
    }
    
    return report;
  }

  /**
   * Get metrics history for trend analysis
   */
  async getHistory(days = 7) {
    const historyFile = path.join(this.learningDir, 'metrics-history.jsonl');
    if (!fs.existsSync(historyFile)) return [];
    
    const content = fs.readFileSync(historyFile, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l);
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return lines
      .map(l => {
        try { return JSON.parse(l); } catch { return null; }
      })
      .filter(m => m && new Date(m.collected_at) >= cutoff);
  }
}

module.exports = { MetricsTracker };
