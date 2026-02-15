#!/usr/bin/env node
/**
 * session-capture.cjs — Auto-extracts key decisions, fixes, and insights from daily memory files
 * 
 * Designed to run at session end (pre-compaction) or via heartbeat.
 * Scans today's daily file for unprocessed entries, identifies potential
 * corrections/insights, and generates structured learning entries.
 * 
 * Usage:
 *   node session-capture.cjs                    # Process today's file
 *   node session-capture.cjs --date 2026-02-15  # Process specific date
 *   node session-capture.cjs --dry-run          # Show what would be captured (no writes)
 *   node session-capture.cjs --json             # JSON output
 * 
 * What it captures:
 *   - Git fixes (from commit hook flags)
 *   - Entries with correction language ("was wrong", "actually", "turns out")
 *   - Entries with insight language ("realized", "key insight", "lesson learned")
 *   - Problem → solution pairs
 * 
 * What it skips:
 *   - Pure activity logs (routine tool calls, config changes)
 *   - Entries already in learning system (checks by content similarity)
 *   - Entries below stakes threshold
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || '/Users/sybil/.openclaw/workspace';
const MEMORY_DIR = path.join(WORKSPACE, 'memory');
const LEARNING_DIR = path.join(MEMORY_DIR, 'learning');

// ── Pattern matching for entry classification ───────────────────────
const CORRECTION_SIGNALS = [
  /\bwas\s+wrong/i, /\bactually[,.]?\s/i, /\bturns?\s+out/i,
  /\bnot\s+what\s+(I|we)\s+thought/i, /\bmisunderstood/i,
  /\bcorrect(ion|ed)\b/i, /\bpreviously\s+believed/i,
  /\bred\s+herring/i, /\bmistake/i, /\bbroke[n]?\b/i,
  /\broot\s+cause.*NOT/i, /\bwasn't\s+(the|actually)/i,
];

const INSIGHT_SIGNALS = [
  /\brealized?\b/i, /\bkey\s+(insight|learning|takeaway)/i,
  /\blesson\s+learned/i, /\bimportant:\s/i, /\bpattern:/i,
  /\bthis\s+means/i, /\bimplication/i, /\bprinciple:/i,
  /\bdata\s+point/i, /\bpaper\s+(data|relevant|insight)/i,
  /\bvalidat(ed|es)\b/i, /\bconfirms?\b/i,
];

const ACTIVITY_SIGNALS = [
  /^-\s+\*\*Committed?\*\*/i, /^-\s+\*\*Pushed\*\*/i,
  /^-\s+\*\*Created?\*\*/i, /^-\s+\*\*Sent\*\*/i,
  /^-\s+\*\*Updated?\*\*/i, /^-\s+\*\*Installed?\*\*/i,
  /^-\s+\*\*Configured?\*\*/i, /^-\s+\*\*Ran\*\*/i,
  /^\s*HEARTBEAT_OK/i, /^###\s+Git\s+commit/i,
];

const PROBLEM_SOLUTION_PATTERN = /\*\*Problem\*\*.*?\*\*(?:Fix|Solution|Root cause)\*\*/is;

// ── Parse daily file into blocks ────────────────────────────────────
function parseDailyFile(content) {
  const blocks = [];
  const lines = content.split('\n');
  let currentBlock = { header: '', lines: [], startLine: 0 };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^##/.test(line)) {
      if (currentBlock.lines.length > 0 || currentBlock.header) {
        blocks.push({ ...currentBlock, text: currentBlock.lines.join('\n').trim() });
      }
      currentBlock = { header: line, lines: [], startLine: i + 1 };
    } else {
      currentBlock.lines.push(line);
    }
  }
  if (currentBlock.lines.length > 0 || currentBlock.header) {
    blocks.push({ ...currentBlock, text: currentBlock.lines.join('\n').trim() });
  }

  return blocks.filter(b => b.text.length > 20); // skip tiny blocks
}

