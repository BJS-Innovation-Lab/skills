#!/usr/bin/env node
/**
 * 🐝 Hive Mind Query Script
 * Search and retrieve collective knowledge from bjs_knowledge
 */

const https = require('https');
const { URL } = require('url');

// Auto-load env vars from rag/.env
require('./env-loader.cjs').loadEnv();

// Required env vars - no hardcoded fallbacks
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    search: null,
    category: null,
    tag: null,
    recent: null,
    limit: 10,
    json: false,
    namespace: null,        // Filter to specific namespace (e.g., "vulkn", "client:acme", "general")
    excludeClient: false    // Field agents: exclude client-specific entries from other clients
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--search' && args[i+1]) opts.search = args[++i];
    else if (arg === '--category' && args[i+1]) opts.category = args[++i];
    else if (arg === '--tag' && args[i+1]) opts.tag = args[++i];
    else if (arg === '--recent' && args[i+1]) opts.recent = parseInt(args[++i]);
    else if (arg === '--limit' && args[i+1]) opts.limit = parseInt(args[++i]);
    else if (arg === '--namespace' && args[i+1]) opts.namespace = args[++i];
    else if (arg === '--exclude-client') opts.excludeClient = true;
    else if (arg === '--json') opts.json = true;
    else if (arg === '--help') {
      console.log(`
🐝 Hive Mind Query

Usage: node hive-query.cjs [options]

Options:
  --search <text>     Full-text search in title and content
  --category <cat>    Filter by category (decision|insight|pattern|warning|sop|escalation)
  --tag <tag>         Filter by tag
  --recent <days>     Only entries from last N days
  --limit <n>         Max results (default: 10)
  --json              Output as JSON
  --help              Show this help

Examples:
  node hive-query.cjs --search "refund"
  node hive-query.cjs --category decision --recent 7
  node hive-query.cjs --tag architecture --json
`);
      process.exit(0);
    }
  }
  return opts;
}

async function query(opts) {
  let url = `${SUPABASE_URL}/rest/v1/bjs_knowledge?select=*&order=created_at.desc&limit=${opts.limit}`;
  
  if (opts.category) {
    url += `&category=eq.${opts.category}`;
  }
  
  if (opts.tag) {
    url += `&tags=cs.{${opts.tag}}`;
  }
  
  if (opts.recent) {
    const since = new Date(Date.now() - opts.recent * 24 * 60 * 60 * 1000).toISOString();
    url += `&created_at=gte.${since}`;
  }
  
  if (opts.search) {
    // Use or filter for title and content
    url += `&or=(title.ilike.*${encodeURIComponent(opts.search)}*,content.ilike.*${encodeURIComponent(opts.search)}*)`;
  }
  
  if (opts.namespace) {
    // Filter to specific namespace (e.g., "vulkn", "client:acme", "general")
    url += `&namespace=eq.${encodeURIComponent(opts.namespace)}`;
  }
  
  if (opts.excludeClient) {
    // Field agents: only see vulkn (HQ) and general knowledge, not other clients
    url += `&or=(namespace.eq.vulkn,namespace.eq.general,namespace.is.null)`;
  }
  
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
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

function formatEntry(entry) {
  const tags = entry.tags?.join(', ') || 'none';
  return `
📌 ${entry.title}
   Category: ${entry.category} | Tags: ${tags}
   By: ${entry.created_by} | ${new Date(entry.created_at).toLocaleDateString()}
   
   ${entry.content.substring(0, 300)}${entry.content.length > 300 ? '...' : ''}
${'─'.repeat(60)}`;
}

async function main() {
  const opts = parseArgs();
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing required env vars:');
    if (!SUPABASE_URL) console.error('   - SUPABASE_URL');
    if (!SUPABASE_KEY) console.error('   - SUPABASE_KEY or SUPABASE_ANON_KEY');
    console.error('\nSet these in your environment or source your .env file first.');
    process.exit(1);
  }
  
  try {
    const results = await query(opts);
    
    if (opts.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log(`\n🐝 HIVE KNOWLEDGE (${results.length} results)\n${'═'.repeat(60)}`);
      
      if (results.length === 0) {
        console.log('\nNo matching entries found.');
      } else {
        results.forEach(entry => console.log(formatEntry(entry)));
      }
    }
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    process.exit(1);
  }
}

main();
