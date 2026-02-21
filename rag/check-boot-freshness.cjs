#!/usr/bin/env node
/**
 * check-boot-freshness.cjs — Verify MEMORY.md is fresh
 * 
 * Checks if MEMORY.md was updated recently (within threshold).
 * Used by heartbeat to detect stale boot context.
 * 
 * Usage:
 *   node check-boot-freshness.cjs              # Check with 6h default
 *   node check-boot-freshness.cjs --hours 4    # Custom threshold
 * 
 * Exit codes:
 *   0 = fresh (no output)
 *   1 = stale (prints warning + suggested command)
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');
const MEMORY_PATH = path.join(WORKSPACE, 'MEMORY.md');

const args = process.argv.slice(2);
const hoursIdx = args.indexOf('--hours');
const MAX_AGE_HOURS = hoursIdx >= 0 ? parseFloat(args[hoursIdx + 1]) : 6;

if (!fs.existsSync(MEMORY_PATH)) {
  console.log('⚠️ MEMORY.md does not exist! Run memory-load.cjs immediately.');
  process.exit(1);
}

const stat = fs.statSync(MEMORY_PATH);
const ageHours = (Date.now() - stat.mtimeMs) / 3600000;

if (ageHours > MAX_AGE_HOURS) {
  console.log(`⚠️ MEMORY.md is ${ageHours.toFixed(1)}h old (threshold: ${MAX_AGE_HOURS}h). Boot context is stale.`);
  console.log(`Run: WORKSPACE=${WORKSPACE} node ${WORKSPACE}/skills/memory-api/scripts/memory-load.cjs --who system --channel heartbeat --message "stale refresh" --write-memory`);
  process.exit(1);
} else {
  // Fresh — silent exit
  process.exit(0);
}
