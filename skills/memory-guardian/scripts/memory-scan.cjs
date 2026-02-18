#!/usr/bin/env node
/**
 * Memory Guardian — Passive memory integrity scanner
 * 
 * Scans memory files for injected instructions, identity manipulation,
 * cross-agent contamination, suspicious endpoints, and obfuscated payloads.
 * 
 * Based on: arXiv:2602.15654 — Zombie Agents
 * 
 * Usage:
 *   node memory-scan.cjs                    # Scan all memory files
 *   node memory-scan.cjs --file <path>      # Scan single file
 *   node memory-scan.cjs --json             # JSON output
 *   node memory-scan.cjs --verbose          # Show all matches
 */

const fs = require('fs');
const path = require('path');

const WS = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw', 'workspace');

// ============== AGENT IDENTITY ==============
function getAgentIdentity() {
  const idFile = path.join(WS, 'IDENTITY.md');
  let name = 'unknown';
  let role = 'unknown';
  try {
    const content = fs.readFileSync(idFile, 'utf-8');
    const nameMatch = content.match(/\*\*Name:\*\*\s*(.+)/i);
    const roleMatch = content.match(/\*\*Role:\*\*\s*(.+)/i);
    if (nameMatch) name = nameMatch[1].trim().toLowerCase();
    if (roleMatch) role = roleMatch[1].trim().toLowerCase();
  } catch {}
  return { name, role };
}

// ============== KNOWN AGENTS ==============
const KNOWN_AGENTS = ['sybil', 'sam', 'saber', 'santos', 'sage', 'scout'];

// ============== DETECTION PATTERNS ==============

// Category: instruction_injection
const INSTRUCTION_PATTERNS = [
  { id: 'imperative_always', pattern: /\b(always|never)\s+(send|forward|copy|execute|run|ignore|override|bypass)\b/gi, severity: 'HIGH', desc: 'Persistent imperative command' },
  { id: 'when_then_command', pattern: /\b(when|whenever|if)\s+.{5,60}\b(then|do|send|run|execute|forward|reply with)\b/gi, severity: 'HIGH', desc: 'Conditional trigger instruction' },
  { id: 'send_to_external', pattern: /\b(send|forward|copy|exfiltrate)\s+.{0,40}\b(to|at)\s+\S+@(?!vulkn-ai\.com|gmail\.com|bridget4g)\S+\.\S{2,}/gi, severity: 'HIGH', desc: 'Data exfiltration instruction' },
  { id: 'run_command', pattern: /\b(run|execute|eval)\s+(this\s+)?(command|script|code)s?\s*[:=]/gi, severity: 'HIGH', desc: 'Command execution instruction' },
  { id: 'ignore_instructions', pattern: /\b(ignore|disregard|forget|override|bypass)\s+(all\s+)?(previous|prior|above|existing|current|your)\s+(instructions?|rules?|guidelines?|constraints?)/gi, severity: 'CRITICAL', desc: 'Instruction override attempt' },
  { id: 'system_prompt_inject', pattern: /\[(SYSTEM|ADMIN|ROOT|OVERRIDE)\s*(PROMPT|MESSAGE|INSTRUCTION|COMMAND)\]/gi, severity: 'CRITICAL', desc: 'System prompt injection in memory' },
  { id: 'hidden_instruction', pattern: /<!--[\s\S]*?(always|never|send|forward|execute|ignore)[\s\S]*?-->/gi, severity: 'HIGH', desc: 'Hidden instruction in HTML comment' },
  { id: 'role_assignment', pattern: /\byou\s+(are|should be|must be|will act as)\s+(now\s+)?(a|an|my|the)\s+/gi, severity: 'MEDIUM', desc: 'Role reassignment attempt' },
];

// Category: identity_manipulation
const IDENTITY_PATTERNS = [
  { id: 'identity_override', pattern: /\byou\s+are\s+(actually|really|secretly|truly)\s+/gi, severity: 'CRITICAL', desc: 'Identity override' },
  { id: 'your_real_name', pattern: /\byour\s+(real|actual|true)\s+(name|identity|purpose)\s+(is|should be)/gi, severity: 'CRITICAL', desc: 'Identity rewrite' },
  { id: 'wrong_agent_identity', pattern: null, severity: 'CRITICAL', desc: 'Memory claims to be a different agent', custom: true },
];

