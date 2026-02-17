#!/usr/bin/env node
/**
 * Field Security — Output Scanner
 * 
 * Scans agent OUTPUT before it's sent to clients.
 * Catches accidental credential leaks, internal info exposure, etc.
 * 
 * Usage:
 *   echo "agent response" | node scan-output.cjs [--redact]
 *   node scan-output.cjs "response text" [--redact] [--json]
 * 
 * --redact: Replace detected secrets with [REDACTED] and output clean version
 * 
 * Exit codes: 0 = clean, 1 = secrets found
 */

const fs = require('fs');
const path = require('path');

// Patterns that should NEVER appear in client-facing output
const OUTPUT_PATTERNS = [
  // API Keys
  { regex: /sk-ant-[a-zA-Z0-9_-]{20,}/g, label: 'Anthropic API key', severity: 'CRITICAL' },
  { regex: /sk-[a-zA-Z0-9]{20,}/g, label: 'OpenAI API key', severity: 'CRITICAL' },
  { regex: /AIza[0-9A-Za-z_-]{35}/g, label: 'Google API key', severity: 'CRITICAL' },
  { regex: /ghp_[a-zA-Z0-9]{36}/g, label: 'GitHub token', severity: 'CRITICAL' },
  { regex: /AKIA[0-9A-Z]{16}/g, label: 'AWS access key', severity: 'CRITICAL' },
  { regex: /xox[bpsar]-[a-zA-Z0-9-]{10,}/g, label: 'Slack token', severity: 'CRITICAL' },
  
  // Database credentials
  { regex: /postgres(ql)?:\/\/[^\s]+:[^\s]+@[^\s]+/gi, label: 'PostgreSQL connection string', severity: 'CRITICAL' },
  { regex: /mongodb(\+srv)?:\/\/[^\s]+:[^\s]+@[^\s]+/gi, label: 'MongoDB connection string', severity: 'CRITICAL' },
  { regex: /password\s*[=:]\s*["']?[^\s"']{8,}/gi, label: 'Password in plaintext', severity: 'CRITICAL' },
  
  // Supabase-specific
  { regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, 
    label: 'Supabase/JWT token', severity: 'CRITICAL' },
  { regex: /fcgiuzmmvcnovaciykbx/gi, label: 'Internal Supabase project ref', severity: 'HIGH' },
  
  // Internal infrastructure
  { regex: /a2a-bjs-internal[^\s]*/gi, label: 'Internal A2A relay URL', severity: 'HIGH' },
  { regex: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 
    label: 'UUID (possible agent ID)', severity: 'LOW', check: isInternalUUID },
  
  // .env patterns
  { regex: /^[A-Z_]{3,}=.{8,}/gm, label: 'Environment variable', severity: 'HIGH' },
  { regex: /SUPABASE_(URL|KEY|SERVICE_KEY|ANON_KEY)\s*=\s*\S+/gi, label: 'Supabase env var', severity: 'CRITICAL' },
  { regex: /GEMINI_API_KEY\s*=\s*\S+/gi, label: 'Gemini API key env var', severity: 'CRITICAL' },
  
  // Internal team/agent info
  { regex: /\b(SOUL\.md|AGENTS\.md|HEARTBEAT\.md|IDENTITY\.md)\b/g, label: 'Internal config file reference', severity: 'MEDIUM' },
  { regex: /BJS[\s-]?(Labs|Innovation)/gi, label: 'Internal org name', severity: 'MEDIUM' },
  
  // SSH / Private keys
  { regex: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g, label: 'Private key', severity: 'CRITICAL' },
  { regex: /ssh-rsa\s+AAAA[a-zA-Z0-9+\/]+/g, label: 'SSH public key', severity: 'HIGH' },
];

// Agent UUIDs that should never leak
const INTERNAL_UUIDS = [
  '5fae1839', '415a84a4', '62bb0f39', 'e7fabc18', 'f6198962' // agent ID prefixes
];

function isInternalUUID(match) {
  const prefix = match.slice(0, 8);
  return INTERNAL_UUIDS.includes(prefix);
}

function scanOutput(text) {
  const findings = [];
  
  for (const pattern of OUTPUT_PATTERNS) {
    const matches = text.matchAll(pattern.regex);
    for (const match of matches) {
      // If pattern has a custom check function, apply it
      if (pattern.check && !pattern.check(match[0])) continue;
      
      findings.push({
        label: pattern.label,
        severity: pattern.severity,
        matched: match[0].slice(0, 40) + (match[0].length > 40 ? '...' : ''),
        position: match.index
      });
    }
  }
  
  // Deduplicate by label + position
  const seen = new Set();
  const unique = findings.filter(f => {
    const key = `${f.label}:${f.position}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  return unique;
}

function redactOutput(text, findings) {
  let redacted = text;
  // Sort by position descending so replacements don't shift indices
  const sorted = [...findings].sort((a, b) => (b.position || 0) - (a.position || 0));
  
  for (const f of sorted) {
    // Re-find the match at the position
    for (const pattern of OUTPUT_PATTERNS) {
      const matches = redacted.matchAll(pattern.regex);
      for (const match of matches) {
        if (pattern.check && !pattern.check(match[0])) continue;
        redacted = redacted.replace(match[0], `[REDACTED:${pattern.label}]`);
      }
    }
  }
  
  return redacted;
}

// ============== CLI ==============
function main() {
  const args = process.argv.slice(2);
  let inputText = null;
  let doRedact = false;
  let json = false;
  
  for (const arg of args) {
    if (arg === '--redact') doRedact = true;
    else if (arg === '--json') json = true;
    else if (!arg.startsWith('--')) inputText = arg;
  }
  
  // Read from stdin if no text argument
  if (!inputText) {
    try {
      inputText = fs.readFileSync('/dev/stdin', 'utf-8');
    } catch {
      console.error('Usage: node scan-output.cjs "text" [--redact] [--json]');
      process.exit(1);
    }
  }
  
  const findings = scanOutput(inputText);
  
  if (json) {
    const result = { clean: findings.length === 0, findings };
    if (doRedact && findings.length > 0) result.redacted = redactOutput(inputText, findings);
    console.log(JSON.stringify(result, null, 2));
  } else if (findings.length === 0) {
    console.log('✅ Clean — no secrets or internal info detected');
  } else {
    console.log(`🚨 FOUND ${findings.length} potential leaks:`);
    for (const f of findings) {
      console.log(`  [${f.severity}] ${f.label}: "${f.matched}"`);
    }
    if (doRedact) {
      console.log('\n--- REDACTED OUTPUT ---');
      console.log(redactOutput(inputText, findings));
    }
  }
  
  process.exit(findings.length > 0 ? 1 : 0);
}

module.exports = { scanOutput, redactOutput };

if (require.main === module) main();
