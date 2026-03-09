#!/usr/bin/env node
/**
 * Auto-Promotion Engine
 * 
 * Scans memory/learning/ for entries with 3+ validations and promotes
 * them to memory/core/ and optionally MEMORY.md.
 * 
 * Usage:
 *   node auto-promote.cjs [--dry-run] [--threshold N] [--promote-to core|memory|both]
 * 
 * How validations work:
 *   - Each entry has an `outcome` field (null = not yet validated)
 *   - Outcomes are logged in memory/learning/outcomes/ linking back to the entry
 *   - An entry's validation count = number of outcomes with `validated: true` for that entry ID
 *   - After reaching threshold (default 3), the entry is promoted
 * 
 * Promotion targets:
 *   - core: Writes to memory/core/promoted.md (always)
 *   - memory: Appends one-liner to MEMORY.md (if under char budget)
 *   - both: Does both (default)
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const LEARNING_DIR = path.join(WORKSPACE, 'memory', 'learning');
const CORE_DIR = path.join(WORKSPACE, 'memory', 'core');
const PROMOTED_FILE = path.join(CORE_DIR, 'promoted.md');
const MEMORY_FILE = path.join(WORKSPACE, 'MEMORY.md');
const MEMORY_CHAR_LIMIT = 3500; // safety buffer under 4166

// Parse args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const thresholdIdx = args.indexOf('--threshold');
const THRESHOLD = thresholdIdx >= 0 ? parseInt(args[thresholdIdx + 1]) : 3;
const promoteToIdx = args.indexOf('--promote-to');
const promoteTo = promoteToIdx >= 0 ? args[promoteToIdx + 1] : 'both';

/**
 * Parse entries from markdown files
 * Supports both:
 *   - YAML-like frontmatter (entries separated by `---`)
 *   - Prose markdown (entries separated by `## Title`)
 */
function parseEntries(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const entries = [];
  
  // Try YAML-style first (separated by ---)
  if (content.includes('\n---\n')) {
    const blocks = content.split(/\n---\n/).filter(b => b.trim());
    for (const block of blocks) {
      const entry = parseYamlBlock(block);
      if (entry.id) entries.push(entry);
    }
  }
  
  // Also parse prose markdown (## headers)
  const proseEntries = parseProseMarkdown(content, filePath);
  entries.push(...proseEntries);
  
  return entries;
}

