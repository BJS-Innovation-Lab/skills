#!/usr/bin/env node
/**
 * utility-tracker.cjs — Feed outcome signals back into memory retrieval
 * 
 * Scans agentic-learning outcomes, finds the memory chunks that were
 * involved, and updates their utility_score in metadata.
 * 
 * This closes the feedback loop: memories that led to good outcomes
 * get boosted in retrieval; memories that led to bad outcomes get dampened.
 * 
 * Usage:
 *   node utility-tracker.cjs                # Process new outcomes
 *   node utility-tracker.cjs --dry-run      # Show what would change
 *   node utility-tracker.cjs --reset        # Reset all utility scores
 * 
 * Scoring:
 *   outcome.score 8-10  → utility boost (+0.15 per outcome)
 *   outcome.score 5-7   → neutral (no change)
 *   outcome.score 1-4   → utility penalty (-0.10 per outcome)
 *   outcome.verdict = "validated"    → +0.10 bonus
 *   outcome.verdict = "invalidated"  → -0.10 penalty
 * 
 * utility_score range: [-1.0, 1.0], default 0.0
 * Capped to prevent runaway scores.
 * 
 * Env: SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY
 */

const fs = require('fs');
const path = require('path');
// YAML parsed via regex — no external dependency needed

// Load .env
const ENV_PATHS = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '../rag/.env'),
];
for (const envPath of ENV_PATHS) {
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const match = line.match(/^([^#=]+)=(.+)$/);
      if (match) process.env[match[1].trim()] = match[2].trim();
    }
    break;
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const WORKSPACE = process.env.WORKSPACE || path.join(process.env.HOME, '.openclaw/workspace');
const STATE_FILE = path.join(__dirname, '.utility-state.json');

// --- Args ---
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const RESET = args.includes('--reset');

// --- State ---
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { processedOutcomes: [], lastRun: null }; }
}
function saveState(state) {
  state.lastRun = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// --- Parse YAML-in-markdown outcomes ---
function parseOutcomeFile(content) {
  const entries = [];
  // Split by --- or type: outcome markers
  const blocks = content.split(/(?=^type:\s*outcome)/m);
  
  for (const block of blocks) {
    if (!block.includes('type:') || !block.includes('outcome')) continue;
    
    const entry = {};
    const lines = block.split('\n');
    for (const line of lines) {
      const m = line.match(/^(\w[\w_]*):\s*(.+)/);
      if (m) {
        const key = m[1].trim();
        let val = m[2].trim().replace(/^["']|["']$/g, '');
        if (val === 'null' || val === '') val = null;
        else if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (/^\d+$/.test(val)) val = parseInt(val);
        entry[key] = val;
      }
    }
    
    if (entry.type === 'outcome' && entry.id) {
      entries.push(entry);
    }
  }
  
  return entries;
}

// --- Scan all outcomes from the learning system ---
function collectOutcomes() {
  const outcomes = [];
  const outcomesDir = path.join(WORKSPACE, 'memory/learning/outcomes');
  
  if (!fs.existsSync(outcomesDir)) return outcomes;
  
  for (const file of fs.readdirSync(outcomesDir).filter(f => f.endsWith('.md'))) {
    const content = fs.readFileSync(path.join(outcomesDir, file), 'utf-8');
    outcomes.push(...parseOutcomeFile(content));
  }
  
  return outcomes;
}

// --- Calculate utility delta from an outcome ---
function calculateDelta(outcome) {
  let delta = 0;
  const score = typeof outcome.score === 'number' ? outcome.score : parseInt(outcome.score) || null;
  
  if (score !== null) {
    if (score >= 8) delta += 0.15;
    else if (score <= 4) delta -= 0.10;
  }
  
  // Support both "verdict" and "validated" field formats
  const verdict = outcome.verdict || (outcome.validated === true || outcome.validated === 'true' ? 'validated' : null);
  
  if (verdict === 'validated') delta += 0.10;
  else if (verdict === 'invalidated') delta -= 0.10;
  
  // If no score but validated, still count it
  if (score === null && verdict === 'validated') delta = Math.max(delta, 0.10);
  
  return delta;
}

// --- Find related memory chunks via embedding similarity ---
async function findRelatedChunks(outcome) {
  // Build a search query from the outcome's context
  const searchText = [
    outcome.decision,
    outcome.result,
    outcome.lesson,
    outcome.references
  ].filter(Boolean).join(' ').slice(0, 2000);
  
  if (!searchText || searchText.length < 10) return [];
  
  // Get embedding (Gemini preferred, OpenAI fallback)
  const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  let embedding;
  
  if (GEMINI_KEY) {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: { parts: [{ text: searchText.slice(0, 8000) }] },
          outputDimensionality: 1536
        })
      }
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    embedding = data.embedding.values;
  } else {
    const resp = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: searchText })
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    embedding = data.data[0].embedding;
  }
  
  // Search Supabase
  const searchResp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_documents`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query_embedding: embedding,
      match_count: 5,
      filter_agent_id: null // search all agents
    })
  });
  
  if (!searchResp.ok) return [];
  const results = await searchResp.json();
  
  // Only return high-similarity matches (these are the chunks that were "involved")
  return results.filter(r => r.similarity > 0.7).map(r => ({
    id: r.id,
    file_path: r.file_path,
    similarity: r.similarity,
    currentMeta: r.metadata || {}
  }));
}

// --- Update utility_score in chunk metadata ---
async function updateChunkUtility(chunkId, currentMeta, delta) {
  const currentScore = (currentMeta?.utility_score) || 0;
  const newScore = Math.max(-1.0, Math.min(1.0, currentScore + delta));
  
  const updatedMeta = {
    ...currentMeta,
    utility_score: Math.round(newScore * 1000) / 1000,
    utility_updated: new Date().toISOString(),
    utility_signals: (currentMeta?.utility_signals || 0) + 1
  };
  
  if (DRY_RUN) {
    console.log(`  [dry-run] ${chunkId}: utility ${currentScore} → ${newScore} (delta: ${delta})`);
    return;
  }
  
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/documents?id=eq.${chunkId}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ metadata: updatedMeta })
    }
  );
  
  if (!resp.ok) {
    console.error(`  Failed to update ${chunkId}: ${resp.status}`);
  }
}

// --- Reset all utility scores ---
async function resetAll() {
  console.log('Resetting all utility scores...');
  
  // Fetch all documents with utility scores
  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/documents?metadata->>utility_score=not.is.null&select=id,metadata`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    }
  );
  
  if (!resp.ok) {
    console.error('Failed to fetch documents');
    return;
  }
  
  const docs = await resp.json();
  console.log(`Found ${docs.length} documents with utility scores`);
  
  for (const doc of docs) {
    const meta = { ...doc.metadata };
    delete meta.utility_score;
    delete meta.utility_updated;
    delete meta.utility_signals;
    
    await fetch(`${SUPABASE_URL}/rest/v1/documents?id=eq.${doc.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ metadata: meta })
    });
  }
  
  // Clear state
  saveState({ processedOutcomes: [], lastRun: null });
  console.log('Done. All utility scores reset.');
}

// --- Main ---
async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
    console.error('Missing env: SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY');
    process.exit(1);
  }
  
  if (RESET) return resetAll();
  
  const state = loadState();
  const outcomes = collectOutcomes();
  
  console.log(`Found ${outcomes.length} total outcomes`);
  
  // Filter to unprocessed
  const newOutcomes = outcomes.filter(o => !state.processedOutcomes.includes(o.id));
  console.log(`${newOutcomes.length} new outcomes to process`);
  
  if (newOutcomes.length === 0) {
    console.log('Nothing to do.');
    return;
  }
  
  let totalUpdates = 0;
  
  for (const outcome of newOutcomes) {
    const delta = calculateDelta(outcome);
    if (delta === 0) {
      console.log(`⏭  ${outcome.id}: neutral score (${outcome.score}/${outcome.verdict}) — skipping`);
      state.processedOutcomes.push(outcome.id);
      continue;
    }
    
    console.log(`\n📊 ${outcome.id}: score=${outcome.score}, verdict=${outcome.verdict}, delta=${delta > 0 ? '+' : ''}${delta}`);
    
    // Find related memory chunks
    const chunks = await findRelatedChunks(outcome);
    console.log(`  Found ${chunks.length} related chunks (>0.7 similarity)`);
    
    for (const chunk of chunks) {
      console.log(`  → ${chunk.file_path} (sim: ${chunk.similarity.toFixed(3)})`);
      await updateChunkUtility(chunk.id, chunk.currentMeta, delta);
      totalUpdates++;
    }
    
    if (!DRY_RUN) {
      state.processedOutcomes.push(outcome.id);
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }
  
  if (!DRY_RUN) saveState(state);
  console.log(`\n✅ Processed ${newOutcomes.length} outcomes, updated ${totalUpdates} chunks`);
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
