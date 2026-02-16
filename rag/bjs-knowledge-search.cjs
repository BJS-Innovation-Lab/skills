#!/usr/bin/env node
/**
 * bjs-knowledge-search.cjs — Query the BJS Knowledge Base
 * 
 * For field agents: semantic search against HQ-curated knowledge.
 * For HQ agents: check what's in the KB before writing duplicates.
 * 
 * Usage:
 *   node bjs-knowledge-search.cjs "how do I handle a refund request"
 *   node bjs-knowledge-search.cjs "error connecting to API" --category tool-guide
 *   node bjs-knowledge-search.cjs "escalation process" --limit 3
 *   node bjs-knowledge-search.cjs --browse                    # Browse all entries
 *   node bjs-knowledge-search.cjs --browse --category procedure
 *   node bjs-knowledge-search.cjs --id <uuid>                 # Get specific entry
 * 
 * Env: SUPABASE_URL, SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY), OPENAI_API_KEY
 * 
 * Designed to be used by field agents via smart-trigger (hq level)
 * and by Sam after resolving escalations to check for existing entries.
 */

const fs = require('fs');
const path = require('path');

// Load .env
const ENV_PATH = path.join(__dirname, '.env');
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, 'utf-8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.+)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

// --- Argument Parsing ---

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { limit: 5 };
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--category': opts.category = args[++i]; break;
      case '--limit': opts.limit = parseInt(args[++i]); break;
      case '--browse': opts.action = 'browse'; break;
      case '--id': opts.action = 'get'; opts.id = args[++i]; break;
      case '--json': opts.json = true; break;
      case '--compact': opts.compact = true; break;
      case '--help': opts.action = 'help'; break;
      default:
        if (!args[i].startsWith('--')) {
          opts.query = args[i];
        }
    }
  }
  
  return opts;
}

// --- Embedding (Gemini only) ---
const { getEmbedding } = require('./gemini-embed.cjs');

// --- Supabase ---

async function supabaseRequest(endpoint, method, body) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Supabase: ${resp.status} ${err}`);
  }
  
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

// --- Actions ---

async function semanticSearch(opts) {
  if (!opts.query) {
    console.error('Usage: node bjs-knowledge-search.cjs "your question here"');
    console.error('       node bjs-knowledge-search.cjs --help');
    process.exit(1);
  }
  
  if (!OPENAI_KEY) {
    console.error('Error: OPENAI_API_KEY required for semantic search');
    process.exit(1);
  }
  
  const embedding = await getEmbedding(opts.query);
  
  const body = {
    query_embedding: embedding,
    match_count: opts.limit,
    category_filter: opts.category || null
  };
  
  const results = await supabaseRequest('rpc/search_bjs_knowledge', 'POST', body);
  
  if (!results || results.length === 0) {
    if (opts.json) {
      console.log(JSON.stringify({ results: [], query: opts.query }));
    } else {
      console.log('No results found.');
    }
    return;
  }
  
  if (opts.json) {
    console.log(JSON.stringify({ results, query: opts.query }, null, 2));
    return;
  }
  
  if (opts.compact) {
    // Compact format for injection into agent context
    console.log(`## BJS Knowledge Base Results for: "${opts.query}"\n`);
    for (const r of results) {
      const sim = (r.similarity * 100).toFixed(0);
      console.log(`### [${r.category}] ${r.title} (${sim}% match)`);
      console.log(r.content);
      console.log();
    }
    return;
  }
  
  // Full format
  console.log(`\n🔍 Results for: "${opts.query}" (${results.length} found)\n`);
  
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const sim = (r.similarity * 100).toFixed(1);
    console.log(`${i + 1}. [${r.category}] ${r.title}`);
    console.log(`   Match: ${sim}% | ID: ${r.id}`);
    console.log(`   ${r.content}`);
    if (r.tags && r.tags.length) console.log(`   Tags: ${r.tags.join(', ')}`);
    console.log();
  }
}

async function browse(opts) {
  let endpoint = 'bjs_knowledge?select=id,title,content,category,tags,created_by,created_at,version&order=category,created_at.desc';
  
  if (opts.category) {
    endpoint += `&category=eq.${opts.category}`;
  }
  
  if (opts.limit) {
    endpoint += `&limit=${opts.limit * 3}`; // Show more when browsing
  }
  
  const entries = await supabaseRequest(endpoint, 'GET');
  
  if (!entries || entries.length === 0) {
    console.log('Knowledge base is empty.');
    return;
  }
  
  if (opts.json) {
    console.log(JSON.stringify(entries, null, 2));
    return;
  }
  
  console.log(`\n📚 BJS Knowledge Base (${entries.length} entries)\n`);
  
  let currentCategory = '';
  for (const e of entries) {
    if (e.category !== currentCategory) {
      currentCategory = e.category;
      console.log(`\n--- ${currentCategory.toUpperCase()} ---\n`);
    }
    
    const date = new Date(e.created_at).toLocaleDateString();
    console.log(`  📄 ${e.title}`);
    console.log(`     ${e.content.slice(0, 150)}${e.content.length > 150 ? '...' : ''}`);
    console.log(`     By: ${e.created_by} | ${date} | v${e.version} | ID: ${e.id}`);
    if (e.tags && e.tags.length) console.log(`     Tags: ${e.tags.join(', ')}`);
    console.log();
  }
}

async function getEntry(opts) {
  if (!opts.id) { console.error('Error: --id <uuid> required'); process.exit(1); }
  
  const entries = await supabaseRequest(`bjs_knowledge?id=eq.${opts.id}`, 'GET');
  
  if (!entries || entries.length === 0) {
    console.error(`Entry not found: ${opts.id}`);
    process.exit(1);
  }
  
  const e = entries[0];
  
  if (opts.json) {
    console.log(JSON.stringify(e, null, 2));
    return;
  }
  
  console.log(`\n📄 ${e.title}`);
  console.log(`Category: ${e.category}`);
  console.log(`Created by: ${e.created_by} | ${new Date(e.created_at).toLocaleString()} | v${e.version}`);
  if (e.tags && e.tags.length) console.log(`Tags: ${e.tags.join(', ')}`);
  console.log(`\n${e.content}\n`);
}

function showHelp() {
  console.log(`
bjs-knowledge-search — Query the BJS Knowledge Base

SEMANTIC SEARCH:
  node bjs-knowledge-search.cjs "your question here"
  node bjs-knowledge-search.cjs "error fix" --category tool-guide
  node bjs-knowledge-search.cjs "refund process" --limit 3

BROWSE:
  node bjs-knowledge-search.cjs --browse
  node bjs-knowledge-search.cjs --browse --category procedure

GET SPECIFIC ENTRY:
  node bjs-knowledge-search.cjs --id <uuid>

OPTIONS:
  --category <cat>   Filter by category
  --limit <n>        Max results (default: 5)
  --json             Output as JSON
  --compact          Compact format (for agent context injection)

CATEGORIES:
  procedure, best-practice, template, skill-doc, escalation, tool-guide
  `);
}

// --- Main ---

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_KEY in .env');
    process.exit(1);
  }
  
  const opts = parseArgs();
  
  switch (opts.action) {
    case 'browse': return browse(opts);
    case 'get': return getEntry(opts);
    case 'help': return showHelp();
    default: return semanticSearch(opts);
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
