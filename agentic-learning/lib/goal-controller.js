/**
 * Goal-Directed Controller
 * 
 * Manages explicit goals with Plan → Act → Observe → Adapt loops.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class GoalController {
  constructor(learningDir) {
    this.learningDir = learningDir;
    this.activeDir = path.join(learningDir, 'goals', 'active');
    this.completedDir = path.join(learningDir, 'goals', 'completed');
    this.adaptationsFile = path.join(learningDir, 'goals', 'adaptations.jsonl');
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
      console.error('[goal-controller] Write error:', e.message);
      return false;
    }
  }

  /**
   * Generate goal ID
   */
  generateId() {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const random = crypto.randomBytes(3).toString('hex');
    return `goal_${timestamp}_${random}`;
  }

  /**
   * Create a new goal
   */
  async createGoal(goal) {
    const id = this.generateId();
    
    const fullGoal = {
      id,
      description: goal.description,
      created_at: new Date().toISOString(),
      status: 'active',
      
      // Plan
      plan: (goal.steps || []).map((step, i) => ({
        step: i + 1,
        action: step.action || step,
        description: step.description || null,
        status: 'pending',
        started_at: null,
        completed_at: null,
        outcome: null
      })),
      
      current_step: 1,
      
      // Tracking
      adaptations: [],
      linked: {
        procedures_used: [],
        decisions: [],
        session_key: goal.session_key || null
      },
      
      // Metadata
      metadata: goal.metadata || {},
      priority: goal.priority || 'normal',
      deadline: goal.deadline || null
    };

    // Save to active goals
    const goalPath = path.join(this.activeDir, `${id}.json`);
    this.safeWriteJSON(goalPath, fullGoal);

    return fullGoal;
  }

  /**
   * Get active goal by ID
   */
  async getGoal(goalId) {
    const goalPath = path.join(this.activeDir, `${goalId}.json`);
    return this.safeParseJSON(goalPath, null);
  }

  /**
   * Get all active goals
   */
  async getActiveGoals() {
    try {
      const files = fs.readdirSync(this.activeDir).filter(f => f.endsWith('.json'));
      return files.map(f => this.safeParseJSON(path.join(this.activeDir, f), null))
        .filter(Boolean);
    } catch (e) {
      return [];
    }
  }

  /**
   * Start a step (Act phase)
   */
  async startStep(goalId, stepNumber = null) {
    const goal = await this.getGoal(goalId);
    if (!goal) throw new Error(`Goal not found: ${goalId}`);

    const step = stepNumber || goal.current_step;
    const planStep = goal.plan.find(s => s.step === step);
    
    if (!planStep) throw new Error(`Step ${step} not found in plan`);

    planStep.status = 'in_progress';
    planStep.started_at = new Date().toISOString();
    goal.current_step = step;

    const goalPath = path.join(this.activeDir, `${goalId}.json`);
    this.safeWriteJSON(goalPath, goal);

    return { goal, step: planStep };
  }

  /**
   * Complete a step (Observe phase)
   */
  async completeStep(goalId, stepNumber, outcome) {
    const goal = await this.getGoal(goalId);
    if (!goal) throw new Error(`Goal not found: ${goalId}`);

    const planStep = goal.plan.find(s => s.step === stepNumber);
    if (!planStep) throw new Error(`Step ${stepNumber} not found in plan`);

    planStep.status = outcome.success ? 'completed' : 'failed';
    planStep.completed_at = new Date().toISOString();
    planStep.outcome = {
      success: outcome.success,
      result: outcome.result || null,
      feedback: outcome.feedback || null
    };

    // Move to next step if successful
    if (outcome.success && goal.current_step === stepNumber) {
      const nextStep = goal.plan.find(s => s.step === stepNumber + 1);
      if (nextStep) {
        goal.current_step = stepNumber + 1;
      }
    }

    // Check if goal is complete
    const allComplete = goal.plan.every(s => s.status === 'completed');
    const anyFailed = goal.plan.some(s => s.status === 'failed');

    if (allComplete) {
      goal.status = 'completed';
      goal.completed_at = new Date().toISOString();
    } else if (anyFailed && !outcome.continue_on_failure) {
      goal.status = 'blocked';
    }

    const goalPath = path.join(this.activeDir, `${goalId}.json`);
    this.safeWriteJSON(goalPath, goal);

    // Move to completed if done
    if (goal.status === 'completed') {
      await this.archiveGoal(goalId);
    }

    return { goal, step: planStep, isComplete: goal.status === 'completed' };
  }

  /**
   * Adapt the plan (Adapt phase)
   */
  async adaptPlan(goalId, adaptation) {
    const goal = await this.getGoal(goalId);
    if (!goal) throw new Error(`Goal not found: ${goalId}`);

    const adaptationRecord = {
      id: `adapt_${Date.now()}`,
      at_step: goal.current_step,
      timestamp: new Date().toISOString(),
      reason: adaptation.reason,
      change_type: adaptation.type, // 'add_step', 'remove_step', 'modify_step', 'reorder'
      details: adaptation.details || {}
    };

    // Apply the adaptation
    switch (adaptation.type) {
      case 'add_step':
        const newStep = {
          step: goal.plan.length + 1,
          action: adaptation.action,
          description: adaptation.description || null,
          status: 'pending',
          started_at: null,
          completed_at: null,
          outcome: null
        };
        
        if (adaptation.after_step) {
          // Insert after specific step
          const insertIdx = goal.plan.findIndex(s => s.step === adaptation.after_step);
          if (insertIdx !== -1) {
            goal.plan.splice(insertIdx + 1, 0, newStep);
            // Renumber steps
            goal.plan.forEach((s, i) => s.step = i + 1);
          } else {
            goal.plan.push(newStep);
          }
        } else {
          goal.plan.push(newStep);
        }
        adaptationRecord.details.added_step = newStep;
        break;

      case 'remove_step':
        const removeIdx = goal.plan.findIndex(s => s.step === adaptation.step);
        if (removeIdx !== -1) {
          const removed = goal.plan.splice(removeIdx, 1)[0];
          goal.plan.forEach((s, i) => s.step = i + 1);
          adaptationRecord.details.removed_step = removed;
        }
        break;

      case 'modify_step':
        const modifyStep = goal.plan.find(s => s.step === adaptation.step);
        if (modifyStep) {
          if (adaptation.action) modifyStep.action = adaptation.action;
          if (adaptation.description) modifyStep.description = adaptation.description;
          adaptationRecord.details.modified = { step: adaptation.step, changes: adaptation };
        }
        break;

      case 'retry_step':
        const retryStep = goal.plan.find(s => s.step === adaptation.step);
        if (retryStep) {
          retryStep.status = 'pending';
          retryStep.outcome = null;
          goal.current_step = adaptation.step;
          adaptationRecord.details.retry_step = adaptation.step;
        }
        break;
    }

    // Record adaptation
    goal.adaptations.push(adaptationRecord);

    // Save goal
    const goalPath = path.join(this.activeDir, `${goalId}.json`);
    this.safeWriteJSON(goalPath, goal);

    // Log to adaptations file
    fs.appendFileSync(this.adaptationsFile, JSON.stringify({
      goal_id: goalId,
      ...adaptationRecord
    }) + '\n');

    return { goal, adaptation: adaptationRecord };
  }

  /**
   * Archive completed goal
   */
  async archiveGoal(goalId) {
    const sourcePath = path.join(this.activeDir, `${goalId}.json`);
    const destPath = path.join(this.completedDir, `${goalId}.json`);

    try {
      if (fs.existsSync(sourcePath)) {
        const goal = this.safeParseJSON(sourcePath, null);
        if (goal) {
          goal.archived_at = new Date().toISOString();
          this.safeWriteJSON(destPath, goal);
          fs.unlinkSync(sourcePath);
        }
      }
      return true;
    } catch (e) {
      console.error('[goal-controller] Archive error:', e.message);
      return false;
    }
  }

  /**
   * Cancel a goal
   */
  async cancelGoal(goalId, reason) {
    const goal = await this.getGoal(goalId);
    if (!goal) throw new Error(`Goal not found: ${goalId}`);

    goal.status = 'cancelled';
    goal.cancelled_at = new Date().toISOString();
    goal.cancel_reason = reason;

    const goalPath = path.join(this.activeDir, `${goalId}.json`);
    this.safeWriteJSON(goalPath, goal);

    await this.archiveGoal(goalId);

    return goal;
  }

  /**
   * Get goal progress summary
   */
  async getProgress(goalId) {
    const goal = await this.getGoal(goalId);
    if (!goal) return null;

    const completed = goal.plan.filter(s => s.status === 'completed').length;
    const total = goal.plan.length;

    return {
      goal_id: goalId,
      description: goal.description,
      status: goal.status,
      progress: `${completed}/${total}`,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      current_step: goal.current_step,
      current_action: goal.plan.find(s => s.step === goal.current_step)?.action,
      adaptations_count: goal.adaptations.length
    };
  }
}

module.exports = { GoalController };
