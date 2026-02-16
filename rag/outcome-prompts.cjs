#!/usr/bin/env node
/**
 * outcome-prompts.cjs — Generate outcome check prompts for heartbeat rotation
 * 
 * Scans corrections and insights from the learning system that are >3 days old
 * and have no corresponding outcome entry. Outputs prompts suitable for
 * heartbeat or cron-triggered review.
 * 
 * Usage:
 *   node outcome-prompts.cjs                # Show pending outcome checks
 *   node outcome-prompts.cjs --json         # JSON output for automation
 *   node outcome-prompts.cjs --heartbeat    # Single prompt for heartbeat inclusion
 * 
 * Env: WORKSPACE (optional)
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');
const LEARNING_DIR = path.join(WORKSPACE, 'memory/learning');

// --- Parse entries from markdown files ---
function parseEntries(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = [];
  
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    const blocks = content.split(/(?=^type:\s*(?:correction|insight|outcome))/m);
    
    for (const block of blocks) {
      const entry = {};
      for (const line of block.split('\n')) {
        const m = line.match(/^(\w[\w_]*):\s*(.+)/);
        if (m) {
          let val = m[2].trim().replace(/^["']|["']$/g, '');
          if (val === 'null' || val === '') val = null;
          else if (val === 'true') val = true;
          else if (val === 'false') val = false;
          entry[m[1].trim()] = val;
        }
      }
      if (entry.type && entry.id) entries.push(entry);
    }
  }
  
  return entries;
}

// --- Main ---
function main() {
  const args = process.argv.slice(2);
  const JSON_MODE = args.includes('--json');
  const HEARTBEAT_MODE = args.includes('--heartbeat');
  
  // Load all entries
  const corrections = parseEntries(path.join(LEARNING_DIR, 'corrections'));
  const insights = parseEntries(path.join(LEARNING_DIR, 'insights'));
  const outcomes = parseEntries(path.join(LEARNING_DIR, 'outcomes'));
  
  // Find outcome references (what's already been evaluated)
  const outcomeRefs = new Set();
  for (const o of outcomes) {
    if (o.references) outcomeRefs.add(o.references);
    if (o.linked_entry) outcomeRefs.add(o.linked_entry);
  }
  
  // Find entries that need outcome checks (>3 days old, no outcome)
  const now = Date.now();
  const MIN_AGE_MS = 3 * 86400000; // 3 days
  const pending = [];
  
  for (const entry of [...corrections, ...insights]) {
    // Skip if already has an outcome
    if (outcomeRefs.has(entry.id)) continue;
    
    // Skip if too recent
    if (entry.timestamp) {
      const age = now - new Date(entry.timestamp).getTime();
      if (age < MIN_AGE_MS) continue;
    }
    
    // Skip if outcome field is already filled
    if (entry.outcome && entry.outcome !== 'null') continue;
    
    pending.push({
      id: entry.id,
      type: entry.type,
      stakes: entry.stakes || 'unknown',
      summary: entry.type === 'correction' 
        ? (entry.corrected_to || entry.prior_belief || 'unknown correction')
        : (entry.insight || 'unknown insight'),
      behavioral_change: entry.behavioral_change || null,
      timestamp: entry.timestamp
    });
  }
  
  // Sort by stakes (high first), then age (oldest first)
  const stakeOrder = { high: 0, medium: 1, low: 2, unknown: 3 };
  pending.sort((a, b) => {
    const s = (stakeOrder[a.stakes] || 3) - (stakeOrder[b.stakes] || 3);
    if (s !== 0) return s;
    return new Date(a.timestamp || 0) - new Date(b.timestamp || 0);
  });
  
  if (JSON_MODE) {
    console.log(JSON.stringify({ pending, total: pending.length, checked: outcomeRefs.size }, null, 2));
    return;
  }
  
  if (HEARTBEAT_MODE) {
    // Output a single actionable prompt for heartbeat
    if (pending.length === 0) {
      console.log('No pending outcome checks.');
      return;
    }
    const top = pending[0];
    console.log(`OUTCOME CHECK: Is ${top.id} still holding? "${top.summary}" — Check if this ${top.type} has produced measurable results. Log an outcome entry if you can evaluate it.`);
    return;
  }
  
  // Human-readable
  console.log(`\n📊 Outcome Check Status\n`);
  console.log(`Total corrections: ${corrections.length}`);
  console.log(`Total insights: ${insights.length}`);
  console.log(`Outcomes tracked: ${outcomes.length}`);
  console.log(`Already evaluated: ${outcomeRefs.size}`);
  console.log(`Pending checks: ${pending.length}\n`);
  
  if (pending.length === 0) {
    console.log('✅ All entries have outcomes or are too recent. Nothing to check.');
    return;
  }
  
  console.log('🔍 Entries needing outcome evaluation:\n');
  for (const p of pending) {
    const age = p.timestamp ? `${((now - new Date(p.timestamp).getTime()) / 86400000).toFixed(0)}d ago` : '?';
    console.log(`  [${p.stakes.toUpperCase()}] ${p.id} (${p.type}, ${age})`);
    console.log(`    "${p.summary}"`);
    if (p.behavioral_change) console.log(`    Expected change: ${p.behavioral_change}`);
    console.log();
  }
}

main();
