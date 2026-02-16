#!/usr/bin/env node
/**
 * Layer 3: Relevance — Smart search based on the incoming message
 * Queries Supabase (RAG docs + BJS KB) and local files for relevant context
 * Budget: ~1400 chars
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
      return true;
    }
  }
  return false;
}

/**
 * Get embedding from OpenAI
 */
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

/**
 * Search Supabase RAG documents
 */
async function searchRAG(embedding, agentId, limit = 5) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key || !embedding) return [];
  
  const resp = await fetch(`${url}/rest/v1/rpc/search_documents`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query_embedding: embedding,
      match_count: limit,
      filter_agent_id: agentId
    })
  });
  
  if (!resp.ok) return [];
  const results = await resp.json();
  return results.map(r => ({
    source: 'rag',
    path: r.file_path,
    content: r.content?.substring(0, 300) || '',
    similarity: r.similarity
  }));
}

/**
 * Search BJS Knowledge Base
 */
async function searchKB(embedding, limit = 3) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key || !embedding) return [];
  
  const resp = await fetch(`${url}/rest/v1/rpc/search_bjs_knowledge`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query_embedding: embedding,
      match_count: limit
    })
  });
  
  if (!resp.ok) return [];
  const results = await resp.json();
  return results.map(r => ({
    source: 'kb',
    title: r.title,
    content: r.content?.substring(0, 300) || '',
    similarity: r.similarity
  }));
}

/**
 * Local file search (grep-based, fast fallback)
 */
function searchLocalFiles(query, maxResults = 3) {
  const results = [];
  const searchDirs = ['memory/core', 'memory/working', 'memory/learning/corrections', 'memory/learning/insights'];
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 3);
  
  for (const dir of searchDirs) {
    const fullDir = path.join(WORKSPACE, dir);
    if (!fs.existsSync(fullDir)) continue;
    
    const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(fullDir, file), 'utf-8').toLowerCase();
      const hits = terms.filter(t => content.includes(t)).length;
      if (hits > 0) {
        results.push({
          source: 'local',
          path: `${dir}/${file}`,
          content: fs.readFileSync(path.join(fullDir, file), 'utf-8').substring(0, 300),
          hits
        });
      }
    }
  }
  
  return results
    .sort((a, b) => b.hits - a.hits)
    .slice(0, maxResults);
}

async function extractRelevance({ message, agentId } = {}) {
  if (!message || message.length < 5) return '## Relevant Context\nNo specific query to search for.';
  
  loadEnv();
  
  const parts = ['## Relevant Context'];
  
  // Parallel: get embedding + search local files
  const embedding = await getEmbedding(`BJS LABS internal: ${message}`);
  const localResults = searchLocalFiles(message);
  
  // Search Supabase (if embedding succeeded)
  let ragResults = [];
  let kbResults = [];
  
  if (embedding) {
    [ragResults, kbResults] = await Promise.all([
      searchRAG(embedding, agentId || '5fae1839-ab85-412c-acc0-033cbbbbd15b'),
      searchKB(embedding)
    ]);
  }
  
  // Combine and deduplicate
  const allResults = [
    ...kbResults.map(r => ({ ...r, priority: 1 })),    // KB first (shared knowledge)
    ...ragResults.map(r => ({ ...r, priority: 2 })),     // RAG docs second
    ...localResults.map(r => ({ ...r, priority: 3 })),   // Local files third
  ];
  
  if (allResults.length === 0) {
    parts.push('No relevant context found in memory stores.');
  } else {
    for (const r of allResults.slice(0, 6)) {
      const label = r.source === 'kb' ? '📚 KB' : r.source === 'rag' ? '🔍 RAG' : '📁 Local';
      const title = r.title || r.path || 'untitled';
      parts.push(`**${label}:** ${title}\n${r.content}`);
    }
  }
  
  return parts.join('\n\n');
}

if (require.main === module) {
  const message = process.argv[2] || '';
  const agentId = process.argv[3] || '';
  
  extractRelevance({ message, agentId }).then(result => {
    console.log(result);
    process.stderr.write(`[layer-relevance] ${result.length} chars\n`);
  });
}

module.exports = { extractRelevance };
