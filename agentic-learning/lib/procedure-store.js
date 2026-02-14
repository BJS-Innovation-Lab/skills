/**
 * Procedure Store - Reusable action sequences
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ProcedureStore {
  constructor(learningDir) {
    this.learningDir = learningDir;
    this.activeDir = path.join(learningDir, 'procedures', 'active');
    this.candidatesDir = path.join(learningDir, 'procedures', 'candidates');
    this.metricsFile = path.join(learningDir, 'procedures', 'metrics.json');
    this.statusFile = path.join(learningDir, 'status.json');
  }

  /**
   * Generate procedure ID
   */
  generateId(name) {
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20);
    return `proc_${safeName}`;
  }

  /**
   * Create or update a candidate procedure
   */
  async addCandidate(procedure) {
    const id = procedure.id || this.generateId(procedure.name);
    const candidatePath = path.join(this.candidatesDir, `${id}.json`);

    let existing = null;
    if (fs.existsSync(candidatePath)) {
      existing = JSON.parse(fs.readFileSync(candidatePath, 'utf-8'));
    }

    const fullProcedure = {
      id,
      name: procedure.name,
      description: procedure.description || null,
      trigger: {
        patterns: procedure.trigger_patterns || [],
        context: procedure.trigger_context || []
      },
      steps: procedure.steps || [],
      source_episodes: existing?.source_episodes || [],
      metrics: existing?.metrics || {
        occurrences: 0,
        executions: 0,
        successes: 0,
        success_rate: null
      },
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'candidate'
    };

    // Add source episode if provided
    if (procedure.source_episode) {
      if (!fullProcedure.source_episodes.includes(procedure.source_episode)) {
        fullProcedure.source_episodes.push(procedure.source_episode);
      }
    }

    // Increment occurrence count
    fullProcedure.metrics.occurrences++;

    fs.writeFileSync(candidatePath, JSON.stringify(fullProcedure, null, 2));
    return fullProcedure;
  }

  /**
   * Promote candidate to active procedure
   */
  async promote(procedureId) {
    const candidatePath = path.join(this.candidatesDir, `${procedureId}.json`);
    const activePath = path.join(this.activeDir, `${procedureId}.json`);

    if (!fs.existsSync(candidatePath)) {
      throw new Error(`Candidate procedure not found: ${procedureId}`);
    }

    const procedure = JSON.parse(fs.readFileSync(candidatePath, 'utf-8'));
    procedure.status = 'active';
    procedure.promoted_at = new Date().toISOString();

    // Write to active
    fs.writeFileSync(activePath, JSON.stringify(procedure, null, 2));
    
    // Remove from candidates
    fs.unlinkSync(candidatePath);

    // Update metrics
    this.updateStatusMetric('procedures_active', 1);
    this.updateStatusMetric('procedures_candidates', -1);

    return procedure;
  }

  /**
   * Record procedure execution
   */
  async recordExecution(procedureId, success) {
    // Check active first, then candidates
    let procedurePath = path.join(this.activeDir, `${procedureId}.json`);
    if (!fs.existsSync(procedurePath)) {
      procedurePath = path.join(this.candidatesDir, `${procedureId}.json`);
    }

    if (!fs.existsSync(procedurePath)) {
      return null;
    }

    const procedure = JSON.parse(fs.readFileSync(procedurePath, 'utf-8'));
    
    procedure.metrics.executions++;
    if (success) {
      procedure.metrics.successes++;
    }
    procedure.metrics.success_rate = procedure.metrics.successes / procedure.metrics.executions;
    procedure.metrics.last_used = new Date().toISOString();

    fs.writeFileSync(procedurePath, JSON.stringify(procedure, null, 2));

    // Update global metrics
    this.updateGlobalMetrics(success);

    return procedure;
  }

  /**
   * Find matching procedure for context
   */
  async findMatch(context) {
    const contextLower = context.toLowerCase();
    
    // Check active procedures first
    const activeFiles = fs.readdirSync(this.activeDir).filter(f => f.endsWith('.json'));
    
    for (const file of activeFiles) {
      const procedure = JSON.parse(fs.readFileSync(path.join(this.activeDir, file), 'utf-8'));
      
      // Check trigger patterns
      for (const pattern of procedure.trigger.patterns) {
        if (contextLower.includes(pattern.toLowerCase())) {
          return procedure;
        }
      }
      
      // Check context keywords
      for (const keyword of procedure.trigger.context) {
        if (contextLower.includes(keyword.toLowerCase())) {
          return procedure;
        }
      }
    }

    return null;
  }

  /**
   * Get all active procedures
   */
  async getActive() {
    const files = fs.readdirSync(this.activeDir).filter(f => f.endsWith('.json'));
    return files.map(f => JSON.parse(fs.readFileSync(path.join(this.activeDir, f), 'utf-8')));
  }

  /**
   * Get all candidates
   */
  async getCandidates() {
    const files = fs.readdirSync(this.candidatesDir).filter(f => f.endsWith('.json'));
    return files.map(f => JSON.parse(fs.readFileSync(path.join(this.candidatesDir, f), 'utf-8')));
  }

  /**
   * Get candidates ready for promotion
   */
  async getReadyForPromotion(minOccurrences = 3, minSuccessRate = 0.7) {
    const candidates = await this.getCandidates();
    return candidates.filter(c => 
      c.metrics.occurrences >= minOccurrences &&
      (c.metrics.success_rate === null || c.metrics.success_rate >= minSuccessRate)
    );
  }

  /**
   * Update global metrics
   */
  updateGlobalMetrics(success) {
    let metrics = { total_executions: 0, total_successes: 0 };
    if (fs.existsSync(this.metricsFile)) {
      metrics = JSON.parse(fs.readFileSync(this.metricsFile, 'utf-8'));
    }

    metrics.total_executions++;
    if (success) {
      metrics.total_successes++;
    }
    metrics.success_rate = metrics.total_successes / metrics.total_executions;
    metrics.last_updated = new Date().toISOString();

    fs.writeFileSync(this.metricsFile, JSON.stringify(metrics, null, 2));
  }

  /**
   * Update status metric
   */
  updateStatusMetric(metric, delta) {
    try {
      const status = JSON.parse(fs.readFileSync(this.statusFile, 'utf-8'));
      status.metrics[metric] = (status.metrics[metric] || 0) + delta;
      status.last_updated = new Date().toISOString();
      fs.writeFileSync(this.statusFile, JSON.stringify(status, null, 2));
    } catch (e) {
      // Ignore errors
    }
  }
}

module.exports = { ProcedureStore };
