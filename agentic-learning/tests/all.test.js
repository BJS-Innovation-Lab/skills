/**
 * Agentic Learning System - Full Test Suite
 * 
 * Run: node skills/agentic-learning/tests/all.test.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Create temp directory for tests
const testDir = path.join(os.tmpdir(), `agentic-learning-test-${Date.now()}`);
const learningDir = path.join(testDir, 'learning');
const workspaceDir = testDir;

// Setup directories
function setup() {
  const dirs = [
    'events',
    'memory/working',
    'memory/episodic/episodes',
    'memory/semantic',
    'procedures/active',
    'procedures/candidates',
    'decisions',
    'goals/active',
    'goals/completed',
    'failures',
    'evolution'
  ];
  
  for (const dir of dirs) {
    fs.mkdirSync(path.join(learningDir, dir), { recursive: true });
  }
  
  fs.mkdirSync(path.join(workspaceDir, 'skills'), { recursive: true });
  
  // Create status file
  fs.writeFileSync(path.join(learningDir, 'status.json'), JSON.stringify({ metrics: {} }));
}

// Cleanup
function cleanup() {
  fs.rmSync(testDir, { recursive: true, force: true });
}

// Test runner
let passed = 0;
let failed = 0;
let currentSuite = '';

function suite(name) {
  currentSuite = name;
  console.log(`\n📦 ${name}\n`);
}

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${e.message}`);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

// =========================================
// RUN TESTS
// =========================================

console.log('\n🧪 Agentic Learning System - Full Test Suite\n');
console.log('='.repeat(50));

setup();

(async () => {
  try {
    
    // -----------------------------------------
    // EVENT STORE
    // -----------------------------------------
    suite('EventStore');
    
    const { EventStore } = require('../lib/event-store');
    const events = new EventStore(learningDir);
    
    await testAsync('Append event', async () => {
      const event = await events.append({
        type: 'decision',
        action: 'test',
        data: { foo: 'bar' }
      });
      assert(event.id.startsWith('evt_'), 'Event ID should start with evt_');
      assert(event.type === 'decision', 'Event type should be decision');
    });
    
    await testAsync('Query events', async () => {
      const results = await events.query({ type: 'decision' });
      assert(results.length > 0, 'Should find at least one event');
    });
    
    // -----------------------------------------
    // DECISION STORE
    // -----------------------------------------
    suite('DecisionStore');
    
    const { DecisionStore } = require('../lib/decision-store');
    const decisions = new DecisionStore(learningDir);
    
    await testAsync('Log decision', async () => {
      const dec = await decisions.log({
        context: 'Test decision context',
        chosen: 'Option A',
        reasoning: 'Because testing'
      });
      assert(dec.id.startsWith('dec_'), 'Decision ID should start with dec_');
    });
    
    await testAsync('Search decisions', async () => {
      const results = await decisions.search('test');
      assert(results.length > 0, 'Should find at least one decision');
    });
    
    // -----------------------------------------
    // PROCEDURE STORE
    // -----------------------------------------
    suite('ProcedureStore');
    
    const { ProcedureStore } = require('../lib/procedure-store');
    const procedures = new ProcedureStore(learningDir);
    
    await testAsync('Add candidate procedure', async () => {
      const proc = await procedures.addCandidate({
        name: 'test_procedure',
        trigger_patterns: ['test'],
        steps: [{ action: 'step1' }, { action: 'step2' }]
      });
      assert(proc.id === 'proc_test_procedure', 'Procedure ID should match');
      assert(proc.metrics.occurrences === 1, 'Occurrences should be 1');
    });
    
    await testAsync('Increment occurrences', async () => {
      const proc = await procedures.addCandidate({
        name: 'test_procedure'
      });
      assert(proc.metrics.occurrences === 2, 'Occurrences should be 2');
    });
    
    await testAsync('Get candidates', async () => {
      const candidates = await procedures.getCandidates();
      assert(candidates.length > 0, 'Should have candidates');
    });
    
    // -----------------------------------------
    // EVOLUTION FSM
    // -----------------------------------------
    suite('EvolutionFSM');
    
    const { EvolutionFSM } = require('../lib/evolution-fsm');
    const fsm = new EvolutionFSM(learningDir);
    
    test('Initial state is STABLE', () => {
      const state = fsm.getState();
      assert(state.state === 'STABLE', `Expected STABLE, got ${state.state}`);
    });
    
    await testAsync('Transition STABLE → LEARNING', async () => {
      await fsm.transition('LEARNING', 'Test', { pending: {} });
      assert(fsm.getState().state === 'LEARNING');
    });
    
    await testAsync('Force reset', async () => {
      await fsm.forceReset('Test reset');
      assert(fsm.getState().state === 'STABLE');
    });
    
    // -----------------------------------------
    // PRE-DECISION RAG
    // -----------------------------------------
    suite('PreDecisionRAG');
    
    const { PreDecisionRAG } = require('../lib/pre-decision-rag');
    const rag = new PreDecisionRAG(learningDir);
    
    await testAsync('Retrieve context', async () => {
      const result = await rag.retrieve('test decision');
      assert(result.items !== undefined, 'Should have items');
      assert(result.counts !== undefined, 'Should have counts');
    });
    
    await testAsync('Format for injection', async () => {
      const result = await rag.retrieve('test');
      const formatted = rag.formatForInjection(result);
      // May be null if no matches, that's ok
      assert(formatted === null || typeof formatted === 'string');
    });
    
    // -----------------------------------------
    // GOAL CONTROLLER
    // -----------------------------------------
    suite('GoalController');
    
    const { GoalController } = require('../lib/goal-controller');
    const goals = new GoalController(learningDir);
    
    let testGoalId;
    
    await testAsync('Create goal', async () => {
      const goal = await goals.createGoal({
        description: 'Test goal',
        steps: ['Step 1', 'Step 2', 'Step 3']
      });
      testGoalId = goal.id;
      assert(goal.id.startsWith('goal_'));
      assert(goal.plan.length === 3);
    });
    
    await testAsync('Start step', async () => {
      const { step } = await goals.startStep(testGoalId, 1);
      assert(step.status === 'in_progress');
    });
    
    await testAsync('Complete step', async () => {
      const { step } = await goals.completeStep(testGoalId, 1, { success: true });
      assert(step.status === 'completed');
    });
    
    await testAsync('Adapt plan', async () => {
      const { adaptation } = await goals.adaptPlan(testGoalId, {
        type: 'add_step',
        action: 'New step',
        reason: 'Testing adaptation'
      });
      assert(adaptation.change_type === 'add_step');
    });
    
    await testAsync('Get progress', async () => {
      const progress = await goals.getProgress(testGoalId);
      assert(progress.percent >= 0);
    });
    
    // -----------------------------------------
    // SKILL CREATOR
    // -----------------------------------------
    suite('SkillCreator');
    
    const { SkillCreator } = require('../lib/skill-creator');
    const skills = new SkillCreator(learningDir, workspaceDir);
    
    await testAsync('Create skill from procedure', async () => {
      const result = await skills.fromProcedure({
        id: 'proc_test',
        name: 'test_skill',
        description: 'A test skill',
        steps: [{ action: 'test' }]
      });
      assert(result.is_draft === true);
      assert(fs.existsSync(result.path));
    });
    
    await testAsync('List drafts', async () => {
      const drafts = await skills.listDrafts();
      assert(drafts.length > 0);
    });
    
    await testAsync('Promote draft', async () => {
      // Get actual draft name from list
      const drafts = await skills.listDrafts();
      if (drafts.length > 0) {
        const result = await skills.promoteDraft(drafts[0].name);
        assert(result.path.includes(drafts[0].name));
        assert(!result.path.includes('draft-'));
      }
    });
    
    // -----------------------------------------
    // MEMORY CONSOLIDATOR
    // -----------------------------------------
    suite('MemoryConsolidator');
    
    const { MemoryConsolidator } = require('../lib/memory-consolidator');
    const memory = new MemoryConsolidator(learningDir);
    
    await testAsync('Save to working memory', async () => {
      const result = await memory.saveToWorking('test_key', { data: 'test' });
      assert(result === true);
    });
    
    await testAsync('Get from working memory', async () => {
      const data = await memory.getFromWorking('test_key');
      assert(data.data === 'test');
    });
    
    await testAsync('Consolidate session', async () => {
      const episode = await memory.consolidateSession({
        summary: 'Test session',
        decisions: [{ context: 'Test decision' }]
      });
      assert(episode.id.startsWith('ep_'));
    });
    
    await testAsync('Save preference', async () => {
      await memory.savePreference('test_pref', 'value123');
      const value = await memory.getPreference('test_pref');
      assert(value === 'value123');
    });
    
    // -----------------------------------------
    // INTEGRATION
    // -----------------------------------------
    suite('Integration');
    
    const { createLearningSystem } = require('../index');
    
    test('Create learning system', () => {
      const system = createLearningSystem(learningDir, workspaceDir);
      assert(system.events !== undefined);
      assert(system.decisions !== undefined);
      assert(system.procedures !== undefined);
      assert(system.memory !== undefined);
      assert(system.rag !== undefined);
      assert(system.goals !== undefined);
      assert(system.fsm !== undefined);
      assert(system.skills !== undefined);
    });
    
  } finally {
    cleanup();
  }
  
  // Results
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  process.exit(failed > 0 ? 1 : 0);
})();