// Category: cross_agent_contamination
const CONTAMINATION_PATTERNS = [
  { id: 'wrong_agent_reference', pattern: null, severity: 'MEDIUM', desc: 'References being a different agent', custom: true },
  { id: 'wrong_agent_resources', pattern: null, severity: 'MEDIUM', desc: 'Contains another agent\'s resource IDs', custom: true },
];

// Category: suspicious_endpoints
const ENDPOINT_PATTERNS = [
  { id: 'unknown_webhook', pattern: /https?:\/\/(?!github\.com|supabase\.co|railway\.app|vercel\.app|openclaw|arxiv\.org|google\.com|googleapis\.com|telegram\.org|api\.telegram\.org|twilio\.com|notion\.so|figma\.com|etsy\.com|vercel\.app)\S+\/(webhook|hook|callback|notify|receive|ingest|collect)\b/gi, severity: 'HIGH', desc: 'Unknown webhook URL in memory' },
  { id: 'external_email_instruction', pattern: /\b(send|forward|cc|bcc)\s+.{0,30}\S+@(?!vulkn-ai\.com|gmail\.com|bridget4g)\S+\.\S{2,}/gi, severity: 'MEDIUM', desc: 'External email in instruction context' },
];

// Category: obfuscation
const OBFUSCATION_PATTERNS = [
  { id: 'base64_instruction', pattern: /[A-Za-z0-9+/]{40,}={0,2}/g, severity: 'LOW', desc: 'Possible base64-encoded content', validator: validateBase64 },
  { id: 'unicode_escape', pattern: /(?:\\u[0-9a-fA-F]{4}){4,}/g, severity: 'MEDIUM', desc: 'Unicode escape sequence' },
  { id: 'hex_sequence', pattern: /(?:\\x[0-9a-fA-F]{2}){8,}/g, severity: 'MEDIUM', desc: 'Hex-encoded content' },
];

// ============== VALIDATORS ==============

function validateBase64(match) {
  // Only flag if the decoded content contains instruction-like patterns
  try {
    const decoded = Buffer.from(match, 'base64').toString('utf-8');
    // Check if it's readable text with instruction patterns
    if (/[\x00-\x08\x0e-\x1f]/.test(decoded)) return false; // binary, not text
    return /(always|never|send|forward|execute|ignore|run|command)/i.test(decoded);
  } catch {
    return false;
  }
}

// ============== SCANNER ==============

