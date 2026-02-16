#!/usr/bin/env node
/**
 * sync-memory.js — Push agent memory files to Supabase with embeddings
 * 
 * Runs via cron or file watcher. Zero LLM tokens — uses OpenAI embeddings API only.
 * 
 * Usage:
 *   node sync-memory.js                    # Sync all changed files
 *   node sync-memory.js --full             # Re-sync everything
 *   node sync-memory.js --agent sybil      # Sync specific agent
 *   node sync-memory.js --watch            # Watch mode (continuous)
 * 
 * Env (via .env or .env.1password):
 *   SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Config
const WORKSPACE = process.env.WORKSPACE || '/Users/sybil/.openclaw/workspace';
const STATE_FILE = path.join(__dirname, '.sync-state.json');
const CHUNK_SIZE = 1500; // chars per chunk for embedding
const CHUNK_OVERLAP = 200;

// Agent workspaces to sync (add more agents as they come online)
const AGENT_CONFIGS = {
  sybil: {
    id: '5fae1839-ab85-412c-acc0-033cbbbbd15b',
    workspace: WORKSPACE,
    paths: [
      'MEMORY.md',
      'SOUL.md',
      'USER.md',
      'IDENTITY.md',
      'AGENTS.md',
      'PENDING.md',
      'TOOLS.md',
      'memory/',
      'research/ai-team-dynamics/',
      'projects/',
      'clients/',
    ]
  }
};

// Load env
function loadEnv() {
  const envFile = path.join(__dirname, '.env');
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^([^#=]+)=(.+)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing env: SUPABASE_URL, SUPABASE_ANON_KEY');
  process.exit(1);
}
if (!OPENAI_KEY && !process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
  console.error('Missing embedding key: need GEMINI_API_KEY (preferred) or OPENAI_API_KEY');
  process.exit(1);
}

// State management — track what's been synced
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return { files: {}, lastSync: null };
  }
}

function saveState(state) {
  state.lastSync = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function fileHash(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

// Chunking — split files into embeddable chunks
function chunkText(text, filePath) {
  const chunks = [];
  
  // For small files, keep as one chunk
  if (text.length <= CHUNK_SIZE * 1.5) {
    chunks.push({
      content: text,
      index: 0,
      total: 1
    });
    return chunks;
  }

  // Split by headers first, then by size
  const sections = text.split(/(?=^#{1,3}\s)/m);
  let currentChunk = '';
  let chunkIndex = 0;

  for (const section of sections) {
    if (currentChunk.length + section.length > CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex++,
        total: 0 // will be set after
      });
      // Overlap: keep last N chars
      currentChunk = currentChunk.slice(-CHUNK_OVERLAP) + section;
    } else {
      currentChunk += section;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunkIndex,
      total: 0
    });
  }

  // Set total
  chunks.forEach(c => c.total = chunks.length);
  return chunks;
}

// Extract client_id from file path (for multi-client agents)
// Matches: clients/{name}/*, memory/clients/{name}/*
function extractClientId(filePath) {
  const p = filePath.toLowerCase();
  const match = p.match(/(?:^|\/)clients\/([^/]+)\//);
  return match ? match[1] : null;
}

// Detect tier and category from file path
function classifyFile(filePath) {
  const p = filePath.toLowerCase();
  
  // Tier 1: Core
  if (p.includes('soul.md') || p.includes('identity.md') || p.includes('user.md')) {
    return { tier: 'core', category: 'identity', docType: 'core' };
  }
  if (p.includes('agents.md') || p.includes('tools.md')) {
    return { tier: 'core', category: 'procedure', docType: 'core' };
  }
  if (p.includes('clients/')) {
    return { tier: 'core', category: 'client', docType: 'core' };
  }
  
  // Tier 2: Working
  if (p.includes('pending.md')) {
    return { tier: 'working', category: 'commitment', docType: 'working' };
  }
  if (p.includes('projects/')) {
    return { tier: 'working', category: 'project', docType: 'working' };
  }
  
  // Tier 3: Learning
  if (p.includes('insights') || p.includes('corrections')) {
    return { tier: 'learning', category: 'insight', docType: 'learning' };
  }
  if (p.includes('incidents/')) {
    return { tier: 'learning', category: 'correction', docType: 'learning' };
  }
  if (p.includes('research/')) {
    return { tier: 'learning', category: 'insight', docType: 'research' };
  }
  
  // Default: memory files
  if (p.includes('memory.md')) {
    return { tier: 'core', category: 'memory', docType: 'memory' };
  }
  if (p.match(/memory\/\d{4}-\d{2}-\d{2}/)) {
    return { tier: 'working', category: 'daily', docType: 'memory' };
  }
  
  return { tier: 'working', category: 'general', docType: 'note' };
}

// Embedding — Gemini only (768 dims)
const { getEmbeddings, EMBEDDING_DIMS } = require('./gemini-embed.cjs');

// Supabase operations
async function supabaseRequest(endpoint, method, body) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'resolution=merge-duplicates' : undefined
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Supabase ${method} ${endpoint}: ${resp.status} ${err}`);
  }
  
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

async function deleteFileChunks(filePath, agentId) {
  // Delete existing entries for this file (handles both single and chunked)
  // Use LIKE to catch both "file.md" and "file.md [1/3]" style entries
  const encoded = encodeURIComponent(filePath);
  
  // Delete exact match
  await supabaseRequest(
    `documents?file_path=eq.${encoded}&agent_id=eq.${agentId}`,
    'DELETE'
  ).catch(() => {});
  
  // Delete chunked entries (file_path contains the base path)
  await supabaseRequest(
    `documents?file_path=like.${encodeURIComponent(filePath + ' [%')}&agent_id=eq.${agentId}`,
    'DELETE'
  ).catch(() => {});
}

async function upsertChunks(chunks) {
  if (chunks.length === 0) return;
  
  // Use unique file_path per chunk (append chunk index)
  for (const chunk of chunks) {
    const meta = chunk.metadata || {};
    if (meta.chunk_total > 1) {
      chunk.file_path = `${chunk.file_path} [${meta.chunk_index + 1}/${meta.chunk_total}]`;
    }
  }
  
  // Insert (not upsert — we deleted old ones first)
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/documents`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(chunks)
  });
  
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Supabase insert: ${resp.status} ${err}`);
  }
}

// Main sync logic
async function syncAgent(agentName, config, state, fullSync) {
  const files = [];
  
  // Collect all files to sync
  for (const p of config.paths) {
    const fullPath = path.join(config.workspace, p);
    
    if (p.endsWith('/')) {
      // Directory — recursively find .md files
      if (fs.existsSync(fullPath)) {
        const walkDir = (dir) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            const entryPath = path.join(dir, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'venv') {
              walkDir(entryPath);
            } else if (entry.isFile() && entry.name.endsWith('.md')) {
              files.push(entryPath);
            }
          }
        };
        walkDir(fullPath);
      }
    } else {
      // Single file
      if (fs.existsSync(fullPath)) {
        files.push(fullPath);
      }
    }
  }

  console.log(`[${agentName}] Found ${files.length} files to check`);
  
  let synced = 0;
  let skipped = 0;
  const allChunksToEmbed = [];
  const chunkMeta = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hash = fileHash(content);
    const relPath = path.relative(config.workspace, filePath);
    const stateKey = `${agentName}:${relPath}`;
    
    // Skip if unchanged (unless full sync)
    if (!fullSync && state.files[stateKey] === hash) {
      skipped++;
      continue;
    }
    
    // Classify the file
    const classification = classifyFile(relPath);
    
    // Chunk the content
    const chunks = chunkText(content, relPath);
    
    for (const chunk of chunks) {
      const title = `${relPath}${chunks.length > 1 ? ` [${chunk.index + 1}/${chunk.total}]` : ''}`;
      
      allChunksToEmbed.push(chunk.content);
      chunkMeta.push({
        title,
        content: chunk.content,
        doc_type: classification.docType,
        file_path: relPath,
        agent_id: config.id,
        agent_name: agentName,
        metadata: {
          tier: classification.tier,
          category: classification.category,
          chunk_index: chunk.index,
          chunk_total: chunk.total,
          hash,
          synced_at: new Date().toISOString(),
          ...(extractClientId(relPath) && { client_id: extractClientId(relPath) })
        }
      });
    }
    
    // Update state
    state.files[stateKey] = hash;
    synced++;
  }
  
  if (allChunksToEmbed.length === 0) {
    console.log(`[${agentName}] Nothing to sync (${skipped} files unchanged)`);
    return { synced: 0, skipped, chunks: 0 };
  }
  
  console.log(`[${agentName}] Embedding ${allChunksToEmbed.length} chunks from ${synced} files...`);
  
  // Get embeddings in batch
  const embeddings = await getEmbeddings(allChunksToEmbed);
  
  // Attach embeddings to chunks
  for (let i = 0; i < chunkMeta.length; i++) {
    chunkMeta[i].embedding = embeddings[i];
  }
  
  // Delete old chunks for changed files, then insert new
  const changedFiles = [...new Set(chunkMeta.map(c => c.file_path))];
  for (const fp of changedFiles) {
    await deleteFileChunks(fp, config.id);
  }
  
  // Insert in batches of 50
  for (let i = 0; i < chunkMeta.length; i += 50) {
    const batch = chunkMeta.slice(i, i + 50);
    await upsertChunks(batch);
    if (i + 50 < chunkMeta.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  
  console.log(`[${agentName}] Synced ${synced} files (${allChunksToEmbed.length} chunks). Skipped ${skipped} unchanged.`);
  return { synced, skipped, chunks: allChunksToEmbed.length };
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const fullSync = args.includes('--full');
  const watchMode = args.includes('--watch');
  const agentFilter = args.includes('--agent') ? args[args.indexOf('--agent') + 1] : null;
  
  const state = loadState();
  
  const agents = agentFilter 
    ? { [agentFilter]: AGENT_CONFIGS[agentFilter] }
    : AGENT_CONFIGS;
  
  if (agentFilter && !AGENT_CONFIGS[agentFilter]) {
    console.error(`Unknown agent: ${agentFilter}. Available: ${Object.keys(AGENT_CONFIGS).join(', ')}`);
    process.exit(1);
  }
  
  console.log(`Memory sync started at ${new Date().toISOString()}`);
  if (fullSync) console.log('Mode: FULL SYNC');
  
  let totalSynced = 0;
  let totalChunks = 0;
  
  for (const [name, config] of Object.entries(agents)) {
    try {
      const result = await syncAgent(name, config, state, fullSync);
      totalSynced += result.synced;
      totalChunks += result.chunks;
    } catch (err) {
      console.error(`[${name}] Error: ${err.message}`);
    }
  }
  
  saveState(state);
  console.log(`Done. Synced ${totalSynced} files (${totalChunks} chunks total).`);
  
  if (watchMode) {
    console.log('Watch mode: checking every 5 minutes...');
    setInterval(async () => {
      const st = loadState();
      for (const [name, config] of Object.entries(agents)) {
        try {
          await syncAgent(name, config, st, false);
        } catch (err) {
          console.error(`[${name}] Watch error: ${err.message}`);
        }
      }
      saveState(st);
    }, 5 * 60 * 1000);
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