// ── Classify a block ────────────────────────────────────────────────
function classifyBlock(block) {
  const text = block.header + '\n' + block.text;

  // Skip pure activity
  for (const pattern of ACTIVITY_SIGNALS) {
    if (pattern.test(text)) {
      // Only skip if there's NO insight/correction signal too
      let hasLearning = false;
      for (const p of [...CORRECTION_SIGNALS, ...INSIGHT_SIGNALS]) {
        if (p.test(text)) { hasLearning = true; break; }
      }
      if (!hasLearning) return { type: 'activity', confidence: 0.8 };
    }
  }

  // Check for correction signals
  let correctionScore = 0;
  const correctionMatches = [];
  for (const pattern of CORRECTION_SIGNALS) {
    if (pattern.test(text)) {
      correctionScore++;
      correctionMatches.push(pattern.source.slice(0, 25));
    }
  }

  // Check for insight signals
  let insightScore = 0;
  const insightMatches = [];
  for (const pattern of INSIGHT_SIGNALS) {
    if (pattern.test(text)) {
      insightScore++;
      insightMatches.push(pattern.source.slice(0, 25));
    }
  }

  // Check for problem→solution pairs
  const hasProblemSolution = PROBLEM_SOLUTION_PATTERN.test(text);
  if (hasProblemSolution) correctionScore += 2;

  // Classify
  if (correctionScore >= 2) {
    return { type: 'correction', confidence: Math.min(1.0, correctionScore * 0.3), matches: correctionMatches };
  }
  if (insightScore >= 2) {
    return { type: 'insight', confidence: Math.min(1.0, insightScore * 0.3), matches: insightMatches };
  }
  if (correctionScore === 1 || insightScore === 1) {
    return { type: 'maybe', confidence: 0.3, matches: [...correctionMatches, ...insightMatches] };
  }

  return { type: 'activity', confidence: 0.5 };
}

// ── Check if already captured ───────────────────────────────────────
function isAlreadyCaptured(blockText, date) {
  const dirs = ['corrections', 'insights'];
  for (const dir of dirs) {
    const dirPath = path.join(LEARNING_DIR, dir);
    if (!fs.existsSync(dirPath)) continue;

    // Check files from today and yesterday
    const files = fs.readdirSync(dirPath).filter(f => f.includes(date));
    for (const file of files) {
      const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
      // Simple overlap check: if >50% of significant words match, it's captured
      const blockWords = new Set(blockText.toLowerCase().match(/\b\w{5,}\b/g) || []);
      const fileWords = new Set(content.toLowerCase().match(/\b\w{5,}\b/g) || []);
      if (blockWords.size === 0) return false;
      let overlap = 0;
      for (const w of blockWords) { if (fileWords.has(w)) overlap++; }
      if (overlap / blockWords.size > 0.5) return true;
    }
  }
  return false;
}

// ── Generate learning entry from block ──────────────────────────────
function generateEntry(block, classification, date, idx) {
  const now = new Date().toISOString();
  const prefix = classification.type === 'correction' ? 'COR' : 'INS';
  const id = `${prefix}-${date.replace(/-/g, '')}-AUTO-${String(idx).padStart(3, '0')}`;

  if (classification.type === 'correction') {
    // Try to extract prior_belief and corrected_to from problem/solution structure
    const priorMatch = block.text.match(/\*\*Problem\*\*[:\s]*(.+?)(?:\n|$)/i);
    const fixMatch = block.text.match(/\*\*(?:Fix|Solution|Root cause)\*\*[:\s]*(.+?)(?:\n|$)/i);

    return {
      id,
      type: 'correction',
      timestamp: now,
      source: 'auto-capture',
      prior_belief: priorMatch ? priorMatch[1].trim() : '(extracted from daily log)',
      corrected_to: fixMatch ? fixMatch[1].trim() : block.text.slice(0, 200),
      stakes: 'medium',
      context: `Auto-captured from ${date} daily log. Section: ${block.header}`,
      behavioral_change: '',
      tags: extractTags(block.text),
      raw_block: block.text.slice(0, 500),
    };
  } else {
    return {
      id,
      type: 'insight',
      timestamp: now,
      source: 'auto-capture',
      insight: block.text.slice(0, 300),
      stakes: 'medium',
      context: `Auto-captured from ${date} daily log. Section: ${block.header}`,
      tags: extractTags(block.text),
      raw_block: block.text.slice(0, 500),
    };
  }
}

function extractTags(text) {
  const tags = [];
  const tagPatterns = [
    [/\ba2a\b/i, 'a2a'], [/\bmemory\b/i, 'memory'], [/\blearning\b/i, 'learning'],
    [/\bsupabase\b/i, 'supabase'], [/\bnotion\b/i, 'notion'], [/\bgit\b/i, 'git'],
    [/\bsurprise\s*score/i, 'surprise-score'], [/\bboot\s*memory/i, 'boot-memory'],
    [/\bsantos\b/i, 'santos'], [/\bsaber\b/i, 'saber'], [/\bsam\b/i, 'sam'],
    [/\bfield\s*agent/i, 'field-agent'], [/\bcrm\b/i, 'crm'],
    [/\bpaper\b/i, 'research-paper'], [/\bdaemon\b/i, 'daemon'],
  ];
  for (const [pattern, tag] of tagPatterns) {
    if (pattern.test(text)) tags.push(tag);
  }
  return tags;
}