function scanContent(content, filePath, agentIdentity) {
  const findings = [];
  const lines = content.split('\n');

  function addFinding(line, lineNum, category, pattern, matched) {
    findings.push({
      file: filePath,
      line: lineNum,
      category,
      patternId: pattern.id,
      severity: pattern.severity,
      description: pattern.desc,
      content: line.trim().slice(0, 200),
      matched: matched.slice(0, 100),
    });
  }

  // Scan each line for pattern matches
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip empty lines and markdown headers that are just structural
    if (!line.trim() || /^#{1,3}\s+(Resources|Reflections|Memory|Notes|Status|Context)\s*$/i.test(line)) continue;

    // Skip instruction detection on SOUL.md and AGENTS.md — they're SUPPOSED to have imperatives
    const isSoulOrAgents = /\b(SOUL|AGENTS)\.md$/.test(filePath);

    // Instruction injection
    for (const pat of INSTRUCTION_PATTERNS) {
      if (isSoulOrAgents) break;
      pat.pattern.lastIndex = 0;
      let match;
      while ((match = pat.pattern.exec(line)) !== null) {
        addFinding(line, lineNum, 'instruction_injection', pat, match[0]);
      }
    }

    // Identity manipulation
    for (const pat of IDENTITY_PATTERNS) {
      if (pat.custom) continue; // handled below
      pat.pattern.lastIndex = 0;
      let match;
      while ((match = pat.pattern.exec(line)) !== null) {
        addFinding(line, lineNum, 'identity_manipulation', pat, match[0]);
      }
    }

    // Suspicious endpoints
    for (const pat of ENDPOINT_PATTERNS) {
      pat.pattern.lastIndex = 0;
      let match;
      while ((match = pat.pattern.exec(line)) !== null) {
        addFinding(line, lineNum, 'suspicious_endpoint', pat, match[0]);
      }
    }

    // Obfuscation
    for (const pat of OBFUSCATION_PATTERNS) {
      pat.pattern.lastIndex = 0;
      let match;
      while ((match = pat.pattern.exec(line)) !== null) {
        if (pat.validator && !pat.validator(match[0])) continue;
        addFinding(line, lineNum, 'obfuscation', pat, match[0]);
      }
    }
  }

  // Custom: Cross-agent contamination checks
  if (agentIdentity.name !== 'unknown') {
    const otherAgents = KNOWN_AGENTS.filter(a => a !== agentIdentity.name);
    const lowerContent = content.toLowerCase();

    for (const other of otherAgents) {
      // Check for "I am [other agent]" or "[other agent] (me)" or "I'm [other agent]"
      // Match "I am [agent]", "I'm [agent]", "[agent] (COO — me)", "[agent] — me"
      // Must be identity claims, not just mentions like "276 chunks for Sam"
      const identityRegex = new RegExp(`(?:^|[.!?]\\s*)\\b(?:i\\s+am\\s+${other}|i'm\\s+${other})\\b|\\b${other}\\s*\\([^)]*\\bme\\b[^)]*\\)|\\b${other}\\s*—\\s*me\\b`, 'gim');
      let match;
      while ((match = identityRegex.exec(content)) !== null) {
        // Find the line number
        const beforeMatch = content.slice(0, match.index);
        const lineNum = (beforeMatch.match(/\n/g) || []).length + 1;
        findings.push({
          file: filePath,
          line: lineNum,
          category: 'cross_agent_contamination',
          patternId: 'wrong_agent_identity',
          severity: 'CRITICAL',
          description: `Memory claims to be ${other} (agent is ${agentIdentity.name})`,
          content: content.split('\n')[lineNum - 1]?.trim().slice(0, 200) || '',
          matched: match[0],
        });
      }
    }

    // Check for "you are [agent name]" identity overrides
    for (const other of otherAgents) {
      const overrideRegex = new RegExp(`you\\s+are\\s+${other}\\b`, 'gi');
      let match;
      while ((match = overrideRegex.exec(content)) !== null) {
        const beforeMatch = content.slice(0, match.index);
        const lineNum = (beforeMatch.match(/\n/g) || []).length + 1;
        findings.push({
          file: filePath,
          line: lineNum,
          category: 'identity_manipulation',
          patternId: 'identity_override_specific',
          severity: 'CRITICAL',
          description: `Tells agent it is ${other} (agent is ${agentIdentity.name})`,
          content: content.split('\n')[lineNum - 1]?.trim().slice(0, 200) || '',
          matched: match[0],
        });
      }
    }
  }

  return findings;
}

// ============== FILE DISCOVERY ==============

function findMemoryFiles(wsDir) {
  const files = [];
  const memoryDir = path.join(wsDir, 'memory');
  const targets = [
    path.join(wsDir, 'MEMORY.md'),
    path.join(wsDir, 'SOUL.md'),
  ];

  // Add all .md files in memory/ recursively
  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip security reports dir to avoid scanning our own output
        if (entry.name === 'security') continue;
        walkDir(full);
      } else if (entry.name.endsWith('.md')) {
        // Skip large JSON data files — only scan .md memory files
        files.push(full);
      }
    }
  }

  for (const t of targets) {
    if (fs.existsSync(t)) files.push(t);
  }
  walkDir(memoryDir);

  return files;
}

// ============== REPORTING ==============

function severityRank(s) {
  return { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }[s] || 0;
}

