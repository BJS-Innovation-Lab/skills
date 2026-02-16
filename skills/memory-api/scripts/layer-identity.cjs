#!/usr/bin/env node
/**
 * Layer 1: Identity — Always loaded, static core
 * Reads SOUL.md, IDENTITY.md, and memory/core/ essentials
 * Budget: ~800 chars
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');

function loadFile(relPath, maxChars) {
  const fullPath = path.join(WORKSPACE, relPath);
  if (!fs.existsSync(fullPath)) return '';
  const content = fs.readFileSync(fullPath, 'utf-8');
  return content.substring(0, maxChars);
}

function extractIdentity() {
  const parts = [];

  // IDENTITY.md — compact agent identity
  const identity = loadFile('IDENTITY.md', 500);
  if (identity) {
    // Extract key fields only
    const lines = identity.split('\n').filter(l => l.startsWith('- **') || l.startsWith('# '));
    parts.push(lines.join('\n'));
  }

  // Core principles from SOUL.md — extract just the core truths section
  const soul = loadFile('SOUL.md', 2000);
  if (soul) {
    const coreMatch = soul.match(/## Core Truths([\s\S]*?)(?=## |$)/);
    if (coreMatch) {
      // Compress: extract just the bold headers
      const principles = coreMatch[1]
        .split('\n')
        .filter(l => l.startsWith('**'))
        .map(l => l.match(/\*\*([^*]+)\*\*/)?.[1] || '')
        .filter(Boolean)
        .map(p => `- ${p.trim().replace(/\.$/, '')}`)
        .join('\n');
      parts.push('## Principles\n' + principles);
    }
  }

  // Core operating principles from memory/core/
  const coreDir = path.join(WORKSPACE, 'memory', 'core');
  if (fs.existsSync(coreDir)) {
    const files = fs.readdirSync(coreDir).filter(f => f.endsWith('.md'));
    for (const file of files.slice(0, 3)) {
      const content = fs.readFileSync(path.join(coreDir, file), 'utf-8');
      // Just first 200 chars of each core file
      const summary = content.substring(0, 200).split('\n').slice(0, 5).join('\n');
      if (summary.trim()) parts.push(summary);
    }
  }

  return parts.join('\n\n');
}

if (require.main === module) {
  const result = extractIdentity();
  console.log(result);
  process.stderr.write(`[layer-identity] ${result.length} chars\n`);
}

module.exports = { extractIdentity };
