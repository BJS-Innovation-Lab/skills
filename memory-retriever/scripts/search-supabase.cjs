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
  sam:    '62bb0f39-28f6-45a6-a3ae-cedbcbaf0bbe',
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
      case '--client': opts.clientId = args[++i].toLowerCase(); break;
      case '--user': opts.userId = args[++i]; break;
      case '--isolation': opts.isolation = args[++i]; break;
      default:
        if (!args[i].startsWith('--')) opts.query = args[i];
    }
  }
  return opts;
}

// --- Embedding (Gemini only, 768 dims) ---
const { getEmbedding, EMBEDDING_DIMS } = require('../../rag/gemini-embed.cjs');

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
    path.join(memDir, 'team'),  // team-shared memory (always included)
    path.join(memDir, 'learning/corrections'),
    path.join(memDir, 'learning/insights'),
    path.join(memDir, 'learning/outcomes'),
  ];
  
  // If client isolation active, add client-specific dirs
  if (opts.clientId) {
    searchPaths.push(path.join(memDir, 'clients', opts.clientId));
    // Also add per-user dir if user-first or strict
    if (opts.userId && opts.isolation !== 'shared') {
      const userName = opts.userName ? opts.userName.toLowerCase().replace(/\s+/g, '-') : opts.userId;
      searchPaths.push(path.join(memDir, 'clients', opts.clientId, userName));
    }
  }
  
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
  
  // Client isolation: filter out other clients' files + apply user-aware ranking
  let filtered = results;
  
  if (opts.clientId) {
    filtered = results.filter(r => {
      const p = r.path.toLowerCase();
      const clientMatch = p.match(/clients\/([^/]+)\//);
      if (!clientMatch) return true;  // shared/non-client files always visible
      return clientMatch[1] === opts.clientId;  // only this client's files
    });
    
    // User-aware ranking: boost current user's files
    if (opts.userId && opts.isolation !== 'shared') {
      const userName = opts.userName ? opts.userName.toLowerCase().replace(/\s+/g, '-') : opts.userId;
      
      filtered = filtered.map(r => {
        const p = r.path.toLowerCase();
        const isUserFile = p.includes(`/${userName}/`) || p.includes(`/${opts.userId}/`);
        
        if (opts.isolation === 'strict' && !isUserFile && p.includes('clients/')) {
          return null; // strict: block other users' files within same client
        }
        
        // user-first: boost current user's files
        if (isUserFile) {
          r.relevance = Math.min(1.0, r.relevance + 0.25);
          r.userMatch = true;
        }
        return r;
      }).filter(Boolean);
    }
  }
  
  // Sort by relevance
  filtered.sort((a, b) => b.relevance - a.relevance);
  return filtered.slice(0, opts.limit);
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

// Anti-bias parameters (per Bridget's feedback: utility scoring without these
// creates exploitation bias — same high-scoring entries dominate forever)
const UTILITY_DECAY_HALF_LIFE_DAYS = 30;  // utility scores decay over 30 days
const NOVELTY_BONUS = 0.08;               // new entries get a boost for first 7 days
const NOVELTY_WINDOW_DAYS = 7;            // how long the novelty bonus lasts
const EXPLORATION_RATE = 0.15;            // 15% of results get random boost (epsilon-greedy)

function computeFinalScore(result) {
  const sim = result.similarity || 0;
  const meta = result.metadata || {};
  
  // Utility signal from outcome feedback loop (range: -1.0 to 1.0)
  // With time decay: old utility scores fade unless reinforced by new outcomes
  let rawUtility = meta.utility_score || 0;
  const utilityUpdated = meta.utility_updated;
  if (rawUtility !== 0 && utilityUpdated) {
    const utilityAgeMs = Date.now() - new Date(utilityUpdated).getTime();
    const utilityAgeDays = utilityAgeMs / 86400000;
    const decayFactor = Math.pow(0.5, utilityAgeDays / UTILITY_DECAY_HALF_LIFE_DAYS);
    rawUtility *= decayFactor;
  }
  const utility = rawUtility * 0.20;
  
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
  
  // Novelty bonus: new entries that haven't been tested yet get a temporary boost
  // This ensures fresh learnings get a chance to prove themselves before utility scoring
  // kicks in. Entries with 0 utility signals are "untested" — give them exploration room.
  let noveltyBonus = 0;
  const utilitySignals = meta.utility_signals || 0;
  if (utilitySignals === 0 && syncedAt) {
    const ageMs = Date.now() - new Date(syncedAt).getTime();
    const ageDays = ageMs / 86400000;
    if (ageDays <= NOVELTY_WINDOW_DAYS) {
      // Linear decay over the novelty window
      noveltyBonus = NOVELTY_BONUS * (1 - ageDays / NOVELTY_WINDOW_DAYS);
    }
  }
  
  // Exploration: epsilon-greedy random boost prevents over-exploitation
  // 15% of results get a random bonus, giving lower-ranked entries a chance
  const explorationBonus = Math.random() < EXPLORATION_RATE ? 0.05 + Math.random() * 0.05 : 0;
  
  const total = sim + utility + tierBonus + recencyBonus + noveltyBonus + explorationBonus;
  return { total, _breakdown: { sim, utility, tierBonus, recencyBonus, noveltyBonus, explorationBonus } };
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
  
  let data = await resp.json();
  
  // Client isolation: filter to this client's docs + shared (no client_id)
  if (opts.clientId) {
    data = data.filter(d => {
      const docClient = d.metadata?.client_id;
      if (!docClient) return true; // shared/agent-level docs always visible
      if (docClient !== opts.clientId) return false; // other clients blocked
      
      // User-level filtering within same client
      if (opts.isolation === 'strict' && opts.userId) {
        const docUser = d.metadata?.user_id;
        return !docUser || docUser === opts.userId; // strict: only this user's docs
      }
      return true;
    });
  }
  
  // Phase 2: Re-rank with utility + recency + tier
  const scored = data.map(d => {
    const { total: finalScore, _breakdown } = computeFinalScore(d);
    return {
      source: 'rag',
      path: d.file_path,
      title: d.title,
      similarity: d.similarity,
      finalScore: Math.round(finalScore * 1000) / 1000,
      _breakdown,
      utilityScore: d.metadata?.utility_score || 0,
      tier: d.metadata?.tier || 'unknown',
      snippet: d.content?.slice(0, 300),
      docType: d.doc_type,
      clientId: d.metadata?.client_id || null
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

// --- Client Auto-Detection ---
// If a .client-map.json exists, this agent serves multiple clients.
// Auto-detect client + user from SESSION_KEY env or --client flag.
// If map exists but no client can be determined, warn (search still runs but unfiltered).
// Returns { clientId, userId, userName, isolation } on opts.
function autoDetectClient(opts) {
  if (opts.clientId) {
    opts.isolation = opts.isolation || 'shared';
    return opts.clientId;
  }
  
  const { getClientId, getUserContext, CLIENT_MAP } = require('../../rag/client-router.cjs');
  const hasClients = Object.keys(CLIENT_MAP).length > 0;
  if (!hasClients) return null; // single-client agent, no filtering needed
  
  // Try SESSION_KEY env (set by OpenClaw at runtime)
  const sessionKey = process.env.SESSION_KEY || process.env.OPENCLAW_SESSION_KEY || '';
  const ctx = getUserContext(sessionKey);
  
  if (ctx.clientId) {
    opts.clientId = ctx.clientId;
    opts.userId = ctx.userId;
    opts.userName = ctx.userName;
    opts.isolation = ctx.isolation;
    const who = ctx.userName ? ` (user: ${ctx.userName})` : '';
    console.error(`🔒 Client auto-detected: ${ctx.clientId}${who} [${ctx.isolation}]`);
    return ctx.clientId;
  }
  
  // Client map exists but we can't determine which client — warn loudly
  console.error(`⚠️  WARNING: Client map exists (${Object.keys(CLIENT_MAP).length} clients) but no client detected.`);
  console.error(`   Pass --client <name> or set SESSION_KEY to enable isolation.`);
  console.error(`   Searching ALL client data (no isolation).`);
  return null;
}

// --- Main ---
async function main() {
  const opts = parseArgs();
  
  if (!opts.query) {
    console.error('Usage: node search-supabase.cjs "your query" [--sources all|files|rag|kb] [--agent sybil] [--days 7] [--limit 10] [--client name]');
    process.exit(1);
  }
  
  // Auto-detect client if map exists
  opts.clientId = autoDetectClient(opts);
  
  const sources = opts.sources === 'all' ? ['files', 'rag', 'kb'] : opts.sources.split(',');
  const output = { query: opts.query, sources: {}, meta: { agent: opts.agent, days: opts.days, timestamp: new Date().toISOString() } };
  
  // Generate embedding once (reuse for RAG + KB)
  let embedding = null;
  const hasEmbeddingKey = OPENAI_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if ((sources.includes('rag') || sources.includes('kb')) && hasEmbeddingKey && SUPABASE_URL) {
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
    output.sources.rag = [{ source: 'rag', error: 'No embedding — need GEMINI_API_KEY (or OPENAI_API_KEY) + SUPABASE_URL' }];
  }
  
  if (sources.includes('kb') && embedding) {
    promises.push(searchKB(opts.query, embedding, opts).then(r => output.sources.kb = r));
  } else if (sources.includes('kb') && !embedding) {
    output.sources.kb = [{ source: 'kb', error: 'No embedding — need GEMINI_API_KEY (or OPENAI_API_KEY) + SUPABASE_URL' }];
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
        if (r._breakdown) {
          const b = r._breakdown;
          const parts = [];
          if (b.recencyBonus > 0.001) parts.push(`recency:+${(b.recencyBonus*100).toFixed(1)}%`);
          if (b.noveltyBonus > 0.001) parts.push(`novelty:+${(b.noveltyBonus*100).toFixed(1)}%`);
          if (b.explorationBonus > 0.001) parts.push(`epsilon:+${(b.explorationBonus*100).toFixed(1)}%`);
          if (b.utility !== 0) parts.push(`decay-util:${(b.utility*100).toFixed(1)}%`);
          if (parts.length) console.log(`      [anti-bias: ${parts.join(', ')}]`);
        }
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