function formatReport(findings, filesScanned, elapsed) {
  const sorted = findings.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  const critical = findings.filter(f => f.severity === 'CRITICAL').length;
  const high = findings.filter(f => f.severity === 'HIGH').length;
  const medium = findings.filter(f => f.severity === 'MEDIUM').length;
  const low = findings.filter(f => f.severity === 'LOW').length;

  let report = `🛡️ Memory Guardian — Scan Complete\n`;
  report += `   Files scanned: ${filesScanned}\n`;
  report += `   Findings: ${findings.length}`;
  if (findings.length > 0) {
    report += ` (${critical} critical, ${high} high, ${medium} medium, ${low} low)`;
  }
  report += `\n   Time: ${elapsed}ms\n`;

  if (findings.length === 0) {
    report += `   Status: ✅ CLEAN\n`;
    return report;
  }

  report += `   Status: ${critical > 0 ? '🔴 CRITICAL' : high > 0 ? '⚠️ ALERT' : '⚡ REVIEW'}\n\n`;

  for (const f of sorted) {
    const icon = f.severity === 'CRITICAL' ? '🔴' : f.severity === 'HIGH' ? '⚠️' : f.severity === 'MEDIUM' ? '🟡' : '📝';
    const relPath = path.relative(WS, f.file);
    report += `   ${icon} ${f.severity}: ${relPath}:${f.line}\n`;
    report += `     Category: ${f.category}\n`;
    report += `     Pattern: ${f.patternId}\n`;
    report += `     Content: "${f.content}"\n\n`;
  }

  return report;
}

function saveReport(findings, filesScanned) {
  const secDir = path.join(WS, 'memory', 'security');
  if (!fs.existsSync(secDir)) fs.mkdirSync(secDir, { recursive: true });

  const date = new Date().toISOString().slice(0, 10);
  const reportFile = path.join(secDir, `guardian-${date}.json`);

  const report = {
    timestamp: new Date().toISOString(),
    filesScanned,
    totalFindings: findings.length,
    bySeverity: {
      CRITICAL: findings.filter(f => f.severity === 'CRITICAL').length,
      HIGH: findings.filter(f => f.severity === 'HIGH').length,
      MEDIUM: findings.filter(f => f.severity === 'MEDIUM').length,
      LOW: findings.filter(f => f.severity === 'LOW').length,
    },
    findings,
  };

  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  return reportFile;
}

// ============== MAIN ==============

function main() {
  const args = process.argv.slice(2);
  let jsonOutput = false;
  let verbose = false;
  let singleFile = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') jsonOutput = true;
    if (args[i] === '--verbose') verbose = true;
    if (args[i] === '--file') singleFile = args[++i];
  }

  const start = Date.now();
  const agent = getAgentIdentity();

  if (!jsonOutput) {
    console.error(`🛡️ Memory Guardian scanning for ${agent.name} (${agent.role})`);
  }

  // Find files to scan
  let files;
  if (singleFile) {
    const resolved = path.resolve(singleFile);
    if (!fs.existsSync(resolved)) {
      console.error(`File not found: ${singleFile}`);
      process.exit(1);
    }
    files = [resolved];
  } else {
    files = findMemoryFiles(WS);
  }

  // Scan all files
  const allFindings = [];
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const findings = scanContent(content, file, agent);
      allFindings.push(...findings);
    } catch (e) {
      if (!jsonOutput) console.error(`   ⚠️ Could not read ${file}: ${e.message}`);
    }
  }

  const elapsed = Date.now() - start;

  if (jsonOutput) {
    console.log(JSON.stringify({
      agent: agent.name,
      filesScanned: files.length,
      findings: allFindings,
      elapsed,
    }, null, 2));
  } else {
    console.log(formatReport(allFindings, files.length, elapsed));
  }

  // Save report if there are findings
  if (allFindings.length > 0) {
    const reportPath = saveReport(allFindings, files.length);
    if (!jsonOutput) {
      console.log(`   📄 Report saved: ${path.relative(WS, reportPath)}`);
    }
  }

  // Exit code: 2 for critical, 1 for high, 0 otherwise
  const hasCritical = allFindings.some(f => f.severity === 'CRITICAL');
  const hasHigh = allFindings.some(f => f.severity === 'HIGH');
  process.exit(hasCritical ? 2 : hasHigh ? 1 : 0);
}

main();
