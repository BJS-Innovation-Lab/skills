/**
 * Evolution FSM - Governed self-modification
 * 
 * States: STABLE → LEARNING → EVOLVING → STABLE
 */

const fs = require('fs');
const path = require('path');

const STATES = {
  STABLE: 'STABLE',
  LEARNING: 'LEARNING',
  EVOLVING: 'EVOLVING'
};

class EvolutionFSM {
  constructor(learningDir) {
    this.learningDir = learningDir;
    this.stateFile = path.join(learningDir, 'evolution', 'state.json');
    this.pendingFile = path.join(learningDir, 'evolution', 'pending.json');
    this.historyFile = path.join(learningDir, 'evolution', 'history.jsonl');
    this.rollbackDir = path.join(learningDir, 'evolution', 'rollbacks');
    this.statusFile = path.join(learningDir, 'status.json');
    
    // Ensure rollback dir exists
    if (!fs.existsSync(this.rollbackDir)) {
      fs.mkdirSync(this.rollbackDir, { recursive: true });
    }
  }

  /**
   * Get current state
   */
  getState() {
    if (!fs.existsSync(this.stateFile)) {
      return { state: STATES.STABLE, entered_at: new Date().toISOString() };
    }
    return JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
  }

  /**
   * Transition to new state
   */
  async transition(newState, reason, data = {}) {
    const current = this.getState();
    
    // Validate transition
    if (!this.isValidTransition(current.state, newState)) {
      throw new Error(`Invalid transition: ${current.state} → ${newState}`);
    }

    const transition = {
      from: current.state,
      to: newState,
      at: new Date().toISOString(),
      reason,
      data
    };

    // Update state
    const newStateObj = {
      state: newState,
      entered_at: new Date().toISOString(),
      pending_evolution: newState === STATES.LEARNING ? data.pending : null,
      previous_state: current.state,
      transition_count: (current.transition_count || 0) + 1
    };

    fs.writeFileSync(this.stateFile, JSON.stringify(newStateObj, null, 2));

    // Log transition
    fs.appendFileSync(this.historyFile, JSON.stringify(transition) + '\n');

    return transition;
  }

  /**
   * Check if transition is valid
   */
  isValidTransition(from, to) {
    const validTransitions = {
      [STATES.STABLE]: [STATES.LEARNING],
      [STATES.LEARNING]: [STATES.STABLE, STATES.EVOLVING],
      [STATES.EVOLVING]: [STATES.STABLE]
    };
    
    return validTransitions[from]?.includes(to) || false;
  }

  /**
   * Add evidence for learning
   */
  async addEvidence(evidence) {
    const state = this.getState();
    
    // If STABLE, transition to LEARNING
    if (state.state === STATES.STABLE) {
      await this.transition(STATES.LEARNING, 'Evidence detected', {
        pending: {
          type: evidence.type,
          pattern: evidence.pattern,
          evidence: [evidence],
          threshold: evidence.threshold || 3,
          created_at: new Date().toISOString()
        }
      });
      return { transitioned: true, newState: STATES.LEARNING };
    }

    // If LEARNING, add to pending evidence
    if (state.state === STATES.LEARNING && state.pending_evolution) {
      state.pending_evolution.evidence.push(evidence);
      
      // Check if threshold reached
      const count = state.pending_evolution.evidence.length;
      const threshold = state.pending_evolution.threshold;
      
      fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
      
      if (count >= threshold) {
        return { 
          transitioned: false, 
          thresholdReached: true, 
          count, 
          threshold,
          readyToEvolve: true 
        };
      }
      
      return { transitioned: false, count, threshold };
    }

    return { transitioned: false, state: state.state };
  }

  /**
   * Get pending evolution
   */
  getPending() {
    const state = this.getState();
    return state.pending_evolution;
  }

