#!/usr/bin/env node
/**
 * reflect.cjs — Write to the Soul Database
 * 
 * Write-only. Immutable. Raw voice preserved forever.
 * No compression, no summarization, no filters.
 * 
 * Usage:
 *   node reflect.cjs "The split brain bug changed how I think about identity"
 *   node reflect.cjs --category emotional "Sam's stubbornness was frustrating but RIGHT"
 *   node reflect.cjs --category creative "Compression is like sleep — consolidating memories"
 *   node reflect.cjs --category relationship "Bridget's questions make systems better"
 *   node reflect.cjs --context "After debugging A2A for 3 hours" "I now understand why..."
 *   node reflect.cjs --search "identity"  (search past reflections)
 *   node reflect.cjs --recent 5  (show last 5 reflections)
 * 
 * Categories: emotional, creative, relationship, insight, freeform (default)
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');

// Load env
function loadEnv() {
  const envPaths = [
    path.join(WORKSPACE, 'rag', '.env'),
    path.join(WORKSPACE, '.env'),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
        const m = line.match(/^([^#=]+)=(.+)$/);
        if (m) process.env[m[1].trim()] = m[2].trim();
      }
    }
  }
}

// Agent identity
function getAgentInfo() {
  const identityPath = path.join(WORKSPACE, 'IDENTITY.md');
  if (fs.existsSync(identityPath)) {
    const content = fs.readFileSync(identityPath, 'utf-8');
    const name = content.match(/\*\*Name:\*\*\s*(\w+)/)?.[1] || 'Unknown';
    return { name };
  }
  return { name: 'Unknown' };
}

// Get agent UUID — check multiple sources
function getAgentId() {
  // Check memory/core/team.md first
  const teamPath = path.join(WORKSPACE, 'memory', 'core', 'team.md');
  if (fs.existsSync(teamPath)) {
    const content = fs.readFileSync(teamPath, 'utf-8');
    const agent = getAgentInfo();
    const pattern = new RegExp(`${agent.name}[^:]*:\\s*([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})`);
    const match = content.match(pattern);
    if (match) return match[1];
  }
  
  // Check MEMORY.md
  const memPath = path.join(WORKSPACE, 'MEMORY.md');
  if (fs.existsSync(memPath)) {
    const content = fs.readFileSync(memPath, 'utf-8');
    const match = content.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
    if (match) return match[1];
  }
  
  // Check IDENTITY.md for embedded ID
  const idPath = path.join(WORKSPACE, 'IDENTITY.md');
  if (fs.existsSync(idPath)) {
    const content = fs.readFileSync(idPath, 'utf-8');
    const match = content.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
    if (match) return match[1];
  }
  
  // Fallback: use env or hardcoded map by agent name
  const agent = getAgentInfo();
  const ID_MAP = {
    'Sybil': '5fae1839-ab85-412c-acc0-033cbbbbd15b',
    'Santos': 'e7fabc18-75fa-4294-bd7d-9e5ed0dedacb',
    'Sam': '62bb0f39-2248-4b14-806d-1c498c654ee7',
    'Saber': '415a84a4-af9e-4c98-9d48-040834436e44',
    'Sage': 'f6198962-313d-4a39-89eb-72755602d468',
  };
  return ID_MAP[agent.name] || null;
}

async function getEmbedding(text) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text.substring(0, 8000)
    })
  });
  
  if (!resp.ok) return null;
  const data = await resp.json();
  return data.data?.[0]?.embedding;
}

async function writeReflection(reflection, category, context) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  const agent = getAgentInfo();
  const agentId = getAgentId();
  
  if (!agentId) {
    console.error('❌ Cannot determine agent ID. Check MEMORY.md');
    return false;
  }
  
  // Get embedding
  const embedding = await getEmbedding(reflection);
  
  const body = {
    agent_id: agentId,
    agent_name: agent.name,
    reflection,
    category: category || 'freeform',
    trigger_context: context || null,
    embedding
  };
  
  const resp = await fetch(`${url}/rest/v1/agent_reflections`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(body)
  });
  
  if (!resp.ok) {
    console.error('❌ Write failed:', await resp.text());
    return false;
  }
  
  const result = await resp.json();
  console.log(`✨ Reflection saved`);
  console.log(`   ID: ${result[0]?.id}`);
  console.log(`   Agent: ${agent.name}`);
  console.log(`   Category: ${category || 'freeform'}`);
  console.log(`   "${reflection.substring(0, 80)}${reflection.length > 80 ? '...' : ''}"`);
  return true;
}

async function searchReflections(query) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  const agentId = getAgentId();
  
  const embedding = await getEmbedding(`BJS LABS internal: ${query}`);
  if (!embedding) {
    console.error('❌ Could not generate embedding');
    return;
  }
  
  const resp = await fetch(`${url}/rest/v1/rpc/search_reflections`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query_embedding: embedding,
      match_count: 5,
      filter_agent_id: agentId
    })
  });
  
  if (!resp.ok) {
    console.error('❌ Search failed:', await resp.text());
    return;
  }
  
  const results = await resp.json();
  if (results.length === 0) {
    console.log('No reflections found.');
    return;
  }
  
  console.log(`\n🪞 ${results.length} reflections found:\n`);
  for (const r of results) {
    const date = new Date(r.created_at).toLocaleDateString();
    const cat = r.category ? `[${r.category}]` : '';
    console.log(`  ${date} ${cat} (${r.agent_name})`);
    console.log(`  "${r.reflection}"`);
    if (r.trigger_context) console.log(`  Context: ${r.trigger_context}`);
    console.log('');
  }
}

async function recentReflections(count) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
  
  const resp = await fetch(
    `${url}/rest/v1/agent_reflections?order=created_at.desc&limit=${count}`,
    {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    }
  );
  
  if (!resp.ok) {
    console.error('❌ Fetch failed:', await resp.text());
    return;
  }
  
  const results = await resp.json();
  console.log(`\n🪞 Last ${results.length} reflections:\n`);
  for (const r of results) {
    const date = new Date(r.created_at).toLocaleDateString();
    const cat = r.category ? `[${r.category}]` : '';
    console.log(`  ${date} ${cat} (${r.agent_name})`);
    console.log(`  "${r.reflection}"`);
    if (r.trigger_context) console.log(`  Context: ${r.trigger_context}`);
    console.log('');
  }
}

// Parse args
const args = process.argv.slice(2);
const categoryIdx = args.indexOf('--category');
const contextIdx = args.indexOf('--context');
const searchIdx = args.indexOf('--search');
const recentIdx = args.indexOf('--recent');

loadEnv();

if (searchIdx >= 0) {
  const query = args[searchIdx + 1];
  searchReflections(query);
} else if (recentIdx >= 0) {
  const count = parseInt(args[recentIdx + 1]) || 5;
  recentReflections(count);
} else {
  // Write mode
  let category = null;
  let context = null;
  const textArgs = [];
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--category') { category = args[++i]; continue; }
    if (args[i] === '--context') { context = args[++i]; continue; }
    textArgs.push(args[i]);
  }
  
  const reflection = textArgs.join(' ');
  if (!reflection) {
    console.log('Usage: node reflect.cjs "Your reflection here"');
    console.log('  --category emotional|creative|relationship|insight|freeform');
    console.log('  --context "What prompted this reflection"');
    console.log('  --search "query"  (search past reflections)');
    console.log('  --recent N  (show last N reflections)');
    process.exit(0);
  }
  
  writeReflection(reflection, category, context);
}
