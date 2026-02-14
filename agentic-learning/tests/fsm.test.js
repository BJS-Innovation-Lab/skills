/**
 * Evolution FSM Tests
 * 
 * Run: node skills/agentic-learning/tests/fsm.test.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Create temp directory for tests
const testDir = path.join(os.tmpdir(), `agentic-learning-test-${Date.now()}`);
const learningDir = path.join(testDir, 'learning');

// Setup
function setup() {
  fs.mkdirSync(path.join(learningDir, 'evolution'), { recursive: true });
  fs.writeFileSync(path.join(learningDir, 'status.json'), JSON.stringify({
    metrics: {}
  }));
}

// Cleanup
function cleanup() {
  fs.rmSync(testDir, { recursive: true, force: true });
}

// Test runner
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${e.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

// Import FSM
const { EvolutionFSM, STATES } = require('../lib/evolution-fsm.js');

// Run tests
console.log('\n🧪 Evolution FSM Tests\n');

setup();

try {
  const fsm = new EvolutionFSM(learningDir);

  // Test 1: Initial state
  test('Initial state is STABLE', () => {
    const state = fsm.getState();
    assert(state.state === 'STABLE', `Expected STABLE, got ${state.state}`);
  });

  // Test 2: Valid transition STABLE → LEARNING
  test('Transition STABLE → LEARNING', async () => {
    await fsm.transition('LEARNING', 'Test evidence', { pending: { type: 'test' } });
    const state = fsm.getState();
    assert(state.state === 'LEARNING', `Expected LEARNING, got ${state.state}`);
  });

  // Test 3: Valid transition LEARNING → EVOLVING
  test('Transition LEARNING → EVOLVING', async () => {
    await fsm.transition('EVOLVING', 'Threshold met');
    const state = fsm.getState();
    assert(state.state === 'EVOLVING', `Expected EVOLVING, got ${state.state}`);
  });

  // Test 4: Valid transition EVOLVING → STABLE
  test('Transition EVOLVING → STABLE', async () => {
    await fsm.transition('STABLE', 'Evolution complete');
    const state = fsm.getState();
    assert(state.state === 'STABLE', `Expected STABLE, got ${state.state}`);
  });

  // Test 5: Invalid transition STABLE → EVOLVING
  test('Invalid transition STABLE → EVOLVING throws', async () => {
    let threw = false;
    try {
      await fsm.transition('EVOLVING', 'Should fail');
    } catch (e) {
      threw = true;
      assert(e.message.includes('Invalid transition'), 'Wrong error message');
    }
    assert(threw, 'Should have thrown an error');
  });

  // Test 6: Force reset
  test('Force reset returns to STABLE', async () => {
    // Get to LEARNING first
    await fsm.transition('LEARNING', 'Test');
    // Force reset
    await fsm.forceReset('Emergency reset');
    const state = fsm.getState();
    assert(state.state === 'STABLE', `Expected STABLE, got ${state.state}`);
  });

  // Test 7: Add evidence
  test('Add evidence triggers LEARNING', async () => {
    await fsm.addEvidence({ type: 'test', pattern: 'test pattern', threshold: 3 });
    const state = fsm.getState();
    assert(state.state === 'LEARNING', `Expected LEARNING, got ${state.state}`);
  });

  // Test 8: History is recorded
  test('History is recorded', async () => {
    const history = await fsm.getHistory(10);
    assert(history.length > 0, 'History should not be empty');
    assert(history[0].from !== undefined, 'History should have from field');
    assert(history[0].to !== undefined, 'History should have to field');
  });

  // Test 9: Cancel learning
  test('Cancel learning returns to STABLE', async () => {
    await fsm.cancelLearning('User cancelled');
    const state = fsm.getState();
    assert(state.state === 'STABLE', `Expected STABLE, got ${state.state}`);
  });

} finally {
  cleanup();
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