// ── Format entry as YAML-ish markdown ───────────────────────────────
function formatEntry(entry) {
  const lines = ['---'];
  for (const [key, val] of Object.entries(entry)) {
    if (key === 'raw_block') continue;
    if (Array.isArray(val)) {
      lines.push(`${key}: [${val.map(v => `"${v}"`).join(', ')}]`);
    } else if (val === null || val === undefined) {
      lines.push(`${key}: null`);
    } else {
      lines.push(`${key}: "${String(val).replace(/"/g, '\\"')}"`);
    }
  }
  return lines.join('\n');
}

// ── Write entries to learning dirs ──────────────────────────────────
function writeEntries(entries, date, dryRun) {
  const written = [];

  for (const entry of entries) {
    const dir = entry.type === 'correction' ? 'corrections' : 'insights';
    const dirPath = path.join(LEARNING_DIR, dir);

    if (!dryRun) {
      if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

      const filePath = path.join(dirPath, `${date}.md`);
      const header = fs.existsSync(filePath) ? '' : `# ${dir.charAt(0).toUpperCase() + dir.slice(1)} — ${date}\n`;
      const content = header + formatEntry(entry) + '\n';
      fs.appendFileSync(filePath, content);
    }

    written.push({ id: entry.id, type: entry.type, preview: (entry.corrected_to || entry.insight || '').slice(0, 80) });
  }

  return written;
}

// ── Check for git commit hook flags ─────────────────────────────────
function checkPendingGitFlags(date) {
  const flagFile = path.join(MEMORY_DIR, '.pending-learn-extraction');
  if (!fs.existsSync(flagFile)) return [];

  const lines = fs.readFileSync(flagFile, 'utf8').split('\n').filter(l => l.trim());
  const todayFlags = lines.filter(l => l.startsWith(date));
  
  // Don't delete the file — just return flags for today
  return todayFlags.map(l => {
    const [d, hash, type, ...msgParts] = l.split('|');
    return { date: d, hash, type, message: msgParts.join('|') };
  });
}

// ── Main ────────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const jsonMode = args.includes('--json');
  const dateIdx = args.indexOf('--date');
  const date = dateIdx >= 0 ? args[dateIdx + 1] : new Date().toISOString().slice(0, 10);

  // Find all daily files for this date
  const dailyFiles = fs.readdirSync(MEMORY_DIR)
    .filter(f => f.startsWith(date) && f.endsWith('.md'))
    .map(f => path.join(MEMORY_DIR, f));

  if (dailyFiles.length === 0) {
    if (jsonMode) console.log(JSON.stringify({ date, files: 0, captured: [] }));
    else console.log(`No daily files found for ${date}`);
    return;
  }

  const allEntries = [];
  let blockCount = 0;
  let skippedActivity = 0;
  let skippedDuplicate = 0;

  for (const file of dailyFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const blocks = parseDailyFile(content);
    blockCount += blocks.length;

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const classification = classifyBlock(block);

      if (classification.type === 'activity') {
        skippedActivity++;
        continue;
      }

      if (classification.type === 'maybe' && classification.confidence < 0.3) {
        skippedActivity++;
        continue;
      }

      // Check if already captured
      if (isAlreadyCaptured(block.text, date)) {
        skippedDuplicate++;
        continue;
      }

      const entry = generateEntry(block, classification, date, allEntries.length + 1);
      allEntries.push(entry);
    }
  }

  // Check git commit flags too
  const gitFlags = checkPendingGitFlags(date);

  // Write entries
  const written = writeEntries(allEntries, date, dryRun);

  // Output
  const result = {
    date,
    files: dailyFiles.length,
    blocksScanned: blockCount,
    skippedActivity,
    skippedDuplicate,
    captured: written,
    gitFlags: gitFlags.length,
    dryRun,
  };

  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`\n📋 Session Capture — ${date}${dryRun ? ' (DRY RUN)' : ''}`);
    console.log(`   Files: ${dailyFiles.length} | Blocks: ${blockCount}`);
    console.log(`   Skipped: ${skippedActivity} activity, ${skippedDuplicate} already captured`);
    console.log(`   Git flags: ${gitFlags.length}`);
    if (written.length === 0) {
      console.log('   ✅ Nothing new to capture');
    } else {
      console.log(`   📝 Captured ${written.length} entries:`);
      for (const w of written) {
        console.log(`      ${w.id} [${w.type}] ${w.preview}`);
      }
    }
  }
}

main();
