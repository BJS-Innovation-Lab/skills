#!/usr/bin/env node
/**
 * Boot Memory Auditor — validates MEMORY.md structure against spec
 * 
 * Usage: node audit-boot-memory.cjs [path-to-MEMORY.md]
 * Default: ~/.openclaw/workspace/MEMORY.md
 * 
 * Checks (14 structural + 4 enhanced):
 *   1.  Character count (hard limit 4166, warn at 3500)
 *   2.  Required sections present and in correct order
 *   3.  Section content validation (not empty, not too long)
 *   4.  File pointers exist on disk
 *   5.  Recent Learning freshness (entries >7 days = stale)
 *   6.  Active Goals count (max 3 recommended)
 *   7.  Operating Principles count (max 4 recommended)
 *   8.  Information density (chars per section)
 *   9.  Anti-pattern detection (code blocks, tables, inline JSON)
 *  10.  Section order (primacy/recency optimization)
 *  --- Enhanced checks ---
 *  11.  Cross-reference validation (all pointers resolve to real files)
 *  12.  Stale pointer detection (referenced files not modified in >7 days)
 *  13.  Coverage gap analysis (recent daily log topics vs MEMORY.md)
 *  14.  Character budget tracking (detailed breakdown)
 * 
 * Exit codes: 0 = pass, 1 = warnings, 2 = failures
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HARD_LIMIT = 4166;
const WARN_LIMIT = 3500;
const MAX_GOALS = 3;
const MAX_PRINCIPLES = 4;
const MAX_RECENT_LEARNING = 4;
const STALE_DAYS = 7;

// Required sections in expected order (based on primacy/recency research)
const REQUIRED_SECTIONS = [
  { name: 'IDENTITY', pattern: /^#\s+(IDENTITY|WHO I AM)/mi, position: 'top', reason: 'primacy effect' },
  { name: 'OPERATING PRINCIPLES', pattern: /^##?\s+OPERATING PRINCIPLES/mi, position: 'upper', reason: 'behavioral rules' },
  { name: 'ACTIVE GOALS', pattern: /^#\s+ACTIVE GOALS/mi, position: 'middle', reason: 'current context' },
  { name: 'RECENT LEARNING', pattern: /^#\s+RECENT LEARNING/mi, position: 'middle', reason: 'decision context' },
  { name: 'MEMORY SYSTEM', pattern: /^#\s+MEMORY SYSTEM/mi, position: 'lower', reason: 'reference pointers' },
  { name: 'STATUS', pattern: /^#\s+STATUS/mi, position: 'bottom', reason: 'recency effect' },
];

class AuditResult {
  constructor() {
    this.passes = [];
    this.warnings = [];
    this.failures = [];
  }

  pass(check, detail) { this.passes.push({ check, detail }); }
  warn(check, detail, fix) { this.warnings.push({ check, detail, fix }); }
  fail(check, detail, fix) { this.failures.push({ check, detail, fix }); }

  get exitCode() {
    if (this.failures.length > 0) return 2;
    if (this.warnings.length > 0) return 1;
    return 0;
  }

  toJSON() {
    return {
      status: this.failures.length > 0 ? 'FAIL' : this.warnings.length > 0 ? 'WARN' : 'PASS',
      passes: this.passes.length,
      warnings: this.warnings.length,
      failures: this.failures.length,
      details: {
        passes: this.passes,
        warnings: this.warnings,
        failures: this.failures,
      }
    };
  }

  toString() {
    const lines = [];
    const status = this.failures.length > 0 ? '❌ FAIL' : this.warnings.length > 0 ? '⚠️ WARN' : '✅ PASS';
    lines.push(`\n# Boot Memory Audit — ${status}`);
    lines.push(`Passes: ${this.passes.length} | Warnings: ${this.warnings.length} | Failures: ${this.failures.length}\n`);

    if (this.failures.length > 0) {
      lines.push('## ❌ Failures');
      for (const f of this.failures) {
        lines.push(`- **${f.check}:** ${f.detail}`);
        if (f.fix) lines.push(`  → Fix: ${f.fix}`);
      }
      lines.push('');
    }

    if (this.warnings.length > 0) {
      lines.push('## ⚠️ Warnings');
      for (const w of this.warnings) {
        lines.push(`- **${w.check}:** ${w.detail}`);
        if (w.fix) lines.push(`  → Fix: ${w.fix}`);
      }
      lines.push('');
    }

    if (this.passes.length > 0) {
      lines.push('## ✅ Passes');
      for (const p of this.passes) {
        lines.push(`- **${p.check}:** ${p.detail}`);
      }
    }

    // Budget tracker summary
    lines.push('');
    lines.push('## 📊 Character Budget');
    if (this._budgetInfo) {
      const b = this._budgetInfo;
      const bar = makeBar(b.pctUsed);
      lines.push(`${bar} ${b.chars}/${HARD_LIMIT} chars (${b.pctUsed}% used)`);
      lines.push(`Safety buffer (${WARN_LIMIT}): ${b.remainingSafe >= 0 ? b.remainingSafe + ' chars free' : Math.abs(b.remainingSafe) + ' chars OVER'}`);
      lines.push(`Hard limit (${HARD_LIMIT}): ${b.remainingHard >= 0 ? b.remainingHard + ' chars free' : Math.abs(b.remainingHard) + ' chars OVER'}`);
    }

    return lines.join('\n');
  }
}

function makeBar(pct) {
  const filled = Math.round(pct / 5);
  const empty = 20 - filled;
  const color = pct > 90 ? '🔴' : pct > 75 ? '🟡' : '🟢';
  return `${color} [${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}

function audit(memoryPath, workspacePath) {
  const result = new AuditResult();

  // Check file exists
  if (!fs.existsSync(memoryPath)) {
    result.fail('File exists', `MEMORY.md not found at ${memoryPath}`, 'Create MEMORY.md using the boot memory template');
    return result;
  }

  const content = fs.readFileSync(memoryPath, 'utf8');
  const chars = content.length;

  // === CHARACTER BUDGET TRACKING (Enhanced #14) ===
  const budgetInfo = {
    chars,
    remainingHard: HARD_LIMIT - chars,
    remainingSafe: WARN_LIMIT - chars,
    pctUsed: Math.round(chars / HARD_LIMIT * 100),
  };
  result._budgetInfo = budgetInfo;

  // 1. Character count
  if (chars > HARD_LIMIT) {
    result.fail('Char limit', `${chars} chars exceeds hard limit of ${HARD_LIMIT}. OpenClaw WILL truncate this.`, `Trim to under ${WARN_LIMIT} chars. Move details to memory/core/ files.`);
  } else if (chars > WARN_LIMIT) {
    result.warn('Char limit', `${chars} chars is close to ${HARD_LIMIT} limit (${HARD_LIMIT - chars} remaining).`, `Trim to under ${WARN_LIMIT} for safety buffer.`);
  } else {
    result.pass('Char limit', `${chars} chars (${HARD_LIMIT - chars} remaining, ${Math.round(chars/HARD_LIMIT*100)}% used)`);
  }

  // 2. Required sections — presence and order
  const sectionPositions = [];
  for (const section of REQUIRED_SECTIONS) {
    const match = section.pattern.exec(content);
    if (!match) {
      result.fail('Section: ' + section.name, `Missing required section (${section.reason})`, `Add "${section.name}" section per boot memory spec`);
    } else {
      sectionPositions.push({ name: section.name, index: match.index });
      result.pass('Section: ' + section.name, `Found at position ${match.index}`);
    }
  }

  // Check order
  let orderCorrect = true;
  for (let i = 1; i < sectionPositions.length; i++) {
    if (sectionPositions[i].index < sectionPositions[i-1].index) {
      result.warn('Section order', `"${sectionPositions[i].name}" appears before "${sectionPositions[i-1].name}" — violates primacy/recency optimization`, 'Reorder sections per spec: Identity → Principles → Goals → Learning → System → Status');
      orderCorrect = false;
    }
  }
  if (orderCorrect && sectionPositions.length >= 2) {
    result.pass('Section order', 'All sections in correct primacy/recency order');
  }

  // 3. Count bullet items in key sections
  const lines = content.split('\n');

  // Count principles
  const principlesStart = lines.findIndex(l => /^##?\s+Operating Principles/i.test(l));
  if (principlesStart >= 0) {
    let count = 0;
    for (let i = principlesStart + 1; i < lines.length; i++) {
      if (/^#+\s/.test(lines[i])) break;
      if (/^-\s/.test(lines[i].trim())) count++;
    }
    if (count > MAX_PRINCIPLES) {
      result.warn('Principles count', `${count} principles (recommend max ${MAX_PRINCIPLES})`, 'If you need more than 4, some may not be true principles. Move to SOUL.md.');
    } else if (count === 0) {
      result.fail('Principles count', 'No principles listed', 'Add 3-4 core operating principles');
    } else {
      result.pass('Principles count', `${count} principles (max ${MAX_PRINCIPLES})`);
    }
  }

  // Count active goals
  const goalsStart = lines.findIndex(l => /^#\s+ACTIVE GOALS/i.test(l));
  if (goalsStart >= 0) {
    let count = 0;
    for (let i = goalsStart + 1; i < lines.length; i++) {
      if (/^#+\s/.test(lines[i]) && !/^##\s/.test(lines[i])) break;
      if (/^-\s/.test(lines[i].trim())) count++;
    }
    if (count > MAX_GOALS) {
      result.warn('Goals count', `${count} active goals (recommend max ${MAX_GOALS})`, 'More than 3 active goals = prioritization problem. Move lower-priority to memory/working/.');
    } else if (count === 0) {
      result.warn('Goals count', 'No active goals listed', 'Add current priorities');
    } else {
      result.pass('Goals count', `${count} active goals (max ${MAX_GOALS})`);
    }
  }

  // Count recent learning entries
  const learningStart = lines.findIndex(l => /^#\s+RECENT LEARNING/i.test(l));
  if (learningStart >= 0) {
    let count = 0;
    for (let i = learningStart + 1; i < lines.length; i++) {
      if (/^#+\s/.test(lines[i]) && !/^##\s/.test(lines[i])) break;
      if (/^-\s/.test(lines[i].trim())) count++;
    }
    if (count > MAX_RECENT_LEARNING) {
      result.warn('Recent Learning count', `${count} entries (recommend max ${MAX_RECENT_LEARNING})`, 'Rotate oldest entries out. Keep only last 7 days.');
    } else if (count === 0) {
      result.warn('Recent Learning count', 'No recent learnings listed', 'Pull top entries from memory/learning/');
    } else {
      result.pass('Recent Learning count', `${count} entries (max ${MAX_RECENT_LEARNING})`);
    }
  }

  // 4. Check file pointers exist (original basic check)
  const filePointerPattern = /`(memory\/(?!YYYY)[^`]+|projects\/[^`]+|research\/[^`]+)`/g;
  let match;
  let pointersChecked = 0;
  let pointersBroken = 0;
  while ((match = filePointerPattern.exec(content)) !== null) {
    const filePath = path.join(workspacePath, match[1]);
    pointersChecked++;
    if (!fs.existsSync(filePath)) {
      result.warn('File pointer', `"${match[1]}" does not exist`, 'Remove broken pointer or create the file');
      pointersBroken++;
    }
  }
  if (pointersChecked > 0 && pointersBroken === 0) {
    result.pass('File pointers', `All ${pointersChecked} pointers valid`);
  } else if (pointersChecked === 0) {
    result.warn('File pointers', 'No file pointers found', 'Add pointers to core memory files');
  }

  // 5. Check for date references (staleness)
  const datePattern = /\b(20\d{2}-\d{2}-\d{2})\b/g;
  const dates = [];
  while ((match = datePattern.exec(content)) !== null) {
    dates.push(new Date(match[1]));
  }
  if (dates.length > 0) {
    const newest = new Date(Math.max(...dates));
    const daysOld = Math.floor((Date.now() - newest) / (1000 * 60 * 60 * 24));
    if (daysOld > STALE_DAYS) {
      result.warn('Freshness', `Newest date reference is ${daysOld} days old`, 'Update STATUS section timestamp and rotate Recent Learning');
    } else {
      result.pass('Freshness', `Last updated ${daysOld} day(s) ago`);
    }
  }

  // 6. Information density — check for wasted chars
  const emptyLines = lines.filter(l => l.trim() === '').length;
  const density = Math.round((1 - emptyLines / lines.length) * 100);
  if (density < 60) {
    result.warn('Density', `${density}% information density (${emptyLines} empty lines)`, 'Remove excess blank lines to maximize char budget');
  } else {
    result.pass('Density', `${density}% information density`);
  }

  // 7. Check for anti-patterns
  if (/```/.test(content)) {
    result.warn('Anti-pattern', 'Contains code blocks — expensive in boot memory', 'Move code/configs to separate files');
  }
  if (content.split('|').length > 10) {
    result.warn('Anti-pattern', 'Contains markdown table(s) — expensive in boot memory', 'Use bullet lists instead');
  }
  if (/\{[^}]{50,}\}/.test(content)) {
    result.warn('Anti-pattern', 'Contains inline JSON — less token-efficient than markdown', 'Convert to markdown format');
  }

  // === ENHANCED CHECK #11: Cross-reference validation ===
  // Find all file-like references (not just backtick-wrapped), including "see X" patterns
  const crossRefPatterns = [
    /(?:see|→|ref:|pointer:)\s+[`"]?((?:memory|projects|research|skills)\/[^\s`")\]]+)[`"]?/gi,
    /`((?:memory|projects|research|skills)\/(?!YYYY)[^`]+)`/g,
  ];
  const allRefs = new Set();
  for (const pat of crossRefPatterns) {
    pat.lastIndex = 0;
    let m;
    while ((m = pat.exec(content)) !== null) {
      // Clean trailing punctuation
      const ref = m[1].replace(/[.,;:!?)]+$/, '');
      allRefs.add(ref);
    }
  }

  let crossRefBroken = 0;
  let crossRefValid = 0;
  for (const ref of allRefs) {
    const fullPath = path.join(workspacePath, ref);
    if (fs.existsSync(fullPath)) {
      crossRefValid++;
    } else {
      crossRefBroken++;
      result.fail('Cross-ref', `Pointer "${ref}" references a non-existent file`, `Create the file or remove/update the pointer`);
    }
  }
  if (allRefs.size > 0 && crossRefBroken === 0) {
    result.pass('Cross-references', `All ${crossRefValid} cross-references resolve to existing files`);
  } else if (allRefs.size === 0) {
    result.warn('Cross-references', 'No cross-references found in MEMORY.md', 'Add pointers to core memory files for deeper context');
  }

  // === ENHANCED CHECK #12: Stale pointer detection ===
  let staleCount = 0;
  const now = Date.now();
  const staleThreshold = STALE_DAYS * 24 * 60 * 60 * 1000;
  const staleFiles = [];

  for (const ref of allRefs) {
    const fullPath = path.join(workspacePath, ref);
    if (fs.existsSync(fullPath)) {
      try {
        const stat = fs.statSync(fullPath);
        const age = now - stat.mtimeMs;
        if (age > staleThreshold) {
          const daysAgo = Math.floor(age / (1000 * 60 * 60 * 24));
          staleFiles.push({ ref, daysAgo });
          staleCount++;
        }
      } catch (e) { /* skip unreadable */ }
    }
  }

  if (staleCount > 0) {
    const details = staleFiles.map(f => `"${f.ref}" (${f.daysAgo}d old)`).join(', ');
    result.warn('Stale pointers', `${staleCount} referenced file(s) not modified in >${STALE_DAYS} days: ${details}`, 'Review and update stale files, or remove pointers if no longer relevant');
  } else if (allRefs.size > 0) {
    result.pass('Stale pointers', `All ${allRefs.size} referenced files modified within ${STALE_DAYS} days`);
  }

  // === ENHANCED CHECK #13: Coverage gap analysis ===
  runCoverageGapAnalysis(result, content, workspacePath);

  return result;
}

