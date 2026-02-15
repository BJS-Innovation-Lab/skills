#!/usr/bin/env node
/**
 * generate-highlights.cjs — Create a local "team bulletin board" file
 * from the most important shared knowledge in Supabase.
 * 
 * Runs after sync-memory.cjs. Pulls top entries by tier and writes
 * a small markdown file that agents load on boot. Zero embedding cost.
 * 
 * Usage: node generate-highlights.cjs
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || '/Users/sybil/.openclaw/workspace';
const OUTPUT = path.join(WORKSPACE, 'memory', 'team-highlights.md');

// Load env
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf8').split('\n');
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.+)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

async function fetchTopEntries() {
  // Get most recent high-confidence entries from documents table
  // Grouped by doc_type, ordered by recency
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/documents?select=title,content,doc_type,agent_name,file_path,metadata,created_at&order=created_at.desc&limit=50`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!resp.ok) {
    throw new Error(`Supabase query failed: ${resp.status}`);
  }

  return resp.json();
}

function buildHighlights(entries) {
  const now = new Date().toISOString();
  let md = `# Team Highlights\n`;
  md += `*Auto-generated from shared knowledge base. Last updated: ${now}*\n`;
  md += `*This file is read-only — regenerated every 30 min by generate-highlights.cjs*\n\n`;
  md += `---\n\n`;

  // Group by tier
  const core = entries.filter(e => {
    const meta = e.metadata || {};
    return meta.tier === 'core';
  });
  const working = entries.filter(e => {
    const meta = e.metadata || {};
    return meta.tier === 'working';
  });
  const learning = entries.filter(e => {
    const meta = e.metadata || {};
    return meta.tier === 'learning';
  });

  // Core principles (always show)
  if (core.length > 0) {
    md += `## Core Knowledge\n`;
    const seen = new Set();
    for (const e of core.slice(0, 10)) {
      const key = e.file_path;
      if (seen.has(key)) continue;
      seen.add(key);
      md += `- **${e.title || e.file_path}** (${e.agent_name || 'unknown'})\n`;
    }
    md += `\n`;
  }

  // Recent working context
  if (working.length > 0) {
    md += `## Active Projects\n`;
    const seen = new Set();
    for (const e of working.slice(0, 8)) {
      const key = e.file_path;
      if (seen.has(key)) continue;
      seen.add(key);
      md += `- **${e.title || e.file_path}** (${e.agent_name || 'unknown'})\n`;
    }
    md += `\n`;
  }

  // Recent learnings
  if (learning.length > 0) {
    md += `## Recent Learnings\n`;
    const seen = new Set();
    for (const e of learning.slice(0, 8)) {
      const key = e.file_path;
      if (seen.has(key)) continue;
      seen.add(key);
      md += `- **${e.title || e.file_path}** (${e.agent_name || 'unknown'})\n`;
    }
    md += `\n`;
  }

  md += `---\n`;
  md += `*For detailed search, query the shared knowledge base in Supabase.*\n`;

  return md;
}

async function main() {
  console.log('Generating team highlights...');
  const entries = await fetchTopEntries();
  const highlights = buildHighlights(entries);
  
  // Ensure directory exists
  const dir = path.dirname(OUTPUT);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  fs.writeFileSync(OUTPUT, highlights);
  console.log(`Written ${OUTPUT} (${entries.length} entries processed)`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