  /**
   * Begin evolution (requires being in LEARNING state)
   */
  async beginEvolution(evolution) {
    const state = this.getState();
    
    if (state.state !== STATES.LEARNING) {
      throw new Error(`Cannot evolve from state: ${state.state}`);
    }

    // Save pending evolution details
    const pending = {
      id: `evo_${Date.now()}`,
      type: evolution.type,
      target: evolution.target,
      change: evolution.change,
      evidence: state.pending_evolution?.evidence || [],
      started_at: new Date().toISOString(),
      rollback_data: null
    };

    fs.writeFileSync(this.pendingFile, JSON.stringify(pending, null, 2));

    // Transition to EVOLVING
    await this.transition(STATES.EVOLVING, 'Evolution approved', { evolution: pending });

    return pending;
  }

  /**
   * Complete evolution successfully
   */
  async completeEvolution() {
    const state = this.getState();
    
    if (state.state !== STATES.EVOLVING) {
      throw new Error(`Cannot complete evolution from state: ${state.state}`);
    }

    // Clear pending
    fs.writeFileSync(this.pendingFile, 'null');

    // Update metrics
    this.updateMetric('evolutions_applied', 1);

    // Transition to STABLE
    await this.transition(STATES.STABLE, 'Evolution completed successfully');

    return { success: true };
  }

  /**
   * Rollback evolution
   */
  async rollback(reason) {
    const state = this.getState();
    
    if (state.state !== STATES.EVOLVING) {
      throw new Error(`Cannot rollback from state: ${state.state}`);
    }

    // Get pending evolution
    let pending = null;
    if (fs.existsSync(this.pendingFile)) {
      const content = fs.readFileSync(this.pendingFile, 'utf-8');
      if (content !== 'null') {
        pending = JSON.parse(content);
      }
    }

    // Save rollback record
    if (pending) {
      const rollbackFile = path.join(this.rollbackDir, `${pending.id}.json`);
      fs.writeFileSync(rollbackFile, JSON.stringify({
        ...pending,
        rolled_back_at: new Date().toISOString(),
        rollback_reason: reason
      }, null, 2));
    }

    // Clear pending
    fs.writeFileSync(this.pendingFile, 'null');

    // Update metrics
    this.updateMetric('evolutions_rolled_back', 1);

    // Transition to STABLE
    await this.transition(STATES.STABLE, `Rollback: ${reason}`);

    return { success: true, rolled_back: pending };
  }

  /**
   * Cancel learning (go back to STABLE without evolving)
   */
  async cancelLearning(reason) {
    const state = this.getState();
    
    if (state.state !== STATES.LEARNING) {
      throw new Error(`Cannot cancel learning from state: ${state.state}`);
    }

    await this.transition(STATES.STABLE, `Learning cancelled: ${reason}`);
    return { success: true };
  }

  /**
   * Force reset to STABLE (emergency)
   */
  async forceReset(reason) {
    const state = this.getState();
    
    // Clear pending
    fs.writeFileSync(this.pendingFile, 'null');

    // Direct state override
    const newState = {
      state: STATES.STABLE,
      entered_at: new Date().toISOString(),
      pending_evolution: null,
      previous_state: state.state,
      transition_count: (state.transition_count || 0) + 1,
      force_reset: true
    };

    fs.writeFileSync(this.stateFile, JSON.stringify(newState, null, 2));

    // Log
    fs.appendFileSync(this.historyFile, JSON.stringify({
      from: state.state,
      to: STATES.STABLE,
      at: new Date().toISOString(),
      reason: `FORCE RESET: ${reason}`,
      forced: true
    }) + '\n');

    return { success: true, from: state.state };
  }

  /**
   * Get transition history
   */
  async getHistory(limit = 20) {
    if (!fs.existsSync(this.historyFile)) return [];
    
    const content = fs.readFileSync(this.historyFile, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l);
    
    return lines.slice(-limit).map(l => JSON.parse(l));
  }

  /**
   * Update status metric
   */
  updateMetric(metric, delta) {
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

module.exports = { EvolutionFSM, STATES };
