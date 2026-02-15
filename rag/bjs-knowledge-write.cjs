#!/usr/bin/env node
/**
 * bjs-knowledge-write.cjs — Write entries to the BJS Knowledge Base
 * 
 * Used by HQ agents (primarily Sam/CS) to capture reusable fixes,
 * procedures, templates, and best practices for field agents.
 * 
 * Usage:
 *   node bjs-knowledge-write.cjs \
 *     --title "How to handle refund requests" \
 *     --content "When a customer asks for a refund: 1) Acknowledge. 2) Ask what went wrong. 3) Offer fix. 4) If insist, route to Johan." \
 *     --category escalation \
 *     --tags "customer-angry,refund,routing" \
 *     --created-by Sam
 * 
 *   node bjs-knowledge-write.cjs --list                    # List all entries
 *   node bjs-knowledge-write.cjs --list --category procedure  # Filter by category
 *   node bjs-knowledge-write.cjs --update <id> --content "..." # Update entry
 *   node bjs-knowledge-write.cjs --delete <id>              # Delete entry
 * 
 * Categories: procedure, best-practice, template, skill-doc, escalation, tool-guide
 * 
 * Env: SUPABASE_URL, SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY), OPENAI_API_KEY
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

const VALID_CATEGORIES = ['procedure', 'best-practice', 'template', 'skill-doc', 'escalation', 'tool-guide'];

// --- Argument Parsing ---

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--title': opts.title = args[++i]; break;
      case '--content': opts.content = args[++i]; break;
      case '--category': opts.category = args[++i]; break;
      case '--tags': opts.tags = args[++i]; break;
      case '--created-by': opts.createdBy = args[++i]; break;
      case '--list': opts.action = 'list'; break;
      case '--update': opts.action = 'update'; opts.id = args[++i]; break;
      case '--delete': opts.action = 'delete'; opts.id = args[++i]; break;
      case '--search': opts.action = 'search'; opts.query = args[++i]; break;
      case '--help': opts.action = 'help'; break;
      default:
        if (!args[i].startsWith('--')) {
          // Positional — treat as content if no flag
          if (!opts.content) opts.content = args[i];
        }
    }
  }
  
  return opts;
}

// --- Embedding ---

async function getEmbedding(text) {
  if (!OPENAI_KEY) {
    console.warn('Warning: No OPENAI_API_KEY — storing without embedding (search won\'t work)');
    return null;
  }
  
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000)
    })
  });
  
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI embedding failed: ${resp.status} ${err}`);
  }
  
  const data = await resp.json();
  return data.data[0].embedding;
}

// --- Supabase ---

async function supabaseRequest(endpoint, method, body) {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };
  
  if (method === 'POST') headers['Prefer'] = 'return=representation';
  if (method === 'PATCH') headers['Prefer'] = 'return=representation';
  
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Supabase ${method}: ${resp.status} ${err}`);
  }
  
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

// --- Actions ---

async function createEntry(opts) {
  if (!opts.title) { console.error('Error: --title required'); process.exit(1); }
  if (!opts.content) { console.error('Error: --content required'); process.exit(1); }
  if (!opts.category) { console.error('Error: --category required'); process.exit(1); }
  if (!opts.createdBy) { console.error('Error: --created-by required'); process.exit(1); }
  
  if (!VALID_CATEGORIES.includes(opts.category)) {
    console.error(`Error: Invalid category "${opts.category}". Valid: ${VALID_CATEGORIES.join(', ')}`);
    process.exit(1);
  }
  
  console.log(`Creating entry: "${opts.title}" [${opts.category}]...`);
  
  // Generate embedding from title + content
  const embeddingText = `${opts.title}\n\n${opts.content}`;
  const embedding = await getEmbedding(embeddingText);
  
  const entry = {
    title: opts.title,
    content: opts.content,
    category: opts.category,
    tags: opts.tags ? opts.tags.split(',').map(t => t.trim()) : [],
    created_by: opts.createdBy,
    embedding
  };
  
  const result = await supabaseRequest('bjs_knowledge', 'POST', entry);
  
  console.log(`✅ Created: ${result[0].id}`);
  console.log(`   Title: ${result[0].title}`);
  console.log(`   Category: ${result[0].category}`);
  console.log(`   Tags: ${(result[0].tags || []).join(', ') || 'none'}`);
  console.log(`   Created by: ${result[0].created_by}`);
  console.log(`   Embedding: ${embedding ? 'yes' : 'no (search disabled)'}`);
}

async function listEntries(opts) {
  let endpoint = 'bjs_knowledge?select=id,title,category,tags,created_by,created_at,version&order=created_at.desc';
  
  if (opts.category) {
    endpoint += `&category=eq.${opts.category}`;
  }
  
  const entries = await supabaseRequest(endpoint, 'GET');
  
  if (!entries || entries.length === 0) {
    console.log('No entries found.');
    return;
  }
  
  console.log(`\n📚 BJS Knowledge Base (${entries.length} entries)\n`);
  
  for (const e of entries) {
    const date = new Date(e.created_at).toLocaleDateString();
    const tags = (e.tags || []).join(', ');
    console.log(`  [${e.category}] ${e.title}`);
    console.log(`    ID: ${e.id} | By: ${e.created_by} | ${date} | v${e.version}`);
    if (tags) console.log(`    Tags: ${tags}`);
    console.log();
  }
}

async function updateEntry(opts) {
  if (!opts.id) { console.error('Error: --update <id> required'); process.exit(1); }
  
  const updates = {};
  if (opts.title) updates.title = opts.title;
  if (opts.content) updates.content = opts.content;
  if (opts.category) {
    if (!VALID_CATEGORIES.includes(opts.category)) {
      console.error(`Error: Invalid category. Valid: ${VALID_CATEGORIES.join(', ')}`);
      process.exit(1);
    }
    updates.category = opts.category;
  }
  if (opts.tags) updates.tags = opts.tags.split(',').map(t => t.trim());
  
  if (Object.keys(updates).length === 0) {
    console.error('Error: Provide at least one field to update (--title, --content, --category, --tags)');
    process.exit(1);
  }
  
  // Re-embed if content or title changed
  if (updates.title || updates.content) {
    // Fetch current entry to get full text
    const current = await supabaseRequest(`bjs_knowledge?id=eq.${opts.id}&select=title,content`, 'GET');
    if (!current || current.length === 0) {
      console.error(`Error: Entry ${opts.id} not found`);
      process.exit(1);
    }
    const title = updates.title || current[0].title;
    const content = updates.content || current[0].content;
    updates.embedding = await getEmbedding(`${title}\n\n${content}`);
  }
  
  updates.updated_at = new Date().toISOString();
  updates.version = undefined; // Will increment below
  
  // Increment version
  const current = await supabaseRequest(`bjs_knowledge?id=eq.${opts.id}&select=version`, 'GET');
  if (current && current.length > 0) {
    updates.version = current[0].version + 1;
  }
  
  const result = await supabaseRequest(`bjs_knowledge?id=eq.${opts.id}`, 'PATCH', updates);
  console.log(`✅ Updated: ${opts.id} (v${updates.version})`);
}

async function deleteEntry(opts) {
  if (!opts.id) { console.error('Error: --delete <id> required'); process.exit(1); }
  
  await supabaseRequest(`bjs_knowledge?id=eq.${opts.id}`, 'DELETE');
  console.log(`✅ Deleted: ${opts.id}`);
}

async function searchEntries(opts) {
  if (!opts.query) { console.error('Error: --search <query> required'); process.exit(1); }
  if (!OPENAI_KEY) { console.error('Error: OPENAI_API_KEY required for search'); process.exit(1); }
  
  console.log(`🔍 Searching: "${opts.query}"...\n`);
  
  const embedding = await getEmbedding(opts.query);
  
  const body = {
    query_embedding: embedding,
    match_count: 5,
    category_filter: opts.category || null
  };
  
  const results = await supabaseRequest('rpc/search_bjs_knowledge', 'POST', body);
  
  if (!results || results.length === 0) {
    console.log('No results found.');
    return;
  }
  
  for (const r of results) {
    const sim = (r.similarity * 100).toFixed(1);
    console.log(`  [${r.category}] ${r.title} (${sim}% match)`);
    console.log(`    ${r.content.slice(0, 200)}${r.content.length > 200 ? '...' : ''}`);
    if (r.tags && r.tags.length) console.log(`    Tags: ${r.tags.join(', ')}`);
    console.log();
  }
}

function showHelp() {
  console.log(`
bjs-knowledge-write — BJS Knowledge Base CLI

WRITE:
  node bjs-knowledge-write.cjs \\
    --title "Title" \\
    --content "Content..." \\
    --category procedure \\
    --tags "tag1,tag2" \\
    --created-by Sam

SEARCH:
  node bjs-knowledge-write.cjs --search "how to handle refunds"
  node bjs-knowledge-write.cjs --search "error fix" --category tool-guide

LIST:
  node bjs-knowledge-write.cjs --list
  node bjs-knowledge-write.cjs --list --category escalation

UPDATE:
  node bjs-knowledge-write.cjs --update <id> --content "New content..."

DELETE:
  node bjs-knowledge-write.cjs --delete <id>

CATEGORIES:
  procedure, best-practice, template, skill-doc, escalation, tool-guide
  `);
}

// --- Main ---

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY/SUPABASE_ANON_KEY in .env');
    process.exit(1);
  }
  
  const opts = parseArgs();
  
  switch (opts.action) {
    case 'list': return listEntries(opts);
    case 'update': return updateEntry(opts);
    case 'delete': return deleteEntry(opts);
    case 'search': return searchEntries(opts);
    case 'help': return showHelp();
    default: return createEntry(opts);
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
