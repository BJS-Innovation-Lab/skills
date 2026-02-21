#!/usr/bin/env node
/**
 * extract-insights.cjs — Periodic insight extraction from daily memory files
 * 
 * Runs during heartbeats to scan recent daily files for unprocessed entries
 * and run them through surprise scoring before storing as learning entries.
 * 
 * This is the "sweep" that catches what session-capture and git-hooks miss.
 * 
 * Usage:
 *   node extract-insights.cjs                    # Process last 2 days
 *   node extract-insights.cjs --days 7           # Process last 7 days
 *   node extract-insights.cjs --dry-run          # Preview only
 *   node extract-insights.cjs --json             # JSON output
 *   node extract-insights.cjs --with-surprise    # Run surprise scoring (needs OPENAI_API_KEY)
 * 
 * Flow:
 *   1. Scan daily files from last N days
 *   2. Identify blocks with learning potential (corrections, insights, problem-solutions)
 *   3. Filter out already-captured entries (dedup against learning dirs)
 *   4. Optionally run surprise scoring
 *   5. Generate structured entries for blocks that pass the gate
 *   6. Write to memory/learning/{corrections,insights}/
 *   7. Update .last-extraction timestamp
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = process.env.WORKSPACE || '/Users/sybil/.openclaw/workspace';
const MEMORY_DIR = path.join(WORKSPACE, 'memory');
const LEARNING_DIR = path.join(MEMORY_DIR, 'learning');
const RAG_DIR = path.join(WORKSPACE, 'rag');
const STATE_FILE = path.join(MEMORY_DIR, '.last-extraction');

// ── Reuse classifiers from session-capture ──────────────────────────
const CORRECTION_SIGNALS = [
  /\bwas\s+wrong/i, /\bactually[,.]?\s/i, /\bturns?\s+out/i,
  /\bnot\s+what\s+(I|we)\s+thought/i, /\bmisunderstood/i,
  /\bcorrect(ion|ed)\b/i, /\bpreviously\s+believed/i,
  /\bred\s+herring/i, /\bmistake/i, /\bbroke[n]?\b/i,
  /\broot\s+cause.*NOT/i, /\bwasn't\s+(the|actually)/i,
  /\bshould\s+have\b/i, /\bnext\s+time\b/i,
  // Added: patterns from actual daily notes
  /\*\*Root\s+cause:\*\*/i, /\bRoot\s+cause:/i,
  /\*\*Fix:\*\*/i, /\bused\s+wrong\b/i,
  /\bwere\s+failing/i, /\bjobs?\s+fail(ing|ed)/i,
  /\bThe\s+problem\s+(was|yesterday)/i,
  /\bwrong\s+(model|config|setting|path|url)/i,
];

const INSIGHT_SIGNALS = [
  /\brealized?\b/i, /\bkey\s+(insight|learning|takeaway)/i,
  /\blesson\s+learned/i, /\bimportant:\s/i, /\bpattern:/i,
  /\bthis\s+means/i, /\bimplication/i, /\bprinciple:/i,
  /\bdata\s+point/i, /\bpaper\s+(data|relevant|insight)/i,
  /\bvalidat(ed|es)\b/i, /\bconfirms?\b/i,
  /\bnever\s+again\b/i, /\balways\s+check\b/i,
  // Added: structured learning patterns from daily notes
  /\bThree\s+settings\s+that\s+fix/i,
  /\bsettings?\s+that\s+(fix|solve|resolve)/i,
  /\*\*Relevance\s+to/i, /\bRelevance:/i,
  /\bDirect(ly)?\s+applicable\s+to/i,
  /\bConfig\s+(Change|Fix)\b/i,
  /\bOptimization\b/i,
  /\bStandardization\b/i,
];

const RESEARCH_SIGNALS = [
  /^###\s+Top\s+Paper\s+\(Score\s+[7-9]|10\)/i, // High scoring papers
  /\*\*Relevance\s+to\s+our\s+research:\*\*/i,
  /\bNew\s+definition\s+of\b/i,
  /\bFormalizes\s+"[^"]+"\b/i, // Formalizes "concept"
];

