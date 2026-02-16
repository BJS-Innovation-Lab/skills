#!/usr/bin/env node
/**
 * Memory API — Main Entry Point
 * 
 * Combines all 4 layers into a single memory payload:
 *   L1: Identity (static core)
 *   L2: Context (dynamic routing by who/channel)
 *   L3: Relevance (Supabase + local search)
 *   L4: Compression (LLM semantic squeeze)
 * 
 * Usage:
 *   node memory-load.cjs [--who ID] [--channel telegram|a2a] [--message "text"]
 *                        [--agent-name Sybil] [--budget 4000] [--no-compress]
 *                        [--write-memory] [--dry-run] [--verbose]
 * 
 * Output: Compressed memory payload to stdout
 * With --write-memory: Also writes to MEMORY.md
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');

// Parse args
const args = process.argv.slice(2);
function getArg(name, defaultVal = '') {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return defaultVal;
  if (idx + 1 >= args.length) return true;
  const val = args[idx + 1];
  if (val.startsWith('--')) return true;
  return val;
}

const WHO = getArg('who', 'unknown');
const CHANNEL = getArg('channel', 'unknown');
const MESSAGE = getArg('message', '');
const AGENT_NAME = getArg('agent-name', 'Sybil');
const AGENT_ID = getArg('agent-id', '5fae1839-ab85-412c-acc0-033cbbbbd15b');
const BUDGET = parseInt(getArg('budget', '4000'));
const NO_COMPRESS = args.includes('--no-compress');
const WRITE_MEMORY = args.includes('--write-memory');
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

// Import layers
const { extractIdentity } = require('./layer-identity.cjs');
const { extractContext } = require('./layer-context.cjs');
const { extractRelevance } = require('./layer-relevance.cjs');
const { compress, smartTruncate } = require('./layer-compression.cjs');

async function memoryLoad() {
  const startTime = Date.now();
  const log = (msg) => VERBOSE && process.stderr.write(`[memory-api] ${msg}\n`);
  
  log(`Starting memory load for ${WHO} via ${CHANNEL}`);
  log(`Message: "${MESSAGE.substring(0, 80)}"`);
  log(`Budget: ${BUDGET} chars`);
  
  // ========== Layer 1: Identity ==========
  log('Running Layer 1: Identity...');
  const l1 = extractIdentity();
  log(`L1: ${l1.length} chars`);
  
  // ========== Layer 2: Context ==========
  log('Running Layer 2: Context...');
  const l2 = extractContext({ who: WHO, channel: CHANNEL, message: MESSAGE });
  log(`L2: ${l2.length} chars`);
  
  // ========== Layer 3: Relevance ==========
  log('Running Layer 3: Relevance...');
  let l3 = '';
  if (MESSAGE && MESSAGE.length > 5) {
    l3 = await extractRelevance({ message: MESSAGE, agentId: AGENT_ID });
    log(`L3: ${l3.length} chars`);
  } else {
    log('L3: Skipped (no message to search for)');
  }
  
  // ========== Combine raw layers ==========
  const rawCombined = [l1, l2, l3].filter(Boolean).join('\n\n---\n\n');
  log(`Raw combined: ${rawCombined.length} chars`);
  
  // ========== Layer 4: Compression ==========
  let final;
  
  if (rawCombined.length <= BUDGET) {
    log('Under budget — skipping compression');
    final = rawCombined;
  } else if (NO_COMPRESS) {
    log('Compression disabled — smart truncating');
    final = smartTruncate(rawCombined, BUDGET);
  } else {
    log('Running Layer 4: Compression...');
    
    // Determine who we're talking to for compression context
    const IDENTITY_MAP = {
      '5063274787': 'Bridget (co-founder)',
      '6151122745': 'Johan (co-founder)',
      'e7fabc18-75fa-4294-bd7d-9e5ed0dedacb': 'Santos (CS agent)',
      '62bb0f39-2248-4b14-806d-1c498c654ee7': 'Sam (field agent)',
      '415a84a4-af9e-4c98-9d48-040834436e44': 'Saber (agent)',
    };
    
    final = await compress({
      rawMemory: rawCombined,
      agentName: AGENT_NAME,
      talkingTo: IDENTITY_MAP[WHO] || WHO,
      channel: CHANNEL,
      time: new Date().toISOString(),
      budget: BUDGET
    });
    log(`Compressed: ${rawCombined.length} → ${final.length} chars (${Math.round(final.length/rawCombined.length*100)}%)`);
  }
  
  const elapsed = Date.now() - startTime;
  
  // ========== Output ==========
  if (WRITE_MEMORY && !DRY_RUN) {
    const memoryPath = path.join(WORKSPACE, 'MEMORY.md');
    // Backup current MEMORY.md
    if (fs.existsSync(memoryPath)) {
      const backup = path.join(WORKSPACE, 'memory', '.memory-backup.md');
      fs.copyFileSync(memoryPath, backup);
      log(`Backed up MEMORY.md to ${backup}`);
    }
    fs.writeFileSync(memoryPath, final);
    log(`Wrote ${final.length} chars to MEMORY.md`);
  }
  
  if (DRY_RUN) {
    process.stderr.write(`\n${'='.repeat(60)}\n`);
    process.stderr.write(`MEMORY API — DRY RUN RESULTS\n`);
    process.stderr.write(`${'='.repeat(60)}\n`);
    process.stderr.write(`Who: ${WHO} | Channel: ${CHANNEL}\n`);
    process.stderr.write(`L1 Identity: ${l1.length} chars\n`);
    process.stderr.write(`L2 Context:  ${l2.length} chars\n`);
    process.stderr.write(`L3 Relevance: ${l3.length} chars\n`);
    process.stderr.write(`Raw total:   ${rawCombined.length} chars\n`);
    process.stderr.write(`Final:       ${final.length} chars (budget: ${BUDGET})\n`);
    process.stderr.write(`Compressed:  ${rawCombined.length > BUDGET ? 'Yes' : 'No'}\n`);
    process.stderr.write(`Time:        ${elapsed}ms\n`);
    process.stderr.write(`${'='.repeat(60)}\n\n`);
  }
  
  // Always output the final memory to stdout
  console.log(final);
  
  // Stats to stderr
  process.stderr.write(`[memory-api] ✅ ${final.length}/${BUDGET} chars | ${elapsed}ms | L1:${l1.length} L2:${l2.length} L3:${l3.length}\n`);
  
  return final;
}

memoryLoad().catch(err => {
  process.stderr.write(`[memory-api] ❌ Error: ${err.message}\n`);
  process.exit(1);
});
