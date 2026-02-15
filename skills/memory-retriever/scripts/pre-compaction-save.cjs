#!/usr/bin/env node
/**
 * pre-compaction-save.cjs — Emergency memory dump before context compaction
 * 
 * When called, captures the current conversation's key points to today's
 * daily log to prevent context loss during compaction.
 * 
 * This is meant to be called by the agent when it detects compaction is
 * imminent (context window filling up) or by a hook if OpenClaw adds one.
 * 
 * Usage:
 *   node pre-compaction-save.cjs "summary of recent conversation"
 *   node pre-compaction-save.cjs --stdin  (reads from stdin)
 * 
 * What it does:
 *   1. Appends a timestamped "Pre-Compaction Snapshot" to today's daily log
 *   2. Includes whatever summary text is provided
 *   3. Creates a marker file so post-compaction the agent knows what was saved
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');
const MEMORY_DIR = path.join(WORKSPACE, 'memory');

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getTimestamp() {
  return new Date().toISOString().replace('T', ' ').split('.')[0] + ' UTC';
}

async function main() {
  const args = process.argv.slice(2);
  let summary = '';
  
  if (args.includes('--stdin')) {
    // Read from stdin
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    summary = Buffer.concat(chunks).toString('utf-8');
  } else {
    summary = args.filter(a => !a.startsWith('--')).join(' ');
  }
  
  if (!summary.trim()) {
    console.error('Usage: node pre-compaction-save.cjs "conversation summary"');
    console.error('   or: echo "summary" | node pre-compaction-save.cjs --stdin');
    process.exit(1);
  }
  
  // Ensure memory dir exists
  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
  
  const today = getToday();
  const dailyFile = path.join(MEMORY_DIR, `${today}.md`);
  const timestamp = getTimestamp();
  
  const entry = `\n\n### Pre-Compaction Snapshot (${timestamp})\n_Saved before context compaction to prevent memory loss._\n\n${summary.trim()}\n`;
  
  // Append to daily log
  if (fs.existsSync(dailyFile)) {
    fs.appendFileSync(dailyFile, entry);
  } else {
    fs.writeFileSync(dailyFile, `# ${today}\n${entry}`);
  }
  
  // Write marker file so agent knows a snapshot was saved
  const markerFile = path.join(MEMORY_DIR, '.last-compaction-save');
  fs.writeFileSync(markerFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    file: `${today}.md`,
    chars: summary.length
  }));
  
  console.log(`✅ Pre-compaction snapshot saved to memory/${today}.md (${summary.length} chars)`);
  console.log(`   Marker written to memory/.last-compaction-save`);
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