function runCoverageGapAnalysis(result, memoryContent, workspacePath) {
  // Step 1: Extract topics from recent daily logs (last 3 days)
  const memoryDir = path.join(workspacePath, 'memory');
  if (!fs.existsSync(memoryDir)) {
    result.warn('Coverage gaps', 'No memory/ directory found', 'Create daily log files');
    return;
  }

  const now = new Date();
  const recentDays = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    recentDays.push(d.toISOString().slice(0, 10));
  }

  // Gather content from recent daily logs
  let recentContent = '';
  let filesFound = 0;
  try {
    const files = fs.readdirSync(memoryDir);
    for (const f of files) {
      const matchesDay = recentDays.some(day => f.startsWith(day));
      if (matchesDay && f.endsWith('.md')) {
        const fp = path.join(memoryDir, f);
        recentContent += fs.readFileSync(fp, 'utf8') + '\n';
        filesFound++;
      }
    }
  } catch (e) { /* skip */ }

  if (filesFound === 0) {
    result.warn('Coverage gaps', `No daily logs found for last 3 days (${recentDays.join(', ')})`, 'Create daily memory logs');
    return;
  }

  // Step 2: Extract significant topics from daily logs
  // Look for headings, bold text, and key decision-like phrases
  const topicPatterns = [
    /^#{1,3}\s+(.{15,})/gm,             // headings (meaningful length only)
    /(?:decided|decision|important|launched|shipped|built|created|deployed|fixed|resolved|learned|discovered)[:\s]+(.{15,})/gi,
  ];

  const recentTopics = new Set();
  for (const pat of topicPatterns) {
    pat.lastIndex = 0;
    let m;
    while ((m = pat.exec(recentContent)) !== null) {
      const topic = (m[1] || m[2]).trim().toLowerCase();
      // Filter out noise (very short, date-like, generic)
      if (topic.length > 12 && !/^\d{4}-\d{2}/.test(topic) && !/^(notes|log|today|summary|session|daily|update|context|status)/i.test(topic)) {
        recentTopics.add(topic);
      }
    }
  }

  // Step 3: Try the memory retriever for semantic search
  let retrieverTopics = [];
  try {
    const searchScript = path.join(workspacePath, 'skills/memory-retriever/scripts/search-supabase.cjs');
    if (fs.existsSync(searchScript)) {
      const searchResult = execSync(
        `node "${searchScript}" "recent important decisions" --sources files --days 3 --json`,
        { timeout: 15000, encoding: 'utf8', cwd: workspacePath, stdio: ['pipe', 'pipe', 'pipe'] }
      );
      try {
        const parsed = JSON.parse(searchResult);
        const items = Array.isArray(parsed) ? parsed : (parsed.results || parsed.data || []);
        for (const item of items) {
          const text = item.content || item.text || item.title || '';
          if (text.length > 10) {
            retrieverTopics.push(text.slice(0, 120));
          }
        }
      } catch (e) { /* JSON parse failed, skip */ }
    }
  } catch (e) { /* retriever not available, continue with local analysis */ }

  // Step 4: Check which recent topics are NOT mentioned in MEMORY.md
  const memLower = memoryContent.toLowerCase();
  const gaps = [];

  // Check extracted topics from daily logs
  for (const topic of recentTopics) {
    // Check if any significant words from the topic appear in MEMORY.md
    const words = topic.split(/\s+/).filter(w => w.length > 5);
    const found = words.length === 0 || words.some(w => memLower.includes(w));
    if (!found && words.length > 0) {
      gaps.push(topic);
    }
  }

  // Check retriever topics
  for (const topic of retrieverTopics) {
    const sigWords = topic.toLowerCase().split(/\s+/).filter(w => w.length > 5);
    const found = sigWords.length > 0 && sigWords.some(w => memLower.includes(w));
    if (!found && sigWords.length > 0 && !gaps.includes(topic)) {
      gaps.push(`[retriever] ${topic}`);
    }
  }

  if (gaps.length === 0) {
    result.pass('Coverage gaps', `Recent topics (${recentTopics.size} from ${filesFound} logs) well-represented in MEMORY.md`);
  } else if (gaps.length <= 3) {
    result.warn('Coverage gaps', `${gaps.length} topic(s) from recent logs not in MEMORY.md: ${gaps.slice(0, 3).join('; ')}`,
      'Consider adding important recent topics to MEMORY.md if they deserve boot-time awareness');
  } else {
    result.warn('Coverage gaps', `${gaps.length} topics from recent logs not in MEMORY.md (showing first 5): ${gaps.slice(0, 5).join('; ')}`,
      'Review recent daily logs and promote key topics to MEMORY.md');
  }
}

// Main
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const memoryPath = args[0] || path.join(process.env.HOME, '.openclaw/workspace/MEMORY.md');
const workspacePath = path.dirname(memoryPath);

const result = audit(memoryPath, workspacePath);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(result.toJSON(), null, 2));
} else {
  console.log(result.toString());
}

process.exit(result.exitCode);
