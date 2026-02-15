#!/usr/bin/env node
/**
 * outcome-checker.cjs — Sub-agent-powered outcome verification
 * 
 * Scans corrections and insights older than N days without linked outcomes,
 * then uses the memory retriever to search for evidence of outcomes.
 * 
 * This replaces the manual "scan files yourself" approach with precise
 * sub-agent retrieval across all 3 memory sources (files, RAG, KB).
 * 
 * Usage:
 *   node outcome-checker.cjs                  # Check entries 3+ days old
 *   node outcome-checker.cjs --min-age 7      # Check entries 7+ days old
 *   node outcome-checker.cjs --dry-run        # Preview what would be checked
 *   node outcome-checker.cjs --json           # JSON output for sub-agent consumption
 * 
 * Designed to run during heartbeats or as a cron job.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');
const LEARNING_DIR = path.join(WORKSPACE, 'memory/learning');
const RETRIEVER = path.join(WORKSPACE, 'skills/memory-retriever/scripts/search-supabase.cjs');

// --- Args ---
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { minAge: 3, maxAge: 30, limit: 5, dryRun: false, json: false };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--min-age': opts.minAge = parseInt(args[++i]); break;
      case '--max-age': opts.maxAge = parseInt(args[++i]); break;
      case '--limit': opts.limit = parseInt(args[++i]); break;
      case '--dry-run': opts.dryRun = true; break;
      case '--json': opts.json = true; break;
    }
  }
  return opts;
}

// --- Parse YAML-ish learning entries from markdown files ---
function parseEntries(dir, type) {
  if (!fs.existsSync(dir)) return [];
  const entries = [];
  
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.md'))) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    const blocks = content.split(/\n---\n/);
    
    for (const block of blocks) {
      const idMatch = block.match(/id:\s*(\S+)/);
      const tsMatch = block.match(/timestamp:\s*(\S+)/);
      const outcomeMatch = block.match(/outcome:\s*(.+)/);
      const outcomeDate = block.match(/outcome_date:\s*(.+)/);
      const beliefMatch = block.match(/prior_belief:\s*"?(.+?)"?\s*$/m);
      const correctedMatch = block.match(/corrected_to:\s*"?(.+?)"?\s*$/m);
      const patternMatch = block.match(/pattern:\s*"?(.+?)"?\s*$/m);
      const contextMatch = block.match(/context:\s*"?(.+?)"?\s*$/m);
      
      if (!idMatch || !tsMatch) continue;
      
      const hasOutcome = outcomeMatch && 
        outcomeMatch[1].trim() !== 'null' && 
        outcomeMatch[1].trim() !== '' &&
        outcomeMatch[1].trim() !== '~';
      
      entries.push({
        id: idMatch[1],
        type,
        timestamp: tsMatch[1],
        hasOutcome,
        outcomeDate: outcomeDate ? outcomeDate[1].trim() : null,
        summary: type === 'correction' 
          ? (correctedMatch ? correctedMatch[1] : beliefMatch ? beliefMatch[1] : 'unknown')
          : (patternMatch ? patternMatch[1] : contextMatch ? contextMatch[1] : 'unknown'),
        file,
        raw: block
      });
    }
  }
  
  return entries;
}

// --- Find entries needing outcome checks ---
function findPending(opts) {
  const now = Date.now();
  const minAgeMs = opts.minAge * 86400000;
  const maxAgeMs = opts.maxAge * 86400000;
  
  const corrections = parseEntries(path.join(LEARNING_DIR, 'corrections'), 'correction');
  const insights = parseEntries(path.join(LEARNING_DIR, 'insights'), 'insight');
  const all = [...corrections, ...insights];
  
  return all.filter(entry => {
    if (entry.hasOutcome) return false;
    const age = now - new Date(entry.timestamp).getTime();
    return age >= minAgeMs && age <= maxAgeMs;
  }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(0, opts.limit);
}

// --- Search for outcome evidence using memory retriever ---
function searchForOutcome(entry) {
  const query = entry.type === 'correction'
    ? `Did behavior change after: ${entry.summary}`
    : `Results or outcome of: ${entry.summary}`;
  
  try {
    const result = execSync(
      `node "${RETRIEVER}" "${query.replace(/"/g, '\\"')}" --sources all --days ${Math.min(14, Math.ceil((Date.now() - new Date(entry.timestamp).getTime()) / 86400000))} --json`,
      { encoding: 'utf-8', timeout: 30000 }
    );
    return JSON.parse(result);
  } catch (e) {
    return { error: e.message.slice(0, 200) };
  }
}

// --- Main ---
function main() {
  const opts = parseArgs();
  const pending = findPending(opts);
  
  if (pending.length === 0) {
    if (opts.json) {
      console.log(JSON.stringify({ status: 'clean', pending: 0 }));
    } else {
      console.log('✅ No entries pending outcome checks.');
    }
    return;
  }
  
  if (opts.json) {
    const output = { status: 'pending', entries: [] };
    
    for (const entry of pending) {
      const age = Math.floor((Date.now() - new Date(entry.timestamp).getTime()) / 86400000);
      const evidence = opts.dryRun ? null : searchForOutcome(entry);
      
      output.entries.push({
        id: entry.id,
        type: entry.type,
        age_days: age,
        summary: entry.summary,
        file: entry.file,
        evidence: evidence ? {
          total_results: evidence.meta?.totalResults || 0,
          top_hits: Object.entries(evidence.sources || {}).flatMap(([src, results]) => 
            (Array.isArray(results) ? results : []).filter(r => !r.error).slice(0, 2).map(r => ({
              source: src,
              path: r.path || r.title,
              relevance: r.relevance || r.similarity
            }))
          )
        } : null
      });
    }
    
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(`\n🔍 Outcome Check — ${pending.length} entries pending\n`);
    
    for (const entry of pending) {
      const age = Math.floor((Date.now() - new Date(entry.timestamp).getTime()) / 86400000);
      const emoji = entry.type === 'correction' ? '🔧' : '💡';
      
      console.log(`${emoji} ${entry.id} (${age}d old) — ${entry.type}`);
      console.log(`   "${entry.summary}"`);
      
      if (opts.dryRun) {
        console.log(`   [dry-run] Would search for outcome evidence`);
      } else {
        const evidence = searchForOutcome(entry);
        if (evidence.error) {
          console.log(`   ⚠️ Search error: ${evidence.error}`);
        } else {
          const total = evidence.meta?.totalResults || 0;
          console.log(`   📊 Found ${total} potential evidence items`);
          
          // Show top 2 hits across all sources
          for (const [src, results] of Object.entries(evidence.sources || {})) {
            if (!Array.isArray(results)) continue;
            const hits = results.filter(r => !r.error).slice(0, 1);
            for (const hit of hits) {
              const score = hit.relevance || hit.similarity;
              const pct = score ? `${(score * 100).toFixed(0)}%` : '';
              console.log(`   → [${src}] ${pct} ${hit.path || hit.title || ''}`);
            }
          }
        }
      }
      console.log();
    }
    
    console.log(`💡 Review these and log outcomes to memory/learning/outcomes/`);
    console.log(`   Use: node outcome-checker.cjs --json | for sub-agent consumption`);
  }
}

main();
