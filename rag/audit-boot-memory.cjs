#!/usr/bin/env node
/**
 * Boot Memory Auditor — validates MEMORY.md structure against spec
 * 
 * Usage: node audit-boot-memory.cjs [path-to-MEMORY.md]
 * Default: ~/.openclaw/workspace/MEMORY.md
 * 
 * Checks:
 *   1. Character count (hard limit 4166, warn at 3500)
 *   2. Required sections present and in correct order
 *   3. Section content validation (not empty, not too long)
 *   4. File pointers exist on disk
 *   5. Recent Learning freshness (entries >7 days = stale)
 *   6. Active Goals count (max 3 recommended)
 *   7. Operating Principles count (max 4 recommended)
 *   8. Information density (chars per section)
 * 
 * Exit codes: 0 = pass, 1 = warnings, 2 = failures
 */

const fs = require('fs');
const path = require('path');

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

    return lines.join('\n');
  }
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

  // 4. Check file pointers exist
  const filePointerPattern = /`(memory\/(?!YYYY)[^`]+|projects\/[^`]+|research\/[^`]+)`/g;
  let match;
  let pointersChecked = 0;
  let pointersBroken = 0;
  while ((match = filePointerPattern.exec(content)) !== null) {
    const filePath = path.join(workspacePath, match[1]);
    pointersChecked++;
    // Check if it's a file or directory
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

  return result;
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
