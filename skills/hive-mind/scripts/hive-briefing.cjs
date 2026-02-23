#!/usr/bin/env node
/**
 * 🐝 Hive Mind Morning Briefing
 * Get new knowledge for agent onboarding
 */

const https = require('https');
const { URL } = require('url');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fcgiuzmmvcnovaciykbx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    since: 'yesterday',
    categories: null,
    tags: null,
    compact: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--since' && args[i+1]) opts.since = args[++i];
    else if (arg === '--categories' && args[i+1]) opts.categories = args[++i].split(',');
    else if (arg === '--tags' && args[i+1]) opts.tags = args[++i].split(',');
    else if (arg === '--compact') opts.compact = true;
    else if (arg === '--help') {
      console.log(`
🐝 Hive Mind Morning Briefing

Usage: node hive-briefing.cjs [options]

Options:
  --since <when>        Time window: yesterday, week, or ISO date (default: yesterday)
  --categories <c1,c2>  Only these categories
  --tags <t1,t2>        Only entries with these tags
  --compact             Short format for context injection
  --help                Show this help

Examples:
  node hive-briefing.cjs --since yesterday
  node hive-briefing.cjs --categories decision,warning --compact
  node hive-briefing.cjs --since 2026-02-20
`);
      process.exit(0);
    }
  }
  return opts;
}

function getSinceDate(since) {
  if (since === 'yesterday') {
    return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  } else if (since === 'week') {
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  } else {
    return new Date(since).toISOString();
  }
}

async function query(opts) {
  const since = getSinceDate(opts.since);
  let url = `${SUPABASE_URL}/rest/v1/bjs_knowledge?select=*&order=created_at.desc&created_at=gte.${since}`;
  
  if (opts.categories) {
    url += `&category=in.(${opts.categories.join(',')})`;
  }
  
  if (opts.tags) {
    url += `&tags=ov.{${opts.tags.join(',')}}`;
  }
  
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function formatBriefing(entries, compact) {
  if (compact) {
    // Short format for context injection
    return entries.map(e => `[${e.category.toUpperCase()}] ${e.title}: ${e.content.substring(0, 200)}...`).join('\n\n');
  }
  
  // Group by category
  const grouped = {};
  entries.forEach(e => {
    if (!grouped[e.category]) grouped[e.category] = [];
    grouped[e.category].push(e);
  });
  
  let output = `
🐝 HIVE MIND BRIEFING
${'═'.repeat(60)}
Since: ${entries.length > 0 ? new Date(entries[entries.length-1].created_at).toLocaleDateString() : 'N/A'}
Total new entries: ${entries.length}
`;
  
  const categoryIcons = {
    decision: '🎯',
    insight: '💡',
    pattern: '🔄',
    warning: '⚠️',
    sop: '📋',
    escalation: '🚨'
  };
  
  for (const [cat, items] of Object.entries(grouped)) {
    output += `\n${categoryIcons[cat] || '📌'} ${cat.toUpperCase()} (${items.length})\n`;
    items.forEach(item => {
      output += `   • ${item.title}\n     ${item.content.substring(0, 150)}...\n     By: ${item.created_by}\n`;
    });
  }
  
  if (entries.length === 0) {
    output += '\n✅ No new hive knowledge since last check.\n';
  }
  
  return output;
}

async function main() {
  const opts = parseArgs();
  
  if (!SUPABASE_KEY) {
    console.error('❌ SUPABASE_KEY required');
    process.exit(1);
  }
  
  try {
    const entries = await query(opts);
    console.log(formatBriefing(entries, opts.compact));
  } catch (error) {
    console.error('❌ Briefing failed:', error.message);
    process.exit(1);
  }
}

main();
