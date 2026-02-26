#!/usr/bin/env node
/**
 * Safe Respond — Unified pre-send wrapper for field agents
 * 
 * Combines:
 * 1. Security scan (blocks API keys, secrets, PII)
 * 2. Hedging detection (triggers consultation if uncertain)
 * 
 * Usage:
 *   node safe-respond.cjs "Your response to the customer"
 *   node safe-respond.cjs --file response.txt
 *   echo "response" | node safe-respond.cjs --stdin
 * 
 * Exit codes:
 *   0 = Safe to send
 *   1 = Hedging detected, needs consultation
 *   2 = Security issue, blocked
 *   3 = Error
 */

const fs = require('fs');
const path = require('path');

// ============ SECURITY PATTERNS (from field-security) ============
const SECURITY_PATTERNS = [
  // API Keys
  { regex: /sk-ant-[a-zA-Z0-9_-]{20,}/g, label: 'Anthropic API key', severity: 'CRITICAL' },
  { regex: /sk-[a-zA-Z0-9]{20,}/g, label: 'OpenAI API key', severity: 'CRITICAL' },
  { regex: /AIza[0-9A-Za-z_-]{35}/g, label: 'Google API key', severity: 'CRITICAL' },
  { regex: /ghp_[a-zA-Z0-9]{36}/g, label: 'GitHub token', severity: 'CRITICAL' },
  { regex: /AKIA[0-9A-Z]{16}/g, label: 'AWS access key', severity: 'CRITICAL' },
  { regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, 
    label: 'JWT token', severity: 'CRITICAL' },
  
  // Connection strings
  { regex: /postgres(ql)?:\/\/[^\s]+:[^\s]+@[^\s]+/gi, label: 'Database connection string', severity: 'CRITICAL' },
  { regex: /mongodb(\+srv)?:\/\/[^\s]+:[^\s]+@[^\s]+/gi, label: 'MongoDB connection string', severity: 'CRITICAL' },
  
  // Plaintext secrets
  { regex: /password\s*[=:]\s*["']?[^\s"']{8,}/gi, label: 'Password in plaintext', severity: 'CRITICAL' },
  { regex: /secret\s*[=:]\s*["']?[^\s"']{8,}/gi, label: 'Secret in plaintext', severity: 'CRITICAL' },
  
  // Environment variables
  { regex: /SUPABASE_(URL|KEY|SERVICE_KEY|ANON_KEY)\s*=\s*\S+/gi, label: 'Supabase credential', severity: 'CRITICAL' },
  { regex: /API_KEY\s*=\s*\S+/gi, label: 'API key env var', severity: 'CRITICAL' },
  
  // PII patterns
  { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, label: 'Email address', severity: 'MEDIUM', 
    check: (match, text) => !text.includes('example.com') }, // Allow example emails
  { regex: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, label: 'Phone number', severity: 'MEDIUM' },
  { regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, label: 'Credit card number', severity: 'CRITICAL' },
  { regex: /\b\d{3}-\d{2}-\d{4}\b/g, label: 'SSN', severity: 'CRITICAL' },
];

// ============ HEDGING PATTERNS ============
const HEDGING_PATTERNS = [
  // Direct hedges
  { regex: /\bI think\b/gi, label: 'I think', weight: 1 },
  { regex: /\bI believe\b/gi, label: 'I believe', weight: 1 },
  { regex: /\bmaybe\b/gi, label: 'maybe', weight: 1 },
  { regex: /\bprobably\b/gi, label: 'probably', weight: 1 },
  { regex: /\bperhaps\b/gi, label: 'perhaps', weight: 1 },
  { regex: /\bmight be\b/gi, label: 'might be', weight: 1 },
  { regex: /\bcould be\b/gi, label: 'could be', weight: 1 },
  { regex: /\bI'm not sure\b/gi, label: "I'm not sure", weight: 2 },
  { regex: /\bI'm uncertain\b/gi, label: "I'm uncertain", weight: 2 },
  { regex: /\bnot entirely sure\b/gi, label: 'not entirely sure', weight: 2 },
  { regex: /\bI don't know\b/gi, label: "I don't know", weight: 3 },
  
  // Weak suggestions
  { regex: /\byou could try\b/gi, label: 'you could try', weight: 1 },
  { regex: /\byou might want to\b/gi, label: 'you might want to', weight: 1 },
  
  // Uncertainty markers
  { regex: /\bif I remember correctly\b/gi, label: 'if I remember correctly', weight: 2 },
  { regex: /\bI would assume\b/gi, label: 'I would assume', weight: 1 },
  { regex: /\bguessing\b/gi, label: 'guessing', weight: 2 },
];

// Hedging threshold — total weight needed to trigger consultation
const HEDGING_THRESHOLD = 2;

// ============ SCANNING FUNCTIONS ============

function scanSecurity(text) {
  const issues = [];
  
  for (const pattern of SECURITY_PATTERNS) {
    const matches = text.match(pattern.regex);
    if (matches) {
      // If there's a custom check function, use it
      const validMatches = pattern.check 
        ? matches.filter(m => pattern.check(m, text))
        : matches;
      
      if (validMatches.length > 0) {
        issues.push({
          type: 'security',
          label: pattern.label,
          severity: pattern.severity,
          count: validMatches.length,
          samples: validMatches.slice(0, 2).map(m => m.slice(0, 20) + '...')
        });
      }
    }
  }
  
  return issues;
}

function scanHedging(text) {
  const issues = [];
  let totalWeight = 0;
  
  for (const pattern of HEDGING_PATTERNS) {
    const matches = text.match(pattern.regex);
    if (matches) {
      totalWeight += pattern.weight * matches.length;
      issues.push({
        type: 'hedging',
        label: pattern.label,
        count: matches.length,
        weight: pattern.weight * matches.length
      });
    }
  }
  
  return { issues, totalWeight, threshold: HEDGING_THRESHOLD };
}

function analyze(text) {
  const security = scanSecurity(text);
  const hedging = scanHedging(text);
  
  // Determine action
  let action = 'send'; // Safe to send
  let reason = 'Clean — no issues detected';
  
  // Security issues take priority
  const criticalSecurity = security.filter(i => i.severity === 'CRITICAL');
  const highSecurity = security.filter(i => i.severity === 'HIGH');
  
  if (criticalSecurity.length > 0) {
    action = 'block';
    reason = `BLOCKED: ${criticalSecurity.map(i => i.label).join(', ')}`;
  } else if (highSecurity.length > 0) {
    action = 'block';
    reason = `BLOCKED: ${highSecurity.map(i => i.label).join(', ')}`;
  } else if (hedging.totalWeight >= HEDGING_THRESHOLD) {
    action = 'consult';
    reason = `Hedging detected: ${hedging.issues.map(i => i.label).join(', ')}`;
  }
  
  return {
    action, // 'send' | 'consult' | 'block'
    reason,
    security: {
      issues: security,
      hasCritical: criticalSecurity.length > 0,
      hasHigh: highSecurity.length > 0
    },
    hedging: {
      issues: hedging.issues,
      totalWeight: hedging.totalWeight,
      threshold: HEDGING_THRESHOLD,
      triggered: hedging.totalWeight >= HEDGING_THRESHOLD
    },
    textLength: text.length,
    timestamp: new Date().toISOString()
  };
}

// ============ CLI ============

async function main() {
  let text = '';
  
  // Get input
  if (process.argv.includes('--stdin') || !process.stdin.isTTY) {
    // Read from stdin
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    text = Buffer.concat(chunks).toString().trim();
  } else if (process.argv.includes('--file')) {
    const fileIndex = process.argv.indexOf('--file') + 1;
    const filePath = process.argv[fileIndex];
    text = fs.readFileSync(filePath, 'utf-8');
  } else {
    // Get from argument
    text = process.argv.slice(2).filter(a => !a.startsWith('--')).join(' ');
  }
  
  if (!text) {
    console.error('Usage: node safe-respond.cjs "response text"');
    console.error('       echo "response" | node safe-respond.cjs --stdin');
    console.error('       node safe-respond.cjs --file response.txt');
    process.exit(3);
  }
  
  const result = analyze(text);
  
  // Output
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.action === 'send') {
      console.log('✅ SAFE TO SEND');
    } else if (result.action === 'consult') {
      console.log('🔮 CONSULTATION NEEDED');
      console.log(`   Reason: ${result.reason}`);
      console.log('   Route to Frontier Lab before sending.');
    } else if (result.action === 'block') {
      console.log('🚫 BLOCKED — DO NOT SEND');
      console.log(`   Reason: ${result.reason}`);
      console.log('   Remove sensitive content and try again.');
    }
  }
  
  // Exit code
  if (result.action === 'send') process.exit(0);
  if (result.action === 'consult') process.exit(1);
  if (result.action === 'block') process.exit(2);
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(3);
});

module.exports = { analyze, scanSecurity, scanHedging };
