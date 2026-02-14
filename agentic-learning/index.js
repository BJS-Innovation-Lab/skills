/**
 * Agentic Learning System
 * 
 * Self-improving memory, decision-making, and evolution for AI agents.
 * 
 * @module agentic-learning
 */

const { EventStore } = require('./lib/event-store');
const { DecisionStore } = require('./lib/decision-store');
const { ProcedureStore } = require('./lib/procedure-store');
const { EvolutionFSM, STATES } = require('./lib/evolution-fsm');
const { PreDecisionRAG } = require('./lib/pre-decision-rag');
const { GoalController } = require('./lib/goal-controller');
const { SkillCreator } = require('./lib/skill-creator');
const { MemoryConsolidator } = require('./lib/memory-consolidator');

/**
 * Create a complete learning system instance
 * 
 * @param {string} learningDir - Path to learning directory
 * @param {string} workspaceDir - Path to workspace directory (optional)
 * @returns {Object} Learning system instance with all components
 */
function createLearningSystem(learningDir, workspaceDir = null) {
  const workspace = workspaceDir || require('path').dirname(learningDir);
  
  return {
    // Core stores
    events: new EventStore(learningDir),
    decisions: new DecisionStore(learningDir),
    procedures: new ProcedureStore(learningDir),
    
    // Memory hierarchy
    memory: new MemoryConsolidator(learningDir),
    
    // Decision support
    rag: new PreDecisionRAG(learningDir),
    
    // Goal management
    goals: new GoalController(learningDir),
    
    // Evolution
    fsm: new EvolutionFSM(learningDir),
    
    // Skill creation
    skills: new SkillCreator(learningDir, workspace),
    
    // Utility
    learningDir,
    workspaceDir: workspace
  };
}

module.exports = {
  // Factory
  createLearningSystem,
  
  // Individual components
  EventStore,
  DecisionStore,
  ProcedureStore,
  EvolutionFSM,
  PreDecisionRAG,
  GoalController,
  SkillCreator,
  MemoryConsolidator,
  
  // Constants
  STATES
};
