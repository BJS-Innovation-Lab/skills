/**
 * Decision Store - Log decisions with context and track outcomes
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DecisionStore {
  constructor(learningDir) {
    this.learningDir = learningDir;
    this.decisionsDir = path.join(learningDir, 'decisions');
    this.outcomesFile = path.join(this.decisionsDir, 'outcomes.json');
    this.statusFile = path.join(learningDir, 'status.json');
  }

  /**
   * Get today's decision file path
   */
  getTodayFile() {
    const today = new Date().toISOString().split('T')[0];
    return path.join(this.decisionsDir, `${today}.json`);
  }

  /**
   * Generate decision ID
   */
  generateId() {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const random = crypto.randomBytes(3).toString('hex');
    return `dec_${timestamp}_${random}`;
  }

  /**
   * Log a decision
   * 
   * @param {Object} decision
   * @param {string} decision.context - What was the situation
   * @param {string} decision.question - What needed to be decided
   * @param {Array} decision.options - Options considered
   * @param {string} decision.chosen - Option chosen
   * @param {string} decision.reasoning - Why this option
   * @param {Object} decision.metadata - Additional context
   */
  async log(decision) {
    const id = this.generateId();
    
    const fullDecision = {
      id,
      timestamp: new Date().toISOString(),
      context: decision.context,
      question: decision.question || null,
      options_considered: decision.options || [],
      chosen: decision.chosen,
      reasoning: decision.reasoning || null,
      confidence: decision.confidence || null,
      metadata: decision.metadata || {},
      outcome: {
        status: 'pending',
        result: null,
        feedback: null
      },
      linked: {
        procedures_used: decision.procedures_used || [],
        similar_decisions: [],
        caused_by: decision.caused_by || null
      }
    };

    // Read or create today's file
    const todayFile = this.getTodayFile();
    let decisions = [];
    if (fs.existsSync(todayFile)) {
      decisions = JSON.parse(fs.readFileSync(todayFile, 'utf-8'));
    }

    // Append decision
    decisions.push(fullDecision);
    fs.writeFileSync(todayFile, JSON.stringify(decisions, null, 2));

    // Update metrics
    this.incrementMetric('decisions_logged');

    return fullDecision;
  }

  /**
   * Update decision outcome
   */
  async updateOutcome(decisionId, outcome) {
    // Find decision file (check recent days)
    const files = fs.readdirSync(this.decisionsDir)
      .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
      .sort()
      .reverse()
      .slice(0, 7); // Last 7 days

    for (const file of files) {
      const filePath = path.join(this.decisionsDir, file);
      const decisions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      const idx = decisions.findIndex(d => d.id === decisionId);
      if (idx !== -1) {
        decisions[idx].outcome = {
          ...decisions[idx].outcome,
          ...outcome,
          updated_at: new Date().toISOString()
        };
        fs.writeFileSync(filePath, JSON.stringify(decisions, null, 2));
        
        // Track outcome statistics
        this.trackOutcome(decisionId, outcome);
        return decisions[idx];
      }
    }

    return null;
  }

  /**
   * Track outcome statistics
   */
  trackOutcome(decisionId, outcome) {
    let outcomes = {};
    if (fs.existsSync(this.outcomesFile)) {
      outcomes = JSON.parse(fs.readFileSync(this.outcomesFile, 'utf-8'));
    }

    if (!outcomes.by_status) outcomes.by_status = {};
    const status = outcome.status || 'unknown';
    outcomes.by_status[status] = (outcomes.by_status[status] || 0) + 1;

    outcomes.last_updated = new Date().toISOString();
    fs.writeFileSync(this.outcomesFile, JSON.stringify(outcomes, null, 2));
  }

  /**
   * Search decisions
   */
  async search(query, options = {}) {
    const limit = options.limit || 10;
    const days = options.days || 30;
    
    // Get recent decision files
    const files = fs.readdirSync(this.decisionsDir)
      .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
      .sort()
      .reverse()
      .slice(0, days);

    let allDecisions = [];
    for (const file of files) {
      const filePath = path.join(this.decisionsDir, file);
      const decisions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      allDecisions.push(...decisions);
    }

    // Simple text search
    const queryLower = query.toLowerCase();
    const matches = allDecisions.filter(d => {
      const text = [
        d.context,
        d.question,
        d.chosen,
        d.reasoning,
        ...(d.options_considered || [])
      ].join(' ').toLowerCase();
      
      return text.includes(queryLower);
    });

    return matches.slice(0, limit);
  }

  /**
   * Get decisions with specific outcome
   */
  async getByOutcome(status, limit = 10) {
    const files = fs.readdirSync(this.decisionsDir)
      .filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.json$/))
      .sort()
      .reverse();

    let matches = [];
    for (const file of files) {
      if (matches.length >= limit) break;
      
      const filePath = path.join(this.decisionsDir, file);
      const decisions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      const filtered = decisions.filter(d => d.outcome?.status === status);
      matches.push(...filtered);
    }

    return matches.slice(0, limit);
  }

  /**
   * Increment status metric
   */
  incrementMetric(metric) {
    try {
      const status = JSON.parse(fs.readFileSync(this.statusFile, 'utf-8'));
      status.metrics[metric] = (status.metrics[metric] || 0) + 1;
      status.last_updated = new Date().toISOString();
      fs.writeFileSync(this.statusFile, JSON.stringify(status, null, 2));
    } catch (e) {
      // Ignore errors
    }
  }
}

module.exports = { DecisionStore };
