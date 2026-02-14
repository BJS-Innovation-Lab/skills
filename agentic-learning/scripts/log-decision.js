#!/usr/bin/env node
/**
 * Manual Decision Logger
 * 
 * Usage:
 *   node log-decision.js --type <type> --context "<context>" [--reasoning "<reasoning>"]
 *   node log-decision.js --type tool_call --context "Sent A2A message to Sage" --reasoning "Needed to share docs"
 * 
 * Types: tool_call, explicit_choice, config_change, external_action, learning
 */

const fs = require('fs');
const path = require('path');

const LEARNING_DIR = path.join(process.env.HOME, '.openclaw', 'workspace', 'learning');

function safeParseJSON(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return defaultValue;
  }
}

function safeWriteJSON(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('Write error:', e.message);
    return false;
  }
}

function generateId() {
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 6);
  return `dec_${ts}_${rand}`;
}

function updateStatus(metric, count = 1) {
  const statusFile = path.join(LEARNING_DIR, 'status.json');
  const status = safeParseJSON(statusFile, { metrics: {} });
  status.metrics = status.metrics || {};
  status.metrics[metric] = (status.metrics[metric] || 0) + count;
  status.last_updated = new Date().toISOString();
  safeWriteJSON(statusFile, status);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { type: 'explicit_choice', context: '', reasoning: '', tags: [] };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--type':
      case '-t':
        result.type = args[++i];
        break;
      case '--context':
      case '-c':
        result.context = args[++i];
        break;
      case '--reasoning':
      case '-r':
        result.reasoning = args[++i];
        break;
      case '--tag':
        result.tags.push(args[++i]);
        break;
      case '--help':
      case '-h':
        console.log(`
Manual Decision Logger

Usage:
  node log-decision.js --type <type> --context "<context>" [--reasoning "<reasoning>"] [--tag <tag>]

Types:
  tool_call       - External tool/action invoked
  explicit_choice - Deliberate choice between options
  config_change   - Modified configuration or settings
  external_action - Sent message, email, or external communication
  learning        - Captured insight or lesson learned

Examples:
  node log-decision.js -t tool_call -c "Patched OpenClaw config for hooks" -r "Hooks weren't loading"
  node log-decision.js -t learning -c "Mac-use better than CLI for complex auth" --tag auth --tag mac-use
`);
        process.exit(0);
    }
  }
  
  return result;
}

function main() {
  const { type, context, reasoning, tags } = parseArgs();
  
  if (!context) {
    console.error('Error: --context is required');
    process.exit(1);
  }
  
  const today = new Date().toISOString().split('T')[0];
  const decisionsFile = path.join(LEARNING_DIR, 'decisions', `${today}.json`);
  
  const decisions = safeParseJSON(decisionsFile, []);
  
  const decision = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    type,
    context,
    outcome: { status: 'logged' }
  };
  
  if (reasoning) decision.reasoning = reasoning;
  if (tags.length > 0) decision.tags = tags;
  
  decisions.push(decision);
  
  if (safeWriteJSON(decisionsFile, decisions)) {
    updateStatus('decisions_logged', 1);
    console.log(JSON.stringify({ ok: true, id: decision.id, logged: decision.timestamp }));
  } else {
    console.log(JSON.stringify({ ok: false, error: 'Failed to write' }));
    process.exit(1);
  }
}

main();
