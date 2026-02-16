#!/usr/bin/env node
/**
 * Supabase-integrated memory search for the Memory Retriever sub-agent.
 * 
 * Combines:
 * 1. Local file search (daily logs, working memory, learning)
 * 2. Supabase vector search (embedded documents)
 * 3. BJS Knowledge Base search (shared KB)
 * 
 * Usage:
 *   node search-supabase.cjs "what did Santos say about tokens" --sources all
 *   node search-supabase.cjs "calendar sync fix" --sources kb
 *   node search-supabase.cjs "client pricing" --sources rag,files
 *   node search-supabase.cjs "Santos role change" --sources rag --agent sybil
 * 
 * Sources:
 *   files  — Local memory files (memory/*.md, memory/core/*, etc.)
 *   rag    — Supabase document embeddings (agent-specific)
 *   kb     — BJS Knowledge Base (shared, read-only)
 *   all    — All three (default)
 * 
 * Output: JSON with results from each source, ready for sub-agent consumption.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load .env
// Try multiple .env locations
const _ws = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');
const RAG_ENV = [
  path.join(__dirname, '../../rag/.env'),
  path.join(_ws, 'rag/.env'),
  path.join(process.env.HOME, '.openclaw/workspace/rag/.env')
].find(p => fs.existsSync(p));
if (RAG_ENV) {
  for (const line of fs.readFileSync(RAG_ENV, 'utf-8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.+)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const WORKSPACE = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');

const AGENT_MAP = {
  sybil:  '5fae1839-ab85-412c-acc0-033cbbbbd15b',
  saber:  '415a84a4-af9e-4c98-9d48-040834436e44',
  sam:    '62bb0f39-2248-4b14-806d-1c498c654ee7',
  santos: 'e7fabc18-75fa-4294-bd7d-9e5ed0dedacb',
  sage:   'f6198962-313d-4a39-89eb-72755602d468'
};

// --- Args ---
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { sources: 'all', limit: 10, agent: 'sybil', days: 7 };
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--sources': opts.sources = args[++i]; break;
      case '--limit': opts.limit = parseInt(args[++i]); break;
      case '--agent': opts.agent = args[++i].toLowerCase(); break;
      case '--days': opts.days = parseInt(args[++i]); break;
      case '--json': opts.json = true; break;
      case '--threshold': opts.threshold = parseFloat(args[++i]); break;
      default:
        if (!args[i].startsWith('--')) opts.query = args[i];
    }
  }
  return opts;
}

// --- Embedding ---
async function getEmbedding(text) {
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text.slice(0, 8000) })
  });
  if (!resp.ok) throw new Error(`Embedding failed: ${resp.status}`);
  const data = await resp.json();
  return data.data[0].embedding;
}

// --- Source 1: Local Files ---
function searchLocalFiles(query, opts) {
  const results = [];
  const memDir = path.join(WORKSPACE, 'memory');
  const queryLower = query.toLowerCase();
  const terms = queryLower.split(/\s+/).filter(t => t.length > 2);
  
  // Directories to search
  const searchPaths = [
    memDir,
    path.join(memDir, 'core'),
    path.join(memDir, 'working'),
    path.join(memDir, 'learning/corrections'),
    path.join(memDir, 'learning/insights'),
    path.join(memDir, 'learning/outcomes'),
  ];
  
  // Also search MEMORY.md at workspace root
  const memoryMd = path.join(WORKSPACE, 'MEMORY.md');
  if (fs.existsSync(memoryMd)) {
    const content = fs.readFileSync(memoryMd, 'utf-8');
    const matchCount = terms.filter(t => content.toLowerCase().includes(t)).length;
    if (matchCount > 0) {
      results.push({
        source: 'file',
        path: 'MEMORY.md',
        relevance: matchCount / terms.length,
        snippet: extractSnippet(content, terms),
        size: content.length
      });
    }
  }
  
  for (const dir of searchPaths) {
    if (!fs.existsSync(dir)) continue;
    
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    
    // Sort by date (newest first) for daily logs
    files.sort().reverse();
    
    // Limit to recent files based on --days
    const cutoff = new Date(Date.now() - opts.days * 86400000).toISOString().split('T')[0];
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      // Skip old daily files
      const dateMatch = file.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch && dateMatch[1] < cutoff) continue;
      
      const content = fs.readFileSync(filePath, 'utf-8');
      const matchCount = terms.filter(t => content.toLowerCase().includes(t)).length;
      
      if (matchCount > 0) {
        const relPath = path.relative(WORKSPACE, filePath);
        results.push({
          source: 'file',
          path: relPath,
          relevance: matchCount / terms.length,
          snippet: extractSnippet(content, terms),
          modified: stat.mtime.toISOString(),
          size: content.length
        });
      }
    }
  }
  
  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance);
  return results.slice(0, opts.limit);
}

function extractSnippet(content, terms, maxLen = 300) {
  const lines = content.split('\n');
  const matches = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    const hitCount = terms.filter(t => line.includes(t)).length;
    if (hitCount > 0) {
      // Get surrounding context (1 line before, 2 after)
      const start = Math.max(0, i - 1);
      const end = Math.min(lines.length, i + 3);
      const snippet = lines.slice(start, end).join('\n').slice(0, maxLen);
      matches.push({ lineNum: i + 1, hitCount, snippet });
    }
  }
  
  // Return best match
  matches.sort((a, b) => b.hitCount - a.hitCount);
  if (matches.length === 0) return content.slice(0, maxLen);
  return `[line ${matches[0].lineNum}] ${matches[0].snippet}`;
}

// --- Two-Phase Retrieval ---
// Phase 1: Broad semantic search (top 20)
// Phase 2: Re-rank by utility_score + recency + tier priority
//
// Based on MemRL (arXiv 2601.03192) insight: similarity ≠ utility.
// Memories that led to good outcomes get boosted; stale low-value ones get dampened.

const TIER_WEIGHTS = { core: 0.15, working: 0.05, learning: 0.10, research: 0.0 };
const RECENCY_HALF_LIFE_DAYS = 14; // after 14 days, recency bonus halves

function computeFinalScore(result) {
  const sim = result.similarity || 0;
  const meta = result.metadata || {};
  
  // Utility signal from outcome feedback loop (range: -1.0 to 1.0)
  const utility = (meta.utility_score || 0) * 0.20;
  
  // Tier bonus (core docs are more authoritative)
  const tier = meta.tier || 'working';
  const tierBonus = TIER_WEIGHTS[tier] || 0;
  
  // Recency bonus (exponential decay)
  let recencyBonus = 0;
  const syncedAt = meta.synced_at || result.created_at;
  if (syncedAt) {
    const ageMs = Date.now() - new Date(syncedAt).getTime();
    const ageDays = ageMs / 86400000;
    recencyBonus = 0.10 * Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS);
  }
  
  return sim + utility + tierBonus + recencyBonus;
}

// --- Source 2: Supabase RAG (Agent Documents) ---
async function searchRAG(query, embedding, opts) {
  const agentId = AGENT_MAP[opts.agent] || opts.agent;
  const threshold = opts.threshold || 0.65;
  
  // Phase 1: Broad retrieval (fetch more than needed)
  const broadCount = Math.max(opts.limit * 3, 20);
  
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_documents`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query_embedding: embedding,
      match_count: broadCount,
      filter_agent_id: agentId
    })
  });
  
  if (!resp.ok) {
    const err = await resp.text();
    return [{ source: 'rag', error: `RAG search failed: ${resp.status} ${err.slice(0, 200)}` }];
  }
  
  const data = await resp.json();
  
  // Phase 2: Re-rank with utility + recency + tier
  const scored = data.map(d => {
    const finalScore = computeFinalScore(d);
    return {
      source: 'rag',
      path: d.file_path,
      title: d.title,
      similarity: d.similarity,
      finalScore: Math.round(finalScore * 1000) / 1000,
      utilityScore: d.metadata?.utility_score || 0,
      tier: d.metadata?.tier || 'unknown',
      snippet: d.content?.slice(0, 300),
      docType: d.doc_type
    };
  });
  
  // Sort by final score (not raw similarity)
  scored.sort((a, b) => b.finalScore - a.finalScore);
  
  return scored.slice(0, opts.limit);
}

// --- Source 3: BJS Knowledge Base ---
async function searchKB(query, embedding, opts) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_bjs_knowledge`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query_embedding: embedding,
      match_count: Math.min(opts.limit, 5),
      category_filter: null
    })
  });
  
  if (!resp.ok) {
    const err = await resp.text();
    return [{ source: 'kb', error: `KB search failed: ${resp.status} ${err.slice(0, 200)}` }];
  }
  
  const data = await resp.json();
  return data.map(d => ({
    source: 'kb',
    title: d.title,
    category: d.category,
    similarity: d.similarity,
    content: d.content?.slice(0, 400),
    tags: d.tags
  }));
}

// --- Main ---
async function main() {
  const opts = parseArgs();
  
  if (!opts.query) {
    console.error('Usage: node search-supabase.cjs "your query" [--sources all|files|rag|kb] [--agent sybil] [--days 7] [--limit 10]');
    process.exit(1);
  }
  
  const sources = opts.sources === 'all' ? ['files', 'rag', 'kb'] : opts.sources.split(',');
  const output = { query: opts.query, sources: {}, meta: { agent: opts.agent, days: opts.days, timestamp: new Date().toISOString() } };
  
  // Generate embedding once (reuse for RAG + KB)
  let embedding = null;
  if ((sources.includes('rag') || sources.includes('kb')) && OPENAI_KEY && SUPABASE_URL) {
    try {
      embedding = await getEmbedding(opts.query);
    } catch (e) {
      output.meta.embeddingError = e.message;
    }
  }
  
  // Run searches in parallel
  const promises = [];
  
  if (sources.includes('files')) {
    output.sources.files = searchLocalFiles(opts.query, opts);
  }
  
  if (sources.includes('rag') && embedding) {
    promises.push(searchRAG(opts.query, embedding, opts).then(r => output.sources.rag = r));
  } else if (sources.includes('rag') && !embedding) {
    output.sources.rag = [{ source: 'rag', error: 'No embedding — OPENAI_API_KEY or SUPABASE_URL missing' }];
  }
  
  if (sources.includes('kb') && embedding) {
    promises.push(searchKB(opts.query, embedding, opts).then(r => output.sources.kb = r));
  } else if (sources.includes('kb') && !embedding) {
    output.sources.kb = [{ source: 'kb', error: 'No embedding — OPENAI_API_KEY or SUPABASE_URL missing' }];
  }
  
  await Promise.all(promises);
  
  // Count total results
  let totalResults = 0;
  for (const [src, results] of Object.entries(output.sources)) {
    if (Array.isArray(results)) totalResults += results.filter(r => !r.error).length;
  }
  output.meta.totalResults = totalResults;
  
  if (opts.json) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    // Human-readable output
    console.log(`\n🔍 Memory Search: "${opts.query}"\n`);
    console.log(`Agent: ${opts.agent} | Sources: ${sources.join(', ')} | Days: ${opts.days}\n`);
    
    if (output.sources.files?.length) {
      console.log(`📁 LOCAL FILES (${output.sources.files.length} results):`);
      for (const r of output.sources.files) {
        const pct = (r.relevance * 100).toFixed(0);
        console.log(`  ${pct}% ${r.path}`);
        console.log(`      ${r.snippet.split('\n')[0].slice(0, 120)}`);
      }
      console.log();
    }
    
    if (output.sources.rag?.length && !output.sources.rag[0]?.error) {
      console.log(`🧠 RAG EMBEDDINGS (${output.sources.rag.length} results, two-phase ranked):`);
      for (const r of output.sources.rag) {
        const sim = (r.similarity * 100).toFixed(0);
        const final = r.finalScore ? ` → ${(r.finalScore * 100).toFixed(0)}%` : '';
        const util = r.utilityScore ? ` ⚡${r.utilityScore > 0 ? '+' : ''}${r.utilityScore}` : '';
        const tier = r.tier ? ` [${r.tier}]` : '';
        console.log(`  ${sim}%${final}${util}${tier} ${r.path} — ${r.title || ''}`);
        if (r.snippet) console.log(`      ${r.snippet.split('\n')[0].slice(0, 120)}`);
      }
      console.log();
    }
    
    if (output.sources.kb?.length && !output.sources.kb[0]?.error) {
      console.log(`📚 KNOWLEDGE BASE (${output.sources.kb.length} results):`);
      for (const r of output.sources.kb) {
        const pct = (r.similarity * 100).toFixed(0);
        console.log(`  ${pct}% [${r.category}] ${r.title}`);
        if (r.content) console.log(`      ${r.content.split('\n')[0].slice(0, 120)}`);
      }
      console.log();
    }
    
    // Errors
    for (const [src, results] of Object.entries(output.sources)) {
      if (Array.isArray(results) && results[0]?.error) {
        console.log(`⚠️  ${src}: ${results[0].error}`);
      }
    }
    
    console.log(`\n📊 Total: ${totalResults} results across ${sources.length} sources`);
  }
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