const SKIP_SIGNALS = [
  /^###\s+Git\s+(commit|feature|docs)\s+—/i,  // Pure git activity (not fixes)
  /^\s*HEARTBEAT_OK/i,
  /^###?\s+(Sent|Created|Updated|Installed|Configured|Pushed)\b/i,
];

// ── Get dates to scan ───────────────────────────────────────────────
function getDateRange(days) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

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

  return blocks.filter(b => b.text.length > 30);
}

// ── Classify block ──────────────────────────────────────────────────
function classifyBlock(block) {
  const text = block.header + '\n' + block.text;

  // Check skip signals first
  for (const p of SKIP_SIGNALS) {
    if (p.test(text)) {
      // Unless it also has correction/insight language
      let hasLearning = false;
      for (const cp of [...CORRECTION_SIGNALS, ...INSIGHT_SIGNALS]) {
        if (cp.test(text)) { hasLearning = true; break; }
      }
      if (!hasLearning) return null;
    }
  }

  let corrScore = 0, insScore = 0;
  for (const p of CORRECTION_SIGNALS) { if (p.test(text)) corrScore++; }
  for (const p of INSIGHT_SIGNALS) { if (p.test(text)) insScore++; }
  for (const p of RESEARCH_SIGNALS) { if (p.test(text)) insScore += 2; } // Research is high signal

  // Problem → solution pattern is a strong correction signal
  if (/\*\*Problem\*\*.*?\*\*(?:Fix|Solution|Root cause)\*\*/is.test(text)) corrScore += 2;

  if (corrScore >= 2) return { type: 'correction', score: corrScore };
  if (insScore >= 2) return { type: 'insight', score: insScore };
  if (corrScore === 1 && insScore >= 1) return { type: 'insight', score: corrScore + insScore };
  return null; // not interesting enough
}

// ── Dedup against existing learning entries ─────────────────────────
function buildExistingIndex() {
  const index = new Set();
  const dirs = ['corrections', 'insights', 'outcomes'];
  for (const dir of dirs) {
    const dirPath = path.join(LEARNING_DIR, dir);
    if (!fs.existsSync(dirPath)) continue;
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
      // Index significant words
      const words = content.toLowerCase().match(/\b\w{6,}\b/g) || [];
      for (const w of words) index.add(w);
    }
  }
  return index;
}

function isDuplicate(text, existingIndex) {
  if (existingIndex.size === 0) return false;
  const words = text.toLowerCase().match(/\b\w{6,}\b/g) || [];
  if (words.length === 0) return false;
  let overlap = 0;
  for (const w of words) { if (existingIndex.has(w)) overlap++; }
  return (overlap / words.length) > 0.6;
}

// ── Run surprise score (optional) ───────────────────────────────────
function runSurpriseScore(text) {
  const scorePath = path.join(RAG_DIR, 'surprise-score.cjs');
  if (!fs.existsSync(scorePath)) return null;

  try {
    const result = execSync(
      `node "${scorePath}" --json "${text.replace(/"/g, '\\"').slice(0, 500)}"`,
      { cwd: RAG_DIR, timeout: 30000, encoding: 'utf8' }
    );
    return JSON.parse(result);
  } catch {
    return null;
  }
}

