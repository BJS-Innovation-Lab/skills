#!/usr/bin/env node
/**
 * 🐝 Hive Mind Add Script
 * Add new knowledge to the collective
 */

const https = require('https');
const { URL } = require('url');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fcgiuzmmvcnovaciykbx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    title: null,
    content: null,
    category: 'insight',
    tags: [],
    createdBy: process.env.AGENT_NAME || 'unknown'
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--title' && args[i+1]) opts.title = args[++i];
    else if (arg === '--content' && args[i+1]) opts.content = args[++i];
    else if (arg === '--category' && args[i+1]) opts.category = args[++i];
    else if (arg === '--tags' && args[i+1]) opts.tags = args[++i].split(',').map(t => t.trim());
    else if (arg === '--by' && args[i+1]) opts.createdBy = args[++i];
    else if (arg === '--help') {
      console.log(`
🐝 Hive Mind Add

Usage: node hive-add.cjs --title "..." --content "..." [options]

Required:
  --title <text>      Short title for the knowledge
  --content <text>    Full content/explanation

Options:
  --category <cat>    Category: decision|insight|pattern|warning|sop|escalation (default: insight)
  --tags <t1,t2>      Comma-separated tags
  --by <name>         Creator name (default: from AGENT_NAME env)
  --help              Show this help

Examples:
  node hive-add.cjs --title "Customer refund policy" --content "Always route to Johan..." --category escalation --tags "customer,refund"
`);
      process.exit(0);
    }
  }
  return opts;
}

async function addKnowledge(opts) {
  const body = JSON.stringify({
    title: opts.title,
    content: opts.content,
    category: opts.category,
    tags: opts.tags,
    created_by: opts.createdBy,
    version: 1
  });
  
  return new Promise((resolve, reject) => {
    const parsed = new URL(`${SUPABASE_URL}/rest/v1/bjs_knowledge`);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(result.message || data));
          } else {
            resolve(result);
          }
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const opts = parseArgs();
  
  if (!opts.title || !opts.content) {
    console.error('❌ --title and --content are required. Use --help for usage.');
    process.exit(1);
  }
  
  if (!SUPABASE_KEY) {
    console.error('❌ SUPABASE_KEY or SUPABASE_ANON_KEY required');
    process.exit(1);
  }
  
  const validCategories = ['decision', 'insight', 'pattern', 'warning', 'sop', 'escalation'];
  if (!validCategories.includes(opts.category)) {
    console.error(`❌ Invalid category. Must be one of: ${validCategories.join(', ')}`);
    process.exit(1);
  }
  
  try {
    const result = await addKnowledge(opts);
    console.log(`
🐝 KNOWLEDGE ADDED TO HIVE

   ID: ${result[0]?.id || result.id || 'created'}
   Title: ${opts.title}
   Category: ${opts.category}
   Tags: ${opts.tags.join(', ') || 'none'}
   By: ${opts.createdBy}
   
✅ Other agents can now query this knowledge.
`);
  } catch (error) {
    console.error('❌ Failed to add:', error.message);
    process.exit(1);
  }
}

main();
