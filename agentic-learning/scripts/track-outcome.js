#!/usr/bin/env node

/**
 * Track Decision Outcomes
 * 
 * Goes back to past decisions and records whether they worked.
 * Usage: node track-outcome.js --date 2026-02-13 --index 2 --score 8 --outcome "Worked well, table created successfully"
 */

const fs = require('fs');
const path = require('path');

const workspaceDir = process.env.OPENCLAW_WORKSPACE || path.resolve(__dirname, '../../..');
const decisionsDir = path.join(workspaceDir, 'learning', 'decisions');
const outcomesFile = path.join(decisionsDir, 'outcomes.json');

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--date') parsed.date = args[++i];
    else if (args[i] === '--index') parsed.index = parseInt(args[++i]);
    else if (args[i] === '--score') parsed.score = parseInt(args[++i]);
    else if (args[i] === '--outcome') parsed.outcome = args[++i];
    else if (args[i] === '--list') parsed.list = true;
  }
  return parsed;
}

function loadOutcomes() {
  try {
    const data = JSON.parse(fs.readFileSync(outcomesFile, 'utf8'));
    if (Array.isArray(data)) return data;
    return []; // Convert empty {} to []
  } catch {
    return [];
  }
}

function listDecisions(date) {
  const file = path.join(decisionsDir, `${date}.json`);
  if (!fs.existsSync(file)) {
    console.log(`No decisions found for ${date}`);
    return;
  }
  const decisions = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`\n📋 Decisions for ${date}:\n`);
  decisions.forEach((d, i) => {
    const outcomes = loadOutcomes();
    const hasOutcome = outcomes.some(o => o.decision_id === d.timestamp);
    const marker = hasOutcome ? '✅' : '⬜';
    console.log(`  ${marker} [${i}] [${d.type}] ${d.context.slice(0, 70)}`);
  });
  console.log(`\nUse --date ${date} --index <N> --score <1-10> --outcome "<text>" to track`);
}

function main() {
  const args = parseArgs();

  if (args.list || (!args.score && args.date)) {
    const date = args.date || new Date().toISOString().split('T')[0];
    listDecisions(date);
    return;
  }

  if (!args.date || args.index === undefined || !args.score || !args.outcome) {
    console.log('Usage: node track-outcome.js --date YYYY-MM-DD --index N --score 1-10 --outcome "text"');
    console.log('       node track-outcome.js --list --date YYYY-MM-DD');
    process.exit(1);
  }

  if (args.score < 1 || args.score > 10) {
    console.error('Score must be 1-10');
    process.exit(1);
  }

  const file = path.join(decisionsDir, `${args.date}.json`);
  if (!fs.existsSync(file)) {
    console.error(`No decisions file for ${args.date}`);
    process.exit(1);
  }

  const decisions = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (args.index >= decisions.length) {
    console.error(`Index ${args.index} out of range (${decisions.length} decisions)`);
    process.exit(1);
  }

  const decision = decisions[args.index];
  const outcomes = loadOutcomes();

  outcomes.push({
    decision_id: decision.timestamp,
    decision_date: args.date,
    decision_type: decision.type,
    decision_context: decision.context.slice(0, 100),
    decision_tags: decision.tags || [],
    score: args.score,
    outcome: args.outcome,
    tracked_at: new Date().toISOString()
  });

  fs.writeFileSync(outcomesFile, JSON.stringify(outcomes, null, 2));
  console.log(`✅ Tracked outcome for decision [${args.index}]: score ${args.score}/10`);
  console.log(`   "${decision.context.slice(0, 60)}..."`);
  console.log(`   Total outcomes tracked: ${outcomes.length}`);
}

main();