// ── Generate entry ──────────────────────────────────────────────────
function generateEntry(block, classification, date, idx) {
  const prefix = classification.type === 'correction' ? 'COR' : 'INS';
  const id = `${prefix}-${date.replace(/-/g, '')}-EXT-${String(idx).padStart(3, '0')}`;
  const text = block.text.slice(0, 300);

  return `---
id: ${id}
type: ${classification.type}
timestamp: ${new Date().toISOString()}
source: auto-extraction
${classification.type === 'correction' ? `corrected_to: "${text.replace(/"/g, '\\"')}"` : `insight: "${text.replace(/"/g, '\\"')}"`}
stakes: medium
context: "Auto-extracted from ${date} daily log. Section: ${block.header.replace(/"/g, '\\"')}"
tags: [${extractTags(block.text).map(t => `"${t}"`).join(', ')}]
`;
}

function extractTags(text) {
  const tags = [];
  const patterns = [
    [/\ba2a\b/i, 'a2a'], [/\bmemory\b/i, 'memory'], [/\blearning\b/i, 'learning'],
    [/\bsupabase\b/i, 'supabase'], [/\bgit\b/i, 'git'], [/\bdaemon\b/i, 'daemon'],
    [/\bsurprise/i, 'surprise-score'], [/\bboot.?memory/i, 'boot-memory'],
    [/\bsantos\b/i, 'santos'], [/\bsaber\b/i, 'saber'],
    [/\bfield.?agent/i, 'field-agent'], [/\bpaper\b/i, 'research'],
  ];
  for (const [p, tag] of patterns) { if (p.test(text)) tags.push(tag); }
  return tags;
}

// ── Main ────────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const jsonMode = args.includes('--json');
  const withSurprise = args.includes('--with-surprise');
  const daysIdx = args.indexOf('--days');
  const days = daysIdx >= 0 ? parseInt(args[daysIdx + 1]) : 2;

  const dates = getDateRange(days);
  const existingIndex = buildExistingIndex();

  // Check last extraction time to avoid re-processing
  let lastExtraction = 0;
  if (fs.existsSync(STATE_FILE)) {
    lastExtraction = parseInt(fs.readFileSync(STATE_FILE, 'utf8').trim()) || 0;
  }

  const results = {
    dates: dates.length,
    filesScanned: 0,
    blocksScanned: 0,
    skipped: 0,
    duplicates: 0,
    captured: [],
    surpriseRejected: 0,
  };

  for (const date of dates) {
    const files = fs.readdirSync(MEMORY_DIR)
      .filter(f => f.startsWith(date) && f.endsWith('.md'))
      .map(f => path.join(MEMORY_DIR, f));

    results.filesScanned += files.length;

    for (const file of files) {
      // Skip if file hasn't been modified since last extraction
      const stat = fs.statSync(file);
      if (stat.mtimeMs < lastExtraction && lastExtraction > 0) continue;

      const content = fs.readFileSync(file, 'utf8');
      const blocks = parseDailyFile(content);
      results.blocksScanned += blocks.length;

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const classification = classifyBlock(block);

        if (!classification) { results.skipped++; continue; }

        if (isDuplicate(block.text, existingIndex)) {
          results.duplicates++;
          continue;
        }

        // Optional surprise scoring
        if (withSurprise) {
          const surprise = runSurpriseScore(block.text);
          if (surprise && surprise.classification.label === 'DUPLICATE') {
            results.surpriseRejected++;
            continue;
          }
        }

        const entry = generateEntry(block, classification, date, results.captured.length + 1);

        if (!dryRun) {
          const dir = classification.type === 'correction' ? 'corrections' : 'insights';
          const dirPath = path.join(LEARNING_DIR, dir);
          if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

          const filePath = path.join(dirPath, `${date}.md`);
          const header = fs.existsSync(filePath) ? '' : `# ${dir.charAt(0).toUpperCase() + dir.slice(1)} — ${date}\n`;
          fs.appendFileSync(filePath, header + entry);
        }

        results.captured.push({
          id: `${classification.type}-${date}-${i}`,
          type: classification.type,
          preview: block.text.slice(0, 80),
          file: path.basename(file),
        });
      }
    }
  }

  // Update extraction timestamp
  if (!dryRun) {
    fs.writeFileSync(STATE_FILE, String(Date.now()));
  }

  if (jsonMode) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(`\n🔍 Insight Extraction${dryRun ? ' (DRY RUN)' : ''}`);
    console.log(`   Scanned: ${results.filesScanned} files, ${results.blocksScanned} blocks over ${results.dates} days`);
    console.log(`   Skipped: ${results.skipped} activity, ${results.duplicates} duplicates`);
    if (withSurprise) console.log(`   Surprise-rejected: ${results.surpriseRejected}`);
    if (results.captured.length === 0) {
      console.log('   ✅ Nothing new to extract');
    } else {
      console.log(`   📝 Extracted ${results.captured.length} entries:`);
      for (const c of results.captured) {
        console.log(`      [${c.type}] ${c.preview}...`);
      }
    }
  }
}

main();