function parseYamlBlock(block) {
  const entry = {};
  const lines = block.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue;
    const match = line.match(/^(\w[\w_]*)\s*:\s*(.+)$/);
    if (match) {
      let [, key, value] = match;
      value = value.trim().replace(/^["']|["']$/g, '');
      if (value === 'null') value = null;
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      entry[key] = value;
    }
  }
  return entry;
}

/**
 * Parse prose markdown format:
 * ## Title
 * **Context:** ...
 * **Learning:** ...
 * **Stakes:** low/medium/high
 */
function parseProseMarkdown(content, filePath) {
  const entries = [];
  // Split by ## headers (but not # main title)
  const blocks = content.split(/\n(?=## [^\n]+\n)/).filter(b => b.trim() && b.includes('## '));
  
  for (const block of blocks) {
    const entry = {};
    
    // Extract title from ## header
    const titleMatch = block.match(/^## ([^\n]+)/m);
    if (titleMatch) {
      entry.title = titleMatch[1].trim();
      // Generate stable ID from filename + title
      const basename = path.basename(filePath, '.md');
      entry.id = `${basename}-${entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;
    }
    
    // Extract fields: **Label:** value
    const contextMatch = block.match(/\*\*Context:\*\*\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
    if (contextMatch) entry.context = contextMatch[1].trim();
    
    const learningMatch = block.match(/\*\*Learning:\*\*\s*([^\n]+(?:\n(?!\*\*)[^\n]+)*)/i);
    if (learningMatch) entry.learning = learningMatch[1].trim();
    
    const stakesMatch = block.match(/\*\*Stakes:\*\*\s*(\w+)/i);
    if (stakesMatch) entry.stakes = stakesMatch[1].toLowerCase();
    
    // Only add if has meaningful content
    if (entry.title && (entry.learning || entry.context)) {
      entries.push(entry);
    }
  }
  
  return entries;
}

/**
 * Scan all learning files for entries
 */
function scanLearningEntries() {
  const entries = { corrections: [], insights: [] };
  
  for (const type of ['corrections', 'insights']) {
    const dir = path.join(LEARNING_DIR, type);
    if (!fs.existsSync(dir)) continue;
    
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const parsed = parseEntries(path.join(dir, file));
      for (const entry of parsed) {
        entry._type = type.replace(/s$/, ''); // correction / insight
        entry._source = path.join(type, file);
        entries[type].push(entry);
      }
    }
  }
  
  return entries;
}

/**
 * Scan outcomes and count validations per entry ID
 */
function countValidations() {
  const validationCounts = {}; // entryId -> count
  const outcomesDir = path.join(LEARNING_DIR, 'outcomes');
  
  if (!fs.existsSync(outcomesDir)) {
    fs.mkdirSync(outcomesDir, { recursive: true });
    return validationCounts;
  }
  
  const files = fs.readdirSync(outcomesDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const entries = parseEntries(path.join(outcomesDir, file));
    for (const entry of entries) {
      const linkedId = entry.linked_entry || entry.linked;
      if (linkedId && entry.validated === true) {
        validationCounts[linkedId] = (validationCounts[linkedId] || 0) + 1;
      }
    }
  }
  
  return validationCounts;
}

/**
 * Check if an entry has already been promoted
 */
function getPromotedIds() {
  if (!fs.existsSync(PROMOTED_FILE)) return new Set();
  const content = fs.readFileSync(PROMOTED_FILE, 'utf-8');
  const ids = new Set();
  const matches = content.matchAll(/\*\*ID:\*\*\s*`([^`]+)`/g);
  for (const m of matches) ids.add(m[1]);
  return ids;
}

/**
 * Generate a one-liner summary for MEMORY.md
 */
function generateOneLiner(entry) {
  if (entry._type === 'correction') {
    return `- ✅ ${entry.corrected_to?.substring(0, 120) || 'Unknown correction'}`;
  } else {
    return `- 💡 ${entry.insight?.substring(0, 120) || 'Unknown insight'}`;
  }
}

/**
 * Generate a full promoted entry for core/promoted.md
 */
function generatePromotedBlock(entry, validations) {
  const now = new Date().toISOString();
  const lines = [
    `### ${entry._type === 'correction' ? '✅ Correction' : '💡 Insight'} — Promoted ${now.split('T')[0]}`,
    `**ID:** \`${entry.id}\` | **Validations:** ${validations} | **Stakes:** ${entry.stakes || 'unknown'}`,
    ''
  ];
  
  if (entry._type === 'correction') {
    lines.push(`**Was:** ${entry.prior_belief || 'N/A'}`);
    lines.push(`**Now:** ${entry.corrected_to || 'N/A'}`);
    if (entry.behavioral_change) lines.push(`**Behavior:** ${entry.behavioral_change}`);
  } else {
    lines.push(`**Insight:** ${entry.insight || 'N/A'}`);
    if (entry.evidence) lines.push(`**Evidence:** ${entry.evidence}`);
  }
  
  lines.push(`**Original:** \`${entry._source}\` | **Promoted:** ${now}`);
  lines.push('');
  return lines.join('\n');
}

/**
 * Mark entry as promoted in its source file
 */
function markAsPromoted(entry) {
  const filePath = path.join(LEARNING_DIR, entry._source);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  // Replace status: active with status: promoted
  const idPattern = new RegExp(`(id:\\s*${entry.id}[\\s\\S]*?)status:\\s*active`, 'm');
  content = content.replace(idPattern, `$1status: promoted`);
  fs.writeFileSync(filePath, content);
}

// ============== MAIN ==============

function main() {
  console.log('🚀 Auto-Promotion Engine');
  console.log(`   Threshold: ${THRESHOLD} validations`);
  console.log(`   Promote to: ${promoteTo}`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');
  
  // 1. Scan all entries
  const { corrections, insights } = scanLearningEntries();
  const allEntries = [...corrections, ...insights];
  console.log(`📂 Found: ${corrections.length} corrections, ${insights.length} insights`);
  
  // 2. Count validations from outcomes
  const validations = countValidations();
  console.log(`📊 Outcomes tracked: ${Object.keys(validations).length} entries with validations`);
  
  // 3. Filter already promoted
  const promotedIds = getPromotedIds();
  console.log(`✅ Already promoted: ${promotedIds.size} entries`);
  
  // 4. Find promotion candidates
  const candidates = allEntries.filter(e => {
    if (promotedIds.has(e.id)) return false;
    if (e.status === 'promoted') return false;
    const count = validations[e.id] || 0;
    return count >= THRESHOLD;
  });
  
  // Also check for high-stakes corrections that should be fast-tracked
  // High-stakes corrections with 2+ validations get promoted early
  const fastTrack = allEntries.filter(e => {
    if (promotedIds.has(e.id)) return false;
    if (e.status === 'promoted') return false;
    if (candidates.find(c => c.id === e.id)) return false;
    const count = validations[e.id] || 0;
    return e._type === 'correction' && e.stakes === 'high' && count >= Math.max(1, THRESHOLD - 1);
  });
  
  const allCandidates = [...candidates, ...fastTrack];
  
  if (allCandidates.length === 0) {
    console.log('\n🔍 No entries ready for promotion.');
    
    // Show entries closest to promotion
    const approaching = allEntries
      .filter(e => !promotedIds.has(e.id) && e.status !== 'promoted')
      .map(e => ({ ...e, validationCount: validations[e.id] || 0 }))
      .filter(e => e.validationCount > 0)
      .sort((a, b) => b.validationCount - a.validationCount)
      .slice(0, 5);
    
    if (approaching.length > 0) {
      console.log('\n📈 Approaching promotion:');
      for (const e of approaching) {
        console.log(`   ${e.id}: ${e.validationCount}/${THRESHOLD} validations (${e.stakes} stakes)`);
      }
    } else {
      console.log('   No entries have any validations yet.');
      console.log('   Tip: Log outcomes with linked_entry pointing to correction/insight IDs.');
    }
    
    return { promoted: 0, candidates: 0 };
  }
  
  console.log(`\n🎯 Promotion candidates: ${allCandidates.length}`);
  if (fastTrack.length > 0) {
    console.log(`   (${fastTrack.length} fast-tracked: high-stakes with ${THRESHOLD - 1}+ validations)`);
  }
  
  // 5. Promote!
  let promoted = 0;
  
  for (const entry of allCandidates) {
    const count = validations[entry.id] || 0;
    const isFastTrack = fastTrack.includes(entry);
    
    console.log(`\n   ${isFastTrack ? '⚡' : '🏆'} ${entry.id} (${entry._type}, ${count} validations, ${entry.stakes} stakes)`);
    
    if (entry._type === 'correction') {
      console.log(`      Was: ${(entry.prior_belief || '').substring(0, 80)}`);
      console.log(`      Now: ${(entry.corrected_to || '').substring(0, 80)}`);
    } else {
      console.log(`      ${(entry.insight || '').substring(0, 100)}`);
    }
    
    if (dryRun) {
      console.log('      [DRY RUN — would promote]');
      promoted++;
      continue;
    }
    
    // Write to core/promoted.md
    if (promoteTo === 'core' || promoteTo === 'both') {
      fs.mkdirSync(CORE_DIR, { recursive: true });
      const block = generatePromotedBlock(entry, count);
      const header = !fs.existsSync(PROMOTED_FILE) 
        ? '# Promoted Learnings\n\nEntries that passed validation threshold and were promoted from learning to core memory.\n\n---\n\n'
        : '';
      fs.appendFileSync(PROMOTED_FILE, header + block + '---\n\n');
    }
    
    // Append to MEMORY.md (if under budget)
    if (promoteTo === 'memory' || promoteTo === 'both') {
      const currentMemory = fs.existsSync(MEMORY_FILE) ? fs.readFileSync(MEMORY_FILE, 'utf-8') : '';
      const oneLiner = generateOneLiner(entry);
      
      if (currentMemory.length + oneLiner.length + 2 < MEMORY_CHAR_LIMIT) {
        // Find or create a "# PROMOTED LEARNINGS" section
        if (currentMemory.includes('# PROMOTED LEARNINGS')) {
          const updated = currentMemory.replace(
            '# PROMOTED LEARNINGS',
            `# PROMOTED LEARNINGS\n${oneLiner}`
          );
          fs.writeFileSync(MEMORY_FILE, updated);
        } else {
          // Append section before the last section (recency position)
          fs.appendFileSync(MEMORY_FILE, `\n# PROMOTED LEARNINGS\n${oneLiner}\n`);
        }
        console.log('      → Added to MEMORY.md');
      } else {
        console.log('      → MEMORY.md over char budget, skipped (still in core/promoted.md)');
      }
    }
    
    // Mark as promoted in source file
    markAsPromoted(entry);
    
    promoted++;
  }
  
  console.log(`\n✅ Promoted ${promoted} entries.`);
  return { promoted, candidates: allCandidates.length };
}

const result = main();
process.exit(result.promoted >= 0 ? 0 : 1);
