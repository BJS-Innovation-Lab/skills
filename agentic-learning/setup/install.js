#!/usr/bin/env node

/**
 * Agentic Learning System - Installation Script
 * 
 * Creates directory structure and default configuration.
 * Run from workspace: node skills/agentic-learning/setup/install.js
 */

const fs = require('fs');
const path = require('path');

// Resolve workspace directory
const workspaceDir = process.env.OPENCLAW_WORKSPACE || path.resolve(process.cwd());
const learningDir = path.join(workspaceDir, 'learning');

console.log('🧠 Agentic Learning System - Installation');
console.log('==========================================');
console.log(`Workspace: ${workspaceDir}`);
console.log(`Learning directory: ${learningDir}`);
console.log('');

// Directory structure to create
const directories = [
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

// Create directories
console.log('📁 Creating directory structure...');
for (const dir of directories) {
  const fullPath = path.join(learningDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`   ✓ ${dir}/`);
  } else {
    console.log(`   - ${dir}/ (exists)`);
  }
}
console.log('');

// Default configuration
const defaultConfig = `# Agentic Learning System Configuration
# See SKILL.md for full documentation

learning:
  enabled: true
  
  # Phase A - Passive (start here)
  event_logger:
    enabled: true
    log_all: false
    
  decision_logger:
    enabled: true
    capture_reasoning: true
    track_outcomes: true
    
  procedure_detector:
    enabled: true
    min_occurrences: 3
    
  # Phase B - Enrichment (enable after Phase A stable)
  pre_decision_rag:
    enabled: false
    max_context_items: 5
    
  hierarchical_memory:
    enabled: false
    
  # Phase C - Controlled Evolution
  goal_controller:
    enabled: false
    
  evolution_fsm:
    enabled: false
    require_approval: true
    evidence_threshold: 3
    auto_rollback: true
    
  # Phase D - Autonomous (careful!)
  auto_evolve:
    enabled: false
`;

// Write config if not exists
const configPath = path.join(learningDir, 'config.yaml');
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, defaultConfig);
  console.log('📄 Created config.yaml (Phase A - Passive mode)');
} else {
  console.log('📄 config.yaml exists (not overwriting)');
}

// Initial status
const initialStatus = {
  installed_at: new Date().toISOString(),
  version: '0.1.0',
  phase: 'A',
  phase_name: 'Passive',
  state: 'STABLE',
  metrics: {
    events_logged: 0,
    decisions_logged: 0,
    procedures_active: 0,
    procedures_candidates: 0,
    evolutions_applied: 0,
    evolutions_rolled_back: 0
  },
  last_updated: new Date().toISOString()
};

const statusPath = path.join(learningDir, 'status.json');
if (!fs.existsSync(statusPath)) {
  fs.writeFileSync(statusPath, JSON.stringify(initialStatus, null, 2));
  console.log('📊 Created status.json');
} else {
  console.log('📊 status.json exists (not overwriting)');
}

// Initial FSM state
const initialFsmState = {
  state: 'STABLE',
  entered_at: new Date().toISOString(),
  pending_evolution: null,
  transition_count: 0
};

const fsmPath = path.join(learningDir, 'evolution', 'state.json');
if (!fs.existsSync(fsmPath)) {
  fs.writeFileSync(fsmPath, JSON.stringify(initialFsmState, null, 2));
  console.log('🔄 Created evolution/state.json (STABLE)');
} else {
  console.log('🔄 evolution/state.json exists (not overwriting)');
}

// Empty initial files
const emptyFiles = [
  { path: 'events/events.jsonl', content: '' },
  { path: 'memory/episodic/narratives.json', content: '[]' },
  { path: 'memory/semantic/rules.md', content: '# Learned Rules\\n\\n_No rules yet. They will appear as patterns are detected._\\n' },
  { path: 'memory/semantic/preferences.json', content: '{}' },
  { path: 'procedures/metrics.json', content: '{"total_executions": 0, "total_successes": 0}' },
  { path: 'decisions/outcomes.json', content: '{}' },
  { path: 'failures/log.jsonl', content: '' },
  { path: 'failures/patterns.json', content: '[]' },
  { path: 'evolution/history.jsonl', content: '' },
  { path: 'evolution/pending.json', content: 'null' }
];

console.log('');
console.log('📝 Creating initial files...');
for (const file of emptyFiles) {
  const fullPath = path.join(learningDir, file.path);
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, file.content);
    console.log(`   ✓ ${file.path}`);
  }
}

console.log('');
console.log('==========================================');
console.log('✅ Installation complete!');
console.log('');
console.log('Next steps:');
console.log('1. Review config: learning/config.yaml');
console.log('2. Agent will start logging automatically');
console.log('3. Check status anytime: "Show learning status"');
console.log('4. After 1-2 weeks, enable Phase B');
console.log('');
console.log('📚 Full docs: skills/agentic-learning/SKILL.md');
console.log('');
