#!/usr/bin/env node
/**
 * auto-retrieve.cjs — Smart-trigger → sub-agent retrieval pipeline
 * 
 * Takes a message, runs it through the smart-trigger classifier to determine
 * if memory retrieval is needed, then runs the appropriate search.
 * 
 * This is the "wire" between smart-trigger detection and sub-agent retrieval.
 * 
 * Usage:
 *   node auto-retrieve.cjs "what did Santos say about tokens?"
 *   node auto-retrieve.cjs "remember when Sam refused the role change?"
 *   node auto-retrieve.cjs "hey how's it going"  # → no retrieval needed
 *   node auto-retrieve.cjs --force "query"        # Skip trigger check
 * 
 * Output: JSON with trigger decision + search results (if triggered)
 * 
 * Integration: Call this from message pipeline or heartbeat to auto-decide
 * whether a message needs memory augmentation before responding.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');
const SMART_TRIGGER = path.join(WORKSPACE, 'rag/smart-trigger.cjs');
const SEARCH = path.join(WORKSPACE, 'skills/memory-retriever/scripts/search-supabase.cjs');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { force: false, agent: 'sybil', days: 7, limit: 10 };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--force': opts.force = true; break;
      case '--agent': opts.agent = args[++i]; break;
      case '--days': opts.days = parseInt(args[++i]); break;
      case '--limit': opts.limit = parseInt(args[++i]); break;
      default:
        if (!args[i].startsWith('--')) opts.message = args[i];
    }
  }
  return opts;
}

// Run smart-trigger classifier
function shouldRetrieve(message) {
  try {
    const result = execSync(
      `node "${SMART_TRIGGER}" "${message.replace(/"/g, '\\"')}" --json 2>/dev/null`,
      { encoding: 'utf-8', timeout: 5000 }
    );
    const parsed = JSON.parse(result);
    const tier = parsed.tier || parsed.level || 'none';
    return {
      triggered: tier !== 'none',
      tier,        // none | local | shared (HQ) or none | local | hq (field)
      reason: parsed.reason,
      confidence: parsed.confidence
    };
  } catch (e) {
    // If smart-trigger fails, default to retrieval (safe fallback)
    return { triggered: true, tier: 'local', reason: 'smart-trigger unavailable, defaulting to search', confidence: 0.5 };
  }
}

// Run unified search
function search(query, opts) {
  const sources = opts.tier === 'shared' || opts.tier === 'hq' ? 'all' : 'files,rag';
  try {
    const result = execSync(
      `node "${SEARCH}" "${query.replace(/"/g, '\\"')}" --sources ${sources} --agent ${opts.agent} --days ${opts.days} --limit ${opts.limit} --json`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    return JSON.parse(result);
  } catch (e) {
    return { error: e.message.slice(0, 200) };
  }
}

function main() {
  const opts = parseArgs();
  
  if (!opts.message) {
    console.error('Usage: node auto-retrieve.cjs "message" [--force] [--agent sybil] [--days 7]');
    process.exit(1);
  }
  
  const output = { message: opts.message, timestamp: new Date().toISOString() };
  
  // Step 1: Should we retrieve?
  if (opts.force) {
    output.trigger = { triggered: true, tier: 'local', reason: 'forced', confidence: 1.0 };
  } else {
    output.trigger = shouldRetrieve(opts.message);
  }
  
  // Step 2: If triggered, search
  if (output.trigger.triggered) {
    output.search = search(opts.message, { ...opts, tier: output.trigger.tier });
    output.meta = {
      sources_searched: output.trigger.tier === 'shared' || output.trigger.tier === 'hq' ? 'files,rag,kb' : 'files,rag',
      total_results: output.search?.meta?.totalResults || 0
    };
  } else {
    output.meta = { sources_searched: 'none', total_results: 0, reason: 'smart-trigger: no retrieval needed' };
  }
  
  console.log(JSON.stringify(output, null, 2));
}

main();
